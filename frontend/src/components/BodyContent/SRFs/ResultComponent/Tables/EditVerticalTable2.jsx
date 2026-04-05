import React, { useEffect, useState } from 'react';
import { Button } from 'react-rainbow-components';
import { std, square } from "mathjs";

const EditVerticalTable2 = ({ fromId, item, setArraydata, ifExist }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(""); // Initial rows
    const [columns, setColumns] = useState(""); // Initial columns
    const [headerTypes, setHeaderTypes] = useState([]); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState([]); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState([]); // Second row header input values
    const [cellTexts, setCellTexts] = useState([]); // Cell input values

    const [uncertainty, setUncertainty] = useState({
        combined_uncertainty: 0, effective_degrees_of_freedom: 0, k_factor: 2, expanded_uncertainty: 0
    });

    const fetchFromDesign = async () => {
        try {

            const { rows, columns, header_types, header_texts, second_row_headers, cell_texts } = item;
            console.log(cell_texts);

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

    // Calcuate Formula
    function calcuateFormula() {

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
                console.log(eachObj);
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

        const { uncertainty_contribution } = newArr[7];
        const x1 = (Math.pow(uncertainty_contribution, 4));
        const y1 = (Math.pow(combined_uncertainty, 4));
        const effective_degrees_of_freedom = 9 * (y1 / x1);

        setUncertainty((oldObj) => {

            return {
                ...oldObj,
                combined_uncertainty: combined_uncertainty,
                effective_degrees_of_freedom: effective_degrees_of_freedom,
                expanded_uncertainty: oldObj.k_factor * combined_uncertainty
            }
        })
    }

    // TODO: Handle Set Data
    const handleSetData = async (e) => {

        calcuateFormula();

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

                <div className="row">
                    <p>Combined Uncertainty (Uc): {uncertainty?.combined_uncertainty}</p>
                    <p>Effective Degrees of Freedom(νeff): {uncertainty?.effective_degrees_of_freedom}</p>
                    <p>K factor {uncertainty?.k_factor}</p>
                    <p>Expanded Uncertainty (Ue): {uncertainty?.expanded_uncertainty}</p>
                </div>
            </div>

            <div className="eachBottomSection">

                <Button
                    label="Generate Uncertinity"
                    variant="outline-brand"
                    onClick={handleSetData}
                />

                <p style={{ color: "red" }}>
                    *After Entering all data you need to set data
                </p>
            </div>
        </>
    )
}

export default EditVerticalTable2