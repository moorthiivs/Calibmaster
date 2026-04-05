// import React, { useContext, useState, useEffect } from 'react';
// import { Card, Button, Input, TableWithBrowserPagination, Column, Spinner } from "react-rainbow-components";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faSearch } from "@fortawesome/free-solid-svg-icons";
// import { AuthContext } from '../../../context/auth-context';
// import config from "../../../utils/config.json";
// import { notificationActions } from "../../../store/nofitication";
// import { useDispatch } from 'react-redux';
// import DataTable from 'react-data-table-component';
// import { labIdActions } from '../../../store/labId';
// import { sidebarActions } from "../../../store/sidebar";
// import { addNewId, searchByKindOfQuantity, searchByNameFunction } from './higherOrderFunction';
// import Loader from '../../UI/Loader';

// const ListUOM = () => {

//     const auth = useContext(AuthContext);
//     const dispatch = useDispatch();

//     const [uomList, setUomList] = useState([]);
//     const [loading, setloading] = useState(false);

//     const fetchUOMs = async () => {
//         try {
//             setloading(true);
//             const data = await fetch(config.Calibmaster.URL + "/api/uom/list", {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: "Bearer " + auth.token,
//                 },
//             });

//             let response = await data.json();
//             response = await addNewId(response.data);
//             // console.log(response);
//             setUomList(response);
//             setloading(false);

//             const newNotification = {
//                 title: "UOM List fetched Successfully",
//                 description: "",
//                 icon: "success",
//                 state: true,
//                 timeout: 1500,
//             };
//             return //dispatch(notificationActions.changenotification(newNotification));
//         } catch (error) {
//             console.log(error);
//             const newNotification = {
//                 title: "Something went wrong",
//                 description: "",
//                 icon: "error",
//                 state: true,
//                 timeout: 1500,
//             };
//             dispatch(notificationActions.changenotification(newNotification));
//         }
//     }

//     useEffect(() => {
//         fetchUOMs();
//     }, []);

//     const EditBtn = (data) => {

//         let id = data.row.uom_id;

//         return <Button
//             label="Edit"
//             onClick={() => { redirectHandler(id) }}
//             variant="success"
//             className="rainbow-m-around_medium"
//         />
//     }

//     const redirectHandler = (id) => {
//         dispatch(labIdActions.setLabId(id));
//         dispatch(sidebarActions.changesidebar("Edit-UOM"));
//     }

//     const searchNameFunction = async (val) => {
//         if (val !== "") {
//             try {
//                 setloading(true);
//                 const data = await searchByNameFunction(val, auth);
//                 let response = await addNewId(data);
//                 console.log(response);
//                 setUomList(response);
//                 return setloading(false);
//             } catch (error) {
//                 console.log(error);
//                 setloading(false);
//                 const errNotification = {
//                     title: "Something went wrong",
//                     description: "",
//                     icon: "error",
//                     state: true,
//                     timeout: 1500,
//                 };
//                 return dispatch(notificationActions.changenotification(errNotification));
//             }
//         } else {
//             setUomList([]);
//             return fetchUOMs();
//         }
//     }

//     const searchQuantityFunction = async (val) => {
//         if (val !== "") {
//             try {
//                 setloading(true);
//                 const data = await searchByKindOfQuantity(val, auth);
//                 let response = await addNewId(data);
//                 console.log(response);
//                 setUomList(response);
//                 return setloading(false);
//             } catch (error) {
//                 console.log(error);
//                 setloading(false);
//                 const errNotification = {
//                     title: "Something went wrong",
//                     description: "",
//                     icon: "error",
//                     state: true,
//                     timeout: 1500,
//                 };
//                 return dispatch(notificationActions.changenotification(errNotification));
//             }
//         } else {
//             setUomList([]);
//             return fetchUOMs();
//         }
//     }

//     return (
//         <div className="users__container">
//             <Card className="users__card">

//                 <div className="users__label">
//                     <h3>UOM List</h3>
//                 </div>

//                 <div className="searchers__container">

//                     <div className="searchers">
//                         <div className="custom__search__container">
//                             <Input
//                                 label="Search By UOM Name"
//                                 type="text"
//                                 disabled={false}
//                                 placeholder="Search By UOM Name"
//                                 onChange={(e) => searchNameFunction(e.target.value)}
//                                 icon={
//                                     <FontAwesomeIcon icon={faSearch} className="rainbow-color_gray-3" />
//                                 }
//                                 iconPosition="right"
//                             />
//                         </div>
//                     </div>

//                     <div className="searchers">
//                         <div className="custom__search__container">
//                             <Input
//                                 label="Search By Kind Of Quantity"
//                                 type="text"
//                                 disabled={false}
//                                 placeholder="Search By Kind Of Quantity"
//                                 onChange={(e) => searchQuantityFunction(e.target.value)}
//                                 icon={
//                                     <FontAwesomeIcon icon={faSearch} className="rainbow-color_gray-3" />
//                                 }
//                                 iconPosition="right"
//                             />
//                         </div>
//                     </div>

//                 </div>

//                 <TableWithBrowserPagination
//                     className="labs__table"
//                     pageSize={15}
//                     data={uomList}
//                     keyField="id"
//                 >
//                     <Column header="Sr No" field="id" cellAlignment={"center"} />
//                     <Column header="UOM Name" field="uom_name" cellAlignment={"center"} />
//                     <Column header="UOM kind Of Quantity" field="uom_kindofquantity" cellAlignment={"center"} />
//                     <Column header="UOM Unit Sysmbol" field="uom_printsysmbol" cellAlignment={"center"} />
//                     {/* <Column header="UOM Casesensitive" field="uom_casesensitive" />
//                     <Column header="UOM Caseinsensitive" field="uom_caseinsensitive" /> */}
//                     <Column header="Action" field="uom_id" component={EditBtn} cellAlignment={"center"} />
//                 </TableWithBrowserPagination>

//             </Card>

//             {(loading) ? <Loader /> : ""}
//         </div>
//     )
// }

// export default ListUOM;


import React, { useContext, useState, useEffect } from "react";
import { Card, Input, Button, Tooltip, Space } from "antd";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { notificationActions } from "../../../store/nofitication";
import { labIdActions } from "../../../store/labId";
import { useNavigate } from "react-router-dom";
import {
    addNewId,
    searchByKindOfQuantity,
    searchByNameFunction,
} from "./higherOrderFunction";
import Loader from "../../UI/Loader";
import DataTable from "../../common/DataTable";

const ListUOM = () => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [uomList, setUomList] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchUOMs = async () => {
        try {
            setLoading(true);
            const data = await fetch(config.Calibmaster.URL + "/api/uom/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            });

            let response = await data.json();
            response = await addNewId(response.data);
            setUomList(response);
            setLoading(false);

            // success notification (optional)
            // dispatch(notificationActions.changenotification({ ... }))
        } catch (error) {
            console.error(error);
            dispatch(
                notificationActions.changenotification({
                    title: "Something went wrong",
                    icon: "error",
                    state: true,
                    timeout: 1500,
                })
            );
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUOMs();
    }, []);

    const searchNameFunction = async (val) => {
        if (val) {
            try {
                setLoading(true);
                const data = await searchByNameFunction(val, auth);
                let response = await addNewId(data);
                setUomList(response);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
                dispatch(
                    notificationActions.changenotification({
                        title: "Something went wrong",
                        icon: "error",
                        state: true,
                        timeout: 1500,
                    })
                );
            }
        } else {
            fetchUOMs();
        }
    };

    const searchQuantityFunction = async (val) => {
        if (val) {
            try {
                setLoading(true);
                const data = await searchByKindOfQuantity(val, auth);
                let response = await addNewId(data);
                setUomList(response);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
                dispatch(
                    notificationActions.changenotification({
                        title: "Something went wrong",
                        icon: "error",
                        state: true,
                        timeout: 1500,
                    })
                );
            }
        } else {
            fetchUOMs();
        }
    };

    const redirectHandler = (id) => {
        dispatch(labIdActions.setLabId(id));
        navigate("/dashboard/uom/edit");
    };

    const columns = [
        {
            title: "UOM Name",
            dataIndex: "uom_name",
            align: "center",
        },
        {
            title: "Kind Of Quantity",
            dataIndex: "uom_kindofquantity",
            align: "center",
        },
        {
            title: "Unit Symbol",
            dataIndex: "uom_printsysmbol",
            align: "center",
        },
        {
            title: "Action",
            dataIndex: "uom_id",
            align: "center",
            render: (id) => (
                <Tooltip title="Edit UOM">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => redirectHandler(id)}>
                        Edit
                    </Button>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="users__containers">
            <Card className="users__cards" title="UOM List">
                {/* Search Section */}
                <Space style={{ marginBottom: "16px" }} wrap>
                    <Input
                        placeholder="Search By UOM Name"
                        onChange={(e) => searchNameFunction(e.target.value)}
                        prefix={<SearchOutlined />}
                        allowClear
                        size="large"
                    />
                    <Input
                        placeholder="Search By Kind Of Quantity"
                        onChange={(e) => searchQuantityFunction(e.target.value)}
                        prefix={<SearchOutlined />}
                        allowClear
                        size="large"
                    />
                </Space>

                {/* Data Table */}
                <DataTable columns={columns} data={uomList} loading={loading} />
            </Card>

            {/* {loading && <Loader />} */}
        </div>
    );
};

export default ListUOM;
