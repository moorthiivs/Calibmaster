const { Op } = require("sequelize");

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

async function generateAndAssignCertificateNo({ item, srf, format, CertificateFormat, Item, Customer }) {

    const calibrationAt = item?.calibrationAt || 'Lab'


    if (isValid(item?.certificate_no)) {
        return item.certificate_no;
    }


    const now = new Date();
    const year = now.getFullYear();
    const shortYear = year.toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");

    // ✅ 2. Clone and extract fields BEFORE overwriting them
    const originalFields = [...format.required_fields];

    const storedMonth = originalFields.find(f => f.name === "month")?.value;
    const storedYear = originalFields.find(f => f.name === "year")?.value;
    const runningNoField = originalFields.find(f => f.name === "RunningNo");
    let currentRunningNo = parseInt(runningNoField?.value || "0", 10);

    // ✅ 3. Reset RunningNo on new month or year
    if (storedMonth !== month || storedYear !== shortYear) {
        currentRunningNo = 1;
    } else {
        currentRunningNo += 1;
    }

    const paddedRunningNo = currentRunningNo.toString().padStart(4, "0");

    // ✅ 4. Now inject date fields AFTER logic check
    const updatedRequiredFields = injectDynamicDateFields(format.required_fields);
    const baseData = {};
    updatedRequiredFields.forEach(f => baseData[f.name] = f.value);
    baseData.RunningNo = paddedRunningNo;

    const updateField = (key, value) => {
        const field = updatedRequiredFields.find(f => f.name === key);
        if (field) field.value = value;
        else updatedRequiredFields.push({ name: key, value });
    };

    updateField("RunningNo", paddedRunningNo);
    updateField("month", month);
    updateField("year", shortYear);

    // ✅ 5. Handle optional monthCustomer serial
    const needsMonthCustomer =
        format.format_template.includes("{{monthCustomer}}") ||
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
            });

            monthCustomer = String(existingCount + 1).padStart(2, "0");
        }

        baseData.monthCustomer = monthCustomer;
        updateField("monthCustomer", monthCustomer);
    }

    // ✅ 6. Generate certificate number
    let certificate_number = generateCertificateNumber(format.format_template, baseData) || "-";

    if (calibrationAt.toLowerCase() === "onsite") {
        certificate_number += " - OS";
    }

    // ✅ 7. Update CertificateFormat with new fields and preview
    await CertificateFormat.update(
        {
            required_fields: updatedRequiredFields,
            preview: certificate_number,
        },
        { where: { lab_id: format.lab_id } }
    );

    // ✅ 8. Save certificate number to Item
    await Item.update(
        { certificate_no: certificate_number },
        { where: { srf_item_id: item.srf_item_id } }
    );

    return certificate_number;
}


module.exports = generateAndAssignCertificateNo;
