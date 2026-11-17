import { useContext, useState } from "react";
import { Card, Form, Input, Button, Typography, Space } from "antd";
import { BankOutlined, NumberOutlined, EnvironmentOutlined, SafetyCertificateOutlined, SaveOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import { useNavigate } from "react-router-dom";
import Loader from "../../UI/Loader";

const { Title, Text } = Typography;

const AddBankConfig = () => {
    const [form] = Form.useForm();
    const [isLoading, setisLoading] = useState(false);
    const dispatch = useDispatch();
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            setisLoading(true);

            const bodyData = {
                bank_name: values.bankName,
                account_number: values.accountNumber,
                branch: values.bankBranch,
                ifsc_code: values.BankIFSCCode,
                lab_id: auth.labId
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
            const data = await response.json();
            const { msg } = data;

            dispatch(notificationActions.changenotification({
                title: msg,
                icon: "success",
                state: true,
                timeout: 1500,
            }));
            
            setisLoading(false);
            navigate("/dashboard/bank-config");
        } catch (error) {
            console.error(error);
            dispatch(notificationActions.changenotification({
                title: "Error while adding Bank Config!",
                icon: "error",
                state: true,
                timeout: 15000,
            }));
            setisLoading(false);
        }
    };

    return (
        <div >
            <Card 
                className="shadow-lg border-none rounded-3xl overflow-hidden"
                title={
                    <div className="flex items-center gap-3 py-4">
                        <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200">
                            <BankOutlined className="text-2xl" />
                        </div>
                        <div>
                            <Title level={4} className="!m-0 text-slate-800">Add Bank Configuration</Title>
                            <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">Financial Details Setup</Text>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Bank Name</span>}
                            name="bankName"
                            rules={[{ required: true, message: 'Please enter bank name' }]}
                        >
                            <Input 
                                prefix={<BankOutlined className="text-emerald-500" />} 
                                placeholder="Enter full bank name (e.g. State Bank of India)" 
                                className="h-12 rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 text-base"
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Account Number</span>}
                            name="accountNumber"
                            rules={[{ required: true, message: 'Please enter account number' }]}
                        >
                            <Input 
                                prefix={<NumberOutlined className="text-emerald-500" />} 
                                placeholder="Enter 10-18 digit account number" 
                                className="h-12 rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 text-base font-mono"
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Bank Branch</span>}
                            name="bankBranch"
                            rules={[{ required: true, message: 'Please enter branch name' }]}
                        >
                            <Input 
                                prefix={<EnvironmentOutlined className="text-emerald-500" />} 
                                placeholder="Enter branch location/city" 
                                className="h-12 rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 text-base"
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">IFSC Code</span>}
                            name="BankIFSCCode"
                            rules={[{ required: true, message: 'Please enter IFSC code' }]}
                        >
                            <Input 
                                prefix={<SafetyCertificateOutlined className="text-emerald-500" />} 
                                placeholder="Enter 11-character IFSC (e.g. SBIN0001234)" 
                                className="h-12 rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 text-base font-mono uppercase"
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
                            className="w-full md:w-auto md:min-w-[300px] h-12 rounded-xl !bg-emerald-500 hover:!bg-emerald-600 border-none text-base font-bold shadow-md shadow-emerald-100 flex items-center justify-center gap-2 transition-all"
                        >
                            Create or Update Configuration
                        </Button>
                    </Form.Item>
                </Form>

                {isLoading && <Loader />}
            </Card>

            <style jsx>{`
                :global(.ant-form-item-label > label) {
                    height: auto !important;
                }
                :global(.ant-input-prefix) {
                    margin-right: 8px;
                }
            `}</style>
        </div>
    );
};

export default AddBankConfig;
