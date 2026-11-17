import React from 'react';
import { PlusOutlined, DeleteOutlined, SettingOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import { Tabs, Button, Tooltip, Spin, Dropdown } from 'antd';
import RenameSheet from './RenameSheet';
import SheetSettings from './SheetSettings';
import './excel.css';


function FooterExcel({
    sheetNames,
    selectedSheet,
    setSheetData,
    setMergedCells,
    setCellStyles,
    setSheetNames,
    setSelectedSheet,
    setIsDirty,
    deleteSelectedSheet,
    addNewSheet,
    duplicateSheet,
    Setsettings,
    settings,
    isRename,
    setisRename,
    handleRenameSheet,
    isLoaded,
    hotRef,
    isShowhidelFile,
    selectedHiddenSheets,
    handleHiddenChange,
    handleSave,
    sheetErrorMap,
    isDirty,
    permissions
}) {

    const canManageSheets = permissions?.includes('EXCEL_MANAGE_SHEETS');

    const tabItems = sheetNames.map(sheet => {
        const menuItems = [];

        if (canManageSheets) {
            menuItems.push(
                {
                    label: 'Rename',
                    key: 'rename',
                    icon: <EditOutlined />,
                    onClick: () => setisRename(true)
                },
                {
                    label: 'Duplicate',
                    key: 'duplicate',
                    icon: <CopyOutlined />,
                    onClick: () => duplicateSheet(sheet)
                },
                {
                    label: 'Delete',
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    onClick: () => deleteSelectedSheet()
                }
            );
        }

        return {
            key: sheet,
            label: canManageSheets ? (
                <Dropdown
                    menu={{ items: menuItems }}
                    trigger={['contextMenu']}
                >
                    <div style={{ cursor: 'pointer' }}>
                        {sheet}
                    </div>
                </Dropdown>
            ) : (
                <div style={{ cursor: 'pointer' }}>
                    {sheet}
                </div>
            )
        };
    });

    const HiddenSheets = selectedHiddenSheets.filter((data) => data !== null && data !== undefined && data !== "");
    const hasAnySheetError = Object.values(sheetErrorMap).some(v => v === true);
    return (
        <div
            className="excel-footer-inner"
            style={{
                position: 'sticky',
                bottom: 0,
                padding: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                overflowX: 'auto',
                overflowY: 'hidden',
                whiteSpace: 'nowrap',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                gap: '8px',
            }}
        >
            {/* Left side buttons */}
            {canManageSheets && (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Tooltip title="Add Sheet">
                        <Button
                            icon={<PlusOutlined />}
                            onClick={addNewSheet}
                            type="primary"
                        />
                    </Tooltip>
                    <Tooltip title="Delete Sheet">
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={deleteSelectedSheet}
                        />
                    </Tooltip>
                    <Tooltip title="Sheet Settings">
                        <Button
                            icon={<SettingOutlined />}
                            onClick={() =>
                                Setsettings(prev => ({ ...prev, isOpen: true }))
                            }
                        />
                    </Tooltip>
                </div>
            )}

            {/* Tabs */}
            <Tabs
                activeKey={selectedSheet}
                onChange={key => {
                    // defer heavy grid switch
                    requestAnimationFrame(() => {
                        setSelectedSheet(key);
                        const hot = hotRef.current?.hotInstance;
                        hot?.deselectCell();
                    });
                }}
                items={tabItems}
                tabBarStyle={{ margin: 0 }}
                type={settings.tabmenu}
                style={{ marginLeft: canManageSheets ? 12 : 0, flexShrink: 1, minWidth: 0 }}
            />

            {isLoaded && <Spin size="small" />}

            {isRename && (
                <RenameSheet
                    sheetName={selectedSheet}
                    isopen={isRename}
                    onclose={() => setisRename(false)}
                    onRename={handleRenameSheet}
                />
            )}

            {settings.isOpen && (
                <SheetSettings
                    isOpen={settings.isOpen}
                    onClose={() =>
                        Setsettings(prev => ({ ...prev, isOpen: false }))
                    }
                    settings={settings}
                    setSettings={Setsettings}
                    isShowhidelFile={isShowhidelFile}
                    HiddenSheets={HiddenSheets}
                    handleHiddenChange={handleHiddenChange}
                    sheetNames={sheetNames}
                    handleSave={handleSave}
                    hasAnySheetError={hasAnySheetError}
                    isDirty={isDirty}
                />
            )}
        </div>
    );
}

export default FooterExcel;

