import React, { useState, useEffect, useContext } from "react";
import { Card, Form, Input, InputNumber, Button, Typography, Space, Divider } from "antd";
import { ReconciliationOutlined, PercentageOutlined, NumberOutlined, ShopOutlined, CalendarOutlined, SafetyOutlined, SaveOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../../context/auth-context";
import config from "../../../../utils/config.json";
import { useNavigate } from "react-router-dom";
import GlobalNotification from "../../../../utils/GlobalNotification";
import Loader from "../../../UI/Loader";

const { Title, Text } = Typography;

const QuotationConfig = () => {
    const [form] = Form.useForm();
    const [isLoaded, setIsLoaded] = useState(true);
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchLabQuotationConfig = async () => {
        try {
            setIsLoaded(false);
            const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                }
            };

            const response = await fetch(config.Calibmaster.URL + `/api/quotation/fetch-lab-quotation-config/${auth.labId}`, requestOptions);
            const data = await response.json();
            
            if (data && data.LabQuotationConfig && data.LabQuotationConfig[0]) {
                const configData = data.LabQuotationConfig[0];
                form.setFieldsValue({
                    panNumber: configData.GST_number, // Note: backend seems to use GST_number for PAN or similar
                    labShortName: configData.Lab_Short_Name,
                    quotationShortName: configData.Quotation_Short_Name,
                    currentFinancialYear: configData.Current_Financial_Year,
                    runningQuotationNumber: configData.Running_Quotation_Number,
                    HSN_SAC: configData.HSN_SAC,
                    gstPercentage: configData.GST_Percentage
                });
                GlobalNotification.success({ title: "Quotation Detail fetched Successfully" });
            }
            setIsLoaded(true);
        } catch (error) {
            console.error(error);
            GlobalNotification.error({ title: "Quotation Detail not Found" });
            setIsLoaded(true);
        }
    };

    useEffect(() => {
        fetchLabQuotationConfig();
    }, []);

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

            const response = await fetch(config.Calibmaster.URL + "/api/quotation/config-quotation", requestOptions);
            const result = await response.json();
            
            if (result?.success) {
                GlobalNotification.success({ title: result?.msg });
                setIsLoaded(true);
                navigate("/dashboard/quotation-config");
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
        <div >
            <Card 
                className="shadow-lg border-none rounded-3xl overflow-hidden"
                title={
                    <div className="flex items-center gap-3 py-4 text-center justify-center">
                        <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg shadow-rose-200">
                            <ReconciliationOutlined className="text-2xl" />
                        </div>
                        <div>
                            <Title level={4} className="!m-0 text-slate-800">Quotation Configuration</Title>
                            <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">Setup global quotation parameters</Text>
                        </div>
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className="mt-2"
                    requiredMark="optional"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        <Divider orientation="left" className="col-span-full !m-0 !mb-4"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest text-rose-500">General Info</Text></Divider>
                        
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">PAN/GST Number</span>}
                            name="panNumber"
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Input 
                                prefix={<SafetyOutlined className="text-rose-500" />} 
                                placeholder="Enter 15-digit PAN/GST Number" 
                                className="h-11 rounded-xl text-base uppercase font-mono"
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">GST Percentage (%)</span>}
                            name="gstPercentage"
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber 
                                prefix={<PercentageOutlined className="text-rose-500" />} 
                                placeholder="e.g. 18" 
                                className="w-full h-11 rounded-xl flex items-center text-base"
                                min={0}
                                max={100}
                            />
                        </Form.Item>

                        <Divider orientation="left" className="col-span-full !m-0 !my-4"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest text-rose-500">Lab & Identity</Text></Divider>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Lab Short Name</span>}
                            name="labShortName"
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Input 
                                prefix={<ShopOutlined className="text-rose-500" />} 
                                placeholder="Short name for lab (e.g. SML)" 
                                className="h-11 rounded-xl text-base uppercase"
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Quotation Short Name</span>}
                            name="quotationShortName"
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Input 
                                prefix={<ReconciliationOutlined className="text-rose-500" />} 
                                placeholder="Prefix for quotations (e.g. QT)" 
                                className="h-11 rounded-xl text-base uppercase"
                                allowClear
                            />
                        </Form.Item>

                        <Divider orientation="left" className="col-span-full !m-0 !my-4"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest text-rose-500">Financial & Sequence</Text></Divider>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Current Financial Year</span>}
                            name="currentFinancialYear"
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Input 
                                prefix={<CalendarOutlined className="text-rose-500" />} 
                                placeholder="Format: YYYY-YY (e.g. 2024-25)" 
                                className="h-11 rounded-xl text-base"
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Running Quotation Number</span>}
                            name="runningQuotationNumber"
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber 
                                prefix={<NumberOutlined className="text-rose-500" />} 
                                placeholder="Starting number (e.g. 1)" 
                                className="w-full h-11 rounded-xl flex items-center font-mono text-base"
                                min={0}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">HSN/SAC Code</span>}
                            name="HSN_SAC"
                            className="col-span-full"
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Input 
                                prefix={<SafetyOutlined className="text-rose-500" />} 
                                placeholder="Enter HSN or SAC code for services" 
                                className="h-11 rounded-xl text-base"
                                allowClear
                            />
                        </Form.Item>
                    </div>

                    <Form.Item className="mt-8 mb-0 flex justify-center">
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            size="large"
                            className="w-full md:w-auto md:min-w-[300px] h-12 rounded-xl !bg-rose-500 hover:!bg-rose-600 border-none text-base font-bold shadow-md shadow-rose-100 flex items-center justify-center gap-2 transition-all"
                        >
                            Save Quotation Configuration
                        </Button>
                    </Form.Item>
                </Form>

                {!isLoaded && <Loader />}
            </Card>

            <style jsx>{`
                :global(.ant-form-item-label) {
                    padding-bottom: 4px !important;
                }
                :global(.ant-input-number-input-wrap) {
                    width: 100%;
                }
            `}</style>
        </div>
    );
};

export default QuotationConfig;
