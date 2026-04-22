import { useEffect, useState, useContext } from "react";
import { Card, TableWithBrowserPagination, Column, } from "react-rainbow-components";
//import {  Button } from "react-rainbow-components";
import { useDispatch, useSelector } from "react-redux";
import { faEdit, faLock, faSearch, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { srfitemsActions } from "../../../store/srfitems";
import "./FilteredItems.css";
import { selecteditemsActions } from "../../../store/selecteditems";
import ViewSRFItem from "./ViewSRFItem";
import EditSRFItem from "./EditSRFItem";
import StatusBadge from "../../UI/StatusBadge";
import UpdateCal from "./UpdateCal";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import CertificateGenerate from "./CertificateGenerate";
import VcCertificateGenerate from "./VcCertificateGenerate";
import { MenuItem } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import showConfirmationDialog from "../../../utils/showConfirmationToast";

import { Table, Dropdown, Menu, Input, Button, notification } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { format } from 'date-fns';
import { usePermissions } from "../../../hooks/usePermissions";
const FilteredItems = (props) => {

  const [modifiedItems, setModifiedItems] = useState([]);
  const [addItemModel, setAddItemModel] = useState(false);
  const [viewItemModel, setViewItemModel] = useState(false);
  const [editItemModel, setEditItemModel] = useState(false);
  const [updateItemModel, setUpdateItemModel] = useState(false);
  const [viewItem, setViewItem] = useState();
  const [editItem, setEditItem] = useState();
  const [updateItem, setUpdateItem] = useState();
  const [SRFItemsList, setSRFItemsList] = useState([]);
  const [addCertificateModel, setaddCertificateModel] = useState(false);
  const [addVcCertificateModel, setaddVcCertificateModel] = useState(false);
  const [isLoaded, setisLoaded] = useState(true);
  const [srf, setSRF] = useState(null);
  const [srfid, setsrfid] = useState(null)
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const allitems = useSelector((state) => state.childSrfItems.list);
  const { hasPermission } = usePermissions();
  useEffect(() => {
     //console.log(allitems);
  }, []);

  const addItemHandler = () => {
    const isopen = addItemModel;
    setAddItemModel(!isopen);
  };

  const viewItemModelHandler = () => {
    const viewitemmodel = viewItemModel;
    setViewItemModel(!viewitemmodel);
  };

  const editItemModelHandler = () => {
    const edititemmodel = editItemModel;
    setEditItemModel(!edititemmodel);
  };

  const updateItemModelHandler = () => {
    const updateitemmodel = updateItemModel;
    setUpdateItemModel(!updateitemmodel);
  };


  const deleteItemHandler = async ({ srf_id, srf_item_id, lab_id }) => {
    try {

      const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?");

      if (!confirmDelete) {
        console.log("Cancel Delete!");
        return;
      }
      setisLoaded(false);

      const requestBody = {
        srf_id,
        srf_item_id,
        lab_id,
        userId: auth.userId
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(requestBody),
      };

      let response = await fetch(config.Calibmaster.URL + "/api/srf/deleteitem", requestOptions)
      response = await response.json();

      const newnotification = {
        title: "SRF Item Deleted Successfully!!",
        icon: "success",
        state: true,
        timeout: 15000,
      };
      //dispatch(notificationActions.changenotification(newnotification));
      notification.success({ message: "SRF Item Deleted Successfully" });
      dispatch(childSrfItemsActions.changesrfitems(response?.data?.items));

    } catch (error) {
      console.log(error);
      const errornotification = {
        title: "Error while Deleting Updating SRF Item!!",
        icon: "error",
        state: true,
        timeout: 15000,
      };
      dispatch(notificationActions.changenotification(errornotification));
    } finally {
      setisLoaded(true);
    }
  };

  //*** Fetch SRF Items ***/
  async function fetchSRFItems() {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
      const { data } = await response.json();
      const { items } = data;

      const newSRFList = async (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i].slNo = i + 1;
        }
        // console.log(arr);
        return arr;
      }
      let getSRFList = await newSRFList(items);
      // dispatch(srfitemsActions.changesrfitems(getSRFList));
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchSRFItems();
  }, []);


  // *** Instrument Full Name ***
  function findIntrumentTypeName({ value }) {
    return value?.instrument_full_name;
  }

  // ***  Open Add Weigh Certificate Model  *** 
  const addCertificateModelHandler = () => {
    setaddCertificateModel(true);
  };

  // ***  Close Add Weigh Certificate Model  *** 
  const closeCertificateModelHandler = () => {
    setaddCertificateModel(false);
  };

  // *** Weigh Certificate Generate button ***
  const weighCertificateButton = ({ row }) => (
    <Button
      variant="border"
      label="Certificate-1"
      style={{ width: '132px' }}
      onClick={() => {
        setViewItem(row);
        addCertificateModelHandler();
      }}
    />
  );

  // ***  Open Add VC Certificate Model  *** 
  const addVcCertificateModelHandler = () => {
    setaddVcCertificateModel(true);
  };

  // ***  Close Add VC Certificate Model  *** 
  const closeVcCertificateModelHandler = () => {
    setaddVcCertificateModel(false);
  };



  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Button
          onClick={() => confirm()}
          style={{ marginRight: 8 }}
          type="primary"
        >
          Search
        </Button>
        <Button onClick={() => clearFilters()}>
          Reset
        </Button>
      </div>
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : "",
  });

  const getSRFDetail = async () => {
    if (srfid) {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ srfId: srfid }),
      };
      const errornotification = {
        title: "Error while Getting SRF Detail!!",
        description: props.srfid,
        icon: "error",
        state: true,
        timeout: 15000,
      };
      fetch(config.Calibmaster.URL + "/api/srf/getsrfbyid", requestOptions)
        .then(async (response) => {
          const data = await response.json();

          //console.log(data);
          if (data) {
            if (data.code === 200) {
              // console.log(data);
              const srf = data.data.srf;

              setSRF(srf);

              let items = data.data.items;

              dispatch(srfitemsActions.changesrfitems(items));

            } else {
              dispatch(
                notificationActions.changenotification(errornotification)
              );
              setError(data.message);
            }
          } else {
            dispatch(notificationActions.changenotification(errornotification));
            setError("Error while Getting SRF Detail!!");
          }
        })
        .catch((err) => {
          console.log(err);
          dispatch(notificationActions.changenotification(errornotification));
          setError("Error while Getting SRF Detail!!");
        });
    }
  };


  useEffect(() => {
    getSRFDetail();
  }, [srfid]);

  const LAB_TYPES = ["NABL", "NON-NABL", "SERVICE"];

  const columns = [
    {
      title: "S.No",
      dataIndex: "slNo",
      key: "slNo",
      width: 90,
      align: "center",
      sorter: (a, b) => a.slNo - b.slNo,
    },
    {
      title: "Inward No",
      dataIndex: "inward_no",
      key: "inward_no",
      width: 90,
      align: "center",
      ...getColumnSearchProps("inward_no"),
    },
    {
      title: "Description of Item",
      dataIndex: "intrument_type",
      key: "intrument_type",
      align: "center",
      //render: (value) => <p>{value?.instrument_full_name}</p>,
      render: (value) => <p className="text-sm my-3 text-center w-full">{value?.instrument?.instrument_name}</p>,
    },
    {
      title: "Make",
      dataIndex: "make",
      key: "make",
      align: "center",
      ...getColumnSearchProps("make"),
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      align: "center",
    },
    {
      title: "Lab Type",
      dataIndex: "labtype",
      key: "labtype",
      align: "center",
      filters: LAB_TYPES.map((type) => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.labtype === value,
    },
    {
      title: "Id Number",
      dataIndex: "identification_details",
      key: "identification_details",
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (value) => <StatusBadge value={value} />,
      filters: config.SRF_ITEM_STATUS_LIST.map((status) => ({
        text: status,
        value: status,
      })),
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Created At",
      dataIndex: "created_timestamp",
      key: "created_timestamp",
      align: "center",
      render: (value) => <p>{value ? format(value, 'dd-MM-yyyy hh:mm a') : ""}</p>,
    },
    {
      title: "Last Updated",
      dataIndex: "updated_timestamp",
      key: "updated_timestamp",
      align: "center",
      render: (value) => <p>{value ? format(value, 'dd-MM-yyyy hh:mm a') : ""}</p>,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      align: "center",
    },
  ];

  // Only add the Action column if the user has at least one item-level permission
  const canView = hasPermission("VIEW_SRF_ITEM");
  const canEdit = hasPermission("EDIT_SRF_ITEM");
  const canDelete = hasPermission("DELETE_SRF_ITEM");

  if (canView || canEdit || canDelete) {
    columns.push({
      title: "Action",
      key: "action",
      align: "center",
      fixed: 'right',
      render: (_, record) => {
        const menuItems = [
          canView && {
            key: "view",
            icon: <FontAwesomeIcon icon={faEye} />,
            label: "View Item",
            onClick: () => {
              setsrfid(record?.srf_id);
              setViewItem(record);
              viewItemModelHandler();
            },
          },
          canEdit && {
            key: "edit",
            icon: <FontAwesomeIcon icon={faEdit} />,
            label: "Edit Item",
            onClick: () => {
              setsrfid(record?.srf_id);
              setEditItem(record);
              editItemModelHandler();
            },
          },
          canEdit && {
            key: "update",
            icon: <FontAwesomeIcon icon={faEdit} />,
            label: "Update",
            onClick: () => {
              setsrfid(record?.srf_id);
              setUpdateItem(record);
              updateItemModelHandler();
            },
          },
          canDelete && {
            key: "delete",
            icon: <FontAwesomeIcon icon={faTrash} />,
            label: "Delete Item",
            danger: true,
            onClick: () => {
              setsrfid(record?.srf_id);
              deleteItemHandler(record);
            },
          },
        ].filter(Boolean);

        return (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <MoreOutlined style={{ cursor: "pointer", fontSize: 18 }} />
          </Dropdown>
        );
      },
    });
  }
  return (
    <div>
      <Card >
        <Table
          rowKey="slNo"
          dataSource={allitems}
          columns={columns}
          pagination={{
            defaultPageSize: 5,
            pageSizeOptions: ["5", "10", "20", "50"],
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 'max-content' }}
          rowSelection={
            props.checkbox
              ? {
                onChange: (_, selectedRows) =>
                  dispatch(selecteditemsActions.changeselecteditems(selectedRows)),
              }
              : null
          }
        />
      </Card>


      {viewItemModel ? (
        <ViewSRFItem
          onclose={viewItemModelHandler}
          item={viewItem}
          isOpen={viewItemModel}
          mode={"Opened_via_Filtered_Items"}
        />
      ) : null}

      {editItemModel ? (
        <EditSRFItem
          onclose={editItemModelHandler}
          item={editItem}
          isopen={editItemModel}
        />
      ) : null}

      {updateItemModel ? (
        <UpdateCal
          onclose={updateItemModelHandler}
          item={updateItem}
          isOpen={updateItemModel}
          //srf={props?.srf}
          srf={props?.srf ? props?.srf : srf}
          modalType={"filtered_srf_items"}
        />
      ) : null}

      {
        addCertificateModel ? (
          <CertificateGenerate
            onclose={closeCertificateModelHandler}
            item={viewItem}
            isOpen={addCertificateModel}
            mode={"Opened_via_Filtered_Items"}
          />
        ) : null
      }

      {addVcCertificateModel ? (
        <VcCertificateGenerate
          onclose={closeVcCertificateModelHandler}
          item={viewItem}
          isOpen={addVcCertificateModel}
          mode={"Opened_via_Filtered_Items"}
        />
      ) : null}





    </div>
  );
};

export default FilteredItems;