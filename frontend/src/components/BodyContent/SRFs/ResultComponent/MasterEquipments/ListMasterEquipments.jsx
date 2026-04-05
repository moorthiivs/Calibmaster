// import React from 'react'
// import { Button, Column, TableWithBrowserPagination } from 'react-rainbow-components'

// const ListMasterEquipments = ({ addEquipmets, setAddEquipmets }) => {
//     const removeEquipment = ({ index }) => (
//         <Button
//             variant="destructive"
//             label="Remove"
//             onClick={() => {
//                 console.log(index);
//                 const deleteValue = [...addEquipmets];
//                 deleteValue.splice(index, 1);
//                 setAddEquipmets(deleteValue);
//             }}
//         />
//     );

//     return (
//         <TableWithBrowserPagination
//             pageSize={5}
//             data={addEquipmets}
//             keyField="master_list_equipment_id"
//         >
//             <Column header="SL" component={({ index }) => index + 1} cellAlignment={"center"} width={90} />
//             <Column header="Standard Maintained" field="standard_maintained" cellAlignment={"center"} />
//             <Column header="Name Of Equipment" field="name_of_equipment" cellAlignment={"center"} />
//             <Column header="UID" field="uid" cellAlignment={"center"} />
//             <Column header="Make" field="make" cellAlignment={"center"} />
//             <Column header="Model Type" field="model_type" cellAlignment={"center"} />
//             <Column header="Validity" field="calibration_valid_upto" cellAlignment={"center"} />
//             <Column header="Remove" field="id" component={removeEquipment} cellAlignment={"center"} />

//         </TableWithBrowserPagination>
//     )
// }

// export default ListMasterEquipments


import React from "react";
import { Table, Button, Tag } from "antd";
import dayjs from "dayjs";

const ListMasterEquipments = ({ addEquipmets, setAddEquipmets }) => {

    const today = dayjs();

    const handleRemove = (index) => {
        const deleteValue = [...addEquipmets];
        deleteValue.splice(index, 1);
        setAddEquipmets(deleteValue);
    };

    const columns = [
        {
            title: "SL",
            key: "sl",
            align: "center",
            width: 70,
            render: (_, __, index) => index + 1,
        },
        {
            title: "Standard Maintained",
            dataIndex: "standard_maintained",
            align: "center",
        },
        {
            title: "Name Of Equipment",
            dataIndex: "name_of_equipment",
            align: "center",
        },
        {
            title: "UID",
            dataIndex: "uid",
            align: "center",
        },
        {
            title: "Make",
            dataIndex: "make",
            align: "center",
        },
        {
            title: "Model Type",
            dataIndex: "model_type",
            align: "center",
        },
        {
            title: "Validity",
            dataIndex: "calibration_valid_upto",
            align: "center",
            render: (date) => {
                if (!date) return "-";

                const validityDate = dayjs(date);
                const isExpired = validityDate.isBefore(today, "day");

                return isExpired ? (
                    <Tag color='orange-inverse' style={{ fontWeight: 500, fontSize: 13,background: 'red' }}>
                        {validityDate.format("DD-MM-YYYY")} (Expired)
                    </Tag>
                ) : (
                    <Tag color="green" style={{ fontWeight: 500, fontSize: 13 }}>
                        {validityDate.format("DD-MM-YYYY")}
                    </Tag>
                );
            },
        },
        {
            title: "Remove",
            key: "remove",
            align: "center",
            render: (_, __, index) => (
                <Button danger onClick={() => handleRemove(index)}>
                    Remove
                </Button>
            ),
        },
    ];

    return (
        <div style={{ width: "100%" }}>
            <Table
                columns={columns}
                dataSource={addEquipmets}
                rowKey="master_list_equipment_id"
                pagination={{ pageSize: 5 }}
                bordered
                style={{ width: "100%" }}
                scroll={{ x: "max-content" }}   // optional: prevents column shrink
            />
        </div>
    );
};

export default ListMasterEquipments;
