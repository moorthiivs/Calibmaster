import React from "react";
import { Table } from "antd";

function ReusableTable({
    data,
    loading = false,
    columns,
    rowKey = "id",
    pageSize = 10,
}) {
    return (
        <Table
            rowKey={rowKey}
            loading={loading}
            columns={columns}
            dataSource={data}
            pagination={{ pageSize }}
            bordered
        />
    );
}

export default ReusableTable;
