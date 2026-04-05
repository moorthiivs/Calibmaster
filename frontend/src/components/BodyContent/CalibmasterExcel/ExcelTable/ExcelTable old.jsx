import React, {
  useRef,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { registerAllModules } from "handsontable/registry";
import { HotTable } from "@handsontable/react-wrapper";
//import "handsontable/dist/handsontable.full.min.css";

import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css'

import { HyperFormula, FunctionPlugin } from "hyperformula";
import config from "../../../../utils/config.json";
import { AuthContext } from "../../../../context/auth-context";
import "./excel.css";
import { textRenderer } from "handsontable/renderers";
import Handsontable from "handsontable";
import HeaderExcel from "./HeaderExcel";
import FooterExcel from "./FooterExcel";
import { message, Modal, Spin, Tooltip, Radio, InputNumber } from "antd";
import Loader from "../../../UI/Loader";
import ReactDOM from "react-dom/client";
import { useDispatch, useSelector } from "react-redux";
import ExcelPermissionModal from "./ExcelPermissionModal";
import CellFormatModal from "./CellFormatModal";
import RowHeightModal from "./RowHeightModal";
import ColumnWidthModal from "./ColumnWidthModal";
import PrintSettingsModal from "./PrintSettingsModal";
import { Typography } from "antd";
const { Text } = Typography;

registerAllModules();

import {
  convertFixedToRound,
  schemavalidation,
  normalize,
  cleanValue,
  normalizeKey,
  isDoubleBracePlaceholder,
  normalizePastedData,
  cleanRawPaste
} from "./utils/excelDataUtils";
import { sanitizeMergedCells } from "./utils/excelFormattingUtils";
import { shiftStyles, shiftMerges, shiftDecimalPrecisionMap } from "./utils/excelShiftUtils";
import { registerModePlugin, evaluateHFFormula } from "./utils/hyperFormulaUtils";
import { useExcelState } from "./hooks/useExcelState";
import { useExcelHistory } from "./hooks/useExcelHistory";
import { useExcelSelection } from "./hooks/useExcelSelection";
import { useExcelStyles } from "./hooks/useExcelStyles";
import { useExcelFormulas } from "./hooks/useExcelFormulas";
import { useExcelData } from "./hooks/useExcelData";
import { formatDate } from "date-fns/format";

registerModePlugin();

function ExcelTable({
  file,
  saveData,
  setCalculated,
  PrintonCertificate,
  SetPrintonCertificate,
  ObservationCertificate,
  setObservationCertificate,
  setisFileEdit,
  hiddenSheetName,
  srf_id,
  srf_item_id,
  addEquipmets
}) {

  const auth = useContext(AuthContext);

  const hotRef = useRef(null);

  const users = useSelector((state) => state.users.list);
  const dispatch = useDispatch();

  const excelState = useExcelState();
  const {
    sheetData, setSheetData,
    sheetNames, setSheetNames,
    selectedSheet, setSelectedSheet,
    mergedCells, setMergedCells,
    changes, setChanges,
    isDirty, setIsDirty,
    hyperFormulaInstance, setHyperFormulaInstance,
    permissionsMap, setPermissionsMap,
    isPermissionModalOpen, setIsPermissionModalOpen,
    cellStyles, setCellStyles,
    isBoldActive, setIsBoldActive,
    isLoaded, setisLoader,
    selectedCell, setSelectedCell,
    originalData, setOriginalData,
    undoStack, setUndoStack,
    redoStack, setRedoStack,
    goNoGoJson, setGoNoGoJson,
    DynamicGaugevalue, setDynamicGaugevalue,
    isRename, setisRename,
    colWidthModalVisible, setColWidthModalVisible,
    colWidthInput, setColWidthInput,
    activeColIndices, setActiveColIndices,
    rowHeightModalVisible, setRowHeightModalVisible,
    rowHeightInput, setRowHeightInput,
    activeRowIndices, setActiveRowIndices,
    decimalModalVisible, setDecimalModalVisible,
    decimalInput, setDecimalInput,
    activeCellCoords, setActiveCellCoords,
    selectionSource, setSelectionSource,
    settings, Setsettings,
    selectedHiddenSheets, setSelectedHiddenSheets,
    decimalPrecisionMap, setDecimalPrecisionMap,
    decimalPrecisionMapRef,
    highlightedCells, setHighlightedCells,
    SessionFileData, SetSessionFileData,
  } = excelState;

  const excelHistory = useExcelHistory(excelState, hotRef);
  const { trackChange, trackAction, handleUndo, handleRedo } = excelHistory;

  const { handleCellSelection } = useExcelSelection(excelState, hotRef, auth);

  const excelStyles = useExcelStyles(excelState, hotRef, excelHistory, handleCellSelection);
  const { handleMergeUnmerge, updateCellStyle, handleBold, handlealignstyle, handleColorChange, handleFontColorChange, handlecellformatting } = excelStyles;

  // Sync Handsontable plugins with React state (cellStyles)
  useEffect(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const sheetStyles = cellStyles[selectedSheet] || {};
    const colWidths = sheetStyles.colWidths || {};
    const rowHeights = sheetStyles.rowHeights || {};

    const colPlugin = hot.getPlugin('manualColumnResize');
    const rowPlugin = hot.getPlugin('manualRowResize');

    let needsRender = false;

    if (colPlugin) {
      const colCount = hot.countCols();
      for (let i = 0; i < colCount; i++) {
        const savedWidth = colWidths[i];
        const currentManual = colPlugin.setManualSize[i]; // Not quite right, using internal array check

        if (savedWidth !== undefined && savedWidth > 0) {
          colPlugin.setManualSize(i, savedWidth);
          needsRender = true;
        } else {
          // Reset to default if not in state
          colPlugin.setManualSize(i, undefined);
          needsRender = true;
        }
      }
    }

    if (rowPlugin) {
      const rowCount = hot.countRows();
      for (let i = 0; i < rowCount; i++) {
        const savedHeight = rowHeights[i];
        if (savedHeight !== undefined && savedHeight > 0) {
          rowPlugin.setManualSize(i, savedHeight);
          needsRender = true;
        } else {
          rowPlugin.setManualSize(i, undefined);
          needsRender = true;
        }
      }
    }

    if (needsRender) {
      hot.render();
    }
  }, [cellStyles, selectedSheet]);

  const excelFormulas = useExcelFormulas(excelState, hotRef);
  const { handleFormulaChange, handleFormulaSubmit, checkAndSyncReferenceDecimal } = excelFormulas;

  const excelDataProps = { file, saveData, setCalculated, setisFileEdit, hiddenSheetName, srf_id, srf_item_id };
  const excelDataHook = useExcelData(excelState, hotRef, auth, excelDataProps);
  const { handleSave, fetechExcelData } = excelDataHook;
  const placeholderRegistry = useRef({});


  const equipmentParams = useMemo(() => {
    const params = {};

    if (!addEquipmets) return params;

    const safeFormat = (dateVal) => {
      if (!dateVal) return "N/A";
      try {
        return formatDate(new Date(dateVal), "dd-MM-yyyy");
      } catch (error) {
        return dateVal;
      }
    };

    addEquipmets.forEach((eq, index) => {
      const i = index + 1;

      // Object.entries(eq).forEach(([key, value]) => {
      //   params[`master_${i}_${key}`] = value ?? "";
      // });

      params[`master_${i}_name`] = eq.name_of_equipment || "N/A";
      params[`master_${i}_uid`] = eq.uid || "N/A";
      params[`master_${i}_range`] = eq.range || "N/A";
      params[`master_${i}_resolution`] = eq.least_Count || "N/A";
      params[`master_${i}_accuracy`] = eq.accuracy || "N/A";
      params[`master_${i}_uncertainty`] = eq.uncertainty || "N/A";
      params[`master_${i}_valid_upto`] = safeFormat(eq.calibration_valid_upto);

      params[`master_${i}_traceability`] =
        `${eq.traceability || ""} and Vide certificate no: ${eq.calibration_certificate_no || ""}
Calibrated On: ${safeFormat(eq.date_of_last_calibration_date)}
Valid Upto ${safeFormat(eq.calibration_valid_upto)}`;
    });


    return params;
  }, [addEquipmets]);

  // useEffect(() => {
  //   if (!hyperFormulaInstance || !sheetData || !DynamicGaugevalue) return;

  //   const arr = Array.isArray(DynamicGaugevalue)
  //     ? DynamicGaugevalue
  //     : [DynamicGaugevalue];

  //   let hasChanged = false;
  //   const updatedSheets = {};

  //   Object.entries(sheetData).forEach(([sheetName, sheetRows]) => {
  //     const sheetIndex = hyperFormulaInstance.getSheetId(sheetName);
  //     if (sheetIndex === null) return;

  //     const data = sheetRows.map(row => [...row]);
  //     let sheetUpdated = false;


  //     arr.forEach(item => {
  //       Object.entries(item).forEach(([key, rawValue]) => {
  //         const cleanedValue = cleanValue(rawValue);

  //         for (let r = 0; r < data.length; r++) {
  //           for (let c = 0; c < data[r].length; c++) {
  //             const cell = data[r][c];

  //             // Match {{ranges/lc}}
  //             if (isDoubleBracePlaceholder(cell, key)) {
  //               if (data[r][c] !== cleanedValue) {
  //                 data[r][c] = cleanedValue;
  //                 sheetUpdated = true;
  //                 hasChanged = true;
  //               }
  //             }
  //           }
  //         }
  //       });
  //     });

  //     if (sheetUpdated) {
  //       updatedSheets[sheetName] = data;
  //     }
  //   });

  //   if (hasChanged) {
  //     setSheetData(prev => ({
  //       ...prev,
  //       ...updatedSheets
  //     }));
  //   }
  // }, [hyperFormulaInstance, DynamicGaugevalue]);


  useEffect(() => {
    if (!hyperFormulaInstance || !sheetData) return;

    const gaugeArr = Array.isArray(DynamicGaugevalue)
      ? DynamicGaugevalue
      : (DynamicGaugevalue ? [DynamicGaugevalue] : []);
    const arr = [...gaugeArr, equipmentParams];

    let hasChanged = false;
    const updatedSheets = {};

    let stylesChanged = false;
    const updatedStyles = JSON.parse(JSON.stringify(cellStyles || {}));

    Object.entries(sheetData).forEach(([sheetName, sheetRows]) => {
      const sheetIndex = hyperFormulaInstance.getSheetId(sheetName);
      if (sheetIndex === null) return;
      const data = sheetRows.map(row => [...row]);
      let sheetUpdated = false;

      if (!updatedStyles[sheetName]) updatedStyles[sheetName] = {};
      const sheetStyles = updatedStyles[sheetName];

      // 1. Scan the sheet for NEW placeholders
      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < data[r].length; c++) {
          const cell = data[r][c];

          if (typeof cell === "string" && cell.includes("{{") && cell.includes("}}")) {

            // Look for an existing style object for this specific row and column
            let existingStyleKey = Object.keys(sheetStyles).find(
              (k) => sheetStyles[k]?.row === r && sheetStyles[k]?.col === c
            );

            // If it doesn't exist, create a new one. If it does, we use the existing key!
            if (!existingStyleKey) {
              existingStyleKey = `${r}-${c}`;
              sheetStyles[existingStyleKey] = { row: r, col: c };
            }

            // Safely append the template without deleting existing colors or bolding
            if (sheetStyles[existingStyleKey].originalTemplate !== cell) {
              sheetStyles[existingStyleKey].originalTemplate = cell;
              stylesChanged = true;
            }
          }
        }
      }

      // 2. Now use the templates stored in cellStyles to update the cell values
      // We use Object.values to easily loop through the style objects
      // Object.values(sheetStyles).forEach((style) => {
      //   if (style && style.originalTemplate && typeof style.row === "number" && typeof style.col === "number") {
      //     const r = style.row;
      //     const c = style.col;

      //     let newCellValue = style.originalTemplate;

      //     arr.forEach(item => {
      //       if (!item || Object.keys(item).length === 0) return;

      //       Object.entries(item).forEach(([propKey, rawValue]) => {
      //         const placeholder = `{{${propKey}}}`;
      //         if (newCellValue.includes(placeholder)) {
      //           newCellValue = newCellValue.replaceAll(placeholder, cleanValue(rawValue));
      //         }
      //       });
      //     });

      //     // Update the table data safely
      //     if (data[r] !== undefined && data[r][c] !== undefined) {
      //       if (data[r][c] !== newCellValue) {
      //         data[r][c] = newCellValue;
      //         sheetUpdated = true;
      //         hasChanged = true;
      //       }
      //     }
      //   }
      // });


      // 2. Now use the templates stored in cellStyles to update the cell values
      Object.values(sheetStyles).forEach((style) => {
        if (style && style.originalTemplate && typeof style.row === "number" && typeof style.col === "number") {
          const r = style.row;
          const c = style.col;

          let newCellValue = style.originalTemplate;
          const isFormula = newCellValue.trim().startsWith("=");

          arr.forEach(item => {
            if (!item || Object.keys(item).length === 0) return;

            Object.entries(item).forEach(([propKey, rawValue]) => {
              // Create a CASE-INSENSITIVE regular expression for the placeholder
              // This allows {{Range1}}, {{range1}}, or {{RANGE1}} to all work!
              const placeholderRegex = new RegExp(`\\{\\{${propKey}\\}\\}`, "gi");

              if (newCellValue.match(placeholderRegex)) {
                let safeValue = cleanValue(rawValue);

                // Formula Safeguard: If inside a formula and the value is completely empty, 
                // replace it with 0 so the math doesn't crash. 
                // (Skip this if you intentionally want empty strings in CONCATENATE formulas)
                if (isFormula && (safeValue === "" || safeValue === null || safeValue === undefined)) {
                  safeValue = 0;
                }

                newCellValue = newCellValue.replace(placeholderRegex, safeValue);
              }
            });
          });

          // Update the table data safely
          if (data[r] !== undefined && data[r][c] !== undefined) {
            if (data[r][c] !== newCellValue) {
              data[r][c] = newCellValue;
              sheetUpdated = true;
              hasChanged = true;

              try {
                hyperFormulaInstance.setCellContents(
                  { sheet: sheetIndex, row: r, col: c },
                  [[newCellValue]]
                );
              } catch (e) {
                console.warn("HyperFormula sync skipped for cell:", e);
              }
            }
          }
        }
      });

      if (sheetUpdated) {
        updatedSheets[sheetName] = data;
      }
    });

    // 3. Save the updated templates to cellStyles
    if (stylesChanged) {
      setCellStyles(updatedStyles);
      setIsDirty(true);
    }

    if (hasChanged) {
      setSheetData(prev => ({
        ...prev,
        ...updatedSheets
      }));

      setTimeout(() => {
        if (hotRef.current && hotRef.current.hotInstance) {
          hotRef.current.hotInstance.render();
        }
      }, 50);
    }

  }, [hyperFormulaInstance, DynamicGaugevalue, equipmentParams]);


  useEffect(() => {
    if (hyperFormulaInstance) {
      const stats = hyperFormulaInstance.getStats();

    }
  }, [hyperFormulaInstance]);




  useEffect(() => {
    if (hotRef.current && selectedSheet) {
      const hotInstance = hotRef.current.hotInstance;
      if (hotInstance) {
        const merged = mergedCells[selectedSheet] || [];

        // ✅ Sanitize merges before applying
        const safeMerged = sanitizeMergedCells(merged);

        hotInstance.updateSettings({
          mergeCells: safeMerged
        });

        hotInstance.render();
      }
    }
  }, [selectedSheet, mergedCells]);



  const handleSetCellMeta = (row, col, key, value) => {
    if (value === true) return;

    setCellStyles((prevCellStyles) => {
      const updatedStyles = { ...prevCellStyles };

      if (!updatedStyles[selectedSheet]) {
        updatedStyles[selectedSheet] = { conditionalFormatting: [] };
      }

      const sheetStyle = { ...updatedStyles[selectedSheet] };

      // ✅ UNIFIED ID GENERATION: row-col
      const existingKey = Object.keys(sheetStyle).find(
        (k) => sheetStyle[k]?.row === row && sheetStyle[k]?.col === col
      );

      if (existingKey) {
        sheetStyle[existingKey] = {
          ...sheetStyle[existingKey],
          [key]: value,
        };
      } else {
        const newKey = `${row}-${col}`;
        sheetStyle[newKey] = {
          row,
          col,
          [key]: value,
        };
      }

      updatedStyles[selectedSheet] = sheetStyle;
      return updatedStyles;
    });

    setIsDirty(true);
  };

  const addNewSheet = () => {
    const newSheetName = `Sheet${sheetNames.length + 1}`;
    setSheetData((prev) => ({
      ...prev,
      [newSheetName]: Array(50)
        .fill()
        .map(() => Array(26).fill("")),
    }));
    setMergedCells((prev) => ({ ...prev, [newSheetName]: [] }));
    setCellStyles((prev) => ({ ...prev, [newSheetName]: [] }));
    setSheetNames((prev) => [...prev, newSheetName]);
    setSelectedSheet(newSheetName);
    setIsDirty(true);

    trackAction({
      type: "SHEET_ADD",
      payload: { sheet: newSheetName }
    });
  };


  const duplicateSheet = (sheetName) => {
    const newSheetName = `${sheetName}_Copy`;
    const sourceData = JSON.parse(JSON.stringify(sheetData[sheetName] || []));
    const sourceMerges = JSON.parse(JSON.stringify(mergedCells[sheetName] || []));
    const sourceStyles = JSON.parse(JSON.stringify(cellStyles[sheetName] || {}));

    setSheetData(prev => ({
      ...prev,
      [newSheetName]: sourceData
    }));
    setMergedCells(prev => ({
      ...prev,
      [newSheetName]: sourceMerges
    }));
    setCellStyles(prev => ({
      ...prev,
      [newSheetName]: sourceStyles
    }));
    setSheetNames(prev => [...prev, newSheetName]);
    setSelectedSheet(newSheetName);
    setIsDirty(true);

    trackAction({
      type: "SHEET_DUPLICATE",
      payload: { sourceSheet: sheetName, newSheet: newSheetName }
    });
  };

  const deleteSelectedSheet = () => {
    if (sheetNames.length === 1) {
      alert("You must have at least one sheet.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedSheet}"?`
    );

    if (!confirmDelete) return;

    // 📦 BACKUP DATA FOR UNDO
    const backup = {
      sheet: selectedSheet,
      data: sheetData[selectedSheet],
      merges: mergedCells[selectedSheet],
      styles: cellStyles[selectedSheet],
      // preserve distinct index if needed, but append to end on restore is safer
    };

    trackAction({
      type: "SHEET_DELETE",
      payload: backup
    });
    setSheetNames((prev) => prev.filter((sheet) => sheet !== selectedSheet));

    setSheetData((prev) => {
      const updated = { ...prev };
      delete updated[selectedSheet];
      return updated;
    });

    setMergedCells((prev) => {
      const updated = { ...prev };
      delete updated[selectedSheet];
      return updated;
    });

    setCellStyles((prev) => {
      const updated = { ...prev };
      delete updated[selectedSheet];
      return updated;
    });

    // Select another sheet after deletion
    setSelectedSheet(
      sheetNames.find((sheet) => sheet !== selectedSheet) || sheetNames[0]
    );
    setIsDirty(true);
  };





  const handleZoomIn = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const newScale = Math.min((hot.rootElement.style.zoom || 1) * 1.1, 2);
      hot.rootElement.style.zoom = newScale;
    }
  };
  const handleZoomOut = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const newScale = Math.max((hot.rootElement.style.zoom || 1) * 0.9, 0.5);
      hot.rootElement.style.zoom = newScale;
    }
  };

  const handleZoomReset = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      hot.rootElement.style.zoom = 1;
      hot.updateSettings({ width: "auto", height: "auto" });
    }
  };



  const afterChange = useCallback((changes, source) => {
    if (!changes) return;
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    // Ignore system events
    const ignoredSources = [
      "loadData",
      "spliceRow",
      "spliceCol",
      "insertRow",
      "removeRow",
      "insertCol",
      "removeCol",
      "mergeCells",
      "unmergeCells"
    ];

    if (ignoredSources.includes(source)) return;

    // Handle only user edits (ignore loadData, etc.)
    if (source === "edit" || source === "Autofill.fill" || source === "CopyPaste.paste") {
      const newActions = changes
        .map(([row, col, oldValue, newValue]) => {
          if (oldValue !== newValue) {
            return { row, col, oldValue, newValue, sheet: selectedSheet };
          }
          return null;
        })
        .filter((action) => action !== null);

      // Track these changes
      newActions.forEach((action) => {
        trackChange(action)

        const sourceValue = hot.getSourceDataAtCell(action.row, action.col);

        if (typeof sourceValue === "string" && sourceValue.trim().startsWith("=")) {
          checkAndSyncReferenceDecimal(sourceValue, action.row, action.col);
        }

      });
      
      // 🟢 FIX: Clear 'originalTemplate' if the user manually entered a non-placeholder value.
      // This prevents the system from overwriting the manual edit on next render or save.
      if (newActions.length > 0) {
        setCellStyles((prevCellStyles) => {
          const sheetStyle = prevCellStyles[selectedSheet];
          if (!sheetStyle) return prevCellStyles;

          let hasChanges = false;
          const updatedSheetStyle = { ...sheetStyle };

          newActions.forEach((action) => {
            const isPlaceholder = typeof action.newValue === "string" && action.newValue.includes("{{") && action.newValue.includes("}}");
            if (!isPlaceholder) {
              const existingKey = Object.keys(updatedSheetStyle).find(
                (k) => updatedSheetStyle[k]?.row === action.row && updatedSheetStyle[k]?.col === action.col
              );
              if (existingKey && updatedSheetStyle[existingKey]?.originalTemplate) {
                updatedSheetStyle[existingKey] = { 
                  ...updatedSheetStyle[existingKey] 
                };
                delete updatedSheetStyle[existingKey].originalTemplate;
                hasChanges = true;
              }
            }
          });

          return hasChanges ? { ...prevCellStyles, [selectedSheet]: updatedSheetStyle } : prevCellStyles;
        });
      }


      // Mark sheet as dirty
      if (newActions.length > 0) {
        trackAction({
          type: "CELL_EDIT",
          payload: newActions
        });
        setIsDirty(true);

        // Only re-render if editor is NOT open. Re-rendering while editing kills editor.
        const activeEditor = hot.getActiveEditor();
        const isEditingNow = activeEditor?.isOpened?.();
        if (!isEditingNow) {
          // requestAnimationFrame is okay — but ensure no React state is set inside renderer
          requestAnimationFrame(() => {
            try {
              // Batch data updates to avoid full table re-render
              hot.batch(() => {
                hot.render();
              });
            } catch (err) {
              console.error("hot.render error:", err);
            }
          });
        }
      }
    }
  }, [selectedSheet, trackAction, trackChange, checkAndSyncReferenceDecimal, setIsDirty]);






  const handleSelectChange = (e, type) => {
    try {
      //const selectedValue = e.target.value;
      const selectedValue = e;
      const selectedOption = sheetNames
        .map((name) => ({ label: name, value: name }))
        .find((option) => option.value === selectedValue);

      if (type === "calibration" && SetPrintonCertificate) {
        SetPrintonCertificate(selectedOption);
        setIsDirty(true);
      }
      else if (type === "observation" && setObservationCertificate) {
        setObservationCertificate(selectedOption);
        setIsDirty(true);
      }


    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    try {
      if (isDirty && setisFileEdit) {
        setisFileEdit(true);
        return;
      }
      if (!isDirty && setisFileEdit) {
        setisFileEdit(false);
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        try {
          event.preventDefault();
          event.returnValue = ""; // Required for browser confirmation
        } catch (error) {
          console.log(error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // ─── Autosave ────────────────────────────────────────────────────────────────
  // Keep a ref to handleSave so changing settings doesn't need it as a dependency
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    if (!settings.autoSave) return; // autosave disabled — do nothing

    const intervalMs = (settings.autoSaveInterval || 30) * 1000;

    const timer = setInterval(() => {
      if (isDirty) {
        handleSaveRef.current();
        message.success({
          content: "Auto saved ✓",
          duration: 2,
          key: "autosave-toast",
        });
      }
    }, intervalMs);

    return () => clearInterval(timer); // cleanup on setting change / unmount
  }, [settings.autoSave, settings.autoSaveInterval, isDirty]);
  // ─────────────────────────────────────────────────────────────────────────────


  const handleRenameSheet = (newSheetName) => {
    try {
      const oldSheetName = selectedSheet;

      // Update the sheet names
      setSheetNames((prev) =>
        prev.map((sheet) => (sheet === oldSheetName ? newSheetName : sheet))
      );


      const migrateMap = (prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (updated[oldSheetName] !== undefined) {
          updated[newSheetName] = updated[oldSheetName];
          delete updated[oldSheetName];
        }
        return updated;
      };

      // Update all metadata maps mapped by sheet name
      setSheetData(migrateMap);
      setMergedCells(migrateMap);
      setCellStyles(migrateMap);

      if (typeof setDecimalPrecisionMap === "function") setDecimalPrecisionMap(migrateMap);
      if (typeof setPermissionsMap === "function") setPermissionsMap(migrateMap);
      if (typeof setSheetErrorMap === "function") setSheetErrorMap(migrateMap);
      // Update the selected sheet
      setSelectedSheet(newSheetName);

      // Update references in formulas
      updateReferencesInFormulas(
        hyperFormulaInstance,
        oldSheetName,
        newSheetName
      );

      // Trigger recalculation
      hyperFormulaInstance.rebuildAndRecalculate();
      hotRef.current?.hotInstance.render();
    } catch (error) {
      console.log(error);
    }

  };
  const updateReferencesInFormulas = (
    hfInstance,
    oldSheetName,
    newSheetName
  ) => {
    try {
      const allSheetNames = hfInstance.getSheetNames();

      // Escape new name if needed (add single quotes for special cases)
      const escapeSheetName = (name) => {
        return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `'${name}'`;
      };

      const escapedOldName = escapeSheetName(oldSheetName);
      const escapedNewName = escapeSheetName(newSheetName);

      allSheetNames.forEach((sheet) => {
        const sheetId = hfInstance.getSheetId(sheet);
        const { width, height } = hfInstance.getSheetDimensions(sheetId);

        for (let row = 0; row < height; row++) {
          for (let col = 0; col < width; col++) {
            const formula = hfInstance.getCellFormula({
              sheet: sheetId,
              col,
              row,
            });

            if (formula && formula.includes(`${escapedOldName}!`)) {
              const updatedFormula = formula.replace(
                new RegExp(`\\b${escapedOldName}!`, "g"),
                `${escapedNewName}!`
              );
              hfInstance.setCellContents({ sheet: sheetId, col, row }, [
                [`${updatedFormula}`],
              ]);
            }
          }
        }
      });

      setIsDirty(true);
    } catch (error) {

      console.log(error);

    }

  };

  const [enableFormulas, setEnableFormulas] = useState(true);

  useEffect(() => {
    setEnableFormulas(false);
    const timer = setTimeout(() => setEnableFormulas(true), 200);
    return () => clearTimeout(timer);
  }, [selectedSheet]);

  const handleHiddenChange = (selectedOptions) => {

    //const selectedValues = selectedOptions.map((option) => option.value); // or option.name
    setSelectedHiddenSheets(selectedOptions);
    setIsDirty(true);
  };



  const handleDecimalIncrease = () => {
    try {
      const hot = hotRef.current?.hotInstance;
      const selection = hot?.getSelected();

      if (!hot || !selection || selection.length === 0) {
        alert("Please select cells first");
        return;
      }

      let activeCellPrecision = null;
      const [selRow, selCol] = selection[0]; // Active cell usually at the start of selection range or handle separately

      setDecimalPrecisionMap((prev) => {
        const updatedMap = { ...prev };
        const sheetMap = { ...(prev[selectedSheet] || {}) };
        const updatesToApply = [];
        let hasChange = false;

        // selection.forEach((range) => {
        //   const [startRow, startCol, endRow, endCol] = range;

        //   for (let row = startRow; row <= endRow; row++) {
        //     for (let col = startCol; col <= endCol; col++) {
        //       const meta = hot.getCellMeta(row, col);
        //       const maxLimit = meta.decimalMaxLimit !== undefined && meta.decimalMaxLimit !== null ? meta.decimalMaxLimit : 20;

        //       const cellKey = `${row}-${col}`;
        //       let current = sheetMap[cellKey] ?? meta.decimalPrecision;

        //       if (current === undefined || current === null) {
        //         const rawVal = hot.getDataAtCell(row, col);
        //         if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
        //           const strVal = String(rawVal).trim();
        //           const num = Number(strVal);
        //           if (!isNaN(num) && strVal !== "") {
        //             // Count exact digits after decimal point in string
        //             //current = strVal.includes('.') ? strVal.split('.')[1].length : 0;
        //             current = 3;
        //           } else {
        //             current = 3;
        //           }
        //         } else {
        //           current = 3;
        //         }
        //       }

        //       if (current < maxLimit) {
        //         const updatedPrecision = current + 1;
        //         hot.setCellMeta(row, col, "decimalPrecision", updatedPrecision);
        //         sheetMap[cellKey] = updatedPrecision;
        //         hasChange = true;

        //         // Active data override
        //         const sourceVal = hot.getSourceDataAtCell(row, col);
        //         const isFormula = typeof sourceVal === "string" && sourceVal.startsWith("=");

        //         if (!isFormula) {
        //           const rawVal = hot.getDataAtCell(row, col);
        //           if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
        //             const numericVal = Number(rawVal);
        //             if (!isNaN(numericVal)) {
        //               updatesToApply.push([row, col, numericVal.toFixed(updatedPrecision)]);
        //             }
        //           }
        //         }
        //       }
        //     }
        //   }
        // });
        selection.forEach((range) => {
          // Handle backwards selections and ignore headers (-1)
          const startRow = Math.max(0, Math.min(range[0], range[2]));
          const endRow = Math.max(range[0], range[2]);
          const startCol = Math.max(0, Math.min(range[1], range[3]));
          const endCol = Math.max(range[1], range[3]);

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const meta = hot.getCellMeta(row, col);
              //const maxLimit = meta.decimalMaxLimit !== undefined && meta.decimalMaxLimit !== null ? meta.decimalMaxLimit : 20;
              const maxLimit = Infinity;

              const cellKey = `${row}-${col}`;
              let current = sheetMap[cellKey] ?? meta.decimalPrecision;

              if (current === undefined || current === null) {
                const rawVal = hot.getSourceDataAtCell(row, col);
                if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
                  const strVal = String(rawVal).trim();
                  const num = Number(strVal);
                  if (!isNaN(num) && strVal !== "") {
                    current = strVal.includes('.') ? strVal.split('.')[1].length : 0;
                  } else {
                    current = 3;
                  }
                } else {
                  current = 3;
                }
              }

              if (current < maxLimit) {
                const updatedPrecision = current + 1;
                hot.setCellMeta(row, col, "decimalPrecision", updatedPrecision);
                sheetMap[cellKey] = updatedPrecision;
                hasChange = true;
                // ✅ Do NOT call setDataAtCell — only update display meta so original value is preserved
              }
            }
          }
        });

        if (hasChange) {
          hot.render(); // Re-render so cell renderers pick up new decimalPrecision
        }

        // Update UI for the active selected cell
        // const activeKey = `${selRow}-${selCol}`;
        // if (sheetMap[activeKey] !== undefined) {
        //   activeCellPrecision = sheetMap[activeKey];
        // } else {
        //   activeCellPrecision = hot.getCellMeta(selRow, selCol).decimalPrecision || 2;
        // }
        const safeSelRow = Math.max(0, selRow);
        const safeSelCol = Math.max(0, selCol);
        const activeKey = `${safeSelRow}-${safeSelCol}`;

        if (sheetMap[activeKey] !== undefined) {
          activeCellPrecision = sheetMap[activeKey];
        } else {
          activeCellPrecision = hot.getCellMeta(safeSelRow, safeSelCol).decimalPrecision || 2;
        }

        if (hasChange) {
          updatedMap[selectedSheet] = sheetMap;
          return updatedMap;
        }
        return prev; // Return unchanged if no limit was increased
      });

      // Update selectedCell state immediately for UI response
      if (activeCellPrecision !== null) {
        setSelectedCell(prev => ({ ...prev, decimalPrecision: activeCellPrecision }));
      }
    } catch (error) {

      console.log(error);

    }

  };

  const handleDecimalDecrease = () => {
    try {
      const hot = hotRef.current?.hotInstance;
      const selection = hot?.getSelected();

      if (!hot || !selection || selection.length === 0) {
        alert("Please select cells first");
        return;
      }

      let activeCellPrecision = null;
      const [selRow, selCol] = selection[0];

      setDecimalPrecisionMap((prev) => {
        const updatedMap = { ...prev };
        const sheetMap = { ...(prev[selectedSheet] || {}) };
        const updatesToApply = [];
        let hasChange = false;

        // selection.forEach((range) => {
        //   const [startRow, startCol, endRow, endCol] = range;

        //   for (let row = startRow; row <= endRow; row++) {
        //     for (let col = startCol; col <= endCol; col++) {
        //       const meta = hot.getCellMeta(row, col);
        //       const cellKey = `${row}-${col}`;
        //       const current = sheetMap[cellKey];
        //       let basePrecision =
        //         typeof current === "number"
        //           ? current
        //           : meta.decimalPrecision;

        //       if (basePrecision === undefined || basePrecision === null) {
        //         const rawVal = hot.getDataAtCell(row, col);
        //         if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
        //           const strVal = String(rawVal).trim();
        //           const num = Number(strVal);
        //           if (!isNaN(num) && strVal !== "") {
        //             basePrecision = strVal.includes('.') ? strVal.split('.')[1].length : 0;
        //           } else {
        //             basePrecision = 2;
        //           }
        //         } else {
        //           basePrecision = 2;
        //         }
        //       }

        //       if (basePrecision > 0) {
        //         const updatedPrecision = basePrecision - 1;
        //         hot.setCellMeta(row, col, "decimalPrecision", updatedPrecision);
        //         sheetMap[cellKey] = updatedPrecision;
        //         hasChange = true;

        //         // Active data override
        //         const sourceVal = hot.getSourceDataAtCell(row, col);
        //         const isFormula = typeof sourceVal === "string" && sourceVal.startsWith("=");

        //         if (!isFormula) {
        //           const rawVal = hot.getDataAtCell(row, col);
        //           if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
        //             const numericVal = Number(rawVal);
        //             if (!isNaN(numericVal)) {
        //               updatesToApply.push([row, col, numericVal.toFixed(updatedPrecision)]);
        //             }
        //           }
        //         }
        //       }
        //     }
        //   }
        // });
        selection.forEach((range) => {
          // Handle backwards selections and ignore headers (-1)
          const startRow = Math.max(0, Math.min(range[0], range[2]));
          const endRow = Math.max(range[0], range[2]);
          const startCol = Math.max(0, Math.min(range[1], range[3]));
          const endCol = Math.max(range[1], range[3]);

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const meta = hot.getCellMeta(row, col);
              const cellKey = `${row}-${col}`;
              const current = sheetMap[cellKey];
              let basePrecision =
                typeof current === "number"
                  ? current
                  : meta.decimalPrecision;

              if (basePrecision === undefined || basePrecision === null) {
                const rawVal = hot.getSourceDataAtCell(row, col);
                if (rawVal !== null && rawVal !== undefined && rawVal !== "") {
                  const strVal = String(rawVal).trim();
                  const num = Number(strVal);
                  if (!isNaN(num) && strVal !== "") {
                    basePrecision = strVal.includes('.') ? strVal.split('.')[1].length : 0;
                  } else {
                    basePrecision = 2;
                  }
                } else {
                  basePrecision = 2;
                }
              }

              if (basePrecision > 0) {
                const updatedPrecision = basePrecision - 1;
                hot.setCellMeta(row, col, "decimalPrecision", updatedPrecision);
                sheetMap[cellKey] = updatedPrecision;
                hasChange = true;
                // ✅ Do NOT call setDataAtCell — only update display meta so original value is preserved
              }
            }
          }
        });

        if (hasChange) {
          hot.render(); // Re-render so cell renderers pick up new decimalPrecision
        }

        // Get new precision for active cell
        // const activeKey = `${selRow}-${selCol}`;
        // activeCellPrecision = sheetMap[activeKey] !== undefined ? sheetMap[activeKey] : (hot.getCellMeta(selRow, selCol).decimalPrecision || 2);

        const safeSelRow = Math.max(0, selRow);
        const safeSelCol = Math.max(0, selCol);
        const activeKey = `${safeSelRow}-${safeSelCol}`;

        if (sheetMap[activeKey] !== undefined) {
          activeCellPrecision = sheetMap[activeKey];
        } else {
          activeCellPrecision = hot.getCellMeta(safeSelRow, safeSelCol).decimalPrecision || 2;
        }
        if (hasChange) {
          updatedMap[selectedSheet] = sheetMap;
          return updatedMap;
        }
        return prev;
      });

      if (activeCellPrecision !== null) {
        setSelectedCell(prev => ({ ...prev, decimalPrecision: activeCellPrecision }));
      }
    } catch (error) {

      console.log(error);

    }

  };


  const syncHyperFormulaRows = (type, index, amount = 1) => {
    if (!hyperFormulaInstance || !selectedSheet) return;
    if (typeof index !== 'number' || index < 0) return;

    try {
      let sheetId = hyperFormulaInstance.getSheetId(selectedSheet);

      if (sheetId === undefined || sheetId === null) {
        hyperFormulaInstance.addSheet(selectedSheet);
        sheetId = hyperFormulaInstance.getSheetId(selectedSheet);
      }

      if (typeof sheetId !== "number" || isNaN(sheetId)) return;

      const safeAmount = Number(amount) || 1;

      // ✅ CORRECT USAGE
      if (type === "insert") {
        hyperFormulaInstance.addRows(sheetId, index, safeAmount);
        //hyperFormulaInstance.addRows(sheetId, [index, safeAmount]);
      } else if (type === "remove") {
        hyperFormulaInstance.removeRows(sheetId, index, safeAmount);
        //hyperFormulaInstance.removeRows(sheetId, [index, safeAmount]);
      }
    } catch (err) {
      console.error("HyperFormula row sync error:", err);
    }
  };




  const syncHyperFormulaCols = (type, index, amount = 1) => {
    if (!hyperFormulaInstance || !selectedSheet) return;

    try {
      let sheetId = hyperFormulaInstance.getSheetId(selectedSheet);

      if (sheetId === undefined || sheetId === null) {
        hyperFormulaInstance.addSheet(selectedSheet);
        sheetId = hyperFormulaInstance.getSheetId(selectedSheet);
      }

      if (typeof sheetId !== "number" || isNaN(sheetId)) {
        console.warn("⚠️ Invalid HyperFormula sheetId:", selectedSheet, sheetId);
        return;
      }

      // ✅ CORRECT USAGE
      if (type === "insert") {
        hyperFormulaInstance.addColumns(sheetId, index, amount);
        //hyperFormulaInstance.addColumns(sheetId, [index, amount]);
      } else if (type === "remove") {
        hyperFormulaInstance.removeColumns(sheetId, index, amount);
        //hyperFormulaInstance.removeColumns(sheetId, [index, amount]);
      }
    } catch (err) {
      console.error("HyperFormula col sync error:", err);
    }
  };


  const [isnotSave, setisnotSave] = useState(false);
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const renderErrorRef = useRef(false);

  const [sheetErrorMap, setSheetErrorMap] = useState({});



  const safeMergedCells = useMemo(() => {
    const currentSheetData = sheetData[selectedSheet] || [];
    const totalRows = currentSheetData.length;
    const totalCols = currentSheetData[0]?.length || 0;

    return (mergedCells[selectedSheet] || []).filter(m =>
      m &&
      Number.isInteger(m.row) &&
      Number.isInteger(m.col) &&
      Number.isInteger(m.rowspan) &&
      Number.isInteger(m.colspan) &&
      m.rowspan > 0 &&
      m.colspan > 0 &&
      // Boundary checks
      m.row >= 0 &&
      m.col >= 0 &&
      m.row + m.rowspan <= totalRows &&
      m.col + m.colspan <= totalCols
    );
  }, [mergedCells, selectedSheet, sheetData]);

  const formulasConfig = useMemo(() => ({
    engine: hyperFormulaInstance,
    sheetName: selectedSheet,
  }), [hyperFormulaInstance, selectedSheet]);



  const pendingUpdatesRef = useRef(new Map());
  const updateTimeoutRef = useRef(null);

  const scheduleConditionalUpdate = useCallback((sheetName, row, col, newValue, targetRule) => {
    const key = `${sheetName}-${row}-${col}`;

    // Store update in map (deduplicates multiple updates for same cell)
    pendingUpdatesRef.current.set(key, { sheetName, row, col, newValue, targetRule });

    if (!updateTimeoutRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        const updates = Array.from(pendingUpdatesRef.current.values());

        // Clear queue immediately
        pendingUpdatesRef.current.clear();
        updateTimeoutRef.current = null;

        if (updates.length === 0) return;

        setCellStyles((prev) => {
          const next = JSON.parse(JSON.stringify(prev));
          let hasChanges = false;

          updates.forEach(({ sheetName, row, col, newValue, targetRule }) => {
            const rules = next[sheetName]?.conditionalFormatting || [];

            const idx = rules.findIndex(
              (r) =>
                r.row === row &&
                r.col === col &&
                r.condition?.operator === targetRule.condition?.operator &&
                JSON.stringify(r.condition?.CenterRef) ===
                JSON.stringify(targetRule.condition?.CenterRef)
            );

            if (idx >= 0) {
              if (rules[idx].condition.CenterValue !== newValue) {
                rules[idx].condition.CenterValue = newValue;
                hasChanges = true;
              }
            }
          });

          return hasChanges ? next : prev;
        });
      }, 100);
    }
  }, []);



  /**
   * Shifts merged cell coordinates when rows or columns are inserted/removed.
   *
   * @param {Array} merges - Array of merge objects {row, col, rowspan, colspan}
   * @param {number} startIndex - Row/col index where insertion/removal starts
   * @param {number} amount - Number of rows/cols inserted/removed
   * @param {"insert"|"remove"} type - Operation type
   * @param {"row"|"col"} dimension - Which dimension changed
   * @returns {Array} Updated merges
   */
  const initialSheetSetRef = useRef(false);

  useEffect(() => {
    if (initialSheetSetRef.current) return;
    if (!sheetData || Object.keys(sheetData).length === 0) return;

    const sheetNames = Object.keys(sheetData);

    const initialSheet =
      sheetNames.find(name =>
        /^(obs|observation)$/i.test(name.trim()) ||
        name.toLowerCase().includes("observation") ||
        name.toLowerCase().includes("observations") ||
        name.toLowerCase().includes("obs")
      ) || sheetNames[0];

    setSelectedSheet(initialSheet);
    initialSheetSetRef.current = true;
  }, [sheetData]);



  // ✅ OPTIMIZATION: Create O(1) Lookup Maps
  const styleLookup = useMemo(() => {
    const sheetStyles = cellStyles[selectedSheet] || {};
    const lookup = {};
    Object.entries(sheetStyles).forEach(([key, style]) => {
      // styles might be stored as numeric keys or direct objects, handle standard format
      if (key === "conditionalFormatting") return;
      if (style && typeof style.row === "number" && typeof style.col === "number") {
        lookup[`${style.row}-${style.col}`] = style;
      }
    });
    return lookup;
  }, [cellStyles, selectedSheet]);

  const conditionalLookup = useMemo(() => {
    const sheetStyles = cellStyles[selectedSheet] || {};
    const conditions = sheetStyles.conditionalFormatting || [];
    const lookup = {};
    if (Array.isArray(conditions)) {
      conditions.forEach((cond) => {
        if (cond && typeof cond.row === "number" && typeof cond.col === "number") {
          const key = `${cond.row}-${cond.col}`;
          if (!lookup[key]) {
            lookup[key] = [];
          }
          lookup[key].push(cond);
        }
      });
    }
    return lookup;
  }, [cellStyles, selectedSheet]);

  const highlightedLookup = useMemo(() => {
    const highlighted = highlightedCells[selectedSheet] || [];
    return new Set(highlighted);
  }, [highlightedCells, selectedSheet]);

  const cellsRenderer = useCallback((row, col) => {
    try {
      // ✅ OPTIMIZED: O(1) Access
      const cellKey = `${row}-${col}`;
      const generalStyle = styleLookup[cellKey] || {};
      const conditionalRules = conditionalLookup[cellKey] || [];
      const isHighlighted = highlightedLookup.has(cellKey);

      // Check Permissions
      const permKeyComma = `${row},${col}`;
      const restrictedRoles = permissionsMap[selectedSheet]?.[cellKey] || permissionsMap[selectedSheet]?.[permKeyComma] || [];
      const isReadOnly = restrictedRoles.includes(auth.department.trim());

      // Bind precision directly to Handsontable meta to persist through renders & Modal pre-fills
      const storedPrecision = decimalPrecisionMap[selectedSheet]?.[cellKey];

      return {
        className: generalStyle?.className || "",
        readOnly: isReadOnly,
        decimalMaxLimit: storedPrecision !== undefined ? storedPrecision : undefined,
        decimalPrecision: storedPrecision !== undefined ? storedPrecision : undefined,
        renderer: function (instance, td, r, c, prop, value, cellProperties) {
          // Use fast native renderer calls when possible
          Handsontable.renderers.TextRenderer.apply(this, arguments);

          // 🚀 Apply Basic Styles
          if (generalStyle) {
            if (generalStyle.backgroundColor) td.style.backgroundColor = generalStyle.backgroundColor;
            if (generalStyle.fontColor) td.style.color = generalStyle.fontColor;
            if (generalStyle.bold) td.style.fontWeight = "bold";
            if (generalStyle.align) td.style.textAlign = generalStyle.align;
            if (generalStyle.italic) td.style.fontStyle = "italic";
          }

          td.style.whiteSpace = "normal"; // Ensure auto-wrap works

          // ------------------------ VALUE & DECIMAL FIX ------------------------
          const rawStr =
            value !== null && value !== undefined ? String(value).trim() : "";

          const numericValue = Number(rawStr);
          const isValidNumber = rawStr !== "" && !isNaN(numericValue);

          const precision =
            generalStyle.decimalPrecision ??
            cellProperties.decimalPrecision ??
            decimalPrecisionMap[selectedSheet]?.[cellKey];

          const cellType = instance.getDataType(r, c);
          const isFormula = cellType === "formula";

          let displayValue = rawStr;

          if (isValidNumber && typeof precision === "number") {
            // const isManualDecimal = rawStr.includes(".");
            // const decimals = isManualDecimal ? rawStr.split(".")[1].length : 0;

            // if (isFormula) {
            //   displayValue = numericValue.toFixed(precision);
            // } else {
            //   if (isManualDecimal && decimals >= precision) {
            //     displayValue = rawStr;
            //   } else {
            //     displayValue = numericValue.toFixed(precision);
            //   }
            // }

            // Update displayed text
            displayValue = numericValue.toFixed(precision);
            td.innerText = displayValue;
          }


          // ✅ CONDITIONAL FORMATTING
          if (conditionalRules.length > 0) {

            conditionalRules.forEach(conditionalRule => {
              const resolveCenterValue = (rule, instance) => {
                const { CenterRef, CenterValue } = rule.condition || {};
                if (
                  CenterRef &&
                  typeof CenterRef.row === "number" &&
                  typeof CenterRef.col === "number"
                ) {
                  // ✅ 1. Check if Cross-Sheet Reference
                  if (CenterRef.sheet && CenterRef.sheet !== selectedSheet) {
                    if (hyperFormulaInstance) {
                      try {
                        // Case-insensitive/tolerant sheet ID lookup could be added here if needed,
                        // but typically storing exact name from HeaderExcel is safest.
                        const sheetId = hyperFormulaInstance.getSheetId(CenterRef.sheet);
                        if (sheetId !== undefined) {
                          const val = hyperFormulaInstance.getCellValue({
                            sheet: sheetId,
                            col: CenterRef.col,
                            row: CenterRef.row,
                          });
                          const num = Number(val);
                          if (!isNaN(num)) {
                            return { value: num, fromRef: true };
                          }
                          // Handle formula referencing another formula? (HF returns result usually)
                          // If it returns Error object:
                          if (val && val.type === 'ERROR') {
                            return { value: NaN, fromRef: true };
                          }
                          // If string/text logic needed:
                          if (typeof val === 'string' && !isNaN(Number(val))) {
                            return { value: Number(val), fromRef: true };
                          }
                        }
                      } catch (err) {
                        console.warn("Cross-sheet CF fetch failed:", err);
                      }
                    }
                    // Fallback if HF lookup failed?
                  }

                  // ✅ 2. Same Sheet Reference
                  const refValue = instance.getDataAtCell(
                    CenterRef.row,
                    CenterRef.col
                  );

                  const num = Number(refValue);
                  if (!isNaN(num)) {
                    return { value: num, fromRef: true };
                  }

                  // Formula in reference cell
                  if (typeof refValue === "string" && refValue.startsWith("=")) {
                    const evaluated = evaluateHFFormula(
                      refValue,
                      CenterRef.row,
                      CenterRef.col,
                      instance
                    );
                    if (!isNaN(evaluated)) {
                      return { value: evaluated, fromRef: true };
                    }
                  }
                }

                // ✅ 2. Fallback to stored CenterValue
                const fallback = Number(CenterValue);
                if (!isNaN(fallback)) {
                  return { value: fallback, fromRef: false };
                }

                // ❌ Nothing usable
                return { value: NaN, fromRef: false };
              };




              const {
                operator,
                value: ruleValue,
                minValue,
                maxValue,
                CenterValue,
                CenterRef
              } = conditionalRule.condition;

              if (operator !== "formula" && !isValidNumber) return;

              let applyStyle = false;

              // Use a helper to safely evaluate comparison values
              const evalValue = (val) => {
                if (typeof val === "string" && val.trim().startsWith("=")) {
                  return evaluateHFFormula(val, r, c, instance);
                }
                return Number(val);
              };

              const compareValue = evalValue(ruleValue);
              const numMin = evalValue(minValue);
              const numMax = evalValue(maxValue);
              //const numCenter = evalValue(CenterValue);

              const resolved = resolveCenterValue(conditionalRule, instance);
              const numCenter = resolved.value;

              if (
                resolved.fromRef &&
                (isNaN(Number(conditionalRule.condition.CenterValue)) || Number(conditionalRule.condition.CenterValue) !== numCenter)
              ) {
                // Safe batched update
                scheduleConditionalUpdate(
                  selectedSheet,
                  conditionalRule.row,
                  conditionalRule.col,
                  numCenter,
                  conditionalRule
                );
              }

              switch (operator) {
                case "=": applyStyle = numericValue === compareValue; break;
                case "!=": applyStyle = numericValue !== compareValue; break;
                case ">": applyStyle = numericValue > compareValue; break;
                case "<": applyStyle = numericValue < compareValue; break;
                case ">=": applyStyle = numericValue >= compareValue; break;
                case "<=": applyStyle = numericValue <= compareValue; break;
                case "between":
                  if (!isNaN(numCenter)) {
                    const inRange =
                      numericValue >= numCenter - numMin &&
                      numericValue <= numCenter + numMax;
                    applyStyle = !inRange;
                  }
                  break;
                case "formula": {
                  // Determine if we need to evaluate a formula
                  const formulaVal = evaluateHFFormula(ruleValue, r, c, instance);

                  // In Excel, any non-zero number or TRUE is considering "applied"
                  if (formulaVal === true ||
                    (typeof formulaVal === "number" && !isNaN(formulaVal) && formulaVal !== 0) ||
                    formulaVal === "TRUE") {
                    applyStyle = true;
                  }
                  break;
                }
              }

              if (applyStyle) {
                if (conditionalRule.backgroundColor) td.style.backgroundColor = conditionalRule.backgroundColor;
                if (conditionalRule.fontColor) td.style.color = conditionalRule.fontColor;
                if (conditionalRule.bold) td.style.fontWeight = "bold";
              }
            });
          }

          // ✅ Highlighted cell outline
          if (isHighlighted) {
            td.style.outline = "2px dashed #ff9900";
            td.style.outlineOffset = "-2px";
            td.style.backgroundColor = "rgba(255,255,0,0.3)";
          }
        },
      };
    } catch (error) {
      console.log(error);
    }

  }, [styleLookup, conditionalLookup, highlightedLookup, decimalPrecisionMap, selectedSheet, hyperFormulaInstance, permissionsMap, auth.department]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${config.Calibmaster.URL}/api/users/getall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId })
      });
      const res = await response.json();
      if (res.code === 200) {
        // Assuming slice name is "users" and action is "changeusers"
        // Based on users.js: usersSlice.actions.changeusers
        dispatch({ type: "users/changeusers", payload: res.data });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPermissionModal = () => {
    if (auth.department !== 'admin') {
      message.error("Only Admins can set permissions");
      return;
    }
    const hot = hotRef.current?.hotInstance;
    const selected = hot?.getSelected();
    if (!selected || selected.length === 0) {
      message.warning("Please select a cell first");
      return;
    }

    if (!users || users.length === 0) {
      fetchUsers();
    }
    setIsPermissionModalOpen(true);
  };

  const handlePermissionSave = (roles) => {
    const hot = hotRef.current?.hotInstance;
    const selection = hot?.getSelected();
    if (!selection) return;

    setPermissionsMap((prev) => {
      const updated = { ...prev };
      const sheetPerms = { ...(updated[selectedSheet] || {}) };

      selection.forEach(([r1, c1, r2, c2]) => {
        const minR = Math.min(r1, r2);
        const maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2);
        const maxC = Math.max(c1, c2);

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const key = `${r},${c}`;
            if (roles && roles.length > 0) {
              sheetPerms[key] = roles;
            } else {
              delete sheetPerms[key];
            }
          }
        }
      });
      updated[selectedSheet] = sheetPerms;
      return updated;
    });
    setChanges((prev) => [...prev, "permission"]);
    setIsDirty(true);
    message.success("Permissions updated");
  };


  const handleSelectChangesheet = useCallback((sheetName) => {
    if (!sheetName) return;
    setSelectedSheet(sheetName);
  }, [sheetData]);


  const handlePrintPreview = () => {
    if (!selectedSheet) {
      message.warning("No active sheet to preview.");
      return;
    }
    setIsPrintSettingsOpen(true);
  };

  // Called from PrintSettingsModal when user confirms
  const handlePrintModalPreview = ({ margins, orientation, fontSize }) => {

    try {
      if (!selectedSheet) {
        message.warning("No active sheet to preview.");
        return;
      }

      let selectedFormat = "nabl";
      let selectedType = "certificate";

      Modal.confirm({
        title: "Select Print Preview Options",
        centered: true,
        closable: true,
        maskClosable: true,
        content: (
          <div style={{ marginTop: 10 }}>
            <div style={{ marginBottom: 15 }}>
              <label><b>Select Format:</b></label>
              <Radio.Group
                defaultValue="nabl"
                onChange={(e) => (selectedFormat = e.target.value)}
                style={{ marginTop: 8 }}
              >
                <Radio value="nabl">NABL</Radio>
                <Radio value="non-nabl">Non-NABL</Radio>
              </Radio.Group>
            </div>

            <div>
              <label><b>Select Document Type:</b></label>
              <Radio.Group
                defaultValue="certificate"
                onChange={(e) => (selectedType = e.target.value)}
                style={{ marginTop: 8 }}
              >
                <Radio value="certificate">Certificate</Radio>
                <Radio value="observation">Observation</Radio>
                <Radio value="both">Both</Radio>
              </Radio.Group>
            </div>
          </div>
        ),
        okText: "Preview",
        onOk: () => {
          submitPrintPreview(
            selectedSheet,
            selectedType,
            selectedFormat === "nabl",
            margins,
            orientation,
            fontSize
          );
        },
      });
    } catch (error) {
      console.error("Print Preview Error:", error);
      message.error({
        content: "Failed to initialize print preview.",
        key: "previewPDF",
        duration: 3,
      });
    }
  };

  const submitPrintPreview = async (
    activeSheetName,
    previewType,
    isNabl,
    margins = null,
    orientation = "portrait",
    fontSize = 8
  ) => {
    try {
      const hotInstance = hotRef.current?.hotInstance;

      let liveSheetData = { ...sheetData };
      if (hotInstance) {
        const liveData = hotInstance.getSourceData();
        liveSheetData = {
          ...sheetData,
          [selectedSheet]: liveData.map(row => [...(row || [])]),
        };
      }

      // Resolve page margins: use passed-in margins or fall back to stored sheet margins
      const resolvedMargins = margins || cellStyles?.[selectedSheet]?.pageMargin || { top: 0, bottom: 0, left: 0, right: 0 };

      const resolvedOrientation = orientation || cellStyles?.[selectedSheet]?.pageOrientation || "portrait";

      const resolvedFontSize = fontSize || cellStyles?.[selectedSheet]?.printFontSize || 8;

      const payload = {
        lab_id: auth.labId,
        srf_id,
        srf_item_id,
        isPreview: true,
        isNabl,
        previewType,
        previewData: {
          excelData: liveSheetData,
          Mergedcell: mergedCells,
          Styles: cellStyles,
          decimalPrecision: decimalPrecisionMap,
          selectedSheet_Cert: selectedSheet,
          selectedSheet_Obs: selectedSheet,
          pageMargin: resolvedMargins,
          pageOrientation: resolvedOrientation,
          printFontSize: resolvedFontSize,
        },
        cmeid: file?.cmeid === undefined ? SessionFileData?.cmeid : file?.cmeid
      };

      message.loading({ content: "Generating Preview...", key: "previewPDF" });

      const response = await fetch(`${config.Calibmaster.URL}/api/generate-certificate/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate preview. Status: ${response.status}`);
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);

      message.success({ content: "Preview Generated!", key: "previewPDF", duration: 2 });
      window.open(pdfUrl, '_blank');

    } catch (error) {
      console.error("Print Preview Error:", error);
      message.error({ content: "Failed to generate print preview.", key: "previewPDF", duration: 3 });
    }
  };

  const getActiveSheetColumnCount = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return 0;
    return hot.countCols();
  };

  const defaultColWidth = getActiveSheetColumnCount();

  // Memoize column/row configuration loops to avoid unnecessary HotTable config re-evaluations
  const memoizedRowHeights = useCallback((index) => {
    const savedHeights = cellStyles[selectedSheet]?.rowHeights;
    const height = savedHeights?.[index];
    return (height !== undefined && height > 0) ? height : 23;
  }, [cellStyles, selectedSheet]);

  const memoizedColWidths = useCallback((index) => {
    const savedWidths = cellStyles[selectedSheet]?.colWidths;
    const width = savedWidths?.[index];
    return (width !== undefined && width > 0) ? width : defaultColWidth < 7 ? 250 : 100;
  }, [cellStyles, selectedSheet, defaultColWidth]);

  const memoizedManualColumnResize = useMemo(() => {
    const savedWidths = cellStyles[selectedSheet]?.colWidths;
    if (!savedWidths || Object.keys(savedWidths).length === 0) return true;
    const widthsArray = [];
    for (let i = 0; i < 200; i++) {
      widthsArray[i] = (savedWidths[i] !== undefined && savedWidths[i] > 0) ? savedWidths[i] : undefined;
    }
    return widthsArray.length > 0 ? widthsArray : true;
  }, [cellStyles, selectedSheet]);

  const memoizedManualRowResize = useMemo(() => {
    const savedHeights = cellStyles[selectedSheet]?.rowHeights;
    if (!savedHeights || Object.keys(savedHeights).length === 0) return true;
    const heightsArray = [];
    for (let i = 0; i < 2000; i++) {
      heightsArray[i] = (savedHeights[i] !== undefined && savedHeights[i] > 0) ? savedHeights[i] : undefined;
    }
    return heightsArray.length > 0 ? heightsArray : true;
  }, [cellStyles, selectedSheet]);

  return (
    <div
      style={{
        padding: "10px",
        background: "#f9fbfd",
        display: "flex",
        flexDirection: "column",
        height: "97.3vh",
      }}
    >
      <div
        style={{
          //padding: "10px",
          background: "#f9fbfd",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <HeaderExcel
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handlealignstyle={handlealignstyle}
          handleMergeUnmerge={handleMergeUnmerge}
          handleFontColorChange={handleFontColorChange}
          handleColorChange={handleColorChange}
          handleBold={handleBold}
          handleDecimalIncrease={handleDecimalIncrease}
          handleDecimalDecrease={handleDecimalDecrease}
          handleSave={handleSave}
          handlePrintPreview={handlePrintPreview}
          handleSelectChange={handleSelectChange}
          handleHiddenChange={handleHiddenChange}
          file={file}
          selectedCell={selectedCell}
          sheetNames={sheetNames}
          selectedHiddenSheets={selectedHiddenSheets}
          isBoldActive={isBoldActive}
          PrintonCertificate={PrintonCertificate}
          ObservationCertificate={ObservationCertificate}
          isDirty={isDirty}
          handleFormulaChange={handleFormulaChange}
          handleFormulaSubmit={handleFormulaSubmit}
          hotRef={hotRef}
          selectedSheet={selectedSheet}
          handlecellformatting={handlecellformatting}
          cellStyles={cellStyles}
          setCellStyles={setCellStyles}
          handleZoomReset={handleZoomReset}
          hyperFormulaInstance={hyperFormulaInstance}
          isnotSave={isnotSave}
          sheetErrorMap={sheetErrorMap}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onOpenPermissionModal={handleOpenPermissionModal}
          userRole={auth.department}
          handleSelectChangesheet={handleSelectChangesheet}
          mergedCells={mergedCells}
          onOpenPrintSettings={() => setIsPrintSettingsOpen(true)}
        />
      </div>

      <div
        style={{
          flexGrow: 1,
          overflow: "auto",
          maxHeight: "calc(100vh - 120px)",
          background: "#fff",
        }}
      >
        {hyperFormulaInstance ? (
          <HotTable
            key={`hottable-${selectedSheet}`}
            ref={hotRef}
            data={sheetData[selectedSheet]}
            //mergeCells={mergedCells[selectedSheet] || []}
            mergeCells={safeMergedCells}
            rowHeaders={true}
            colHeaders={true}
            height="100%"
            width="100%"
            autoWrapRow={true}
            autoWrapCol={true}
            renderAllRows={false} // Performance virtualization
            renderAllColumns={false}


            rowHeights={memoizedRowHeights}
            colWidths={memoizedColWidths}

            autoRowSize={false} // Performance flags enabled
            autoColumnSize={false}

            manualColumnResize={memoizedManualColumnResize}
            manualRowResize={memoizedManualRowResize}

            //viewportRowRenderingOffset={10} // Optimized render bounds
            //viewportColumnRenderingOffset={5}
            licenseKey="non-commercial-and-evaluation"
            selectionMode="multiple"
            formulas={{
              engine: hyperFormulaInstance,
              sheetName: selectedSheet,
            }}
            dropdownMenu={false}
            filters={false}
            outsideClickDeselects={false}
            dragToScroll={true}
            copyable={true}
            copyMode="with-column-group-headers"
            className="htCenter"
            virtualized={true}
            stretchH={"none"}
            afterChange={afterChange}
            afterRowResize={(newSize, row, isDoubleClick) => {
              setCellStyles((prev) => {
                const nextStyles = { ...prev };
                const sheetStyles = nextStyles[selectedSheet] || {};
                const currentHeights = sheetStyles.rowHeights || {};
                nextStyles[selectedSheet] = {
                  ...sheetStyles,
                  rowHeights: {
                    ...currentHeights,
                    [row]: newSize
                  }
                };

                return nextStyles;
              });
              setIsDirty(true);
            }}
            afterColumnResize={(newSize, column, isDoubleClick) => {
              setCellStyles((prev) => {
                const nextStyles = { ...prev };
                const sheetStyles = nextStyles[selectedSheet] || {};
                const currentWidths = sheetStyles.colWidths || {};
                nextStyles[selectedSheet] = {
                  ...sheetStyles,
                  colWidths: {
                    ...currentWidths,
                    [column]: newSize
                  }
                };

                return nextStyles;
              });
              setIsDirty(true);
            }}
            comments={true}
            themeName="ht-theme-main"
            beforeChange={(changes, source) => {
              const hot = hotRef.current?.hotInstance;
              if (!hot) return true;

              if (source === "undo" || source === "redo") {
                changes.forEach(([row, col]) => {
                  const meta = hot.getCellMeta(row, col);
                  if (meta.originalStyle) {
                    hot.setCellMeta(row, col, "style", {
                      ...meta.originalStyle,
                    });
                  }
                });
              } else if (source === "edit" || source === "Autofill.fill" || source === "CopyPaste.paste") {
                // Ensure formatting for actual user interactions
                changes.forEach(change => {
                  const [row, col, oldVal, newVal] = change;

                  if (newVal !== null && newVal !== undefined && newVal !== "" && !isNaN(Number(newVal))) {
                    const meta = hot.getCellMeta(row, col);
                    // Use decimalMaxLimit (or decimalPlaces/decimalPrecision if mapped identically)

                    //const limit = meta.decimalMaxLimit !== undefined ? meta.decimalMaxLimit : meta.decimalPrecision;

                    const limit = meta.decimalMaxLimit ?? meta.decimalPrecision;

                    //if (limit !== undefined && limit !== null) {
                    if (typeof limit === "number" && limit >= 0) {
                      // Apply strict rounding as requested and replace the incoming edit string
                      change[3] = Number(newVal).toFixed(limit);
                    }
                  }
                });
              }
              return true;
            }}
            afterMergeCells={(cellRange, mergeParent, auto) => {
              if (!auto) {
                setMergedCells((prevMergedCells) => {
                  return {
                    ...prevMergedCells,
                    [selectedSheet]: [
                      ...(prevMergedCells[selectedSheet] || []),
                      mergeParent,
                    ],
                  };
                });
                setIsDirty(true);
              }
            }}
            afterUnmergeCells={(cellRange, auto) => {
              if (!auto) {
                const { from } = cellRange;

                setMergedCells((prev) => {
                  const updated = (prev[selectedSheet] || []).filter(
                    (cell) => !(cell.row === from.row && cell.col === from.col)
                  );
                  return {
                    ...prev,
                    [selectedSheet]: updated,
                  };
                });

                setIsDirty(true);
              }
            }}
            afterSetCellMeta={(row, col, key, value) => {
              handleSetCellMeta(row, col, key, value);
            }}
            cells={cellsRenderer}
            afterSelection={function (row, col, row2, column2) {
              if (row >= 0 && col >= 0) {
                handleCellSelection(row, col);
              }

              const hot = hotRef.current?.hotInstance;
              if (hot) {
                const getDataType = hot.getDataType();
              }
            }}
            beforeOnCellMouseDown={(event, coords, TD) => {
              if (coords.row === -1 && coords.col === -1) {
                setSelectionSource('corner'); // Select all
              } else if (coords.row === -1) {
                setSelectionSource('column_header');
              } else if (coords.col === -1) {
                setSelectionSource('row_header');
              } else {
                setSelectionSource('cell');
              }
            }}
            contextMenu={{
              items: {
                "row_above": {},
                "row_below": {},
                "hsep1": "---------",
                "col_left": {},
                "col_right": {},
                "hsep2": "---------",
                "remove_row": {},
                "remove_col": {},
                "hsep3": "---------",
                "undo": {},
                "redo": {},
                "make_read_only": {},
                "alignment": {},
                "hsep4": "---------",
                "set_column_width": {
                  name: "Column Width",
                  hidden: function () {
                    if (selectionSource !== 'column_header') return true;
                    const hot = hotRef.current?.hotInstance;
                    if (!hot) return true;
                    const selection = hot.getSelected();
                    if (!selection || selection.length === 0) return true;
                    const totalRows = hot.countRows();
                    const isFullColumn = selection.some(range => {
                      const minRow = Math.min(range[0], range[2]);
                      const maxRow = Math.max(range[0], range[2]);
                      return minRow <= 0 && maxRow >= totalRows - 1;
                    });
                    return !isFullColumn;
                  },
                  callback: function (key, selection, clickEvent) {
                    const hot = hotRef.current?.hotInstance;
                    if (!hot || !selection || selection.length === 0) return;

                    const selectedCols = new Set();
                    selection.forEach(range => {
                      const startCol = Math.min(range.start.col, range.end.col);
                      const endCol = Math.max(range.start.col, range.end.col);
                      for (let c = startCol; c <= endCol; c++) {
                        selectedCols.add(c);
                      }
                    });

                    const colIndices = Array.from(selectedCols);
                    if (colIndices.length === 0) return;

                    const firstCol = colIndices[0];
                    const defaultWidth = hot.getColWidth(firstCol) || 100;

                    setActiveColIndices(colIndices);
                    setColWidthInput(defaultWidth);
                    setColWidthModalVisible(true);
                  }
                },
                "set_row_height": {
                  name: "Row Height",
                  hidden: function () {
                    if (selectionSource !== 'row_header') return true;
                    const hot = hotRef.current?.hotInstance;
                    if (!hot) return true;
                    const selection = hot.getSelected();
                    if (!selection || selection.length === 0) return true;
                    const totalCols = hot.countCols();
                    const isFullRow = selection.some(range => {
                      const minCol = Math.min(range[1], range[3]);
                      const maxCol = Math.max(range[1], range[3]);
                      return minCol <= 0 && maxCol >= totalCols - 1;
                    });
                    return !isFullRow;
                  },
                  callback: function (key, selection, clickEvent) {
                    const hot = hotRef.current?.hotInstance;
                    if (!hot || !selection || selection.length === 0) return;

                    const selectedRows = new Set();
                    selection.forEach(range => {
                      const startRow = Math.min(range.start.row, range.end.row);
                      const endRow = Math.max(range.start.row, range.end.row);
                      for (let r = startRow; r <= endRow; r++) {
                        selectedRows.add(r);
                      }
                    });

                    const rowIndices = Array.from(selectedRows);
                    if (rowIndices.length === 0) return;

                    const firstRow = rowIndices[0];
                    const defaultHeight = hot.getRowHeight(firstRow) || 23;

                    setActiveRowIndices(rowIndices);
                    setRowHeightInput(defaultHeight);
                    setRowHeightModalVisible(true);
                  }
                },
                "cell_format": {
                  name: "Cell Format",
                  callback: function (key, selection, clickEvent) {
                    const hot = hotRef.current?.hotInstance;
                    if (!hot || !selection || selection.length === 0) return;

                    const coords = [];
                    let initialDecimal = "";
                    selection.forEach(range => {
                      for (let r = range.start.row; r <= range.end.row; r++) {
                        for (let c = range.start.col; c <= range.end.col; c++) {
                          coords.push({ row: r, col: c });
                          if (initialDecimal === "") {
                            const meta = hot.getCellMeta(r, c);
                            if (meta.decimalMaxLimit !== undefined) {
                              initialDecimal = meta.decimalMaxLimit;
                            }
                          }
                        }
                      }
                    });

                    setActiveCellCoords(coords);
                    setDecimalInput(initialDecimal !== "" ? initialDecimal : "");
                    setDecimalModalVisible(true);
                  }
                },
              }
            }}
            fillHandle={true}
            afterCreateRow={(index, amount) => {
              //syncHyperFormulaRows("insert", index, amount);
              setCellStyles(prev => ({
                ...prev,
                [selectedSheet]: shiftStyles(prev[selectedSheet], index, amount, "insert", "row"),
              }));

              setMergedCells(prev => ({
                ...prev,
                [selectedSheet]: shiftMerges(prev[selectedSheet], index, amount, "insert", "row"),
              }));

              // setDecimalPrecisionMap(prev => ({
              //   ...prev,
              //   [selectedSheet]: shiftDecimalPrecisionMap(prev[selectedSheet] || {}, index, amount, "insert", "row")
              // }));

              setDecimalPrecisionMap(prev => {
                const shiftedMap = shiftDecimalPrecisionMap(prev[selectedSheet] || {}, index, amount, "insert", "row");

                // ✅ Sync shifted precision values back into Handsontable cell meta
                // so cellsRenderer reads the correct decimalPrecision for each shifted row
                const hot = hotRef.current?.hotInstance;
                if (hot) {
                  Object.entries(shiftedMap).forEach(([key, precision]) => {
                    const [r, c] = key.split("-").map(Number);
                    hot.setCellMeta(r, c, "decimalPrecision", precision);
                  });
                }

                return { ...prev, [selectedSheet]: shiftedMap };
              });
            }}
            afterRemoveRow={(index, amount) => {
              //syncHyperFormulaRows("remove", index, amount);
              setCellStyles(prev => ({
                ...prev,
                [selectedSheet]: shiftStyles(prev[selectedSheet], index, amount, "remove", "row"),
              }));
              setMergedCells(prev => ({
                ...prev,
                [selectedSheet]: shiftMerges(prev[selectedSheet], index, amount, "remove", "row"),
              }));
              // setDecimalPrecisionMap(prev => ({
              //   ...prev,
              //   [selectedSheet]: shiftDecimalPrecisionMap(prev[selectedSheet] || {}, index, amount, "remove", "col")
              // }));


              setDecimalPrecisionMap(prev => {
                // ✅ FIX: was incorrectly passing "col" — must be "row"
                const shiftedMap = shiftDecimalPrecisionMap(prev[selectedSheet] || {}, index, amount, "remove", "row");

                // ✅ Sync back to Handsontable cell meta
                const hot = hotRef.current?.hotInstance;
                if (hot) {
                  Object.entries(shiftedMap).forEach(([key, precision]) => {
                    const [r, c] = key.split("-").map(Number);
                    hot.setCellMeta(r, c, "decimalPrecision", precision);
                  });
                }

                return { ...prev, [selectedSheet]: shiftedMap };
              });
            }}
            afterCreateCol={(index, amount) => {
              //syncHyperFormulaCols("insert", index, amount);
              setCellStyles(prev => ({
                ...prev,
                [selectedSheet]: shiftStyles(prev[selectedSheet], index, amount, "insert", "col"),
              }));

              setMergedCells(prev => ({
                ...prev,
                [selectedSheet]: shiftMerges(prev[selectedSheet], index, amount, "insert", "col"),
              }));
            }}
            afterRemoveCol={(index, amount) => {
              //syncHyperFormulaCols("remove", index, amount);
              setCellStyles(prev => ({
                ...prev,
                [selectedSheet]: shiftStyles(prev[selectedSheet], index, amount, "remove", "col"),
              }));

              setMergedCells(prev => ({
                ...prev,
                [selectedSheet]: shiftMerges(prev[selectedSheet], index, amount, "remove", "col"),
              }));
            }}
            afterRender={() => {
              const hot = hotRef.current?.hotInstance;
              if (!hot) return;

              if (hot.getActiveEditor()?.isOpened()) {
                return;
              }
              const newErrorState = renderErrorRef.current ? true : false;

              setSheetErrorMap(prev => {
                const oldValue = prev[selectedSheet];
                if (oldValue === newErrorState) {
                  renderErrorRef.current = false;
                  return prev;
                }

                const updated = {
                  ...prev,
                  [selectedSheet]: newErrorState
                };

                return updated;
              });

              // Update save-block flag only once, not continuously
              setisnotSave(newErrorState);


              renderErrorRef.current = false;

            }}
            beforePaste={(data, coords) => {
              try {
                // Convert raw pasted matrix into trimmed rows
                let cleaned = normalizePastedData(data);

                // Determine max correct column count (the first full row)
                let maxCols = Math.max(...cleaned.map(r => r.length));

                // Normalize all rows to same column size
                cleaned = cleaned.map(row => {
                  while (row.length < maxCols) row.push("");  // pad missing cells
                  return row;
                });

                // Replace original Handsontable paste data
                data.length = 0;
                cleaned.forEach(row => data.push(row));

              } catch (err) {
                console.error("Paste cleanup error:", err);
              }
            }}
          />
        ) : (
          <Spin size="large" tip="Loading..." fullscreen />
        )}
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          backgroundColor: "#f9fbfd",
          padding: "10px",
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <FooterExcel
          sheetNames={sheetNames}
          selectedSheet={selectedSheet}
          setSheetData={setSheetData}
          setMergedCells={setMergedCells}
          setCellStyles={setCellStyles}
          setSheetNames={setSheetNames}
          setSelectedSheet={setSelectedSheet}
          setIsDirty={setIsDirty}
          deleteSelectedSheet={deleteSelectedSheet}
          addNewSheet={addNewSheet}
          duplicateSheet={duplicateSheet}
          Setsettings={Setsettings}
          settings={settings}
          isRename={isRename}
          setisRename={setisRename}
          handleRenameSheet={handleRenameSheet}
          isLoaded={isLoaded}
          hotRef={hotRef}
          isShowhidelFile={!file || !file.sheet}
          selectedHiddenSheets={selectedHiddenSheets}
          handleHiddenChange={handleHiddenChange}
          handleSave={handleSave}
          sheetErrorMap={sheetErrorMap}
          isDirty={isDirty}
        />
      </div>
      <Spin spinning={isLoaded} size="large" tip="Loading..." fullscreen />

      <ExcelPermissionModal
        visible={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onSave={handlePermissionSave}
        users={users}
        initialPermissions={(() => {
          const hot = hotRef.current?.hotInstance;
          const selected = hot?.getSelectedLast();
          if (!selected) return [];
          const [r, c] = selected;
          return permissionsMap[selectedSheet]?.[`${r},${c}`] || [];
        })()}
      />

      <ColumnWidthModal excelState={excelState} />
      <RowHeightModal excelState={excelState} />
      <CellFormatModal excelState={excelState} hotRef={hotRef} />

      {/* Print Settings Modal */}
      <PrintSettingsModal
        open={isPrintSettingsOpen}
        onClose={() => setIsPrintSettingsOpen(false)}
        onPreview={handlePrintModalPreview}
        onSaveSettings={(updatedStyles) => {
          // Only update React state + mark dirty.
          // The regular "Save" button will persist everything via cellStylesRef.current,
          // which always reflects the latest styles.
          if (updatedStyles) {
            setCellStyles(updatedStyles);
            setIsDirty(true);
          }
        }}
        cellStyles={cellStyles}
        setCellStyles={setCellStyles}
        selectedSheet={selectedSheet}
        sheetNames={sheetNames}
        sheetData={sheetData}
        mergedCells={mergedCells}
        hyperFormulaInstance={hyperFormulaInstance}
        rowArr={memoizedRowHeights}
        colArr={memoizedColWidths}
        hotRef={hotRef}
        safeMergedCells={safeMergedCells}
        cellsRenderer={cellsRenderer}
      />
    </div>
  );
}
export default ExcelTable;
