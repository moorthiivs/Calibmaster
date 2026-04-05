import React, { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import config from "../../../../utils/config.json";
import { notificationActions } from "../../../../store/nofitication";
import { AuthContext } from "../../../../context/auth-context";
import {
    Card,
    Form,
    Select,
    Checkbox,
    Button,
    Row,
    Col,
    Typography,
    Space,
    Divider,
    message,
    Skeleton
} from "antd";
import { InputNumber } from "antd";
const { Option } = Select;
const { Title, Paragraph, Text } = Typography;

const CreateCertificateConfig = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const [labs, setLabs] = useState([]);
    const [formDiv, setFormDiv] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            let response = await fetch(
                config.Calibmaster.URL + "/api/cms-setting/fetch-cms-certificate",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token
                    }
                }
            );

            response = await response.json();
            if (response?.result?.length > 0) {
                const { result, labList } = response;
                setFormDiv(result);

                let newArray = [{ value: "", label: "Select" }];
                labList.forEach((item, index) => {
                    newArray[index + 1] = {
                        value: item.lab_id,
                        label: item.lab_name
                    };
                });
                setLabs(newArray);
                message.success("CMS Certificate Settings fetched successfully.", 1.5);
                // dispatch(
                //     notificationActions.changenotification({
                //         title: "CMS Certificate Settings fetched successfully.",
                //         icon: "success",
                //         state: true,
                //         timeout: 1500
                //     })
                // );
            } else {
                message.error("Something went wrong", 1.5);
                // dispatch(
                //     notificationActions.changenotification({
                //         title: "Something went wrong",
                //         icon: "error",
                //         state: true,
                //         timeout: 1500
                //     })
                // );
            }
        } catch (error) {
            message.error("Something went wrong", 1.5);
            console.error(error);
            // dispatch(
            //     notificationActions.changenotification({
            //         title: "Something went wrong",
            //         icon: "error",
            //         state: true,
            //         timeout: 1500
            //     })
            // );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <div style={{ padding: 10, minHeight: "100vh" }}>
            <Title level={2} style={{ marginBottom: 8 }}>
                CMS Certificate Settings
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 32 }}>
                Configure and manage certificate settings for each lab. Changes will
                apply immediately after saving.
            </Paragraph>

            {loading ? (
                <Row gutter={[24, 24]}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Col xs={24} md={12} lg={8} key={i}>
                            <Card style={{ borderRadius: 12, boxShadow: "0 2px 6px #ddd" }}>
                                <Skeleton active paragraph={{ rows: 6 }} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Row gutter={[24, 24]}>
                    {formDiv.map((item, index) => (
                        <Col xs={24} md={12} lg={8} key={index}>
                            <EachForm
                                labs={labs}
                                configInfo={item}
                                auth={auth}
                                dispatch={dispatch}
                                notificationActions={notificationActions}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default CreateCertificateConfig;

const EachForm = ({ labs, configInfo, auth, dispatch, notificationActions }) => {
    const [labId, setLabId] = useState("");
    const [enable, setEnable] = useState(false);
    const [labError, setLabError] = useState("");
    const [days, setDays] = useState(0);

    const fetchCMSSettings = async () => {
        try {
            const data = await fetch(
                config.Calibmaster.URL + "/api/cms-permissions-setting/fetch",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth?.token
                    },
                    body: JSON.stringify({ lab_id: labId })
                }
            );

            let response = await data.json();
            const { result } = response;
            // result.forEach((item) => {
            //     if (item.is_enable && item.setting_name === configInfo.setting_name) {
            //         setEnable(true);
            //     }
            // });
            result.forEach((item) => {
                if (item.is_enable && item.setting_name === configInfo.setting_name) {
                    setEnable(item.is_enable);

                    if (configInfo.setting_name === "BLOCK_CALIBRATION_BEFORE_DUE") {
                        setDays(Number(item.setting_value) || 0);
                    }
                }
            });

        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        setEnable(false);
        if (labId) fetchCMSSettings();
    }, [labId]);

    const createConfigHandler = async () => {
        if (!labId) {
            setLabError("Please Select a Lab.");
            return;
        }

        try {
            const { setting_name, setting_lable, setting_description } = configInfo;
            // const bodyData = {
            //     lab_id: labId,
            //     setting_name,
            //     setting_lable,
            //     setting_description,
            //     setting_value: enable ? "YES" : "NO",
            //     is_enable: enable
            // };
            const bodyData = {
                lab_id: labId,
                setting_name,
                setting_lable,
                setting_description,
                setting_value:
                    setting_name === "BLOCK_CALIBRATION_BEFORE_DUE"
                        ? days
                        : enable ? "YES" : "NO",
                is_enable: enable
            };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token
                },
                body: JSON.stringify(bodyData)
            };

            await fetch(
                config.Calibmaster.URL + "/api/cms-permissions-setting/create",
                requestOptions
            );
            message.success("Configuration updated successfully", 1.5);
            // dispatch(
            //     notificationActions.changenotification({
            //         title: "Configuration updated successfully",
            //         icon: "success",
            //         state: true,
            //         timeout: 1500
            //     })
            // );
        } catch (err) {
            dispatch(
                notificationActions.changenotification({
                    title: "Something went wrong",
                    icon: "error",
                    state: true
                })
            );
        }
    };

    return (
        <Card
            bordered={false}
            style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                padding: "16px 0"
            }}
        >
            <div style={{ padding: "0 16px 16px" }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Title level={5} style={{ marginBottom: 0 }}>
                        {configInfo.setting_lable}
                    </Title>
                    {/* <Text type="secondary" style={{ fontSize: 13 }}>
                        {configInfo.setting_description}
                    </Text> */}
                </Space>
            </div>
            <Divider style={{ margin: "8px 0" }} />
            <Form layout="vertical" size="middle" style={{ padding: "0 16px" }}>
                <Form.Item
                    label="Select Lab"
                    validateStatus={labError ? "error" : ""}
                    help={labError || ""}
                >
                    <Select
                        value={labId}
                        placeholder="Select Lab"
                        onChange={(value) => {
                            setLabId(value);
                            setLabError("");
                        }}
                    >
                        {labs.map((lab) => (
                            <Option key={lab.value} value={lab.value}>
                                {lab.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item>
                    <Checkbox
                        checked={enable}
                        onChange={(e) => {
                            setEnable(e.target.checked);
                        }}
                    >
                        Enable Configuration
                    </Checkbox>
                </Form.Item>

                {configInfo.setting_name === "BLOCK_CALIBRATION_BEFORE_DUE" && enable && (
                    <Form.Item label="Number of Days Before Due Date">
                        <InputNumber
                            min={0}
                            value={days}
                            onChange={(value) => setDays(value)}
                            style={{ width: "100%" }}
                            placeholder="Enter number of days"
                        />
                    </Form.Item>
                )}

                <Form.Item>
                    <Button type="primary" onClick={createConfigHandler} block>
                        Save Changes
                    </Button>
                </Form.Item>



            </Form>
        </Card>
    );
};
