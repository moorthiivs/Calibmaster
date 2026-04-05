import { Modal } from "antd";
import Handsontable from "handsontable";

export function useExcelStyles(excelState, hotRef, excelHistory, handleCellSelection) {
  const {
    selectedSheet,
    cellStyles,
    setCellStyles,
    selectedCell,
    setSelectedCell,
    setIsBoldActive,
    isBoldActive,
    mergedCells,
    setMergedCells,
    sheetNames,
    sheetData,
    setIsDirty
  } = excelState;

  const { trackAction } = excelHistory;

  const handleMergeUnmerge = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selection = hot.getSelected();
    if (!selection || selection.length === 0) {
      alert("Please select cells first");
      return;
    }

    // selection[0] = [startRow, startCol, endRow, endCol]
    // Note: User might select from bottom-right to top-left, so we must normalize.
    const [r1, c1, r2, c2] = selection[0];
    const row = Math.min(r1, r2);
    const col = Math.min(c1, c2);
    const endRow = Math.max(r1, r2);
    const endCol = Math.max(c1, c2);

    if (row === endRow && col === endCol) {
      alert("Please select multiple cells to merge.");
      return;
    }

    const mergePlugin = hot.getPlugin("mergeCells");
    const isMerged = mergePlugin.mergedCellsCollection.get(row, col);

    const prevMergedCells = [...(mergedCells[selectedSheet] || [])];

    if (isMerged) {
      // UNMERGE
      try {
        mergePlugin.unmerge(isMerged.row, isMerged.col);
      } catch (err) {
        console.warn("Unmerge error:", err);
      }

      const newMergedCells = (mergedCells[selectedSheet] || []).filter(
        (cell) => !(cell.row === isMerged.row && cell.col === isMerged.col)
      );

      setMergedCells((prev) => ({
        ...prev,
        [selectedSheet]: newMergedCells,
      }));

      trackAction({
        type: "MERGE_CHANGE",
        payload: {
          sheet: selectedSheet,
          prevMergedCells,
          newMergedCells,
        },
      });
      setIsDirty(true);
    } else {
      // MERGE

      // Capture data BEFORE merging
      // getData returns array of arrays: [[A1, B1], [A2, B2]]
      const savedData = hot.getData(row, col, endRow, endCol);

      // 1. Execute merge in Handsontable (expects start/end coords)
      mergePlugin.merge(row, col, endRow, endCol);

      // 2. Prepare config for React State (expects rowspan/colspan)
      const rowspan = endRow - row + 1;
      const colspan = endCol - col + 1;

      const mergeConfig = {
        row,
        col,
        rowspan,
        colspan,
        savedData // <--- SAVE THE DATA HERE
      };

      const newMergedCells = [
        ...(mergedCells[selectedSheet] || []),
        mergeConfig,
      ];

      setMergedCells((prev) => ({
        ...prev,
        [selectedSheet]: newMergedCells,
      }));

      trackAction({
        type: "MERGE_CHANGE",
        payload: {
          sheet: selectedSheet,
          prevMergedCells,
          newMergedCells,
        },
      });
      setIsDirty(true);
    }
  };

  const updateCellStyle_old = (row1, col1, row2, col2, styleKey, styleValue) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    // ✅ Normalize selection
    const rStart = Math.min(row1, row2);
    const rEnd = Math.max(row1, row2);
    const cStart = Math.min(col1, col2);
    const cEnd = Math.max(col1, col2);

    const mergePlugin = hot.getPlugin("mergeCells");

    const sheetName = selectedSheet;
    const currentSheetStyles = cellStyles[sheetName] || {};
    const changesPayload = [];

    // --------------------------------------------------
    // 🔍 Find merged master cell (if any cell is merged)
    // --------------------------------------------------
    const getMergedMaster = () => {
      for (let r = rStart; r <= rEnd; r++) {
        for (let c = cStart; c <= cEnd; c++) {
          const merge = mergePlugin.mergedCellsCollection.get(r, c);
          if (merge) return merge; // { row, col, rowspan, colspan }
        }
      }
      return null;
    };

    const mergedCell = getMergedMaster();

    // --------------------------------------------------
    // 🔍 Capture old values for UNDO
    // --------------------------------------------------
    const captureChange = (r, c) => {
      const existingKey = Object.keys(currentSheetStyles).find(
        (key) =>
          key !== "conditionalFormatting" &&
          currentSheetStyles[key].row === r &&
          currentSheetStyles[key].col === c
      );

      const oldValue = existingKey
        ? currentSheetStyles[existingKey][styleKey]
        : undefined;

      if (oldValue !== styleValue) {
        changesPayload.push({
          sheet: sheetName,
          row: r,
          col: c,
          styleKey,
          oldValue,
          newValue: styleValue
        });
      }
    };

    if (mergedCell) {
      captureChange(mergedCell.row, mergedCell.col);
    } else {
      for (let r = rStart; r <= rEnd; r++) {
        for (let c = cStart; c <= cEnd; c++) {
          captureChange(r, c);
        }
      }
    }

    if (changesPayload.length > 0) {
      trackAction({
        type: "STYLE_CHANGE",
        payload: changesPayload
      });
    }

    // --------------------------------------------------
    // ✅ Update cellStyles state
    // --------------------------------------------------
    setCellStyles((prev) => {
      const newStyles = { ...prev };

      if (!newStyles[sheetName]) {
        newStyles[sheetName] = { conditionalFormatting: [] };
      }

      const sheetObj = { ...newStyles[sheetName] };

      const updateSingleCell = (r, c) => {
        const matchingKeys = Object.keys(sheetObj).filter(
          (key) =>
            key !== "conditionalFormatting" &&
            sheetObj[key] &&
            typeof sheetObj[key].row === "number" &&
            sheetObj[key].row === r &&
            sheetObj[key].col === c
        );
        const targetKey = matchingKeys.length > 0 ? matchingKeys[0] : null;

        if (!targetKey) {
          if (styleValue !== undefined) {
            const nextKey = `${r}-${c}`;
            sheetObj[nextKey] = {
              row: r,
              col: c,
              [styleKey]: styleValue
            };
          }
        } else {
          // Handle DUPLICATES via Merging
          let mergedData = {};
          matchingKeys.forEach(k => {
            mergedData = { ...mergedData, ...sheetObj[k] };
            if (k !== targetKey) delete sheetObj[k]; // Remove duplicates
          });

          if (styleKey === 'className') {
            if (typeof styleValue === 'number') styleValue = 'htLeft';
            // Smart Alignment Merging
            const hAligns = ['htLeft', 'htCenter', 'htRight', 'htJustify'];
            const vAligns = ['htTop', 'htMiddle', 'htBottom'];
            let rawClass = mergedData.className;
            if (typeof rawClass === 'number') rawClass = 'htLeft';
            let classes = (rawClass || '').toString().split(' ').filter(c => c.trim());
            if (hAligns.includes(styleValue)) {
              // Remove old horizontal aligns
              classes = classes.filter(c => !hAligns.includes(c));
            } else if (vAligns.includes(styleValue)) {
              // Remove old vertical aligns
              classes = classes.filter(c => !vAligns.includes(c));
            }

            classes.push(styleValue);
            mergedData.className = classes.join(' ');
          } else {
            if (styleValue === undefined) {
              delete mergedData[styleKey];
            } else {
              mergedData[styleKey] = styleValue;
            }
          }

          if (!mergedData.className || mergedData.className.trim() === '') {
            delete mergedData.className;
          }

          // CLEAN UP EMPTY STYLES SO DATABASE DROPS THEM
          const safeKeys = ['row', 'col', 'originalTemplate'];
          const remainingStyleKeys = Object.keys(mergedData).filter(k => !safeKeys.includes(k));

          const isEmpty = remainingStyleKeys.length === 0;

          if (isEmpty && !mergedData.originalTemplate) {
            delete sheetObj[targetKey];
          } else {
            sheetObj[targetKey] = mergedData;
          }
        }
      };

      if (mergedCell) {
        // ✅ Always apply style ONLY to merge master
        updateSingleCell(mergedCell.row, mergedCell.col);
      } else {
        for (let r = rStart; r <= rEnd; r++) {
          for (let c = cStart; c <= cEnd; c++) {
            updateSingleCell(r, c);
          }
        }
      }

      newStyles[sheetName] = sheetObj;
      return newStyles;
    });

    // --------------------------------------------------
    // ✅ Update selectedCell UI state (bold / unbold sync)
    // --------------------------------------------------
    if (selectedCell && selectedCell.row !== null && selectedCell.col !== null) {
      if (
        (mergedCell &&
          selectedCell.row === mergedCell.row &&
          selectedCell.col === mergedCell.col) ||
        (!mergedCell &&
          selectedCell.row >= rStart &&
          selectedCell.row <= rEnd &&
          selectedCell.col >= cStart &&
          selectedCell.col <= cEnd)
      ) {
        setSelectedCell((prev) => {
          let nextStyle = { ...prev.style, [styleKey]: styleValue };

          // ✅ Special handling for className to preserve alignment combinations
          if (styleKey === 'className') {
            if (typeof styleValue === 'number') styleValue = 'htLeft';
            const hAligns = ['htLeft', 'htCenter', 'htRight', 'htJustify'];
            const vAligns = ['htTop', 'htMiddle', 'htBottom'];
            let rawClass = prev.style?.className;
            if (typeof rawClass === 'number') rawClass = 'htLeft';
            let classes = (rawClass || '').toString().split(' ').filter(c => c.trim());

            if (hAligns.includes(styleValue)) {
              classes = classes.filter(c => !hAligns.includes(c));
            } else if (vAligns.includes(styleValue)) {
              classes = classes.filter(c => !vAligns.includes(c));
            }
            classes.push(styleValue);
            nextStyle.className = classes.join(' ');
          }

          return {
            ...prev,
            style: nextStyle
          };
        });
      }
    }

    hot.render();
    setIsDirty(true);
  };
  const updateCellStyle = (row1, col1, row2, col2, styleKey, styleValue) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    // ✅ Normalize selection
    const rStart = Math.min(row1, row2);
    const rEnd = Math.max(row1, row2);
    const cStart = Math.min(col1, col2);
    const cEnd = Math.max(col1, col2);

    const mergePlugin = hot.getPlugin("mergeCells");

    const sheetName = selectedSheet;
    const currentSheetStyles = cellStyles[sheetName] || {};
    const changesPayload = [];

    // --------------------------------------------------
    // 🔍 Collect all target cells (handle merged cells)
    // --------------------------------------------------
    const cellsToUpdate = new Map();

    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        const merge = mergePlugin.mergedCellsCollection.get(r, c);
        if (merge) {
          cellsToUpdate.set(`${merge.row}-${merge.col}`, { r: merge.row, c: merge.col });
        } else {
          cellsToUpdate.set(`${r}-${c}`, { r, c });
        }
      }
    }
    const targetCells = Array.from(cellsToUpdate.values());

    // --------------------------------------------------
    // 🔍 Capture old values for UNDO
    // --------------------------------------------------
    const captureChange = (r, c) => {
      const existingKey = Object.keys(currentSheetStyles).find(
        (key) =>
          key !== "conditionalFormatting" &&
          currentSheetStyles[key].row === r &&
          currentSheetStyles[key].col === c
      );

      const oldValue = existingKey
        ? currentSheetStyles[existingKey][styleKey]
        : undefined;

      if (oldValue !== styleValue) {
        changesPayload.push({
          sheet: sheetName,
          row: r,
          col: c,
          styleKey,
          oldValue,
          newValue: styleValue
        });
      }
    };

    targetCells.forEach(({ r, c }) => captureChange(r, c));

    if (changesPayload.length > 0) {
      trackAction({
        type: "STYLE_CHANGE",
        payload: changesPayload
      });
    }

    // --------------------------------------------------
    // ✅ Update cellStyles state
    // --------------------------------------------------
    setCellStyles((prev) => {
      const newStyles = { ...prev };

      if (!newStyles[sheetName]) {
        newStyles[sheetName] = { conditionalFormatting: [] };
      }

      const sheetObj = { ...newStyles[sheetName] };

      const updateSingleCell = (r, c) => {
        const matchingKeys = Object.keys(sheetObj).filter(
          (key) =>
            key !== "conditionalFormatting" &&
            sheetObj[key] &&
            typeof sheetObj[key].row === "number" &&
            sheetObj[key].row === r &&
            sheetObj[key].col === c
        );
        const targetKey = matchingKeys.length > 0 ? matchingKeys[0] : null;

        if (!targetKey) {
          const nextKey = `${r}-${c}`;
          sheetObj[nextKey] = {
            row: r,
            col: c,
            [styleKey]: styleValue
          };
        } else {
          // Handle DUPLICATES via Merging
          let mergedData = {};
          matchingKeys.forEach(k => {
            mergedData = { ...mergedData, ...sheetObj[k] };
            if (k !== targetKey) delete sheetObj[k]; // Remove duplicates
          });

          if (styleKey === 'className') {
            if (typeof styleValue === 'number') styleValue = 'htLeft';
            // Smart Alignment Merging
            const hAligns = ['htLeft', 'htCenter', 'htRight', 'htJustify'];
            const vAligns = ['htTop', 'htMiddle', 'htBottom'];
            let rawClass = mergedData.className;
            if (typeof rawClass === 'number') rawClass = 'htLeft';
            let classes = (rawClass || '').toString().split(' ').filter(c => c.trim());
            if (hAligns.includes(styleValue)) {
              // Remove old horizontal aligns
              classes = classes.filter(c => !hAligns.includes(c));
            } else if (vAligns.includes(styleValue)) {
              // Remove old vertical aligns
              classes = classes.filter(c => !vAligns.includes(c));
            }

            classes.push(styleValue);
            mergedData.className = classes.join(' ');
          } else {
            if (styleValue === undefined) {
              delete mergedData[styleKey];
            } else {
              mergedData[styleKey] = styleValue;
            }
          }

          sheetObj[targetKey] = mergedData;
        }
      };

      targetCells.forEach(({ r, c }) => updateSingleCell(r, c));

      newStyles[sheetName] = sheetObj;
      return newStyles;
    });

    // --------------------------------------------------
    // ✅ Update selectedCell UI state (bold / unbold sync)
    // --------------------------------------------------
    if (selectedCell && selectedCell.row !== null && selectedCell.col !== null) {
      const selectedMerge = mergePlugin.mergedCellsCollection.get(selectedCell.row, selectedCell.col);
      const selectedR = selectedMerge ? selectedMerge.row : selectedCell.row;
      const selectedC = selectedMerge ? selectedMerge.col : selectedCell.col;

      if (cellsToUpdate.has(`${selectedR}-${selectedC}`)) {
        setSelectedCell((prev) => {
          let nextStyle = { ...prev.style, [styleKey]: styleValue };

          // ✅ Special handling for className to preserve alignment combinations
          if (styleKey === 'className') {
            if (typeof styleValue === 'number') styleValue = 'htLeft';
            const hAligns = ['htLeft', 'htCenter', 'htRight', 'htJustify'];
            const vAligns = ['htTop', 'htMiddle', 'htBottom'];
            let rawClass = prev.style?.className;
            if (typeof rawClass === 'number') rawClass = 'htLeft';
            let classes = (rawClass || '').toString().split(' ').filter(c => c.trim());

            if (hAligns.includes(styleValue)) {
              classes = classes.filter(c => !hAligns.includes(c));
            } else if (vAligns.includes(styleValue)) {
              classes = classes.filter(c => !vAligns.includes(c));
            }
            classes.push(styleValue);
            nextStyle.className = classes.join(' ');
          }

          return {
            ...prev,
            style: nextStyle
          };
        });
      }
    }

    hot.render();
    setIsDirty(true);
  };
  const handleBold = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selection = hot.getSelected();
    if (!selection || selection.length === 0) {
      alert('Please select cells first');
      return;
    }

    const [row1, col1, row2, col2] = selection[0];
    const shouldBold = !isBoldActive;

    updateCellStyle(
      row1,
      col1,
      row2,
      col2,
      'bold',
      shouldBold ? 'bold' : undefined
    );

    setIsBoldActive(shouldBold);
  };

  // const handlealignstyle = (align) => {
  //   const [row1, col1, row2, col2] = hotRef.current?.hotInstance.getSelected()[0];
  //   updateCellStyle(row1, col1, row2, col2, 'className', align);
  // };
  const handlealignstyle = (align) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selections = hot.getSelected();
    if (!selections || selections.length === 0) return;

    selections.forEach(([row1, col1, row2, col2]) => {
      updateCellStyle(row1, col1, row2, col2, 'className', align);
    });
  };
  const handleColorChange = (color) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    const [row1, col1, row2, col2] = hotRef.current?.hotInstance.getSelected()[0];

    const sheetDataInternal = cellStyles[selectedSheet] || {};
    const conditionalFormatting = sheetDataInternal.conditionalFormatting || [];

    let hasConditionalCell = false;

    for (let r = row1; r <= row2; r++) {
      for (let c = col1; c <= col2; c++) {
        if (conditionalFormatting.some((cf) => cf.row === r && cf.col === c)) {
          hasConditionalCell = true;
          break;
        }
      }
    }

    if (hasConditionalCell) {
      Modal.warning({
        title: 'Action not allowed',
        content: 'Cells with conditional formatting cannot have manual background color changes.',
      });
      return;
    }
    updateCellStyle(row1, col1, row2, col2, 'backgroundColor', color);
  };

  const handleFontColorChange = (color) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    const [row1, col1, row2, col2] = hot.getSelected()[0];
    const sheetDataInternal = cellStyles[selectedSheet] || {};
    const conditionalFormatting = sheetDataInternal.conditionalFormatting || [];

    let hasConditionalCell = false;

    for (let r = row1; r <= row2; r++) {
      for (let c = col1; c <= col2; c++) {
        if (conditionalFormatting.some((cf) => cf.row === r && cf.col === c)) {
          hasConditionalCell = true;
          break;
        }
      }
    }

    if (hasConditionalCell) {
      Modal.warning({
        title: 'Action not allowed',
        content: 'Cells with conditional formatting cannot have manual color changes.',
      });
      return;
    }
    updateCellStyle(row1, col1, row2, col2, 'fontColor', color);
  };

  const handlecellformatting = (rulesList, selection, sourceSheet) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const [row1, col1, row2, col2] = selection[0];
    const mergePlugin = hot.getPlugin("mergeCells");

    // Ensure rules array
    const rules = (Array.isArray(rulesList) ? rulesList : [rulesList]).map(r => {
      // 🛡️ Fix for linked sheets: Ensure CenterRef has a sheet name
      if (r.CenterRef && !r.CenterRef.sheet && sourceSheet) {
        return {
          ...r,
          CenterRef: { ...r.CenterRef, sheet: sourceSheet }
        };
      }
      return r;
    });

    // Deep copy styles
    const currentStyles = cellStyles;
    const nextStyles = JSON.parse(JSON.stringify(currentStyles));

    const trackedSheets = new Set();
    const prevFormattingState = [];
    const newFormattingState = [];

    // Snapshot helper
    const snapshotSheet = (sheet) => {
      if (!trackedSheets.has(sheet)) {
        trackedSheets.add(sheet);
        prevFormattingState.push({
          sheet,
          formatting: currentStyles[sheet]?.conditionalFormatting || []
        });
      }
    };

    // Replace all rules for specific cell
    const replaceRulesForCell = (sheet, row, col, newCellRules) => {
      snapshotSheet(sheet);

      if (!nextStyles[sheet]) nextStyles[sheet] = {};
      if (!nextStyles[sheet].conditionalFormatting)
        nextStyles[sheet].conditionalFormatting = [];

      let arr = nextStyles[sheet].conditionalFormatting;

      // remove old rules for this cell
      arr = arr.filter((s) => !(s.row === row && s.col === col));

      // add new rules
      arr.push(...newCellRules);

      nextStyles[sheet].conditionalFormatting = arr;
    };

    // Create rule object
    const createRuleObject = (sheet, row, col, ruleData, linked = false) => ({
      row,
      col,
      backgroundColor: ruleData.bgColor?.hex || ruleData.bgColor,
      fontColor: ruleData.fontColor?.hex || ruleData.fontColor,
      bold: true,
      linked,
      condition: {
        operator: ruleData.operator,
        value: ruleData.value,
        minValue: ruleData?.minValue || "",
        CenterValue: ruleData?.CenterValue || "",
        maxValue: ruleData?.maxValue || "",
        CenterRef: ruleData?.CenterRef || ""
      }
    });

    // Generate rules for one cell
    const generateRulesForCell = (sheet, row, col, linked = false) => {
      return rules.map(ruleData =>
        createRuleObject(sheet, row, col, ruleData, linked)
      );
    };

    const isMerged = mergePlugin.mergedCellsCollection.get(row1, col1);

    if (isMerged) {
      const cellRules = generateRulesForCell(
        sourceSheet,
        isMerged.row,
        isMerged.col
      );
      replaceRulesForCell(sourceSheet, isMerged.row, isMerged.col, cellRules);
    } else {
      for (let row = row1; row <= row2; row++) {
        for (let col = col1; col <= col2; col++) {

          // 1️⃣ Apply to source sheet
          const cellRules = generateRulesForCell(sourceSheet, row, col);
          replaceRulesForCell(sourceSheet, row, col, cellRules);

          // 2️⃣ Apply to linked sheets
          for (const [targetSheet, data] of Object.entries(sheetData)) {

            if (targetSheet === sourceSheet) continue;

            const formulas = data.flatMap((r, rIdx) =>
              r.map((val, cIdx) => ({
                row: rIdx,
                col: cIdx,
                formula: val,
              }))
            );

            const linkedRefs = formulas.filter(f =>
              typeof f.formula === "string" &&
              f.formula.toUpperCase() ===
              `=${sourceSheet.toUpperCase()}!${Handsontable.helper.spreadsheetColumnLabel(col)}${row + 1}`
            );

            linkedRefs.forEach(({ row: lr, col: lc }) => {
              const linkedRules = generateRulesForCell(
                targetSheet,
                lr,
                lc,
                true
              );
              replaceRulesForCell(targetSheet, lr, lc, linkedRules);
            });
          }
        }
      }
    }

    // Capture new state
    trackedSheets.forEach(sheet => {
      newFormattingState.push({
        sheet,
        formatting: nextStyles[sheet].conditionalFormatting
      });
    });

    // Track undo/redo
    if (trackedSheets.size > 0) {
      trackAction({
        type: "CONDITIONAL_CHANGE",
        payload: {
          prev: prevFormattingState,
          new: newFormattingState
        }
      });
    }

    // Apply state
    setCellStyles(nextStyles);
    hot.render();
    setIsDirty(true);
  };

  return {
    handleMergeUnmerge,
    updateCellStyle,
    handleBold,
    handlealignstyle,
    handleColorChange,
    handleFontColorChange,
    handlecellformatting
  };
}
