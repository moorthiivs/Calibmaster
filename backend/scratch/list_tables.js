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
        const [results] = await sequelize.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'");
        console.log('Tables in database:', results.map(r => r.tablename));
    } catch (error) {
        console.error('Error fetching tables:', error);
    } finally {
        await sequelize.close();
    }
}

main();
