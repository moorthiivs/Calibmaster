import { Table, Button, Tooltip, Space, Tag } from 'antd';
import { EyeOutlined, FileSearchOutlined, DeleteOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

const createDateFormat = (value) => value ? moment(value).format('DD-MM-YYYY') : '';

const AntTableSRF = ({ SRFList, auth, srfViewHandler, srfPreviewHandler, handleDeleteSRF, handleBulkDeleteSRFs, handleBulkDownload, dashboardStatus, pagination, onChange }) => {

    const [isloading, setisloading] = useState(false);
    const { hasPermission } = usePermissions();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const columns = [
        {
            title: 'S.No',
            dataIndex: 'id',
            key: 'id',
            align: 'center',
        },
        {
            title: 'SRF No',
            dataIndex: 'srf_number',
            key: 'srf_number',
            align: 'center',
        },
        {
            title: 'SRF Date',
            dataIndex: 'srf_date',
            key: 'srf_date',
            align: 'center',
            render: (text) => createDateFormat(text),
        },
        {
            title: 'Customer Name',
            dataIndex: 'customer',
            key: 'customer',
            align: 'center',
            render: (text, record) => record?.customer?.customer_name || 'N/A',
        },
        {
            title: 'Customer Code',
            dataIndex: 'customer',
            key: 'customer_code',
            align: 'center',
            render: (text, record) => record?.customer_code || 'N/A',
        },
        {
            title: 'Contact Person',
            dataIndex: 'contact_name',
            key: 'contact_name',
            align: 'center',
        },
        {
            title: 'Contact Number',
            dataIndex: 'contact_number',
            key: 'contact_number',
            align: 'center',
        },
        {
            title: 'Agreed Date',
            dataIndex: 'agreed_completion_date',
            key: 'agreed_completion_date',
            align: 'center',
            render: (text) => createDateFormat(text),
        },
        {
            title: 'Customer DC',
            dataIndex: 'customer_dc',
            key: 'customer_dc',
            align: 'center',
            render: (text) => text || 'NA',
        },
        {
            title: 'Customer DC Date',
            dataIndex: 'customer_dc_date',
            key: 'customer_dc_date',
            align: 'center',
            render: (text) => createDateFormat(text),
        },
    ];

    // Add Items count badge column when dashboard filter is active
    if (dashboardStatus) {
        const statusLabel = dashboardStatus === "upcoming_due" ? "Upcoming Due"
            : dashboardStatus === "Not Calibrated" ? "Pending"
            : dashboardStatus === "Report Generated" ? "Completed"
            : dashboardStatus;
        const badgeColor = dashboardStatus === "Not Calibrated" ? "red"
            : dashboardStatus === "Report Generated" ? "green"
            : "blue";
        columns.push({
            title: 'Items',
            dataIndex: 'dashboardItemCount',
            key: 'dashboardItemCount',
            align: 'center',
            width: 100,
            sorter: (a, b) => (a.dashboardItemCount || 0) - (b.dashboardItemCount || 0),
            render: (count) => {
                if (!count || count === 0) return <Tag color="default">0</Tag>;
                return (
                    <Tag color={badgeColor} style={{ fontWeight: 600, fontSize: 13 }}>
                        {count} {statusLabel}
                    </Tag>
                );
            }
        });
    }

    // Evaluate SRF-level permissions once
    const canViewSRF    = hasPermission('VIEW_SRF');
    const canEditSRF    = hasPermission('EDIT_SRF');
    const canDeleteSRF  = hasPermission('DELETE_SRF');
    const canBulkDownload = hasPermission('BULK_DOWNLOAD_CERTIFICATE');

    // Only add the Action column if the user has at least one SRF-level action permission
    if (canViewSRF || canEditSRF || canDeleteSRF) {
        columns.push({
            title: 'ACTION',
            key: 'action',
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <Space size="middle">

                    {/* View SRF — requires VIEW_SRF permission */}
                    {canViewSRF && (
                        <Tooltip title="View SRF">
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => srfViewHandler(record.srf_id)}
                            />
                        </Tooltip>
                    )}

                    {/* Bulk Certificate Download — requires BULK_DOWNLOAD_CERTIFICATE permission */}
                    {canBulkDownload && (
                        <Tooltip title="Bulk Certificate Download">
                            <Button
                                icon={<CloudDownloadOutlined />}
                                type='dashed'
                                onClick={() => handleBulkDownload(record.srf_id)}
                            />
                        </Tooltip>
                    )}

                    {/* Preview SRF — requires EDIT_SRF permission */}
                    {canEditSRF && (
                        <Tooltip title="Preview SRF (Full Format)">
                            <Button
                                icon={<FileSearchOutlined />}
                                type="primary"
                                onClick={() => srfPreviewHandler(record.srf_id)}
                            />
                        </Tooltip>
                    )}

                    {/* Delete SRF — requires DELETE_SRF permission */}
                    {canDeleteSRF && (
                        <Tooltip title="Delete SRF">
                            <Button
                                icon={<DeleteOutlined />}
                                danger
                                onClick={() => handleDeleteSRF(record.srf_id)}
                            />
                        </Tooltip>
                    )}

                </Space>
            ),
        });
    }

    useEffect(() => {
        if (SRFList) setisloading(false);
    }, [SRFList]);

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = canDeleteSRF ? {
        selectedRowKeys,
        preserveSelectedRowKeys: true,
        onChange: onSelectChange,
    } : null;

    const hasSelected = selectedRowKeys.length > 0;

    return (
        <div>
            {canDeleteSRF && hasSelected && (
                <div style={{ marginBottom: 16, padding: '16px 16px 0 16px' }}>
                    <Button 
                        type="primary" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => {
                            handleBulkDeleteSRFs(selectedRowKeys);
                            setSelectedRowKeys([]);
                        }}
                    >
                        Bulk Delete ({selectedRowKeys.length})
                    </Button>
                </div>
            )}
            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={SRFList}
                rowKey="srf_id"
                scroll={{ x: 'max-content' }}
                pagination={pagination || { defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
                onChange={onChange}
                loading={isloading}
            />
        </div>
    );
};

export default AntTableSRF;
