import React, { useState } from 'react'
import { Button } from 'react-rainbow-components';
import { std, square } from "mathjs";

const ExistVerticalTable2 = ({ fromId, setArraydata, eachItem, unique_id }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(parseInt(eachItem.rows)); // Initial rows
    const [columns, setColumns] = useState(parseInt(eachItem.columns)); // Initial columns
    const [headerTexts, setHeaderTexts] = useState(eachItem.header_texts); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState(eachItem.second_row_headers); // Second row header input values
    const [headerTypes, setHeaderTypes] = useState(eachItem.header_types); // Dropdown values
    const [cellTexts, setCellTexts] = useState(eachItem.cell_texts); // Cell input values

    const [uncertainty, setUncertainty] = useState({
        combined_uncertainty: 0, effective_degrees_of_freedom: 0, k_factor: 2, expanded_uncertainty: 0
    });

    // estimate Handler
    function estimateHandler(name, value, rowIndex) {
        try {
            setCellTexts(cellTexts.map((eachRow, index) => {
                if (index === rowIndex) {
                    return {
                        ...eachRow,
                        [name]: value,
                    }
                } else {
                    return eachRow;
                }
            }));
        } catch (error) {
            console.log(error);
        }
    }

    async function calcuateFormula() {

        const arr = cellTexts.slice(1);

        const newArr = []

        // console.log(arr);

        setCellTexts(cellTexts.map((eachRow, index) => {
            if (index !== 0) {
                const { limits, factor, sensitivity_coefficient } = eachRow;

                let std_uncertainty = "";
                let uncertainty_contribution = "";

                if (index === 7) {
                    std_uncertainty = (((limits / factor) * 50) / 100);
                } else {
                    std_uncertainty = (limits / factor)
                }

                if (index === 8) {
                    uncertainty_contribution = (std_uncertainty * 1000)
                } else {
                    uncertainty_contribution = (std_uncertainty * sensitivity_coefficient)
                }

                const eachObj = {
                    ...eachRow,
                    std_uncertainty: std_uncertainty,
                    uncertainty_contribution: uncertainty_contribution
                }

                newArr.push(eachObj);

                return eachObj;
            } else {
                return eachRow;
            }
        }));

        // return console.log(newArr);

        let combined_uncertainty = newArr.reduce((total, currentValue) => {
            return total + Math.pow(currentValue.uncertainty_contribution, 2)
        }, 0);
        combined_uncertainty = Math.sqrt(combined_uncertainty)
        console.log({ combined_uncertainty });

        const { uncertainty_contribution } = newArr[7];
        const x1 = (Math.pow(uncertainty_contribution, 4));
        const y1 = (Math.pow(combined_uncertainty, 4));
        const effective_degrees_of_freedom = 9 * (y1 / x1);
        console.log({ effective_degrees_of_freedom });

        setUncertainty((oldObj) => {

            return {
                ...oldObj,
                combined_uncertainty: combined_uncertainty,
                effective_degrees_of_freedom: effective_degrees_of_freedom,
                expanded_uncertainty: oldObj.k_factor * combined_uncertainty
            }
        })
    }

    // TODO: Handle From Submit
    const handleSetData = async (e) => {

        await calcuateFormula();

        console.log(cellTexts);

        const bodyData = {
            design_procedure_id: eachItem.design_procedure_id,
            fromId: fromId,
            rows: rows,
            columns: columns,
            header_types: headerTypes,
            header_texts: headerTexts,
            second_row_headers: secondRowHeaders,
            cell_texts: cellTexts,
            table_type: "2ndVertical",
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
                                        <td><input type="text" value={item?.top_title_1} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_2} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_3} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_4} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_5} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_6} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_7} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_8} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_9} disabled={true} /></td>
                                        <td><input type="text" value={item?.top_title_10} disabled={true} /></td>
                                    </tr>
                            })
                        }

                        {
                            cellTexts.map((item, index) => {
                                if (index != 0)
                                    return <tr key={index}>
                                        {/* each_title */}
                                        <td>
                                            <input
                                                type="text"
                                                name="each_title"
                                                defaultValue={item.each_title}
                                                onChange={(e) => estimateHandler(e.target.name, e.target.value, index)}
                                            />
                                        </td>
                                        {/* estimate */}
                                        <td>
                                            <input
                                                type="text"
                                                name="estimate"
                                                defaultValue={item.estimate}
                                                onChange={(e) => estimateHandler(e.target.name, Number(e.target.value), index)}
                                            />
                                        </td>
                                        {/* limits */}
                                        <td>
                                            <input
                                                type="text"
                                                name="limits"
                                                defaultValue={item.limits}
                                                onChange={(e) => estimateHandler(e.target.name, Number(e.target.value), index)}
                                            />
                                        </td>
                                        {/* type */}
                                        <td>
                                            <input
                                                type="text"
                                                name="type"
                                                defaultValue={item.type}
                                                onChange={(e) => estimateHandler(e.target.name, e.target.value, index)}
                                            />
                                        </td>
                                        {/* distribution */}
                                        <td>
                                            <input
                                                type="text"
                                                name="distribution"
                                                defaultValue={item.distribution}
                                                onChange={(e) => estimateHandler(e.target.name, e.target.value, index)}
                                            />
                                        </td>
                                        {/* factor */}
                                        <td>
                                            <input
                                                type="number"
                                                name="factor"
                                                defaultValue={item.factor}
                                                onChange={(e) => estimateHandler(e.target.name, Number(e.target.value), index)}
                                            />
                                        </td>
                                        {/* std_uncertainty */}
                                        <td>
                                            <input
                                                type="text"
                                                name="std_uncertainty"
                                                disabled={true}
                                                value={item.std_uncertainty}
                                            />
                                        </td>
                                        {/* sensitivity_coefficient */}
                                        <td>
                                            <input
                                                type="text"
                                                name="sensitivity_coefficient"
                                                defaultValue={item.sensitivity_coefficient}
                                                disabled={true}
                                            />
                                        </td>
                                        {/* uncertainty_contribution */}
                                        <td>
                                            <input
                                                type="text"
                                                name="uncertainty_contribution"
                                                disabled={true}
                                                value={item.uncertainty_contribution}
                                            />
                                        </td>
                                        {/* degrees_of_freedom */}
                                        <td>
                                            <input
                                                type="text"
                                                name="degrees_of_freedom"
                                                disabled={true}
                                                value={item.degrees_of_freedom}
                                            />
                                        </td>
                                    </tr>
                            })
                        }
                    </tbody>
                </table>

                <p>Combined Uncertainty (Uc): {uncertainty?.combined_uncertainty}</p>
                <p>Effective Degrees of Freedom(νeff): {uncertainty?.effective_degrees_of_freedom}</p>
                <p>K factor {uncertainty?.k_factor}</p>
                <p>Expanded Uncertainty (Ue): {uncertainty?.expanded_uncertainty}</p>
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

export default ExistVerticalTable2;