const { HyperFormula } = require('hyperformula');

/**
 * Utility function to generate a PDF table body from sheet data.
 * @param {Object} handsontableJson - The JSON data representing the sheet.
 * @param {Array|Object|String} selectedSheetInput - Selected sheet as array, object, or string.
 * @returns {Array} - The PDF table body.
 */
const generatePdfFromSheet = async (handsontableJson, selectedSheetInput) => {
  try {
    const sheetNames = Object.keys(handsontableJson);

    // Extract selected sheet name based on input type
    let selectedSheet;
    if (Array.isArray(selectedSheetInput)) {
      selectedSheet = selectedSheetInput[0]?.value;
    } else if (selectedSheetInput && typeof selectedSheetInput === 'object' && selectedSheetInput.value) {
      selectedSheet = selectedSheetInput.value;
    } else {
      selectedSheet = selectedSheetInput;
    }

    // Fallback to first sheet if selectedSheet is invalid
    if (!selectedSheet || !sheetNames.includes(selectedSheet)) {
      selectedSheet = sheetNames[0];
    }

    // Initialize HyperFormula
    const hfInstance = HyperFormula.buildFromSheets(handsontableJson, {
      licenseKey: 'internal-use-in-handsontable'
    });

    const sheetId = hfInstance.getSheetId(selectedSheet);
    const evaluatedData = hfInstance.getSheetValues(sheetId);

    // Format evaluated data
    const formattedData = evaluatedData.map(row =>
      row.map(cell => {
        if (cell === null) return '';
        if (typeof cell === 'number') {
          return Number.isInteger(cell) ? cell.toString() : cell.toFixed(2);
        }
        return cell.toString();
      })
    );

    // Remove empty rows
    const filteredRows = formattedData.filter(row =>
      row.some(cell => cell.trim() !== '')
    );

    // Transpose to remove empty columns
    const transpose = matrix => matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));

    const transposed = transpose(filteredRows);
    
    const filteredColumns = transposed.filter(col => col.some(cell => cell.trim() !== ''));

    const cleanedData = transpose(filteredColumns);

    // Build PDF table body
    const pdfTableBody = cleanedData.map(row =>
      row.map(cell => ({
        text: cell,
        alignment: 'center',
        fontSize: 6,
        margin: [1, 1, 1, 1]
      }))
    );

    return pdfTableBody;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF table body');
  }
};

module.exports = { generatePdfFromSheet };
