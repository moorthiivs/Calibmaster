import React, { useContext, useEffect, useState } from 'react';
import { Table, Button, Modal, Card, Typography, Tooltip, Space } from 'antd';
import { EditOutlined, ReconciliationOutlined, CalendarOutlined, NumberOutlined } from '@ant-design/icons';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.json";
import { format } from 'date-fns';
import MasterListDocFormatEdit from './MasterListDocFormatEdit';

const { Title, Text } = Typography;

function MasterListDocFormatList() {
  const auth = useContext(AuthContext);
  const [docsDetails, setDocsDetails] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs-format/fetchAll?labid=${auth.labId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocsDetails(data);
    } catch (error) {
      console.error('Error fetching docs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [auth.labId, auth.token]);

  const handleEdit = (formatId) => {
    setSelectedDocId(formatId);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedDocId(null);
  };

  const columns = [
    {
      title: 'Sr No',
      key: 'srNo',
      width: 80,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Format Name',
      dataIndex: 'formatName',
      key: 'formatName',
      render: (text) => <Text strong className="text-slate-700">{text}</Text>,
    },
    {
      title: 'Section No',
      dataIndex: 'sectionNo',
      key: 'sectionNo',
      align: 'center',
      render: (text) => (
        <Space size={4}>
          <NumberOutlined className="text-slate-400" />
          <Text className="text-xs font-mono">{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Rev No',
      dataIndex: 'revNo',
      key: 'revNo',
      align: 'center',
      render: (text) => <span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200">{text}</span>,
    },
    {
      title: 'Rev. Date',
      dataIndex: 'revStartDate',
      key: 'revStartDate',
      align: 'center',
      render: (date) => (
        <Space size={4}>
          <CalendarOutlined className="text-slate-400" />
          <Text className="text-xs">{date ? format(new Date(date), 'dd-MM-yyyy') : 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <Tooltip title="Edit Format Details">
          <Button
            type="primary"
            shape="circle"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.formatId)}
            className="flex items-center justify-center mx-auto bg-emerald-500 hover:bg-emerald-600 border-none shadow-sm"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <Card 
        className="shadow-xl border-none rounded-2xl overflow-hidden"
        title={
          <div className="flex items-center gap-3 py-2">
            <div className="bg-rose-500 p-2 rounded-lg text-white">
              <ReconciliationOutlined className="text-xl" />
            </div>
            <div>
              <Title level={4} className="!m-0 text-slate-800">Document Format List</Title>
              <Text type="secondary" className="text-xs">Manage document formats, sections, and revisions</Text>
            </div>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={docsDetails}
          rowKey="formatId"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            className: "px-4",
          }}
          className="master-format-table"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 border-b pb-3 mr-6">
            <EditOutlined className="text-rose-500" />
            <span>Edit Format Information</span>
          </div>
        }
        open={isOpen}
        onCancel={closeModal}
        footer={null}
        width={800}
        centered
        destroyOnClose
        className="premium-modal"
      >
        <div className="py-4">
          {selectedDocId && (
            <MasterListDocFormatEdit
              formatId={selectedDocId}
              onClose={closeModal}
              onUpdate={fetchDocs}
            />
          )}
        </div>
      </Modal>

      <style jsx>{`
        .master-format-table :global(.ant-table-thead > tr > th) {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .master-format-table :global(.ant-table-row:hover) {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}

export default MasterListDocFormatList;

