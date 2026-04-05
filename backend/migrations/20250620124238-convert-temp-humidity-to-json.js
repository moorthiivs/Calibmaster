'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = ['master_design_procedures', 'master_result_tables'];

    for (const table of tables) {
      let tableColumns = {};
      try {
        tableColumns = await queryInterface.describeTable(table);
      } catch (error) {
        console.warn(`⚠️ Skipping table ${table}: ${error.message}`);
        continue;
      }


      if(tableColumns['temperature'].type === 'JSON' && tableColumns['humidity'].type === 'JSON'){
        console.log(`✅ Skipped migrating ${table}.temperature as it is already JSON`)
        console.log(`✅ Skipped migrating ${table}.humidity as it is already JSON`);
        return
      }

      // Step 1: Add JSON columns
      if (!tableColumns['temperature_json']) {
        await queryInterface.addColumn(table, 'temperature_json', { type: Sequelize.JSON });
      }
      if (!tableColumns['humidity_json']) {
        await queryInterface.addColumn(table, 'humidity_json', { type: Sequelize.JSON });
      }

      // Step 2: Migrate temperature data
      if (tableColumns['temperature'] && tableColumns['temperature'].type !== 'JSON') {
        await queryInterface.sequelize.query(`
          UPDATE ${table}
          SET temperature_json = (
            CASE
              WHEN temperature IS NULL THEN NULL
              ELSE
                CASE
                  WHEN regexp_replace(temperature::text, '[^0-9\\.-]', '', 'g') ~ '^[0-9]+(\\.[0-9]+)?-[0-9]+(\\.[0-9]+)?$' THEN
                    json_build_object(
                      'start', split_part(regexp_replace(temperature::text, '[^0-9\\.-]', '', 'g'), '-', 1),
                      'end', split_part(regexp_replace(temperature::text, '[^0-9\\.-]', '', 'g'), '-', 2),
                      'mean', TO_CHAR((
                        CAST(split_part(regexp_replace(temperature::text, '[^0-9\\.-]', '', 'g'), '-', 1) AS NUMERIC) +
                        CAST(split_part(regexp_replace(temperature::text, '[^0-9\\.-]', '', 'g'), '-', 2) AS NUMERIC)
                      ) / 2, 'FM999999.00')
                    )
                  WHEN regexp_replace(temperature::text, '[^0-9\\.]', '', 'g') ~ '^[0-9]+(\\.[0-9]+)?$' THEN
                    json_build_object(
                      'start', regexp_replace(temperature::text, '[^0-9\\.]', '', 'g'),
                      'end', regexp_replace(temperature::text, '[^0-9\\.]', '', 'g'),
                      'mean', TO_CHAR(CAST(regexp_replace(temperature::text, '[^0-9\\.]', '', 'g') AS NUMERIC), 'FM999999.00')
                    )
                  ELSE NULL
                END
            END
          )
          WHERE temperature IS NOT NULL;
        `);
      }

      // Step 3: Migrate humidity data
      if (tableColumns['humidity'] && tableColumns['humidity'].type !== 'JSON') {
        await queryInterface.sequelize.query(`
          UPDATE ${table}
          SET humidity_json = (
            CASE
              WHEN humidity IS NULL THEN NULL
              ELSE
                CASE
                  WHEN regexp_replace(humidity::text, '[^0-9\\.-]', '', 'g') ~ '^[0-9]+(\\.[0-9]+)?-[0-9]+(\\.[0-9]+)?$' THEN
                    json_build_object(
                      'start', split_part(regexp_replace(humidity::text, '[^0-9\\.-]', '', 'g'), '-', 1),
                      'end', split_part(regexp_replace(humidity::text, '[^0-9\\.-]', '', 'g'), '-', 2),
                      'mean', TO_CHAR((
                        CAST(split_part(regexp_replace(humidity::text, '[^0-9\\.-]', '', 'g'), '-', 1) AS NUMERIC) +
                        CAST(split_part(regexp_replace(humidity::text, '[^0-9\\.-]', '', 'g'), '-', 2) AS NUMERIC)
                      ) / 2, 'FM999999.00')
                    )
                  WHEN regexp_replace(humidity::text, '[^0-9\\.]', '', 'g') ~ '^[0-9]+(\\.[0-9]+)?$' THEN
                    json_build_object(
                      'start', regexp_replace(humidity::text, '[^0-9\\.]', '', 'g'),
                      'end', regexp_replace(humidity::text, '[^0-9\\.]', '', 'g'),
                      'mean', TO_CHAR(CAST(regexp_replace(humidity::text, '[^0-9\\.]', '', 'g') AS NUMERIC), 'FM999999.00')
                    )
                  ELSE NULL
                END
            END
          )
          WHERE humidity IS NOT NULL;
        `);
      }

      // Step 4: Drop old string columns
      if (tableColumns['temperature']) {
        await queryInterface.removeColumn(table, 'temperature');
      }
      if (tableColumns['humidity']) {
        await queryInterface.removeColumn(table, 'humidity');
      }

      // Step 5: Rename JSON columns back to original names
      await queryInterface.renameColumn(table, 'temperature_json', 'temperature');
      await queryInterface.renameColumn(table, 'humidity_json', 'humidity');
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = ['master_design_procedures', 'master_result_tables'];

    for (const table of tables) {
      let tableColumns = {};
      try {
        tableColumns = await queryInterface.describeTable(table);
      } catch (error) {
        console.warn(`⚠️  Skipping table ${table} (down migration): ${error.message}`);
        continue;
      }

      // Add old columns back
      if (!tableColumns['temperature_old']) {
        await queryInterface.addColumn(table, 'temperature_old', { type: Sequelize.STRING });
      }
      if (!tableColumns['humidity_old']) {
        await queryInterface.addColumn(table, 'humidity_old', { type: Sequelize.STRING });
      }

      if (tableColumns['temperature']) {
        await queryInterface.removeColumn(table, 'temperature');
      }
      if (tableColumns['humidity']) {
        await queryInterface.removeColumn(table, 'humidity');
      }

      await queryInterface.renameColumn(table, 'temperature_old', 'temperature');
      await queryInterface.renameColumn(table, 'humidity_old', 'humidity');
    }
  }
};
