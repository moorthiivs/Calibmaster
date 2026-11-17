const { Op } = require("sequelize");
const { CertificateFormat, sequelize, Sequelize } = require("../models");
const Customer = require("../models").customer;

function injectDynamicDateFields(requiredFields, customDate = new Date()) {
    const now = customDate;
    const fullYear = now.getFullYear();
    const shortYear = fullYear.toString().slice(-2);
    const prevYear = fullYear - 1;
    const prevShort = prevYear.toString().slice(-2);
    const nextYear = fullYear + 1;
    const nextShort = nextYear.toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");

    const existingYearRange = requiredFields.find((f) => f.name === "yearRange")?.value || "";
    let newYearRange;

    if (/^\d{2}-\d{2}$/.test(existingYearRange)) {
        newYearRange = `${prevShort}-${shortYear}`;
    } else {
        newYearRange = `${prevYear}-${fullYear}`;
    }

    const dynamicFields = {
        month,
        year: shortYear,
        yearRange: newYearRange,
    };

    return requiredFields.map((field) =>
        dynamicFields[field.name]
            ? { ...field, value: dynamicFields[field.name] }
            : field
    );
}

function generateCertificateNumber(template, data) {
    return template.replace(/{{(.*?)}}/g, (_, key) => {
        return data[key] ?? `{{${key}}}`;
    });
}

const isValid = (value) =>
    typeof value === "string" &&
    value.trim() !== "" &&
    !["[null]", "null", "undefined"].includes(value.trim());

async function generateAndAssignCertificateNo({ item, srf, itemCount, Item, labId }) {

    console.log(labId, "labId");

    // ✅ Skip if item already has a valid certificate number (prevents re-consumption on re-approval)
    const calibrationAt = item?.calibrationAt || 'Lab';

    if (isValid(item?.certificate_no)) {
        console.log(`[CERT-AUDIT] Reusing existing certificate_no=${item.certificate_no} for srf_item_id=${item.srf_item_id}`);
        return item.certificate_no;
    }

    // Use a SERIALIZABLE transaction with row-level lock to prevent race conditions
    const t = await sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });

    try {
        const Certformat = await CertificateFormat.findOne({
            where: { lab_id: labId },
            lock: t.LOCK.UPDATE,
            transaction: t
        });

        if (!Certformat) {
            await t.rollback();
            throw new Error("Certificate Number format not found");
        }

        let now = new Date();
        const srfDate = item?.srf?.srf_date || srf?.srf_date;
        if (Certformat.format_no && Certformat.format_no.sequence_reset_mode === "srf_date" && srfDate) {
            now = new Date(srfDate);
        }

        const year = now.getFullYear();
        const shortYear = year.toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, "0");

        // ✅ 1. Read dedicated running_no columns (source of truth)
        const storedRunningNo = Certformat.running_no || 0;
        const storedMonth = Certformat.running_no_month || "00";
        const storedYear = Certformat.running_no_year || "00";

        // ✅ 2. Inject date fields for template rendering
        const updatedRequiredFields = injectDynamicDateFields(Certformat.required_fields, now);
        const baseData = {};
        updatedRequiredFields.forEach(f => baseData[f.name] = f.value);

        // ✅ 3. Determine next running number
        let currentRunningNo;

        if (storedMonth === month && storedYear === shortYear) {
            // Same period: simple increment from the dedicated column
            currentRunningNo = storedRunningNo + 1;
        } else {
            // Different period (new month or backdated SRF):
            // Query DB for the MAX running number in the TARGET period
            const likePattern = Certformat.format_template.replace(/{{(.*?)}}/g, (_, key) => {
                if (key === 'RunningNo') return '%';
                return baseData[key] !== undefined ? baseData[key] : '%';
            });

            // Build regex to extract RunningNo from certificate strings
            let regexStr = '^' + Certformat.format_template.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const extractedKeys = [];
            regexStr = regexStr.replace(/\\\{\\\{(.*?)\\\}\\\}/g, (_, key) => {
                extractedKeys.push(key);
                if (key === 'RunningNo') return '(\\d+)';
                return '([a-zA-Z0-9\\-\\s]+)';
            });
            const extractRegex = new RegExp(regexStr);
            const runningNoKeyIndex = extractedKeys.indexOf('RunningNo');

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
                raw: true,
                transaction: t
            });

            let maxRunningNo = 0;
            for (const mi of matchingItems) {
                const cleanCert = mi.certificate_no.replace(/\s*-\s*OS$/i, '');
                const regMatch = cleanCert.match(extractRegex);
                if (regMatch && runningNoKeyIndex !== -1) {
                    const num = parseInt(regMatch[runningNoKeyIndex + 1], 10);
                    if (!isNaN(num) && num > maxRunningNo) {
                        maxRunningNo = num;
                    }
                } else {
                    // Fallback: extract last sequence of digits
                    const fallbackMatch = cleanCert.match(/(\d+)\s*$/);
                    if (fallbackMatch) {
                        const num = parseInt(fallbackMatch[1], 10);
                        if (!isNaN(num) && num > maxRunningNo) {
                            maxRunningNo = num;
                        }
                    }
                }
            }

            currentRunningNo = maxRunningNo + 1;
        }

        const paddedRunningNo = currentRunningNo.toString().padStart(4, "0");
        baseData.RunningNo = paddedRunningNo;

        const updateField = (key, value) => {
            const field = updatedRequiredFields.find(f => f.name === key);
            if (field) field.value = value;
            else updatedRequiredFields.push({ name: key, value });
        };

        updateField("RunningNo", paddedRunningNo);
        updateField("month", month);
        updateField("year", shortYear);

        // ✅ 4. Handle optional monthCustomer serial
        const needsMonthCustomer =
            Certformat.format_template.includes("{{monthCustomer}}") ||
            updatedRequiredFields.some(f => f.name === "monthCustomer");

        if (needsMonthCustomer) {
            const customerId = item?.srf?.customer_id || srf?.customer_id;
            let monthCustomer = "01";

            if (customerId) {
                const startOfMonth = new Date(`${year}-${month}-01`);
                const endOfMonth = new Date(`${year}-${month}-31`);
                const existingCount = await Customer.count({
                    where: {
                        customer_id: customerId,
                        created_timestamp: {
                            [Op.between]: [startOfMonth, endOfMonth],
                        },
                    },
                    transaction: t
                });

                monthCustomer = String(existingCount + 1).padStart(2, "0");
            }

            baseData.monthCustomer = monthCustomer;
            updateField("monthCustomer", monthCustomer);
        }

        // ✅ 5. Generate certificate number
        let certificate_number = generateCertificateNumber(Certformat.format_template, baseData) || "-";

        if (calibrationAt.toLowerCase() === "onsite") {
            certificate_number += " - OS";
        }

        // ✅ 6. Update CertificateFormat: dedicated columns + JSON (backward compat)
        await CertificateFormat.update(
            {
                running_no: currentRunningNo,
                running_no_month: month,
                running_no_year: shortYear,
                required_fields: updatedRequiredFields,
                preview: certificate_number,
            },
            { where: { lab_id: Certformat.lab_id }, transaction: t }
        );

        // ✅ 7. Save certificate number to Item (within transaction)
        await Item.update(
            { certificate_no: certificate_number },
            { where: { srf_item_id: item.srf_item_id }, transaction: t }
        );

        await t.commit();

        console.log(`[CERT-AUDIT] Generated certificate_no=${certificate_number} | lab_id=${labId} | srf_item_id=${item.srf_item_id} | RunningNo=${paddedRunningNo} | running_no=${currentRunningNo}`);

        return certificate_number;
    } catch (error) {
        await t.rollback();
        console.log(error);
        throw error;
    }
}


module.exports = generateAndAssignCertificateNo;
