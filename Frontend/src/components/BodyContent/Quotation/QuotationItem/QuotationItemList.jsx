import React from 'react';
import { Table, Button, Card, Typography, Tooltip, Tag } from 'antd';
import { DeleteOutlined, InfoCircleOutlined, DollarOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const QuotationItemList = ({ items, deleteItemHandler }) => {
  const columns = [
    {
      title: 'S.No',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      align: 'center',
      render: (text) => <Text className="font-medium text-slate-500">{text}</Text>,
    },
    {
      title: 'Description of Item',
      dataIndex: 'itemDescription',
      key: 'itemDescription',
      render: (text) => (
        <div className="flex items-center gap-2">
          <AppstoreOutlined className="text-rose-500" />
          <Text strong className="text-slate-700">{text}</Text>
        </div>
      ),
    },
    {
      title: 'Range/Model',
      dataIndex: 'range_model',
      key: 'range_model',
      render: (text) => <Tag color="blue" className="rounded-md font-medium px-2 italic">{text}</Tag>,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text) => (
        <div className="flex items-center gap-1">
          <InfoCircleOutlined className="text-amber-500 text-xs" />
          <Text type="secondary" className="text-xs">{text || "No remarks"}</Text>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      align: 'center',
      render: (text) => <Tag color="purple" className="font-mono font-bold rounded-full min-w-[24px] text-center">{text}</Tag>,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (text) => (
        <div className="flex items-center justify-end gap-1">
          <DollarOutlined className="text-emerald-500 text-xs" />
          <Text strong className="text-slate-800 font-mono">₹{parseFloat(text).toLocaleString('en-IN')}</Text>
        </div>
      ),
    },
    {
      title: 'Delete',
      key: 'action',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <Tooltip title="Remove Item">
          <Button
            type="primary"
            danger
            shape="circle"
            icon={<DeleteOutlined />}
            onClick={() => deleteItemHandler(record.id)}
            className="flex items-center justify-center mx-auto hover:scale-110 transition-transform shadow-md"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Card 
      className=" border-none rounded-2xl overflow-hidden mt-6"
      title={
        <div className="flex items-center gap-2 py-1">
          <div className="bg-rose-500 p-2 rounded-lg text-white">
            <AppstoreOutlined className="text-lg" />
          </div>
          <div>
            <Title level={5} className="!m-0 text-slate-800">Quoted Items Summary</Title>
            <Text type="secondary" className="text-[10px] uppercase tracking-wider font-bold">List of instruments for calibration</Text>
          </div>
        </div>
      }
    >
      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          className: "px-4 mt-4",
        }}
        className="quotation-items-table"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <div className="py-8 text-slate-400">No items added to quotation yet.</div> }}
      />

      <style jsx>{`
        .quotation-items-table :global(.ant-table-thead > tr > th) {
          background: #fff1f2 !important;
          color: #be123c !important;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
        }
        .quotation-items-table :global(.ant-table-row:hover) {
          background-color: #f8fafc !important;
        }
      `}</style>
    </Card>
  );
};

export default QuotationItemList;