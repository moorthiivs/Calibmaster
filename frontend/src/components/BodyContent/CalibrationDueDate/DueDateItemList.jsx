import React, { useContext, useEffect, useState } from "react";
import { Modal, Table, Tag, Typography, Space } from "antd";
import { CalendarOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";

const { Text, Title } = Typography;

const DueDateItemList = ({ month, date: day, year, isopen, onclose }) => {
  const [isLoaded, setisLoaded] = useState(true);
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const [items, setItems] = useState([]);

  // Use the local mapping to get index from month name
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = monthNames.indexOf(month);

  const formattedDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const fetchDueDatCalibrationItem = async () => {
    try {
      setisLoaded(false);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId, date: formattedDate })
      };

      let response = await fetch(config.Calibmaster.URL + `/api/due-date/calibration-due-date-items`, requestOptions);
      const data = await response.json();
      
      if (data && data.items) {
        const indexedItems = data.items.map((item, index) => ({
          ...item,
          key: item.instrument_id || index,
          sno: index + 1,
          formatted_due_date: convertDateFormat(item.calibration_due_date),
          formatted_last_date: convertDateFormat(item.last_calibration_date)
        }));
        setItems(indexedItems);
      }
    } catch (error) {
      dispatch(notificationActions.changenotification({
        title: "Items Detail not Found",
        icon: "error",
        state: true,
        timeout: 5000,
      }));
    } finally {
      setisLoaded(true);
    }
  }

  useEffect(() => {
    if (isopen) {
      fetchDueDatCalibrationItem();
    }
  }, [formattedDate, isopen]);

  const columns = [
    {
      title: "S.No",
      dataIndex: "sno",
      key: "sno",
      width: 70,
      align: "center",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Make / Model",
      key: "make_model",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text size="small">{record.make}</Text>
          <Text type="secondary" size="small">{record.model}</Text>
        </Space>
      ),
    },
    {
      title: "Serial No",
      dataIndex: "serial_no",
      key: "serial_no",
    },
    {
      title: "Due Date",
      dataIndex: "formatted_due_date",
      key: "formatted_due_date",
      render: (date) => <Tag color="orange" icon={<CalendarOutlined />}>{date}</Tag>,
    },
    {
      title: "Last Cal",
      dataIndex: "formatted_last_date",
      key: "formatted_last_date",
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined className="text-blue-500" />
          <span>Calibration Due Items - {day} {month} {year}</span>
        </Space>
      }
      open={isopen}
      onCancel={() => onclose(null, null, null)}
      footer={null}
      width={1000}
      className="modern-modal"
      centered
    >
      <div className="py-2">
        {!isLoaded ? (
          <div className="h-64 flex items-center justify-center">
            <Loader />
          </div>
        ) : (
          <Table
            dataSource={items}
            columns={columns}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            size="middle"
            scroll={{ x: 800 }}
            bordered
            className="modern-ant-table"
          />
        )}
      </div>
    </Modal>
  );
};

export default DueDateItemList;
