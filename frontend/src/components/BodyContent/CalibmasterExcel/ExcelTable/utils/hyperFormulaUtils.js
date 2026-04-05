import { HyperFormula, FunctionPlugin } from "hyperformula";

// Register the custom MODE function plugin for HyperFormula
export class ModePlugin extends FunctionPlugin {
  mode(ast, state) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata("MODE"),
      (range, precision) => {
        try {
          // Debug raw inputs

          let flat = [];

          if (Array.isArray(range)) {
            // Handle raw array input
            flat = range.flat().filter((v) => v !== null && v !== undefined && v !== "");
          } else if (range?.data) {
            // Handle SimpleRangeValue with visible data property (some versions)
            flat = range.data.flat().filter((v) => v !== null && v !== undefined && v !== "");
          } else if (range && (typeof range[Symbol.iterator] === 'function')) {
            // Handle SimpleRangeValue (iterable)
            for (const cell of range) {
              if (cell !== null && cell !== undefined && cell !== "") {
                flat.push(cell);
              }
            }
          } else if (range !== null && range !== undefined && range !== "") {
            // Handle scalar input (single cell)
            flat = [range];
          }

          if (flat.length === 0) return "#N/A";

          // Use default precision of 4 as per user preference in previous edits
          // They asked to remove the decimal argument but still want decimals to work.
          // Using a safety round of 4 ensures 9.9801 vs 9.9802 are matching if they should.. 
          // wait, actually 9.9801 is 4 decimals. 
          // Let's use 9 digits to be safe for "exact" matching but handling float epsilon.
          // Or stick to 4 if that's what they wanted.
          // User edited to 4. I will respect 4.
          let decimalPlaces = 4;

          if (precision) {
            decimalPlaces = precision;
          }
          const processedValues = flat.map(v => {
            const num = parseFloat(v);
            if (!isNaN(num)) {
              return parseFloat(num.toFixed(decimalPlaces));
            }
            return v;
          });

          const counts = {};
          let maxCount = 0;
          let modeVal = processedValues[0];

          for (const v of processedValues) {
            const key = String(v);
            counts[key] = (counts[key] || 0) + 1;
            if (counts[key] > maxCount) {
              maxCount = counts[key];
              modeVal = v;
            }
          }

          // If user specified precision explicitly, return as fixed-point string to preserve trailing zeros (e.g. 9.980)
          if (precision !== undefined && precision !== null && typeof modeVal === 'number') {
            return modeVal.toFixed(decimalPlaces);
          }

          return modeVal;
        } catch (err) {
          console.error("MODE Function Error:", err);
          return "#ERROR!";
        }
      }
    );
  }
}

ModePlugin.implementedFunctions = {
  MODE: {
    method: "mode",
    parameters: [
      { argumentType: "RANGE" },
      { argumentType: "SCALAR", optional: true, defaultValue: 3 }
    ],
  },
};

// Function to register the plugin globally
export const registerModePlugin = () => {
  HyperFormula.registerFunctionPlugin(ModePlugin, {
    enGB: { MODE: "MODE" },
    enUS: { MODE: "MODE" },
  });
};

export function evaluateHFFormula(formula, row, col, instance) {
  try {
    if (typeof formula !== "string") return NaN;

    const trimmed = formula.trim();

    // Must start with "=" and be valid length
    if (!trimmed.startsWith("=") || trimmed.length === 1) {
      return NaN;
    }

    const formulasPlugin = instance.getPlugin("formulas");
    const hf = formulasPlugin?.engine;
    if (!hf) return NaN;

    const sheetName = instance.getSettings().formulas.sheetName;
    const sheetId = hf.getSheetId(sheetName);
    if (sheetId == null) return NaN;

    // ✅ KEEP "=" — HyperFormula needs it
    return hf.calculateFormula(
      trimmed,
      sheetId,
      { row, col }
    );
  } catch (e) {
    if (e?.name !== "NotAFormulaError") {
      console.error("Formula evaluation error:", e);
    }
    return NaN;
  }
}
