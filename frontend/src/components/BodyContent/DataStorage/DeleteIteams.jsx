import { useEffect, useState } from "react";
import { Button, Table, Space, Tag, Typography, Popconfirm, Tooltip, Flex } from "antd";
import { UndoOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

const DeleteItems = ({ items, onRestore, onDelete, onBack, categoryTitle, categoryKey, handleBulkRestore, handleBulkDelete }) => {


  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);


  const columns = {
    srfItems: [
      { title: "Sr.No", key: "index", render: (_, __, index) => index + 1, width: 90, },
      {
        title: 'Lab Name',
        dataIndex: 'lab_name',
        key: 'lab_name',
        sorter: (a, b) => (a.lab_name || '').localeCompare(b.lab_name || ''),
        filterSearch: true,
        filters: Array.from(
          new Set(items.map(item => item.lab_name))
        ).map(val => ({ text: val, value: val })),
        onFilter: (value, record) => (record.lab_name || '').toString().includes(value),
        ellipsis: {
          showTitle: false,
        },
        render: lab_name => (
          <Tooltip placement="topLeft" title={lab_name}>
            {lab_name}
          </Tooltip>
        ),
      },
      {
        title: "Item Name", dataIndex: "instrument_name", key: "instrument_name",
        ellipsis: {
          showTitle: false,
        },
        render: instrument_name => (
          <Tooltip placement="topLeft" title={instrument_name}>
            {instrument_name}
          </Tooltip>
        ),
      },
      {
        title: "SRF No",
        dataIndex: "srf_number",
        key: "srf_number",
        render: (id) => <Tag color="blue" >{id}</Tag>,
        width: 90,
      },
      {
        title: "Customer Name", dataIndex: "customer_name", key: "customer_name",
        ellipsis: {
          showTitle: false,
        },
        render: customer_name => (
          <Tooltip placement="topLeft" title={customer_name}>
            {customer_name}
          </Tooltip>
        ),
      },
      {
        title: "Deleted By", dataIndex: "deletedBy", key: "deletedBy",
        ellipsis: {
          showTitle: false,
        },
        render: deletedBy => (
          <Tooltip placement="topLeft" title={deletedBy}>
            <Tag color="error">
              {deletedBy}
            </Tag>
          </Tooltip>
        ),
      },
      {
        title: "Deleted On",
        dataIndex: "deletedDate",
        key: "deletedDate",
        render: (date) => (date ? new Date(date).toLocaleString() : "-"),
        width: 180,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <Popconfirm
              title="Are you sure you want to restore this item?"
              onConfirm={() => onRestore(record.srf_item_id, record.lab_id, "SRFItem")}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<UndoOutlined />}>Restore</Button>
            </Popconfirm>

            <Popconfirm
              title="This will permanently delete the item. Continue?"
              onConfirm={() => onDelete(record.srf_item_id, record.lab_id, "SRFItem")}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button icon={<DeleteOutlined />} danger>
                Delete
              </Button>
            </Popconfirm>
          </Space >
        ),
      },
    ],

    srf: [
      { title: "Sr. No", key: "index", render: (_, __, index) => index + 1, width: 90, },
      {
        title: 'Lab Name',
        dataIndex: 'lab_name',
        key: 'lab_name',
        sorter: (a, b) => (a.lab_name || '').localeCompare(b.lab_name || ''),
        filterSearch: true,
        filters: Array.from(
          new Set(items.map(item => item.lab_name))
        ).map(val => ({ text: val, value: val })),
        onFilter: (value, record) => (record.lab_name || '').toString().includes(value),
        ellipsis: {
          showTitle: false,
        },
        render: lab_name => (
          <Tooltip placement="topLeft" title={lab_name}>
            {lab_name}
          </Tooltip>
        ),
      },
      { title: "SRF No", dataIndex: "srf_number", key: "srf_number", width: 90, },
      {
        title: "Customer", dataIndex: "customer_name", key: "customer_name",
        ellipsis: {
          showTitle: false,
        },
        render: customer_name => (
          <Tooltip placement="topLeft" title={customer_name}>
            {customer_name}
          </Tooltip>
        ),

      },
      {
        title: "Deleted By", dataIndex: "deletedBy", key: "deletedBy", ellipsis: {
          showTitle: false,
        },
        render: deletedBy => (
          <Tooltip placement="topLeft" title={deletedBy}>
            <Tag color="error">
              {deletedBy}
            </Tag>
          </Tooltip>
        ),
      },
      {
        title: "Deleted On",
        dataIndex: "deletedDate",
        key: "deletedDate",
        render: (date) => (date ? new Date(date).toLocaleString() : "-"),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <Popconfirm
              title="Are you sure you want to restore this SRF?"
              onConfirm={() => onRestore(record.srf_id, record.lab_id, "SRF")}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<UndoOutlined />}>Restore</Button>
            </Popconfirm>

            <Popconfirm
              title="This will permanently delete the SRF. Continue?"
              onConfirm={() => onDelete(record.srf_id, record.lab_id, "SRF")}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button icon={<DeleteOutlined />} danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const expandedRowRender = (parent) => (


    <Table
      columns={columns.srfItems}
      dataSource={parent.items || []}
      pagination={false}
      rowKey="srf_item_id"
      scroll={{ x: 'max-content', y: 50 * 8 }}
    />
  );

  const handleExpand = (expanded, record) => {
    setExpandedRowKeys(expanded ? [record.srf_id] : []);
  };

  const rowSelection = {
    selectedRowKeys: selectedRowKeys.map(r => r.id),
    onChange: (_, rows) => {
      const selected = rows.map(row => ({
        id: categoryKey === "srf" ? row.srf_id : row.srf_item_id,
        lab_id: row.lab_id
      }));
      setSelectedRowKeys(selected);
    },
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  };




  return (
    <div>

      <Flex gap="middle">

        <div style={{ display: "flex", justifyContent: "flex-start", gap: "30px", width: "90vw" }}>
          <div style={{ marginTop: "25px" }}>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 24 }}>
              Back
            </Button>
          </div>

          <div>
            <Title level={3}>Managing {categoryTitle}</Title>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "30px", width: "90vw", marginTop: "10px" }}>
          <div>
            <Button
              type="primary"
              onClick={() => handleBulkRestore(selectedRowKeys)}
              disabled={!selectedRowKeys.length}
              style={{ marginTop: 16 }}
            >
              Restore Selected
            </Button>
          </div>

          <div>
            <Button
              type="primary"
              danger
              onClick={() => handleBulkDelete(selectedRowKeys)}
              disabled={!selectedRowKeys.length}
              style={{ marginTop: 16 }}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </Flex>


      <Table
        dataSource={items}
        columns={columns[categoryKey] || []}
        bordered
        scroll={{ x: 'max-content', y: 50 * 8 }}
        rowKey={categoryKey === "srf" ? "srf_id" : "srf_item_id"}
        rowSelection={rowSelection}
        {...(categoryKey === "srf"
          ? {
            expandable: {
              expandedRowRender,
              expandedRowKeys,
              onExpand: handleExpand,
            },
          }
          : {})}
      />



    </div>
  );
};

export default DeleteItems;
