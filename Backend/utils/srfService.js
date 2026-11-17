// const { Op } = require("sequelize");
// const { srf_list } = require("../models");

// /**
//  * Generate SRF number in format: SAN/SRF/YY/MM/XXXX
//  * @param {string} companyName - Full company name (e.g. "SANSERA")
//  * @returns {Promise<string>} - New SRF number
//  */
// async function generateSrfNumber(companyName) {
//     try {
//         const prefix = companyName.substring(0, 3).toUpperCase(); // SAN
//         const now = new Date();

//         const year = now.getFullYear().toString().slice(-2); // e.g., 25
//         const month = String(now.getMonth() + 1).padStart(2, "0"); // e.g., 10

//         const pattern = `${prefix}/SRF/${year}/${month}/`;

//         // Find latest SRF record for same month & year
//         const latest = await srf_list.findOne({
//             where: {
//                 srf_number: { [Op.like]: `${pattern}%` }, // assuming `srf_number` stores the SRF number
//             },
//             order: [["srf_date", "DESC"]],
//         });

//         let nextNumber = 1;
//         if (latest && latest.srf_number) {
//             const parts = latest.srf_number.split("/");
//             const lastNumber = parseInt(parts[4], 10);
//             if (!isNaN(lastNumber)) {
//                 nextNumber = lastNumber + 1;
//             }
//         }

//         const runningNumber = String(nextNumber).padStart(4, "0");
//         const newSrf = `${prefix}/SRF/${year}/${month}/${runningNumber}`;

//         console.log(newSrf);

//         // Double-check to prevent duplicates (race condition)
//         const existing = await srf_list.findOne({
//             where: { srf_number: newSrf },
//         });

//         if (existing) {
//             console.warn("Duplicate SRF detected, retrying...");
//             return generateSrfNumber(companyName);
//         }

//         return newSrf;
//     } catch (error) {
//         console.log(error);
//     }

// }

// module.exports = { generateSrfNumber };


/// SRF Genrate Based On Month

const { Op, Sequelize } = require("sequelize");
const { srf_list, CertificateFormat } = require("../models");

async function generateSrfNumber(companyName, srfDateStr = null, labId = null) {
    try {
        const prefix = companyName.substring(0, 3).toUpperCase();
        let now = new Date();

        if (labId) {
            const formatConfig = await CertificateFormat.findOne({ where: { lab_id: labId } });
            if (formatConfig && formatConfig.format_no && formatConfig.format_no.sequence_reset_mode === "srf_date") {
                if (srfDateStr) {
                    now = new Date(srfDateStr);
                }
            }
        }

        const yearFull = now.getFullYear();          // 2025
        const year = yearFull.toString().slice(-2);  // 25
        const month = String(now.getMonth() + 1).padStart(2, "0");

        const pattern = `${prefix}/SRF/${year}/${month}/`;

        // Find latest active SRF record for same month & year by pattern
        const latest = await srf_list.findOne({
            where: {
                srf_number: { [Op.like]: `${pattern}%` },
                rstatus: 1
            },
            order: [["srf_id", "DESC"]],
        });

        let nextNumber = 1;

        if (latest && latest.srf_number) {
            const parts = latest.srf_number.split("/");
            const lastNumber = parseInt(parts[4], 10);
            if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
        }

        const runningNumber = String(nextNumber).padStart(4, "0");
        const newSrf = `${prefix}/SRF/${year}/${month}/${runningNumber}`;

        console.log("Generated:", newSrf);

        // Double check duplicate
        const existing = await srf_list.findOne({
            where: { srf_number: newSrf, rstatus: 1 },
        });

        if (existing) {
            console.warn("Duplicate SRF detected → Retrying…");
            return generateSrfNumber(companyName, srfDateStr, labId);
        }

        return newSrf;

    } catch (error) {
        console.error("SRF Error:", error);
    }
}

module.exports = { generateSrfNumber };

