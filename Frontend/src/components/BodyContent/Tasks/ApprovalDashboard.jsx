import React, { useState, useEffect, useContext, useRef } from 'react';
import { Table, Button, Card, Tag, Space, Modal, Input, DatePicker, message, Typography, Row, Col, Statistic, Tooltip, Divider, Skeleton, Radio } from 'antd';
import { AuthContext } from '../../../context/auth-context';
import GlobalNotification from '../../../utils/GlobalNotification';
import config from '../../../utils/config.json';
import StatusBadge from '../../UI/StatusBadge';
import { formattedDate } from '../../helpers/Helper';
import dayjs from 'dayjs';
import {
    ClockCircleOutlined,
    SafetyCertificateOutlined,
    FileDoneOutlined,
    HourglassOutlined,
    FilePdfOutlined,
    FileSearchOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { usePermissions } from '../../../hooks/usePermissions';

const { Title, Text } = Typography;

const ApprovalDashboard = ({ stage }) => {
    const auth = useContext(AuthContext);
    const { hasPermission } = usePermissions();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ reviewPending: 0, authPending: 0, authApproved: 0, reportGenerated: 0 });
    const [actionModal, setActionModal] = useState({ visible: false, task: null, action: '' });
    const [detailModal, setDetailModal] = useState({ visible: false, type: '', data: [], loading: false, title: '' });
    const [comments, setComments] = useState('');
    const [actionDate, setActionDate] = useState(dayjs());
    const [processing, setProcessing] = useState(false);
    const [toleranceFilter, setToleranceFilter] = useState('ALL'); // 'ALL' or 'OUT_OF_TOLERANCE'

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [sortBy, setSortBy] = useState("srf_item_id");
    const [sortOrder, setSortOrder] = useState("DESC");

    const abortControllerRef = useRef(null);

    const fetchSummary = async () => {
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/approval/summary`, {
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            const data = await response.json();
            if (data.code === 200) {
                setSummary(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch summary");
        }
    };

    const fetchTasks = async (p = page, l = limit, s = searchText, sb = sortBy, so = sortOrder) => {
        setLoading(true);
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const queryParams = new URLSearchParams({
                stage,
                page: p,
                limit: l,
                search: s,
                sortBy: sb,
                sortOrder: so,
                labId: auth.labId || ''
            });

            const response = await fetch(`${config.Calibmaster.URL}/api/approval/pending?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${auth.token}` },
                signal: abortControllerRef.current.signal
            });
            const data = await response.json();
            if (data.code === 200) {
                setTasks(data.data || []);
                setTotalItems(data.pagination?.totalItems || (data.data?.length || 0));
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                GlobalNotification.error({
                    title: "Failed to fetch tasks",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (type, title) => {
        setDetailModal({ ...detailModal, visible: true, loading: true, title, type, data: [] });
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/approval/details?type=${type}`, {
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            const data = await response.json();
            if (data.code === 200) {
                setDetailModal(prev => ({ ...prev, data: data.data, loading: false }));
            }
        } catch (error) {
            GlobalNotification.error({
                title: "Failed to fetch details",
            });
            setDetailModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Debounced search & filter effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchTasks(1, limit, searchText, sortBy, sortOrder);
        }, 350);

        return () => clearTimeout(timer);
    }, [stage, searchText]);

    useEffect(() => {
        fetchSummary();
    }, [stage]);

    const handleTableChange = (paginationObj, filtersObj, sorterObj) => {
        const newPage = paginationObj?.current || 1;
        const newLimit = paginationObj?.pageSize || 20;
        let newSortBy = sortBy;
        let newSortOrder = sortOrder;

        if (sorterObj && sorterObj.field) {
            newSortBy = sorterObj.field;
            newSortOrder = sorterObj.order === "ascend" ? "ASC" : "DESC";
        }

        setPage(newPage);
        setLimit(newLimit);
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        fetchTasks(newPage, newLimit, searchText, newSortBy, newSortOrder);
    };

    const handleAction = async () => {
        if (!actionDate) return GlobalNotification.error({
            title: "Please select a date",
        });

        setProcessing(true);
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/approval/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                    srf_item_id: actionModal.task.srf_item_id,
                    stage,
                    action: actionModal.action,
                    comments,
                    date: actionDate.format('YYYY-MM-DD')
                })
            });

            const data = await response.json();
            if (data.code === 200) {
                GlobalNotification.success({
                    title: data.message,
                });
                setActionModal({ visible: false, task: null, action: '' });
                setComments('');
                fetchTasks();
                fetchSummary();
            } else {
                GlobalNotification.error({
                    title: data.message,
                });
            }
        } catch (error) {
            GlobalNotification.error({
                title: "Action failed",
            });
        } finally {
            setProcessing(false);
        }
    };

    const viewDocument = async (srf_item_id, type) => {
        try {
            const res = await fetch(`${config.Calibmaster.URL}/api/generate-certificate/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`
                },
                body: JSON.stringify({ srf_item_id, type })
            });
            if (res.status !== 200) throw new Error();
            const blob = await res.blob();
            window.open(URL.createObjectURL(blob), '_blank');
        } catch {
            GlobalNotification.error({
                title: 'Failed to open document',
            });
        }
    };

    const columns = [
        {
            title: 'Inward No',
            dataIndex: 'inward_no',
            key: 'inward_no',
            fixed: 'left',
            width: 150
        },
        { title: 'SRF No', dataIndex: ['srf', 'srf_number'], key: 'srf_no', width: 150 },
        { title: 'Customer', dataIndex: ['srf', 'customer', 'customer_name'], key: 'customer', width: 250 },
        {
            title: 'Instrument',
            dataIndex: ['intrument_type', 'instrument_full_name'],
            key: 'instrument',
            width: 250
        },
        {
            title: 'Tolerance',
            key: 'tolerance',
            width: 180,
            filters: [
                { text: 'Within Tolerance', value: 'WITHIN_TOL' },
                { text: 'Out of Tolerance', value: 'OUT_OF_TOL' }
            ],
            onFilter: (value, record) => {
                return value === 'OUT_OF_TOL' ? record.isOverTolerance : !record.isOverTolerance;
            },
            render: (_, record) => {
                if (record.isOverTolerance) {
                    return (
                        <Tag
                            color="error"
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                            className="m-0 font-bold border-red-200 text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px] gap-1.5 shadow-sm"
                        >
                            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                            </span>
                            Out of Tol
                        </Tag>
                    );
                }
                return (
                    <Tag
                        color="success"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                        className="m-0 font-bold border-emerald-200 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px] gap-1.5 shadow-sm"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        Within Tol
                    </Tag>
                );
            }
        },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 150, render: (val) => <StatusBadge value={val} /> },
        {
            title: 'Certificates',
            key: 'certificates',
            width: 150,
            render: (_, record) => {
                const cert = record.certificate;
                if (!cert || cert.certCount === 0) return <Tag color="default">None</Tag>;
                return (
                    <Space size="middle">
                        <Tag color="blue" className="m-0">{cert.certCount}</Tag>
                        {cert.hasCertificate && (
                            <Tooltip title="View Certificate">
                                <Button
                                    type="link" size="small" icon={<FilePdfOutlined />}
                                    className="p-0 h-auto flex items-center justify-center text-red-500 hover:text-red-600"
                                    onClick={() => viewDocument(record.srf_item_id, 'calibration')}
                                />
                            </Tooltip>
                        )}
                        {cert.hasObservation && (
                            <Tooltip title="View Observation Report">
                                <Button
                                    type="link" size="small" icon={<FileSearchOutlined />}
                                    className="p-0 h-auto flex items-center justify-center text-blue-500 hover:text-blue-600"
                                    onClick={() => viewDocument(record.srf_item_id, 'observation')}
                                />
                            </Tooltip>
                        )}
                    </Space>
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        className="bg-emerald-500 hover:bg-emerald-600 border-none rounded-md"
                        onClick={() => setActionModal({ visible: true, task: record, action: 'APPROVE' })}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        className="rounded-md"
                        onClick={() => setActionModal({ visible: true, task: record, action: 'REJECT' })}
                    >
                        Reject
                    </Button>
                </Space>
            ),
        },
    ];

    const canReview = hasPermission('REVIEW_RESULT');
    const canAuthorize = hasPermission('AUTHORIZE_RESULT');

    const filteredTasks = tasks.filter(task => {
        if (toleranceFilter === 'OUT_OF_TOLERANCE') return task.isOverTolerance;
        return true;
    });

    return (
        <div className="p-4 md:p-6 space-y-6">
            <Row gutter={[16, 16]}>
                {canReview && (
                    <>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card
                                hoverable
                                onClick={() => fetchDetails('REVIEW_APPROVED', 'Review Approved Records')}
                                className="shadow-sm border-none rounded-2xl cursor-pointer hover:shadow-md transition-all h-full"
                            >
                                <Skeleton loading={loading} active avatar={false}>
                                    <Statistic
                                        title={<Text className="text-slate-500 text-xs uppercase font-bold tracking-wider">Review Approved</Text>}
                                        value={summary.reviewApprovedByUser || 0}
                                        valueStyle={{ color: '#10b981', fontWeight: 800 }}
                                        prefix={<SafetyCertificateOutlined />}
                                    />
                                </Skeleton>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={8} lg={5}>
                            <Card className="shadow-sm border-none rounded-2xl h-full">
                                <Skeleton loading={loading} active avatar={false}>
                                    <Statistic
                                        title={<Text className="text-slate-500 text-xs uppercase font-bold tracking-wider">Review Pending</Text>}
                                        value={summary.reviewPending}
                                        valueStyle={{ color: '#f59e0b', fontWeight: 800 }}
                                        prefix={<ClockCircleOutlined />}
                                    />
                                </Skeleton>
                            </Card>
                        </Col>
                    </>
                )}

                {canAuthorize && (
                    <>
                        <Col xs={24} sm={12} md={8} lg={5}>
                            <Card
                                hoverable
                                onClick={() => fetchDetails('AUTH_APPROVED', 'Authorization Approved Records')}
                                className="shadow-sm border-none rounded-2xl cursor-pointer hover:shadow-md transition-all h-full"
                            >
                                <Skeleton loading={loading} active avatar={false}>
                                    <Statistic
                                        title={<Text className="text-slate-500 text-xs uppercase font-bold tracking-wider">Auth Approved</Text>}
                                        value={summary.authApprovedByUser || 0}
                                        valueStyle={{ color: '#10b981', fontWeight: 800 }}
                                        prefix={<SafetyCertificateOutlined />}
                                    />
                                </Skeleton>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={8} lg={5}>
                            <Card className="shadow-sm border-none rounded-2xl h-full">
                                <Skeleton loading={loading} active avatar={false}>
                                    <Statistic
                                        title={<Text className="text-slate-500 text-xs uppercase font-bold tracking-wider">Auth Pending</Text>}
                                        value={summary.authPending}
                                        valueStyle={{ color: '#3b82f6', fontWeight: 800 }}
                                        prefix={<HourglassOutlined />}
                                    />
                                </Skeleton>
                            </Card>
                        </Col>
                    </>
                )}

                {(canReview || canAuthorize) && (
                    <Col xs={24} sm={12} md={8} lg={5}>
                        <Card className="shadow-sm border-none rounded-2xl h-full">
                            <Skeleton loading={loading} active avatar={false}>
                                <Statistic
                                    title={<Text className="text-slate-500 text-xs uppercase font-bold tracking-wider">Report Finalized</Text>}
                                    value={summary.reportGenerated}
                                    valueStyle={{ color: '#8b5cf6', fontWeight: 800 }}
                                    prefix={<FileDoneOutlined />}
                                />
                            </Skeleton>
                        </Card>
                    </Col>
                )}
            </Row>

            <Card className="shadow-md border-none rounded-3xl p-2 md:p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 px-2">
                    <div>
                        <Title level={4} className="!m-0 text-slate-800 font-bold">
                            {stage === 'REVIEW' ? 'Review' : 'Authorization'} Pending Tasks
                        </Title>
                        <Text type="secondary" className="text-[11px] uppercase tracking-widest font-bold text-slate-400">
                            Pending Approval Workflow
                        </Text>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Input
                            placeholder="Search by inward no, instrument, serial no..."
                            prefix={<SearchOutlined className="text-slate-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            style={{ width: 280 }}
                            className="rounded-xl border-slate-200 shadow-sm"
                        />
                        <Radio.Group
                            value={toleranceFilter}
                            onChange={(e) => setToleranceFilter(e.target.value)}
                            optionType="button"
                            buttonStyle="solid"
                            className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100/50 p-1 flex gap-1"
                        >
                            <Radio.Button
                                value="ALL"
                                className={`font-semibold text-xs rounded-lg border-none transition-all flex items-center gap-1.5 ${
                                    toleranceFilter === 'ALL'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                All <span className="bg-white/20 text-current text-[11px] px-1.5 py-0.5 rounded-full font-bold">{totalItems}</span>
                            </Radio.Button>
                            <Radio.Button
                                value="OUT_OF_TOLERANCE"
                                className={`font-semibold text-xs rounded-lg border-none transition-all flex items-center gap-1.5 ${
                                    toleranceFilter === 'OUT_OF_TOLERANCE'
                                        ? 'bg-amber-500 text-white shadow-sm'
                                        : 'bg-transparent text-amber-600 hover:text-amber-700'
                                }`}
                            >
                                ⚠️ Out of Tol <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-1.5 py-0.5 rounded-full">{tasks.filter(t => t.isOverTolerance).length}</span>
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredTasks}
                    rowKey="srf_item_id"
                    loading={loading}
                    scroll={{ x: 'max-content', y: 550 }}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: totalItems,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                    }}
                    onChange={handleTableChange}
                    rowClassName={(record) => record.isOverTolerance ? 'bg-amber-50/50 hover:bg-amber-50/80 font-medium' : ''}
                />
            </Card>

            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-white ${actionModal.action === 'APPROVE' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                            {actionModal.action === 'APPROVE' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        </div>
                        <Text strong className="text-lg">
                            {actionModal.action === 'APPROVE' ? 'Approve' : 'Reject'} Task
                        </Text>
                    </div>
                }
                open={actionModal.visible}
                onOk={handleAction}
                onCancel={() => setActionModal({ visible: false, task: null, action: '' })}
                confirmLoading={processing}
                okText={actionModal.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                okButtonProps={{
                    disabled: processing,
                    danger: actionModal.action === 'REJECT',
                    className: actionModal.action === 'APPROVE' ? 'bg-emerald-500 hover:bg-emerald-600 border-none h-10 rounded-lg' : 'h-10 rounded-lg'
                }}
                cancelButtonProps={{ disabled: processing, className: 'h-10 rounded-lg' }}
                width={500}
                centered
            >
                <div className="flex flex-col gap-5 pt-4">
                    {actionModal.task?.isOverTolerance && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
                            <span className="text-red-500 text-lg">⚠️</span>
                            <div>
                                <Text strong className="text-red-800 block text-xs">Out of Tolerance Warning</Text>
                                <Text className="text-red-600 text-[11px] block mt-1">
                                    This instrument has one or more calibration points that are **Outside the Permissible Tolerance Limits** (conditional formatting red was triggered). Please verify before approving.
                                </Text>
                            </div>
                        </div>
                    )}
                    {actionModal.task?.certificate?.certCount > 0 && (
                        <div>
                            <Text strong className="block mb-3 text-slate-600 uppercase text-[11px] tracking-wider">Review Documents</Text>
                            <Space wrap size="middle">
                                {actionModal.task.certificate.hasCertificate && (
                                    <Button
                                        icon={<FilePdfOutlined />}
                                        className="rounded-lg h-10 border-red-100 text-red-500 hover:bg-red-50"
                                        onClick={() => viewDocument(actionModal.task.srf_item_id, 'calibration')}
                                    >
                                        Certificate
                                    </Button>
                                )}
                                {actionModal.task.certificate.hasObservation && (
                                    <Button
                                        icon={<FileSearchOutlined />}
                                        className="rounded-lg h-10 border-blue-100 text-blue-500 hover:bg-blue-50"
                                        onClick={() => viewDocument(actionModal.task.srf_item_id, 'observation')}
                                    >
                                        Observation
                                    </Button>
                                )}
                            </Space>
                            <Divider className="my-4" />
                        </div>
                    )}
                    {actionModal.action === 'APPROVE' && (
                        <div>
                            <Text strong className="block mb-2 text-slate-600 uppercase text-[11px] tracking-wider">
                                {stage === 'REVIEW' ? 'Review Date' : 'Authorization Date'}
                            </Text>
                            <DatePicker
                                className="w-full h-11 rounded-lg"
                                value={actionDate}
                                onChange={(date) => setActionDate(date)}
                                format="DD-MM-YYYY"
                                disabledDate={(current) => {
                                    if (!current) return false;
                                    // Max date: Today (end of current day)
                                    if (current.isAfter(dayjs().endOf('day'))) return true;
                                    // Min date: Item's Calibration Date
                                    const calibDateRaw = actionModal.task?.calibration_done_date || 
                                                         actionModal.task?.calibration_date || 
                                                         actionModal.task?.srf?.srf_date || 
                                                         actionModal.task?.created_timestamp;
                                    if (calibDateRaw) {
                                        const minDate = dayjs(calibDateRaw).startOf('day');
                                        if (current.isBefore(minDate)) return true;
                                    }
                                    return false;
                                }}
                            />
                        </div>
                    )}
                    <div>
                        <Text strong className="block mb-2 text-slate-600 uppercase text-[11px] tracking-wider">Comments / Remarks</Text>
                        <Input.TextArea
                            rows={4}
                            placeholder="Enter any feedback or notes here..."
                            className="rounded-lg border-slate-200"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            {/* Details Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500 p-2 rounded-xl text-white">
                            <FileDoneOutlined />
                        </div>
                        <Text strong className="text-lg">{detailModal.title}</Text>
                    </div>
                }
                open={detailModal.visible}
                onCancel={() => setDetailModal({ ...detailModal, visible: false })}
                width={1100}
                footer={null}
                centered
                className="modal-full-mobile"
            >
                <div className="pt-4">
                    <Table
                        loading={detailModal.loading}
                        dataSource={detailModal.data}
                        rowKey="srf_item_id"
                        size="middle"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1000 }}
                        className="overflow-hidden"
                        rowClassName={(record) => record.isOverTolerance ? 'bg-red-50/40 hover:bg-red-50/60' : ''}
                        columns={[
                            {
                                title: 'SRF No',
                                dataIndex: ['srf', 'srf_number'],
                                key: 'srf_no',
                                fixed: 'left',
                                width: 150
                            },
                            { title: 'Customer', dataIndex: ['srf', 'customer', 'customer_name'], key: 'customer', width: 250 },
                            { title: 'Instrument', dataIndex: ['intrument_type', 'instrument_full_name'], key: 'instrument', width: 250 },
                            {
                                title: 'Tolerance',
                                key: 'tolerance',
                                width: 160,
                                filters: [
                                    { text: 'Within Tolerance', value: 'WITHIN_TOL' },
                                    { text: 'Out of Tolerance', value: 'OUT_OF_TOL' }
                                ],
                                onFilter: (value, record) => {
                                    return value === 'OUT_OF_TOL' ? record.isOverTolerance : !record.isOverTolerance;
                                },
                                render: (_, record) => {
                                    if (record.isOverTolerance) {
                                        return (
                                            <Tag
                                                color="error"
                                                style={{ display: 'inline-flex', alignItems: 'center' }}
                                                className="m-0 font-bold border-red-200 text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px] gap-1.5 shadow-sm"
                                            >
                                                <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                                                </span>
                                                Out of Tol
                                            </Tag>
                                        );
                                    }
                                    return (
                                        <Tag
                                            color="success"
                                            style={{ display: 'inline-flex', alignItems: 'center' }}
                                            className="m-0 font-bold border-emerald-200 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px] gap-1.5 shadow-sm"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                            Within Tol
                                        </Tag>
                                    );
                                }
                            },
                            {
                                title: 'Date',
                                dataIndex: 'dynamic_date',
                                key: 'date',
                                width: 150,
                                render: (val) => val ? formattedDate(val) : '-'
                            },
                            {
                                title: 'Comments',
                                dataIndex: 'dynamic_comments',
                                key: 'comments',
                                width: 200,
                                render: (val) => val || '-'
                            },
                            {
                                title: 'Certificate',
                                key: 'certificate',
                                fixed: 'right',
                                width: 120,
                                render: (_, record) => {
                                    const cert = record.certificate;
                                    if (!cert || cert.certCount === 0) return <Tag color="default">None</Tag>;
                                    return (
                                        <Space>
                                            {cert.hasCertificate && (
                                                <Tooltip title="View Certificate">
                                                    <Button
                                                        type="link" size="small" icon={<FilePdfOutlined />}
                                                        className="text-red-500 hover:text-red-600 p-0"
                                                        onClick={() => viewDocument(record.srf_item_id, 'calibration')}
                                                    />
                                                </Tooltip>
                                            )}
                                            {cert.hasObservation && (
                                                <Tooltip title="View Observation Report">
                                                    <Button
                                                        type="link" size="small" icon={<FileSearchOutlined />}
                                                        className="text-blue-500 hover:text-blue-600 p-0"
                                                        onClick={() => viewDocument(record.srf_item_id, 'observation')}
                                                    />
                                                </Tooltip>
                                            )}
                                        </Space>
                                    );
                                }
                            }
                        ]}
                    />
                </div>
            </Modal>

            <style jsx>{`
                :global(.ant-table-thead > tr > th) {
                    background: #f8fafc !important;
                    color: #475569 !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    font-weight: 700 !important;
                }
                @media (max-width: 640px) {
                    :global(.modal-full-mobile .ant-modal) {
                        width: 95% !important;
                        max-width: 95% !important;
                        margin: 10px auto !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ApprovalDashboard;
