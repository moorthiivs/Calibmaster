import React, { useEffect, useState } from 'react'
import { Button, Modal, Card, Input, Select } from 'react-rainbow-components';
import alphabet from '../procedureHelpers/alphabet';
import "./reviewTableStyle.css";
import config from "../../../../utils/config.json";

const ReviewProcedureTable = ({ fromId, eachItem, eachBodyArray, unique_id, tableImages }) => {

    const [isSet, setIsSet] = useState(false);
    const [rows, setRows] = useState(parseInt(eachItem?.rows)); // Initial rows
    const [columns, setColumns] = useState(parseInt(eachItem?.columns)); // Initial columns

    const [headerTexts, setHeaderTexts] = useState(eachItem?.header_texts); // Header input values
    const [secondRowHeaders, setSecondRowHeaders] = useState(eachItem?.second_row_headers); // Second row header input values
    const [headerTypes, setHeaderTypes] = useState(eachItem?.header_types); // Dropdown values

    const [tablePrefix, setTablePrefix] = useState('');

    const [cellTexts, setCellTexts] = useState(eachBodyArray); // Cell input values
    const [tableImage, setTableImage] = useState(tableImages);

    // *** Render Main Input Cells
    const renderRows = () => {
        return cellTexts.map((row, rowIndex) => {
            const eachRow = [];

            for (const key in row) {
                const eachObjectKey = key;
                const eachObjectColumnValue = row[key];

                let eachTd = <td key={eachObjectKey}>
                    <span>{eachObjectKey}</span> : <span>{eachObjectColumnValue}</span>
                </td>

                eachRow.push(eachTd);
            }

            return <tr key={`${rowIndex + 1}`}>
                {eachRow}
            </tr>
        });
    };

    return (
        <div className='table-responsive'>
            <div className='child_controller_btn_area' style={{ justifyContent: 'center' }}>{tableImage.map((image) => {
                return <img
                    src={`${config.Calibmaster.URL}/procedure_images/${image}`}
                    alt="table-image"
                    width={100}
                    height={80}
                />
            })}</div>
            <table className='review_table'>
                <tbody>
                    {renderRows()}
                </tbody>
            </table>
        </div>
    )
}

export default ReviewProcedureTable;