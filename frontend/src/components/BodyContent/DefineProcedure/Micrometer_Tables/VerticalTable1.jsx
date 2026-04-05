import React, { useState } from 'react';
import { Button, } from 'react-rainbow-components';
import { std, square } from "mathjs";

const VerticalTable1 = ({ fromId, setArraydata, unique_id, deleteTable }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(2); // Initial rows
    const [columns, setColumns] = useState(4); // Initial columns
    const [headerTypes, setHeaderTypes] = useState(Array(columns).fill('textWithInput')); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState(Array(columns).fill('')); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState(Array(columns).fill('')); // Second row header input values

    const [cellTexts, setCellTexts] = useState([
        { serial_number_title: 'Trial no', error_title: 'Error in mm', formula_one_title: "(Xi-Xa)", formula_two_title: "(Xi-Xa)²" },
        { id: 1, error_value: 25.000, formula_one: "", formula_two: "" },
        { id: 2, error_value: 25.000, formula_one: "", formula_two: "" },
        { id: 3, error_value: 25.000, formula_one: "", formula_two: "" },
        { id: 4, error_value: 25.001, formula_one: "", formula_two: "" },
        { id: 5, error_value: 25.001, formula_one: "", formula_two: "" },
        { id: 6, error_value: 25.001, formula_one: "", formula_two: "" },
        { id: 7, error_value: 25.000, formula_one: "", formula_two: "" },
        { id: 8, error_value: 25.000, formula_one: "", formula_two: "" },
        { id: 9, error_value: 25.000, formula_one: "", formula_two: "" },
        { id: 10, error_value: 25.000, formula_one: "", formula_two: "" },
    ]);

    const [coreInfo, setCoreInfo] = useState(
        { avg: 0, std_dev: 0, mean_std_dev: 0 }
    );

    // TODO: Calculation, std_dev, mean_std_dev Handler
    function calculateCoreFormula(avg, arr) {
        try {

            const stdDevArray = [];

            arr?.map((eachObj, index) => {
                stdDevArray.push(eachObj.error_value);
            })

            const calculateStdDev = std(stdDevArray);
            const calculateMeanStdDev = (std(stdDevArray) / Math.sqrt(10));

            setCoreInfo((obj) => {
                return {
                    ...obj,
                    avg: avg.toFixed(4),
                    std_dev: calculateStdDev.toFixed(6),
                    mean_std_dev: calculateMeanStdDev.toFixed(7)
                }
            });
        } catch (error) {
            console.dir(error);
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

    // TODO: Handle From Submit
    const handleSetData = async (e) => {

        calculationFormula();

        const bodyData = {
            fromId: fromId,
            rows: rows,
            columns: columns,
            header_types: headerTypes,
            header_texts: headerTexts,
            second_row_headers: secondRowHeaders,
            cell_texts: cellTexts,
            table_type: "vertical",
            unique_id: unique_id
        }

        setIsSet(true);

        setArraydata(bodyData);
    }

    return (
        <div className='bg-secondary-subtle' style={{ position: 'relative' }}>

            <div className='table-responsive'>
                <table>
                    <tbody>
                        {
                            cellTexts.map((item, index) => {
                                if (index == 0)
                                    return <tr key={index}>
                                        <td>
                                            <input
                                                type="text"
                                                name="serial_number_title"
                                                value={item.serial_number_title}
                                                disabled={true}
                                                placeholder={`Serial No Title - ${index}`}
                                                onChange={(e) => console.log(e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="error_title"
                                                value={item.error_title}
                                                disabled={true}
                                                placeholder={`Error Title - ${index}`}
                                                onChange={(e) => console.log(e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="formula_one_title"
                                                value={item.formula_one_title}
                                                disabled={true}
                                                placeholder={`Formula Patter One - ${index}`}
                                                onChange={(e) => console.log(e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="formula_two_title"
                                                value={item.formula_two_title}
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
                                                defaultValue={item.id}
                                                placeholder={`Trail No - ${index}`}
                                                onChange={(e) => serialNoHandler(index, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                name='error_title'
                                                defaultValue={item.error_value}
                                                placeholder={`Error value`}
                                                onChange={(e) => errorValueHandler(index, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name='formula_one'
                                                value={item.formula_one}
                                                placeholder={`Formula One`}
                                                disabled={true}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name='formula_two'
                                                value={item.formula_two}
                                                placeholder={`Formula Two`}
                                                disabled={true}
                                            />
                                        </td>
                                    </tr>
                            })
                        }
                    </tbody>
                </table>

                <p>Average: {coreInfo?.avg}</p>
                <p>STD DEV: {coreInfo?.std_dev}</p>
                <p>Mean Of STD DEV: {coreInfo?.mean_std_dev}</p>
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
        </div>
    )
}

export default VerticalTable1;