import { Pie } from "@ant-design/plots";
import { Card } from "antd";

const TrendPieChart = ({ title, data }) => {
    // Ensure all values are numbers
    const formattedData = data && data.map((d) => ({
        ...d,
        value: Number(d.value),
    }));

    const config = {
        appendPadding: 10,
        data: formattedData,
        angleField: "value",
        colorField: "customerName",
        radius: 1,
        innerRadius: 0.6,
        label: {
            text: 'value',
            style: {
                textAlign: 'center',
                fontSize: 14,
            },
        },
        interactions: [
            { type: "element-selected" },
            { type: "element-active" },
        ],
        legend: {
            position: "top",
        },
        pieStyle: {
            stroke: "#fff",
            lineWidth: 1,
        }
    };

    return (
        <Card title={title} style={{ width: "100%", maxWidth: 500, margin: 20 }}>
            <Pie {...config} />
        </Card>
    );
};

export default TrendPieChart;
