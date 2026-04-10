const { Sequelize } = require('sequelize');
const path = require('path');
const config = require(path.join(__dirname, '../config/config.json')).development;

async function main() {
    const sequelize = new Sequelize(config.database, config.username, config.password, {
        host: config.host,
        dialect: config.dialect,
        logging: false
    });

    try {
        const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'calibration_data'");
        console.log('Columns in calibration_data:', results.map(r => r.column_name));
    } catch (error) {
        console.error('Error fetching columns:', error);
    } finally {
        await sequelize.close();
    }
}

main();
