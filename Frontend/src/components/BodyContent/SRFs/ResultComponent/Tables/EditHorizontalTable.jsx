import React, { useEffect, useState } from 'react';
import { Button, Modal, Card, Input, Select, Spinner } from 'react-rainbow-components';
import { parseFormula } from '../../../../helpers/formula_parser';
import { mean, std, sqrt } from 'mathjs';

const EditHorizontalTable = ({ fromId, item, setArraydata, ifExist }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(""); // Initial rows
    const [columns, setColumns] = useState(""); // Initial columns
    const [headerTypes, setHeaderTypes] = useState([]); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState([]); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState([]); // Second row header input values
    const [cellTexts, setCellTexts] = useState([]); // Cell input values

    // States for Uncertinity
    const [avg, setAvg] = useState(0);
    const [stdDev, setStdDev] = useState(0);
    const [ua, setUA] = useState(0);

    const fetchFromDesign = async () => {
        try {

            const { rows, columns, header_types, header_texts, second_row_headers, cell_texts } = item;

            setRows(rows);
            setColumns(columns);
            setHeaderTypes(header_types);
            setHeaderTexts(header_texts);
            setSecondRowHeaders(second_row_headers);

            const mainTable = await cell_texts.map((eachRow) => (
                eachRow.map((eachColumn, colIndex) =>
                    eachColumn.startsWith("FORMULA") ? (
                        { val: 0, columnFormula: eachColumn, constFormular: eachColumn }
                    ) : (
                        eachColumn
                    ))
            ))
            setCellTexts(mainTable);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchFromDesign();
    }, []);

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
                                        value={col}
                                        disabled={true}
                                    >
                                        <option value="textWithInput">Text with Input</option>
                                        <option value="text">Text</option>
                                    </select>
                                } else {
                                    return renderCell(rowIndex, colIndex, col, "result");
                                }
                            })()
                        }
                    </td>
                ))}
            </tr>
        ));
    };

    // TODO: Handle Set Data
    const handleSetData = async (e) => {

        e.preventDefault();

        if (ifExist) {

            const bodyData = {
                result_table_id: item.result_table_id,
                fromId: fromId,
                unique_id: item.unique_id,
                rows: rows,
                columns: columns,
                header_types: headerTypes,
                header_texts: headerTexts,
                second_row_headers: secondRowHeaders,
                cell_texts: cellTexts,
                table_type: 'horizontal'
            }

            setIsSet(true);
            setArraydata(bodyData);

        } else {
            const bodyData = {
                fromId: fromId,
                unique_id: item.unique_id,
                rows: rows,
                columns: columns,
                header_types: headerTypes,
                header_texts: headerTexts,
                second_row_headers: secondRowHeaders,
                cell_texts: cellTexts,
                table_type: 'horizontal'
            }

            setIsSet(true);
            setArraydata(bodyData);
        }
    }

    // *** Generate Uncertinity Handler ***
    const generateUncertinityHandler = () => {

        const flatArray = [];

        cellTexts?.map((row, rowIndex) => {
            flatArray.push(row.slice(3));
        });

        const result = flatArray?.reduce((accumulator, value) => {
            const eachCol = parseFloat(value)
            return accumulator?.concat(eachCol);
        }, []);

        const avg_calculation = mean(result);
        console.log(avg_calculation);
        const std_calculation = std(result);

        setAvg(avg_calculation.toFixed(3));
        setStdDev(std_calculation.toFixed(3));

        const countOfArr = result?.length;
        const uaCalculation = std_calculation / sqrt(countOfArr)
        setUA(uaCalculation.toFixed(5));

        handleSetData();
    }

    return (
        <>
            <div className='table-responsive'>

                {/* <h4>{`From-${fromId + 1}`}</h4> */}

                <table className='tableStyle'>
                    <tbody>
                        {renderRows()}
                    </tbody>
                </table>

                <div className="row">
                    <h5 style={{ marginBottom: 0 }}>Average: {avg}</h5>
                    <h5 style={{ margin: 0 }}>Standard Deviation: {stdDev}</h5>
                    <h5 style={{ marginTop: 0 }}>Uncertainty: {ua}</h5>
                </div>
            </div>

            <div className="eachBottomSection">

                <Button
                    label="Generate Uncertinity"
                    variant="outline-brand"
                    onClick={generateUncertinityHandler}
                />

                {/* <Button
                    label={isSet ? "Data Added" : "Set Data"}
                    variant={`${isSet ? "outline-brand" : "border-filled"}`}
                    className="rainbow-m-around_medium"
                    onClick={handleSetData}
                /> */}

                <p style={{ color: "red" }}>
                    *After Entering all data you need to set data
                </p>
            </div>
        </>
    )
}

export default EditHorizontalTable