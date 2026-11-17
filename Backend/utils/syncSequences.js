const { srfitem: Item, CertificateFormat, ULRGeneration: ULRSetup, srf_list: SRF } = require("../models");
const { Op } = require("sequelize");

/**
 * Synchronize running number sequences for Certificate, ULR, and SRF after a deletion.
 *
 * ── Core Rule ──────────────────────────────────────────────────────────────
 *  counter = MAX running number among all remaining ACTIVE (rstatus=1) records
 *
 *  ✅ Middle SRF/item deleted  → Higher records still exist → MAX stays high → NO reset (skip gap)
 *  ✅ Last   SRF/item deleted  → No higher records remain   → MAX drops down → RESETS back
 *
 * Example — 3 SRFs, 5 items each:
 *  SAN/SRF/26/0001 (cert 5717–5721), SAN/SRF/26/0002 (cert 5722–5726), SAN/SRF/26/0003 (cert 5727–5731)
 *
 *  Delete middle SRF 0002 → items 5722–5726 deleted
 *    → MAX cert remaining = 5731 (from SRF 0003) → counter = 5731, NO reset ✅
 *
 *  Delete last SRF 0003 → items 5727–5731 deleted
 *    → MAX cert remaining = 5721 (from SRF 0001) → counter resets to 5721 ✅
 * ───────────────────────────────────────────────────────────────────────────
 *
 * @param {number|string} labId - The ID of the lab to synchronize sequences for.
 */
const syncSequencesForLab = async (labId) => {
    try {
        if (!labId) return;

        // ════════════════════════════════════════════════════════════════════
        // 1. Sync Certificate Running Number
        //    counter = MAX certificate running number from all active items
        // ════════════════════════════════════════════════════════════════════
        const certFormat = await CertificateFormat.findOne({ where: { lab_id: labId } });
        if (certFormat) {
            let requiredFields = certFormat.required_fields;
            if (typeof requiredFields === 'string') requiredFields = JSON.parse(requiredFields);
            const runningNoFieldIndex = requiredFields.findIndex(f => f.name === 'RunningNo');

            if (runningNoFieldIndex !== -1) {
                // Use the dedicated columns for stored month/year (source of truth)
                const storedMonth = certFormat.running_no_month || "00";
                const storedYear  = certFormat.running_no_year  || "00";

                // Build LIKE pattern from template using stored month/year values
                const fieldsMap = {};
                requiredFields.forEach(f => { fieldsMap[f.name] = f.value; });
                fieldsMap.month = storedMonth;
                fieldsMap.year  = storedYear;

                const likePattern = (certFormat.format_template || '').replace(/{{(.*?)}}/g, (_, key) => {
                    if (key === 'RunningNo') return '%';
                    return fieldsMap[key] !== undefined ? fieldsMap[key] : '%';
                });

                // Build regex to extract RunningNo from matching certificates
                let regexStr = '^' + (certFormat.format_template || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const extractedKeys = [];
                regexStr = regexStr.replace(/\\\{\\\{(.*?)\\\}\\\}/g, (_, key) => {
                    extractedKeys.push(key);
                    if (key === 'RunningNo') return '(\\d+)';
                    return '([a-zA-Z0-9\\-\\s]+)';
                });
                const extractRegex = new RegExp(regexStr);
                const runningNoKeyIndex = extractedKeys.indexOf('RunningNo');

                // Find all ACTIVE items matching this period's prefix
                const matchingItems = await Item.findAll({
                    attributes: ['certificate_no'],
                    where: {
                        lab_id: labId,
                        rstatus: 1,
                        certificate_no: {
                            [Op.and]: [
                                { [Op.ne]: null },
                                { [Op.ne]: '' },
                                { [Op.ne]: '-' },
                                { [Op.like]: likePattern }
                            ]
                        }
                    },
                    raw: true
                });

                // counter = MAX of remaining active certificate numbers
                // Middle SRF deleted → higher certs from last SRF still exist → MAX stays  → skip gap ✅
                // Last   SRF deleted → no higher certs remain                  → MAX drops  → reset    ✅
                let newRunningNo = 0;
                for (const mi of matchingItems) {
                    const cleanCert = mi.certificate_no.replace(/\s*-\s*OS$/i, '');
                    const match = cleanCert.match(extractRegex);
                    if (match && runningNoKeyIndex !== -1) {
                        const num = parseInt(match[runningNoKeyIndex + 1], 10);
                        if (!isNaN(num) && num > newRunningNo) {
                            newRunningNo = num;
                        }
                    } else {
                        // Fallback: extract last sequence of digits
                        const fallbackMatch = cleanCert.match(/(\d+)\s*$/);
                        if (fallbackMatch) {
                            const num = parseInt(fallbackMatch[1], 10);
                            if (!isNaN(num) && num > newRunningNo) {
                                newRunningNo = num;
                            }
                        }
                    }
                }

                const paddedRunningNo = newRunningNo.toString().padStart(4, '0');

                // Update JSON required_fields (backward compat)
                const updatedFields = requiredFields.map(f => {
                    if (f.name === 'RunningNo') return { ...f, value: paddedRunningNo };
                    return f;
                });

                // Generate new preview
                const previewData = {};
                updatedFields.forEach(f => { previewData[f.name] = f.value; });
                const preview = certFormat.format_template
                    ? certFormat.format_template.replace(/{{(.*?)}}/g, (_, key) => {
                        return previewData[key] ?? `{{${key}}}`;
                    }) || "-"
                    : certFormat.preview;

                // Update BOTH dedicated column AND JSON field
                await certFormat.update({
                    running_no: newRunningNo,
                    required_fields: updatedFields,
                    preview: preview
                });

                console.log(
                    `[SYNC-SEQ] Certificate RunningNo synced to ${newRunningNo} (${paddedRunningNo}) for lab ${labId}` +
                    (newRunningNo === 0 ? ' — no active certs remain, counter reset to 0' : '')
                );
            }
        }

        // ════════════════════════════════════════════════════════════════════
        // 2. Sync ULR Running Number
        //    counter = running number from the LAST active ULR item (by srf_item_id DESC)
        //    Middle item deleted → last item still has highest ULR  → no reset ✅
        //    Last   item deleted → last item now has lower ULR      → resets   ✅
        // ════════════════════════════════════════════════════════════════════
        const ulrSetup = await ULRSetup.findOne({
            where: { lab_id: labId, effectiveFlag: 'Y' },
            order: [['ulr_generation_id', 'DESC']]
        });
        if (ulrSetup) {
            const latestUlrItem = await Item.findOne({
                where: {
                    lab_id: labId,
                    rstatus: 1,
                    url_number: {
                        [Op.and]: [
                            { [Op.ne]: null },
                            { [Op.ne]: '' }
                        ]
                    }
                },
                order: [['srf_item_id', 'DESC']]
            });

            let newRunningNo = 0;
            if (latestUlrItem && latestUlrItem.url_number) {
                const prefix = `${ulrSetup.accreditationNumber}${ulrSetup.currentYear}${ulrSetup.location}`;
                const suffix = ulrSetup.accreditedScope || '';

                const escapedPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const escapedSuffix = suffix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

                const regex = new RegExp(`^${escapedPrefix}(\\d{8})${escapedSuffix}$`);
                const match = latestUlrItem.url_number.match(regex);
                if (match) {
                    newRunningNo = parseInt(match[1], 10) || 0;
                } else {
                    const fallbackMatch = latestUlrItem.url_number.match(/(\d{8})/);
                    if (fallbackMatch) {
                        newRunningNo = parseInt(fallbackMatch[1], 10) || 0;
                    }
                }
            }

            await ulrSetup.update({ runningNumber: newRunningNo.toString().padStart(8, '0') });
            console.log(`[SYNC-SEQ] ULR runningNumber updated to ${ulrSetup.runningNumber} for lab ${labId}`);
        }

        // ════════════════════════════════════════════════════════════════════
        // 3. Sync SRF Running Number — LOG ONLY
        //    The SRF counter is NOT stored separately — generateSrfNumber() in
        //    srfService.js queries the LAST active SRF live each time it runs.
        //    So no update needed here; the logic is already correct:
        //      Middle SRF deleted → last SRF still has higher number → no reset ✅
        //      Last   SRF deleted → last SRF now has lower number    → resets   ✅
        // ════════════════════════════════════════════════════════════════════
        if (SRF) {
            const lastActiveSrf = await SRF.findOne({
                where: { lab_id: labId, rstatus: 1 },
                order: [['srf_id', 'DESC']]
            });

            if (lastActiveSrf && lastActiveSrf.srf_number) {
                console.log(`[SYNC-SEQ] Last active SRF is ${lastActiveSrf.srf_number} (srf_id=${lastActiveSrf.srf_id}) for lab ${labId} — next SRF will follow from here`);
            } else {
                console.log(`[SYNC-SEQ] No active SRFs remain for lab ${labId} — next SRF will start from 0001`);
            }
        }

    } catch (error) {
        console.error("Error in syncSequencesForLab:", error);
    }
};

module.exports = {
    syncSequencesForLab
};
