import React, { useEffect, useState } from 'react';
import { Button, Modal, Card, Input, Select, Spinner } from 'react-rainbow-components';
import { useDispatch, useSelector } from 'react-redux';
import { updateKeyValProcedures } from '../../../../../store/procedureSlice';
import { parseFormula } from '../../../../helpers/formula_parser';
import { evaluate } from 'mathjs';
import "./tableInputCellStyle.css";

const ExistResultTable = ({ fromId, item, setArraydata, ifExist, divTwoRef }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(""); // Initial rows
    const [columns, setColumns] = useState(""); // Initial columns
    const [headerTypes, setHeaderTypes] = useState([]); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState([]); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState([]); // Second row header input values
    const [cellTexts, setCellTexts] = useState([]); // Cell input values
    const [printOnCertificate, setPrintOnCertificate] = useState('');

    const dispatch = useDispatch();
    const selector = useSelector((state) => state.procedures);

    // ! For VALUEOF
    function assignValue() {
        cellTexts.map((objRow, rowIndex) => {
            for (const eachKey in objRow) {
                let { constFormula, val, f_script, is_Value_Of } = objRow[eachKey];
                if (is_Value_Of) {
                    let newValue = getValueForScriptCellFromStore(constFormula);
                    objRow[eachKey].val = newValue;
                }
            }
        });
        setCellTexts([...cellTexts]);
    }

    // ! For VALUEOF
    useEffect(() => {
        assignValue();
    }, [selector]);

    // ! For VALUEOF
    function getValueForScriptCellFromStore(cellKey) {
        for (const subArray of selector) {
            for (const objRow of subArray) {
                for (const EachKey in objRow) {
                    if (EachKey == cellKey) {
                        const { val } = objRow[EachKey];
                        return val;
                    }
                }
            }
        }
    }

    // *** fetch From Design Handler ***
    const fetchFromDesign = async () => {
        try {

            const { rows, columns, header_types, header_texts, second_row_headers, cell_texts, print_on_certifcate } = item;

            setRows(rows);
            setColumns(columns);
            setHeaderTypes(header_types);
            setHeaderTexts(header_texts);
            setSecondRowHeaders(second_row_headers);

            const modifiedBodyArray = cell_texts.map((eachRow, rowIndex) => {
                for (const key in eachRow) {

                    let eachObjectKey = key;
                    let eachObjectValue = eachRow[key];

                    // console.log(eachObjectValue);
                    let response = '';

                    if (typeof eachObjectValue === 'object') {
                        response = parseFormula(eachObjectKey, eachObjectValue?.constFormula);
                        // console.log(response);

                        if (response?.hasOwnProperty("HEADER")) {
                            eachObjectValue.val = response?.HEADER;
                        }
                        if (response?.hasOwnProperty("BLANK")) {
                            eachObjectValue.val = '--';
                        }
                        if (response?.hasOwnProperty("TEXT")) {
                            eachObjectValue.val = response?.TEXT;
                        }
                    }
                }
                return eachRow;
            });
            // console.log(modifiedBodyArray);
            setCellTexts(modifiedBodyArray);

            // console.log(print_on_certifcate);
            setPrintOnCertificate(print_on_certifcate);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchFromDesign();
    }, []);


    // TODO: Update Value of the cell object Handler
    function updateCellObjectKeyValue(keyName, value) {
        try {
            for (let obj of cellTexts) {
                if (obj.hasOwnProperty(keyName)) {
                    obj[keyName].val = value;
                    break;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    // TODO: Parse Formula -> Original Value
    function evaluateConstFormula(formula) {
        // Extract the keys from the formula
        const keys = formula.match(/T\d+[A-Z]\d+/g);
        // console.log(keys);

        // Replace the keys with their corresponding constFormula from the data array
        keys.forEach(key => {
            let replaced = false;
            for (const obj of cellTexts) {
                if (obj[key]) {
                    // console.log(key);
                    const constFormula = obj[key].constFormula;
                    const constval = obj[key].val;
                    // Only replace if the constFormula is a number or a valid expression
                    if (!isNaN(constFormula)) {
                        let numberValue = Number(constFormula);
                        // In this case the number should assign into val key
                        updateCellObjectKeyValue(key, numberValue);
                        formula = formula.replace(key, numberValue);
                    } else {
                        formula = formula.replace(key, constval || 0);
                    }
                    replaced = true;
                    break;
                }
            }

            if (!replaced) {
                const reduxValue = findKeyFromSelecotor(key);
                if (reduxValue !== null) {
                    formula = formula.replace(key, reduxValue);
                }
            }
        });

        // Evaluate the formula (this is basic evaluation and won't handle complex cases)
        try {
            return formula;
        } catch (error) {
            console.error('Error evaluating formula:', error);
            return null;
        }
    }

    // TODO: Handle Input Changes
    const handleCellChange = (eachObjectKey, e, rowIndex) => {
        let inputValue = e.target.value;
        // console.log({ eachObjectKey, inputValue });

        const newCellText = [...cellTexts]

        for (let obj of newCellText) {
            if (obj.hasOwnProperty(eachObjectKey)) {
                // console.log(obj[eachObjectKey]);
                obj[eachObjectKey].val = (inputValue !== '') && Number(inputValue);
                break;
            }
        }
        // setCellTexts(newCellText);

        // TODO: Some how we need to find the script column at the same row 
        for (const key in newCellText[rowIndex]) {
            if (newCellText[rowIndex][key].f_script) {
                let formula = newCellText[rowIndex][key].constFormula; // Getting the formula
                let result = evaluateConstFormula(formula, cellTexts); // get formula with actual value
                let evalResult = evaluate(result); // use evaluate function for executing the formula
                // console.log(evalResult);
                newCellText[rowIndex][key].val = evalResult;
                newCellText[rowIndex][key].columnFormula = result;
            }
        }

        setCellTexts(newCellText);

        let rowObj = JSON.parse(JSON.stringify(newCellText[rowIndex]));
        // console.log(rowObj);
        dispatch(updateKeyValProcedures({ rowObj }));
    };

    // *** Render Main Input Cells
    const renderRows = () => {
        return cellTexts?.map((row, rowIndex) => {

            const eachRow = [];

            for (const key in row) {
                // console.log("Each Raw");
                // console.log(key);

                const eachObjectKey = key;
                const eachObjectColumnValue = row[key]?.val;
                const eachObjectConstFormula = row[key]?.constFormula;
                const eachObjectCoumnFormula = row[key]?.columnFormula;
                const eachObjectCoumnisValueOf = row[key]?.is_Value_Of; // ! For VALUEOF

                // console.log({ eachObjectKey, eachObjectConstFormula });
                let response = parseFormula(eachObjectKey, eachObjectConstFormula);
                // console.log(response);

                let eachTd;
                if (response?.hasOwnProperty("HEADER")) {
                    eachTd = <td key={eachObjectKey}>{response.HEADER} | <span>HEADER</span> </td>
                }
                else if (response?.hasOwnProperty("TEXT")) {
                    eachTd = <td key={eachObjectKey}>
                        <span>{response.TEXT} | TEXT</span> <br />
                        <span>Cell ID: {eachObjectKey}</span>
                    </td>
                }
                else if (response?.hasOwnProperty("INPUT")) {
                    eachTd = <td key={eachObjectKey}>
                        <input type="number" id={eachObjectKey} className='inputCell'
                            value={eachObjectColumnValue} step={0.00001}
                            onChange={(e) => handleCellChange(eachObjectKey, e, rowIndex)}
                        />
                        <br />
                        <span>INPUT: {eachObjectKey}</span>
                        <br />
                        <span>value: {eachObjectColumnValue}</span>
                        <br />
                        <span>Cell ID: {eachObjectKey}</span>
                    </td>
                }
                else if (response?.hasOwnProperty("DEFAULTVALUE")) {
                    eachTd = <td key={eachObjectKey}>
                        <span>DEFAULTVALUE</span> <br />
                        <span>Value: {eachObjectColumnValue}</span> <br />
                        <span> Cell Id: {eachObjectKey}</span>
                    </td>
                }
                else if (response?.hasOwnProperty("BLANK")) {
                    eachTd = <td key={eachObjectKey}>
                        <span>BLANK</span>
                        <br />
                        <span>Cell ID: {eachObjectKey}</span>
                    </td>
                }
                // ! For VALUEOF
                else if (eachObjectCoumnisValueOf) {
                    eachTd = <td key={eachObjectKey}>
                        <span>VALUEOF: {eachObjectConstFormula}</span> <br />
                        <span>Value: {getValueForScriptCellFromStore(eachObjectConstFormula)}</span> <br />
                        <span> Cell Id: {eachObjectKey}</span>
                    </td>
                }
                else if (response?.hasOwnProperty("SCRIPT")) {
                    eachTd = <td key={eachObjectKey}>
                        <span>SCRIPT: {eachObjectConstFormula}</span>
                        <br />
                        <span>Query: {eachObjectCoumnFormula}</span>
                        <br />
                        <span>Value = {eachObjectColumnValue}</span>
                        <br />
                        <span>Cell ID: {eachObjectKey}</span>
                    </td>
                } else {
                    eachTd = <td key={eachObjectKey}>
                        {/* <input type="text" id={eachObjectKey} defaultValue={response} /> */}
                        <span> ELSE Condition</span>
                        <br />
                        <span>Parser Respose: {response}</span>
                        <br />
                        <span>Cell Id: {eachObjectKey}</span>
                    </td>
                }
                eachRow.push(eachTd);
            }

            return <tr key={`${rowIndex + 1}`}>
                {eachRow}
            </tr>
        });
    };

    function findKeyFromSelecotor(queryKey) {
        for (const subArray of selector) {
            for (const objRow of subArray) {
                for (const key in objRow) {
                    if (key == queryKey) {
                        const { val } = objRow[key];
                        return val
                    }
                }
            }
        }
    }

    function getValueFromScriptHandler(formula) {
        try {
            const keys = formula.match(/T\d+[A-Z]\d+/g);

            if(!keys) return 0;

            keys.forEach(key => {
                let replaced = false;
                for (const obj of cellTexts) {
                    if (obj[key]) {
                        // console.log(key);
                        const constFormula = obj[key].constFormula;
                        const constval = obj[key].val;
                        // Only replace if the constFormula is a number or a valid expression
                        if (!isNaN(constFormula)) {
                            let numberValue = Number(constFormula);
                            // In this case the number should assign into val key
                            updateCellObjectKeyValue(key, numberValue);
                            formula = formula.replace(key, numberValue);
                        } else {
                            formula = formula.replace(key, constval || 0);
                        }
                        replaced = true;
                        break;
                    }
                }

                if (!replaced) {
                    const reduxValue = findKeyFromSelecotor(key);
                    if (reduxValue !== null) {
                        formula = formula.replace(key, reduxValue);
                    }
                }
            });

            return evaluate(formula);
        } catch (error) {
            console.log(error);
        }
    }

    async function getDataFromStore() {
        cellTexts.map((eachRow, rowIndex) => {
            for (const key in eachRow) {
                let { columnFormula, constFormula, val, f_script } = eachRow[key];
                if (f_script) {
                    let getValue = getValueFromScriptHandler(constFormula);
                    eachRow[key].val = getValue;

                    // ! For VALUEOF
                    let rowObj = JSON.parse(JSON.stringify(eachRow));
                    dispatch(updateKeyValProcedures({ rowObj }));
                }
            }
        });
        setCellTexts([...cellTexts]);
        return;
    }

    // TODO: Handle Set Data
    const handleSetData = async (e) => {

        await getDataFromStore();

        // return console.log(cellTexts);

        const bodyData = {
            fromId: fromId,
            unique_id: item.unique_id,
            rows: rows,
            columns: columns,
            header_types: headerTypes,
            header_texts: headerTexts,
            second_row_headers: secondRowHeaders,
            cell_texts: cellTexts,
            table_type: 'vertical',
            result_table_id: item.result_table_id
        }

        setIsSet(true);
        setArraydata(bodyData);
    }

    return (
        <>
            <div className='table-responsive' ref={divTwoRef}>

                {/* <h4>{`From-${fromId + 1}`}</h4> */}

                <table className='tableStyle'>
                    <tbody>
                        {renderRows()}
                    </tbody>
                </table>

                {/* Print On Certifcate Area */}
                <div className='print_on_certifcate_area' style={{ right: '1%' }}>
                    <label htmlFor="printOnCertifcateId" className="form-label">Print On Certifcate:</label>
                    <select id='printOnCertifcateId' value={printOnCertificate} disabled={true}>
                        <option value="YES">YES</option>
                        <option value="NO">NO</option>
                    </select>
                </div>
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
        </>
    )
}

export default ExistResultTable