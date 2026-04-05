// import { Row, Col, Card, Typography, Space } from "antd";
// import {
//   FileSearchOutlined,
//   ClockCircleOutlined,
//   CheckCircleOutlined,
//   CalendarOutlined,
// } from "@ant-design/icons";

// const { Title, Text } = Typography;

// const StatCard = ({ icon, color, title, value }) => {
//   const cardStyle = {
//     borderRadius: "12px",
//     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
//     borderLeft: `5px solid ${color}`,
//     padding: "24px",
//     background: "#fff",
//   };

//   const iconStyle = {
//     fontSize: 28,
//     color: color,
//   };

//   return (
//     <Card style={cardStyle} bordered={false}>
//       <Space align="center" size={20}>
//         {icon && <div style={iconStyle}>{icon}</div>}
//         <div>
//           <Text type="secondary" style={{ marginBottom: 4, display: "block" }}>
//             {title}
//           </Text>
//           <Title level={2} style={{ margin: 0 }}>
//             {value}
//           </Title>
//         </div>
//       </Space>
//     </Card>
//   );
// };

// const DashboardCards = () => {
//   const cardData = [
//     {
//       title: "Total Calibrations",
//       value: "50",
//       icon: <FileSearchOutlined />,
//       color: "#1890ff",
//     },
//     {
//       title: "Pending Approvals",
//       value: "38",
//       icon: <ClockCircleOutlined />,
//       color: "#faad14",
//     },
//     {
//       title: "Certificates Issued",
//       value: "1,017",
//       icon: <CheckCircleOutlined />,
//       color: "#52c41a",
//     },
//     {
//       title: "Upcoming Due",
//       value: "62",
//       icon: <CalendarOutlined />,
//       color: "#eb2f96",
//     },
//   ];

//   return (
//     <Row gutter={[24, 24]}>
//       {cardData.map((card, index) => (
//         <Col xs={24} sm={12} md={6} key={index}>
//           <StatCard
//             title={card.title}
//             value={card.value}
//             icon={card.icon}
//             color={card.color}
//           />
//         </Col>
//       ))}
//     </Row>
//   );
// };

// export default DashboardCards;


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
        <Row gutter={[24, 24]}>
            {cardData.map((card, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                    <StatCard
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                        bgColor={card.bgColor}
                        loading={loading}
                    />
                </Col>
            ))}
        </Row>
    );
};

export default DashboardCards;
