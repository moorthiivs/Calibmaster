import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Modal, InputNumber, Tooltip, message, notification } from "antd";
import { HotTable } from "@handsontable/react-wrapper";
import Handsontable from "handsontable";
import {
  PrinterOutlined, FileTextOutlined, SettingOutlined, CheckOutlined,
  ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, BorderOutlined,
} from "@ant-design/icons";

const A4_W_MM = 210;
const A4_H_MM = 297;
const BASE_W = 560;
const BASE_H = Math.round(BASE_W * (A4_H_MM / A4_W_MM));
const DEFAULT_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

// ─── helpers ────────────────────────────────────────────────────────────────
function classNameToTextAlign(cn) {
  if (!cn || typeof cn !== "string") return "left";
  if (cn.includes("htCenter")) return "center";
  if (cn.includes("htRight")) return "right";
  if (cn.includes("htJustify")) return "justify";
  return "left";
}
function classNameToVertAlign(cn) {
  if (!cn || typeof cn !== "string") return "middle";
  if (cn.includes("htTop")) return "top";
  if (cn.includes("htBottom")) return "bottom";
  return "middle";
}

// ─── HotTablePreview — renders a real read-only Handsontable ────────────────
function HotTablePreview({
  sheetData, cellStyles, mergedCells, selectedSheet,
  margins, landscape, zoom, printFontSize, hyperFormulaInstance,
}) {
  const previewRef = useRef(null);

  const data = useMemo(() => {
    const raw = sheetData?.[selectedSheet] || [];
    // Deep-clone so preview mutations never touch the real data
    return raw.map(row => [...(row || [])]);
  }, [sheetData, selectedSheet]);

  const sheetStyles = useMemo(() => cellStyles?.[selectedSheet] || {}, [cellStyles, selectedSheet]);
  const merges = useMemo(() => mergedCells?.[selectedSheet] || [], [mergedCells, selectedSheet]);

  const colWidths = sheetStyles.colWidths || {};
  const rowHeights = sheetStyles.rowHeights || {};

  // Page dimensions in px
  const pageW = (landscape ? BASE_H : BASE_W) * zoom;
  const pageH = (landscape ? BASE_W : BASE_H) * zoom;
  const mmW = landscape ? A4_H_MM : A4_W_MM;
  const mmH = landscape ? A4_W_MM : A4_H_MM;

  const mLeft = (margins.left / mmW) * pageW;
  const mTop = (margins.top / mmH) * pageH;
  const mRight = (margins.right / mmW) * pageW;
  const availW = Math.max(1, pageW - mLeft - mRight);
  const availH = Math.max(1, pageH - mTop - (margins.bottom / mmH) * pageH);

  // Build O(1) style lookup
  const styleLookup = useMemo(() => {
    const lu = {};
    Object.values(sheetStyles).forEach(val => {
      if (val && typeof val.row === "number" && typeof val.col === "number") {
        lu[`${val.row}-${val.col}`] = val;
      }
    });
    return lu;
  }, [sheetStyles]);

  const baseFontSize = printFontSize || 8;

  // Cells renderer mirrors the main ExcelTable renderer (simplified for preview)
  const cellsRenderer = useCallback((row, col) => {
    const key = `${row}-${col}`;
    const s = styleLookup[key] || {};
    return {
      className: s.className || "",
      readOnly: true,
      renderer(instance, td, r, c, prop, value) {
        Handsontable.renderers.TextRenderer.apply(this, arguments);

        // Resolve formula display value via HyperFormula
        if (
          typeof value === "string" &&
          value.startsWith("=") &&
          hyperFormulaInstance
        ) {
          try {
            const sheetId = hyperFormulaInstance.getSheetId(selectedSheet);
            if (sheetId !== undefined && sheetId !== null) {
              const result = hyperFormulaInstance.getCellValue({
                sheet: sheetId, row: r, col: c,
              });
              if (
                result !== null &&
                result !== undefined &&
                !(typeof result === "object" && result.type === "ERROR")
              ) {
                td.innerText = String(result);
              }
            }
          } catch (_) { /* fall through */ }
        }

        // Apply saved cell styles
        if (s.backgroundColor) td.style.backgroundColor = s.backgroundColor;
        if (s.fontColor) td.style.color = s.fontColor;
        if (s.bold) td.style.fontWeight = "bold";
        if (s.italic) td.style.fontStyle = "italic";
        if (s.underline) td.style.textDecoration = "underline";
        if (s.fontFamily) td.style.fontFamily = s.fontFamily;

        td.style.fontSize = (s.fontSize ? parseInt(s.fontSize) : baseFontSize) + "px";
        td.style.textAlign = classNameToTextAlign(s.className);
        td.style.verticalAlign = classNameToVertAlign(s.className);
        td.style.whiteSpace = "normal";
        td.style.overflow = "hidden";
      },
    };
  }, [styleLookup, baseFontSize, hyperFormulaInstance, selectedSheet]);

  // Column width accessor
  const colWidthFn = useCallback((index) => {
    const w = colWidths[index];
    return (w !== undefined && w > 0) ? w : 80;
  }, [colWidths]);

  // Row height accessor
  const rowHeightFn = useCallback((index) => {
    const h = rowHeights[index];
    return (h !== undefined && h > 0) ? h : 22;
  }, [rowHeights]);

  // Safe merged cells
  const safeMerges = useMemo(() => {
    const totalRows = data.length;
    const totalCols = (data[0] || []).length;
    return merges.filter(m =>
      m &&
      Number.isInteger(m.row) && Number.isInteger(m.col) &&
      Number.isInteger(m.rowspan) && Number.isInteger(m.colspan) &&
      m.rowspan > 0 && m.colspan > 0 &&
      m.row >= 0 && m.col >= 0 &&
      m.row + m.rowspan <= totalRows &&
      m.col + m.colspan <= totalCols
    );
  }, [merges, data]);

  // Calculate the total natural table width so we know the scale factor
  const numCols = useMemo(() => {
    let max = (data[0] || []).length;
    Object.keys(colWidths).forEach(k => { const n = Number(k); if (!isNaN(n)) max = Math.max(max, n + 1); });
    merges.forEach(m => { if (m) max = Math.max(max, (m.col || 0) + (m.colspan || 1)); });
    return Math.min(max, 40);
  }, [data, colWidths, merges]);

  const totalTableWidth = useMemo(() => {
    let w = 0;
    for (let i = 0; i < numCols; i++) w += (colWidths[i] > 0 ? colWidths[i] : 80);
    return w || availW;
  }, [numCols, colWidths, availW]);

  // Scale so the table fits within the printable width
  const scale = totalTableWidth > 0 ? Math.min(availW / totalTableWidth, 1) : 1;

  // formulasConfig — only pass if we have a valid HyperFormula instance
  const formulasConfig = useMemo(() => {
    if (!hyperFormulaInstance || !selectedSheet) return undefined;
    return { engine: hyperFormulaInstance, sheetName: selectedSheet };
  }, [hyperFormulaInstance, selectedSheet]);

  if (!data || data.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: mTop,
        left: mLeft,
        width: availW,
        height: availH,
        overflow: "hidden",
        zIndex: 2,
        // Clip the HotTable to the printable area
        pointerEvents: "none",
      }}
    >
      {/* Scale wrapper — shrinks the table to fit the printable width */}
      <div
        style={{
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          width: totalTableWidth,
          // Make sure the scaled container doesn't push layout
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <HotTable
          ref={previewRef}
          key={`preview-${selectedSheet}-${zoom}`}
          data={data}
          mergeCells={safeMerges}
          rowHeaders={false}
          colHeaders={false}
          height={Math.round(availH / scale)}
          width={totalTableWidth}
          rowHeights={rowHeightFn}
          colWidths={colWidthFn}
          autoRowSize={false}
          autoColumnSize={false}
          readOnly={true}
          disableVisualSelection={true}
          cells={cellsRenderer}
          renderAllRows={true}
          renderAllColumns={true}
          viewportRowRenderingOffset={9999}
          viewportColumnRenderingOffset={9999}
          manualColumnResize={false}
          manualRowResize={false}
          outsideClickDeselects={false}
          fillHandle={false}
          dropdownMenu={false}
          filters={false}
          contextMenu={false}
          comments={false}
          stretchH="none"
          licenseKey="non-commercial-and-evaluation"
          themeName="ht-theme-main"
          // Suppress column/row header space
          rowHeaderWidth={0}
          {...(formulasConfig ? { formulas: formulasConfig } : {})}
        />
      </div>
    </div>
  );
}

// ─── MarginHandle ────────────────────────────────────────────────────────────
function MarginHandle({ type, marginMm, onDrag, pageW, pageH, landscape }) {
  const isDragging = useRef(false);
  const startPos = useRef(0);
  const startMm = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const isH = type === "top" || type === "bottom";
  const mmW = landscape ? A4_H_MM : A4_W_MM;
  const mmH = landscape ? A4_W_MM : A4_H_MM;

  let px;
  if (type === "top") px = (marginMm / mmH) * pageH;
  else if (type === "bottom") px = pageH - (marginMm / mmH) * pageH;
  else if (type === "left") px = (marginMm / mmW) * pageW;
  else px = pageW - (marginMm / mmW) * pageW;

  const onMouseDown = (e) => {
    isDragging.current = true;
    startPos.current = isH ? e.clientY : e.clientX;
    startMm.current = marginMm;
    setDragging(true);
    e.preventDefault(); e.stopPropagation();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const delta = isH ? e.clientY - startPos.current : e.clientX - startPos.current;
      const deltaMm = isH ? (delta / pageH) * mmH : (delta / pageW) * mmW;
      const maxMm = isH ? mmH / 2 : mmW / 2;
      let newMm;
      if (type === "top") newMm = Math.max(0, Math.min(startMm.current + deltaMm, maxMm));
      else if (type === "bottom") newMm = Math.max(0, Math.min(startMm.current - deltaMm, maxMm));
      else if (type === "left") newMm = Math.max(0, Math.min(startMm.current + deltaMm, maxMm));
      else newMm = Math.max(0, Math.min(startMm.current - deltaMm, maxMm));
      onDrag(type, parseFloat(newMm.toFixed(1)));
    };
    const onUp = () => { isDragging.current = false; setDragging(false); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [type, isH, pageW, pageH, onDrag, mmW, mmH]);

  const active = hovered || dragging;
  const color = dragging ? "#60a5fa" : "#3b82f6";

  const lineStyle = isH ? {
    position: "absolute", top: px - 1, left: 0, right: 0, height: 1.5,
    background: `repeating-linear-gradient(90deg,${color} 0,${color} 6px,transparent 6px,transparent 12px)`,
    zIndex: 30, pointerEvents: "none", opacity: active ? 1 : 0.55, transition: "opacity 0.15s",
  } : {
    position: "absolute", left: px - 1, top: 0, bottom: 0, width: 1.5,
    background: `repeating-linear-gradient(180deg,${color} 0,${color} 6px,transparent 6px,transparent 12px)`,
    zIndex: 30, pointerEvents: "none", opacity: active ? 1 : 0.55, transition: "opacity 0.15s",
  };

  const hitStyle = isH ? {
    position: "absolute", top: px - 8, left: 0, right: 0, height: 16,
    zIndex: 31, cursor: "ns-resize",
  } : {
    position: "absolute", left: px - 8, top: 0, bottom: 0, width: 16,
    zIndex: 31, cursor: "ew-resize",
  };

  const labelBase = {
    position: "absolute", zIndex: 40, pointerEvents: "none",
    transition: "opacity 0.15s", opacity: active ? 1 : 0,
  };
  let labelPos = {};
  if (type === "top") labelPos = { top: px + 12, left: "50%", transform: "translateX(-50%)" };
  else if (type === "bottom") labelPos = { bottom: pageH - px + 12, left: "50%", transform: "translateX(-50%)" };
  else if (type === "left") labelPos = { left: px + 12, top: "50%", transform: "translateY(-50%)" };
  else labelPos = { right: pageW - px + 12, top: "50%", transform: "translateY(-50%)" };

  return (
    <>
      <div style={lineStyle} />
      <div
        style={hitStyle}
        onMouseDown={onMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <div style={{ ...labelBase, ...labelPos }}
        className="bg-slate-800 border border-blue-500 rounded-lg px-2.5 py-1 shadow-xl font-sans"
      >
        <div className="text-[9px] text-slate-400 uppercase tracking-widest leading-tight">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        <div className="text-[13px] font-bold text-blue-400 leading-tight">
          {marginMm.toFixed(1)} mm
        </div>
      </div>
    </>
  );
}

// ─── Ruler ───────────────────────────────────────────────────────────────────
function Ruler({ size, horizontal }) {
  const tickCount = 21;
  const mmW = horizontal ? A4_W_MM : A4_H_MM;
  const step = mmW / (tickCount - 1);
  const pxPer = size / mmW;

  return (
    <div
      className={`relative bg-slate-900 ${horizontal ? "border-b border-slate-700" : "border-r border-slate-700"} overflow-hidden shrink-0`}
      style={{
        [horizontal ? "width" : "height"]: size,
        [horizontal ? "height" : "width"]: 20,
      }}
    >
      {Array.from({ length: tickCount }, (_, i) => {
        const pos = i * step * pxPer;
        const label = Math.round(i * step);
        const major = i % 5 === 0;
        return (
          <div key={i} style={{ position: "absolute", [horizontal ? "left" : "top"]: pos }}>
            <div style={{
              [horizontal ? "width" : "height"]: 1,
              [horizontal ? "height" : "width"]: major ? 8 : 4,
              background: major ? "#64748b" : "#334155",
            }} />
            {major && label > 0 && (
              <span
                className="absolute text-[7px] text-slate-600 font-mono"
                style={{ [horizontal ? "left" : "top"]: 2, [horizontal ? "top" : "left"]: 9 }}
              >
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sidebar sub-components ──────────────────────────────────────────────────
function SectionCard({ children }) {
  return (
    <div className="px-4 py-3.5 border-b border-slate-800">
      {children}
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-blue-500 text-sm">{icon}</span>
      <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 font-sans">
        {label}
      </span>
    </div>
  );
}

function OrientBtn({ value, current, onChange }) {
  const active = current === value;
  const isP = value === "portrait";
  return (
    <button
      onClick={() => onChange(value)}
      className={`flex-1 flex flex-col items-center px-2 py-2.5 rounded-lg gap-1.5 cursor-pointer transition-all duration-150 font-sans
        ${active
          ? "border-2 border-blue-500 bg-blue-500/10"
          : "border border-slate-700 bg-slate-900 hover:border-slate-600"
        }`}
    >
      <div
        className={`rounded-sm border-2 transition-all duration-150
          ${active ? "border-blue-500 bg-blue-500/25" : "border-slate-600 bg-slate-800"}`}
        style={{ width: isP ? 20 : 30, height: isP ? 28 : 20 }}
      />
      <span className={`text-[11px] font-sans ${active ? "font-bold text-blue-400" : "font-normal text-slate-500"}`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    </button>
  );
}

function MarginRow({ label, side, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-400 font-sans min-w-[52px]">{label}</span>
      <div className="flex items-center gap-1.5">
        <InputNumber
          value={value}
          min={0} max={side === "top" || side === "bottom" ? 100 : 80}
          step={1} precision={1}
          onChange={val => onChange(side, val)}
          size="small" controls={false}
          className="dark-number-input"
          style={{ width: 74, borderRadius: 6 }}
        />
        <span className="text-[11px] text-slate-500 font-sans">mm</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PrintSettingsModal({
  open, onClose, onPreview,
  cellStyles, setCellStyles, selectedSheet,
  sheetNames = [], sheetData, mergedCells,
  onSaveSettings,
  hyperFormulaInstance,
}) {
  const [margins, setMargins] = useState(DEFAULT_MARGINS);
  const [orientation, setOrientation] = useState("portrait");
  const [fontSize, setFontSize] = useState(8);
  const [zoom, setZoom] = useState(0.75);
  const [saved, setSaved] = useState(false);

  const landscape = orientation === "landscape";
  const pageW = (landscape ? BASE_H : BASE_W) * zoom;
  const pageH = (landscape ? BASE_W : BASE_H) * zoom;
  const mmW = landscape ? A4_H_MM : A4_W_MM;
  const mmH = landscape ? A4_W_MM : A4_H_MM;

  const mL = (margins.left / mmW) * pageW;
  const mR = (margins.right / mmW) * pageW;
  const mT = (margins.top / mmH) * pageH;
  const mB = (margins.bottom / mmH) * pageH;

  useEffect(() => {
    if (!open || !selectedSheet) return;
    const saved = cellStyles?.[selectedSheet];
    setMargins(saved?.pageMargin
      ? { top: saved.pageMargin.top ?? 10, bottom: saved.pageMargin.bottom ?? 10, left: saved.pageMargin.left ?? 10, right: saved.pageMargin.right ?? 10 }
      : { ...DEFAULT_MARGINS });
    setOrientation(saved?.pageOrientation || "portrait");
    setFontSize(saved?.printFontSize || 8);
  }, [open, selectedSheet]);

  const handleDrag = useCallback((t, v) => setMargins(p => ({ ...p, [t]: v })), []);
  const handleInput = (side, val) => {
    if (val == null) return;
    const max = side === "top" || side === "bottom" ? 100 : 80;
    setMargins(p => ({ ...p, [side]: Math.max(0, Math.min(val, max)) }));
  };

  const handleSaveSettings = () => {
    const updatedStyles = {
      ...cellStyles,
      [selectedSheet]: {
        ...(cellStyles?.[selectedSheet] || {}),
        pageMargin: { ...margins },
        pageOrientation: orientation,
        printFontSize: fontSize,
      },
    };
    setCellStyles(updatedStyles);
    if (onSaveSettings) onSaveSettings(updatedStyles);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePreview = () => {
    const updatedStyles = {
      ...cellStyles,
      [selectedSheet]: {
        ...(cellStyles?.[selectedSheet] || {}),
        pageMargin: { ...margins },
        pageOrientation: orientation,
        printFontSize: fontSize,
      },
    };
    setCellStyles(updatedStyles);
    onPreview({ margins, orientation, fontSize });
    onClose();
  };

  const PRESETS = [
    { label: "Normal", sub: "10 mm", m: { top: 10, bottom: 10, left: 10, right: 10 } },
    { label: "Narrow", sub: "5 mm", m: { top: 5, bottom: 5, left: 5, right: 5 } },
    { label: "Wide", sub: "20 mm", m: { top: 20, bottom: 20, left: 20, right: 20 } },
  ];

  const SIDEBAR_W = 300;
  const previewAreaW = Math.max(pageW + 160, 500);
  const modalW = SIDEBAR_W + previewAreaW + 2;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={null}
      width={modalW}
      centered
      footer={null}
      closable={false}
      styles={{
        content: { padding: 0, borderRadius: 12, overflow: "hidden", background: "#0f172a", boxShadow: "0 25px 60px rgba(0,0,0,0.65)" },
        mask: { background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" },
      }}
    >
      {/* Scoped CSS */}
      <style>{`
        .dark-number-input .ant-input-number-input {
          background: #1e293b !important;
          color: #e2e8f0 !important;
          font-size: 12px !important;
          font-family: Inter, sans-serif !important;
        }
        .dark-number-input.ant-input-number {
          background: #1e293b !important;
          border-color: #334155 !important;
        }
        .dark-number-input.ant-input-number:hover,
        .dark-number-input.ant-input-number:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59,130,246,0.2) !important;
        }
        /* Strip row/col headers from the preview HotTable */
        .print-preview-hot .ht_master .wtHolder {
          overflow: hidden !important;
        }
        .print-preview-hot .handsontable thead,
        .print-preview-hot .handsontable .htCore thead {
          display: none !important;
        }
        .print-preview-hot .htRowHeaders {
          display: none !important;
        }
        .print-preview-hot td,
        .print-preview-hot th {
          pointer-events: none !important;
          user-select: none !important;
        }
        /* Remove blue selection highlight in preview */
        .print-preview-hot .handsontable td.area,
        .print-preview-hot .handsontable td.current {
          background: inherit !important;
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-5 h-[54px] bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
            <PrinterOutlined className="text-white text-sm" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-100 font-sans leading-tight">Page Setup</div>
            {selectedSheet && (
              <div className="text-[11px] text-slate-500 font-sans leading-tight">
                Sheet: <span className="text-slate-400">{selectedSheet}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom pill */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 mr-2">
            <Tooltip title="Zoom Out">
              <button
                onClick={() => setZoom(z => Math.max(0.4, parseFloat((z - 0.15).toFixed(2))))}
                className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors cursor-pointer bg-transparent border-0"
              >
                <ZoomOutOutlined className="text-[13px]" />
              </button>
            </Tooltip>
            <span className="text-[11px] text-slate-400 min-w-[34px] text-center font-mono font-sans">
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip title="Zoom In">
              <button
                onClick={() => setZoom(z => Math.min(1.5, parseFloat((z + 0.15).toFixed(2))))}
                className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors cursor-pointer bg-transparent border-0"
              >
                <ZoomInOutlined className="text-[13px]" />
              </button>
            </Tooltip>
            <Tooltip title="Fit to window (75%)">
              <button
                onClick={() => setZoom(0.75)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors cursor-pointer bg-transparent border-0"
              >
                <FullscreenOutlined className="text-[13px]" />
              </button>
            </Tooltip>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] font-medium text-slate-400 bg-transparent border border-slate-700 rounded-lg cursor-pointer hover:border-slate-500 hover:text-slate-200 transition-all font-sans"
          >
            Cancel
          </button>

          <Tooltip title="Applies page settings to this sheet. Press the main Save button in the editor to persist to the database.">
            <button
              onClick={() => {
                handleSaveSettings();
                onClose();
                message.success("Settings applied successfully ", 1.5);
                notification.info({
                  message: "Settings applied successfully",
                  description: "Please click on Save button to save the settings",
                  placement: "topRight",
                  duration: 2.5
                })
              }}
              className={`px-4 py-1.5 text-[12px] font-semibold flex items-center gap-1.5 rounded-lg cursor-pointer border transition-all duration-200 font-sans
                ${saved
                  ? "border-green-500 bg-green-500/15 text-green-400"
                  : "border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
            >
              {saved ? <><CheckOutlined /> Applied!</> : "Apply Settings"}
            </button>
          </Tooltip>

          <button
            onClick={handlePreview}
            className="px-5 py-1.5 text-[12px] font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 border-0 rounded-lg cursor-pointer shadow-[0_2px_12px_rgba(59,130,246,0.45)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.6)] transition-all font-sans"
          >
            Generate PDF ›
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex bg-slate-950 max-h-[82vh]">

        {/* ── PREVIEW AREA ── */}
        <div
          className="flex-1 flex flex-col items-center overflow-auto py-6 px-6 gap-0"
          style={{
            background: "#0a0f1a",
            backgroundImage: "radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        >
          {/* Hint pill */}
          <div className="flex items-center gap-1.5 mb-4 px-3.5 py-1.5 rounded-full bg-blue-500/8 border border-blue-500/20">
            <BorderOutlined className="text-blue-500 text-xs" />
            <span className="text-[11px] text-slate-500 font-sans">
              Drag the blue guides to adjust margins · {landscape ? "Landscape" : "Portrait"} · A4
            </span>
          </div>

          {/* Ruler + Paper */}
          <div className="flex flex-col items-start">
            {/* Horizontal ruler */}
            <div className="flex" style={{ marginLeft: 20 }}>
              <Ruler size={pageW} horizontal />
            </div>
            <div className="flex">
              {/* Vertical ruler */}
              <Ruler size={pageH} horizontal={false} />

              {/* Paper */}
              <div
                className="relative bg-white shrink-0"
                style={{
                  width: pageW, height: pageH,
                  boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)",
                  overflow: "hidden",  // clip the HotTable to the page boundary
                }}
              >
                {/* ── Real HotTable Preview ── */}
                <div
                  className="print-preview-hot"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <HotTablePreview
                    sheetData={sheetData}
                    cellStyles={cellStyles}
                    mergedCells={mergedCells}
                    selectedSheet={selectedSheet}
                    margins={margins}
                    landscape={landscape}
                    zoom={zoom}
                    printFontSize={fontSize}
                    hyperFormulaInstance={hyperFormulaInstance}
                  />
                </div>

                {/* Margin tints */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: mT, background: "rgba(59,130,246,0.06)", zIndex: 5, pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: mB, background: "rgba(59,130,246,0.06)", zIndex: 5, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: mT, left: 0, width: mL, height: Math.max(0, pageH - mT - mB), background: "rgba(59,130,246,0.06)", zIndex: 5, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: mT, right: 0, width: mR, height: Math.max(0, pageH - mT - mB), background: "rgba(59,130,246,0.06)", zIndex: 5, pointerEvents: "none" }} />

                {/* Printable area dashed border */}
                <div style={{
                  position: "absolute", top: mT, left: mL,
                  width: Math.max(0, pageW - mL - mR), height: Math.max(0, pageH - mT - mB),
                  border: "1px dashed rgba(59,130,246,0.35)", zIndex: 6, pointerEvents: "none",
                }} />

                {/* Corner dots */}
                {[
                  { top: mT - 3, left: mL - 3 },
                  { top: mT - 3, right: mR - 3 },
                  { bottom: mB - 3, left: mL - 3 },
                  { bottom: mB - 3, right: mR - 3 },
                ].map((pos, i) => (
                  <div key={i} style={{ position: "absolute", ...pos, width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", zIndex: 7, pointerEvents: "none", opacity: 0.7 }} />
                ))}

                {/* Drag handles — above the HotTable */}
                {["top", "bottom", "left", "right"].map(s => (
                  <MarginHandle key={s} type={s} marginMm={margins[s]} onDrag={handleDrag} pageW={pageW} pageH={pageH} landscape={landscape} />
                ))}

                {/* Page label */}
                <div className="absolute text-[10px] text-slate-600 font-mono font-sans whitespace-nowrap" style={{ bottom: -26, left: "50%", transform: "translateX(-50%)" }}>
                  Page 1 — A4 {landscape ? "Landscape" : "Portrait"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div
          className="flex flex-col overflow-y-auto border-l border-slate-800 bg-slate-950 shrink-0"
          style={{ width: SIDEBAR_W }}
        >
          {/* Orientation */}
          <SectionCard>
            <SectionTitle icon={<FileTextOutlined />} label="Page Orientation" />
            <div className="flex gap-2">
              <OrientBtn value="portrait" current={orientation} onChange={setOrientation} />
              <OrientBtn value="landscape" current={orientation} onChange={setOrientation} />
            </div>
          </SectionCard>

          {/* Margins */}
          <SectionCard>
            <SectionTitle icon={<SettingOutlined />} label="Margins (mm)" />
            {[
              { label: "Top", side: "top" },
              { label: "Bottom", side: "bottom" },
              { label: "Left", side: "left" },
              { label: "Right", side: "right" },
            ].map(({ label, side }) => (
              <MarginRow key={side} label={label} side={side} value={margins[side]} onChange={handleInput} />
            ))}

            {/* Mini margin diagram */}
            <div className="mx-auto mt-3.5 relative" style={{ width: 80, height: 100 }}>
              <div className="absolute inset-0 border-2 border-slate-700 rounded-sm" />
              <div style={{
                position: "absolute",
                top: (margins.top / A4_H_MM) * 100,
                bottom: (margins.bottom / A4_H_MM) * 100,
                left: (margins.left / A4_W_MM) * 80,
                right: (margins.right / A4_W_MM) * 80,
                background: "rgba(59,130,246,0.15)",
                border: "1px dashed #3b82f6",
                borderRadius: 2,
              }} />
              {[0.25, 0.42, 0.58, 0.74].map((y, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: (margins.top / A4_H_MM) * 100 + y * (100 - (margins.top + margins.bottom) / A4_H_MM * 100),
                  left: (margins.left / A4_W_MM) * 80 + 4,
                  right: (margins.right / A4_W_MM) * 80 + 4,
                  height: 1.5, background: "rgba(100,116,139,0.35)", borderRadius: 1,
                }} />
              ))}
            </div>

            {/* Presets */}
            <div className="mt-3.5">
              <p className="text-[9px] font-bold tracking-widest uppercase text-slate-600 mb-2 font-sans">Quick Presets</p>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESETS.map(p => {
                  const isActive = margins.top === p.m.top && margins.bottom === p.m.bottom && margins.left === p.m.left && margins.right === p.m.right;
                  return (
                    <button
                      key={p.label}
                      onClick={() => setMargins({ ...p.m })}
                      className={`flex flex-col items-center py-2 px-1 border rounded-lg cursor-pointer font-sans transition-all hover:border-blue-500 hover:bg-blue-500/10 ${isActive ? "border-blue-500 bg-blue-500/20" : "border-slate-800 bg-slate-950"
                        }`}
                    >
                      <span className={`text-[11px] font-semibold ${isActive ? "text-blue-400" : "text-slate-400"}`}>{p.label}</span>
                      <span className={`text-[9px] ${isActive ? "text-blue-300" : "text-slate-600"}`}>{p.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* Font Size */}
          <SectionCard>
            <SectionTitle
              icon={<span className="font-black text-[13px] font-sans text-blue-500">Aa</span>}
              label="Print Font Size"
            />
            <div className="flex items-center gap-2">
              <InputNumber
                value={fontSize} min={6} max={16} step={0.5} precision={1}
                onChange={val => setFontSize(val || 8)}
                size="middle"
                className="dark-number-input flex-1"
                style={{ flex: 1, borderRadius: 7 }}
              />
              <span className="text-xs text-slate-500 font-sans">pt</span>
            </div>
            {/* Live font preview */}
            <div className="mt-2.5 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg">
              <span className="text-slate-300 font-sans" style={{ fontSize }}>
                Sample cell text
              </span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 font-sans">Default: 8 pt • Recommended: 7–10 pt for dense tables</p>
          </SectionCard>

          {/* Footer tip */}
          <div className="mt-auto px-4 py-3.5 border-t border-slate-800">
            <div className="flex gap-2 items-start">
              <div className="w-5 h-5 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                💡
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed font-sans">
                Drag the <span className="text-blue-500 font-semibold">blue dashed lines</span> on the preview to visually adjust margins in real time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}