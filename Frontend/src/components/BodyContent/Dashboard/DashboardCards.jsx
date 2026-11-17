import { Row, Col, Card, Typography, Skeleton } from "antd";
import {
    FileSearchOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CalendarOutlined,
} from "@ant-design/icons";


const { Title, Text } = Typography;

// Reusable StatCard Component
const StatCard = ({ icon, color, bgColor, title, value, loading }) => {
    const cardStyle = {
        borderRadius: "16px",
        padding: "24px",
        background: bgColor,
        position: "relative",
        overflow: "hidden",
        minHeight: 140, // keep height stable when skeleton shows
    };

    const watermarkIconStyle = {
        position: "absolute",
        top: -10,
        right: -10,
        fontSize: 80,
        color: color,
        opacity: 0.15,
        transform: "rotate(-15deg)",
    };

    return (
        <Card style={cardStyle} variant="outlined">
            {loading ? (
                <Skeleton active paragraph={false} title={{ width: 100 }} />
            ) : (
                <>
                    <div style={watermarkIconStyle}>{icon}</div>
                    <Title level={2} style={{ margin: 0, color: color }}>
                        {value}
                    </Title>
                    <Text strong style={{ display: "block", marginTop: "4px" }}>
                        {title}
                    </Text>
                </>
            )}
        </Card>
    );
};

// Main Dashboard Component
const DashboardCards = ({ cardsData, loading }) => {
    const cardData = [
        {
            title: "Total Calibrations",
            value: cardsData?.totalCalibrations,
            icon: <FileSearchOutlined />,
            color: "#0050b3",
            bgColor: "#e6f7ff",
        },
        {
            title: "Pending Calibrations",
            value: cardsData?.pendingCalibrations,
            icon: <ClockCircleOutlined />,
            color: "#d48806",
            bgColor: "#fffbe6",
        },
        {
            title: "Certificates Generated",
            value: cardsData?.certificatesGenerated,
            icon: <CheckCircleOutlined />,
            color: "#237804",
            bgColor: "#f6ffed",
        },
        {
            title: "Upcoming Due",
            value: cardsData?.upcomingDue,
            icon: <CalendarOutlined />,
            color: "#c41d7f",
            bgColor: "#fff0f6",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
            {cardData.map((card, index) => (
                <div key={index} className="w-full">
                    <StatCard
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                        bgColor={card.bgColor}
                        loading={loading}
                    />
                </div>
            ))}
        </div>
    );
};

export default DashboardCards;
