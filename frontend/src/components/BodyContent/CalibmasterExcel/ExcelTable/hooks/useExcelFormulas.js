export function useExcelFormulas(excelState, hotRef) {
  const {
    selectedCell,
    setSelectedCell,
    hyperFormulaInstance,
    selectedSheet,
    sheetNames,
    decimalPrecisionMapRef,
    setDecimalPrecisionMap,
    setSheetData,
    setIsDirty
  } = excelState;

  // const handleFormulaChange = (e) => {
  //   const formulaInput = e.target.value;
  //   setSelectedCell((prev) => ({
  //     ...prev,
  //     formula: formulaInput,
  //   }));
  // };

  const handleFormulaChange = (e) => {
    const input = e.target.value;

    setSelectedCell((prev) => ({
      ...prev,
      formula: input,
    }));

    // 🔥 INSTANT update to Handsontable (no wait)
    const hot = hotRef.current?.hotInstance;
    if (hot && selectedCell.row !== undefined) {
      hot.setDataAtCell(selectedCell.row, selectedCell.col, input);
    }
  };

  /**
   * 🔹 Helper to check if the formula is a direct reference (e.g. "=Sheet1!A1" or "=A1")
   * AND sync the decimal precision from the source cell to the current cell.
   * This is kept separate from existing logic to minimize regression risk.
   */
  const checkAndSyncReferenceDecimal = (formula, targetRow, targetCol) => {
    try {
      if (!formula || !formula.startsWith("=")) return;
      if (!hyperFormulaInstance) return;

      const cleanFormula = formula.substring(1).trim(); // Remove "="

      // Regex for Reference:
      // Group 1: Optional Sheet Name (with or without quotes) + "!"
      // Group 2: Cell Address (e.g. A1, AA12)
      // Example: =Sheet1!A1  or ='My Sheet'!B2 or =A1
      const refRegex = /^('?([^'!]+)'?!)?([A-Za-z]+[0-9]+)$/;
      const match = cleanFormula.match(refRegex);

      if (match) {
        let sourceSheetName = match[2]; // Captured sheet name
        const sourceCellAddr = match[3]; // Captured cell address like "A1"

        // If no sheet name, assume current sheet
        if (!sourceSheetName) {
          sourceSheetName = selectedSheet;
        }

        // 🔹 Case-insensitive sheet lookup (required)
        const matchedSheetName = sheetNames.find(
          (s) => s.localeCompare(sourceSheetName, undefined, { sensitivity: "accent" }) === 0 ||
            s.toLowerCase() === sourceSheetName.toLowerCase()
        );

        if (!matchedSheetName) {
          console.warn(`DecimalSync: Sheet "${sourceSheetName}" not found.`);
          return;
        }

        sourceSheetName = matchedSheetName; // enforce correct case

        // Convert "A1" -> { col, row }
        const sourceSheetId = hyperFormulaInstance.getSheetId(sourceSheetName);
        if (sourceSheetId === undefined) return;

        // Use HyperFormula utility to parse "A1" -> {col, row} if possible,
        // OR manually parse since we don't have easy access to internal HF utils here.
        // Manual Parse:
        const colMatch = sourceCellAddr.match(/[A-Za-z]+/)[0];
        const rowMatch = sourceCellAddr.match(/[0-9]+/)[0];

        // Convert Column Letter to Index (A=0, B=1...)
        let colIndex = 0;
        for (let i = 0; i < colMatch.length; i++) {
          colIndex = colIndex * 26 + (colMatch.charCodeAt(i) - 64);
        }
        colIndex -= 1; // 0-indexed

        const rowIndex = parseInt(rowMatch, 10) - 1; // 0-indexed

        // Look up source precision
        const sourcePrecisionMap = decimalPrecisionMapRef.current[sourceSheetName] || {};
        const sourceKey = `${rowIndex}-${colIndex}`;
        const sourcePrecision = sourcePrecisionMap[sourceKey];

        // If source has specific precision, apply to target
        if (sourcePrecision !== undefined) {
          const targetKey = `${targetRow}-${targetCol}`;

          // Update State
          setDecimalPrecisionMap((prev) => {
            const updated = { ...prev };
            updated[selectedSheet] = {
              ...(updated[selectedSheet] || {}),
              [targetKey]: sourcePrecision,
            };
            return updated;
          });

          // Update HotTable directly if needed
          const hot = hotRef.current?.hotInstance;
          if (hot) {
            hot.setCellMeta(
              targetRow,
              targetCol,
              "decimalPrecision",
              sourcePrecision
            );
            // safe render
            requestAnimationFrame(() => hot.render());
          }
        }
      }
    } catch (err) {
      console.error("Error in checkAndSyncReferenceDecimal:", err);
    }
  };

  // const handleFormulaSubmit = () => {
  //   const { row, col, formula } = selectedCell;
  //   const hot = hotRef.current?.hotInstance;

  //   if (!hot || !hyperFormulaInstance || row === undefined || col === undefined)
  //     return;

  //   try {
  //     const sheetId = hyperFormulaInstance.getSheetId(selectedSheet);
  //     const cellAddress = { sheet: sheetId, col, row };

  //     hyperFormulaInstance.setCellContents(cellAddress, formula);
  //     const newValue = hyperFormulaInstance.getCellValue(cellAddress);

  //     hot.setDataAtCell(row, col, newValue);

  //     setSelectedCell((prev) => ({
  //       ...prev,
  //       value: newValue,
  //     }));

  //     setSheetData((prev) => {
  //       const newData = [...prev[selectedSheet]];
  //       newData[row] = newData[row] || [];
  //       newData[row][col] = formula;
  //       return { ...prev, [selectedSheet]: newData };
  //     });

  //     setIsDirty(true);

  //     //hot.selectCell(row + 1, col);

  //     // 🔹 Separate Call for Decimal Sync
  //     checkAndSyncReferenceDecimal(formula, row, col);
  //   } catch (error) {
  //     console.error("Error updating formula:", error);
  //   }
  // };


  const handleFormulaSubmit = () => {
    const { row, col, formula } = selectedCell;
    const hot = hotRef.current?.hotInstance;

    if (!hot || !hyperFormulaInstance || row === undefined || col === undefined)
      return;

    try {
      const sheetId = hyperFormulaInstance.getSheetId(selectedSheet);
      const cellAddress = { sheet: sheetId, col, row };

      let input = (formula || "").trim();

      // 🔹 Normalize formula
      if (input !== "" && !input.startsWith("=")) {
        // Detect cell references like A1, B2, etc.
        const referenceRegex = /[A-Za-z]+\d+/;
        if (referenceRegex.test(input)) {
          input = `=${input}`;
        }
      }

      // 🔹 Update HyperFormula
      hyperFormulaInstance.setCellContents(cellAddress, input);

      const newValue = hyperFormulaInstance.getCellValue(cellAddress);

      // 🔹 Update Handsontable
      //hot.setDataAtCell(row, col, newValue);
      hot.render();
      // 🔹 Update selected cell state
      setSelectedCell((prev) => ({
        ...prev,
        value: newValue,
        formula: input,
      }));

      // 🔹 Persist sheet data
      setSheetData((prev) => {
        const newData = [...prev[selectedSheet]];
        newData[row] = newData[row] || [];
        newData[row][col] = input;
        return { ...prev, [selectedSheet]: newData };
      });

      setIsDirty(true);
      hot.selectCell(row + 1, col);
      // 🔹 Sync decimal precision if reference formula
      checkAndSyncReferenceDecimal(input, row, col);

    } catch (error) {
      console.error("Error updating formula:", error);
    }
  };

  return {
    handleFormulaChange,
    handleFormulaSubmit,
    checkAndSyncReferenceDecimal
  };
}
