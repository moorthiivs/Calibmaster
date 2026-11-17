import { useEffect, useState, useContext, useRef } from "react";
import { Card, TableWithBrowserPagination, Column, } from "react-rainbow-components";
//import {  Button } from "react-rainbow-components";
import { useDispatch, useSelector } from "react-redux";
import { faEdit, faLock, faSearch, faEye, faTrash, faCopy, faHistory } from "@fortawesome/free-solid-svg-icons";
import { srfitemsActions } from "../../../store/srfitems";
import "./FilteredItems.css";
import { selecteditemsActions } from "../../../store/selecteditems";
import ViewSRFItem from "./ViewSRFItem";
import ItemAuditModal from "./ItemAuditModal";
import EditSRFItem from "./EditSRFItem";
import StatusBadge from "../../UI/StatusBadge";
import UpdateCal from "./UpdateCal";
import { AuthContext } from "../../../context/auth-context";
import GlobalNotification from "../../../utils/GlobalNotification";
import config from "../../../utils/config.json";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import CertificateGenerate from "./CertificateGenerate";
import VcCertificateGenerate from "./VcCertificateGenerate";
import { MenuItem } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import showConfirmationDialog, { showAdvancedDeleteDialog, showDuplicateDialog } from "../../../utils/showConfirmationToast";

import { Table, Dropdown, Menu, Input, Button, Skeleton } from "antd";
import { MoreOutlined, SearchOutlined } from "@ant-design/icons";
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
  const [isAuditModal, setIsAuditModal] = useState(false);
  const [auditItem, setAuditItem] = useState(null);
  const [updateItem, setUpdateItem] = useState();
  const [SRFItemsList, setSRFItemsList] = useState([]);
  const [addCertificateModel, setaddCertificateModel] = useState(false);
  const [addVcCertificateModel, setaddVcCertificateModel] = useState(false);
  const [isLoaded, setisLoaded] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [srf, setSRF] = useState(null);
  const [srfid, setsrfid] = useState(null)
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const allitems = useSelector((state) => state.childSrfItems.list);
  const { hasPermission } = usePermissions();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("srf_item_id");
  const [sortOrder, setSortOrder] = useState("DESC");

  const abortControllerRef = useRef(null);
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

      //const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?");
      const confirmDelete = await showAdvancedDeleteDialog("Are You Sure Want to Delete?");

      if (!confirmDelete.isConfirmed) {
        console.log("Cancel Delete!");
        return;
      }
      setisLoaded(false);

      const requestBody = {
        srf_id,
        srf_item_id,
        lab_id,
        userId: auth.userId,
        isPermanent: confirmDelete.isPermanent
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

      GlobalNotification.success({
        title: "SRF Item Deleted",
        description: "SRF Item Deleted Successfully"
      });
      dispatch(childSrfItemsActions.changesrfitems(response?.data?.items));

    } catch (error) {
      console.log(error);
      GlobalNotification.error({
        title: "Error while Deleting Updating SRF Item!!",
      });
    } finally {
      setisLoaded(true);
    }
  };

  const [selectedStatus, setSelectedStatus] = useState([]);

  //*** Fetch SRF Items ***/
  async function fetchSRFItems(p = page, l = limit, s = searchText, st = selectedStatus, sb = sortBy, so = sortOrder) {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setPageLoading(true);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          labId: auth.labId,
          userId: auth.userId,
          page: p,
          limit: l,
          search: s,
          status: st,
          sortBy: sb,
          sortOrder: so
        }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
      const resData = await response.json();
      const items = resData?.data?.items || [];
      const pagination = resData?.data?.pagination || {};

      let counter = (p - 1) * l + 1;
      for (let i = 0; i < items.length; i++) {
        items[i].slNo = counter++;
      }

      dispatch(childSrfItemsActions.changesrfitems(items));
      setTotalItems(pagination?.totalItems || items.length);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.log(error);
      }
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    fetchSRFItems(page, limit, searchText, selectedStatus, sortBy, sortOrder);
  }, []);

  const [filteredInfo, setFilteredInfo] = useState({});

  const handleTableChange = (paginationObj, filtersObj, sorterObj) => {
    const newPage = paginationObj?.current || 1;
    const newLimit = paginationObj?.pageSize || 5;
    let newSortBy = sortBy;
    let newSortOrder = sortOrder;

    if (sorterObj && sorterObj.field) {
      newSortBy = sorterObj.field;
      newSortOrder = sorterObj.order === "ascend" ? "ASC" : "DESC";
    }

    setFilteredInfo(filtersObj || {});

    let statusVal = [];
    if (filtersObj && filtersObj.status && Array.isArray(filtersObj.status) && filtersObj.status.length > 0) {
      statusVal = filtersObj.status;
    }

    let searchVal = searchText;
    if (filtersObj) {
      const activeFilterVals = [];
      Object.keys(filtersObj).forEach(key => {
        if (key !== "status" && filtersObj[key] && Array.isArray(filtersObj[key]) && filtersObj[key].length > 0) {
          const val = filtersObj[key][0];
          if (val) activeFilterVals.push(val);
        }
      });
      if (activeFilterVals.length > 0) {
        searchVal = activeFilterVals.join(" ");
      }
    }

    setPage(newPage);
    setLimit(newLimit);
    setSelectedStatus(statusVal);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    fetchSRFItems(newPage, newLimit, searchVal, statusVal, newSortBy, newSortOrder);
  };


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
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <div className="flex gap-2">
          <Button
            onClick={() => confirm()}
            type="primary"
            size="small"
            style={{ width: 80 }}
          >
            Search
          </Button>
          <Button onClick={() => { clearFilters(); confirm(); }} size="small" style={{ width: 80 }}>
            Reset
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
  });

  const getSRFDetail = async () => {
    if (srfid) {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ srfId: srfid, userId: auth.userId }),
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
              GlobalNotification.error({
                title: "Error while Getting SRF Detail!!",
              });
            }
          } else {
            GlobalNotification.error({
              title: "Error while Getting SRF Detail!!",
            });
          }
        })
        .catch((err) => {
          console.log(err);
          GlobalNotification.error({
            title: "Error while Getting SRF Detail!!",
          });
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
      key: "srf_item_id",
      width: 90,
      align: "center",
      sorter: true,
    },
    {
      title: "Inward No",
      dataIndex: "inward_no",
      key: "inward_no",
      width: 140,
      align: "center",
      sorter: true,
      filteredValue: filteredInfo.inward_no || null,
      ...getColumnSearchProps("inward_no"),
    },
    {
      title: "Description of Item",
      dataIndex: "intrument_type",
      key: "intrument_type",
      align: "center",
      render: (value) => <p className="text-sm my-3 text-center w-full">{value?.instrument?.instrument_name}</p>,
    },
    {
      title: "Make",
      dataIndex: "make",
      key: "make",
      align: "center",
      sorter: true,
      filteredValue: filteredInfo.make || null,
      ...getColumnSearchProps("make"),
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      align: "center",
      sorter: true,
    },
    {
      title: "Lab Type",
      dataIndex: "labtype",
      key: "labtype",
      align: "center",
      filteredValue: filteredInfo.labtype || null,
      filters: LAB_TYPES.map((type) => ({
        text: type,
        value: type,
      })),
    },
    {
      title: "Id Number",
      dataIndex: "identification_details",
      key: "identification_details",
      align: "center",
      sorter: true,
      filteredValue: filteredInfo.identification_details || null,
      ...getColumnSearchProps("identification_details"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (value) => <StatusBadge value={value} />,
      filteredValue: filteredInfo.status || null,
      filters: config.SRF_ITEM_STATUS_LIST.map((status) => ({
        text: status,
        value: status,
      })),
      sorter: true,
    },
    {
      title: "Created At",
      dataIndex: "created_timestamp",
      key: "created_timestamp",
      align: "center",
      sorter: true,
      render: (value) => <p>{value ? format(new Date(value), 'dd-MM-yyyy hh:mm a') : ""}</p>,
    },
    {
      title: "Last Updated",
      dataIndex: "updated_timestamp",
      key: "updated_timestamp",
      align: "center",
      sorter: true,
      render: (value) => <p>{value ? format(new Date(value), 'dd-MM-yyyy hh:mm a') : ""}</p>,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      align: "center",
    },
  ];

  const duplicateItemHandler = async (row) => {
    try {
      const confirmDup = await showDuplicateDialog(
        `Do you want to create a duplicate item for '${row.intrument_type?.instrument_full_name || 'this item'}' with the same Inward Number (${row.inward_no})?`
      );

      if (!confirmDup) return;

      setPageLoading(true);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
          srf_id: row.srf_id,
          srf_item_id: row.srf_item_id,
          lab_id: auth.labId,
          userId: auth.userId,
        }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/duplicate-item", requestOptions);
      const data = await response.json();

      if (response.ok && data.code === 200) {
        GlobalNotification.success({
          title: "Item Duplicated",
          description: "Duplicate item created successfully with same inward number.",
        });
        fetchSRFItems(page, limit, searchText, selectedStatus, sortBy, sortOrder);
      } else {
        throw new Error(data.message || "Failed to duplicate item");
      }
    } catch (error) {
      console.error(error);
      GlobalNotification.error({
        title: "Duplication Failed",
        description: error.message || "Something went wrong",
      });
    } finally {
      setPageLoading(false);
    }
  };

  // Only add the Action column if the user has at least one item-level permission
  const canView = hasPermission("VIEW_SRF_ITEM");
  const canViewAudit = hasPermission("VIEW_SRF_ITEM_AUDIT");
  const canEdit = hasPermission("EDIT_SRF_ITEM");
  const canUpdate = hasPermission("UPDATE_RESULT");
  const canDelete = hasPermission("DELETE_SRF_ITEM");

  if (canView || canViewAudit || canEdit || canUpdate || canDelete) {
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
          canViewAudit && {
            key: "audit",
            icon: <FontAwesomeIcon icon={faHistory} />,
            label: "Audit",
            onClick: () => {
              setAuditItem(record);
              setIsAuditModal(true);
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
            key: "duplicate",
            icon: <FontAwesomeIcon icon={faCopy} />,
            label: "Duplicate Item",
            onClick: () => {
              duplicateItemHandler(record);
            },
          },
          canUpdate && {
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
    <div className="w-full max-w-[100vw] overflow-x-hidden mt-4">
      <div className="bg-white dark:bg-transparent rounded-xl shadow-sm">
        {pageLoading ? (
          <div className="overflow-x-auto">
            {/* Skeleton table header */}
            <div className="flex gap-3 mb-4 px-2">
              {[50, 80, 130, 100, 80, 100, 110, 90, 80, 80].map((w, i) => (
                <Skeleton.Input key={i} active size="small" style={{ width: w }} />
              ))}
            </div>
            {/* Skeleton table rows */}
            {[...Array(5)].map((_, row) => (
              <div key={row} className="flex gap-3 mb-3 px-2">
                {[50, 80, 130, 100, 80, 100, 110, 90, 80, 80].map((w, i) => (
                  <Skeleton.Input key={i} active size="small" style={{ width: w, height: 18 }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Table
            rowKey="slNo"
            dataSource={allitems}
            columns={columns}
            pagination={{
              current: page,
              pageSize: limit,
              total: totalItems,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50", "100"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            onChange={handleTableChange}
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
        )}
      </div>


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

      {/* Lifecycle Audit Trail Modal */}
      {isAuditModal && (
        <ItemAuditModal
          open={isAuditModal}
          onClose={() => {
            setIsAuditModal(false);
            setAuditItem(null);
          }}
          item={auditItem}
        />
      )}

    </div>
  );
};

export default FilteredItems;