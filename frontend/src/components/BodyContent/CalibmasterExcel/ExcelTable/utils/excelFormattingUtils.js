// 🔹 Excel Formatting manipulation and cleaning utilities

export function sanitizeMergedCells(mergedCellsArray = []) {
  if (!Array.isArray(mergedCellsArray)) return [];

  const sanitized = [];

  for (const current of mergedCellsArray) {
    if (
      typeof current.row !== "number" ||
      typeof current.col !== "number" ||
      typeof current.rowspan !== "number" ||
      typeof current.colspan !== "number"
    ) {
      continue; // skip invalid entries
    }

    const currentEndRow = current.row + current.rowspan - 1;
    const currentEndCol = current.col + current.colspan - 1;

    const overlaps = sanitized.some(existing => {
      const existingEndRow = existing.row + existing.rowspan - 1;
      const existingEndCol = existing.col + existing.colspan - 1;

      const rowOverlap =
        current.row <= existingEndRow && currentEndRow >= existing.row;
      const colOverlap =
        current.col <= existingEndCol && currentEndCol >= existing.col;

      return rowOverlap && colOverlap;
    });

    if (!overlaps) {
      sanitized.push(current);
    } else {
      console.warn(`⚠️ Skipped overlapping merge at [${current.row}, ${current.col}]`);
    }
  }

  return sanitized;
}
