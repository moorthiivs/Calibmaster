import { useState, useRef, useEffect } from "react";

export function useExcelState() {
  const [sheetData, setSheetData] = useState({});
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [mergedCells, setMergedCells] = useState({});
  const [changes, setChanges] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [hyperFormulaInstance, setHyperFormulaInstance] = useState(null);

  // Permissions state
  const [permissionsMap, setPermissionsMap] = useState({});
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const [cellStyles, _setCellStyles] = useState({});
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isLoaded, setisLoader] = useState(true);

  // Ref that stays synchronously in-step with cellStyles state.
  // Using a wrapper setter (not useEffect) guarantees the ref is updated
  // in the same call as the state, so handleSave always reads the freshest value
  // even if called immediately after a setCellStyles in the same event.
  const cellStylesRef = useRef({});
  const setCellStyles = (valueOrUpdater) => {
    if (typeof valueOrUpdater === 'function') {
      _setCellStyles(prev => {
        const next = valueOrUpdater(prev);
        cellStylesRef.current = next;
        return next;
      });
    } else {
      cellStylesRef.current = valueOrUpdater;
      _setCellStyles(valueOrUpdater);
    }
  };

  const [selectedCell, setSelectedCell] = useState({
    row: null,
    col: null,
    value: "",
    formula: "",
    address: "",
  });

  const [originalData, setOriginalData] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [goNoGoJson, setGoNoGoJson] = useState([]);
  const [DynamicGaugevalue, setDynamicGaugevalue] = useState([]);

  const [isRename, setisRename] = useState(false);

  // --- Modals State ---
  const [colWidthModalVisible, setColWidthModalVisible] = useState(false);
  const [colWidthInput, setColWidthInput] = useState("");
  const [activeColIndices, setActiveColIndices] = useState([]); // Array of column indices

  const [rowHeightModalVisible, setRowHeightModalVisible] = useState(false);
  const [rowHeightInput, setRowHeightInput] = useState("");
  const [activeRowIndices, setActiveRowIndices] = useState([]); // Array of row indices

  const [decimalModalVisible, setDecimalModalVisible] = useState(false);
  const [decimalInput, setDecimalInput] = useState("");
  const [activeCellCoords, setActiveCellCoords] = useState([]); // Array of {row, col}

  const [selectionSource, setSelectionSource] = useState(null);

  const [settings, Setsettings] = useState({
    tabmenu: "line",
    isOpen: false,
    autoSave: false,
    autoSaveInterval: 30,
  });

  const [selectedHiddenSheets, setSelectedHiddenSheets] = useState([]);

  const [decimalPrecisionMap, setDecimalPrecisionMap] = useState({});
  const decimalPrecisionMapRef = useRef(decimalPrecisionMap);

  useEffect(() => {
    decimalPrecisionMapRef.current = decimalPrecisionMap;
  }, [decimalPrecisionMap]);

  const [highlightedCells, setHighlightedCells] = useState([]);

  const [SessionFileData, SetSessionFileData] = useState(() =>
    JSON.parse(sessionStorage.getItem("excelTableData"))
  );


  return {
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
    cellStylesRef,
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
  };
}
