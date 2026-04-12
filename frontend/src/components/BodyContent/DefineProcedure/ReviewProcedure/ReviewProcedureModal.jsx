import React, { useContext, useEffect, useState } from 'react';
import { Modal, Button, ButtonIcon } from 'react-rainbow-components';
import { useDispatch } from 'react-redux';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.js";
import ReviewProcedureTable from './ReviewProcedureTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import Loader from '../../../UI/Loader';

const ReviewProcedureModal = ({ isOpen, onRequestClose, masterId }) => {

    // ***  State Management Hooks *** 
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    // State to manage tables
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);

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
                    eachComponent: <ReviewProcedureTable
                        key={item.fromId}
                        fromId={item.fromId}
                        unique_id={item.unique_id}
                        table_type="vertical"
                        masterTableInfo={masterTable}
                        eachItem={item}
                        eachBodyArray={eachBodyArray}
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

    useEffect(() => {
        fetchDefinedProcedures();
    }, []);
    if (loading)
        return <Loader />;

    return (
        <Modal
            isOpen={isOpen}
            hideCloseButton
            title="Review Procedure" style={{ width: '90%' }}
            footer={
                <div style={{ textAlign: 'center' }}>
                    <Button label="Close" variant="brand" onClick={onRequestClose} />
                </div>
            }
        >
            {/* Close Button*/}
            <ButtonIcon variant="base" size="large" className="close-modal" icon={<FontAwesomeIcon icon={faClose} />} onClick={onRequestClose} />
            {/* Render all tables */}
            {tables.map((table, index) => (
                <div key={index} className="each_card alpha">
                    {table.eachComponent}
                </div>
            ))}
        </Modal>
    )
}

export default ReviewProcedureModal
