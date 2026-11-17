import React, { useState } from "react";
import { Button, Result, Typography, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
const { Text } = Typography;

const OfflinePage = () => {
    const [isChecking, setIsChecking] = useState(false);
    const navigate = useNavigate();
    const handleRetry = () => {
        setIsChecking(true);
        setTimeout(() => {
            if (navigator.onLine) {
                navigate("/dashboard", { replace: true });
            } else {
                setIsChecking(false);
            }
        }, 1200);
    };

    return (
        <Result
            title="You Are Offline"
            subTitle={
                <Space direction="vertical" size="small">
                    <Text type="secondary">Please check your internet connection.</Text>
                    <Text type="secondary">
                        Once reconnected, click “Retry” to continue using the app.
                    </Text>
                </Space>
            }
            status={403}
            extra={
                <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={isChecking}
                    onClick={handleRetry}
                >
                    Retry Connection
                </Button>
            }

        />
    );
};

export default OfflinePage;
