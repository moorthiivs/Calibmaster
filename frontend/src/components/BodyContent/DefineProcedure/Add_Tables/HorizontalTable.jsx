import React, { useState } from 'react';
import { Card, Input, Button, Select, TableWithBrowserPagination, Column, } from 'react-rainbow-components';

const HorizontalTable = ({ fromId, setArraydata, unique_id, deleteTable }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(4); // Initial rows
    const [columns, setColumns] = useState(4); // Initial columns
    const [headerTypes, setHeaderTypes] = useState(Array(columns).fill('textWithInput')); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState(Array(columns).fill('')); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState(Array(columns).fill('')); // Second row header input values
    const [cellTexts, setCellTexts] = useState(Array(rows).fill(Array(columns).fill(''))); // Cell input values

    // TODO: Add Row
    const addRow = () => {
        setRows(rows + 1);
        setCellTexts([...cellTexts, Array(columns).fill('')]);
    };

    // TODO: Add Column
    const addColumn = () => {
        if (columns < 15) {
            setColumns(columns + 1);
            setHeaderTypes([...headerTypes, 'textWithInput']);
            setHeaderTexts([...headerTexts, '']);
            setSecondRowHeaders([...secondRowHeaders, '']);
            setCellTexts(cellTexts.map((row) => [...row, '']));
        }
    };

    // TODO: Delete Row
    const deleteRow = () => {
        if (rows > 1) {
            setRows(rows - 1);
            setCellTexts(cellTexts.slice(0, -1));
        }
    };

    // TODO: Delete Column
    const deleteColumn = () => {
        if (columns > 4) {
            setColumns(columns - 1);
            setHeaderTypes(headerTypes.slice(0, -1));
            setHeaderTexts(headerTexts.slice(0, -1));
            setSecondRowHeaders(secondRowHeaders.slice(0, -1));
            setCellTexts(cellTexts.map((row) => row.slice(0, -1)));
        }
    };

    // TODO: Handle Dropdown Changes 
    const handleHeaderChange = (index, value) => {

        // console.log(cellTexts[index], value);

        setCellTexts((oldVal) => {
            return oldVal.map((row, rIndex) =>
                row.map((col, cIndex) => {
                    if (cIndex == 2 && rIndex == index) {
                        return value;
                    }
                    else {
                        return col;
                    }
                })
            );
        });
    };

    // TODO: Handle Input Changes
    const handleCellChange = (rowIndex, colIndex, value) => {
        const updatedTexts = cellTexts.map((row, rIndex) =>
            rIndex === rowIndex
                ? row.map((col, cIndex) => (cIndex === colIndex ? value : col))
                : row
        );
        setCellTexts(updatedTexts);
    };

    // *** renderCell with conditions ***
    const renderCell = (rowIndex, colIndex, col, type) => {
        if (cellTexts[rowIndex][2] == 'textWithInput' || cellTexts[rowIndex][2] == '') {
            return <input
                type="text"
                value={col}
                className="form-control"
                placeholder={type == "header" ? `Header ${colIndex + 1}` : `Row ${rowIndex + 1}, Col ${colIndex - 2}`}
                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
            />;
        } else {
            return <input
                type="text"
                disabled={true}
                value={col}
                className="form-control"
                placeholder={type == "header" ? `Header ${colIndex + 1}` : `Row ${rowIndex + 1}, Col ${colIndex - 2}`}
                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
            />;
        }
    };

    // *** Render Main Input Cells
    const renderRows = () => {
        return cellTexts.map((row, rowIndex) => (
            <tr key={rowIndex}>
                {row.map((col, colIndex) => (
                    <td key={colIndex} id={`cell-${rowIndex}-${colIndex}`}>
                        {
                            (() => {
                                if (colIndex == 0 || colIndex == 1) {
                                    return renderCell(rowIndex, colIndex, col, "header");
                                } else if (colIndex == 2) {
                                    return <select
                                        onChange={(e) => handleHeaderChange(rowIndex, e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="textWithInput">Text with Input</option>
                                        <option value="text">Text</option>
                                    </select>
                                } else {
                                    return renderCell(rowIndex, colIndex, col, "value_input");
                                }
                            })()
                        }
                    </td>
                ))}
            </tr>
        ));
    };

    // TODO: Handle From Submit
    const handleSetData = async (e) => {

        e.preventDefault();

        const bodyData = {
            fromId: fromId,
            rows: rows,
            columns: columns,
            header_types: headerTypes,
            header_texts: headerTexts,
            second_row_headers: secondRowHeaders,
            cell_texts: cellTexts,
            table_type: "horizontal",
            unique_id: unique_id
        }

        setIsSet(true);

        setArraydata(bodyData);
    }

    return (
        <div className='bg-secondary-subtle' style={{ position: 'relative' }}>

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

            <div className='table-responsive'>
                <table>
                    <tbody>
                        {renderRows()}
                    </tbody>
                </table>
            </div>

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

            <Button
                label="Delete"
                variant="destructive"
                className="btn btn-danger delete_table_btn"
                onClick={() => { deleteTable(unique_id) }}
            />
        </div>
    )
}

export default HorizontalTable;