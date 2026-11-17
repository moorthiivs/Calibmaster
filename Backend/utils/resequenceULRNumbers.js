const { srfitem: Item, ULRGeneration: ULRSetup, master_result_table: MasterTable } = require("../models");
const { Op } = require("sequelize");

/**
 * Re-sequence ULR numbers for a lab after a lab type change.
 * 
 * Logic rule:
 *  - Items before `startSrfItemId` (srf_item_id < startSrfItemId) are NEVER touched.
 *  - The running sequence counter continues from the ULR number of the last NABL item before `startSrfItemId`.
 *    (e.g., if the item before startSrfItemId had ULR ending in 37132, the next NABL item gets 37133).
 *  - Items from `startSrfItemId` onwards (srf_item_id >= startSrfItemId) are re-sequenced sequentially.
 *  - NON-NABL/SERVICE items in the target range have their ULR set to null.
 *
 * @param {number|string} labId - The lab ID.
 * @param {number|string} [startSrfItemId=null] - The item ID from which re-sequencing should begin.
 * @returns {Object} { updatedCount, totalNablItems, affectedItems[] }
 */
const resequenceULRNumbers = async (labId, startSrfItemId = null) => {
    if (!labId) {
        throw new Error("labId is required for ULR re-sequencing");
    }

    console.log(`[ULR-RESEQUENCE] Starting re-sequence for lab_id=${labId}, startSrfItemId=${startSrfItemId || 'all'}`);

    // ── 1. Get the active ULR configuration ──────────────────────────────
    const ulrConfig = await ULRSetup.findOne({
        where: { lab_id: labId, effectiveFlag: 'Y' },
        order: [['ulr_generation_id', 'DESC']]
    });

    if (!ulrConfig) {
        console.warn(`[ULR-RESEQUENCE] No active ULR config found for lab_id=${labId}. Skipping.`);
        return { updatedCount: 0, totalNablItems: 0, affectedItems: [] };
    }

    const ulrPrefix = `${ulrConfig.accreditationNumber}${ulrConfig.currentYear}${ulrConfig.location}`;
    const ulrSuffix = ulrConfig.accreditedScope || '';

    // ── 2. Clean up: Clear ULR from NON-NABL/SERVICE items in affected range ─
    const cleanupWhere = {
        lab_id: labId,
        rstatus: 1,
        labtype: { [Op.in]: ['NON-NABL', 'SERVICE'] },
        url_number: { [Op.not]: null, [Op.ne]: '' }
    };
    if (startSrfItemId) {
        cleanupWhere.srf_item_id = { [Op.gte]: startSrfItemId };
    }
    await Item.update({ url_number: null }, { where: cleanupWhere });

    // ── 3. Extract baseline running number from last NABL item BEFORE startSrfItemId ─
    let startRunningNumber = 0;
    if (startSrfItemId) {
        const lastNablBefore = await Item.findOne({
            attributes: ['srf_item_id', 'url_number'],
            where: {
                lab_id: labId,
                rstatus: 1,
                labtype: 'NABL',
                srf_item_id: { [Op.lt]: startSrfItemId },
                url_number: { [Op.not]: null, [Op.ne]: '' }
            },
            order: [['srf_item_id', 'DESC']]
        });

        if (lastNablBefore && lastNablBefore.url_number) {
            let raw = lastNablBefore.url_number;
            if (ulrPrefix && raw.startsWith(ulrPrefix)) {
                raw = raw.slice(ulrPrefix.length);
            }
            if (ulrSuffix && raw.endsWith(ulrSuffix)) {
                raw = raw.slice(0, -ulrSuffix.length);
            }
            startRunningNumber = parseInt(raw, 10) || 0;
        }
    }

    // ── 4. Query NABL items from startSrfItemId onwards ───────────────────
    const nablWhere = {
        lab_id: labId,
        rstatus: 1,
        labtype: 'NABL'
    };
    if (startSrfItemId) {
        nablWhere.srf_item_id = { [Op.gte]: startSrfItemId };
    }

    const nablItems = await Item.findAll({
        attributes: ['srf_item_id', 'url_number', 'labtype'],
        where: nablWhere,
        include: [{
            model: MasterTable,
            as: 'master_result_table',
            attributes: ['master_result_table_id', 'ulr_number']
        }],
        order: [['srf_item_id', 'ASC']]
    });

    if (nablItems.length === 0 && startRunningNumber === 0) {
        await ulrConfig.update({ runningNumber: '00000000' });
        console.log(`[ULR-RESEQUENCE] No NABL items found. Counter reset to 00000000.`);
        return { updatedCount: 0, totalNablItems: 0, affectedItems: [] };
    }

    // ── 5. Re-assign sequential ULR numbers starting from startRunningNumber + 1 ─
    let updatedCount = 0;
    let lastAssignedNumber = startRunningNumber;
    const affectedItems = [];

    for (let i = 0; i < nablItems.length; i++) {
        const item = nablItems[i];
        const runningNum = startRunningNumber + i + 1;
        lastAssignedNumber = runningNum;
        const newRunningNumber = runningNum.toString().padStart(8, '0');
        const newUlr = `${ulrPrefix}${newRunningNumber}${ulrSuffix}`;

        // Only update if the ULR actually changed
        if (item.url_number !== newUlr) {
            updatedCount++;

            affectedItems.push({
                srf_item_id: item.srf_item_id,
                oldUlr: item.url_number || '(none)',
                newUlr: newUlr
            });

            // Update srfitems.url_number
            await Item.update(
                { url_number: newUlr },
                { where: { srf_item_id: item.srf_item_id } }
            );

            // Update master_result_tables.ulr_number if a result entry exists
            if (item.master_result_table) {
                await MasterTable.update(
                    { ulr_number: newUlr },
                    { where: { master_result_table_id: item.master_result_table.master_result_table_id } }
                );
            }
        }
    }

    // ── 6. Update the ULR running counter to final last assigned number ──
    const finalRunningNumber = lastAssignedNumber.toString().padStart(8, '0');
    await ulrConfig.update({
        runningNumber: finalRunningNumber
    });

    console.log(
        `[ULR-RESEQUENCE] Complete for lab_id=${labId} | ` +
        `Baseline start running number: ${startRunningNumber} | ` +
        `Processed NABL items: ${nablItems.length} | ` +
        `Items updated: ${updatedCount} | ` +
        `Final running counter: ${finalRunningNumber}`
    );

    for (const change of affectedItems) {
        console.log(`[ULR-RESEQUENCE]   srf_item_id=${change.srf_item_id}: ${change.oldUlr} → ${change.newUlr}`);
    }

    return {
        updatedCount,
        totalNablItems: nablItems.length,
        affectedItems
    };
};

module.exports = { resequenceULRNumbers };
