import React, { useState, useEffect, useContext } from "react";
import { Modal, Form, Input, InputNumber, Button, Typography, Space, Divider } from "antd";
import { ReconciliationOutlined, PercentageOutlined, NumberOutlined, ShopOutlined, CalendarOutlined, SafetyOutlined, SaveOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../../context/auth-context";
import config from "../../../../utils/config.json";
import GlobalNotification from "../../../../utils/GlobalNotification";
import Loader from "../../../UI/Loader";

const { Title, Text } = Typography;

const EditQuotationConfig = ({ isOpen, onRequestClose, data }) => {
    const [form] = Form.useForm();
    const [isLoaded, setIsLoaded] = useState(true);
    const auth = useContext(AuthContext);

    useEffect(() => {
        if (data) {
            form.setFieldsValue({
                panNumber: data.GST_number,
                labShortName: data.Lab_Short_Name,
                quotationShortName: data.Quotation_Short_Name,
                currentFinancialYear: data.Current_Financial_Year,
                runningQuotationNumber: data.Running_Quotation_Number,
                HSN_SAC: data.HSN_SAC,
                gstPercentage: data.GST_Percentage
            });
        }
    }, [data, form]);

    const onFinish = async (values) => {
        try {
            setIsLoaded(false);

            const body = {
                lab_id: auth.labId,
                quotationDetail: {
                    panNumber: values.panNumber,
                    labShortName: values.labShortName,
                    quotationShortName: values.quotationShortName,
                    currentFinancialYear: values.currentFinancialYear,
                    runningQuotationNumber: values.runningQuotationNumber,
                    HSN_SAC: values.HSN_SAC,
                    gstPercentage: values.gstPercentage
                }
            };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(body),
            };

            const response = await fetch(config.Calibmaster.URL + "/api/quotation/update-config-quotation", requestOptions);
            const result = await response.json();
            
            if (result?.success) {
                GlobalNotification.success({ title: result?.msg });
                setIsLoaded(true);
                onRequestClose();
            } else {
                GlobalNotification.error({
                    title: "Something went wrong !!!",
                    description: result.message,
                });
                setIsLoaded(true);
            }
        } catch (error) {
            console.error(error);
            GlobalNotification.error({ title: "Something went wrong !!!" });
            setIsLoaded(true);
        }
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onRequestClose}
            footer={null}
            width={700}
            className="premium-modal"
            title={
                <div className="flex items-center gap-3 py-2">
                    <div className="bg-rose-500 p-2 rounded-lg text-white">
                        <ReconciliationOutlined className="text-xl" />
                    </div>
                    <div>
                        <Title level={4} className="!m-0 text-slate-800">Update Quotation Configuration</Title>
                        <Text type="secondary" className="text-[10px] uppercase tracking-wider font-bold">System-wide parameters</Text>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <Divider orientation="left" className="col-span-full !m-0 !mb-4"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest italic">General Details</Text></Divider>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">PAN/GST Number</span>}
                        name="panNumber"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<SafetyOutlined className="text-slate-400" />} 
                            placeholder="GST/PAN Number" 
                            className="h-10 rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">GST Percentage (%)</span>}
                        name="gstPercentage"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <InputNumber 
                            prefix={<PercentageOutlined className="text-slate-400" />} 
                            className="w-full h-10 rounded-xl flex items-center"
                            min={0}
                            max={100}
                        />
                    </Form.Item>

                    <Divider orientation="left" className="col-span-full !m-0 !my-4"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest italic">Identity</Text></Divider>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">Lab Short Name</span>}
                        name="labShortName"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<ShopOutlined className="text-slate-400" />} 
                            className="h-10 rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">Quotation Short Name</span>}
                        name="quotationShortName"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<ReconciliationOutlined className="text-slate-400" />} 
                            className="h-10 rounded-xl"
                        />
                    </Form.Item>

                    <Divider orientation="left" className="col-span-full !m-0 !my-4"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest italic">Sequence</Text></Divider>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">Financial Year</span>}
                        name="currentFinancialYear"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<CalendarOutlined className="text-slate-400" />} 
                            className="h-10 rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">Running Number</span>}
                        name="runningQuotationNumber"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <InputNumber 
                            prefix={<NumberOutlined className="text-slate-400" />} 
                            className="w-full h-10 rounded-xl flex items-center font-mono"
                            min={0}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-slate-600 font-medium">HSN/SAC Code</span>}
                        name="HSN_SAC"
                        className="col-span-full"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input 
                            prefix={<SafetyOutlined className="text-slate-400" />} 
                            className="h-10 rounded-xl"
                        />
                    </Form.Item>
                </div>

                <Form.Item className="mt-8 mb-2">
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={!isLoaded}
                        icon={<SaveOutlined />}
                        className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 border-none text-base font-bold shadow-lg shadow-rose-100"
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
            `}</style>
        </Modal>
    );
};

export default EditQuotationConfig;