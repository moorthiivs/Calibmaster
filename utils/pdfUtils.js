const { HyperFormula } = require('hyperformula');

const generatePdfFromSheet = async (
  handsontableJson,
  MergedCells,
  Styles,
  selectedSheetInput
) => {
  try {
    const sheetKey =
      typeof selectedSheetInput === 'object'
        ? selectedSheetInput.value
        : selectedSheetInput;

    const sheetData = handsontableJson[sheetKey] || [];
    const mergedCells = MergedCells?.[sheetKey] || [];
    const stylesArray = Styles?.[sheetKey] || [];

    if (!sheetData.length) return [];

    const hfInstance = HyperFormula.buildFromSheets(handsontableJson, {
      licenseKey: 'gpl-v3'
    });

    const sheetId = hfInstance.getSheetId(sheetKey);
    if (sheetId === undefined) {
      throw new Error(`Sheet "${sheetKey}" not found`);
    }

    const evaluatedDatas = hfInstance.getSheetSerialized(sheetId);
    console.log(evaluatedDatas, 'Evaluated Data Without Rounding');
    const evaluatedData = hfInstance.getSheetValues(sheetId);


    const maxCols = Math.max(...evaluatedData.map(row => row.length), 0);
    const paddedData = evaluatedData.map(row => {
      const newRow = Array(maxCols).fill('');
      return row.concat(newRow.slice(row.length));
    });


    const splitTables = [];
    let currentChunk = [];
    let startRowIndexes = [];

    paddedData.forEach((row, idx) => {
      const isEmptyRow = row.every(cell => cell === '');
      if (isEmptyRow) {
        // Split the current chunk if it has data
        if (currentChunk.length) {
          splitTables.push(currentChunk);
          startRowIndexes.push(idx - currentChunk.length);
          currentChunk = [];
        }
      } else {
        // Add the row to the current chunk
        currentChunk.push(row);
      }
    });


    if (currentChunk.length) {
      splitTables.push(currentChunk);
      startRowIndexes.push(paddedData.length - currentChunk.length);
    }


    const cleanMergeDefinitions = (mergedCells, tableData, startRow, endRow, maxCols) => {
      return mergedCells
        .filter(({ row, col, rowspan, colspan }) =>
          row >= startRow &&
          col >= 0 &&
          rowspan > 0 &&
          colspan > 0 &&
          row < endRow &&
          col < maxCols &&
          row + rowspan - 1 < endRow &&
          col + colspan - 1 < maxCols
        )
        .map(({ row, col, rowspan, colspan }) => ({
          row: row - startRow,
          col,
          rowspan: Math.min(rowspan, tableData.length - (row - startRow)),
          colspan: Math.min(colspan, maxCols - col)
        }))
        .filter((cell, index, self) =>
          index === self.findIndex(c =>
            c.row === cell.row && c.col === cell.col
          )
        );
    };

    return splitTables.map((tableData, chunkIndex) => {
      const startRow = startRowIndexes[chunkIndex];
      const endRow = startRow + tableData.length;

      // Apply styles to each cell
      const tableStyles = stylesArray
        .filter(s => s.row >= startRow && s.row < endRow)
        .map(s => ({
          ...s,
          row: s.row - startRow
        }));

      const tableMergedCells = cleanMergeDefinitions(mergedCells, tableData, startRow, endRow, maxCols);

      // Ensure all cells in the table have valid objects
      const tableBody = tableData.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const style = tableStyles.find(
            s => s.row === rowIndex && s.col === colIndex
          );

          const cellStyle = {
            text: cell?.toString() ?? '', // Ensure cell is a string
            alignment: 'center', // Default alignment is "center"
            bold: false,
            color: '#000000',
            fillColor: null,
            noWrap: false
          };

          if (style) {
            if (style.fontColor) cellStyle.color = style.fontColor;
            if (style.backgroundColor) cellStyle.fillColor = style.backgroundColor;
            if (style.bold) cellStyle.bold = true;
            if (style.className?.includes('htLeft')) cellStyle.alignment = 'left';
            if (style.className?.includes('htRight')) cellStyle.alignment = 'right';
            if (style.className?.includes('htCenter')) cellStyle.alignment = 'center';
          }

          // Force alignment to center for large columns (adjust threshold as needed)
          if (cellStyle.text.length > 20 || maxCols > 10) {
            cellStyle.alignment = 'center';
          }

          return cellStyle;
        })
      );

      // Apply merged cells
      tableMergedCells.forEach(({ row, col, rowspan, colspan }) => {
        if (
          row >= 0 &&
          col >= 0 &&
          row < tableBody.length &&
          col < tableBody[row].length &&
          row + rowspan <= tableBody.length &&
          col + colspan <= tableBody[row].length
        ) {
          tableBody[row][col].rowSpan = rowspan;
          tableBody[row][col].colSpan = colspan;

          // Mark merged cells (except the first one) as empty
          for (let r = row; r < row + rowspan; r++) {
            for (let c = col; c < col + colspan; c++) {
              if (r !== row || c !== col) {
                if (tableBody[r] && tableBody[r][c]) {
                  tableBody[r][c] = {};
                }
              }
            }
          }
        }
      });

      // Skip empty columns during PDF generation
      const nonEmptyColumnIndexes = [];
      for (let colIndex = 0; colIndex < maxCols; colIndex++) {
        const isNonEmptyColumn = tableBody.some(row => row[colIndex]?.text !== '');
        if (isNonEmptyColumn) {
          nonEmptyColumnIndexes.push(colIndex);
        }
      }

      const finalTableBody = tableBody.map(row =>
        nonEmptyColumnIndexes.map(colIndex => row[colIndex])
      );



      const columnCount = nonEmptyColumnIndexes.length;
      const widths = columnCount > 10 ? Array(columnCount).fill('auto') : Array(columnCount).fill('*');

      //const widths = columnCount > 10 ? Array(columnCount).fill('4.5%') : Array(columnCount).fill('*');

      return {
        columns: [
          {
            width: "*",
            table: {
              headerRows: 1,
              widths,
              body: finalTableBody
            },
            layout: {
              hLineWidth: (i, node) => i === 0 || i === node.table.body.length ? 0.5 : 0.2,
              vLineWidth: () => 0.2,
              hLineColor: () => '#cccccc',
              vLineColor: () => '#cccccc',
              paddingLeft: () => 2,
              paddingRight: () => 2,
              paddingTop: () => 3,
              paddingBottom: () => 3
            },
            fontSize: 6,
            dontBreakRows: true,
            pageBreak: 'avoid',
            style: 'ninethTable',
            margin: columnCount > 10 ? [50, 2, 50, 5] : [0, 2, 0, 2],
          }
        ],
        columnGap: 0,
        alignment: 'center'
      };

    });
  } catch (err) {
    console.error('Error generating PDF:', err);
    return [
      {
        text: `Error generating table: ${err.message}`,
        color: 'red',
        margin: [0, 10, 0, 10]
      }
    ];
  }
};

module.exports = { generatePdfFromSheet };