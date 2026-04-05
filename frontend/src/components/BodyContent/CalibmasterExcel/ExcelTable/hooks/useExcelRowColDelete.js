/**
 * useExcelRowColDelete.js
 *
 * Handles safe row / column removal in Handsontable + HyperFormula.
 *
 * When a row or column is deleted on ANY sheet, every formula on EVERY
 * sheet that references a cell in the deleted range is updated:
 *
 *   • References INSIDE the deleted range  → replaced with #REF!
 *     (matches Google Sheets / Excel behaviour)
 *
 *   • References AFTER the deleted range   → shifted up/left by the
 *     number of deleted rows/cols so they still point at the same data
 *
 *   • Absolute references ($A$1)           → row/col axis that is
 *     absolute is never shifted (same as Google Sheets)
 *
 *   • Cross-sheet references (Sheet2!A1)   → correctly followed when
 *     the deletion happened on that sheet
 *
 * Wire-up in ExcelTable.jsx
 * ─────────────────────────
 *   import { useExcelRowColDelete } from "./hooks/useExcelRowColDelete";
 *
 *   const { handleAfterRemoveRow, handleAfterRemoveCol } = useExcelRowColDelete({
 *     hotRef,
 *     selectedSheet,
 *     sheetData,
 *     setSheetData,
 *     cellStyles,
 *     setCellStyles,
 *     decimalPrecisionMap,
 *     setDecimalPrecisionMap,
 *     mergedCells,
 *     setMergedCells,
 *     hyperFormulaInstance,
 *     setIsDirty,
 *   });
 *
 *   // In <HotTable …>
 *   afterRemoveRow={handleAfterRemoveRow}
 *   afterRemoveCol={handleAfterRemoveCol}
 *
 * NOTE: Keep your existing afterRemoveRow / afterRemoveCol handlers that
 * update cellStyles / mergedCells / decimalPrecisionMap via shiftStyles etc.
 * Call BOTH — the existing shift-utility call AND these handlers — or merge
 * this hook's logic into your existing callbacks (see bottom of file).
 */

import { useCallback } from "react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const lettersToCol = (colStr) =>
  colStr
    .toUpperCase()
    .split("")
    .reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;

const colToLetters = (col) => {
  let letter = "";
  let n = col + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
};

const normaliseSheetName = (raw = "") =>
  raw.replace(/^'(.*)'$/, "$1").toLowerCase();

// ─── core formula rewriter ────────────────────────────────────────────────────

/**
 * Rewrite one formula string after a row or column deletion.
 *
 * @param {string}  formula       Raw formula string (starts with "=")
 * @param {"row"|"col"} axis      Which axis was deleted
 * @param {number}  deleteStart   First deleted index (0-based)
 * @param {number}  deleteCount   How many rows/cols were deleted
 * @param {string}  formulaSheet  Sheet this formula lives on
 * @param {string}  deletedSheet  Sheet the deletion happened on
 * @returns {string} Rewritten formula
 */
const rewriteFormulaAfterDelete = (
  formula,
  axis,
  deleteStart,
  deleteCount,
  formulaSheet,
  deletedSheet
) => {
  if (!formula || !formula.trim().startsWith("=")) return formula;

  const normDeleted  = normaliseSheetName(deletedSheet);
  const normFormula  = normaliseSheetName(formulaSheet);
  const deleteEnd    = deleteStart + deleteCount - 1; // inclusive

  // Token regex — same as rebaseFormula in useExcelCutCopy
  const RE = /('[^']+'|[A-Za-z0-9_]+)?(!)?(\$?)([A-Za-z]{1,3})(\$?)(\d+)/g;

  return formula.replace(
    RE,
    (match, sheetName, bang, dCol, colStr, dRow, rowStr) => {
      // ── Decide which sheet this ref targets ──────────────────────────────
      if (sheetName && bang) {
        // Cross-sheet ref — only rewrite if it targets the deleted sheet
        if (normaliseSheetName(sheetName) !== normDeleted) return match;
      } else if (!sheetName && !bang) {
        // Same-sheet ref — only rewrite if the formula lives on deleted sheet
        if (normFormula !== normDeleted) return match;
      } else {
        return match; // malformed token
      }

      const col = lettersToCol(colStr);
      const row = parseInt(rowStr, 10) - 1; // convert to 0-based

      const prefix = sheetName && bang ? `${sheetName}!` : "";

      if (axis === "row") {
        // ── Row deletion ────────────────────────────────────────────────────
        if (dRow === "$") {
          // Absolute row — never shift
          return match;
        }

        if (row >= deleteStart && row <= deleteEnd) {
          // Reference falls inside deleted rows → #REF!
          // Preserve the column part so the error is traceable
          return `#REF!`;
        }

        if (row > deleteEnd) {
          // Reference is below deleted rows → shift up
          const newRow = row - deleteCount;
          return `${prefix}${dCol}${colStr}${dRow}${newRow + 1}`;
        }

        // Reference is above deleted rows → unchanged
        return match;

      } else {
        // ── Column deletion ─────────────────────────────────────────────────
        if (dCol === "$") {
          // Absolute column — never shift
          return match;
        }

        if (col >= deleteStart && col <= deleteEnd) {
          // Reference falls inside deleted cols → #REF!
          return `#REF!`;
        }

        if (col > deleteEnd) {
          // Reference is to the right of deleted cols → shift left
          const newCol = col - deleteCount;
          return `${prefix}${dCol}${colToLetters(newCol)}${dRow}${rowStr}`;
        }

        // Reference is to the left of deleted cols → unchanged
        return match;
      }
    }
  );
};

// ─── hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   hotRef: React.RefObject,
 *   selectedSheet: string,
 *   sheetData: object,
 *   setSheetData: function,
 *   cellStyles: object,
 *   setCellStyles: function,
 *   decimalPrecisionMap: object,
 *   setDecimalPrecisionMap: function,
 *   mergedCells: object,
 *   setMergedCells: function,
 *   hyperFormulaInstance: object|null,
 *   setIsDirty: function,
 * }} params
 */
export const useExcelRowColDelete = ({
  hotRef,
  selectedSheet,
  sheetData,
  setSheetData,
  cellStyles,
  setCellStyles,
  decimalPrecisionMap,
  setDecimalPrecisionMap,
  mergedCells,
  setMergedCells,
  hyperFormulaInstance,
  setIsDirty,
}) => {

  /**
   * Core worker — called by both handleAfterRemoveRow and handleAfterRemoveCol.
   *
   * @param {"row"|"col"} axis
   * @param {number}      deleteStart  First deleted index (0-based, physical)
   * @param {number}      deleteCount  How many were deleted
   */
  const rebaseAllFormulas = useCallback(
    (axis, deleteStart, deleteCount) => {
      if (!sheetData) return;

      const updatedSheets = {};

      Object.entries(sheetData).forEach(([sheetName, rows]) => {
        if (!Array.isArray(rows)) return;

        let sheetChanged = false;

        const updatedRows = rows.map((rowArr, r) => {
          if (!Array.isArray(rowArr)) return rowArr;

          return rowArr.map((cell, c) => {
            if (typeof cell !== "string" || !cell.trim().startsWith("=")) return cell;

            const rewritten = rewriteFormulaAfterDelete(
              cell,
              axis,
              deleteStart,
              deleteCount,
              sheetName,     // sheet this formula lives on
              selectedSheet  // sheet where deletion happened
            );

            if (rewritten === cell) return cell;

            sheetChanged = true;

            // Sync HyperFormula so live recalculation picks up the change
            if (hyperFormulaInstance) {
              try {
                const sheetId = hyperFormulaInstance.getSheetId(sheetName);
                if (typeof sheetId === "number") {
                  hyperFormulaInstance.setCellContents(
                    { sheet: sheetId, row: r, col: c },
                    [[rewritten]]
                  );
                }
              } catch (_) {
                // HF may already have shifted — safe to ignore
              }
            }

            return rewritten;
          });
        });

        if (sheetChanged) updatedSheets[sheetName] = updatedRows;
      });

      if (Object.keys(updatedSheets).length > 0) {
        setSheetData((prev) => ({ ...prev, ...updatedSheets }));

        // Re-render after state settles
        setTimeout(() => {
          try {
            hotRef.current?.hotInstance?.render();
          } catch (_) {}
        }, 30);
      }

      setIsDirty(true);
    },
    [sheetData, selectedSheet, hyperFormulaInstance, setSheetData, setIsDirty, hotRef]
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  handleAfterRemoveRow
  //  Wire: <HotTable afterRemoveRow={handleAfterRemoveRow} …>
  //
  //  Handsontable signature: afterRemoveRow(index, amount, physicalRows, source)
  //   • index        — first visual row index removed
  //   • amount       — how many rows removed
  //   • physicalRows — array of physical row indices (use these for accuracy)
  // ══════════════════════════════════════════════════════════════════════════
  const handleAfterRemoveRow = useCallback(
    (index, amount, physicalRows /*, source */) => {
      try {
        // Use the lowest physical row as deleteStart for formula rebase
        const deleteStart =
          Array.isArray(physicalRows) && physicalRows.length > 0
            ? Math.min(...physicalRows)
            : index;

        rebaseAllFormulas("row", deleteStart, amount);
      } catch (err) {
        console.error("[useExcelRowColDelete] afterRemoveRow error:", err);
      }
    },
    [rebaseAllFormulas]
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  handleAfterRemoveCol
  //  Wire: <HotTable afterRemoveCol={handleAfterRemoveCol} …>
  //
  //  Handsontable signature: afterRemoveCol(index, amount, physicalCols, source)
  // ══════════════════════════════════════════════════════════════════════════
  const handleAfterRemoveCol = useCallback(
    (index, amount, physicalCols /*, source */) => {
      try {
        const deleteStart =
          Array.isArray(physicalCols) && physicalCols.length > 0
            ? Math.min(...physicalCols)
            : index;

        rebaseAllFormulas("col", deleteStart, amount);
      } catch (err) {
        console.error("[useExcelRowColDelete] afterRemoveCol error:", err);
      }
    },
    [rebaseAllFormulas]
  );

  return { handleAfterRemoveRow, handleAfterRemoveCol };
};