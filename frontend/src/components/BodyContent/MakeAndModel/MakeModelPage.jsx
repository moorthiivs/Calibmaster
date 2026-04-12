import React, { useContext, useEffect, useState } from 'react';
import {
    Tabs, Table, Button, Modal, Form, Input, Space, Popconfirm, Tooltip, message,
    Select
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { AuthContext } from '../../../context/auth-context';
import config from '../../../utils/config.js'
import dayjs from 'dayjs';

const { TabPane } = Tabs;

const capitalizeFirst = (str = "") =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const MakeModelPage = () => {
    const auth = useContext(AuthContext);
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [instrumentCodes, setInstrumentCodes] = useState([]);
    const [form] = Form.useForm();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
    });
    const [searchText, setSearchText] = useState(""); // 🔹 new state
    const [instrumentList, setInstrumentList] = useState([])
    useEffect(() => {
        fetchData('make');
        fetchData('model');
        fetchData('instrumentcode');
        fetchInstrument()
    }, []);

    const fetchData = async (type) => {
        try {
            const res = await fetch(config.Calibmaster.URL + `/api/makemodel/${type}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });
            const data = await res.json();
            if (type === 'make') setMakes(data);
            else if (type === 'model') setModels(data);
            else setInstrumentCodes(data);
        } catch (err) {

            console.log(err);

            message.error(`Failed to load ${type}s`);
        }
    };
    const fetchInstrument = async () => {
        try {
            setLoading(true);
            const data = await fetch(config.Calibmaster.URL + "/api/instrument/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId }),
            });

            let response = await data.json();
            setInstrumentList(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };
    const showModal = (type, item = null) => {
        setEditingType(type);
        setEditingItem(item);
        form.resetFields();
        if (item) form.setFieldsValue(item);
        setModalVisible(true);
    };

    const handleOk = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            const type = editingType;

            // Build payload based on type
            let payload = { ...values };


            if (type === 'make' || type === 'model' || type === 'instrumentcode') {
                payload = {
                    ...payload,
                    labId: auth.labId,
                    createdBy: auth.userId,
                    updatedBy: auth.userId
                };
            }
            console.log(payload, "payload");
            const url = editingItem
                ? `${config.Calibmaster.URL}/api/makemodel/${type}s/${editingItem.id}`
                : `${config.Calibmaster.URL}/api/makemodel/${type}`;
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            message.success(`${capitalizeFirst(type)} ${editingItem ? 'updated' : 'added'}`);
            setModalVisible(false);
            setEditingItem(null);
            setEditingType(null);
            fetchData(type);
        } catch (err) {
            console.log(err);
            message.error(err.message || 'Something went wrong!');
        } finally {
            setLoading(false)
        }
    };

    const handleDelete = async (type, id, name) => {
        try {
            const res = await fetch(`${config.Calibmaster.URL}/api/makemodel/${type}s/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });

            if (!res.ok) throw new Error();



            message.success(
                `${capitalizeFirst(type)} ${capitalizeFirst(name)} Deleted Successfully`
            );
            fetchData(type);
        } catch (err) {
            message.error(`Failed to delete ${type}`);
        }
    };

    const renderTable = (type) => {
        const data = type === 'make' ? makes : type === 'model' ? models : instrumentCodes;

        const filteredData = data.filter(item => {
            const searchField = type === 'instrumentcode' ? item.instrument_name : item.name;
            return searchField?.toLowerCase().includes(searchText.toLowerCase());
        });

        const columns = [
            {
                title: "S.No",
                render: (_, __, index) =>
                    (pagination.current - 1) * pagination.pageSize + index + 1,
            },
            {
                title: type === 'instrumentcode' ? 'Instrument Name' : 'Name',
                dataIndex: type === 'instrumentcode' ? 'instrument_name' : 'name',
            },
        ];

        if (type === 'instrumentcode') {
            columns.push({
                title: 'Code',
                dataIndex: 'code',
            });
        }

        columns.push(
            {
                title: 'Created At',
                dataIndex: 'createdAt',
                render: (text) => dayjs(text).format('DD-MM-YYYY hh:mm A'),
            },
            {
                title: 'Actions',
                render: (_, record) => (
                    <Space>
                        <Button
                            onClick={() => showModal(type, record)}
                            icon={<EditOutlined />}
                        >
                            Edit
                        </Button>
                        <Popconfirm
                            title="Delete the item"
                            description="Are you sure to delete this item?"
                            onConfirm={() => handleDelete(type, record.id, type === 'instrumentcode' ? record.instrument_name : record.name)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger icon={<DeleteOutlined />}>Delete</Button>
                        </Popconfirm>
                    </Space>
                ),
            }
        );

        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Input
                        placeholder={`Search ${type} name`}
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                        allowClear
                        size="large"
                    />
                    <Tooltip title={`Add ${capitalizeFirst(type)}`}>
                        <Button
                            type="primary"
                            onClick={() => showModal(type)}
                            icon={<PlusCircleOutlined />}
                        >
                            Add {capitalizeFirst(type)}
                        </Button>
                    </Tooltip>
                </div>

                <Table
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="id"
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        onChange: (page, pageSize) =>
                            setPagination({ current: page, pageSize }),
                    }}
                />
            </>
        );
    };
    console.log(instrumentList, "instrumentList");

    return (
        <div style={{ padding: 24 }}>
            <Tabs defaultActiveKey="make">
                <TabPane tab="Make" key="make">
                    {renderTable('make')}
                </TabPane>
                <TabPane tab="Model" key="model">
                    {renderTable('model')}
                </TabPane>

                <TabPane tab="InstrumentCode" key="instrumentcode">
                    {renderTable('instrumentcode')}
                </TabPane>
            </Tabs>

            <Modal
                title={`${editingItem ? 'Edit' : 'Add'} ${editingType?.toUpperCase()}`}
                open={modalVisible}
                onOk={handleOk}
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical" >
                    {editingType === 'instrumentcode' ? (
                        <>
                            <Form.Item
                                name="instrument_name"
                                label="Instrument Name"
                                rules={[{ required: true, message: 'Please enter instrument name' }]}
                            >
                                <Select
                                    options={instrumentList.filter(item => item.lab_id === auth.labId).map(item => ({ value: item.instrument_name, label: item.instrument_name }))}
                                    showSearch
                                    filterOption={(input, option) =>
                                        option.label.toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>
                            <Form.Item
                                name="code"
                                label="Code"
                                rules={[{ required: true, message: 'Please enter code' }]}
                            >
                                <Input placeholder="Enter code" />
                            </Form.Item>
                        </>
                    ) : (
                        <Form.Item
                            name="name"
                            label="Name"
                            rules={[{ required: true, message: 'Please enter a name' }]}
                        >
                            <Input placeholder="Enter name" />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default MakeModelPage;
