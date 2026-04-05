import React, { useEffect, useState } from 'react';
import { Button, Modal, Card, Input, Select } from 'react-rainbow-components';
import { parseFormula } from '../../../helpers/formula_parser';
import { evaluate } from 'mathjs';
import { useDispatch, useSelector } from 'react-redux';
import alphabet from '../procedureHelpers/alphabet';
import { updateKeyValProcedures } from '../../../../store/procedureSlice';
import config from "../../../../utils/config.json";

const TestProcedureTable = ({ fromId, eachItem, eachBodyArray, unique_id, calculateTrigger, setCalTrigger, setCalculated, tableImages }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(""); // Initial rows
    const [columns, setColumns] = useState(""); // Initial columns
    const [headerTypes, setHeaderTypes] = useState([]); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState([]); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState([]); // Second row header input values
    const [cellTexts, setCellTexts] = useState([]); // Cell input values
    const [tableImage, setTableImage] = useState(tableImages);
    const [conditionalFormats, setConditionalFormats] = useState({});


    const dispatch = useDispatch();
    const selector = useSelector((state) => state?.procedures);


    // ! For VALUEOF
    function assignValue() {
        // Create a new array with updated values
        const updatedCellTexts = cellTexts.map((objRow) => {
            // Create a new object for each row
            const updatedObjRow = { ...objRow };
            // Iterate over the keys of the row object
            for (const eachKey in updatedObjRow) {
                const { constFormula, val, f_script, is_Value_Of } = updatedObjRow[eachKey];
                if (is_Value_Of) {
                    // Compute the new value
                    const newValue = getValueForScriptCellFromStore(constFormula);
                    // Update the value immutably
                    updatedObjRow[eachKey] = { ...updatedObjRow[eachKey], val: newValue };
                }
            }
            return updatedObjRow;
        });
        // Update the state with the new array of objects
        setCellTexts(updatedCellTexts);
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
                        const { val, columnFormula } = objRow[EachKey];
                        let getDefaultValue = columnFormula.split(/[\(\)]/);
                        if (getDefaultValue.includes('DEFAULTVALUE')) return Number(getDefaultValue[1]);
                        return val;
                    }
                }
            }
        }
    }

    // *** fetch From Design Handler ***
    const fetchFromDesign = async () => {
        try {

            const { rows, columns, header_types, header_texts, second_row_headers, cell_texts, conditional_formats } = eachItem;

            setRows(rows);
            setColumns(columns);
            setHeaderTypes(header_types);
            setHeaderTexts(header_texts);
            setSecondRowHeaders(second_row_headers);

            const eachBodyArray = Object.values(cell_texts)[0];

            const modifiedBodyArray = eachBodyArray.map((eachRow, rowIndex) => {

                for (const key in eachRow) {

                    let eachObjectKey = key;
                    let eachObjectValue = eachRow[key];

                    let response = '';

                    if (typeof eachObjectValue === 'object') {
                        // * Do Something Else
                    } else {
                        response = parseFormula(eachObjectKey, eachObjectValue);

                        let columnFormula = eachObjectValue;
                        let constFormula = eachObjectValue;
                        let val = '';
                        let is_Script = false;
                        let is_Value_Of = false; // ! For VALUEOF

                        if (response?.hasOwnProperty("SCRIPT")) {
                            is_Script = true;
                            columnFormula = response.SCRIPT
                            constFormula = response.SCRIPT
                        }
                        if (response?.hasOwnProperty("DEFAULTVALUE")) {
                            val = Number(response?.DEFAULTVALUE || 0);
                        }
                        // ! For VALUEOF
                        if (response?.hasOwnProperty("VALUEOF")) {
                            is_Script = true;
                            is_Value_Of = true;
                            columnFormula = response.VALUEOF
                            constFormula = response.VALUEOF
                        }

                        eachRow[key] = {
                            columnFormula: columnFormula,
                            constFormula: constFormula,
                            val: val,
                            f_script: is_Script,
                            is_Value_Of: is_Value_Of // ! For VALUEOF
                        }
                    }
                }
                return eachRow
            });

            setCellTexts(modifiedBodyArray);
            setConditionalFormats(conditional_formats);

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
    function evaluateConstFormula(formula, newCellTexts) {
        // Extract the keys from the formula
        const keys = formula.match(/T\d+[A-Z]\d+/g);
        if (!keys) return formula;
        // Replace the keys with their corresponding constFormula from the data array
        keys.forEach(key => {
            let replaced = false;
            for (const obj of newCellTexts) {
                if (obj[key]) {
                    const constFormula = obj[key].constFormula;
                    const constval = obj[key].val;
                    // Only replace if the constFormula is a number or a valid expression
                    if (!isNaN(constFormula)) {
                        let numberValue = Number(constFormula);
                        // In this case the number should assign into val key
                        updateCellObjectKeyValue(key, numberValue);
                        formula = formula.replace(key, numberValue);
                    } else {
                        formula = formula.replace(key, (constval === '' ? key : constval));
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

    const functionReplacements = {
        'sqrt': 'Math.sqrt',
        // 'round': 'Math.round',
        'pow': 'Math.pow',
        'abs': 'Math.abs'
    };

    function evaluateExpression(ifExpression) {
        ifExpression = ifExpression
            .replace(/\(([^)]+)\)/g, (_, inside) =>
                `(${inside.replace(/([^\s\(\)=]+(?:\s+[^\s\(\)=]+)*)/g, match =>
                    /[^\d+\-*\/\s\(\)=]+/.test(match) && /==/.test(inside) && !/([<>!]=?|=>|=<|<=|>=|=)/.test(match) ? `"${match}"` : match)})`
            )
            .replace(/:(?!["'\d])([^:?\d][^\:\?\d]*?)(?=[):])/g, (match, inside) => inside.includes('==') ? `:${inside}` : `:"${inside}"`)
            .replace(/\?(?!["'\d])([^:?\d][^\:\?\d]*?)(?=[):])/g, (match, inside) => inside.includes('==') ? `?${inside}` : `?"${inside}"`);

        // Replace bitwise operators with Math.pow for exponentiation
        ifExpression = ifExpression
            .replace(/(\d+)\^(\d+)/g, 'pow($1, $2)');

        for (const [key, value] of Object.entries(functionReplacements)) {
            const regex = new RegExp(`${key}\\(([^)]*)\\)`, 'g');
            ifExpression = ifExpression.replace(regex, (match, p1) => `${value}(${p1})`);
        }
        return ifExpression;
    }

    // TODO: Handle Input Changes
    const handleCellChange = (eachObjectKey, e, rowIndex) => {
        setCalculated(false);
        setCalTrigger(false);

        let inputValue = e.target.value;
        let numericValue = (inputValue !== '') ? Number(inputValue) : '';

        // Create a new array to update the state immutably
        const newCellTexts = cellTexts.map((obj, index) => {
            if (index === rowIndex && obj.hasOwnProperty(eachObjectKey)) {
                // Return a new object with updated value
                return {
                    ...obj,
                    [eachObjectKey]: {
                        ...obj[eachObjectKey],
                        val: numericValue !== null ? numericValue : obj[eachObjectKey].val
                    }
                };
            }
            return obj;
        });

        // Apply the formula calculations
        const updatedCellTextsWithCalculations = newCellTexts.map((row, index) => {
            if (index === rowIndex) {
                const updatedRow = { ...row };
                for (const key in updatedRow) {
                    if (updatedRow[key].f_script) {
                        let formula = updatedRow[key].constFormula; // Getting the formula
                        let result = evaluateConstFormula(formula, newCellTexts); // Get formula with actual values

                        let evalResult;
                        //evaluate IF Formulas 
                        if (result.includes('?') && result.includes(':') && !result.match(/T\d+[A-Z]\d+/g)) {
                            const round = (num, places) => Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
                            try {
                                evalResult = new Function('round', 'return ' + evaluateExpression(result))(round);
                            } catch (error) {
                                evalResult = '';
                            }
                        }
                        else {
                            try {
                                evalResult = evaluate(result); // Execute the formula
                            } catch (err) {
                                evalResult = '';
                            }
                        }
                        updatedRow[key] = {
                            ...updatedRow[key],
                            val: (evalResult === '' ? '' : ((Math.abs(evalResult) < 1e-10 && (typeof evalResult === 'number' && !isNaN(evalResult) && isFinite(evalResult))) ? 0 : evalResult)),
                            columnFormula: result
                        };
                    }
                }
                return updatedRow;
            }
            return row;
        });

        setCellTexts(updatedCellTextsWithCalculations);

        // Dispatch the action with a deep copy of the updated row
        const rowObj = JSON.parse(JSON.stringify(updatedCellTextsWithCalculations[rowIndex]));
        dispatch(updateKeyValProcedures({ rowObj }));
    };

    const handleKeyDown = (e) => {
        if (
            e.key === 'ArrowUp' ||
            e.key === 'ArrowDown' ||
            e.key === 'PageUp' ||
            e.key === 'PageDown' ||
            e.key === 'Home' ||
            e.key === 'End'
        ) {
            e.preventDefault();
        }
    };

    // *** Render Main Input Cells
    const renderRows = () => {
        return cellTexts?.map((row, rowIndex) => {

            const eachRow = [];

            for (const key in row) {

                const eachObjectKey = key;
                const eachObjectColumnValue = row[key]?.val;
                const eachObjectConstFormula = row[key]?.constFormula;
                const eachObjectCoumnFormula = row[key]?.columnFormula;
                const eachObjectCoumnisValueOf = row[key]?.is_Value_Of; // ! For VALUEOF

                let response = parseFormula(eachObjectKey, eachObjectConstFormula);

                let conditional_className = '';
                if (conditionalFormats[eachObjectKey]) {
                    let v = isNaN(Number(eachObjectColumnValue)) ? 0 : Number(eachObjectColumnValue);
                    conditional_className = (conditionalFormats[eachObjectKey].higher_range >= v && conditionalFormats[eachObjectKey].lower_range <= v) ? "conditional_true" : "conditional_false";
                }

                let eachTd;
                if (response?.hasOwnProperty("HEADER")) {
                    eachTd = <td key={eachObjectKey} className={conditional_className}>{response.HEADER}</td>
                }
                else if (response?.hasOwnProperty("TEXT")) {
                    eachTd = <td key={eachObjectKey} className={conditional_className}>
                        <span>{response.TEXT} | TEXT</span> <br />
                        <span>Cell ID: {eachObjectKey}</span>
                    </td>
                }
                else if (response?.hasOwnProperty("INPUT")) {
                    eachTd = <td key={eachObjectKey} className={conditional_className}>
                        <input type="number" id={eachObjectKey} className='inputCell'
                            value={eachObjectColumnValue}
                            onChange={(e) => handleCellChange(eachObjectKey, e, rowIndex)}
                            onKeyDown={handleKeyDown}
                        />
                        <br />
                        <span>Cell ID: {eachObjectKey}</span>
                    </td>
                }
                else if (response?.hasOwnProperty("DEFAULTVALUE")) {
                    eachTd = <td key={eachObjectKey} className={conditional_className}>
                        <span>Value: {eachObjectColumnValue}</span> <br />
                        <span> Cell Id: {eachObjectKey}</span>
                    </td>
                }
                else if (response?.hasOwnProperty("BLANK")) {
                    eachTd = <td key={eachObjectKey} className={conditional_className}>
                        <span>BLANK</span>
                        <br />
                        <span>Cell ID: {eachObjectKey}</span>
                    </td>
                }
                // ! For VALUEOF
                else if (eachObjectCoumnisValueOf) {
                    eachTd = <td key={eachObjectKey} className={conditional_className}>
                        <span>VALUEOF: {eachObjectConstFormula}</span> <br />
                        <span>Value: {getValueForScriptCellFromStore(eachObjectConstFormula)}</span> <br />
                        <span> Cell Id: {eachObjectKey}</span>
                    </td>
                }
                else if (response?.hasOwnProperty("SCRIPT")) {
                    eachTd = <td key={eachObjectKey} className={conditional_className}>
                        <span>Formula: {eachObjectConstFormula}</span>
                        <br />
                        <span>Query: {eachObjectCoumnFormula}</span>
                        <br />
                        <span>Calculation: {eachObjectColumnValue.toString()}</span>
                        <br />
                        <span>Cell ID: {eachObjectKey}</span>
                    </td>
                } else {
                    eachTd = <td key={eachObjectKey} className={conditional_className}>
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
                        const { val, columnFormula } = objRow[key];
                        let getDefaultValue = columnFormula.split(/[\(\)]/);
                        if (getDefaultValue.includes('DEFAULTVALUE')) return Number(getDefaultValue[1]);
                        return val || 0;
                    }
                }
            }
        }
    }

    useEffect(() => {
        if (calculateTrigger) {
            setCellTexts(selector[fromId]);
        }
    }, [calculateTrigger])


    return (
        <>
            <div className='child_controller_btn_area' style={{ justifyContent: 'center' }}>{tableImage.map((image) => {
                return <img
                    src={`${config.Calibmaster.URL}/procedure_images/${image}`}
                    alt="table-image"
                    width={100}
                    height={80}
                />
            })}</div>
            <table className='tableStyle'>
                <tbody>
                    {renderRows()}
                </tbody>
            </table>
        </>
    )
}

export default TestProcedureTable;