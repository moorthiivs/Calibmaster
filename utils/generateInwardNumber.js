const { Op } = require("sequelize");

// function getInstrumentCode(name) {
//     if (!name || typeof name !== 'string') return 'UNK';

//     const cleaned = name.trim();
//     if (cleaned.length <= 3) return cleaned.toUpperCase();

//     const words = cleaned.split(/[\s\/\-]+/);
//     let code = words.map(w => w[0].toUpperCase()).join('');

//     if (!code || code.length < 2) code = cleaned.slice(0, 3).toUpperCase();

//     return code.substring(0, 3);
// }

function getInstrumentCode(name) {
    if (!name || typeof name !== 'string') return 'UNK';

    const cleaned = name.trim();
    const words = cleaned.split(/[\s\/\-]+/);

    let code;
    if (words.length === 1) {
        code = words[0].substring(0, 2).toUpperCase(); // e.g., "Microhite" → "MH"
    } else {
        code = words.map(w => w[0]?.toUpperCase() || '').join('');
    }

    if (!code || code.length < 2) {
        return cleaned.slice(0, 3).toUpperCase();
    }

    return code.slice(0, 3);
}


const generateInwardNumber = async (inwardDate, instrumentName, model, labId = null) => {

    console.log(instrumentName, "instrumentName");

    const dateObj = new Date(inwardDate);
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);

    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

    const whereClause = {
        created_timestamp: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay,
        }
    };
    if (labId !== null) whereClause.lab_id = labId;

    const count = await model.count({ where: whereClause });
    const serial = String(count + 1).padStart(2, '0');

    const code = getInstrumentCode(instrumentName);
    const prefix = 'IW';

    return `${prefix}${code}${dd}${mm}${yy}${serial}`;
};

module.exports = generateInwardNumber;
