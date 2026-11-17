const { CertificateFormat, sequelize } = require("../models");

const analyzeAndFixGaps = async (req, res, next) => {
  try {
    const { labId, ulr, certificate, srf, inward, isApply } = req.body;
    let changes = [];
    let currentUlrRunning = ulr && ulr.startRunningNumber ? parseInt(ulr.startRunningNumber, 10) : 0;
    let currentCertRunning = certificate && certificate.startRunningNumber ? parseInt(certificate.startRunningNumber, 10) : 0;
    
    // 1. Analyze ULR
    if (ulr && ulr.fullStartUlr && ulr.startRunningNumber) {
      const runningStr = ulr.startRunningNumber.toString().padStart(8, '0');
      const idx = ulr.fullStartUlr.indexOf(runningStr);
      
      if (idx !== -1) {
        const ulrPrefix = ulr.fullStartUlr.substring(0, idx);
        const ulrSuffix = ulr.fullStartUlr.substring(idx + runningStr.length);
        
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
              AND si.lab_id = :labId
            ORDER BY si.srf_item_id ASC
        `, { replacements: { labId } });
        
        let changedCount = 0;
        for (const item of items) {
            const newRunning = currentUlrRunning.toString().padStart(8, '0');
            const newUlr = `${ulrPrefix}${newRunning}${ulrSuffix}`;

            if (item.url_number !== newUlr) {
                changedCount++;
                changes.push({
                   type: 'ULR',
                   itemId: item.srf_item_id,
                   oldVal: item.url_number,
                   newVal: newUlr
                });

                if (isApply) {
                    await sequelize.query(
                        `UPDATE srfitems SET url_number = :newUlr WHERE srf_item_id = :id`,
                        { replacements: { newUlr, id: item.srf_item_id } }
                    );
                    if (item.master_result_table_id) {
                        await sequelize.query(
                            `UPDATE master_result_tables SET ulr_number = :newUlr WHERE master_result_table_id = :id`,
                            { replacements: { newUlr, id: item.master_result_table_id } }
                        );
                    }
                }
            }
            currentUlrRunning++;
        }
        
        if (isApply && changedCount > 0) {
            const finalRunning = (currentUlrRunning - 1).toString().padStart(8, '0');
            await sequelize.query(
                `UPDATE "ULRGenerations" SET "runningNumber" = :finalRunning WHERE lab_id = :labId AND "effectiveFlag" = 'Y'`,
                { replacements: { finalRunning, labId } }
            );
        }
      } else {
        return res.status(400).json({ message: "Could not find running number in ULR string." });
      }
    }
    
    // 2. Analyze Certificate
    if (certificate && certificate.prefix && certificate.startRunningNumber) {
        const prefix = certificate.prefix;
        
        const [items] = await sequelize.query(`
            SELECT si.srf_item_id, si.certificate_no, si.srf_id
            FROM srfitems si
            WHERE si.rstatus = 1
              AND si.certificate_no IS NOT NULL
              AND si.certificate_no != ''
              AND si.certificate_no != '-'
              AND si.certificate_no LIKE :pattern
              AND si.lab_id = :labId
            ORDER BY si.srf_item_id ASC
        `, {
            replacements: { pattern: `${prefix}%`, labId }
        });
        
        let changedCount = 0;
        for (const item of items) {
            const isOnsite = item.certificate_no.endsWith(' - OS');
            const osSuffix = isOnsite ? ' - OS' : '';

            const newCertNo = `${prefix}${currentCertRunning}${osSuffix}`;

            if (item.certificate_no !== newCertNo) {
                changedCount++;
                changes.push({
                   type: 'Certificate',
                   itemId: item.srf_item_id,
                   oldVal: item.certificate_no,
                   newVal: newCertNo
                });

                if (isApply) {
                    await sequelize.query(
                        `UPDATE srfitems SET certificate_no = :newCertNo WHERE srf_item_id = :id`,
                        { replacements: { newCertNo, id: item.srf_item_id } }
                    );
                }
            }
            currentCertRunning++;
        }
        
        if (isApply && changedCount > 0) {
            const finalRunningInt = currentCertRunning - 1;
            const finalRunning = finalRunningInt.toString().padStart(4, '0');
            const certFormat = await CertificateFormat.findOne({ where: { lab_id: labId } });
            if (certFormat) {
                let fields = certFormat.required_fields;
                if (typeof fields === 'string') fields = JSON.parse(fields);
                const updatedFields = fields.map(f => {
                    if (f.name === 'RunningNo') return { ...f, value: finalRunning };
                    return f;
                });
                // ✅ Update BOTH dedicated column AND JSON field
                await certFormat.update({ 
                    running_no: finalRunningInt,
                    required_fields: updatedFields 
                });
            }
        }
    }

    // 3. Analyze SRF
    if (srf && srf.prefix && srf.startRunningNumber) {
        const prefix = srf.prefix;
        let currentSrfRunning = parseInt(srf.startRunningNumber, 10);
        
        const [items] = await sequelize.query(`
            SELECT srf_id, srf_number
            FROM srf_lists
            WHERE rstatus = 1
              AND srf_number LIKE :pattern
              AND lab_id = :labId
            ORDER BY srf_id ASC
        `, {
            replacements: { pattern: `${prefix}%`, labId }
        });
        
        for (const item of items) {
            const newSrfNo = `${prefix}${currentSrfRunning.toString().padStart(4, '0')}`;

            if (item.srf_number !== newSrfNo) {
                changes.push({
                   type: 'SRF Number',
                   itemId: item.srf_id,
                   oldVal: item.srf_number,
                   newVal: newSrfNo
                });

                if (isApply) {
                    await sequelize.query(
                        `UPDATE srf_lists SET srf_number = :newSrfNo WHERE srf_id = :id`,
                        { replacements: { newSrfNo, id: item.srf_id } }
                    );
                }
            }
            currentSrfRunning++;
        }
    }

    // 4. Analyze Inward
    if (inward && inward.prefix && inward.startRunningNumber) {
        const prefix = inward.prefix;
        let currentInwardRunning = parseInt(inward.startRunningNumber, 10);
        
        const [items] = await sequelize.query(`
            SELECT srf_item_id, inward_no
            FROM srfitems
            WHERE rstatus = 1
              AND inward_no LIKE :pattern
              AND lab_id = :labId
            ORDER BY srf_item_id ASC
        `, {
            replacements: { pattern: `${prefix}%`, labId }
        });
        
        for (const item of items) {
            const newInwardNo = `${prefix}${currentInwardRunning.toString().padStart(2, '0')}`;

            if (item.inward_no !== newInwardNo) {
                changes.push({
                   type: 'Inward Number',
                   itemId: item.srf_item_id,
                   oldVal: item.inward_no,
                   newVal: newInwardNo
                });

                if (isApply) {
                    await sequelize.query(
                        `UPDATE srfitems SET inward_no = :newInwardNo WHERE srf_item_id = :id`,
                        { replacements: { newInwardNo, id: item.srf_item_id } }
                    );
                }
            }
            currentInwardRunning++;
        }
    }
    
    res.status(200).json({
      message: isApply ? "Changes applied successfully" : "Analysis completed",
      data: changes
    });
    
  } catch (error) {
    console.error("Error analyzing gaps:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


/**
 * Renumber Sequence Feature
 * Shifts certificate numbers within a given range to start from a new expected number.
 * Supports preview (dry-run) and apply modes.
 *
 * Body: { labId, prefix, startNumber, endNumber (optional), expectedNumber, isApply }
 */
const renumberSequence = async (req, res, next) => {
  try {
    const { labId, prefix, startNumber, endNumber, expectedNumber, isApply } = req.body;

    if (!labId || !prefix || !startNumber || !expectedNumber) {
      return res.status(400).json({ message: "Missing required fields: labId, prefix, startNumber, expectedNumber" });
    }

    const startNum = parseInt(startNumber, 10);
    const expectedNum = parseInt(expectedNumber, 10);
    const endNum = endNumber ? parseInt(endNumber, 10) : null;

    if (isNaN(startNum) || isNaN(expectedNum)) {
      return res.status(400).json({ message: "startNumber and expectedNumber must be valid integers" });
    }

    const replacements = { pattern: `${prefix}%`, labId };

    const [allItems] = await sequelize.query(`
        SELECT si.srf_item_id, si.certificate_no
        FROM srfitems si
        WHERE si.rstatus = 1
          AND si.certificate_no IS NOT NULL
          AND si.certificate_no != ''
          AND si.certificate_no != '-'
          AND si.certificate_no LIKE :pattern
          AND si.lab_id = :labId
        ORDER BY si.srf_item_id ASC
    `, { replacements });

    // Filter in JS: extract the number part and check range
    const itemsInRange = allItems.filter(item => {
      const raw = item.certificate_no;
      const base = raw.endsWith(' - OS') ? raw.slice(0, -5) : raw;
      if (!base.startsWith(prefix)) return false;
      const num = parseInt(base.slice(prefix.length), 10);
      if (isNaN(num)) return false;
      if (num < startNum) return false;
      if (endNum !== null && num > endNum) return false;
      return true;
    });

    // Sort by numeric part ascending
    itemsInRange.sort((a, b) => {
      const getNum = (item) => {
        const base = item.certificate_no.endsWith(' - OS')
          ? item.certificate_no.slice(0, -5)
          : item.certificate_no;
        return parseInt(base.slice(prefix.length), 10);
      };
      return getNum(a) - getNum(b);
    });

    const offset = expectedNum - startNum;

    const changes = itemsInRange.map(item => {
      const isOnsite = item.certificate_no.endsWith(' - OS');
      const osSuffix = isOnsite ? ' - OS' : '';
      const base = isOnsite ? item.certificate_no.slice(0, -5) : item.certificate_no;
      const currentNum = parseInt(base.slice(prefix.length), 10);
      const newNum = currentNum + offset;
      const newCertNo = `${prefix}${newNum}${osSuffix}`;
      return {
        type: 'Certificate',
        itemId: item.srf_item_id,
        oldVal: item.certificate_no,
        newVal: newCertNo,
        changed: item.certificate_no !== newCertNo
      };
    }).filter(c => c.changed);

    if (isApply) {
      for (const change of changes) {
        await sequelize.query(
          `UPDATE srfitems SET certificate_no = :newCertNo WHERE srf_item_id = :id AND lab_id = :labId`,
          { replacements: { newCertNo: change.newVal, id: change.itemId, labId } }
        );
      }

      // Update running_no in CertificateFormat to the last renumbered value
      if (changes.length > 0) {
        const lastChange = changes[changes.length - 1];
        const lastBase = lastChange.newVal.endsWith(' - OS')
          ? lastChange.newVal.slice(0, -5)
          : lastChange.newVal;
        const lastNum = parseInt(lastBase.slice(prefix.length), 10);

        const certFormat = await CertificateFormat.findOne({ where: { lab_id: labId } });
        if (certFormat) {
          let fields = certFormat.required_fields;
          if (typeof fields === 'string') fields = JSON.parse(fields);
          const updatedFields = fields.map(f => {
            if (f.name === 'RunningNo') return { ...f, value: lastNum.toString().padStart(4, '0') };
            return f;
          });
          await certFormat.update({
            running_no: lastNum,
            required_fields: updatedFields
          });
        }
      }

      return res.status(200).json({
        message: `Successfully renumbered ${changes.length} certificate(s).`,
        applied: changes.length,
        data: changes
      });
    }

    // Dry-run preview
    return res.status(200).json({
      message: `Preview: ${changes.length} certificate(s) will be renumbered.`,
      totalInRange: itemsInRange.length,
      willChange: changes.length,
      offset,
      data: changes
    });

  } catch (error) {
    console.error("Error in renumberSequence:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


const createFormat = async (req, res, next) => {
  try {
    const { labId, formatTemplate, requiredFields, preview } = req.body;

    if (!labId || !formatTemplate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingRecord = await CertificateFormat.findOne({
      where: { lab_id: labId },
    });

    let record;
    let created = false;

    if (existingRecord) {
      // ✅ Preserve RunningNo/month/year from existing data — prevent frontend overwrite
      let incomingFields = requiredFields || [];
      let existingFields = existingRecord.required_fields;
      if (typeof existingFields === 'string') existingFields = JSON.parse(existingFields);

      const protectedKeys = ['RunningNo', 'month', 'year'];
      const protectedValues = {};
      if (Array.isArray(existingFields)) {
        existingFields.forEach(f => {
          if (protectedKeys.includes(f.name)) protectedValues[f.name] = f.value;
        });
      }

      // Merge: use incoming values for all fields EXCEPT protected ones
      const mergedFields = incomingFields.map(f => {
        if (protectedValues[f.name] !== undefined) {
          return { ...f, value: protectedValues[f.name] };
        }
        return f;
      });

      // Update existing record, preserving format_no AND running_no columns
      record = await existingRecord.update({
        format_template: formatTemplate,
        required_fields: mergedFields,
        preview,
      });
    } else {
      // Create new record with default format_no
      record = await CertificateFormat.create({
        lab_id: labId,
        format_template: formatTemplate,
        required_fields: requiredFields || [],
        preview,
        format_no: {}, // Required JSON field
      });
      created = true;
    }

    res.status(200).json({
      message: created ? "Created successfully" : "Updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("Error saving certificate format:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchoneFormat = async (req, res, next) => {
  try {
    const format = await CertificateFormat.findOne({
      where: { lab_id: req.params.labId },
    });

    if (!format) {
      return res.status(404).json({ message: "Format not found" });
    }

    res.json(format);
  } catch (error) {
    res.status(500).json({ message: "Error fetching format" });
  }
};


const formatNoConfig = async (req, res, next) => {
  try {
    const { labId, certificateFormatNo, observationFormatNo, sequenceResetMode } = req.body;

    if (!labId || !certificateFormatNo || !observationFormatNo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const formatNoData = {
      certificate_format_no: certificateFormatNo,
      observation_format_no: observationFormatNo,
      sequence_reset_mode: sequenceResetMode || "auto",
    };

    // Check if record already exists
    const existingRecord = await CertificateFormat.findOne({
      where: { lab_id: labId },
    });

    let result;

    if (existingRecord) {
      // ✅ Update only if record exists
      await existingRecord.update({ format_no: formatNoData });
      result = existingRecord;
    } else {
      // ✅ Insert new with default values
      result = await CertificateFormat.create({
        lab_id: labId,
        format_template: "{}", // provide empty JSON or default value
        required_fields: [],
        preview: "",
        format_no: formatNoData,
      });
    }

    res.status(200).json({
      message: existingRecord
        ? "Format number configuration updated successfully."
        : "Format number configuration created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in formatNoConfig:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.createFormat = createFormat;
exports.fetchoneFormat = fetchoneFormat;
exports.formatNoConfig = formatNoConfig;
exports.analyzeAndFixGaps = analyzeAndFixGaps;
exports.renumberSequence = renumberSequence;
