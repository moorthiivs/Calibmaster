import React, { useContext, useState } from 'react';
import { Card, Form, Input, Button, Typography, Divider, Space } from 'antd';
import { LockOutlined, SafetyCertificateOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { AuthContext } from '../../../context/auth-context';
import GlobalNotification from "../../../utils/GlobalNotification";
import config from "../../../utils/config.json";
import Loader from '../../UI/Loader';

const { Title, Text } = Typography;

const PasswordReset = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const auth = useContext(AuthContext);

    const onFinish = async (values) => {
        const { currentPassword, password, confirmPassword } = values;

        if (password !== confirmPassword) {
            GlobalNotification.error({
                title: "Validation Error",
                description: "New password and confirm password must match.",
            });
            return;
        }

        if (currentPassword === password) {
            GlobalNotification.error({
                title: "Validation Error",
                description: "New password must be different from current password.",
            });
            return;
        }

        setLoading(true);
        try {
            const bodyData = {
                password,
                currentPassword,
                email: auth.email,
                labId: auth.labId
            };

            const response = await fetch(`${config.Calibmaster.URL}/api/users/admin-reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify(bodyData),
            });

            const data = await response.json();

            if (response.status !== 200) {
                setLoading(false);
                GlobalNotification.error({
                    title: "Reset Failed",
                    description: data.message || "Could not reset password.",
                });
                return;
            }

            form.resetFields();
            GlobalNotification.success({
                title: "Success",
                description: "Password updated successfully",
            });
        } catch (error) {
            console.error(error);
            GlobalNotification.error({
                title: "System Error",
                description: "Something went wrong while resetting the password.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <Card 
                className="w-full shadow-lg border-none rounded-3xl overflow-hidden"
                title={
                    <div className="flex items-center gap-3 py-4">
                        <div className="bg-indigo-500 p-3 rounded-2xl text-white shadow-md shadow-indigo-100">
                            <LockOutlined className="text-2xl" />
                        </div>
                        <div>
                            <Title level={4} className="!m-0 text-slate-800">Security</Title>
                            <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">Update Your Password</Text>
                        </div>
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark="optional"
                    className="mt-2"
                >
                    <Form.Item
                        label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Current Password</span>}
                        name="currentPassword"
                        rules={[{ required: true, message: 'Please enter your current password' }]}
                    >
                        <Input.Password 
                            prefix={<KeyOutlined className="text-indigo-500" />} 
                            placeholder="Type current password" 
                            className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 text-base"
                        />
                    </Form.Item>

                    <Divider className="!my-6">
                        <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Set New Password</Text>
                    </Divider>

                    <Form.Item
                        label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">New Password</span>}
                        name="password"
                        rules={[
                            { required: true, message: 'Please enter a new password' },
                            { min: 8, message: 'Password must be at least 8 characters' }
                        ]}
                    >
                        <Input.Password 
                            prefix={<SafetyCertificateOutlined className="text-indigo-500" />} 
                            placeholder="Minimum 8 characters" 
                            className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 text-base"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Confirm New Password</span>}
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Please confirm your password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password 
                            prefix={<CheckCircleOutlined className="text-indigo-500" />} 
                            placeholder="Re-type new password" 
                            className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 text-base"
                        />
                    </Form.Item>

                    <Form.Item className="mt-10 mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            icon={<LockOutlined />}
                            className="w-full h-12 rounded-xl !bg-indigo-600 hover:!bg-indigo-700 border-none text-base font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transform hover:scale-[1.02] transition-all"
                        >
                            Update Password
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {loading && <Loader />}
            
            <style jsx>{`
                :global(.ant-card-head) {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 0 24px !important;
                }
                :global(.ant-form-item-label) {
                    padding-bottom: 8px !important;
                }
            `}</style>
        </div>
    );
};

export default PasswordReset;
