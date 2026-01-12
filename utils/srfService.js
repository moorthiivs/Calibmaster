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
const { srf_list } = require("../models");

async function generateSrfNumber(companyName) {
    try {
        const prefix = companyName.substring(0, 3).toUpperCase();
        const now = new Date();

        const yearFull = now.getFullYear();          // 2025
        const year = yearFull.toString().slice(-2);  // 25
        const month = String(now.getMonth() + 1).padStart(2, "0");

        const pattern = `${prefix}/SRF/${year}/${month}/`;

        // 🔍 PostgreSQL version (EXTRACT)
        const latest = await srf_list.findOne({
            where: {
                [Op.and]: [
                    Sequelize.where(
                        Sequelize.fn("EXTRACT", Sequelize.literal(`MONTH FROM "srf_date"`)),
                        now.getMonth() + 1
                    ),
                    Sequelize.where(
                        Sequelize.fn("EXTRACT", Sequelize.literal(`YEAR FROM "srf_date"`)),
                        yearFull
                    ),
                    { srf_number: { [Op.like]: `${pattern}%` } }
                ]
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
            where: { srf_number: newSrf },
        });

        if (existing) {
            console.warn("Duplicate SRF detected → Retrying…");
            return generateSrfNumber(companyName);
        }

        return newSrf;

    } catch (error) {
        console.error("SRF Error:", error);
    }
}

module.exports = { generateSrfNumber };

