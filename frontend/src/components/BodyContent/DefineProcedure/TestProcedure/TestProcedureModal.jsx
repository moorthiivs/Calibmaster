import React, { useContext, useEffect, useState } from 'react';
import { Button, ButtonIcon, Modal } from 'react-rainbow-components';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.json";
import TestProcedureTable from './TestProcedureTable';
import { parseFormula } from '../../../helpers/formula_parser';
import { addProcedures } from '../../../../store/procedureSlice';
import { evaluate } from 'mathjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faClose } from '@fortawesome/free-solid-svg-icons';
import Loader from '../../../UI/Loader';
import CalculateLoader from '../../../UI/CalculateLoader';

const TestProcedureModal = ({ isOpen, onRequestClose, masterId }) => {

    // ***  State Management Hooks *** 
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const selector = useSelector((state) => state?.procedures);
    let isTable = [];
    const functionReplacements = {
        'sqrt': 'Math.sqrt',
        // 'round': 'Math.round',
        'pow': 'Math.pow',
        'abs': 'Math.abs'
    };

    // State to manage tables
    const [tables, setTables] = useState([]);
    const [calTrigger, setCalTrigger] = useState(false);
    const [isCalculated, setCalculated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [calculationloading, setcalculationloading] = useState(false);

    // *** Fetch Defined Procedures ***
    const fetchDefinedProcedures = async () => {
        setLoading(true);

        try {

            const data = await fetch(config.Calibmaster.URL + "/api/design-procedures/view-defined-procedure", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({
                    master_design_procedure_id: masterId,
                    lab_id: auth.labId
                })
            });

            let response = await data.json();
            const { masterTable, tableDesign, uncertainty_master_parameter_query } = response;
            const createDynamicTable = tableDesign.map((item) => {
                const { cell_texts, procedure_image_filename } = item;
                const eachBodyArray = Object.values(cell_texts)[0];
                return {
                    eachComponent: <TestProcedureTable
                        key={item.fromId}
                        fromId={item.fromId}
                        unique_id={item.unique_id}
                        table_type="vertical"
                        masterTableInfo={masterTable}
                        eachItem={item}
                        eachBodyArray={eachBodyArray}
                        calculateTrigger={calTrigger}
                        setCalTrigger={setCalTrigger}
                        setCalculated={setCalculated}
                        tableImages={procedure_image_filename}
                    />,
                    unique_id: item.unique_id
                }
            })
            setTables(createDynamicTable);
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    }

    // *** Add Procedure Into Store ***
    async function addProcedureIntoStore() {
        setLoading(true);
        try {
            const procedureArray = [];

            const data = await fetch(config.Calibmaster.URL + "/api/design-procedures/view-defined-procedure", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({
                    master_design_procedure_id: masterId,
                    lab_id: auth.labId
                })
            });

            let response = await data.json();
            const { tableDesign } = response;

            tableDesign.map((item) => {
                const { cell_texts } = item;
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
                    return eachRow;
                });
                procedureArray.push(modifiedBodyArray)
            })
            isTable = procedureArray;
            dispatch(addProcedures(procedureArray))
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    }

    const handleGlobalCalculate = async () => {
        isTable = selector;
        if (!calTrigger) {
            setcalculationloading(true);
            let calculationStatus = true;
            let loopCount = isTable.length * isTable.length;
            if (isTable.length == 1) {
                loopCount = isTable[0].length;
                while (loopCount) {
                    loopCount -= 1;
                    calculationStatus = await getDataFromStore();
                }
            }
            else {
                while (calculationStatus && loopCount) {
                    loopCount -= 1;
                    calculationStatus = await getDataFromStore();
                }
            }
            dispatch(addProcedures(isTable));
            setcalculationloading(false);
            setCalTrigger(true);
            setCalculated(true);
        }
    };

    // TODO: Update Value of the cell object Handler
    function updateCellObjectKeyValue(keyName, value) {
        try {
            for (const subArray of isTable) {
                for (let obj of subArray) {
                    if (obj.hasOwnProperty(keyName)) {
                        obj[keyName].val = value;
                        break;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    function findKeyFromSelecotor(queryKey) {
        for (const subArray of isTable) {
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
            const regex = new RegExp(`${key}\\(([^)]*) \\)`, 'g');
            ifExpression = ifExpression.replace(regex, (match, p1) => `${value} (${p1})`);
        }
        return ifExpression;
    }

    function getValueFromScriptHandler(formula) {
        try {
            // evaluate normal expression e.g (2+3) = 5
            const normalExpression = /^[\d()+*/.-]+$/.test(formula);
            if (normalExpression) return { formula, value: evaluate(formula) };

            // evaluate IF Formulas 
            const hasTernary = formula.includes('?') && formula.includes(':');
            const hasStringMethods = formula.includes('.substring') || formula.includes('.slice');
            const isValidPattern = !/T\d+[A-Z]\d+/.test(formula);
            if ((hasTernary || hasStringMethods) && isValidPattern) {
                const round = (num, places) => Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
                let value;
                try {
                    value = new Function('round', 'return ' + evaluateExpression(formula))(round);
                } catch (error) {
                    value = '';
                }
                return { formula, value };
            }

            // checking formulas have like T1A1 if not have return 0
            const keys = formula.match(/T\d+[A-Z]\d+/g);
            if (!keys) return { formula, value: 0 };

            keys.forEach(key => {
                let replaced = false;
                for (const eachTable of isTable) {
                    for (const obj of eachTable) {
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
                }
                if (!replaced) {
                    const reduxValue = findKeyFromSelecotor(key);
                    if (reduxValue !== null) {
                        formula = formula.replace(key, reduxValue);
                    }
                }
            });
            // if cell is not have it return undefined to 0
            formula = formula.replace(/\bundefined\b/g, '0');

            // checking formulas have like T1A1 if have return empty
            const iskeys = formula.match(/T\d+[A-Z]\d+/g);
            if (iskeys) return { formula, value: '' };

            //evaluate IF Formulas
            if (formula.includes('?') && formula.includes(':')) {
                const round = (num, places) => Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
                let value;
                try {
                    value = new Function('round', 'return ' + evaluateExpression(formula))(round);
                } catch (error) {
                    console.log(error);
                    value = '';
                }
                return { formula, value };
            }
            return { formula, value: evaluate(formula) };

        } catch (error) {
            console.log(formula)
            return { formula, value: '' };
        }
    }

    async function getDataFromStore() {
        try {
            let isHaveChanges = false;
            let calculatedTable = await Promise.all(isTable.map(async (eachTable) => {
                return Promise.all(eachTable.map(async (eachRow) => {
                    // Create a new object to avoid mutation
                    const updatedRow = { ...eachRow };
                    for (const key in updatedRow) {
                        let { columnFormula, constFormula, val, f_script } = updatedRow[key];
                        if (f_script) {
                            // Await the result if getValueFromScriptHandler is async
                            let { formula, value } = getValueFromScriptHandler(constFormula);

                            if (typeof value == 'object') {
                                value = value.re || value.im;
                            }

                            updatedRow[key] = {
                                ...updatedRow[key],
                                columnFormula: formula,
                                val: (value === '' ? '' : ((Math.abs(value) < 1e-10 && (typeof value === 'number' && !isNaN(value) && isFinite(value))) ? 0 : value)),
                            };
                            if (value === '')
                                isHaveChanges = true;
                        }
                    }

                    return updatedRow;  // Return the updated row
                }));
            }));
            isTable = calculatedTable;
            return isHaveChanges; // Return the final processed data
        } catch (error) {
            console.error("Error processing data:", error);
        }
    }

    useEffect(() => {
        addProcedureIntoStore();
    }, [])

    useEffect(() => {
        isTable = selector;
    }, [selector])

    useEffect(() => {
        fetchDefinedProcedures();
    }, [calTrigger]);

    return (
        <Modal
            isOpen={isOpen}
            hideCloseButton
            title="Test Procedure"
            style={{ width: '80rem' }}
            footer={
                <Button
                    variant={isCalculated ? "success" : "brand"}
                    className="rainbow-m-around_medium"
                    onClick={handleGlobalCalculate}
                >
                    {isCalculated ? "Calculated" : "Calculate"}
                    {isCalculated && <FontAwesomeIcon icon={faCheck} className="rainbow-m-left_medium" style={{ paddingLeft: '5px' }} />}
                </Button>
            }
        >
            {/* Close Button*/}
            <ButtonIcon variant="base" size="large" className="close-modal" icon={<FontAwesomeIcon icon={faClose} />} onClick={onRequestClose} />
            {tables.map((table, index) => (
                <div key={index} className="each_card alpha table-responsive">
                    {table.eachComponent}
                </div>
            ))}

            {calculationloading && <CalculateLoader />}
            {(loading && !calculationloading) && <Loader />}
        </Modal>
    )
}

export default TestProcedureModal;