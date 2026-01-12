const { HyperFormula } = require("hyperformula");

// Helper to convert column letter to index (e.g., "A" -> 0, "Z" -> 25, "AA" -> 26)
const getColIndexFromLetter = (letter) => {
    let column = 0;
    const length = letter.length;
    for (let i = 0; i < length; i++) {
        column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
    }
    return column - 1;
};

// Helper to evaluate conditional formatting rules
const evaluateCondition = (cellValue, rule, hfInstance, currentSheetName) => {
    const { condition } = rule;
    if (!condition) return false;

    const op = condition.operator;

    // Function to resolve values (static numbers or cell references like "=Sheet1!A1")
    const resolveValue = (val) => {
        if (typeof val === 'string' && val.trim().startsWith('=')) {
            const refExp = val.trim().substring(1); // remove "="

            // Parse reference: [SheetName]![Column][Row] or just [Column][Row]
            const parts = refExp.split('!');
            let targetSheetName = currentSheetName;
            let cellStr = refExp;

            if (parts.length > 1) {
                targetSheetName = parts[0].replace(/^'|'$/g, ""); // Remove surrounding quotes if present
                cellStr = parts[1];
            }

            const match = cellStr.match(/^([A-Za-z]+)([0-9]+)$/);
            if (match) {
                const colLetter = match[1].toUpperCase();
                const rowNum = parseInt(match[2], 10);

                const col = getColIndexFromLetter(colLetter);
                const row = rowNum - 1; // 0-indexed

                const sheetId = hfInstance.getSheetId(targetSheetName);
                if (sheetId !== undefined) {
                    const cellVal = hfInstance.getCellValue({ sheet: sheetId, row, col });
                    // Return recursive resolution not needed for simple raw values usually, 
                    // but getCellValue returns calculated value.
                    return cellVal;
                }
            }
            return parseFloat(val); // Fallback if parsing fails
        }
        return isNaN(Number(val)) ? val : Number(val);
    };

    const cVal = Number(cellValue);
    const isValidNumber = !isNaN(cVal) && cellValue !== "" && cellValue !== null;

    if (op === 'between') {
        // Tolerance Logic: (Center - Min) <= Val <= (Center + Max)
        if ((condition.CenterRef && (typeof condition.CenterRef === 'object' || condition.CenterRef !== "")) || (condition.CenterValue !== "" && condition.CenterValue !== undefined)) {
            let center = null;

            // 1. Try CenterRef
            if (condition.CenterRef && typeof condition.CenterRef === 'object' && condition.CenterRef.col !== undefined && condition.CenterRef.row !== undefined) {
                const sheetId = hfInstance.getSheetId(currentSheetName);
                if (sheetId !== undefined) {
                    const refVal = hfInstance.getCellValue({
                        sheet: sheetId,
                        row: condition.CenterRef.row,
                        col: condition.CenterRef.col
                    });

                    const floatVal = parseFloat(refVal);
                    if (!isNaN(floatVal)) {
                        center = floatVal;
                    }
                }
            }

            // 2. Fallback to CenterValue
            if ((center === null || isNaN(center)) && condition.CenterValue !== "" && condition.CenterValue !== undefined) {
                center = Number(resolveValue(condition.CenterValue));
            }

            // 3. Fallback to condition.value (if it contains a formula or value to be used as center)
            if ((center === null || isNaN(center)) && condition.value !== "" && condition.value !== undefined) {
                center = Number(resolveValue(condition.value));
            }

            if (center !== null && !isNaN(center)) {
                const minTol = Number(resolveValue(condition.minValue));
                const maxTol = Number(resolveValue(condition.maxValue));

                if (!isValidNumber || isNaN(minTol) || isNaN(maxTol)) return false;

                const lower = center - minTol;
                const upper = center + maxTol;
                const epsilon = 0.000001;

                // User Request: "if user cell value enterd more then this show error"
                // Interpretation: Apply ERROR STYLE (Red) if value is OUT OF TOLERANCE.
                // Range: [center - min, center + max] is SAFE.
                // Condition Met (Style Applied) if: val < lower OR val > upper.

                const formattedRangeLower = lower - epsilon;
                const formattedRangeUpper = upper + epsilon;

                // Return TRUE (apply style) if outside range
                return cVal < formattedRangeLower || cVal > formattedRangeUpper;
            }
        }

        // Standard Range: Min <= Val <= Max
        const min = Number(resolveValue(condition.minValue));
        const max = Number(resolveValue(condition.maxValue));
        if (!isValidNumber) return false;
        return cVal >= min && cVal <= max;
    }

    const tVal = resolveValue(condition.value);

    // If both are numbers, compare numerically
    if (isValidNumber && !isNaN(Number(tVal))) {
        const nTVal = Number(tVal);
        switch (op) {
            case '=': return Math.abs(cVal - nTVal) < 0.000001; // Float tolerance
            case '>': return cVal > nTVal;
            case '<': return cVal < nTVal;
            case '!=': return Math.abs(cVal - nTVal) >= 0.000001;
            case '>=': return cVal >= nTVal;
            case '<=': return cVal <= nTVal;
        }
    }

    // Fallback to string comparison
    const sCVal = String(cellValue);
    const sTVal = String(tVal);

    switch (op) {
        case '=': return sCVal == sTVal;
        case '!=': return sCVal != sTVal;
    }

    return false;
};

const generatePdfFromSheet = async (
    handsontableJson,
    MergedCells,
    Styles,
    selectedSheetInput,
    decimalPoint,
    Layout,
    fontSize
) => {
    try {
        const sheetKey =
            typeof selectedSheetInput === "object"
                ? selectedSheetInput.value
                : selectedSheetInput;

        const sheetData = handsontableJson[sheetKey] || [];
        const mergedCells = MergedCells?.[sheetKey] || [];
        ///const stylesArray = Styles?.[sheetKey] || [];

        const rawStyleObj = Styles?.[sheetKey] || {};
        const stylesArray = Object.values(rawStyleObj).filter(item => typeof item === "object" && item?.row !== undefined);
        const conditionalStyles = rawStyleObj.conditionalFormatting || [];

        let decimalPointArray = {};

        if (decimalPoint && typeof decimalPoint === "object") {
            const allPrecisions = {};

            for (const [sheetName, sheetPrecision] of Object.entries(decimalPoint)) {
                for (const [cellKey, value] of Object.entries(sheetPrecision)) {
                    allPrecisions[cellKey] = value;
                }
            }

            decimalPointArray = allPrecisions;
        }

        if (!sheetData.length) return [];

        const hfInstance = HyperFormula.buildFromSheets(handsontableJson, {
            licenseKey: "gpl-v3",
        });

        const sheetId = hfInstance.getSheetId(sheetKey);
        if (sheetId === undefined) {
            throw new Error(`Sheet "${sheetKey}" not found`);
        }

        const evaluatedDatas = hfInstance.getSheetSerialized(sheetId);
        //console.log(evaluatedDatas, 'Evaluated Data Without Rounding');
        const evaluatedData = hfInstance.getSheetValues(sheetId);


        const maxCols = Math.max(...evaluatedData.map((row) => row.length), 0);

        const paddedData = evaluatedData.map((row) => {
            const newRow = Array(maxCols).fill("");
            return row.concat(newRow.slice(row.length));
        });

        const splitTables = [];
        let currentChunk = [];
        let startRowIndexes = [];

        paddedData.forEach((row, idx) => {
            const isEmptyRow = row.every((cell) => cell === "");
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

        const cleanMergeDefinitions = (
            mergedCells,
            tableData,
            startRow,
            endRow,
            maxCols
        ) => {
            return mergedCells
                .filter(
                    ({ row, col, rowspan, colspan }) =>
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
                    colspan: Math.min(colspan, maxCols - col),
                }))
                .filter(
                    (cell, index, self) =>
                        index ===
                        self.findIndex((c) => c.row === cell.row && c.col === cell.col)
                );
        };

        return splitTables.map((tableData, chunkIndex) => {

            const startRow = startRowIndexes[chunkIndex];
            const endRow = startRow + tableData.length;

            // Apply styles to each cell
            const tableStyles = stylesArray
                .filter((s) => s.row >= startRow && s.row < endRow)
                .map((s) => ({
                    ...s,
                    row: s.row - startRow,
                }));

            const tableMergedCells = cleanMergeDefinitions(
                mergedCells,
                tableData,
                startRow,
                endRow,
                maxCols
            );

            // Ensure all cells in the table have valid objects
            const tableBody = tableData.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                    const style = tableStyles.find(
                        (s) => s.row === rowIndex && s.col === colIndex
                    );

                    let formattedText = "";
                    let numericValue = null;

                    let decimalPlaces = null;

                    // READ decimal places once
                    if (
                        decimalPoint &&
                        typeof decimalPoint === "object" &&
                        decimalPoint[sheetKey]
                    ) {
                        const key = `${startRow + rowIndex}-${colIndex}`;
                        decimalPlaces = decimalPoint[sheetKey][key];
                    }


                    // ------------------------------
                    // FIXED: Proper decimal handling
                    // ------------------------------
                    if (
                        decimalPlaces != null &&
                        cell !== null &&
                        cell !== "" &&
                        cell !== undefined &&
                        !isNaN(Number(cell))
                    ) {
                        formattedText = Number(cell).toFixed(decimalPlaces);

                        // const originalRawValue = sheetData[startRow + rowIndex]?.[colIndex];
                        // const originalString = (originalRawValue !== null && originalRawValue !== undefined) ? String(originalRawValue) : "";
                        // formattedText = originalString;

                        // console.log(formattedText, "formattedText if");


                        // const originalRawValue = sheetData[startRow + rowIndex]?.[colIndex];
                        // if (
                        //     originalRawValue != null &&
                        //     typeof originalRawValue === 'string' &&
                        //     !originalRawValue.trim().startsWith('=') &&
                        //     !isNaN(Number(originalRawValue)) &&
                        //     Number(originalRawValue) == cell &&
                        //     (
                        //         // Case 1: Truncation (20.000 -> 20)
                        //         (originalRawValue.includes('.') && !formattedText.includes('.')) ||
                        //         // Case 2: Rounding changes value (0.006 -> 0.01)
                        //         (Number(originalRawValue) !== Number(formattedText)) ||
                        //         // Case 3: Loss of trailing zeros/precision (0.09700 -> 0.0970)
                        //         (originalRawValue.length > formattedText.length && originalRawValue.includes('.') && formattedText.includes('.'))
                        //     )
                        // ) {
                        //     formattedText = originalRawValue;
                        // }

                        // if (
                        //     (originalRawValue === undefined || (typeof originalRawValue === 'string' && originalRawValue.trim().startsWith('='))) &&
                        //     Number(cell) !== Number(formattedText)
                        // ) {
                        //     const cellStr = (cell ?? "").toString();
                        //     if (cellStr.length <= 12 && cellStr.includes('.')) {
                        //         formattedText = cellStr;
                        //     }
                        // }



                        // Override logic for precision preservation
                        const originalRawValue = sheetData[startRow + rowIndex]?.[colIndex];
                        const originalString = (originalRawValue !== null && originalRawValue !== undefined) ? String(originalRawValue) : "";
                        const isFormula = (typeof originalRawValue === 'string' && originalRawValue.trim().startsWith('='));

                        if (
                            !isFormula &&
                            originalString !== "" &&
                            !isNaN(Number(originalString)) &&
                            Math.abs(Number(originalString) - Number(cell)) < 0.000001 &&
                            (
                                // Case 1: Truncation (20.000 -> 20)
                                (originalString.includes('.') && !formattedText.includes('.')) ||
                                // Case 2: Rounding changes value (0.006 -> 0.01)
                                (Number(originalString) !== Number(formattedText)) ||
                                // Case 3: Loss of trailing zeros/precision (0.09700 -> 0.0970)
                                (originalString.length > formattedText.length && originalString.includes('.') && formattedText.includes('.'))
                            )
                        ) {
                            formattedText = originalString;
                        }

                        if (
                            (originalRawValue === undefined || (typeof originalRawValue === 'string' && originalRawValue.trim().startsWith('='))) &&
                            Number(cell) !== Number(formattedText)
                        ) {
                            const cellStr = (cell ?? "").toString();
                            if (cellStr.length <= 12 && cellStr.includes('.')) {
                                formattedText = cellStr;
                            }
                        }


                    }

                    // if (formattedText === "") {
                    //     formattedText = (cell ?? "").toString();
                    // }
                    if (formattedText === "") {
                        // Check if we can preserve the original string format (e.g. "0.000")
                        // This applies when no specific decimalPoint is configured for the cell
                        // const originalRawValue = sheetData[startRow + rowIndex]?.[colIndex];

                        // if (
                        //     originalRawValue != null &&
                        //     typeof originalRawValue === 'string' &&
                        //     !originalRawValue.trim().startsWith('=') &&
                        //     !isNaN(Number(originalRawValue)) &&
                        //     // Ensure the numeric values match (avoid displaying "0.000" for a value that evaluated to 0.1 etc, though unlikely if no formula)
                        //     Number(originalRawValue) == cell
                        // ) {
                        //     formattedText = originalRawValue;
                        // } else {
                        //     formattedText = (cell ?? "").toString();
                        // }

                        const originalRawValue = sheetData[startRow + rowIndex]?.[colIndex];
                        const originalString = (originalRawValue !== null && originalRawValue !== undefined) ? String(originalRawValue) : "";
                        const isFormula = (typeof originalRawValue === 'string' && originalRawValue.trim().startsWith('='));

                        if (
                            !isFormula &&
                            originalString !== "" &&
                            !isNaN(Number(originalString)) &&
                            // Ensure the numeric values match (avoid displaying "0.000" for a value that evaluated to 0.1 etc, though unlikely if no formula)
                            Math.abs(Number(originalString) - Number(cell)) < 0.000001
                        ) {
                            formattedText = originalString;
                        } else {
                            formattedText = (cell ?? "").toString();
                        }
                    }


                    // ------------------------------
                    // REMAINING CODE UNCHANGED
                    // ------------------------------
                    const cellStyle = {
                        text: formattedText,
                        alignment: "center",
                        bold: false,
                        color: "#000000",
                        fillColor: null,
                        noWrap: false,
                    };

                    if (style) {
                        // Apply static styles first
                        if (style.fontColor) cellStyle.color = style.fontColor;
                        if (style.backgroundColor) cellStyle.fillColor = style.backgroundColor;
                        if (style.bold) cellStyle.bold = true;

                        if (typeof style.className === "string") {
                            if (style.className.includes("htLeft")) cellStyle.alignment = "left";
                            if (style.className.includes("htRight")) cellStyle.alignment = "right";
                            if (style.className.includes("htCenter")) cellStyle.alignment = "center";
                        }
                    }

                    // Apply conditional formatting (Overwrites static styles if condition met)
                    if (Array.isArray(conditionalStyles) && conditionalStyles.length > 0) {
                        const cellRow = startRow + rowIndex;
                        const cellCol = colIndex;

                        // Find all rules that apply to this specific cell
                        const applicableRules = conditionalStyles.filter(rule =>
                            rule.row === cellRow && rule.col === cellCol
                        );

                        // Apply styles from all matching rules
                        for (const rule of applicableRules) {
                            const isConditionMet = evaluateCondition(cell, rule, hfInstance, sheetKey);
                            if (isConditionMet) {
                                if (rule.fontColor) cellStyle.color = rule.fontColor;
                                if (rule.backgroundColor) cellStyle.fillColor = rule.backgroundColor;
                                if (rule.bold) cellStyle.bold = true;
                            }
                        }
                    }

                    // if (cellStyle.text.length > 20 || maxCols > 10) {
                    //     cellStyle.alignment = "center";
                    // }

                    const isMergedMasterCell =
                        tableMergedCells.some(
                            (m) => m.row === rowIndex && m.col === colIndex
                        );

                    if (!isMergedMasterCell && (cellStyle.text.length > 20 || maxCols > 10)) {
                        cellStyle.alignment = "center";
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

            // const nonEmptyColumnIndexes = [];
            // for (let colIndex = 0; colIndex < maxCols; colIndex++) {
            //     const isNonEmptyColumn = tableBody.some(
            //         (row) => row[colIndex]?.text !== ""
            //     );
            //     if (isNonEmptyColumn) {
            //         nonEmptyColumnIndexes.push(colIndex);
            //     }
            // }

            // const finalTableBody = tableBody.map((row) =>
            //     nonEmptyColumnIndexes.map((colIndex) => row[colIndex])
            // );

            // const columnCount = nonEmptyColumnIndexes.length;
            // const widths = columnCount > 13 ? Array(columnCount).fill("auto") : Array(columnCount).fill("*");




            // --- Remove empty rows ---
            const filteredRows = tableBody.filter(row =>
                row.some(cell =>
                    cell && cell.text && cell.text.toString().trim() !== ""
                )
            );

            // --- Remove empty columns (after merges) ---
            const nonEmptyColumnIndexes = [];
            for (let colIndex = 0; colIndex < maxCols; colIndex++) {
                const hasContent = filteredRows.some(row => {
                    const cell = row[colIndex];
                    if (!cell || typeof cell !== "object") return false;
                    if (!("text" in cell)) return false;
                    return cell.text.toString().trim() !== "";
                });
                if (hasContent) nonEmptyColumnIndexes.push(colIndex);
            }


            // --- Build clean body ---
            const finalTableBody = filteredRows.map(row =>
                nonEmptyColumnIndexes.map(i => {
                    const cell = row[i];
                    if (!cell || typeof cell !== "object" || !("text" in cell)) {
                        return { text: "", alignment: "center", noWrap: false };
                    }

                    const cleanCell = {
                        text: (cell.text ?? "").toString(),
                        alignment: cell.alignment || "center",
                        bold: !!cell.bold,
                        color: cell.color || "#000000",
                        fillColor: cell.fillColor || null,
                        noWrap: false,
                    };

                    if (cell.rowSpan && cell.rowSpan > 1) cleanCell.rowSpan = cell.rowSpan;
                    if (cell.colSpan && cell.colSpan > 1) cleanCell.colSpan = cell.colSpan;

                    return cleanCell;
                })
            );

            // --- Pad uneven rows ---
            const expectedCols = nonEmptyColumnIndexes.length;
            for (let r = 0; r < finalTableBody.length; r++) {
                while (finalTableBody[r].length < expectedCols) {
                    finalTableBody[r].push({ text: "", alignment: "center", noWrap: false });
                }
            }

            // --- ✅ Validate spans to prevent _minWidth crash ---
            for (let r = 0; r < finalTableBody.length; r++) {
                for (let c = 0; c < finalTableBody[r].length; c++) {
                    const cell = finalTableBody[r][c];
                    if (!cell || typeof cell !== "object") {
                        finalTableBody[r][c] = { text: "", alignment: "center", noWrap: false };
                        continue;
                    }

                    if (cell.colSpan && cell.colSpan > 1) {
                        const availableCols = finalTableBody[r].length - c;
                        if (cell.colSpan > availableCols) {
                            cell.colSpan = availableCols;
                        }
                    }

                    if (cell.rowSpan && cell.rowSpan > 1) {
                        const availableRows = finalTableBody.length - r;
                        if (cell.rowSpan > availableRows) {
                            cell.rowSpan = availableRows;
                        }
                    }
                }
            }

            // --- Final safety: ensure equal column width rows ---
            const columnCountSafe = finalTableBody[0]?.length || 1;
            for (let r = 0; r < finalTableBody.length; r++) {
                while (finalTableBody[r].length < columnCountSafe) {
                    finalTableBody[r].push({ text: "", alignment: "center", noWrap: false });
                }
            }

            const columnCount = columnCountSafe;
            const widths = columnCount > 13 ? Array(columnCount).fill("auto") : Array(columnCount).fill("*");

            return {
                columns: [
                    {
                        width: "*",
                        stack: [
                            {
                                table: {
                                    headerRows: 1,
                                    widths,
                                    body: finalTableBody,
                                },
                                layout: Layout,
                                fontSize,
                                dontBreakRows: true,
                                //style: "ninethTable",

                            }
                        ],
                        //unbreakable: true,
                        margin: columnCount > 13 ? [50, 0, 50, 0] : [0, 0, 0, 0],
                        alignment: "center",
                    },
                ],
                alignment: "center",
                columnGap: 0,
            };



        });
    } catch (err) {
        console.error("Error generating PDF:", err);
        return [
            {
                text: `Error generating table: ${err.message}`,
                color: "red",
                margin: [0, 10, 0, 10],
            },
        ];
    }
};

module.exports = { generatePdfFromSheet };
