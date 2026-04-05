// 🔹 Excel Data manipulation and cleaning utilities

export const convertFixedToRound = (data) => {
  return data.map((row) => {
    return row.map((cell) => {
      let cellValue = cell;

      // Handle formula or error objects: {"formula": "..."} or {"error": "..."}
      if (cellValue && typeof cellValue === "object") {
        if (cellValue.formula) {
          cellValue = cellValue.formula;
          if (typeof cellValue === "string" && !cellValue.startsWith("=")) {
            cellValue = "=" + cellValue;
          }
        } else if (cellValue.error) {
          cellValue = cellValue.error;
        }
      }

      if (
        typeof cellValue === "string" &&
        cellValue.toUpperCase().startsWith("=FIXED")
      ) {
        // Handle =FIXED(value, decimal)
        cellValue = cellValue.replace(
          /=FIXED\(([^,]+),\s*([^)]+)\)/i,
          "=ROUND($1, $2)"
        );
        // Handle =FIXED(value) - default to 2 decimal places
        cellValue = cellValue.replace(/=FIXED\(([^)]+)\)/i, "=ROUND($1, 2)");
      }
      return cellValue;
    });
  });
};

export const schemavalidation = (data) => {
  const isvalid = data !== undefined && data !== null;
  return isvalid;
};

// 🔹 Normalize label text
export const normalize = (str) => {
  return str
    .toUpperCase()
    .replace(/\s+/g, "")        // remove all spaces
    .replace(/\(/g, "[")        // replace ( → [
    .replace(/\)/g, "]")        // replace ) → ]
    .replace(/[^A-Z0-9\[\]]/g, ""); // keep only A-Z, 0-9, []
};

export const cleanValue = (val = "") =>
  String(val).replace(/\s+/g, " ").trim();

export const normalizeKey = (str = "") =>
  str.toLowerCase().replace(/\s+/g, "").trim();

export const isDoubleBracePlaceholder = (cell, key) => {
  if (typeof cell !== "string") return false;

  const match = cell.match(/^\{\{\s*(.*?)\s*\}\}$/);
  if (!match) return false;

  return normalizeKey(match[1]) === normalizeKey(key);
};

// export function normalizePastedData(data) {
//   return data
//     .map(row => row
//       .map(cell => (cell || "").trim())  // trim each cell
//       .filter(cell => cell !== "")       // remove empty accidental cells
//     )
//     .filter(row => row.length > 0);       // remove empty rows
// }

export function normalizePastedData(data) {
  // Guard: must be a non-empty 2D array
  if (!Array.isArray(data) || data.length === 0) return [[""]];

  // Step 1: normalize each cell — trim strings, convert null/undefined to ""
  const normalized = data.map(row => {
    if (!Array.isArray(row)) return [""];
    return row.map(cell => {
      if (cell === null || cell === undefined) return "";
      const str = String(cell);
      return str.trim();
      // ✅ DO NOT filter empty cells — column positions must be preserved
    });
  });

  // Step 2: find the true max column count across all rows
  const maxCols = Math.max(...normalized.map(row => row.length));
  if (maxCols <= 0) return [[""]];

  // Step 3: pad every row to the same width (rectangular grid)
  const rectangular = normalized.map(row => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push("");
    return padded;
    // ✅ DO NOT filter empty rows — row positions must be preserved
  });

  // Step 4: only strip fully-empty TRAILING rows (optional, safe)
  let lastNonEmptyRow = rectangular.length - 1;
  while (
    lastNonEmptyRow > 0 &&
    rectangular[lastNonEmptyRow].every(cell => cell === "")
  ) {
    lastNonEmptyRow--;
  }

  return rectangular.slice(0, lastNonEmptyRow + 1);
}

export function cleanRawPaste(text) {
  return text
    .replace(/\t{2,}/g, "\t")       // convert multiple tabs → single tab
    .replace(/ {2,}/g, "\t")        // convert multi-spaces → tab
    .replace(/\s+\t/g, "\t")        // clean spaces before tab
    .replace(/\t\s+/g, "\t")        // clean spaces after tab
    .trim();
}
