import { Table, Button, Tooltip, Space } from 'antd';
import { EyeOutlined, FileSearchOutlined, DeleteOutlined, DownCircleFilled, DownCircleOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useEffect, useState } from 'react';

const createDateFormat = (value) => value ? moment(value).format('DD-MM-YYYY') : '';

const AntTableSRF = ({ SRFList, auth, srfViewHandler, srfPreviewHandler, handleDeleteSRF, handleBulkDownload }) => {

    const [isloading, setisloading] = useState(true)
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
        },
        {
            title: 'Customer DC Date',
            dataIndex: 'customer_dc_date',
            key: 'customer_dc_date',
            align: 'center',
            render: (text) => createDateFormat(text),
        },
        {
            title: 'ACTION',
            key: 'action',
            fixed: 'right',
            align: 'center',
            render: (_, record) => (


                <Space size="middle">
                    {/* View SRF Button */}
                    <Tooltip title="View SRF">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => srfViewHandler(record.srf_id)}
                        />
                    </Tooltip>

                    {/* Show Preview & Delete only for admin or CSD */}
                    {(auth.department === 'admin' || auth.department === 'CSD') && (
                        <>
                            {/* Bulk Certificate Download */}
                            <Tooltip title="Bulk Certificate Download">
                                <Button
                                    icon={<CloudDownloadOutlined />}
                                    type='dashed'
                                    onClick={() => handleBulkDownload(record.srf_id)}
                                />
                            </Tooltip>

                            {/* Preview SRF Button */}
                            <Tooltip title="Preview SRF (Full Format)">
                                <Button
                                    icon={<FileSearchOutlined />}
                                    type="primary"
                                    onClick={() => srfPreviewHandler(record.srf_id)}
                                />
                            </Tooltip>

                            {/* Delete SRF Button */}
                            <Tooltip title="Delete SRF">
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    onClick={() => handleDeleteSRF(record.srf_id)}
                                />
                            </Tooltip>


                        </>
                    )}
                </Space>
            ),
        },
    ];

    useEffect(() => {
        if (SRFList) setisloading(false)
    }, [SRFList])

    return (
        <Table
            columns={columns}
            dataSource={SRFList}
            rowKey="srf_id"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 5 }}
            loading={isloading}
        />
    );
};

export default AntTableSRF;
