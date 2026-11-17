import React, { useContext, useEffect, useState } from 'react';
import { Table, Button, Modal, Card, Typography, Tooltip, Tag, Space } from 'antd';
import { EditOutlined, FileSearchOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.json";
import { differenceInYears, format, parseISO } from 'date-fns';
import MasterListDocDetailEdit from './MasterListDocDetailEdit';

const { Title, Text } = Typography;

function MasterListDocDetailList() {
  const auth = useContext(AuthContext);
  const [docsDetails, setDocsDetails] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs-details/fetchAll?labid=${auth.labId}`, {
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

  const handleEdit = (detailId) => {
    setSelectedDocId(detailId);
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
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Group Name',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (text) => <Text strong className="text-slate-700">{text}</Text>,
    },
    {
      title: 'Doc Number',
      dataIndex: 'docNumber',
      key: 'docNumber',
      render: (text) => <Tag color="blue" className="font-mono">{text}</Tag>,
    },
    {
      title: 'Document Title',
      dataIndex: 'docTitle',
      key: 'docTitle',
      width: 250,
      render: (text) => <Text className="text-slate-600 italic">{text}</Text>,
    },
    {
      title: 'Rev No',
      dataIndex: 'revisionNo',
      key: 'revisionNo',
      align: 'center',
      render: (text) => <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">{text}</span>,
    },
    {
      title: 'Rev. Date',
      dataIndex: 'issueRevDate',
      key: 'issueRevDate',
      align: 'center',
      render: (date) => (
        <Space size={4}>
          <CalendarOutlined className="text-slate-400" />
          <Text className="text-xs">{date ? format(new Date(date), 'dd-MM-yyyy') : 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Effective Date',
      dataIndex: 'effectiveStartDate',
      key: 'effectiveStartDate',
      align: 'center',
      render: (date) => (
        <Space size={4}>
          <ClockCircleOutlined className="text-blue-400" />
          <Text className="text-xs">{date ? format(new Date(date), 'dd-MM-yyyy') : 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Retention',
      key: 'retention',
      align: 'center',
      render: (_, record) => {
        const start = record.effectiveStartDate;
        const end = record.effectiveEndDate;
        if (!start || !end) return <Text type="secondary">N/A</Text>;
        const startDate = typeof start === 'string' ? parseISO(start) : new Date(start);
        const endDate = typeof end === 'string' ? parseISO(end) : new Date(end);
        const years = differenceInYears(endDate, startDate);
        return (
          <Tag color={years > 5 ? 'purple' : 'cyan'} className="rounded-full">
            {years} year{years !== 1 ? 's' : ''}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Tooltip title="Edit Details">
          <Button
            type="primary"
            shape="circle"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.detailId)}
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
            <div className="bg-indigo-500 p-2 rounded-lg text-white">
              <FileSearchOutlined className="text-xl" />
            </div>
            <div>
              <Title level={4} className="!m-0 text-slate-800">Document Master Details</Title>
              <Text type="secondary" className="text-xs">Detailed view of document revisions and retention policies</Text>
            </div>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={docsDetails}
          rowKey="detailId"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            className: "px-4",
          }}
          className="master-detail-table"
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 border-b pb-3 mr-6">
            <EditOutlined className="text-indigo-500" />
            <span>Edit Document Detail Entry</span>
          </div>
        }
        open={isOpen}
        onCancel={closeModal}
        footer={null}
        width={900}
        centered
        destroyOnClose
        className="premium-modal"
      >
        <div className="py-4">
          {selectedDocId && (
            <MasterListDocDetailEdit
              detailId={selectedDocId}
              onClose={closeModal}
              onUpdate={fetchDocs}
            />
          )}
        </div>
      </Modal>

      <style jsx>{`
        .master-detail-table :global(.ant-table-thead > tr > th) {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
        }
        .master-detail-table :global(.ant-table-row:hover) {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}

export default MasterListDocDetailList;

