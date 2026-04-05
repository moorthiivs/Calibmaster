import React, { useEffect, useState, useRef } from 'react';
import { Button, FileSelector, Select } from 'react-rainbow-components';
import alphabet from '../procedureHelpers/alphabet';
import { useDispatch } from 'react-redux';
import { notificationActions } from '../../../../store/nofitication';

const VerticalTable = ({ fromId, table_Data, setArraydata, unique_id, deleteTable, deleteTableAnyChange }) => {
    const dispatch = useDispatch();

    const divOneRef = useRef(null);
    const divTwoRef = useRef(null);
    const [divOneWidth, setDivOneWidth] = useState(0);

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(3); // Initial rows
    const [columns, setColumns] = useState(3); // Initial columns

    const [headerTypes, setHeaderTypes] = useState(Array(columns).fill('textWithInput')); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState(Array(columns).fill('')); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState(Array(columns).fill('')); // Second row header input values

    const [cellTexts, setCellTexts] = useState(Array(rows).fill(Array(columns).fill(''))); // Cell input values

    const [printOnCertificate, setPrintOnCertificate] = useState('');
    const [tableImage, setTableImage] = useState([]);
    const [conditionalFormats, setConditionalFormats] = useState({}); // Conditional formatting value

    const [imageFiles, setImageFiles] = useState([]);
    const [imageFilesErr, setImageFilesErr] = useState(false);

    const cellIDs = [];

    const containerStyles = {
        maxWidth: 300,
        maxHeight: 30
    };

    useEffect(() => {
        if (divOneRef.current && divTwoRef.current) {
            const width = divOneRef.current.offsetWidth;
            setDivOneWidth(width);
            divTwoRef.current.style.width = `${width}px`;
        }
    }, [divOneWidth]);

    useEffect(() => {
        if (!isSet)
            deleteTableAnyChange(unique_id);
    }, [isSet]);

    // TODO: Add Row
    const addRow = () => {
        setRows(rows + 1);
        setCellTexts([...cellTexts, Array(columns).fill('')]);
        setIsSet(false);
    };

    // TODO: Add Column
    const addColumn = () => {
        if (columns < 15) {
            setColumns(columns + 1);
            setHeaderTypes([...headerTypes, 'textWithInput']);
            setHeaderTexts([...headerTexts, '']);
            setSecondRowHeaders([...secondRowHeaders, '']);
            setCellTexts(cellTexts.map((row) => [...row, '']));
            setIsSet(false);
        }
    };

    // TODO: Delete Row
    const deleteRow = () => {
        if (rows > 1) {
            setRows(rows - 1);
            setCellTexts(cellTexts.slice(0, -1));
            setIsSet(false);
        }
    };

    // TODO: Delete Column
    const deleteColumn = () => {
        if (columns > 1) {
            setColumns(columns - 1);
            setHeaderTypes(headerTypes.slice(0, -1));
            setHeaderTexts(headerTexts.slice(0, -1));
            setSecondRowHeaders(secondRowHeaders.slice(0, -1));
            setCellTexts(cellTexts.map((row) => row.slice(0, -1)));
            setIsSet(false);
        }
    };

    // TODO: Add Conditional Formatting
    const addFormatting = () => {
        const filterCellIDs = cellIDs.filter(obj => !Object.keys(conditionalFormats).includes(obj.value));

        if (filterCellIDs.length) {
            setConditionalFormats({
                ...conditionalFormats, [filterCellIDs[0].value]: {
                    lower_range: 0,
                    higher_range: 0
                }
            });
            setIsSet(false);
        }
    };

    // TODO: Select Cell ID Conditional Formatting
    const cellIDHandler = (value, cellKey) => {
        const conditionalFormatValue = { ...conditionalFormats, [value]: conditionalFormats[cellKey] };
        delete conditionalFormatValue[cellKey];
        setConditionalFormats(conditionalFormatValue);
        setIsSet(false);
    };

    // TODO: Lower Value Conditional Formatting
    const lowerHandler = (value, cellKey) => {
        setConditionalFormats({
            ...conditionalFormats,
            [cellKey]: { ...conditionalFormats[cellKey], lower_range: value }
        });
        setIsSet(false);
    };

    // TODO: Higher Value Conditional Formatting
    const higherHandler = (value, cellKey) => {
        setConditionalFormats({
            ...conditionalFormats,
            [cellKey]: { ...conditionalFormats[cellKey], higher_range: value }
        });
        setIsSet(false);
    };

    // TODO: Remove Conditional Formatting
    const removeFormatting = (cellKey) => {
        let valueConditionalFormat = conditionalFormats;
        delete valueConditionalFormat[cellKey];
        setConditionalFormats({ ...valueConditionalFormat, ...{} });
        setIsSet(false);
    };

    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file); // Convert file to Base64
        });
    }

    // TODO: Handles image uploads
    const UploadImageHandler = async (files) => {
        setImageFilesErr('');
        if (files.length > 0 && files.length <= 2) {
            const validFilesSize = Array.from(files).filter(file => file.size <= (2 * 1024 * 1024)); //Max Size 2MB

            if (validFilesSize.length !== files.length) {
                return setImageFilesErr('File too large. Max size is 2MB.');
            }

            try {
                const imageData = await Promise.all(Array.from(files).map(file => getBase64(file)));
                setImageFiles(imageData);
                setIsSet(false);
            } catch (error) {
                console.error('Error converting files to Base64:', error);
                setImageFilesErr('Failed to process images.');
            }
        } else if (files.length === 0) {
            setImageFiles([]);
            setTableImage([]);
        } else {
            setImageFilesErr('You can only upload 1 to 2 images.');
        };
    }

    // TODO: Stores images in the procedure table
    const UploadHandler = () => {
        if (imageFiles.length) {
            setTableImage(imageFiles);
            setImageFiles([]);
        }
    };

    // TODO: Handle Input Changes
    const handleCellChange = (rowIndex, colIndex, value) => {
        const updatedTexts = cellTexts.map((row, rIndex) =>
            rIndex === rowIndex
                ? row.map((col, cIndex) => (cIndex === colIndex ? value : col))
                : row
        );
        setCellTexts(updatedTexts);
        setIsSet(false);
    };

    // TODO: Generate Cell ID Handler
    function generateCellID(rowIndex, colIndex, value) {
        const key = `${alphabet[colIndex]}${rowIndex + 1}`;
        return key;
    }

    // *** Render Main Input Cells
    const renderRows = () => {
        return cellTexts.map((row, rowIndex) => (
            <tr key={rowIndex}>
                {row.map((col, colIndex) => {
                    let getCellID = generateCellID(rowIndex, colIndex);
                    cellIDs.push({ value: getCellID, label: getCellID });  // ADD CELL ID FOR SELECT

                    return <td key={colIndex} id={getCellID}>
                        <input
                            type="text"
                            id={getCellID}
                            placeholder={getCellID}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        />
                    </td>
                })}
            </tr>
        ));
    };

    //*** Render Conditional format Cells
    const readerConditionals = () => {
        Object.keys(conditionalFormats).map(key => {
            const allCellIDs = cellIDs.map(obj => obj.value);
            if (!allCellIDs.includes(key)) {
                removeFormatting(key)
            }
        });

        return Object.keys(conditionalFormats).map((cellKey, i) => {

            const selectionOption = [
                ...cellIDs.filter(obj => !Object.keys(conditionalFormats).includes(obj.value)),
                { value: cellKey, label: cellKey }
            ];

            return (
                <tr key={i}>
                    <td>
                        <Select
                            options={selectionOption}
                            value={cellKey}
                            className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                            onChange={(e) => cellIDHandler(e.target.value, cellKey)}
                        />
                    </td>
                    <td>
                        <input type="number"
                            placeholder={'Lower Value'}
                            value={conditionalFormats[cellKey].lower_range}
                            max={conditionalFormats[cellKey].higher_range}
                            onChange={(e) => lowerHandler(e.target.value, cellKey)} />
                    </td>
                    <td>
                        <input type="number"
                            placeholder={'Higher Value'}
                            value={conditionalFormats[cellKey].higher_range}
                            min={conditionalFormats[cellKey].lower_range}
                            onChange={(e) => higherHandler(e.target.value, cellKey)} />
                    </td>
                    <td>
                        <Button
                            label="Remove"
                            variant="destructive"
                            className="rainbow-m-around_medium"
                            size='small'
                            onClick={() => removeFormatting(cellKey)}
                        />
                    </td>
                </tr>
            );
        });
    }

    // TODO: helper Function For Adding Each index as an key value pair
    async function helperFunction(rowIndex, colIndex, value) {
        const alphabet = await 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('');
        const key = `${alphabet[colIndex]}${rowIndex + 1}`;
        return key;
    }

    // TODO: Handle From Submit
    const handleSetData = async (e) => {

        const childTable = [...cellTexts];

        childTable.map((eachRow, rowIndex) => {
            const eachRowObj = {};
            eachRow.map(async (eachColumn, colIndex) => {
                let eachObjKey = await helperFunction(rowIndex, colIndex, eachColumn);
                eachRowObj[`${eachObjKey}`] = eachColumn;
            });
            childTable[rowIndex] = eachRowObj;
        });

        if (printOnCertificate == '') {
            const newNotification = {
                title: "Print On Certifcate",
                description: "Please select a table, either it is printable or not.",
                icon: "warning",
                state: true,
                timeout: 15000,
            };
            return dispatch(notificationActions.changenotification(newNotification));
        }

        for (const key of Object.keys(conditionalFormats)) {
            const newNotification = {
                title: `Conditional Formatting Cell ID: ${key}`,
                icon: "warning",
                state: true,
                timeout: 15000,
            };
            if (conditionalFormats[key].lower_range === '' && conditionalFormats[key].higher_range === '') {
                newNotification.description = "Please specify a lower value and a higher value.";
                return dispatch(notificationActions.changenotification(newNotification));
            }
            if (conditionalFormats[key].lower_range === '') {
                newNotification.description = "Please specify a lower value.";
                return dispatch(notificationActions.changenotification(newNotification));
            }
            if (conditionalFormats[key].higher_range === '') {
                newNotification.description = "Please specify a higher value.";
                return dispatch(notificationActions.changenotification(newNotification));
            }
            if (conditionalFormats[key].higher_range < conditionalFormats[key].lower_range) {
                newNotification.description = "The higher value cannot be less than the lower value.";
                return dispatch(notificationActions.changenotification(newNotification));
            }
        }

        const bodyData = {
            fromId: table_Data.fromId,
            rows: rows,
            columns: columns,
            header_types: headerTypes,
            header_texts: headerTexts,
            second_row_headers: secondRowHeaders,
            cell_texts: childTable,
            table_type: "vertical",
            unique_id: unique_id,
            print_on_certifcate: printOnCertificate,
            procedure_image_filename: tableImage,
            conditional_formats: conditionalFormats
        }
        // return console.log(bodyData);

        setIsSet(true);

        setArraydata(bodyData);
    }

    return (
        <div ref={divOneRef} style={{ position: 'relative' }}>
            <div className="child_controller_btn_area" style={{ height: '80px', alignItems: 'center', margin: '0 0 1rem 1rem ' }}>
                <FileSelector
                    className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto file_selector_width"
                    style={containerStyles}
                    size="small"
                    label="File selector"
                    placeholder="Drag & Drop or Click to Browse"
                    bottomHelpText={!imageFilesErr ? "Only jpg, jpeg, png allowed." : ''}
                    error={imageFilesErr}
                    multiple
                    accept="image/jpg, image/jpeg, image/png"
                    onChange={UploadImageHandler}
                />
                <Button
                    label="Upload"
                    variant="success"
                    className="rainbow-m-around_medium"
                    size='small'
                    disabled={!imageFiles.length}
                    onClick={UploadHandler}
                />
                <div className='child_controller_btn_area' style={{ justifyContent: 'center' }}>{tableImage.map((image) => {
                    return <img
                        src={image}
                        alt="table-image"
                        width={100}
                        height={80}
                    />
                })}
                </div>
            </div>

            {/* Add | Remove => Colum & Row  */}
            <div className="child_controller_btn_area">
                <Button
                    label="Add Row"
                    onClick={addRow}
                    variant="success"
                    className="rainbow-m-around_medium"
                    size='small'
                />
                <Button
                    label="Add Column"
                    onClick={addColumn}
                    variant="success"
                    className="rainbow-m-around_medium"
                    size='small'
                />

                <Button
                    label="Delete Row"
                    variant="destructive"
                    className="rainbow-m-around_medium"
                    onClick={deleteRow}
                    size='small'
                />
                <Button
                    label="Delete Column"
                    variant="destructive"
                    className="rainbow-m-around_medium"
                    onClick={deleteColumn}
                    size='small'
                />
            </div>

            {/* Table Area */}
            <div className='table-responsive' ref={divTwoRef} >
                <table>
                    <tbody>
                        {renderRows()}
                    </tbody>
                </table>
            </div>

            {/* Conditional Formatting Area */}
            <section className="conditional_section">
                <h4 className='title' style={{ textAlign: 'left' }}>
                    Conditional Formatting:
                </h4>

                <Button
                    label="Add New Format"
                    variant="success"
                    className="rainbow-m-around_medium"
                    size='small'
                    onClick={addFormatting}
                />

                <div className='table-responsive' ref={divTwoRef} >
                    <table>
                        {/*** Header ***/}
                        {Object.keys(conditionalFormats).length ?
                            <thead>
                                <tr className="conditional_header">
                                    <td>Cell ID</td>
                                    <td>Lower Range (&#8804;)</td>
                                    <td>Higher Range (&#8805;)</td>
                                    <td></td>
                                </tr>
                            </thead> : null}
                        {/*** Cells ***/}
                        <tbody>
                            {readerConditionals()}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* table Set Button */}
            <div className="eachBottomSection">
                <Button
                    label={isSet ? "Data Added" : "Set Data"}
                    variant={`${isSet ? "outline-brand" : "border-filled"}`}
                    className="rainbow-m-around_medium"
                    onClick={handleSetData}
                />

                <p style={{ color: "red" }}>
                    *After Entering all data you need to set data
                </p>
            </div>

            {/* table Delete Button */}
            <Button
                label="Delete"
                variant="destructive"
                className="btn btn-danger delete_table_btn"
                onClick={() => { deleteTable(unique_id, table_Data.fromId) }}
            />

            {/* Print On Certifcate Area */}
            <div className='print_on_certifcate_area'>
                <label htmlFor="printOnCertifcate" class="form-label">Print On Certifcate:</label>
                <select id='printOnCertifcate' onChange={(e) => {
                    setPrintOnCertificate(e.target.value);
                    setIsSet(false);
                }}>
                    <option value="">--Select--</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                </select>
            </div>

        </div>
    )
}

export default VerticalTable;