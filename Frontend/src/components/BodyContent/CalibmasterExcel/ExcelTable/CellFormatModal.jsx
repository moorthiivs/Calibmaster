import React from "react";
import { Modal, InputNumber, message, Typography } from "antd";

const { Text } = Typography;

const CellFormatModal = ({
  excelState,
  hotRef
}) => {
  const {
    selectedSheet,
    decimalModalVisible, setDecimalModalVisible,
    decimalInput, setDecimalInput,
    activeCellCoords,
    setDecimalPrecisionMap,
    setIsDirty
  } = excelState;

  const handleOk = () => {
    const isRemovingFormat = decimalInput === "" || decimalInput === null;
    if (isRemovingFormat || (!isNaN(decimalInput) && Number(decimalInput) >= 0 && Number(decimalInput) <= 20)) {
      setDecimalPrecisionMap((prev) => {
        const updatedMap = { ...prev };
        const sheetMap = { ...(prev[selectedSheet] || {}) };

        const hot = hotRef.current?.hotInstance;
        const updatesToApply = [];

        activeCellCoords.forEach(({ row, col }) => {
          const cellKey = `${row}-${col}`;

          if (isRemovingFormat) {
            delete sheetMap[cellKey];
            if (hot) {
              hot.removeCellMeta(row, col, "decimalPrecision");
              hot.removeCellMeta(row, col, "decimalMaxLimit");
            }
          } else {
            sheetMap[cellKey] = Number(decimalInput);
            if (hot) {
              hot.setCellMeta(row, col, "decimalPrecision", Number(decimalInput));
              hot.setCellMeta(row, col, "decimalMaxLimit", Number(decimalInput));
              // ✅ Do NOT call setDataAtCell — only update display meta so original value is preserved
            }
          }
        });

        if (hot) {
          hot.render(); // Re-render so cell renderers pick up new decimalPrecision
        }

        updatedMap[selectedSheet] = sheetMap;
        return updatedMap;
      });
      setIsDirty(true);
      setDecimalModalVisible(false);
    } else {
      message.error("Please enter a valid number between 0 and 20, or leave empty to clear.");
    }
  };

  return (
    <Modal
      title="Cell Format"
      open={decimalModalVisible}
      onOk={handleOk}
      onCancel={() => setDecimalModalVisible(false)}
    >
      <div style={{ marginBottom: "20px" }}>
        <p style={{ margin: "0 0 5px 0", color: "#666" }}>Sample</p>
        <div style={{
          padding: "8px 12px",
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          backgroundColor: "#fafafa",
          fontSize: "14px",
          fontWeight: "500",
          color: "#000",
          minHeight: "38px",
          display: "flex",
          alignItems: "center"
        }}>
          {Number(1234.8765432109876543210).toFixed(decimalInput !== "" && decimalInput !== null ? Number(decimalInput) : 0)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "14px" }}>Decimal places:</span>
        <InputNumber
          style={{ width: "80px" }}
          min={0}
          max={20}
          value={decimalInput}
          onChange={(val) => setDecimalInput(val)}
        />
      </div>

      <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
        Leave this field empty to remove decimal formatting. Entering <b>0</b> will
        apply zero decimal places (round to whole number).
      </Text>
    </Modal>
  );
};

export default CellFormatModal;
