import { useRef, useCallback, useEffect } from "react";

// ─── Cell-address helpers ────────────────────────────────────────────────────

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


const rebaseFormula = (formula, src, rowDelta, colDelta, formulaSheet, srcSheet) => {
  if (!formula || !formula.trim().startsWith("=")) return formula;

  const normSrc = normaliseSheetName(srcSheet);

  const RE = /('[^']+'|[A-Za-z0-9_]+)?(!)?(\$?)([A-Za-z]{1,3})(\$?)(\d+)/g;

  return formula.replace(
    RE,
    (match, sheetName, bang, dCol, colStr, dRow, rowStr) => {
      let refSheet; // which sheet does this reference point to?

      if (sheetName && bang) {
        // Cross-sheet reference — rebase only if it targets srcSheet
        refSheet = normaliseSheetName(sheetName);
        if (refSheet !== normSrc) return match; // different sheet — leave alone
      } else if (!sheetName && !bang) {
        // Same-sheet reference — rebase only if this formula lives on srcSheet
        if (normaliseSheetName(formulaSheet) !== normSrc) return match;
      } else {
        return match; // malformed token — skip
      }

      const col = lettersToCol(colStr);
      const row = parseInt(rowStr, 10) - 1;

      const inRange =
        row >= src.startRow &&
        row <= src.endRow &&
        col >= src.startCol &&
        col <= src.endCol;

      if (!inRange) return match;

      // Absolute axes are never shifted
      const newCol = dCol === "$" ? col : col + colDelta;
      const newRow = dRow === "$" ? row : row + rowDelta;

      if (newCol < 0 || newRow < 0) return match;

      // Reconstruct — keep the sheet prefix if it was there
      const prefix = sheetName && bang ? `${sheetName}!` : "";
      return `${prefix}${dCol}${colToLetters(newCol)}${dRow}${newRow + 1}`;
    }
  );
};

const OVERLAY_ID = "hot-cut-copy-svg-overlay";
const STYLE_ID = "hot-cut-copy-style";

// RAF handle — module-level so removeOverlay() can cancel it from anywhere
let _rafHandle = null;

const injectCSS = () => {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes marchingAnts { to { stroke-dashoffset: -24; } }
    #${OVERLAY_ID} {
      position: fixed;
      pointer-events: none;
      z-index: 99999;
      overflow: visible;
    }
    #${OVERLAY_ID} rect {
      fill: none;
      stroke-width: 2;
      stroke-dasharray: 6 4;
      stroke-dashoffset: 0;
      animation: marchingAnts 0.45s linear infinite;
    }
  `;
  document.head.appendChild(s);
};

export const removeOverlay = () => {
  if (_rafHandle !== null) {
    cancelAnimationFrame(_rafHandle);
    _rafHandle = null;
  }
  const el = document.getElementById(OVERLAY_ID);
  if (el) el.remove();
};


const getTableViewportRect = (hot) => {
  try {
    const holder =
      hot.view?._wt?.wtTable?.holder ||
      hot.rootElement?.querySelector(".wtHolder") ||
      hot.rootElement;
    return holder ? holder.getBoundingClientRect() : null;
  } catch (_) {
    return null;
  }
};

/**
 * Draw animated dashed border and start the scroll-tracking RAF loop.
 *
 * @param {object}     hot    Handsontable instance
 * @param {number[][]} ranges [[r1,c1,r2,c2], ...]
 * @param {boolean}    isCut
 */
const drawOverlay = (hot, ranges, isCut) => {
  removeOverlay(); // cancel previous loop + remove old SVG
  if (!hot || !ranges?.length) return;

  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
  ranges.forEach(([r1, c1, r2, c2]) => {
    minR = Math.min(minR, r1, r2);
    minC = Math.min(minC, c1, c2);
    maxR = Math.max(maxR, r1, r2);
    maxC = Math.max(maxC, c1, c2);
  });

  injectCSS();

  // Create SVG once — RAF loop repositions it every frame
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = OVERLAY_ID;

  const rectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rectEl.setAttribute("x", 1);
  rectEl.setAttribute("y", 1);
  rectEl.style.stroke = isCut ? "#f59e0b" : "#3b82f6";
  svg.appendChild(rectEl);
  document.body.appendChild(svg);

  // ── RAF repositioning loop ────────────────────────────────────────────────
  const tick = () => {
    const overlayEl = document.getElementById(OVERLAY_ID);
    if (!overlayEl) return; // removed externally — stop loop

    try {
      const tlTD = hot.getCell(minR, minC);
      const brTD = hot.getCell(maxR, maxC);

      if (!tlTD || !brTD) {
        // Cell not in DOM (virtualised / scrolled far away) — hide overlay
        overlayEl.style.display = "none";
        _rafHandle = requestAnimationFrame(tick);
        return;
      }

      const tl = tlTD.getBoundingClientRect();
      const br = brTD.getBoundingClientRect();
      const vp = getTableViewportRect(hot);

      if (vp) {
        // Hide when source cell has scrolled fully outside the table viewport
        const outOfView =
          br.bottom <= vp.top ||  // scrolled above visible area
          tl.top >= vp.bottom ||  // scrolled below visible area
          br.right <= vp.left ||  // scrolled left of visible area
          tl.left >= vp.right;     // scrolled right of visible area

        if (outOfView) {
          overlayEl.style.display = "none";
          _rafHandle = requestAnimationFrame(tick);
          return;
        }
      }

      // Cell is visible — update position and dimensions
      const W = Math.max(0, br.right - tl.left);
      const H = Math.max(0, br.bottom - tl.top);

      overlayEl.style.display = "";
      overlayEl.style.left = `${tl.left}px`;
      overlayEl.style.top = `${tl.top}px`;
      overlayEl.setAttribute("width", W);
      overlayEl.setAttribute("height", H);
      rectEl.setAttribute("width", Math.max(0, W - 2));
      rectEl.setAttribute("height", Math.max(0, H - 2));

    } catch (_) {
      // DOM not ready — skip frame silently
    }

    _rafHandle = requestAnimationFrame(tick);
  };

  _rafHandle = requestAnimationFrame(tick);
};


// ─── Main hook ───────────────────────────────────────────────────────────────

export const useExcelCutCopy = ({
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
  trackAction,
}) => {
  const isCutRef = useRef(false);
  const sourceRangeRef = useRef(null);
  const cutSnapshotRef = useRef(null);
  // Remember which sheet the cut happened on — needed for cross-sheet rebase
  const sourceSheetRef = useRef(null);

  // Reset when sheet changes
  useEffect(() => {
    removeOverlay();
    isCutRef.current = false;
    sourceRangeRef.current = null;
    cutSnapshotRef.current = null;
    // Don't reset sourceSheetRef here — the cut may have been on another sheet
  }, [selectedSheet]);

  // Global Ctrl+X / Ctrl+C listener
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "x" || e.key === "X") isCutRef.current = true;
      if (e.key === "c" || e.key === "C") isCutRef.current = false;
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  // Escape dismisses overlay
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      removeOverlay();
      isCutRef.current = false;
      sourceRangeRef.current = null;
      cutSnapshotRef.current = null;
      sourceSheetRef.current = null;
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  //  beforeCut
  // ══════════════════════════════════════════════════════════════════════════
  const handleBeforeCut = useCallback(
    (data, coords) => {
      isCutRef.current = true;
      sourceSheetRef.current = selectedSheet; // ← remember cut origin sheet
      const hot = hotRef.current?.hotInstance;
      if (!hot || !coords?.length) return;

      const r1 = Math.min(coords[0].startRow, coords[0].endRow);
      const c1 = Math.min(coords[0].startCol, coords[0].endCol);
      const r2 = Math.max(coords[0].startRow, coords[0].endRow);
      const c2 = Math.max(coords[0].startCol, coords[0].endCol);

      sourceRangeRef.current = { startRow: r1, startCol: c1, endRow: r2, endCol: c2 };

      const snap = [];
      for (let r = r1; r <= r2; r++) {
        const row = [];
        for (let c = c1; c <= c2; c++) row.push(hot.getSourceDataAtCell(r, c));
        snap.push(row);
      }
      cutSnapshotRef.current = snap;

      drawOverlay(hot, [[r1, c1, r2, c2]], true);
    },
    [hotRef, selectedSheet]
  );


  const handleBeforeCopy = useCallback(
    (data, coords) => {
      isCutRef.current = false;
      sourceSheetRef.current = selectedSheet;
      const hot = hotRef.current?.hotInstance;
      if (!hot || !coords?.length) return;

      const r1 = Math.min(coords[0].startRow, coords[0].endRow);
      const c1 = Math.min(coords[0].startCol, coords[0].endCol);
      const r2 = Math.max(coords[0].startRow, coords[0].endRow);
      const c2 = Math.max(coords[0].startCol, coords[0].endCol);

      sourceRangeRef.current = { startRow: r1, startCol: c1, endRow: r2, endCol: c2 };


      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const dataRow = r - r1;
          const dataCol = c - c1;

          // Guard: row/col must exist in the data array
          if (!Array.isArray(data[dataRow])) continue;

          const raw = hot.getSourceDataAtCell(r, c);
          

          // Only replace when there is actually a formula — leave plain values as-is
          if (typeof raw === "string" && raw.trim().startsWith("=")) {
            data[dataRow][dataCol] = raw;
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      drawOverlay(hot, [[r1, c1, r2, c2]], false);
    },
    [hotRef, selectedSheet]
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  afterPaste
  // ══════════════════════════════════════════════════════════════════════════
  const handleAfterPaste = useCallback(
    (data, coords) => {
      const hot = hotRef.current?.hotInstance;
      if (!hot || !coords?.length) return;

      const src = sourceRangeRef.current;
      const wasCut = isCutRef.current;
      const srcSheet = sourceSheetRef.current; // sheet the cut came from

      removeOverlay();
      if (!src) return;

      const destR1 = coords[0].startRow;
      const destC1 = coords[0].startCol;
      const rowDelta = destR1 - src.startRow;
      const colDelta = destC1 - src.startCol;

      // ── 1. Clear source cells (CUT only) ──────────────────────────────────
      if (wasCut) {
        const destR2 = destR1 + (src.endRow - src.startRow);
        const destC2 = destC1 + (src.endCol - src.startCol);

        // Don't clear when destination overlaps source
        const overlaps =
          destR1 <= src.endRow && destR2 >= src.startRow &&
          destC1 <= src.endCol && destC2 >= src.startCol;

        if (!overlaps) {
          // a) Clear cell values on source sheet
          // We only have a Handsontable instance for the active sheet.
          // If cut was on the same sheet as paste, use setDataAtCell directly.
          // If cut was on a different sheet, update sheetData state.
          if (srcSheet === selectedSheet) {
            const clears = [];
            for (let r = src.startRow; r <= src.endRow; r++)
              for (let c = src.startCol; c <= src.endCol; c++)
                clears.push([r, c, ""]);
            hot.setDataAtCell(clears, "CutClear");
          } else {
            // Patch sheetData for the source sheet directly
            setSheetData((prev) => {
              const next = { ...prev };
              const rows = next[srcSheet]
                ? next[srcSheet].map((row) => [...row])
                : [];
              for (let r = src.startRow; r <= src.endRow; r++)
                for (let c = src.startCol; c <= src.endCol; c++)
                  if (rows[r]) rows[r][c] = "";
              next[srcSheet] = rows;
              return next;
            });
          }

          // b) Purge cellStyles for the source range on srcSheet
          setCellStyles((prev) => {
            const next = { ...prev };
            const sheetSty = { ...(next[srcSheet] || {}) };

            Object.keys(sheetSty).forEach((k) => {
              const s = sheetSty[k];
              if (
                s &&
                typeof s.row === "number" &&
                typeof s.col === "number" &&
                s.row >= src.startRow && s.row <= src.endRow &&
                s.col >= src.startCol && s.col <= src.endCol
              ) {
                delete sheetSty[k];
              }
            });

            if (Array.isArray(sheetSty.conditionalFormatting)) {
              sheetSty.conditionalFormatting = sheetSty.conditionalFormatting.filter(
                (cf) =>
                  !(
                    cf.row >= src.startRow && cf.row <= src.endRow &&
                    cf.col >= src.startCol && cf.col <= src.endCol
                  )
              );
            }

            next[srcSheet] = sheetSty;
            return next;
          });

          // c) Purge decimalPrecisionMap for the source range on srcSheet
          setDecimalPrecisionMap((prev) => {
            const next = { ...prev };
            const sheetMap = { ...(next[srcSheet] || {}) };
            for (let r = src.startRow; r <= src.endRow; r++)
              for (let c = src.startCol; c <= src.endCol; c++)
                delete sheetMap[`${r}-${c}`];
            next[srcSheet] = sheetMap;
            return next;
          });

          // d) Remove merged-cell entries from the source range on srcSheet
          setMergedCells((prev) => {
            const next = { ...prev };
            next[srcSheet] = (next[srcSheet] || []).filter(
              (m) =>
                !(
                  m.row >= src.startRow && m.row <= src.endRow &&
                  m.col >= src.startCol && m.col <= src.endCol
                )
            );
            return next;
          });

          // e) Optional undo tracking
          if (typeof trackAction === "function") {
            trackAction({
              type: "CUT_CLEAR",
              payload: {
                sheet: srcSheet,
                src,
                snapshot: cutSnapshotRef.current,
              },
            });
          }
        }
      }

      // ── 2. Rebase formulas that reference the moved range ──────────────────
      // Applies to CUT only (copy keeps references fixed, like Google Sheets).
      // *** KEY FIX: scan ALL sheets, not just the active one. ***
      if (wasCut && (rowDelta !== 0 || colDelta !== 0)) {
        const allSheetData = sheetData; // snapshot before setState

        const updatedSheets = {};

        Object.entries(allSheetData).forEach(([sheetName, rows]) => {
          if (!rows) return;
          let sheetChanged = false;

          const updatedRows = rows.map((rowArr, r) =>
            rowArr.map((cell, c) => {
              if (typeof cell !== "string" || !cell.trim().startsWith("=")) return cell;

              // Cells that were physically moved by Handsontable's paste —
              // their own cell references were already adjusted by HOT, so
              // we must NOT double-shift them.
              const isDestinationCell =
                sheetName === selectedSheet &&
                r >= destR1 &&
                r <= destR1 + (src.endRow - src.startRow) &&
                c >= destC1 &&
                c <= destC1 + (src.endCol - src.startCol);

              if (isDestinationCell) return cell;

              // Also skip cells that were the source on srcSheet (now cleared)
              const isSourceCell =
                sheetName === srcSheet &&
                r >= src.startRow && r <= src.endRow &&
                c >= src.startCol && c <= src.endCol;

              if (isSourceCell) return cell;

              const rebased = rebaseFormula(
                cell,
                src,
                rowDelta,
                colDelta,
                sheetName,  // ← sheet this formula lives on
                srcSheet    // ← sheet the cut happened on
              );

              if (rebased === cell) return cell;

              sheetChanged = true;

              // Keep HyperFormula in sync
              if (hyperFormulaInstance) {
                try {
                  const sheetId = hyperFormulaInstance.getSheetId(sheetName);
                  if (typeof sheetId === "number") {
                    hyperFormulaInstance.setCellContents(
                      { sheet: sheetId, row: r, col: c },
                      [[rebased]]
                    );
                  }
                } catch (_) { }
              }

              return rebased;
            })
          );

          if (sheetChanged) updatedSheets[sheetName] = updatedRows;
        });

        if (Object.keys(updatedSheets).length > 0) {
          setSheetData((prev) => ({ ...prev, ...updatedSheets }));
          setTimeout(() => {
            hotRef.current?.hotInstance?.render();
          }, 30);
        }
      }

      if (typeof setIsDirty === "function") setIsDirty(true);

      // Reset state
      isCutRef.current = false;
      sourceRangeRef.current = null;
      cutSnapshotRef.current = null;
      sourceSheetRef.current = null;
    },
    [
      hotRef,
      selectedSheet,
      sheetData,
      setSheetData,
      setCellStyles,
      setDecimalPrecisionMap,
      setMergedCells,
      hyperFormulaInstance,
      setIsDirty,
      trackAction,
    ]
  );

  return { handleBeforeCut, handleBeforeCopy, handleAfterPaste };
};