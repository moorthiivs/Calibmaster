

import { Modal, Tabs, Button } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { useState } from "react";
import "./styles.css";
import CreateParameters from "./CreateParameters";
const { TabPane } = Tabs;

export default function Tabmenu({ isOpen, onClose, setParametersData, ParametersData }) {
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
                                ParametersData={ParametersData}
                            />
                        ),
                    }
                ]}
            />
        </Modal>
    );
}