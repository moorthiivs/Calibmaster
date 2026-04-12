// import {
//     ButtonGroup, Button, Modal,
//     ButtonIcon
// } from 'react-rainbow-components';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faPlus, faPencilAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
// import "./styles.css";
// import CreateParameters from './CreateParameters';
// import { useState } from 'react';
// import EditParameters from './EditParameters';

// export default function Tabmenu({ isOpen, onClose, setParametersData }) {

//     const [activeTab, setActiveTab] = useState("add"); // 'add' or 'edit'

//     const handleClose = () => {
//         setActiveTab(null);
//         onClose();
//     };

//     return (
//         <Modal isOpen={isOpen} onRequestClose={() => { }} size="large" hideCloseButton={true} className="instrumenParameter-modal">

//             <div style={{ textAlign: 'right', marginBottom: '10px' }} onClick={onClose}>
//                 <ButtonIcon variant="border-filled" icon={<FontAwesomeIcon icon={faTimes} />} />
//             </div>

//             <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
//                 <ButtonGroup className="rainbow-m-around_medium">
//                     <Button variant={activeTab === "add" ? "brand" : "neutral"} onClick={() => setActiveTab("add")}>
//                         <FontAwesomeIcon icon={faPlus} className="rainbow-m-right_small" style={{ marginRight: "10px" }} />
//                         Add
//                     </Button>
//                     <Button variant={activeTab === "edit" ? "brand" : "neutral"} onClick={() => setActiveTab("edit")}>
//                         <FontAwesomeIcon icon={faPencilAlt} className="rainbow-m-right_small" style={{ marginRight: "10px" }} />
//                         Edit
//                     </Button>
//                 </ButtonGroup>
//             </div>


//             <div>
//                 {activeTab === "add" && <CreateParameters isOpen={isOpen} onClose={onClose} setParametersData={setParametersData} />}
//                 {activeTab === "edit" && <EditParameters setParametersData={setParametersData} />}
//             </div>
//         </Modal>
//     );
// }

import { Modal, Tabs, Button } from "antd";
import { PlusOutlined, EditOutlined, CloseOutlined } from "@ant-design/icons";
import { useState } from "react";
import "./styles.css";
import CreateParameters from "./CreateParameters";
import EditParameters from "./EditParameters";

const { TabPane } = Tabs;

export default function Tabmenu({ isOpen, onClose, setParametersData }) {
    const [activeKey, setActiveKey] = useState("add");

    const handleClose = () => {
        setActiveKey("add");
        onClose();
    };

    return (
        <Modal
            open={isOpen}
            onCancel={handleClose}
            footer={null}
            width={900}
            closable={false}
            className="instrumenParameter-modal"
        >
            {/* Close Button */}
            <div style={{ textAlign: "right"}}>
                <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={handleClose}
                />
            </div>

            <Tabs
                centered
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key)}
                size="large"
                items={[
                    {
                        key: "add",
                        label: (
                            <>
                                <PlusOutlined /> Add
                            </>
                        ),
                        children: (
                            <CreateParameters
                                isOpen={isOpen}
                                onClose={onClose}
                                setParametersData={setParametersData}
                            />
                        ),
                    },
                    {
                        key: "edit",
                        label: (
                            <>
                                <EditOutlined /> Edit
                            </>
                        ),
                        children: (
                            <EditParameters
                                setParametersData={setParametersData}
                            />
                        ),
                    },
                ]}
            />
        </Modal>
    );
}
