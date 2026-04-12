import React, { useEffect, useState } from 'react';
import { Button, Modal, Card, Input, Select, Spinner } from 'react-rainbow-components';
import { useDispatch, useSelector } from 'react-redux';
import { updateKeyValProcedures } from '../../../../../store/procedureSlice';
import { parseFormula } from '../../../../helpers/formula_parser';
import { evaluate } from 'mathjs';
import "../Tables/tableInputCellStyle.css";
import config from "../../../../../utils/config.js";

const ExistResultTableWithoutFormula = ({ fromId, item, divTwoRef, calculateTrigger, setCalTrigger, setCalculated, key }) => {

    const [rows, setRows] = useState(""); // Initial rows
    const [columns, setColumns] = useState(""); // Initial columns
    const [headerTypes, setHeaderTypes] = useState([]); // Dropdown values
    const [headerTexts, setHeaderTexts] = useState([]); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState([]); // Second row header input values
    const [cellTexts, setCellTexts] = useState([]); // Cell input values
    const [printOnCertificate, setPrintOnCertificate] = useState('');
    const [tableImage, setTableImage] = useState([]);

    const dispatch = useDispatch();
    const selector = useSelector((state) => state.procedures);

    // ! For VALUEOF
    function assignValue() {
        const updatedCellTexts = cellTexts.map((objRow) => {
            const updatedObjRow = { ...objRow };
            for (const eachKey in updatedObjRow) {
                const { constFormula, val, f_script, is_Value_Of } = updatedObjRow[eachKey];
                if (is_Value_Of) {
                    const newValue = getValueForScriptCellFromStore(constFormula);
                    updatedObjRow[eachKey] = { ...updatedObjRow[eachKey], val: newValue };
                }
            }
            return updatedObjRow;
        });
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
                        return val || 0;
                    }
                }
            }
        }
    }

    // *** fetch From Design Handler ***
    const fetchFromDesign = async () => {
        try {

            const { rows, columns, header_types, header_texts, second_row_headers, cell_texts, print_on_certifcate, procedure_image_filename } = item;

            setRows(rows);
            setColumns(columns);
            setHeaderTypes(header_types);
            setHeaderTexts(header_texts);
            setSecondRowHeaders(second_row_headers);

            const modifiedBodyArray = cell_texts.map((eachRow, rowIndex) => {
                for (const key in eachRow) {

                    let eachObjectKey = key;
                    let eachObjectValue = eachRow[key];
                    let response = '';

                    if (typeof eachObjectValue === 'object') {
                        response = parseFormula(eachObjectKey, eachObjectValue?.constFormula);

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
            setCellTexts(modifiedBodyArray);
            setPrintOnCertificate(print_on_certifcate);
            setTableImage(procedure_image_filename);
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

    // TODO: Parse Formula -> Original Value
    function evaluateConstFormula(formula) {
        // Extract the keys from the formula
        const keys = formula.match(/T\d+[A-Z]\d+/g);
        // console.log(keys);
        if (!keys) return formula;

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
                        formula = formula.replace(key, (constval === '' ? key : constval));
                    }
                    replaced = true;
                    break;
                }
            }

            if (!replaced) {
                const reduxValue = getValueForScriptCellFromStore(key);
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
        try {
            setCalculated(false);
            setCalTrigger(false);

            let inputValue = e.target.value;
            let numericValue = (inputValue !== '') ? Number(inputValue) : '';
            if ((inputValue >= 1 || inputValue <= -1) && inputValue.toString().charAt(0) === '0') {
                document.getElementById(eachObjectKey).value = inputValue.toString().slice(1);
            }

            const newCellTexts = cellTexts.map((obj, index) => {
                if (index === rowIndex && obj.hasOwnProperty(eachObjectKey)) {
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

            const updatedCellTextsWithCalculations = newCellTexts.map((row, index) => {
                if (index === rowIndex) {
                    const updatedRow = { ...row };
                    for (const key in updatedRow) {
                        if (updatedRow[key].f_script) {
                            let formula = updatedRow[key].constFormula;
                            let result = evaluateConstFormula(formula, newCellTexts);

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

            const rowObj = JSON.parse(JSON.stringify(updatedCellTextsWithCalculations[rowIndex]));
            dispatch(updateKeyValProcedures({ rowObj }));
        }
        catch (err) {
            console.log(err)
        }
    };

    // *** Render Main Input Cells
    const renderRows = () => {
        const splitedTable = [];
        let inputCells = [];

        // Filtering 
        cellTexts?.forEach((row) => {
            for (const key in row) {
                const eachObjectKey = key;
                const eachObjectConstFormula = row[key]?.constFormula;

                const response = parseFormula(eachObjectKey, eachObjectConstFormula);
                if (response?.hasOwnProperty("INPUT")) {
                    inputCells.push(eachObjectKey.replace(/[0-9]+$/, ''));
                }
            }
        });
        // removed duplicates
        inputCells = [...new Set(inputCells)];

        inputCells.forEach((inputKey) => {
            let eachRow = [];
            cellTexts?.forEach((row, rowIndex) => {
                for (const key in row) {
                    if (key.startsWith(inputKey)) {
                        const eachObjectKey = key;
                        const eachObjectColumnValue = row[key]?.val;
                        const eachObjectConstFormula = row[key]?.constFormula;
                        const eachObjectCoumnisValueOf = row[key]?.is_Value_Of;

                        const response = parseFormula(eachObjectKey, eachObjectConstFormula);

                        let eachTd;
                        if (response?.hasOwnProperty("HEADER")) {
                            eachTd = <th key={eachObjectKey} style={{ backgroundColor: 'darkgrey' }}>{response.HEADER}</th>;
                        } else if (response?.hasOwnProperty("INPUT")) {
                            eachTd = (
                                <td key={eachObjectKey} style={{ background: '#ffffff' }}>
                                    <input
                                        type="number"
                                        id={eachObjectKey}
                                        className='inputCell inputTable'
                                        style={{ width: 'auto', textAlign: 'center' }}
                                        defaultValue=''
                                        value={eachObjectColumnValue}
                                        step={0.00001}
                                        onChange={(e) => handleCellChange(eachObjectKey, e, rowIndex)}
                                    />
                                </td>
                            );
                        }
                        let eachCell = <tr key={eachObjectKey}>{eachTd}</tr>;
                        eachRow.push(eachCell);
                    }
                }
            });

            splitedTable.push(<table className='tableStyle' style={{ marginBottom: '20px' }} key={inputKey}>
                <tbody>
                    {eachRow}
                </tbody>
            </table>)
        });

        return splitedTable;
    };

    useEffect(() => {
        if (calculateTrigger) {
            setCellTexts(selector[fromId]);
        }
    }, [calculateTrigger])

    return (
        <div key={key}>
            {renderRows()}
        </div>
    )
}

export default ExistResultTableWithoutFormula;
