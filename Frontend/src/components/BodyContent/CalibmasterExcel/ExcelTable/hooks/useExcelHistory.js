export function useExcelHistory(excelState, hotRef) {
  const {
    undoStack, setUndoStack,
    redoStack, setRedoStack,
    sheetData, setSheetData,
    cellStyles, setCellStyles,
    mergedCells, setMergedCells,
    sheetNames, setSheetNames,
    selectedSheet, setSelectedSheet,
    setIsDirty
  } = excelState;

  const trackChange = (action) => {
    // Push the new action to the undo stack and clear the redo stack
    setUndoStack((prev) => [...prev, action]);
    setRedoStack([]); // Clear redo stack because new change invalidates redo history
  };

  const trackAction = (action) => {
    setUndoStack((prev) => [...prev, action]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot || undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    const { type, payload } = action;

    if (type === "CELL_EDIT") {
      // payload: [{ row, col, oldValue, newValue, sheet }]
      const changes = payload.map(({ row, col, oldValue }) => [row, col, oldValue]);
      hot.setDataAtCell(changes);
    }
    else if (type === "STYLE_CHANGE") {
      // payload: [{ sheet, row, col, styleKey, oldValue, newValue }]
      setCellStyles(prev => {
        const newStyles = { ...prev };
        payload.forEach(({ sheet, row, col, styleKey, oldValue }) => {
          if (!newStyles[sheet]) newStyles[sheet] = {};

          // Ensure structure exists
          const sheetObj = newStyles[sheet];
          // Find or create cell entry (similar to updateCellStyle logic)
          let key = Object.keys(sheetObj).find(k => k !== "conditionalFormatting" && sheetObj[k].row === row && sheetObj[k].col === col);

          if (!key) {
            // If reverting to a state where it didn't exist, we might not need to create it if oldValue is undefined
            // But if we need to set it, create new key
            if (oldValue !== undefined) {
              key = Object.keys(sheetObj).filter(k => k !== "conditionalFormatting").length.toString();
              sheetObj[key] = { row, col };
            }
          }

          if (key) {
            if (oldValue === undefined) {
              delete sheetObj[key][styleKey];
            } else {
              sheetObj[key][styleKey] = oldValue;
            }
          }
        });
        return newStyles;
      });
      hot.render();
      setIsDirty(true);
    }
    else if (type === "MERGE_CHANGE") {
      // payload: { sheet, prevMergedCells, newMergedCells }

      // Determine if we are undoing a merge (i.e. going from More merges to Fewer merges)
      // or generally if a specific merge is being removed.

      const prevHas = (r, c) => payload.prevMergedCells.find(m => m.row === r && m.col === c);
      const newHas = (r, c) => payload.newMergedCells.find(m => m.row === r && m.col === c);

      const addedMerges = payload.newMergedCells.filter(n => !prevHas(n.row, n.col));

      addedMerges.forEach(mergeConfig => {
        if (mergeConfig.savedData) {
          hot.populateFromArray(
            mergeConfig.row,
            mergeConfig.col,
            mergeConfig.savedData
          );

        }
      });

      setMergedCells(prev => ({
        ...prev,
        [payload.sheet]: payload.prevMergedCells
      }));
      setIsDirty(true);
    }
    else if (type === "CONDITIONAL_CHANGE") {
      // payload: { prev: [{ sheet, formatting }], new: [{ sheet, formatting }] }
      setCellStyles(prev => {
        const next = { ...prev };
        payload.prev.forEach(({ sheet, formatting }) => {
          next[sheet] = {
            ...next[sheet],
            conditionalFormatting: formatting
          };
        });
        return next;
      });
      hot.render();
      setIsDirty(true);
    }
    else if (type === "SHEET_ADD") {
      // Undo of Add = Delete
      const { sheet } = payload;
      setSheetNames(prev => prev.filter(s => s !== sheet));
      setSheetData(prev => {
        const u = { ...prev };
        delete u[sheet];
        return u;
      });
      setMergedCells(prev => {
        const u = { ...prev };
        delete u[sheet];
        return u;
      });
      setCellStyles(prev => {
        const u = { ...prev };
        delete u[sheet];
        return u;
      });
      setSelectedSheet(prev => prev === sheet ? sheetNames[0] : prev);
      setIsDirty(true);
    }
    else if (type === "SHEET_DELETE") {
      // Undo of Delete = Restore
      const { sheet, data, merges, styles } = payload;

      setSheetData(prev => ({ ...prev, [sheet]: data }));
      setMergedCells(prev => ({ ...prev, [sheet]: merges }));
      setCellStyles(prev => ({ ...prev, [sheet]: styles }));

      setSheetNames(prev => [...prev, sheet]);
      setSelectedSheet(sheet);
      setIsDirty(true);
    }
    else if (type === "SHEET_DUPLICATE") {
      // Undo of Duplicate = Delete new sheet
      const { newSheet } = payload;
      setSheetNames(prev => prev.filter(s => s !== newSheet));
      setSheetData(prev => {
        const u = { ...prev };
        delete u[newSheet];
        return u;
      });
      setMergedCells(prev => {
        const u = { ...prev };
        delete u[newSheet];
        return u;
      });
      setCellStyles(prev => {
        const u = { ...prev };
        delete u[newSheet];
        return u;
      });
      setSelectedSheet(prev => prev === newSheet ? sheetNames[0] : prev);
      setIsDirty(true);
    }

    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, action]);
  };

  const handleRedo = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot || redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    const { type, payload } = action;

    if (type === "CELL_EDIT") {
      const changes = payload.map(({ row, col, newValue }) => [row, col, newValue]);
      hot.setDataAtCell(changes);
    }
    else if (type === "STYLE_CHANGE") {
      setCellStyles(prev => {
        const newStyles = { ...prev };
        payload.forEach(({ sheet, row, col, styleKey, newValue }) => {
          if (!newStyles[sheet]) newStyles[sheet] = {};
          const sheetObj = newStyles[sheet];
          let key = Object.keys(sheetObj).find(k => k !== "conditionalFormatting" && sheetObj[k].row === row && sheetObj[k].col === col);

          if (!key) {
            if (newValue !== undefined) {
              key = Object.keys(sheetObj).filter(k => k !== "conditionalFormatting").length.toString();
              sheetObj[key] = { row, col };
            }
          }

          if (key) {
            if (newValue === undefined) {
              delete sheetObj[key][styleKey];
            } else {
              sheetObj[key][styleKey] = newValue;
            }
          }
        });
        return newStyles;
      });
      hot.render();
      setIsDirty(true);
    }
    else if (type === "MERGE_CHANGE") {
      setMergedCells(prev => ({
        ...prev,
        [payload.sheet]: payload.newMergedCells
      }));
      setIsDirty(true);
    }
    else if (type === "CONDITIONAL_CHANGE") {
      setCellStyles(prev => {
        const next = { ...prev };
        payload.new.forEach(({ sheet, formatting }) => {
          next[sheet] = {
            ...next[sheet],
            conditionalFormatting: formatting
          };
        });
        return next;
      });
      hot.render();
      setIsDirty(true);
    }
    else if (type === "SHEET_ADD") {
      // Redo of Add = Add again
      const { sheet } = payload;
      setSheetData(prev => ({
        ...prev,
        [sheet]: Array(50).fill().map(() => Array(26).fill(""))
      }));
      setMergedCells(prev => ({ ...prev, [sheet]: [] }));
      setCellStyles(prev => ({ ...prev, [sheet]: [] }));
      setSheetNames(prev => [...prev, sheet]);
      setSelectedSheet(sheet);
      setIsDirty(true);
    }
    else if (type === "SHEET_DELETE") {
      // Redo of Delete = Delete
      const { sheet } = payload;
      setSheetNames(prev => prev.filter(s => s !== sheet));
      setSheetData(prev => {
        const u = { ...prev };
        delete u[sheet];
        return u;
      });
      setMergedCells(prev => {
        const u = { ...prev };
        delete u[sheet];
        return u;
      });
      setCellStyles(prev => {
        const u = { ...prev };
        delete u[sheet];
        return u;
      });
      setSelectedSheet(prev => prev === sheet ? sheetNames[0] : prev);
      setIsDirty(true);
    }
    else if (type === "SHEET_DUPLICATE") {
      // Redo Duplicate = Re-create duplicate
      const { sourceSheet, newSheet } = payload;

      setSheetData(prev => ({
        ...prev,
        [newSheet]: JSON.parse(JSON.stringify(prev[sourceSheet] || []))
      }));
      setMergedCells(prev => ({
        ...prev,
        [newSheet]: JSON.parse(JSON.stringify(mergedCells[sourceSheet] || []))
      }));
      setCellStyles(prev => ({
        ...prev,
        [newSheet]: JSON.parse(JSON.stringify(cellStyles[sourceSheet] || []))
      }));
      setSheetNames(prev => [...prev, newSheet]);
      setSelectedSheet(newSheet);
      setIsDirty(true);
    }

    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, action]);
  };

  return { trackChange, trackAction, handleUndo, handleRedo };
}
