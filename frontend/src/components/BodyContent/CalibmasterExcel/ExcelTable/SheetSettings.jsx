import React from "react";
import { Modal, Radio, Select, Space, Tooltip, Grid, Button, Divider, Switch } from "antd";

const { useBreakpoint } = Grid;

export default function SheetSettings({
  isOpen,
  onClose,
  settings,
  setSettings,
  isShowhidelFile,
  HiddenSheets,
  handleHiddenChange,
  sheetNames,
  handleSave,
  hasAnySheetError,
  isDirty
}) {
  const screens = useBreakpoint();

  const handleTabMenuChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      tabmenu: e.target.value,
    }));
  };

  return (
    <Modal
      open={isOpen}
      title="Sheet Settings"
      onCancel={onClose}
      footer={null}
      centered
      width={screens.md ? 520 : "95%"}
    >

      <Divider />
      {/* Sheet Tab Option */}
      <div
        style={{
          display: "flex",
          flexDirection: screens.sm ? "row" : "column",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <label style={{ fontWeight: 500 }}>1. Sheet Tab</label>

        <Radio.Group
          value={settings.tabmenu}
          onChange={handleTabMenuChange}
        >
          <Radio value="line">Line</Radio>
          <Radio value="card">Card</Radio>
        </Radio.Group>
      </div>
      <Divider />
      {/* Hidden Sheets */}
      {isShowhidelFile && (
        <>

          <label style={{ fontWeight: 500 }}>2. Select Hidden Sheets</label>
          <Space direction="vertical" style={{ width: "100%", marginTop: "5px" }}>
            <Tooltip title="Select Hidden Sheets">
              <Select
                style={{ width: "100%" }}
                mode="multiple"
                allowClear
                placeholder="Choose Sheet to Hide"
                value={HiddenSheets}
                onChange={handleHiddenChange}
                options={sheetNames.map((name, index) => ({
                  label: name || `Sheet ${index + 1}`,
                  value: name || `sheet_${index}`,
                }))}
                size="large"
              />
            </Tooltip>
          </Space>
        </>

      )}
      {/* Footer Actions */}
      <Divider />
      {/* Auto Save */}
      <div
        style={{
          display: "flex",
          flexDirection: screens.sm ? "row" : "column",
          justifyContent: "space-between",
          alignItems: screens.sm ? "center" : "flex-start",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <label style={{ fontWeight: 500 }}>
          {isShowhidelFile ? "3." : "2."} Auto Save
        </label>

        <Space direction="horizontal" size="middle" wrap>
          <Switch
            checked={settings.autoSave}
            onChange={(checked) =>
              setSettings((prev) => ({ ...prev, autoSave: checked }))
            }
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
          {settings.autoSave && (
            <Select
              value={settings.autoSaveInterval}
              onChange={(val) =>
                setSettings((prev) => ({ ...prev, autoSaveInterval: val }))
              }
              style={{ width: 120 }}
              options={[
                { label: "30 sec", value: 30 },
                { label: "1 min", value: 60 },
                { label: "2 min", value: 120 },
                { label: "5 min", value: 300 },
              ]}
              size="middle"
            />
          )}
        </Space>
      </div>

      {/* Footer Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 24,
          gap: 12,
        }}
      >
        <Tooltip
          title={
            hasAnySheetError
              ? `Cannot save. Fix conditional formatting errors`
              : "Save"
          }
        >
          <Button
            type="primary"
            size="large"
            onClick={handleSave}
            disabled={hasAnySheetError || !isDirty}
            style={{
              minWidth: 100,
            }}
          >
            Save
          </Button>
        </Tooltip>
      </div>
    </Modal>
  );
}
