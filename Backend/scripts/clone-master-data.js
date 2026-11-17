const { Lab, sequelize, instrument, instrument_type, master_design_procedure, MasterListEquipment, Role, User, CalibmasterExcel } = require('../models');

// ============================================================================
// CONFIGURATION
// Please replace these with the actual Source and Target Lab IDs
// After Replace Run this Command => node scripts/clone-master-data.js
// ============================================================================
const SOURCE_LAB_ID = "1"; // e.g., "1"
const TARGET_LAB_ID = "3"; // e.g., "2"

async function runClone() {
  if (SOURCE_LAB_ID === "REPLACE_ME_WITH_OLD_LAB_ID" || TARGET_LAB_ID === "REPLACE_ME_WITH_NEW_LAB_ID") {
    console.error("ERROR: Please edit this file and set SOURCE_LAB_ID and TARGET_LAB_ID.");
    process.exit(1);
  }

  console.log(`Starting clone process from Lab ${SOURCE_LAB_ID} to Lab ${TARGET_LAB_ID}...`);


  // Verify that the Target Lab actually exists
  const targetLabExists = await Lab.findByPk(TARGET_LAB_ID);
  if (!targetLabExists) {
    console.error(`\n❌ Clone Aborted: Target Lab ${TARGET_LAB_ID} does not exist in the database!`);
    console.error(`   You deleted Lab 5. Please create a new lab in the frontend, check its new ID, and update TARGET_LAB_ID in this script.`);
    process.exit(1);
  }

  // Restrict duplication: Check if data already exists in the target lab
  const existingRecords = await instrument.count({ where: { lab_id: TARGET_LAB_ID } });
  if (existingRecords > 0) {
    console.error(`\n❌ Clone Aborted: Target Lab ${TARGET_LAB_ID} already contains data (${existingRecords} instruments found).`);
    console.error(`   To prevent data duplication, you can only clone into an empty lab.`);
    process.exit(1);
  }

  const transaction = await sequelize.transaction();

  try {
    // Maps to link cloned foreign keys
    const instrumentIdMap = {}; // old_id -> new_id
    const instrumentTypeIdMap = {}; // old_id -> new_id
    const roleIdMap = {}; // old_role_id -> new_role_id

    // ------------------------------------------------------------------------
    // 0. CLONE ROLES AND USERS
    // ------------------------------------------------------------------------
    console.log("Cloning Roles...");
    const oldRoles = await Role.findAll({
      where: { lab_id: SOURCE_LAB_ID },
      raw: true
    });

    for (const oldRole of oldRoles) {
      const oldId = oldRole.id;
      delete oldRole.id;
      oldRole.lab_id = TARGET_LAB_ID;

      const newRole = await Role.create(oldRole, { transaction });
      roleIdMap[oldId] = newRole.id;
    }
    console.log(`✅ Cloned ${oldRoles.length} Roles.`);

    console.log("Cloning Users...");
    const oldUsers = await User.findAll({
      where: { labId: SOURCE_LAB_ID },
      raw: true
    });

    for (const oldUser of oldUsers) {
      delete oldUser.id;
      oldUser.labId = TARGET_LAB_ID;

      // Update roleId to the newly cloned role
      if (oldUser.roleId && roleIdMap[oldUser.roleId]) {
        oldUser.roleId = roleIdMap[oldUser.roleId];
      } else if (oldUser.roleId) {
        console.warn(`  ⚠️ User ${oldUser.email} references a role (${oldUser.roleId}) that wasn't cloned. Keeping original or nullifying.`);
        // Assuming we keep the original, or we can nullify it.
        // It's safer to keep the original or map to null if strict
      }

      await User.create(oldUser, { transaction });
    }
    console.log(`✅ Cloned ${oldUsers.length} Users.`);

    // ------------------------------------------------------------------------
    // 1. CLONE INSTRUMENTS
    // ------------------------------------------------------------------------
    console.log("Cloning Instruments...");
    const oldInstruments = await instrument.findAll({
      where: { lab_id: SOURCE_LAB_ID },
      raw: true
    });

    for (const oldInst of oldInstruments) {
      const oldId = oldInst.instrument_id;

      // Remove primary key and lab-specific fields so they are generated fresh
      delete oldInst.instrument_id;
      oldInst.lab_id = TARGET_LAB_ID;

      const newInst = await instrument.create(oldInst, { transaction });
      instrumentIdMap[oldId] = newInst.instrument_id;
    }
    console.log(`✅ Cloned ${oldInstruments.length} Instruments.`);

    // ------------------------------------------------------------------------
    // 2. CLONE INSTRUMENT TYPES (Variants)
    // ------------------------------------------------------------------------
    console.log("Cloning Instrument Types (Variants)...");
    const oldTypes = await instrument_type.findAll({
      where: { lab_id: SOURCE_LAB_ID },
      raw: true
    });

    let clonedTypesCount = 0;
    for (const oldType of oldTypes) {
      const oldId = oldType.instrument_type_id;

      // We only clone it if its parent instrument was also cloned, 
      // or if it doesn't have an instrument_id
      if (oldType.instrument_id && !instrumentIdMap[oldType.instrument_id]) {
        console.warn(`  ⚠️ Skipping Type ID ${oldId} because its parent Instrument ID ${oldType.instrument_id} was not found in the cloned mapping.`);
        continue;
      }

      delete oldType.instrument_type_id;
      oldType.lab_id = TARGET_LAB_ID;
      if (oldType.instrument_id) {
        oldType.instrument_id = instrumentIdMap[oldType.instrument_id];
      }

      const newType = await instrument_type.create(oldType, { transaction });
      instrumentTypeIdMap[oldId] = newType.instrument_type_id;
      clonedTypesCount++;
    }
    console.log(`✅ Cloned ${clonedTypesCount} Instrument Types.`);

    // ------------------------------------------------------------------------
    // 3. CLONE MASTER DESIGN PROCEDURES
    // ------------------------------------------------------------------------
    console.log("Cloning Master Design Procedures...");
    const oldProcedures = await master_design_procedure.findAll({
      where: { lab_id: SOURCE_LAB_ID },
      raw: true
    });

    let procedureIdMap = {};
    let clonedProceduresCount = 0;
    for (const oldProc of oldProcedures) {
      const oldId = oldProc.master_design_procedure_id;

      if (oldProc.instrument_type_id && !instrumentTypeIdMap[oldProc.instrument_type_id]) {
        console.warn(`  ⚠️ Skipping Procedure ID ${oldId} because its parent Instrument Type ID ${oldProc.instrument_type_id} was not found in the cloned mapping.`);
        continue;
      }

      delete oldProc.master_design_procedure_id;
      oldProc.lab_id = TARGET_LAB_ID;
      if (oldProc.instrument_type_id) {
        oldProc.instrument_type_id = instrumentTypeIdMap[oldProc.instrument_type_id];
      }

      const newProc = await master_design_procedure.create(oldProc, { transaction });
      procedureIdMap[oldId] = newProc.master_design_procedure_id;
      clonedProceduresCount++;
    }
    console.log(`✅ Cloned ${clonedProceduresCount} Master Procedures.`);

    // ------------------------------------------------------------------------
    // 4. CLONE MASTER LIST EQUIPMENTS
    // ------------------------------------------------------------------------
    console.log("Cloning Master List Equipments...");
    const oldEquipments = await MasterListEquipment.findAll({
      where: { lab_id: SOURCE_LAB_ID },
      raw: true
    });

    for (const oldEq of oldEquipments) {
      delete oldEq.master_list_equipment_id;
      oldEq.lab_id = TARGET_LAB_ID;

      await MasterListEquipment.create(oldEq, { transaction });
    }
    console.log(`✅ Cloned ${oldEquipments.length} Master List Equipments.`);

    // ------------------------------------------------------------------------
    // 5. CLONE CALIBMASTER EXCEL
    // ------------------------------------------------------------------------
    console.log("Cloning Calibmaster Excels...");
    const oldExcels = await CalibmasterExcel.findAll({
      where: { labid: SOURCE_LAB_ID }, // Note: column is 'labid' not 'lab_id'
      raw: true
    });

    let clonedExcelsCount = 0;
    for (const oldExcel of oldExcels) {
      const oldId = oldExcel.cmeid;

      if (oldExcel.master_design_procedure_id && !procedureIdMap[oldExcel.master_design_procedure_id]) {
        console.warn(`  ⚠️ Skipping Excel ID ${oldId} because its parent Procedure ID ${oldExcel.master_design_procedure_id} was not found in the cloned mapping.`);
        continue;
      }

      delete oldExcel.cmeid;
      oldExcel.labid = TARGET_LAB_ID;
      if (oldExcel.master_design_procedure_id) {
        oldExcel.master_design_procedure_id = procedureIdMap[oldExcel.master_design_procedure_id];
      }

      await CalibmasterExcel.create(oldExcel, { transaction });
      clonedExcelsCount++;
    }
    console.log(`✅ Cloned ${clonedExcelsCount} Calibmaster Excels.`);

    await transaction.commit();
    console.log("\n🎉 Cloning completed successfully!");
    process.exit(0);

  } catch (error) {
    await transaction.rollback();
    console.error("\n❌ An error occurred. Transaction rolled back.", error);
    process.exit(1);
  }
}

runClone();
