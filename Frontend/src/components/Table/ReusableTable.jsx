import React from "react";
import { Table } from "antd";

function ReusableTable({
    data,
    loading = false,
    columns,
    rowKey = "id",
    pageSize = 10,
    ...rest
}) {
    const total = data?.length || 0;
    
    // Create page size options and include the total length for an "All" equivalent
    const sizeOptions = [10, 20, 50, 100];
    if (total > 0 && !sizeOptions.includes(total)) {
        sizeOptions.push(total);
    }
    // Sort options numerically and convert to string array for antd
    const pageSizeOptions = sizeOptions.sort((a, b) => a - b).map(String);

    return (
        <Table
            rowKey={rowKey}
            loading={loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: 'max-content', y: 550 }}
            pagination={{
                defaultPageSize: pageSize,
                showSizeChanger: true,
                pageSizeOptions: pageSizeOptions,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
            {...rest}
        />
    );
}

export default ReusableTable;
