import React, { useContext, useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Typography, Space } from "antd";
import { BankOutlined, NumberOutlined, EnvironmentOutlined, SafetyCertificateOutlined, SaveOutlined } from "@ant-design/icons";
import { AuthContext } from '../../../context/auth-context';
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.json";
import { useDispatch } from 'react-redux';
import Loader from '../../UI/Loader';

const { Title, Text } = Typography;

const EditBankConfig = ({ isOpen, onRequestClose, data }) => {
    const [form] = Form.useForm();
    const [isLoading, setisLoading] = useState(false);
    const dispatch = useDispatch();
    const auth = useContext(AuthContext);

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                bankName: data.bank_name,
                accountNumber: data.account_number,
                bankBranch: data.branch,
                BankIFSCCode: data.ifsc_code,
            });
        }
    }, [data, form]);

    const onFinish = async (values) => {
        try {
            setisLoading(true);

            const bodyData = {
                bank_name: values.bankName,
                account_number: values.accountNumber,
                branch: values.bankBranch,
                ifsc_code: values.BankIFSCCode,
                lab_id: auth.labId,
                lab_bank_detail_id: data.lab_bank_detail_id // Assuming we need this for update
            };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/bank-config-routes/create-or-update", requestOptions);
            const result = await response.json();
            const { msg } = result;

            dispatch(notificationActions.changenotification({
                title: msg,
                icon: "success",
                state: true,
                timeout: 1500,
            }));
            
            setisLoading(false);
            onRequestClose();
        } catch (error) {
            console.error(error);
            dispatch(notificationActions.changenotification({
                title: "Error while updating Bank Config!",
                icon: "error",
                state: true,
                timeout: 15000,
            }));
            setisLoading(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onRequestClose}
            footer={null}
            width={600}
            className="premium-modal"
            title={
                <div className="flex items-center gap-3 py-2">
                    <div className="bg-emerald-500 p-2 rounded-lg text-white">
                        <BankOutlined className="text-xl" />
                    </div>
                    <div>
                        <Title level={4} className="!m-0 text-slate-800">Edit Bank Configuration</Title>
                        <Text type="secondary" className="text-[10px] uppercase tracking-wider font-bold">Update financial details</Text>
                    </div>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className="mt-6"
                requiredMark="optional"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <Form.Item
                        label={<span className="text-slate-600 font-medium">Bank Name</span>}
                        name="bankName"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<BankOutlined className="text-slate-400" />} 
                            placeholder="Bank Name" 
                            className="h-10 rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">Account Number</span>}
                        name="accountNumber"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<NumberOutlined className="text-slate-400" />} 
                            placeholder="Account Number" 
                            className="h-10 rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">Bank Branch</span>}
                        name="bankBranch"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<EnvironmentOutlined className="text-slate-400" />} 
                            placeholder="Branch" 
                            className="h-10 rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">IFSC Code</span>}
                        name="BankIFSCCode"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<SafetyCertificateOutlined className="text-slate-400" />} 
                            placeholder="IFSC Code" 
                            className="h-10 rounded-xl font-mono uppercase"
                        />
                    </Form.Item>
                </div>

                <Form.Item className="mt-8 mb-2">
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        icon={<SaveOutlined />}
                        className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 border-none text-base font-bold shadow-lg shadow-emerald-100"
                    >
                        Update Configuration
                    </Button>
                </Form.Item>
            </Form>

            <style jsx>{`
                :global(.ant-modal-content) {
                    border-radius: 24px !important;
                    padding: 24px !important;
                }
                :global(.ant-form-item-label > label) {
                    font-size: 13px !important;
                }
            `}</style>
        </Modal>
    );
};

export default EditBankConfig;