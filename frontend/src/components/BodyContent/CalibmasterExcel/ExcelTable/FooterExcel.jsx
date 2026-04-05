import React from 'react';
import { PlusOutlined, DeleteOutlined, SettingOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import { Tabs, Button, Tooltip, Spin, Dropdown } from 'antd';
import Loader from '../../../UI/Loader';
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
    isDirty
}) {

    const [displaySheet, setDisplaySheet] = React.useState(selectedSheet);

    // const addNewSheet = () => {
    //     const newSheetName = `Sheet${sheetNames.length + 1}`;
    //     setSheetData(prev => ({
    //         ...prev,
    //         [newSheetName]: Array(50)
    //             .fill()
    //             .map(() => Array(26).fill('')),
    //     }));
    //     setMergedCells(prev => ({ ...prev, [newSheetName]: [] }));
    //     setCellStyles(prev => ({ ...prev, [newSheetName]: [] }));
    //     setSheetNames(prev => [...prev, newSheetName]);
    //     setSelectedSheet(newSheetName);
    //     setIsDirty(true);
    // };

    // const duplicateSheet = (sheetName) => {
    //     const newSheetName = `${sheetName}_Copy`;
    //     setSheetData(prev => ({
    //         ...prev,
    //         [newSheetName]: JSON.parse(JSON.stringify(prev[sheetName] || []))
    //     }));
    //     setMergedCells(prev => ({
    //         ...prev,
    //         [newSheetName]: JSON.parse(JSON.stringify(prev[sheetName] || []))
    //     }));
    //     setCellStyles(prev => ({
    //         ...prev,
    //         [newSheetName]: JSON.parse(JSON.stringify(prev[sheetName] || []))
    //     }));
    //     setSheetNames(prev => [...prev, newSheetName]);
    //     setSelectedSheet(newSheetName);
    //     setIsDirty(true);
    // };

    const tabItems = sheetNames.map(sheet => {
        const menuItems = [
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
        ];

        return {
            key: sheet,
            label: (
                <Dropdown
                    menu={{ items: menuItems }}
                    trigger={['contextMenu']}
                >
                    <div style={{ cursor: 'pointer' }}>
                        {sheet}
                    </div>
                </Dropdown>
            )
        };
    });

    const HiddenSheets = selectedHiddenSheets.filter((data) => data !== null && data !== undefined && data !== "");
    const hasAnySheetError = Object.values(sheetErrorMap).some(v => v === true);
    return (
        <div
            style={{
                position: 'sticky',
                bottom: 0,
                backgroundColor: '#f9fbfd',
                padding: '10px',
                borderTop: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            {/* Left side buttons */}
            <div style={{ display: 'flex', gap: '20px' }}>
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

            {/* Tabs */}
            <Tabs
                activeKey={selectedSheet}
                onChange={key => {
                    // setSelectedSheet(key);
                    // const hot = hotRef.current?.hotInstance;
                    // hot?.deselectCell();

                    // instant UI update
                    setDisplaySheet(key);

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
                style={{ marginLeft: "20px" }}
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

