export function useExcelSelection(excelState, hotRef, auth) {
  const {
    hyperFormulaInstance,
    selectedSheet,
    cellStyles,
    permissionsMap,
    setSelectedCell,
    setIsBoldActive,
    setHighlightedCells,
    decimalPrecisionMap,
  } = excelState;

  const columnIndexToLabel = (index) => {
    let label = "";
    let i = index;

    while (i >= 0) {
      label = String.fromCharCode((i % 26) + 65) + label;
      i = Math.floor(i / 26) - 1;
    }

    return label;
  };
  const handleCellSelection = (row, col) => {
    try {
      const hot = hotRef.current?.hotInstance;
      if (!hot || !hyperFormulaInstance) return;
      let cellAddress = `${columnIndexToLabel(col)}${row + 1}`;
      const mergePlugin = hot.getPlugin("mergeCells");
      const mergedCell = mergePlugin?.mergedCellsCollection?.get(row, col);

      if (mergedCell) {
        const startRow = mergedCell.row;
        const startCol = mergedCell.col;

        const endRow = startRow + mergedCell.rowspan - 1;
        const endCol = startCol + mergedCell.colspan - 1;

        const startAddress = `${columnIndexToLabel(startCol)}${startRow + 1}`;
        const endAddress = `${columnIndexToLabel(endCol)}${endRow + 1}`;

        cellAddress =
          startAddress === endAddress
            ? startAddress
            : `${startAddress}:${endAddress}`;
      }
      if (row < 0 || col < 0) {
        // Optionally reset selected cell state for header selections
        setSelectedCell(null);
        setHighlightedCells({});
        return;
      }

      // ✅ Also validate row/col are within valid bounds
      if (row >= hot.countRows() || col >= hot.countCols()) {
        return;
      }
      const cellValue = hot.getDataAtCell(row, col); // Get the value of the selected cell
      const sheetId = hyperFormulaInstance.getSheetId(selectedSheet);

      // Validate that sheetId is a valid integer
      if (typeof sheetId !== "number" || isNaN(sheetId)) {
        console.error("Invalid sheetId:", sheetId);
        return;
      }

      // Check if row and col are valid indices
      if (typeof row !== "number" || typeof col !== "number") {
        console.error("Invalid row or col:", { row, col });
        return;
      }

      // Get the formula for the selected cell
      let hfFormula = "";
      try {
        hfFormula = hyperFormulaInstance.getCellFormula({
          sheet: sheetId,
          col,
          row,
        });
      } catch (error) {
        console.warn("Failed to get cell formula:", error);
      }

      const sheetStylesObj = cellStyles[selectedSheet] || {};
      const sheetStyles = Object.values(sheetStylesObj).filter(
        (item) => typeof item === "object" && item?.row !== undefined && item?.col !== undefined
      );

      const cellStyle = sheetStyles.find(
        (style) => style.row === row && style.col === col
      );

      setIsBoldActive(cellStyle?.bold || false);
      setSelectedCell({
        row,
        col,
        value: cellValue || "",
        formula: hfFormula || "",
        style: {
          backgroundColor: cellStyle?.backgroundColor || "",
          fontColor: cellStyle?.fontColor || "",
          bold: cellStyle?.bold || false,
          className: cellStyle?.className || hot.getCellMeta(row, col).className || "htLeft",
        },
        decimalPrecision: (function () {
          // 1. Try to get from our state map first
          const mapVal = decimalPrecisionMap?.[selectedSheet]?.[`${row}-${col}`];
          if (mapVal !== undefined) return mapVal;

          // 2. Fallback to Handsontable meta
          const meta = hot.getCellMeta(row, col);
          return meta.decimalPrecision !== undefined ? meta.decimalPrecision : 0; // Default 2
        })(),
        readOnly: (function () {
          const key = `${row}-${col}`;
          const permKeyComma = `${row},${col}`;
          const restrictedRoles = permissionsMap[selectedSheet]?.[key] || permissionsMap[selectedSheet]?.[permKeyComma] || [];
          return restrictedRoles.includes(auth?.department?.trim());
        })(),
        address: cellAddress,
      });

      let newHighlightedCells = {};

      if (hfFormula) {
        // Match all references including ranges like A1:C1
        const formulaDeps = hfFormula.match(
          /(?:'([^']+)'|([A-Za-z0-9_]+))?!?([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?/g
        );

        if (formulaDeps) {
          formulaDeps.forEach((dep) => {
            // Match: 'Sheet Name'!A1[:C1] or Sheet1!A1[:C1] or A1[:C1]
            const match = dep.match(
              /^(?:'([^']+)'|([A-Za-z0-9_]+))?!?([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/
            );

            if (!match) return;

            const refSheet = match[1] || match[2] || selectedSheet;
            const startColLetter = match[3];
            const startRowNum = parseInt(match[4], 10);
            const endColLetter = match[5];
            const endRowNum = match[6] ? parseInt(match[6], 10) : null;

            // Convert column letters to index
            const letterToColIndex = (col) => {
              let index = 0;
              for (let i = 0; i < col.length; i++) {
                index = index * 26 + (col.charCodeAt(i) - 64);
              }
              return index - 1;
            };

            const startCol = letterToColIndex(startColLetter);
            const startRow = startRowNum - 1;

            const endCol = endColLetter
              ? letterToColIndex(endColLetter)
              : startCol;
            const endRow = endRowNum !== null ? endRowNum - 1 : startRow;

            if (!newHighlightedCells[refSheet]) {
              newHighlightedCells[refSheet] = [];
            }

            // Loop over full range
            for (
              let r = Math.min(startRow, endRow);
              r <= Math.max(startRow, endRow);
              r++
            ) {
              for (
                let c = Math.min(startCol, endCol);
                c <= Math.max(startCol, endCol);
                c++
              ) {
                newHighlightedCells[refSheet].push(`${r}-${c}`);
              }
            }
          });
        }
      }

      setHighlightedCells(newHighlightedCells);
    } catch (error) {
      console.error("Error in handleCellSelection:", error);
    }
  };

  return { handleCellSelection };
}
