import React, { useEffect, useState } from 'react';
import { Button } from 'react-rainbow-components';
import { std, square } from "mathjs";

const EditVerticalTable1 = ({ fromId, item, setArraydata, ifExist }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(""); // Initial rows
    const [columns, setColumns] = useState(""); // Initial columns
    const [headerTypes, setHeaderTypes] = useState([]); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState([]); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState([]); // Second row header input values
    const [cellTexts, setCellTexts] = useState([]); // Cell input values

    const [coreInfo, setCoreInfo] = useState(
        { avg: 0, std_dev: 0, mean_std_dev: 0 }
    );

    const fetchFromDesign = async () => {
        try {

            const { rows, columns, header_types, header_texts, second_row_headers, cell_texts } = item;

            setRows(rows);
            setColumns(columns);
            setHeaderTypes(header_types);
            setHeaderTexts(header_texts);
            setSecondRowHeaders(second_row_headers);

            if (ifExist) {
                setCellTexts(cell_texts);
                console.log("Exist");
            } else {
                setCellTexts(cell_texts);
                console.log("not Exist")
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchFromDesign();
    }, []);

    // TODO: Calculation, std_dev, mean_std_dev Handler
    function calculateCoreFormula(avg, arr) {
        try {

            const stdDevArray = [];

            arr.map((eachObj, index) => {
                stdDevArray.push(eachObj.error_value);
            })

            const calculateStdDev = std(stdDevArray);
            const calculateMeanStdDev = (std(stdDevArray) / Math.sqrt(10));

            console.log(calculateStdDev);
            console.log(calculateMeanStdDev);

            setCoreInfo((obj) => {
                return {
                    ...obj,
                    avg: avg.toFixed(4),
                    std_dev: calculateStdDev.toFixed(6),
                    mean_std_dev: calculateMeanStdDev.toFixed(7)
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    // TODO: Calculation Formula Handler
    function calculationFormula() {
        try {
            const arr = cellTexts.slice(1, 11);
            const sum = arr.reduce((a, b) => a + b.error_value, 0);
            const avg = (sum / arr.length) || 0;

            calculateCoreFormula(avg, arr);

            setCellTexts(cellTexts.map((eachRow, index) => {
                if ('formula_one' in eachRow) {
                    let count_formula_one = eachRow.error_value - avg;
                    let count_formula_two = count_formula_one ** 2;
                    return {
                        ...eachRow,
                        formula_one: count_formula_one.toFixed(4),
                        formula_two: count_formula_two
                    }
                } else {
                    return eachRow;
                }
            }));
        } catch (error) {
            console.log(error)
        }
    }

    // TODO: Serial No Handler
    function serialNoHandler(cellIndex, value) {
        try {
            setCellTexts(cellTexts.map((eachRow, index) => {
                if (index === cellIndex) {
                    return {
                        ...eachRow,
                        id: value,
                    }
                } else {
                    return eachRow;
                }
            }));
        } catch (error) {
            console.log(error);
        }
    }

    // TODO: Serial No Handler
    function errorValueHandler(cellIndex, value) {
        try {
            setCellTexts(cellTexts.map((eachRow, index) => {
                if (index === cellIndex) {
                    return {
                        ...eachRow,
                        error_value: Number(value),
                    }
                } else {
                    return eachRow;
                }
            }));
        } catch (error) {
            console.log(error);
        }
    }

    // TODO: Handle Set Data
    const handleSetData = async (e) => {

        calculationFormula();

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
                table_type: 'vertical'
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
                table_type: 'vertical'
            }

            setIsSet(true);
            setArraydata(bodyData);
        }
    }

    return (
        <>
            <div className='table-responsive'>

                <h4>{`From-${fromId + 1}`}</h4>

                <table className='tableStyle'>
                    <tbody>
                        {
                            cellTexts?.map((item, index) => {
                                if (index == 0)
                                    return <tr key={index}>
                                        <td>
                                            <input
                                                type="text"
                                                name="serial_number_title"
                                                value={item?.serial_number_title}
                                                disabled={true}
                                                placeholder={`Serial No Title - ${index}`}
                                                onChange={(e) => console.log(e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="error_title"
                                                value={item?.error_title}
                                                disabled={true}
                                                placeholder={`Error Title - ${index}`}
                                                onChange={(e) => console.log(e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="formula_one_title"
                                                value={item?.formula_one_title}
                                                disabled={true}
                                                placeholder={`Formula Patter One - ${index}`}
                                                onChange={(e) => console.log(e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="formula_two_title"
                                                value={item?.formula_two_title}
                                                disabled={true}
                                                placeholder={`Formula Patter Two - ${index}`}
                                                onChange={(e) => console.log(e.target.value)}
                                            />
                                        </td>
                                    </tr>
                            })
                        }

                        {
                            cellTexts.map((item, index) => {
                                if (index != 0 && index <= 10)
                                    return <tr key={index}>
                                        <td>
                                            <input
                                                type="number"
                                                name="id"
                                                defaultValue={item?.id}
                                                placeholder={`Trail No - ${index}`}
                                                onChange={(e) => serialNoHandler(index, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                name='error_title'
                                                defaultValue={item?.error_value}
                                                placeholder={`Error value`}
                                                onChange={(e) => errorValueHandler(index, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name='formula_one'
                                                value={item?.formula_one}
                                                placeholder={`Formula One`}
                                                disabled={true}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name='formula_two'
                                                value={item?.formula_two}
                                                placeholder={`Formula Two`}
                                                disabled={true}
                                            />
                                        </td>
                                    </tr>
                            })
                        }
                    </tbody>
                </table>

                <div className="row">
                    <p>Average: {coreInfo?.avg}</p>
                    <p>STD DEV: {coreInfo?.std_dev}</p>
                    <p>Mean Of STD DEV: {coreInfo?.mean_std_dev}</p>
                </div>
            </div>

            <div className="eachBottomSection">

                <Button
                    label="Generate Uncertinity"
                    variant="outline-brand"
                    onClick={handleSetData}
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

export default EditVerticalTable1