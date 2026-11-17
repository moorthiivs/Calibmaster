import React from "react";
import { Modal, InputNumber, message, Button } from "antd";

const RowHeightModal = ({
  excelState,
  hotRef
}) => {
  const {
    selectedSheet,
    rowHeightModalVisible, setRowHeightModalVisible,
    rowHeightInput, setRowHeightInput,
    activeRowIndices,
    setCellStyles,
    setIsDirty
  } = excelState;

  const handleOk = () => {
    if (rowHeightInput && !isNaN(rowHeightInput) && Number(rowHeightInput) > 0) {
      setCellStyles((prev) => {
        const nextStyles = { ...prev };
        const sheetStyles = nextStyles[selectedSheet] || {};
        const currentHeights = sheetStyles.rowHeights || {};
        const newRowHeights = { ...currentHeights };

        activeRowIndices.forEach((rowIndex) => {
          newRowHeights[rowIndex] = Number(rowHeightInput);
        });

        nextStyles[selectedSheet] = {
          ...sheetStyles,
          rowHeights: newRowHeights,
        };
        return nextStyles;
      });
      setIsDirty(true);
      setRowHeightModalVisible(false);
    } else {
      message.error("Please enter a valid positive number.");
    }
  };

  const handleReset = () => {
    const hot = hotRef?.current?.hotInstance;

    // 1. Update State
    setCellStyles((prev) => {
      const nextStyles = { ...prev };
      const sheetStyles = nextStyles[selectedSheet] || {};
      const currentHeights = sheetStyles.rowHeights || {};
      const newRowHeights = { ...currentHeights };

      activeRowIndices.forEach((rowIndex) => {
        delete newRowHeights[rowIndex];
      });

      nextStyles[selectedSheet] = {
        ...sheetStyles,
        rowHeights: newRowHeights,
      };
      return nextStyles;
    });

    setIsDirty(true);
    setRowHeightInput(null);
    setRowHeightModalVisible(false);
    message.success("Row height reset to default.");
  };

  const handleCancel = () => {
    setRowHeightModalVisible(false);
  };

  const handlePressEnter = (e) => {
    const val = e.target.value;
    if (val && !isNaN(val) && Number(val) > 0) {
      setCellStyles((prev) => {
        const nextStyles = { ...prev };
        const sheetStyles = nextStyles[selectedSheet] || {};
        const currentHeights = sheetStyles.rowHeights || {};
        const newRowHeights = { ...currentHeights };

        activeRowIndices.forEach((rowIndex) => {
          newRowHeights[rowIndex] = Number(val);
        });

        nextStyles[selectedSheet] = {
          ...sheetStyles,
          rowHeights: newRowHeights,
        };
        return nextStyles;
      });
      setIsDirty(true);
      setRowHeightModalVisible(false);
    }
  };

  return (
    <Modal
      title="Set Row Height"
      open={rowHeightModalVisible}
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
      <p>Enter row height (e.g. 23):</p>
      <InputNumber
        style={{ width: "100%" }}
        min={10}
        max={1000}
        value={rowHeightInput}
        onChange={(val) => setRowHeightInput(val)}
        onPressEnter={handlePressEnter}
      />
    </Modal>
  );
};

export default RowHeightModal;
