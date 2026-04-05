// // src/components/common/DataTable.jsx
// import React from "react";
// import { Table } from "antd";

// const DataTable = ({ columns, data, loading = false, pageSize = 10, onChange }) => {
//     return (
//         <Table
//             rowKey={(record, index) => record.id || index}
//             columns={columns}
//             dataSource={data}
//             loading={loading}
//             pagination={{
//                 pageSize: pageSize,
//                 showSizeChanger: true,
//                 pageSizeOptions: ["10", "20", "50", "100"],
//                 showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
//             }}
//             onChange={onChange}  // <-- forward pagination/sorting/filtering info
//         />
//     );
// };

// export default DataTable;
// src/components/common/DataTable.jsx
import React, { useState } from "react";
import { Table } from "antd";

const DataTable = ({
    columns,
    data,
    loading = false,
    pageSize = 10,
    showSerialNo = true, // enable/disable Sr No column
    rowKey = (record, index) => record.id || index,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSizeState, setPageSizeState] = useState(pageSize);

    // Inject Sr No column at the beginning if enabled
    const enhancedColumns = showSerialNo
        ? [
            {
                title: "Sr No",
                key: "serialNo",
                width: 80,
                align: "center",
                render: (_, __, index) =>
                    (currentPage - 1) * pageSizeState + index + 1,
            },
            ...columns,
        ]
        : columns;

    return (
        <Table
            rowKey={rowKey}
            columns={enhancedColumns}
            dataSource={data}
            loading={loading}
            pagination={{
                pageSize: pageSizeState,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSizeState(size);
                },
            }}
        />
    );
};

export default DataTable;
