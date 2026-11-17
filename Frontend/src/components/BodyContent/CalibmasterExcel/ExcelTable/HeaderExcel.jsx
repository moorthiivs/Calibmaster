import React, { useEffect, useRef, useState } from "react";
import {
    Row,
    Col,
    Button,
    Select,
    Modal,
    Input,
    Divider,
    Tooltip,
    Space,
    ColorPicker,
    Typography,
    message,
} from "antd";
import {
    MergeCellsOutlined,
    BoldOutlined,
    FontColorsOutlined,
    BgColorsOutlined,
    AlignLeftOutlined,
    AlignCenterOutlined,
    AlignRightOutlined,
    PlusOutlined,
    MinusOutlined,
    SaveOutlined,
    CloseOutlined,
    CloudDownloadOutlined,
    DeleteOutlined,
    LockOutlined,
    VerticalAlignTopOutlined,
    VerticalAlignMiddleOutlined,
    VerticalAlignBottomOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import "./excel.css";
import ExcelJS from "exceljs";
import ActionMenu from "../../../UI/ActionMenu";
import { SlidersHorizontal } from "lucide-react";

const { Option } = Select;
const { Title } = Typography;

function HeaderExcel({
    handleUndo,
    handleRedo,
    handleZoomIn,
    handleZoomOut,
    handlealignstyle,
    handleMergeUnmerge,
    handleFontColorChange,
    handleColorChange,
    handleBold,
    handleDecimalIncrease,
    handleDecimalDecrease,
    handleSave,
    handlePrintPreview,
    handleSelectChange,
    handleHiddenChange,
    file,
    selectedCell,
    sheetNames,
    selectedHiddenSheets,
    isBoldActive,
    PrintonCertificate,
    ObservationCertificate,
    isDirty,
    handleFormulaChange,
    handleFormulaSubmit,
    hotRef,
    selectedSheet,
    handlecellformatting,
    cellStyles,
    setCellStyles,
    handleZoomReset,
    hyperFormulaInstance,
    isnotSave,
    sheetErrorMap,
    canUndo,
    canRedo,
    onOpenPermissionModal,
    userRole,
    permissions,
    handleSelectChangesheet,
    mergedCells, // Received from parent
    onOpenPrintSettings, // open Page Margin / Print Settings modal
}) {

    const DEFAULT_COND_RULE = {
        operator: ">",
        value: "",
        minValue: "",
        maxValue: "",
        CenterRef: null,
        CenterValue: "",
        fontColor: "#000000",
        bgColor: "#FF0000",
    };


    const [isCondModalOpen, setCondModalOpen] = useState(false);

    const targetSelectionRef = useRef(null);

    const isPickingCenterRef = useRef(false);
    const centerPickSourceSheetRef = useRef(null);
    const selectedSheetRef = useRef(selectedSheet);

    useEffect(() => {
        selectedSheetRef.current = selectedSheet;

        // If we are actively picking a center cell, and the sheet changed, we need to re-attach the hook to the NEW Handsontable instance.
        if (isPickingCenterRef.current) {
            // Need a slight delay to ensure HotTable has finished mounting the new sheet
            setTimeout(() => {
                const hot = hotRef?.current?.hotInstance;
                if (hot) {
                    // Ensure we don't attach multiple times
                    hot.removeHook("afterSelectionEnd", pickCellCallbackRef.current);
                    hot.addHook("afterSelectionEnd", pickCellCallbackRef.current);
                }
            }, 50);
        }

        if (isPickingTargetRangeRef.current) {
            setTimeout(() => {
                const hot = hotRef?.current?.hotInstance;
                if (hot) {
                    hot.removeHook("afterSelectionEnd", pickTargetRangeCallbackRef.current);
                    hot.addHook("afterSelectionEnd", pickTargetRangeCallbackRef.current);
                }
            }, 50);
        }

    }, [selectedSheet, hotRef]);


    // Multiple rules state
    const [condRules, setCondRules] = useState([DEFAULT_COND_RULE]);
    // The text input for range (e.g. =$A$1:$B$2)
    const [targetRange, setTargetRange] = useState("");

    const [addressInput, setAddressInput] = useState("A1");

    useEffect(() => {
        if (selectedCell?.address) {
            setAddressInput(selectedCell.address);
        }
    }, [selectedCell, handleDecimalIncrease, handleDecimalDecrease]);

    const conditionOptions = [
        { value: ">", label: "Greater than" },
        { value: "<", label: "Less than" },
        { value: "=", label: "Equal to" },
        { value: "!=", label: "Not equal to" },
        { value: "contains", label: "Contains" },
        { value: "between", label: "Between (Min–Max)" },
        { value: "formula", label: "Custom Formula" },
    ];


    const normalizeRef = (ref) => {
        if (!ref) return null;
        if (typeof ref === "object" && ref.row != null && ref.col != null) {
            return {
                row: Number(ref.row),
                col: Number(ref.col),
                sheet: ref.sheet
            };
        }
        return null;
    };

    // Helper: Column index to Letter (0 -> A)
    // already exists as getColumnLetter() below, but let's reuse or ensure availability
    // (It is defined below line 290, so hoisting works or we can move it up if needed. It is const, so not hoisted. Move it up or define helper here)

    const colIndexToLetter = (colIndex) => {
        let letter = "";
        let temp = colIndex + 1;
        while (temp > 0) {
            const mod = (temp - 1) % 26;
            letter = String.fromCharCode(65 + mod) + letter;
            temp = Math.floor((temp - mod) / 26);
        }
        return letter;
    };

    // Helper: [r1, c1, r2, c2] -> "=$A$1:$B$2"
    const getRangeAddress = (selection) => {
        if (!selection || selection.length === 0) return "";
        const [r1, c1, r2, c2] = selection[0];
        const start = `$${colIndexToLetter(Math.min(c1, c2))}$${Math.min(r1, r2) + 1}`;
        const end = `$${colIndexToLetter(Math.max(c1, c2))}$${Math.max(r1, r2) + 1}`;
        if (start === end) return `=${start}`;
        return `=${start}:${end}`;
    };

    // Helper: "=$A$1:$B$2" -> [r1, c1, r2, c2]
    const parseRangeAddress = (str) => {
        try {
            const clean = str.replace(/[=$]/g, "").toUpperCase(); // A1:B2
            // Split by :
            const parts = clean.split(":");
            if (parts.length === 0) return null;

            const decodeCell = (cellStr) => {
                const match = cellStr.match(/^([A-Z]+)(\d+)$/);
                if (!match) return null;
                const colStr = match[1];
                const rowStr = match[2];

                let col = 0;
                for (let i = 0; i < colStr.length; i++) {
                    col = col * 26 + (colStr.charCodeAt(i) - 64);
                }
                return { row: parseInt(rowStr, 10) - 1, col: col - 1 };
            };

            const start = decodeCell(parts[0]);
            if (!start) return null;

            const end = parts.length > 1 ? decodeCell(parts[1]) : start;
            if (!end) return null;

            return [
                Math.min(start.row, end.row),
                Math.min(start.col, end.col),
                Math.max(start.row, end.row),
                Math.max(start.col, end.col),
            ];
        } catch (e) {
            return null;
        }
    };


    const applyConditionalFormat = () => {
        try {
            const hot = hotRef?.current?.hotInstance;

            // 1. Parse manual range input
            const parsedSelection = parseRangeAddress(targetRange);

            const selection = parsedSelection ? [parsedSelection] : targetSelectionRef.current; // fallback



            if (!selection || !selection.length === 0) {
                return Modal.warning({ content: "Please select target cells first" });
            }

            // 2. Validate rules
            const validRules = condRules.filter(r => r.operator);
            if (validRules.length === 0) {
                message.warning("Please add at least one valid condition");
                return;
            }

            // 3. Normalize rules
            const normalizedRules = validRules.map(rule => ({
                operator: rule.operator,
                value: rule.value,
                minValue: rule.minValue,
                maxValue: rule.maxValue,
                CenterValue: rule.CenterValue,
                CenterRef: normalizeRef(rule.CenterRef),
                fontColor: rule.fontColor,
                bgColor: rule.bgColor,
            }));



            if (typeof handlecellformatting === "function") {
                // Pass ARRAY of rules
                handlecellformatting(normalizedRules, selection, selectedSheet);
            }

            setCondModalOpen(false);

            setCondRules([DEFAULT_COND_RULE]);
        } catch (error) {
            console.error("❌ Error applying conditional format:", error);
        }
    };

    const handleClearConditionalFormat = () => {
        try {
            const hot = hotRef?.current?.hotInstance;
            if (!hot) return;

            const selection = hot.getSelected();
            if (!selection || selection.length === 0) {
                return Modal.warning({ content: "Please select cells first" });
            }

            const [r1, c1, r2, c2] = selection[0];
            const fromRow = Math.min(r1, r2);
            const toRow = Math.max(r1, r2);
            const fromCol = Math.min(c1, c2);
            const toCol = Math.max(c1, c2);

            setCellStyles((prev) => {
                const updated = { ...prev };
                const sheet = updated[selectedSheet];
                if (!sheet) return updated;

                // Remove entries in conditionalFormatting that fall inside the selected range
                if (sheet.conditionalFormatting) {
                    sheet.conditionalFormatting = sheet.conditionalFormatting.filter(
                        (rule) =>
                            !(
                                Number(rule.row) >= fromRow &&
                                Number(rule.row) <= toRow &&
                                Number(rule.col) >= fromCol &&
                                Number(rule.col) <= toCol
                            )
                    );

                    if (sheet.conditionalFormatting.length === 0) delete sheet.conditionalFormatting;
                }

                // Remove any extra meta keys that we might have kept in the sheet object
                Object.keys(sheet).forEach((key) => {
                    if (key === "conditionalFormatting") return;
                    const meta = sheet[key];
                    if (!meta || typeof meta !== "object") return;
                    if (meta.row == null || meta.col == null) return;
                    const inside =
                        meta.row >= fromRow &&
                        meta.row <= toRow &&
                        meta.col >= fromCol &&
                        meta.col <= toCol;
                    if (inside) delete sheet[key];
                });

                return updated;
            });

            // remove Handsontable meta & styles
            for (let r = fromRow; r <= toRow; r++) {
                for (let c = fromCol; c <= toCol; c++) {
                    hot.setCellMeta(r, c, "conditionalRule", null);
                    hot.setCellMeta(r, c, "style", {});
                }
            }
            setCondModalOpen(false);
            hot.render();

            // ✔ SUCCESS MESSAGE with close button
            message.open({
                type: "success",
                content: "Conditional formatting cleared successfully.",
                duration: 1,
            });

            // ✔ TIP with close button
            message.open({
                type: "info",
                content: "Please save the file, otherwise old styles will reappear on reload.",
                duration: 2,
            });

        } catch (err) {
            console.error(err);
        }
    };


    async function exportAllSheetsExcel() {
        if (!hyperFormulaInstance || !sheetNames?.length) {
            alert("No sheets to export!");
            return;
        }

        const workbook = new ExcelJS.Workbook();

        for (const sheetName of sheetNames) {
            const ws = workbook.addWorksheet(sheetName);
            const sheetId = hyperFormulaInstance.getSheetId(sheetName);

            // Get data with formulas
            const serializedData = hyperFormulaInstance.getSheetSerialized(sheetId);

            // 1. Write Data & Formulas
            serializedData.forEach((row, rIdx) => {
                row.forEach((cellValue, cIdx) => {
                    const address = { sheet: sheetId, col: cIdx, row: rIdx };
                    const formula = hyperFormulaInstance.getCellFormula(address);
                    const cell = ws.getCell(rIdx + 1, cIdx + 1);

                    if (formula) {
                        // Sanitize formula: ensure single '=' at start
                        let cleanFormula = String(formula);
                        if (cleanFormula.startsWith("==")) {
                            cleanFormula = cleanFormula.substring(1);
                        } else if (!cleanFormula.startsWith("=")) {
                            cleanFormula = "=" + cleanFormula;
                        }

                        cell.value = {
                            formula: cleanFormula,
                            result: cellValue
                        };
                    } else {
                        cell.value = cellValue;
                    }
                });
            });

            // 2. Apply Merged Cells
            const sheetMerges = mergedCells?.[sheetName] || [];
            sheetMerges.forEach(merge => {
                // Handsontable: row, col, rowspan, colspan (0-indexed)
                // ExcelJS: top, left, bottom, right (1-indexed)
                const top = merge.row + 1;
                const left = merge.col + 1;
                const bottom = merge.row + merge.rowspan;
                const right = merge.col + merge.colspan;

                try {
                    ws.mergeCells(top, left, bottom, right);
                } catch (e) {
                    console.warn(`Failed to merge cells on ${sheetName}:`, merge, e);
                }
            });

            // 3. Apply Styles
            const sheetStyles = cellStyles?.[sheetName] || {};
            // cellStyles structure: { "0-0": { bold: true, ... }, ... } or array in some versions?
            // Based on ExcelTable.jsx, it seems to be an object with keys like "row-col" or just iterations
            // Let's iterate over keys

            Object.keys(sheetStyles).forEach(key => {
                if (key === "conditionalFormatting") return;

                const style = sheetStyles[key];
                // style object should be { row, col, ...styleProps }
                // Robust check for valid coordinates
                if (!style ||
                    typeof style.row !== 'number' || isNaN(style.row) || style.row < 0 ||
                    typeof style.col !== 'number' || isNaN(style.col) || style.col < 0
                ) {
                    return;
                }

                try {
                    // ExcelJS uses 1-based indexing
                    const cell = ws.getCell(style.row + 1, style.col + 1);

                    // Font Styles
                    if (style.bold || style.italic || style.fontColor) {
                        const fontSpec = {};
                        if (style.bold) fontSpec.bold = true;
                        if (style.italic) fontSpec.italic = true;
                        if (style.fontColor) {
                            // Ensure ARGB format (ExcelJS wants AARRGGBB, or just RRGGBB might work but FF prefix avoids transparency issues)
                            const cleanColor = style.fontColor.replace('#', '');
                            fontSpec.color = { argb: 'FF' + (cleanColor.length === 3 ? cleanColor.split('').map(c => c + c).join('') : cleanColor) };
                        }
                        cell.font = { ...(cell.font || {}), ...fontSpec };
                    }

                    // Background Color
                    if (style.backgroundColor) {
                        const cleanColor = style.backgroundColor.replace('#', '');
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF' + (cleanColor.length === 3 ? cleanColor.split('').map(c => c + c).join('') : cleanColor) }
                        };
                    }

                    // Alignment
                    if (style.align) {
                        let horizontal = 'left';
                        const align = style.align.toLowerCase();
                        if (align.includes('center')) horizontal = 'center';
                        else if (align.includes('right')) horizontal = 'right';
                        else if (align.includes('justify')) horizontal = 'justify';


                        cell.alignment = {
                            ...(cell.alignment || {}),
                            horizontal: horizontal,
                            wrapText: true
                        };
                    }
                } catch (err) {
                    console.warn(`Failed to apply style for cell ${style.row},${style.col} on sheet ${sheetName}:`, err);
                }
            });

            // 4. Set Default Widths/Heights if possible (optional)
            // Handsontable defaults are often different. 
            // We can at least set a default width if not set.
            ws.columns.forEach(column => {
                column.width = 12; // Moderate default
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "Calibmaster_Export.xlsx";
        a.click();
    }



    // Convert col index → Excel column (0 → A, 1 → B ...)
    const getColumnLetter = (colIndex) => {
        let letter = "";
        let temp = colIndex + 1;

        while (temp > 0) {
            const mod = (temp - 1) % 26;
            letter = String.fromCharCode(65 + mod) + letter;
            temp = Math.floor((temp - mod) / 26);
        }
        return letter;
    };

    // const pickCenterCell = () => {
    //     const hot = hotRef?.current?.hotInstance;
    //     if (!hot) return;

    //     // store original selection to restore later
    //     const originalSelection = hot.getSelected?.() || null;
    //     targetSelectionRef.current = originalSelection; // ensure it's set (if modal opened via UI)

    //     // Close modal to allow user to click — we will re-open after pick
    //     setCondModalOpen(false);
    //     message.info("Click a cell to pick center value");

    //     const pickCell = (r, c) => {
    //         try {
    //             // r and c come from afterSelection hook params; but we will also try getSelectedLast if needed
    //             let row = r;
    //             let col = c;

    //             // If hook provides array arguments differently, try fallback
    //             if (Array.isArray(row)) {
    //                 // some versions call afterSelection(r, c, r2, c2, preventScrolling, selectionLayerLevel)
    //                 row = row[0];
    //             }

    //             // ensure we have a value
    //             const sel = hot.getSelectedLast?.() || [row, col];
    //             if (!sel) return;
    //             const [selRow, selCol] = sel;
    //             const val = hot.getDataAtCell(selRow, selCol);
    //             const numVal = Number(val);

    //             if (isNaN(numVal)) {
    //                 message.error("Selected cell must contain a numeric value");
    //             } else {
    //                 setCondRule((prev) => ({
    //                     ...prev,
    //                     CenterRef: { row: selRow, col: selCol },
    //                     CenterValue: numVal.toString(),
    //                 }));
    //             }
    //         } catch (err) {
    //             console.error("Error picking center cell", err);
    //         } finally {
    //             // cleanup hook and restore modal + selection
    //             hot.removeHook("afterSelection", pickCell);
    //             // restore selection (if we have original selection)
    //             if (originalSelection && originalSelection.length) {
    //                 try {
    //                     // originalSelection is an array of ranges [[r1,c1,r2,c2], ...]
    //                     const [r1, c1, r2, c2] = originalSelection[0];
    //                     // use selectCell API to reselect the original target cells
    //                     if (typeof hot.selectCell === "function") {
    //                         hot.selectCell(r1, c1, r2, c2);
    //                     } else if (typeof hot.selectCells === "function") {
    //                         hot.selectCells([[r1, c1, r2, c2]]);
    //                     }
    //                 } catch (e) {
    //                     // ignore restore errors
    //                 }
    //             }
    //             // re-open the modal after a tick (so UI flow feels natural)
    //             setTimeout(() => setCondModalOpen(true), 40);
    //         }
    //     };

    //     // add hook
    //     hot.addHook("afterSelection", pickCell);
    // };


    // ✅ Supported patterns
    //const PLACEHOLDER_REGEX = /^\{\{[\w.]+\}\}$/;
    const PLACEHOLDER_REGEX = /^\{\{[^{}]+\}\}$/;
    const EXCEL_ERROR_REGEX = /^#(VALUE!|DIV\/0!|REF!|NAME\?|NUM!|N\/A)$/i;

    // const pickCenterCell = () => {
    //     try {
    //         const hot = hotRef?.current?.hotInstance;
    //         if (!hot) return;

    //         // store original selection
    //         const originalSelection = hot.getSelected?.() || null;
    //         targetSelectionRef.current = originalSelection;

    //         // close modal to allow cell click
    //         setCondModalOpen(false);
    //         message.info("Click a cell to pick center value");

    //         const pickCell = (r, c) => {
    //             try {
    //                 let row = r;
    //                 let col = c;

    //                 // normalize hook arguments
    //                 if (Array.isArray(row)) {
    //                     row = row[0];
    //                 }

    //                 const sel = hot.getSelectedLast?.() || [row, col];
    //                 if (!sel) return;

    //                 const [selRow, selCol] = sel;
    //                 const val = hot.getDataAtCell(selRow, selCol);

    //                 // ❌ empty cell
    //                 if (val === null || val === undefined || val === "") {
    //                     message.error("Selected cell is empty");
    //                     return;
    //                 }

    //                 const stringVal = String(val).trim();
    //                 const numericVal = Number(stringVal);

    //                 const isNumber = !isNaN(numericVal);
    //                 const isPlaceholder = PLACEHOLDER_REGEX.test(stringVal);
    //                 const isExcelError = EXCEL_ERROR_REGEX.test(stringVal);

    //                 // ❌ invalid value
    //                 if (!isNumber && !isPlaceholder && !isExcelError) {
    //                     message.error(
    //                         "Center value must be a number, placeholder ({{Range}}), or Excel error (#VALUE!)"
    //                     );
    //                     return;
    //                 }

    //                 // ✅ save rule
    //                 // We need to know WHICH rule index to update. 
    //                 // Since this picker is async/callback based, we need to track the active rule index.
    //                 // For simplicity, we assume we are editing the *currently focused* rule or similar.
    //                 // But since the modal closes, we might lose that context.
    //                 // A better approach: store `activeRuleIndex` in a ref before closing.

    //                 // However, the original code used `setCondRule(prev => ...)`.
    //                 // We'll need `activeRuleIndexRef` to know which rule to update.

    //                 // !!! Quick fix for "Center Value" picker with multiple rules:
    //                 // We will assume the user clicked "Select Cell" on a specific rule.
    //                 // We need to modify `pickCenterCell` to accept an index.
    //                 console.warn("Center Cell Picker needs index support. Using index 0 or last active.");

    //                 setCondRules((prev) => {
    //                     const idx = activeRuleIndexRef.current ?? 0;
    //                     const rules = [...prev];
    //                     if (rules[idx]) {
    //                         rules[idx] = {
    //                             ...rules[idx],
    //                             CenterRef: { row: selRow, col: selCol },
    //                             CenterValue: isNumber ? numericVal.toString() : stringVal,
    //                         };
    //                     }
    //                     return rules;
    //                 });
    //             } catch (err) {
    //                 console.error("❌ Error picking center cell:", err);
    //             } finally {
    //                 // cleanup hook
    //                 hot.removeHook("afterSelection", pickCell);

    //                 // restore original selection
    //                 if (originalSelection?.length) {
    //                     try {
    //                         const [r1, c1, r2, c2] = originalSelection[0];
    //                         if (typeof hot.selectCell === "function") {
    //                             hot.selectCell(r1, c1, r2, c2);
    //                         } else if (typeof hot.selectCells === "function") {
    //                             hot.selectCells([[r1, c1, r2, c2]]);
    //                         }
    //                     } catch {
    //                         // ignore restore errors
    //                     }
    //                 }

    //                 // reopen modal smoothly
    //                 setTimeout(() => setCondModalOpen(true), 40);
    //             }
    //         };

    //         // attach hook
    //         hot.addHook("afterSelection", pickCell);
    //     } catch (error) {
    //         console.log(error);
    //     } finally {
    //         hot.removeHook("afterSelection", pickCell);

    //         const sourceSheet = centerPickSourceSheetRef.current;

    //         // 🔥 If user changed sheet, switch back
    //         if (sourceSheet && selectedSheet !== sourceSheet) {
    //             handleSelectChange(sourceSheet, "manual");
    //         }

    //         // Restore original selection if needed
    //         if (originalSelection?.length) {
    //             try {
    //                 const [r1, c1, r2, c2] = originalSelection[0];
    //                 if (typeof hot.selectCell === "function") {
    //                     hot.selectCell(r1, c1, r2, c2);
    //                 }
    //             } catch { }
    //         }

    //         // Reopen modal
    //         setTimeout(() => {
    //             setCondModalOpen(true);
    //         }, 100);
    //     }


    // };


    const pickCellCallbackRef = useRef(null);
    const activeRuleIndexRef = useRef(0); // Track which rule is being edited for cell picking

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (pickCellCallbackRef.current) {
                const hot = hotRef?.current?.hotInstance;
                if (hot) hot.removeHook("afterSelectionEnd", pickCellCallbackRef.current);
            }
        }
    }, [])


    const pickCenterCell = () => {
        const hot = hotRef?.current?.hotInstance;
        if (!hot) return;

        // 🔥 Store original selection (target range)
        const originalSelection = hot.getSelected?.() || null;
        targetSelectionRef.current = originalSelection;

        // 🔥 Store source sheet name
        const sourceSheet = centerPickSourceSheetRef.current;
        isPickingCenterRef.current = true; // Set flag so useEffect knows we are picking

        // Close modal
        setCondModalOpen(false);
        message.info("Click a cell to pick center value");

        pickCellCallbackRef.current = () => {
            // Need to get the CURRENT instance as it might have changed if we navigated sheets
            const currentHot = hotRef?.current?.hotInstance;
            if (!currentHot) return;

            try {
                const sel = currentHot.getSelectedLast?.();
                if (!sel) return;

                const [selRow, selCol] = sel;
                const val = currentHot.getDataAtCell(selRow, selCol);

                if (val === null || val === undefined || val === "") {
                    message.error("Selected cell is empty");
                    return;
                }

                const stringVal = String(val).trim();
                const numericVal = Number(stringVal);

                const isNumber = !isNaN(numericVal);
                const isPlaceholder = PLACEHOLDER_REGEX.test(stringVal);
                const isExcelError = EXCEL_ERROR_REGEX.test(stringVal);

                if (!isNumber && !isPlaceholder && !isExcelError) {
                    message.error(
                        "Center value must be number, placeholder, or Excel error"
                    );
                    return;
                }
                // ✅ Update correct rule
                setCondRules((prev) => {
                    const idx = activeRuleIndexRef.current ?? 0;
                    const rules = [...prev];

                    // Capture the sheet where the selection actually happened
                    const pickedSheet = selectedSheetRef.current;

                    rules[idx] = {
                        ...rules[idx],
                        CenterRef: { row: selRow, col: selCol, sheet: pickedSheet },
                        CenterValue: isNumber ? numericVal.toString() : stringVal,
                    };

                    return rules;
                });

            } catch (err) {
                console.error("Error picking center cell:", err);
            } finally {

                // 🔥 Remove hook immediately
                currentHot.removeHook("afterSelectionEnd", pickCellCallbackRef.current);
                isPickingCenterRef.current = false;

                // 🔥 If sheet changed → go back
                const currentSheet = selectedSheetRef.current;

                if (sourceSheet && currentSheet !== sourceSheet) {
                    handleSelectChangesheet(sourceSheet);

                    // We need to wait for the sheet change (which triggers a React re-render of HotTable) to finish
                    // before we can restore the selection and reopen the modal on the original sheet.
                    setTimeout(() => {
                        const originalHot = hotRef?.current?.hotInstance;
                        if (originalHot && originalSelection?.length) {
                            const [r1, c1, r2, c2] = originalSelection[0];
                            originalHot.selectCell(r1, c1, r2, c2);
                        }
                        setCondModalOpen(true);
                    }, 100);
                } else {
                    // 🔥 Restore original target selection
                    if (originalSelection?.length) {
                        const [r1, c1, r2, c2] = originalSelection[0];
                        currentHot.selectCell(r1, c1, r2, c2);
                    }

                    // 🔥 Reopen modal
                    setTimeout(() => {
                        setCondModalOpen(true);
                    }, 100);
                }
            }
        };

        // Use afterSelectionEnd (better than afterSelection)
        hot.addHook("afterSelectionEnd", pickCellCallbackRef.current);
    };


    const pickTargetRangeCallbackRef = useRef(null);
    const isPickingTargetRangeRef = useRef(false);

    const pickTargetRange = () => {
        const hot = hotRef?.current?.hotInstance;
        if (!hot) return;

        // store original selection
        const originalSelection = hot.getSelected?.() || null;
        targetSelectionRef.current = originalSelection;
        const sourceSheet = centerPickSourceSheetRef.current;
        isPickingTargetRangeRef.current = true;

        // close modal to allow cell click
        setCondModalOpen(false);
        message.info("Select cells to define the range");

        pickTargetRangeCallbackRef.current = (r, c, r2, c2) => {
            const currentHot = hotRef?.current?.hotInstance;
            if (!currentHot) return;

            try {
                // normalize hook arguments if needed
                // checking if we have a valid selection range
                const sel = currentHot.getSelectedLast?.() || [r, c, r2, c2];
                if (!sel) return;

                const [selR1, selC1, selR2, selC2] = sel;

                // Convert to address string
                // getRangeAddress handles [r1, c1, r2, c2]
                const address = getRangeAddress([[selR1, selC1, selR2, selC2]]);

                if (address) {
                    setTargetRange(address);
                }

            } catch (err) {
                console.error("❌ Error picking target range:", err);
            } finally {
                // cleanup hook
                currentHot.removeHook("afterSelectionEnd", pickTargetRangeCallbackRef.current);
                isPickingTargetRangeRef.current = false;

                // restore original sheet if needed
                const currentSheet = selectedSheetRef.current;
                if (sourceSheet && currentSheet !== sourceSheet) {
                    handleSelectChangesheet(sourceSheet);
                }

                // reopen modal smoothly
                setTimeout(() => setCondModalOpen(true), 100);
            }
        };

        // attach hook - use afterSelectionEnd to capture drag-select final state
        hot.addHook("afterSelectionEnd", pickTargetRangeCallbackRef.current);
    };


    useEffect(() => {
        if (!sheetNames || sheetNames.length === 0) return;

        // Convert all names to lowercase for case-insensitive match
        const lowerNames = sheetNames.map(name => name.toLowerCase());

        // Find first sheet starting with "cer"
        const defaultCer = sheetNames[lowerNames.findIndex(name => name.startsWith("cer"))];

        // Find first sheet starting with "obs"
        const defaultObs = sheetNames[lowerNames.findIndex(name => name.startsWith("obs"))];

        // Auto-select Calibration (cer*)
        if (defaultCer) {
            handleSelectChange(defaultCer, "calibration");
        }

        // Auto-select Observation (obs*)
        if (defaultObs) {
            handleSelectChange(defaultObs, "observation");
        }

    }, [sheetNames]);


    const hasConditionForCell = (row, col) => {
        const sheetData = cellStyles[selectedSheet] || {};
        const conditionalFormatting = sheetData.conditionalFormatting || [];
        return conditionalFormatting.some(cf => cf.row === row && cf.col === col);
    };

    const hasAnySheetError = Object.values(sheetErrorMap).some(v => v === true);

    const sheetsWithErrors = Object.entries(sheetErrorMap)
        .filter(([_, hasError]) => hasError)
        .map(([sheet]) => sheet)
        .join(", ");

    const HiddenSheets = selectedHiddenSheets.filter((data) => data !== null && data !== undefined && data !== "");


    const parseCellAddress = (address) => {
        const match = address.match(/^([A-Z]+)(\d+)$/);

        if (!match) return null;

        const colLetters = match[1];
        const row = parseInt(match[2], 10) - 1;

        let col = 0;

        for (let i = 0; i < colLetters.length; i++) {
            col = col * 26 + (colLetters.charCodeAt(i) - 64);
        }

        col -= 1;

        return { row, col };
    };

    const selectSingleCell = (address) => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) return;

        const parsed = parseCellAddress(address);
        if (!parsed) return;

        const { row, col } = parsed;

        hot.selectCell(row, col);
        hot.scrollViewportTo(row, col);
    };

    const selectRange = (range) => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) return;

        const [start, end] = range.split(":");

        const startCell = parseCellAddress(start);
        const endCell = parseCellAddress(end);

        if (!startCell || !endCell) return;

        hot.selectCell(
            startCell.row,
            startCell.col,
            endCell.row,
            endCell.col,
            true
        );

        hot.scrollViewportTo(startCell.row, startCell.col);
    };

    const handleAddressSubmit = () => {
        const hot = hotRef.current?.hotInstance;
        if (!hot) return;

        const input = addressInput.trim().toUpperCase();

        // Range selection
        if (input.includes(":")) {
            selectRange(input);
        } else {
            selectSingleCell(input);
        }
    };

    let rawClass = selectedCell?.style?.className;
    if (typeof rawClass === 'number') rawClass = 'htLeft';
    const classes = (rawClass || "").toString().split(" ").filter(Boolean);

    const HorizontalAlignActions = [
        {
            icon: <AlignLeftOutlined />,
            isActive: classes.includes("htLeft") ? "primary" : "default",
            onClick: () => { handlealignstyle("htLeft") },
        },
        {
            icon: <AlignCenterOutlined />,
            isActive: classes.includes("htCenter") ? "primary" : "default",
            onClick: () => handlealignstyle("htCenter"),
        },
        {
            icon: <AlignRightOutlined />,
            isActive: classes.includes("htRight") ? "primary" : "default",
            onClick: () => handlealignstyle("htRight"),
        },
    ];

    const VerticalAlignActions = [
        {
            icon: <VerticalAlignTopOutlined />,
            isActive: classes.includes("htTop") ? "primary" : "default",
            onClick: () => handlealignstyle("htTop"),
        },
        {
            icon: <VerticalAlignMiddleOutlined />,
            isActive: classes.includes("htMiddle") ? "primary" : "default",
            onClick: () => handlealignstyle("htMiddle"),
        },
        {
            icon: <VerticalAlignBottomOutlined />,
            isActive: classes.includes("htBottom") ? "primary" : "default",
            onClick: () => handlealignstyle("htBottom"),
        },
    ];

    const HorizontalAlignIcons =
        classes.includes("htRight")
            ? <AlignRightOutlined />
            : classes.includes("htCenter")
                ? <AlignCenterOutlined />
                : <AlignLeftOutlined />;
    const VerticalAlignIcons =
        classes.includes("htTop")
            ? <VerticalAlignTopOutlined />
            : classes.includes("htMiddle")
                ? <VerticalAlignMiddleOutlined />
                : <VerticalAlignBottomOutlined />;
    return (
        <>
            {/* ═══ Toolbar (Google Sheets style) ═══ */}
            <div className="toolbar">

                {/* ── Format Cells ── */}
                {permissions?.includes('EXCEL_FORMAT_CELLS') && (
                    <>
                        <div className="flex items-center gap-px shrink-0">
                            <ActionMenu
                                toolTipTitle="Horizontal Align"
                                actions={HorizontalAlignActions}
                                icon={HorizontalAlignIcons}
                            />
                            <ActionMenu
                                toolTipTitle="Vertical Align"
                                actions={VerticalAlignActions}
                                icon={VerticalAlignIcons}
                            />
                        </div>

                        <div className="toolbar-divider" />

                        <div className="flex items-center gap-px shrink-0">
                            <Tooltip title="Font Color">
                                <span>
                                    <ColorPicker
                                        allowClear
                                        onClear={() => handleFontColorChange(undefined)}
                                        onChangeComplete={(color) => {
                                            if (color && typeof color.toHexString === 'function') {
                                                handleFontColorChange(color.toHexString());
                                            } else if (typeof color === 'string') {
                                                handleFontColorChange(color);
                                            } else {
                                                handleFontColorChange(undefined);
                                            }
                                        }}
                                    >
                                        <Button icon={<FontColorsOutlined />} style={{ color: selectedCell?.style?.fontColor || "#444746" }} />
                                    </ColorPicker>
                                </span>
                            </Tooltip>

                            <Tooltip title="Fill Color">
                                <span>
                                    <ColorPicker
                                        allowClear
                                        onClear={() => handleColorChange(undefined)}
                                        onChangeComplete={(color) => {
                                            if (color && typeof color.toHexString === 'function') {
                                                handleColorChange(color.toHexString());
                                            } else if (typeof color === 'string') {
                                                handleColorChange(color);
                                            } else {
                                                handleColorChange(undefined);
                                            }
                                        }}
                                    >
                                        <Button icon={<BgColorsOutlined />} style={{ color: selectedCell?.style?.backgroundColor || "#444746" }} />
                                    </ColorPicker>
                                </span>
                            </Tooltip>
                        </div>

                        <div className="toolbar-divider" />

                        <Tooltip title="Bold">
                            <span className="shrink-0">
                                <Button
                                    type={isBoldActive ? "primary" : "default"}
                                    icon={<BoldOutlined />}
                                    onClick={handleBold}
                                />
                            </span>
                        </Tooltip>

                        <div className="toolbar-divider" />
                    </>
                )}

                {/* ── Merge ── */}
                {permissions?.includes('EXCEL_MERGE_CELLS') && (
                    <>
                        <Tooltip title="Merge Cells">
                            <span className="shrink-0">
                                <Button icon={<MergeCellsOutlined />} onClick={handleMergeUnmerge} />
                            </span>
                        </Tooltip>
                        <div className="toolbar-divider" />
                    </>
                )}

                {/* ── Decimal ── */}
                {permissions?.includes('EXCEL_DECIMAL_PRECISION') && (
                    <>
                        <div className="flex items-center gap-px shrink-0">
                            <Tooltip title="Decrease Decimal">
                                <span>
                                    <Button icon={<MinusOutlined />} onClick={handleDecimalDecrease} />
                                </span>
                            </Tooltip>

                            <Tooltip title="Decimal Count">
                                <div className="decimal-badge">
                                    {selectedCell?.decimalPrecision !== undefined ? selectedCell.decimalPrecision : 2}
                                </div>
                            </Tooltip>

                            <Tooltip title="Increase Decimal">
                                <span>
                                    <Button icon={<PlusOutlined />} onClick={handleDecimalIncrease} />
                                </span>
                            </Tooltip>
                        </div>
                        <div className="toolbar-divider" />
                    </>
                )}

                {/* ── Conditional Format ── */}
                {permissions?.includes('EXCEL_CONDITIONAL_FORMAT') && (
                    <>
                        <Tooltip title="Conditional Format">
                            <span className="shrink-0">
                                <Button
                                    type={(() => {
                                        const hot = hotRef.current?.hotInstance;
                                        const selection = hot?.getSelected();
                                        if (selection && selection.length) {
                                            const [r, c] = selection[0];
                                            return hasConditionForCell(r, c) ? "primary" : "default";
                                        }
                                        return "default";
                                    })()}
                                    // style={{
                                    //     background: (() => {
                                    //         const hot = hotRef.current?.hotInstance;
                                    //         const selection = hot?.getSelected();
                                    //         if (selection && selection.length) {
                                    //             const [r, c] = selection[0];
                                    //             return hasConditionForCell(r, c) ? "#fce8b2" : "transparent";
                                    //         }
                                    //         return "transparent";
                                    //     })(),
                                    // }}
                                    onClick={() => {
                                        const hot = hotRef.current?.hotInstance;
                                        if (!hot) return;

                                        const selection = hot.getSelected();

                                        if (!selection || selection.length === 0) {
                                            return Modal.warning({ content: "Please select a cell first" });
                                        }

                                        targetSelectionRef.current = selection;
                                        setTargetRange(getRangeAddress(selection));

                                        const [row1, col1] = selection[0];
                                        const sheetData = cellStyles[selectedSheet] || {};
                                        const conditionalFormatting = sheetData.conditionalFormatting || [];

                                        const existingRules = conditionalFormatting.filter(
                                            (cf) => cf.row === row1 && cf.col === col1
                                        );

                                        if (existingRules.length > 0) {
                                            const mappedRules = existingRules.map(r => ({
                                                operator: r.condition?.operator || ">",
                                                value: r.condition?.value || "",
                                                minValue: r.condition?.minValue || "",
                                                CenterValue: r.condition?.CenterValue || "",
                                                CenterRef: r.condition?.CenterRef || null,
                                                maxValue: r.condition?.maxValue || "",
                                                fontColor: r.fontColor || "#000000",
                                                bgColor: r.backgroundColor || "#ffffff",
                                            }));
                                            setCondRules(mappedRules);
                                        } else {
                                            setCondRules([DEFAULT_COND_RULE]);
                                        }

                                        setCondModalOpen(true);
                                    }}
                                    icon={<SlidersHorizontal size={16} />}
                                />
                            </span>
                        </Tooltip>
                        <div className="toolbar-divider" />
                    </>
                )}

                {/* ── Lock ── */}
                {permissions?.includes('EXCEL_CELL_LOCK_PERMISSIONS') && (
                    <>
                        <Tooltip title="Lock Cells">
                            <span className="shrink-0">
                                <Button icon={<LockOutlined />} onClick={onOpenPermissionModal} />
                            </span>
                        </Tooltip>
                        <div className="toolbar-divider" />
                    </>
                )}

                {/* ── Save ── */}
                {permissions?.includes('EXCEL_SAVE') && (
                    <>
                        <Tooltip
                            title={
                                hasAnySheetError
                                    ? `Cannot save. Fix errors in: ${sheetsWithErrors}`
                                    : "Save"
                            }
                        >
                            <span className="shrink-0">
                                <Button
                                    icon={<SaveOutlined />}
                                    onClick={handleSave}
                                    disabled={hasAnySheetError}
                                    style={{
                                        color: !hasAnySheetError && isDirty ? "#188038" : undefined,
                                        background: !hasAnySheetError && isDirty ? "#e6f4ea" : undefined,
                                    }}
                                />
                            </span>
                        </Tooltip>
                        <div className="toolbar-divider" />
                    </>
                )}

                {/* ── Page Setup ── */}
                {permissions?.includes('EXCEL_PAGE_SETUP') && (
                    <>
                        <Tooltip title="Page Setup">
                            <span className="shrink-0">
                                <Button icon={<SettingOutlined />} onClick={onOpenPrintSettings} />
                            </span>
                        </Tooltip>
                        <div className="toolbar-divider" />
                    </>
                )}

                {/* ── Download ── */}
                {permissions?.includes('EXCEL_DOWNLOAD') && (
                    <Tooltip title="Download All Sheets">
                        <span className="shrink-0">
                            <Button onClick={exportAllSheetsExcel} icon={<CloudDownloadOutlined />} />
                        </span>
                    </Tooltip>
                )}

                {/* ── Print Sheet Selectors ── */}
                {permissions?.includes('EXCEL_PRINT_SHEET_SELECT') && file && file.sheets && (
                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                        <Select
                            value={PrintonCertificate?.value}
                            onChange={(value) => handleSelectChange(value, "calibration")}
                            className="w-36 md:w-44"
                            size="middle"
                            options={["Calibration Result", ...sheetNames].map((name) => ({
                                label: name,
                                value: name,
                            }))}
                        />
                        <Select
                            value={ObservationCertificate?.value}
                            onChange={(value) => handleSelectChange(value, "observation")}
                            className="w-36 md:w-44"
                            size="middle"
                            options={["Observation Sheet", ...sheetNames].map((name) => ({
                                label: name,
                                value: name,
                            }))}
                        />
                    </div>
                )}

                {/* ── Hidden Sheets Selector ── */}
                {permissions?.includes('EXCEL_HIDDEN_SHEETS') && (!file || !file.sheets) && (
                    <div className="ml-auto shrink-0">
                        <Select
                            className="min-w-[180px] md:min-w-[360px]"
                            mode="multiple"
                            allowClear
                            placeholder="Choose Sheet to Hide"
                            size="middle"
                            value={HiddenSheets}
                            onChange={handleHiddenChange}
                            options={sheetNames.map(name => ({
                                label: name || `Sheet ${index + 1}`,
                                value: name ?? `sheet_${index}`
                            }))}
                        />
                    </div>
                )}
            </div>

            {/* ═══ Formula Bar (Google Sheets style) ═══ */}
            <div className="formula-bar">
                <div className="cell-address">
                    <Input
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value.toUpperCase())}
                        onPressEnter={handleAddressSubmit}
                    />
                </div>
                <div className="formula-input">
                    <Input
                        value={
                            selectedCell?.formula
                                ? `${selectedCell.formula}`
                                : selectedCell?.value
                        }
                        placeholder="Enter formula or value"
                        onChange={handleFormulaChange}
                        onPressEnter={handleFormulaSubmit}
                        disabled={selectedCell?.readOnly}
                        prefix="fx"
                    />
                </div>
            </div>

            {/* Conditional Formatting Modal */}
            < Modal
                title="Conditional Formatting"
                open={isCondModalOpen}
                onCancel={() => setCondModalOpen(false)}
                onOk={applyConditionalFormat}
                okText="Apply"
                width="50%"
                centered={true}
                okButtonProps={{
                    disabled: condRules.some(r =>
                        r.operator === "between" && !r.CenterValue
                    )
                }}
            >
                {/* Range Input */}
                <div style={{ marginBottom: 20 }}>
                    <Typography.Text strong>Applies to:</Typography.Text>
                    <Space.Compact style={{ width: '100%', marginTop: 5 }}>
                        <Input
                            value={targetRange}
                            onChange={(e) => setTargetRange(e.target.value)}
                            placeholder="=$A$1:$B$2"
                        />
                        <Button
                            type="primary"
                            onClick={pickTargetRange}
                        >
                            Select Range
                        </Button>
                    </Space.Compact>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {condRules.map((condRule, index) => (
                        <div key={index} style={{ marginBottom: 24, padding: 16, border: "1px solid #f0f0f0", borderRadius: 8, background: "#fafafa" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Typography.Text strong>Rule {index + 1}</Typography.Text>
                                {condRules.length > 1 && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            const newRules = condRules.filter((_, i) => i !== index);
                                            setCondRules(newRules);
                                        }}
                                    />
                                )}
                            </div>

                            < Row gutter={12}>
                                {/* Operator */}
                                < Col span={24} style={{ marginBottom: "10px" }}>
                                    <Select
                                        value={condRule.operator}
                                        style={{ width: "100%" }}
                                        onChange={(value) => {
                                            const newRules = [...condRules];
                                            newRules[index].operator = value;
                                            setCondRules(newRules);
                                        }}
                                        placeholder="Select condition"
                                    >
                                        {conditionOptions.map((opt) => (
                                            <Option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Col >

                                {
                                    condRule.operator === "between" ? (
                                        <>
                                            {/* Min */}
                                            <Col span={24} style={{ marginBottom: "10px" }}>
                                                <Input
                                                    placeholder="Min Value"
                                                    value={condRule.minValue}
                                                    onChange={(e) => {
                                                        const newRules = [...condRules];
                                                        newRules[index].minValue = e.target.value;
                                                        setCondRules(newRules);
                                                    }}
                                                />
                                            </Col>

                                            {/* Center Value Picker */}
                                            <Col span={24} style={{ marginBottom: "10px" }}>
                                                <Space.Compact style={{ width: "100%" }}>
                                                    <Input
                                                        placeholder="Center Value (Auto)"
                                                        readOnly
                                                        value={
                                                            condRule.CenterRef
                                                                ? `${getColumnLetter(condRule.CenterRef.col)}${condRule.CenterRef.row + 1} → ${condRule.CenterValue}`
                                                                : condRule.CenterValue
                                                        }
                                                    />

                                                    <Button
                                                        type="primary"
                                                        onClick={() => {
                                                            activeRuleIndexRef.current = index;
                                                            centerPickSourceSheetRef.current = selectedSheet;
                                                            pickCenterCell();
                                                        }}
                                                    >
                                                        Select Cell
                                                    </Button>
                                                </Space.Compact>
                                            </Col>

                                            {/* Max */}
                                            <Col span={24} style={{ marginBottom: "10px" }}>
                                                <Input
                                                    placeholder="Max Value"
                                                    value={condRule.maxValue}
                                                    onChange={(e) => {
                                                        const newRules = [...condRules];
                                                        newRules[index].maxValue = e.target.value;
                                                        setCondRules(newRules);
                                                    }}
                                                />
                                            </Col>
                                        </>
                                    ) : (
                                        <Col span={24} style={{ marginBottom: "10px" }}>
                                            <Input
                                                placeholder={condRule.operator === "formula" ? "Formula (e.g. =A1>5)" : "Value"}
                                                value={condRule.value}
                                                onChange={(e) => {
                                                    const newRules = [...condRules];
                                                    newRules[index].value = e.target.value;
                                                    setCondRules(newRules);
                                                }}
                                            />
                                        </Col>
                                    )
                                }
                            </Row >

                            {/* Color pickers */}
                            < Row gutter={16}>
                                <Col span={12}>
                                    <Title level={5} style={{ marginBottom: 8, fontSize: 14 }}>Font Color</Title>
                                    <ColorPicker
                                        value={condRule.fontColor}
                                        onChange={(color) => {
                                            const newRules = [...condRules];
                                            newRules[index].fontColor = color.toHexString();
                                            setCondRules(newRules);
                                        }}
                                    />
                                </Col>

                                <Col span={12}>
                                    <Title level={5} style={{ marginBottom: 8, fontSize: 14 }}>Background Color</Title>
                                    <ColorPicker
                                        value={condRule.bgColor}
                                        onChange={(color) => {
                                            const newRules = [...condRules];
                                            newRules[index].bgColor = color.toHexString();
                                            setCondRules(newRules);
                                        }}
                                    />
                                </Col>
                            </Row >
                        </div>
                    ))}

                    <Button
                        type="dashed"
                        onClick={() => setCondRules([...condRules, { ...DEFAULT_COND_RULE }])}
                        block
                        icon={<PlusOutlined />}
                    >
                        Add Another Rule
                    </Button>
                </div>


                {/* Reset Section at the bottom */}
                <Divider />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Tooltip title="Clear All Conditional Formats in Selection">
                        <span>
                            <Button
                                icon={<CloseOutlined />}
                                danger
                                onClick={handleClearConditionalFormat}
                            >
                                Clear All Rules for Selection
                            </Button>
                        </span>
                    </Tooltip>
                </div>
            </Modal >

        </>
    );
}

export default HeaderExcel;