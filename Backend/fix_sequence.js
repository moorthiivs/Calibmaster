const { srf_list, srfitem, CertificateFormat, sequelize } = require('./models');
const { Op } = require('sequelize');

async function fixSequence() {
    try {
        console.log("Starting automated batch sequence correction...");

        // =========================================================================
        // 1. CONFIGURE THE FIX HERE
        // =========================================================================
        const START_SRF_ID = 270; // The SRF ID where the sequence started
        let srfCounter = 64; // The sequence should continue from 0064
        const SRF_PREFIX = 'SAN/SRF/26/06/'; 
        
        let certCounter = 5217; // Continuing from the last cert number 5216
        const CERTIFICATE_PREFIX = 'SAN/26/06/'; 
        
        const RESET_MONTH = '06'; 
        const RESET_YEAR = '26'; 
        // =========================================================================

        const srfs = await srf_list.findAll({
            where: { srf_id: { [Op.gte]: START_SRF_ID } },
            order: [['srf_id', 'ASC']]
        });

        for (const srf of srfs) {
            const newSrfNo = SRF_PREFIX + String(srfCounter).padStart(4, '0');
            
            await srf_list.update(
                { srf_number: newSrfNo },
                { where: { srf_id: srf.srf_id } }
            );
            console.log(`[SUCCESS] SRF ${srf.srf_id} (${srf.srf_number}) updated to ${newSrfNo}`);
            srfCounter++;

            // Update all items for this SRF
            const items = await srfitem.findAll({ 
                where: { srf_id: srf.srf_id },
                order: [['srf_item_id', 'ASC']]
            });

            for (const item of items) {
                const certNo = CERTIFICATE_PREFIX + certCounter;
                await srfitem.update(
                    { certificate_no: certNo },
                    { where: { srf_item_id: item.srf_item_id } }
                );
                console.log(`[SUCCESS] Updated Item ${item.srf_item_id} to ${certNo}`);
                certCounter++;
            }
        }

        // Reset the internal running number for future certificates
        const newRunningNo = String(certCounter - 1);
        const format = await CertificateFormat.findOne({ where: { lab_id: 1 } });
        
        if (format) {
            const reqFields = [...format.required_fields];
            reqFields.forEach(f => {
                if (f.name === 'month') f.value = RESET_MONTH;
                if (f.name === 'year') f.value = RESET_YEAR;
                if (f.name === 'RunningNo') f.value = newRunningNo;
            });

            await CertificateFormat.update(
                { 
                    required_fields: reqFields, 
                    preview: `${CERTIFICATE_PREFIX}${newRunningNo}` 
                },
                { where: { lab_id: 1 } }
            );
            console.log(`[SUCCESS] Internal Counter reset to Month: ${RESET_MONTH}, Year: ${RESET_YEAR}, RunningNo: ${newRunningNo}`);
        }

        console.log("\nSequence correction completed successfully!");
    } catch (error) {
        console.error("Error correcting sequence:", error);
    } finally {
        await sequelize.close();
    }
}

fixSequence();

