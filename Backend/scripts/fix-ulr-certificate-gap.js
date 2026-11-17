/**
 * ============================================================
 *  DATA CORRECTION SCRIPT: Fix ULR & Certificate Number Gaps
 * ============================================================
 * 
 * This script reassigns ULR numbers and Certificate numbers
 * in sequential order for all active (rstatus=1) items,
 * starting from user-specified values.
 * 
 * USAGE:
 *   DRY RUN (see what would change):
 *     node scripts/fix-ulr-certificate-gap.js
 * 
 *   APPLY CHANGES:
 *     node scripts/fix-ulr-certificate-gap.js --apply
 * 
 * CONFIGURATION:
 *   Edit the START_CONFIG section below to set your starting
 *   ULR number and Certificate number.
 * ============================================================
 */

require('dotenv').config();
const path = require('path');

// ──────────────────────────────────────────────────────────
//  ★ START_CONFIG — Edit these values before running ★
// ──────────────────────────────────────────────────────────

const START_CONFIG = {
    // ULR Number Configuration
    // Example: CC-239926000034627F
    //   prefix = "CC-"
    //   accreditationNumber = "2399"
    //   year = "26"  
    //   location = "000"
    //   startRunningNumber = 34627 (the 8-digit running number portion)
    //   scope = "F"
    ulr: {
        // The full ULR prefix before the 8-digit running number
        // For CC-239926000034627F: prefix is "CC-23992600" and suffix is "F"
        fullStartUlr: "CC-239926000034627F",
        // The running number to start from (inclusive)
        startRunningNumber: 34627,
    },

    // Certificate/Report Number Configuration  
    // Example: SAN/26/06/3940
    //   prefix = "SAN/26/06/"
    //   startRunningNumber = 3940
    certificate: {
        // The full prefix before the running number
        prefix: "SAN/26/06/",
        // The running number to start from (inclusive)
        startRunningNumber: 3938,
    },

    // Lab ID to fix (set this to your lab's ID)
    labId: null, // Will auto-detect if null
};

// ──────────────────────────────────────────────────────────

const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect || 'postgres',
    logging: false,
});

const isApply = process.argv.includes('--apply');

async function main() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.\n');

        if (!isApply) {
            console.log('══════════════════════════════════════════════');
            console.log('  🔍 DRY RUN MODE — No changes will be made');
            console.log('  Run with --apply flag to apply changes');
            console.log('══════════════════════════════════════════════\n');
        } else {
            console.log('══════════════════════════════════════════════');
            console.log('  ⚡ APPLY MODE — Changes WILL be written!');
            console.log('══════════════════════════════════════════════\n');
        }

        // ──────────────────────────────────────────
        // 1. Fix ULR Numbers
        // ──────────────────────────────────────────
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  STEP 1: Fix ULR Numbers');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await fixUlrNumbers();

        // ──────────────────────────────────────────
        // 2. Fix Certificate Numbers
        // ──────────────────────────────────────────
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  STEP 2: Fix Certificate/Report Numbers');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await fixCertificateNumbers();

        console.log('\n══════════════════════════════════════════════');
        if (isApply) {
            console.log('  ✅ ALL CHANGES APPLIED SUCCESSFULLY');
        } else {
            console.log('  ✅ DRY RUN COMPLETE — Run with --apply to commit');
        }
        console.log('══════════════════════════════════════════════\n');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
}

async function fixUlrNumbers() {
    const { fullStartUlr, startRunningNumber } = START_CONFIG.ulr;

    // Parse the ULR structure from the start value
    // Example: CC-239926000034627F
    // The running number is 8 digits, padded with zeros
    const runningStr = startRunningNumber.toString().padStart(8, '0');
    const idx = fullStartUlr.indexOf(runningStr);

    if (idx === -1) {
        console.log('❌ Could not find running number in ULR string. Check your configuration.');
        console.log(`   Looking for "${runningStr}" in "${fullStartUlr}"`);
        return;
    }

    const ulrPrefix = fullStartUlr.substring(0, idx);
    const ulrSuffix = fullStartUlr.substring(idx + runningStr.length);

    console.log(`  ULR Prefix: "${ulrPrefix}"`);
    console.log(`  ULR Suffix: "${ulrSuffix}"`);
    console.log(`  Starting from running number: ${startRunningNumber}\n`);

    // Get all active items that have ULR numbers, ordered by srf_item_id
    const [items] = await sequelize.query(`
        SELECT si.srf_item_id, si.url_number, si.srf_id, si.labtype,
               mrt.master_result_table_id, mrt.ulr_number
        FROM srfitems si
        LEFT JOIN master_result_tables mrt 
            ON mrt.srf_item_id = si.srf_item_id
        WHERE si.rstatus = 1
          AND si.url_number IS NOT NULL
          AND si.url_number != ''
          AND si.labtype != 'NON-NABL'
        ORDER BY si.srf_item_id ASC
    `);

    console.log(`  Found ${items.length} active items with ULR numbers.\n`);

    let currentRunning = startRunningNumber;
    let changedCount = 0;
    let unchangedCount = 0;

    for (const item of items) {
        const newRunning = currentRunning.toString().padStart(8, '0');
        const newUlr = `${ulrPrefix}${newRunning}${ulrSuffix}`;

        if (item.url_number !== newUlr) {
            changedCount++;
            console.log(`  [CHANGE] Item #${item.srf_item_id}: ${item.url_number} → ${newUlr}`);

            if (isApply) {
                // Update srfitems.url_number
                await sequelize.query(
                    `UPDATE srfitems SET url_number = :newUlr WHERE srf_item_id = :id`,
                    { replacements: { newUlr, id: item.srf_item_id } }
                );

                // Update master_result_tables.ulr_number if exists
                if (item.master_result_table_id) {
                    await sequelize.query(
                        `UPDATE master_result_tables SET ulr_number = :newUlr WHERE master_result_table_id = :id`,
                        { replacements: { newUlr, id: item.master_result_table_id } }
                    );
                }
            }
        } else {
            unchangedCount++;
        }

        currentRunning++;
    }

    console.log(`\n  Summary: ${changedCount} items to change, ${unchangedCount} already correct.`);
    console.log(`  New running number counter should be: ${currentRunning - 1}`);

    // Update the ULRGeneration table running number
    if (isApply && changedCount > 0) {
        const finalRunning = (currentRunning - 1).toString().padStart(8, '0');
        const [ulrSetup] = await sequelize.query(
            `SELECT ulr_generation_id FROM "ULRGenerations" WHERE "effectiveFlag" = 'Y' LIMIT 1`
        );
        if (ulrSetup.length > 0) {
            await sequelize.query(
                `UPDATE "ULRGenerations" SET "runningNumber" = :finalRunning WHERE ulr_generation_id = :id`,
                { replacements: { finalRunning, id: ulrSetup[0].ulr_generation_id } }
            );
            console.log(`  ✅ Updated ULRGeneration running number to: ${finalRunning}`);
        }
    }
}

async function fixCertificateNumbers() {
    const { prefix, startRunningNumber } = START_CONFIG.certificate;

    console.log(`  Certificate Prefix: "${prefix}"`);
    console.log(`  Starting from running number: ${startRunningNumber}\n`);

    // Get all active items with certificate numbers matching the prefix pattern
    const [items] = await sequelize.query(`
        SELECT si.srf_item_id, si.certificate_no, si.srf_id
        FROM srfitems si
        WHERE si.rstatus = 1
          AND si.certificate_no IS NOT NULL
          AND si.certificate_no != ''
          AND si.certificate_no != '-'
          AND si.certificate_no LIKE :pattern
        ORDER BY si.srf_item_id ASC
    `, {
        replacements: { pattern: `${prefix}%` }
    });

    console.log(`  Found ${items.length} active items with certificate numbers matching "${prefix}".\n`);

    let currentRunning = startRunningNumber;
    let changedCount = 0;
    let unchangedCount = 0;

    for (const item of items) {
        // Check if this certificate has " - OS" suffix (onsite)
        const isOnsite = item.certificate_no.endsWith(' - OS');
        const osSuffix = isOnsite ? ' - OS' : '';

        const newCertNo = `${prefix}${currentRunning}${osSuffix}`;

        if (item.certificate_no !== newCertNo) {
            changedCount++;
            console.log(`  [CHANGE] Item #${item.srf_item_id}: ${item.certificate_no} → ${newCertNo}`);

            if (isApply) {
                await sequelize.query(
                    `UPDATE srfitems SET certificate_no = :newCertNo WHERE srf_item_id = :id`,
                    { replacements: { newCertNo, id: item.srf_item_id } }
                );
            }
        } else {
            unchangedCount++;
        }

        currentRunning++;
    }

    console.log(`\n  Summary: ${changedCount} items to change, ${unchangedCount} already correct.`);
    console.log(`  New running number counter should be: ${currentRunning - 1}`);

    // Update the CertificateFormat table RunningNo
    if (isApply && changedCount > 0) {
        const finalRunning = (currentRunning - 1).toString().padStart(4, '0');
        const [formats] = await sequelize.query(
            `SELECT id, required_fields FROM certificate_formats LIMIT 1`
        );
        if (formats.length > 0) {
            const fields = formats[0].required_fields;
            const updatedFields = (typeof fields === 'string' ? JSON.parse(fields) : fields).map(f => {
                if (f.name === 'RunningNo') return { ...f, value: finalRunning };
                return f;
            });

            await sequelize.query(
                `UPDATE certificate_formats SET required_fields = :fields WHERE id = :id`,
                { replacements: { fields: JSON.stringify(updatedFields), id: formats[0].id } }
            );
            console.log(`  ✅ Updated CertificateFormat RunningNo to: ${finalRunning}`);
        }
    }
}

main();
