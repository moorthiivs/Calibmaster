export function shiftStyles(sheetStyleObj, startIndex, amount, type, dimension) {
  if (!sheetStyleObj) return sheetStyleObj;

  const updated = {};

  // 1️⃣ Shift general (non-conditional) styles
  Object.entries(sheetStyleObj).forEach(([key, style]) => {
    if (key === "conditionalFormatting") return;
    if (key === "colWidths" || key === "rowHeights") return;

    if (typeof style === "object" && style?.row !== undefined && style?.col !== undefined) {
      const indexKey = dimension === "row" ? "row" : "col";
      const current = style[indexKey];

      if (type === "insert") {
        const newVal = current >= startIndex ? current + amount : current;
        const newStyle = { ...style, [indexKey]: newVal };
        const newKey = `${newStyle.row}-${newStyle.col}`;
        updated[newKey] = newStyle;
      } else if (type === "remove") {
        if (current >= startIndex + amount) {
          // Shift left/up
          const newVal = current - amount;
          const newStyle = { ...style, [indexKey]: newVal };
          const newKey = `${newStyle.row}-${newStyle.col}`;
          updated[newKey] = newStyle;
        } else if (current < startIndex) {
          // No change
          const newKey = `${style.row}-${style.col}`;
          updated[newKey] = style;
        }
        // If current is between startIndex and startIndex + amount -> DISCARD
      }
    } else {
      updated[key] = style;
    }
  });

  // 2️⃣ Shift conditional formatting
  const cond = sheetStyleObj.conditionalFormatting || [];
  const updatedCond = cond
    .map((rule) => {
      let newRule = { ...rule };
      const indexKey = dimension === "row" ? "row" : "col";
      const current = rule[indexKey];

      if (type === "insert") {
        if (current >= startIndex) {
          newRule[indexKey] = current + amount;
        }
      } else if (type === "remove") {
        if (current >= startIndex && current < startIndex + amount) {
          return null; // DISCARD
        }
        if (current >= startIndex + amount) {
          newRule[indexKey] = current - amount;
        }
      }

      // Shift CenterRef coords if they exist
      if (
        newRule.condition?.CenterRef &&
        typeof newRule.condition.CenterRef[indexKey] === "number"
      ) {
        const refIdx = newRule.condition.CenterRef[indexKey];
        if (type === "insert") {
          if (refIdx >= startIndex) {
            newRule.condition.CenterRef[indexKey] = refIdx + amount;
          }
        } else if (type === "remove") {
          if (refIdx >= startIndex && refIdx < startIndex + amount) {
            // Reference itself is deleted. Keep as-is or null out.
          } else if (refIdx >= startIndex + amount) {
            newRule.condition.CenterRef[indexKey] = refIdx - amount;
          }
        }
      }

      return newRule;
    })
    .filter(Boolean);

  updated.conditionalFormatting = updatedCond;

  // 3️⃣ Shift colWidths / rowHeights
  if (dimension === "col" && sheetStyleObj.colWidths) {
    const newColWidths = {};
    Object.entries(sheetStyleObj.colWidths).forEach(([colStr, width]) => {
      const colIdx = parseInt(colStr, 10);
      if (type === "insert") {
        newColWidths[colIdx >= startIndex ? colIdx + amount : colIdx] = width;
      } else if (type === "remove") {
        if (colIdx < startIndex) {
          newColWidths[colIdx] = width;
        } else if (colIdx >= startIndex + amount) {
          newColWidths[colIdx - amount] = width;
        }
      }
    });
    updated.colWidths = newColWidths;
    if (sheetStyleObj.rowHeights) updated.rowHeights = sheetStyleObj.rowHeights;
  } else if (dimension === "row" && sheetStyleObj.rowHeights) {
    const newRowHeights = {};
    Object.entries(sheetStyleObj.rowHeights).forEach(([rowStr, height]) => {
      const rowIdx = parseInt(rowStr, 10);
      if (type === "insert") {
        newRowHeights[rowIdx >= startIndex ? rowIdx + amount : rowIdx] = height;
      } else if (type === "remove") {
        if (rowIdx < startIndex) {
          newRowHeights[rowIdx] = height;
        } else if (rowIdx >= startIndex + amount) {
          newRowHeights[rowIdx - amount] = height;
        }
      }
    });
    updated.rowHeights = newRowHeights;
    if (sheetStyleObj.colWidths) updated.colWidths = sheetStyleObj.colWidths;
  } else {
    if (sheetStyleObj.colWidths) updated.colWidths = sheetStyleObj.colWidths;
    if (sheetStyleObj.rowHeights) updated.rowHeights = sheetStyleObj.rowHeights;
  }

  return updated;
}

export function shiftMerges(merges = [], startIndex, amount, type, dimension) {
  if (!Array.isArray(merges)) return merges;

  return merges
    .map((merge) => {
      const updated = { ...merge };
      const posKey = dimension === "row" ? "row" : "col";
      const spanKey = dimension === "row" ? "rowspan" : "colspan";

      const start = merge[posKey];
      const span = merge[spanKey];
      const end = start + span - 1;

      if (type === "insert") {
        if (start >= startIndex) {
          updated[posKey] += amount;
        } else if (startIndex > start && startIndex <= end) {
          // Insertion happens INSIDE the merge -> expand it
          updated[spanKey] += amount;
        }
      } else if (type === "remove") {
        const deleteStart = startIndex;
        const deleteEnd = startIndex + amount - 1;

        if (start > deleteEnd) {
          // Entire merge is after deleted range -> shift pos
          updated[posKey] -= amount;
        } else if (end < deleteStart) {
          // Entire merge is before deleted range -> no change
        } else {
          // Overlap -> shrink or delete
          const keptBefore = Math.max(0, deleteStart - start);
          const keptAfter = Math.max(0, end - deleteEnd);
          const newSpan = keptBefore + keptAfter;

          if (newSpan < 1) return null;

          // New start point for the potentially shrunk range
          const newStart = Math.min(start, deleteStart);
          
          updated[posKey] = newStart;
          updated[spanKey] = newSpan;

          // Special case: if it becomes a 1x1 merge, Handsontable doesn't need it
          // OR if it's the exact same as before (shouldn't happen in overlap case)
          if (updated.rowspan === 1 && updated.colspan === 1) return null;
        }
      }

      return updated;
    })
    .filter(Boolean);
}

export function shiftDecimalPrecisionMap(prevMap = {}, startIndex, amount, type, dimension) {
  const updated = {};

  Object.entries(prevMap).forEach(([key, value]) => {
    const [row, col] = key.split("-").map(Number);
    const pos = dimension === "row" ? row : col;

    if (type === "insert") {
      const newRow = dimension === "row" && row >= startIndex ? row + amount : row;
      const newCol = dimension === "col" && col >= startIndex ? col + amount : col;
      updated[`${newRow}-${newCol}`] = value;
    } else if (type === "remove") {
      if (pos >= startIndex && pos < startIndex + amount) {
        return; // DISCARD
      }
      const newRow = dimension === "row" && row >= startIndex + amount ? row - amount : row;
      const newCol = dimension === "col" && col >= startIndex + amount ? col - amount : col;
      updated[`${newRow}-${newCol}`] = value;
    }
  });

  return updated;
}
