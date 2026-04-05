import React from "react";
import { Modal, InputNumber, message, Button } from "antd";

const ColumnWidthModal = ({
  excelState,
  hotRef
}) => {
  const {
    selectedSheet,
    colWidthModalVisible, setColWidthModalVisible,
    colWidthInput, setColWidthInput,
    activeColIndices,
    setCellStyles,
    setIsDirty,
    cellStyles
  } = excelState;

  const handleOk = () => {
    if (colWidthInput && !isNaN(colWidthInput) && Number(colWidthInput) > 0) {
      setCellStyles((prev) => {
        const nextStyles = { ...prev };
        const sheetStyles = nextStyles[selectedSheet] || {};
        const currentWidths = sheetStyles.colWidths || {};
        const newColWidths = { ...currentWidths };

        activeColIndices.forEach((colIndex) => {
          newColWidths[colIndex] = Number(colWidthInput);
        });

        nextStyles[selectedSheet] = {
          ...sheetStyles,
          colWidths: newColWidths,
        };
        return nextStyles;
      });
      setIsDirty(true);
      setColWidthModalVisible(false);
    } else {
      message.error("Please enter a valid positive number.");
    }
  };

  const handleReset = () => {
    const hot = hotRef?.current?.hotInstance;

    // 1. Update State (Targeted Reset)
    setCellStyles((prev) => {
      const nextStyles = { ...prev };
      const sheetStyles = nextStyles[selectedSheet] || {};
      const currentWidths = sheetStyles.colWidths || {};
      const newColWidths = { ...currentWidths };

      // Reset only the selected columns
      activeColIndices.forEach((colIndex) => {
        delete newColWidths[colIndex];
      });

      nextStyles[selectedSheet] = {
        ...sheetStyles,
        colWidths: newColWidths,
      };
      return nextStyles;
    });

    setIsDirty(true);
    setColWidthInput(null);
    setColWidthModalVisible(false);
    message.success("Column width reset to default.");
  };

  const handleCancel = () => {
    setColWidthModalVisible(false);
  };

  const handlePressEnter = (e) => {
    const val = e.target.value;
    if (val && !isNaN(val) && Number(val) > 0) {
      setCellStyles((prev) => {
        const nextStyles = { ...prev };
        const sheetStyles = nextStyles[selectedSheet] || {};
        const currentWidths = sheetStyles.colWidths || {};
        const newColWidths = { ...currentWidths };

        activeColIndices.forEach((colIndex) => {
          newColWidths[colIndex] = Number(val);
        });

        nextStyles[selectedSheet] = {
          ...sheetStyles,
          colWidths: newColWidths,
        };
        return nextStyles;
      });
      setIsDirty(true);
      setColWidthModalVisible(false);
    }
  };

  return (
    <Modal
      title="Set Column Width"
      open={colWidthModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="reset" danger onClick={handleReset}>
          Reset to Default
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          OK
        </Button>,
      ]}
    >
      <p>Enter column width (e.g. 100):</p>
      <InputNumber
        style={{ width: "100%" }}
        min={10}
        max={1000}
        value={colWidthInput}
        onChange={(val) => setColWidthInput(val)}
        onPressEnter={handlePressEnter}
      />
    </Modal>
  );
};

export default ColumnWidthModal;
