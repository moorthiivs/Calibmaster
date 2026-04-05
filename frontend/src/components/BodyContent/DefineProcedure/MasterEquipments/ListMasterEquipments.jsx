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
//             <Column header="SL" component={({ index }) => index + 1} cellAlignment={"center"} />
//             <Column header="Standard Maintained" field="standard_maintained" cellAlignment={"center"} />
//             <Column header="Name Of Equipment" field="name_of_equipment" cellAlignment={"center"} />
//             <Column header="UID" field="uid" cellAlignment={"center"} />
//             <Column header="Make" field="make" cellAlignment={"center"} />
//             <Column header="Model Type" field="model_type" cellAlignment={"center"} />
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
    const removeEquipment = (index) => {
        const deleteValue = [...addEquipmets];
        deleteValue.splice(index, 1);
        setAddEquipmets(deleteValue);
    };

    const columns = [
        {
            title: "SL",
            dataIndex: "sl",
            key: "sl",
            align: "center",
            width: "4%",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Standard Maintained",
            dataIndex: "standard_maintained",
            key: "standard_maintained",
            align: "center",
            width: "10%",
        },
        {
            title: "Name Of Equipment",
            dataIndex: "name_of_equipment",
            key: "name_of_equipment",
            align: "center",
            width: "20%",
        },
        {
            title: "UID",
            dataIndex: "uid",
            key: "uid",
            align: "center",
            width: "12%",
        },
        {
            title: "Make",
            dataIndex: "make",
            key: "make",
            align: "center",
            width: "10%",
        },
        {
            title: "Model Type",
            dataIndex: "model_type",
            key: "model_type",
            align: "center",
            width: "15%",
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
                    <Tag color='orange-inverse' style={{ fontWeight: 500, fontSize: 13, background: 'red' }}>
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
            width: "16%",
            render: (_, __, index) => (
                <Button danger onClick={() => removeEquipment(index)}>
                    Remove
                </Button>
            ),
        },
    ];

    return (
        <Table
            rowKey="master_list_equipment_id"
            columns={columns}
            dataSource={addEquipmets}
            pagination={{ pageSize: 5 }}
            tableLayout="fixed" // ensures widths are respected
        />
    );
};

export default ListMasterEquipments;
