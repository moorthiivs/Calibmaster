import React, { useState } from 'react'
import { Button } from 'react-rainbow-components';
import { std, square } from "mathjs";

const ExistVerticalTable1 = ({ fromId, setArraydata, eachItem, unique_id }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(parseInt(eachItem.rows)); // Initial rows
    const [columns, setColumns] = useState(parseInt(eachItem.columns)); // Initial columns
    const [headerTexts, setHeaderTexts] = useState(eachItem.header_texts); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState(eachItem.second_row_headers); // Second row header input values
    const [headerTypes, setHeaderTypes] = useState(eachItem.header_types); // Dropdown values
    const [cellTexts, setCellTexts] = useState(eachItem.cell_texts); // Cell input values

    const [coreInfo, setCoreInfo] = useState(
        { avg: 0, std_dev: 0, mean_std_dev: 0 }
    );

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

    // TODO: Handle From Submit
    const handleSetData = async (e) => {

        calculationFormula();

        const bodyData = {
            design_procedure_id: eachItem.design_procedure_id,
            fromId: fromId,
            rows: rows,
            columns: columns,
            header_types: headerTypes,
            header_texts: headerTexts,
            second_row_headers: secondRowHeaders,
            cell_texts: cellTexts,
            table_type: "1stVertical",
            unique_id: unique_id
        }

        setIsSet(true);

        setArraydata(bodyData);
    }

    return (
        <div className='bg-primary-subtle' style={{ position: 'relative' }}>

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
                <p style={{ color: "red" }}>*After Entering all data you need to set data</p>
            </div>

        </div>
    )
}

export default ExistVerticalTable1