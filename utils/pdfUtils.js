// const { HyperFormula } = require('hyperformula')

// /**
//  * Utility function to generate a PDF table body from sheet data.
//  * @param {Object} handsontableJson - The JSON data representing the sheet.
//  * @param {Array|Object|String} selectedSheetInput - Selected sheet as array, object, or string.
//  * @returns {Array} - The PDF table body.
//  */

// const generatePdfFromSheet = async (handsontableJson, selectedSheetInput) => {
//   try {
//     const sheetNames = Object.keys(handsontableJson)

//     // Extract selected sheet name based on input type
//     let selectedSheet
//     if (Array.isArray(selectedSheetInput)) {
//       selectedSheet = selectedSheetInput[0]?.value
//     } else if (
//       selectedSheetInput &&
//       typeof selectedSheetInput === 'object' &&
//       selectedSheetInput.value
//     ) {
//       selectedSheet = selectedSheetInput.value
//     } else {
//       selectedSheet = selectedSheetInput
//     }

//     // Fallback to first sheet if selectedSheet is invalid
//     if (!selectedSheet || !sheetNames.includes(selectedSheet)) {
//       selectedSheet = sheetNames[0]
//     }

//     // Initialize HyperFormula
//     const hfInstance = HyperFormula.buildFromSheets(handsontableJson, {
//       licenseKey: 'internal-use-in-handsontable'
//     })

//     const sheetId = hfInstance.getSheetId(selectedSheet)
//     const evaluatedData = hfInstance.getSheetValues(sheetId)

//     // Format evaluated data
//     const formattedData = evaluatedData.map(row =>
//       // row.map(cell => {
//       //   if (cell === null) return '';
//       //   if (typeof cell === 'number') {
//       //     return Number.isInteger(cell) ? cell.toString() : cell.toFixed(2);
//       //   }
//       //   return cell.toString();
//       // })

//       row.map(cell => {
//         if (cell === null) return ''
//         if (typeof cell === 'number') {
//           return cell.toString() // Preserve original precision
//         }
//         return cell.toString()
//       })
//     )

//     // Remove empty rows
//     const filteredRows = formattedData.filter(row =>
//       row.some(cell => cell.trim() !== '')
//     )

//     // Transpose to remove empty columns
//     const transpose = matrix =>
//       matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]))

//     const transposed = transpose(filteredRows)

//     const filteredColumns = transposed.filter(col =>
//       col.some(cell => cell.trim() !== '')
//     )

//     const cleanedData = transpose(filteredColumns)

//     // Build PDF table body
//     const pdfTableBody = cleanedData.map(row =>
//       row.map(cell => ({
//         text: cell,
//         alignment: 'center',
//         fontSize: 6,
//         margin: [1, 1, 1, 1]
//       }))
//     )

//     return pdfTableBody
//   } catch (error) {
//     console.error('PDF generation error:', error)
//     throw new Error('Failed to generate PDF table body')
//   }
// }

// module.exports = { generatePdfFromSheet }

const { HyperFormula } = require('hyperformula')

/**
 * Utility function to generate PDF table bodies from sheet data, splitting at empty rows.
 * @param {Object} handsontableJson - The JSON data representing the sheet.
 * @param {Array|Object|String} selectedSheetInput - Selected sheet as array, object, or string.
 * @returns {Array} - An array of PDF table bodies (split at empty rows).
 */

const generatePdfFromSheet = async (handsontableJson, selectedSheetInput) => {
  try {
    const sheetNames = Object.keys(handsontableJson)

    // Extract selected sheet name
    let selectedSheet
    if (Array.isArray(selectedSheetInput)) {
      selectedSheet = selectedSheetInput[0]?.value
    } else if (selectedSheetInput?.value) {
      selectedSheet = selectedSheetInput.value
    } else {
      selectedSheet = selectedSheetInput
    }

    // Fallback to first sheet if invalid
    if (!selectedSheet || !sheetNames.includes(selectedSheet)) {
      selectedSheet = sheetNames[0]
    }

    // Initialize HyperFormula
    const hfInstance = HyperFormula.buildFromSheets(handsontableJson, {
      licenseKey: 'internal-use-in-handsontable'
    })

    const sheetId = hfInstance.getSheetId(selectedSheet)
    const evaluatedData = hfInstance.getSheetValues(sheetId)

    // Helper function to transpose matrix
    const transpose = matrix =>
      matrix[0]?.map((_, i) => matrix.map(row => row[i])) || []

    // Format and clean data
    const formattedData = evaluatedData.map(
      row =>
        row?.map(cell => {
          if (cell == null) return ''
          return typeof cell === 'number' ? cell.toString() : cell.toString()
        }) || []
    )

    // Split into tables at empty rows
    const tables = []
    let currentTable = []

    for (const row of formattedData) {
      const isEmptyRow =
        !row || row.every(cell => cell?.toString().trim() === '')
      if (isEmptyRow) {
        if (currentTable.length > 0) {
          tables.push(currentTable)
          currentTable = []
        }
      } else {
        currentTable.push(row)
      }
    }
    if (currentTable.length > 0) tables.push(currentTable)

    // Process each table to remove empty columns
    const processedTables = tables
      .map(table => {
        if (!table.length) return []

        // Transpose to work with columns
        const transposed = transpose(table)

        // Filter out empty columns
        const filteredColumns = transposed.filter(column =>
          column.some(cell => cell?.toString().trim() !== '')
        )

        // Transpose back to original format
        return transpose(filteredColumns)
      })
      .filter(table => table.length > 0) // Remove any empty tables

    // Convert to PDF format
    return processedTables.map(table =>
      table.map(row =>
        row.map(cell => ({
          text: cell?.toString() || '',
          alignment: 'center',
          fontSize: 6,
          margin: [1, 1, 1, 1]
        }))
      )
    )
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF table body')
  }
}

const generatePdfTables = async (handsontableJson, selectedSheetInput) => {
  try {
    const tables = await generatePdfFromSheet(
      handsontableJson,
      selectedSheetInput
    )
    const formattedTables = []
    const maxRowsPerTable = 12 

    tables.forEach((tableData, index) => {
      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        return
      }

      const columnCount = tableData[0] ? tableData[0].length : 1;


      const columnWidths = Array(columnCount).fill(columnCount > 8 ? 'auto' : '*');

      const tableDefinition = {
        style: 'ninethTable',
        margin: [0, index % 2 === 1 ? 10 : 0, 0, 2],
        table: {
          headerRows: 1,
          widths: columnWidths,
          body: tableData
        },
        layout: {
          //fillColor: rowIndex => (rowIndex === 0 ? '#CCCCCC' : null),
          hLineColor: () => '#AAA',
          vLineColor: () => '#AAA',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 2,
          paddingBottom: () => 2
        }
      }


      if (index % 2 === 1) {

        if (tables[index - 1]?.length > maxRowsPerTable) {
          tableDefinition.pageBreak = 'before'
        }
      } else if (index % 2 === 0 && index > 0) {
        // Normal case: apply break after every two tables
        tableDefinition.pageBreak = 'before'
      }

      formattedTables.push(tableDefinition)
    })

    return formattedTables
  } catch (error) {
    console.error('Error in PDF table generation:', error)
    return []
  }
}

module.exports = { generatePdfFromSheet, generatePdfTables }
