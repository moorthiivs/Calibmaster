import React, { useContext, useEffect, useState } from 'react';
import { Table, Button, Modal, Card, Typography, Tooltip, Space } from 'antd';
import { EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.json";
import { format } from 'date-fns';
import MasterListDocEdit from './MasterListDocEdit';

const { Title, Text } = Typography;

function MasterListDocList() {
  const auth = useContext(AuthContext);
  const [docs, setDocs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs/fetchAll?labid=${auth.labId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocs(data);
    } catch (error) {
      console.error('Error fetching docs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [auth.labId, auth.token]);

  const handleEdit = (mslId) => {
    setSelectedDocId(mslId);
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
      title: 'Document Name',
      dataIndex: 'mslDocName',
      key: 'mslDocName',
      render: (text) => <Text strong className="text-slate-700">{text}</Text>,
    },
    {
      title: 'Revision No',
      dataIndex: 'mslDocRevisionNo',
      key: 'mslDocRevisionNo',
      align: 'center',
      render: (text) => <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium text-xs">{text}</span>,
    },
    {
      title: 'Revision Date',
      dataIndex: 'mslRevDateStart',
      key: 'mslRevDateStart',
      align: 'center',
      render: (date) => date ? format(new Date(date), 'dd-MM-yyyy') : 'N/A',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Tooltip title="Edit Document">
          <Button
            type="primary"
            shape="circle"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.mslId)}
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
            <div className="bg-blue-500 p-2 rounded-lg text-white">
              <FileTextOutlined className="text-xl" />
            </div>
            <div>
              <Title level={4} className="!m-0 text-slate-800">Master List of Documents</Title>
              <Text type="secondary" className="text-xs">Manage and update your document master list</Text>
            </div>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={docs}
          rowKey="mslId"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            className: "px-4",
          }}
          className="master-list-table"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 border-b pb-3 mr-6">
            <EditOutlined className="text-blue-500" />
            <span>Edit Document Details</span>
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
            <MasterListDocEdit
              mslId={selectedDocId}
              onClose={closeModal}
              onUpdate={fetchDocs}
            />
          )}
        </div>
      </Modal>

      <style jsx>{`
        .master-list-table :global(.ant-table-thead > tr > th) {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .master-list-table :global(.ant-table-row:hover) {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}

export default MasterListDocList;

