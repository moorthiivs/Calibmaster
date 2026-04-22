import React, { useState, useEffect, useContext, useMemo } from "react";
import { Calendar, Badge, Card, Typography, Space, Tooltip, Empty, Spin } from "antd";
import { AuthContext } from "../../../context/auth-context";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.json";
import DueDateItemList from "./DueDateItemList";
import YearDropdown from "./YearDropdown";
import { CalendarOutlined, InfoCircleOutlined, LayoutOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import './DueDateCount.css';

const { Title, Text } = Typography;

const DueDateChecker = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    
    const [loading, setLoading] = useState(false);
    const [itemsCountMap, setItemsCountMap] = useState({}); // date string -> count
    const [addItemModel, setAddItemModel] = useState(false);
    const [selectedDateDetails, setSelectedDateDetails] = useState({ month: "", day: "", count: 0 });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(dayjs());

    const fetchDueDateCount = async (year) => {
        setLoading(true);
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/due-date/get-calibration-due-date`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId, selectedYear: year })
            });

            const result = await response.json();
            
            if (result.items && result.items.length) {
                const map = {};
                result.items.forEach(({ due_date, due_date_count }) => {
                    const d = dayjs(due_date).format('YYYY-MM-DD');
                    map[d] = due_date_count || 0;
                });
                setItemsCountMap(map);
            } else {
                setItemsCountMap({});
            }
        } catch (error) {
            dispatch(notificationActions.changenotification({
                title: "Failed to fetch due dates",
                icon: "error",
                state: true,
                timeout: 5000,
            }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDueDateCount(selectedYear);
    }, [selectedYear]);

    const handleCellClick = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        const count = itemsCountMap[dateStr] || 0;
        
        if (count > 0) {
            setSelectedDateDetails({
                month: date.format('MMMM'),
                day: date.date(),
                count: count
            });
            setAddItemModel(true);
        }
    };

    const dateCellRender = (value) => {
        const dateStr = value.format('YYYY-MM-DD');
        const count = itemsCountMap[dateStr];
        
        if (!count) return null;

        // Color coding based on count density
        let color = "#52c41a"; // green
        if (count > 10) color = "#f5222d"; // red
        else if (count > 5) color = "#faad14"; // orange
        
        return (
            <Tooltip title={`${count} Items Due`}>
                <div className="flex flex-col items-center justify-center h-full">
                    <Badge 
                        count={count} 
                        overflowCount={999}
                        style={{ backgroundColor: color }}
                        className="scale-90"
                    />
                </div>
            </Tooltip>
        );
    };

    const onPanelChange = (value, mode) => {
        if (value.year() !== selectedYear) {
            setSelectedYear(value.year());
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="p-2 md:p-4 bg-gray-50 min-h-screen">
            <Card 
                className="shadow-xl rounded-2xl overflow-hidden border-none"
                title={
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-2 gap-4">
                        <Space align="center" size="middle">
                            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                                <CalendarOutlined className="text-white text-2xl" />
                            </div>
                            <div>
                                <Title level={3} style={{ margin: 0 }} className="text-gray-800">
                                    Calibration Schedule
                                </Title>
                                <Text type="secondary">Monitor and manage instrument calibration due dates</Text>
                            </div>
                        </Space>
                        
                        <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                            <span className="px-3 font-semibold text-gray-500 text-sm">YEAR</span>
                            <YearDropdown 
                                startYear={2000} 
                                endYear={2100} 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
                            />
                        </div>
                    </div>
                }
            >
                <div className="bg-white rounded-xl p-2 md:p-4">
                    <Spin spinning={loading} tip="Syncing Schedule...">
                        <Calendar 
                            fullscreen={true}
                            dateCellRender={dateCellRender}
                            onSelect={handleCellClick}
                            onPanelChange={onPanelChange}
                            headerRender={({ value, type, onChange, onTypeChange }) => {
                                const start = 0;
                                const end = 12;
                                const monthOptions = [];

                                for (let i = start; i < end; i++) {
                                    monthOptions.push(
                                        <div 
                                            key={i} 
                                            className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${value.month() === i ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50 text-gray-600'}`}
                                            onClick={() => {
                                                const now = value.clone().month(i);
                                                onChange(now);
                                            }}
                                        >
                                            {monthNames[i].substring(0, 3)}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex items-center justify-between p-4 mb-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex flex-wrap gap-1">
                                            {monthOptions}
                                        </div>
                                        <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Badge color="#52c41a" />
                                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Low Load</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge color="#faad14" />
                                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Medium Load</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge color="#f5222d" />
                                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">High Load</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </Spin>
                </div>
            </Card>

            {addItemModel && (
                <DueDateItemList 
                    isopen={addItemModel} 
                    onclose={() => setAddItemModel(false)}
                    month={selectedDateDetails.month} 
                    date={selectedDateDetails.day} 
                    count={selectedDateDetails.count} 
                    year={selectedYear} 
                />
            )}
            
            <style jsx global>{`
                .ant-picker-calendar-full .ant-picker-panel {
                    background: transparent;
                }
                .ant-picker-calendar-date-content {
                    height: 80px !important;
                }
                .ant-picker-calendar-date {
                    border-top: 2px solid #f0f0f0 !important;
                    margin: 0 !important;
                    padding: 8px !important;
                    transition: all 0.2s;
                }
                .ant-picker-calendar-date:hover {
                    background: #f0f7ff !important;
                    border-top-color: #1890ff !important;
                }
                .ant-picker-calendar-date-today {
                    background: #fffbe6 !important;
                    border-top-color: #ffe58f !important;
                }
                .ant-picker-calendar-header {
                    padding: 0 !important;
                }
            `}</style>
        </div>
    );
}

export default DueDateChecker;
