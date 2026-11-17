import { useEffect, useState, useContext, useRef } from "react";
import { renderToString } from 'react-dom/server';
import { Card, TableWithBrowserPagination, Column, FileSelector, Modal, Spinner, MenuItem, Select } from "react-rainbow-components";
//import { Button, ButtonMenu,Input } from "react-rainbow-components";
import { useDispatch, useSelector } from "react-redux";
import { srfitemsActions } from "../../../store/srfitems";
import "./SRFItemsList.css";
import CustomButton from "../../Inputs/CustomButton";
import AddItemtoSRF from "./AddItemtoSRF";
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
import { usePermissions } from "../../../hooks/usePermissions";
import EnterResult from "./ResultComponent/EnterResult";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { formattedDate } from "../../helpers/Helper";
import { faBars, faEdit, faEllipsisV, faEye, faFile, faFileLines, faPrint, faRemove, faTrash, faUpload, faQrcode, faCopy, faHistory } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Loader from "../../UI/Loader";
import AddBulkItems from "../AddBulkItems/AddBulkItems";
import showConfirmationDialog, { showAdvancedDeleteDialog, showDuplicateDialog } from "../../../utils/showConfirmationToast";
import { Table, Dropdown, Menu, Input, Button, Checkbox, Typography, Modal as AntdModal, Skeleton, Select as AntdSelect } from "antd";
import { MoreOutlined, PlusOutlined, PrinterOutlined, DownloadOutlined, InfoCircleOutlined, CopyOutlined } from "@ant-design/icons";
const { Text, Title } = Typography

const statusfilteroptions = [
  { value: '', label: 'All' },
  { value: 'Not Calibrated', label: 'Not Calibrated' },
  { value: 'Calibrated', label: 'Calibrated' },
  { value: 'Report Generated', label: 'Report Generated' },
  { value: 'Dispatched', label: 'Dispatched' },
  { value: 'Report Dispatched', label: 'Report Dispatched' },
  { value: 'Invoice Generated', label: 'Invoice Generated' },
  { value: 'Payment Done', label: "Payment Done" }
];

const SRFItemsList = (props) => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const [modifiedItems, setModifiedItems] = useState([]);
  const [statusfilter, setStatusfilter] = useState(null);

  const [addItemModel, setAddItemModel] = useState(false);
  const [viewItemModel, setViewItemModel] = useState(false);
  const [editItemModel, setEditItemModel] = useState(false);
  const [updateItemModel, setUpdateItemModel] = useState(false);
  const [newfilemodal, setNewFileModal] = useState(false);

  const [viewItem, setViewItem] = useState();
  const [editItem, setEditItem] = useState();
  const [updateItem, setUpdateItem] = useState();
  const [isAuditModal, setIsAuditModal] = useState(false);
  const [auditItem, setAuditItem] = useState(null);
  const [files, setFiles] = useState([]);
  const [newfileerror, setNewFileError] = useState("");
  const [newfilemessage, setNewFileMessage] = useState("");
  const [isLoaded, setisLoaded] = useState(true);
  const [uploadinfo, setUploadInfo] = useState({});

  const [loading, setloading] = useState(false);

  const [isDcModal, setIsDcModal] = useState(false);
  const [dcModalLoader, setdcModalLoader] = useState(false);
  const [srfItemID, setsrfItemID] = useState("");

  const [returnAfterCalibration, setReturnAfterCalibration] = useState(false);
  const [sendForRepairs, setSendForRepairs] = useState(false);
  const [notForSale, setNotForSale] = useState(false);
  const [sendForCalibration, setsendForCalibration] = useState(false);
  const [returnableMaterial, setReturnableMaterial] = useState(false);

  const [mailSendResponse, setMailSendResponse] = useState("");

  // QR Code States
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrSelectedEq, setQrSelectedEq] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  //*** Enter Result States ***/
  const [srfItemInfo, setSrfItemInfo] = useState({});
  const [enterResultModal, setEnterResultModal] = useState(false);
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();

  // TODO: This is connected with SRF Items Listing By SRF Id
  const items = useSelector((state) => state.srfitems.list);
  const selecteditems = useSelector((state) => state.selecteditems.list);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalItems, setTotalItems] = useState(props.initialTotalItems || 0);
  const [sortBy, setSortBy] = useState("srf_item_id");
  const [sortOrder, setSortOrder] = useState("DESC");

  useEffect(() => {
    if (props.initialTotalItems) {
      setTotalItems(props.initialTotalItems);
    }
  }, [props.initialTotalItems]);

  useEffect(() => {
    if (items) {
      const modifieditems = items.filter((v) => (statusfilter ? statusfilter === v.status : true)).map((v, i) => ({
        ...v,
        description: v.intrument_type?.instrument_full_name || v.intrument_type?.instrument?.instrument_name,
        sno: (page - 1) * limit + i + 1,
        slNo: v.slNo || ((page - 1) * limit + i + 1)
      }));
      setModifiedItems(modifieditems);
    }
  }, [items, statusfilter, page, limit]);

  useEffect(() => {
    let updateModals = {};
    config.SRF_ITEM_STATUS_LIST.map((v, i) => {
      updateModals[v] = (v === statusfilter);
    })
    props.setupdateModals(updateModals)
  }, [statusfilter]);

  useEffect(() => {
    const channel = new BroadcastChannel("srf_update_channel");
    channel.onmessage = (event) => {
      if (event.data?.type === "REFRESH_SRF_ITEMS") {
        getSRFDetail();
      }
    };
    return () => {
      channel.close();
    };
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

  const handleChange = (value) => {
    setFiles(value);
    console.log(value);
    // setNewFileError();
    // setNewFileMessage();
  };

  const containerStyles = {
    maxWidth: 300,
  };

  const uploadModalHandler = (value) => {
    // console.log(value);
    setUploadInfo(value); // uploadinfo
    // const newstate = !newfilemodal;
    setNewFileModal(!newfilemodal);
    // setNewFileError();
    // setNewFileMessage();
  };

  const ViewButton = ({ row }) => (
    <Button
      variant="neutral"
      label="View"
      onClick={() => {
        // console.log(row);
        // setViewItem(modifiedItems[value - 1]);
        setViewItem(row);
        viewItemModelHandler();
      }}
    />
  );

  const EditButton = ({ row }) => (
    <Button
      variant="brand"
      label="Edit"
      onClick={() => {
        setEditItem(row);
        editItemModelHandler();
      }}
    />
  );

  const UpdateButton = ({ value }) => (
    <Button
      variant="success"
      label="Update"
      onClick={() => {
        console.log(value);
        setUpdateItem(modifiedItems[value - 1]);
        updateItemModelHandler();
      }}
    />
  );

  const DeleteButton = ({ row }) => (
    <Button
      variant="destructive"
      label="Delete"
      onClick={() => {
        deleteItemHandler(row);
      }}
    />
  );

  const deleteItemHandler = async ({ srf_id, srf_item_id, lab_id }) => {
    try {

      const confirmDelete = await showAdvancedDeleteDialog(
        "Are You Sure Want to Delete?",
        ".view__srf__modal"
      );

      if (!confirmDelete.isConfirmed) {
        console.log("Cancel Delete!");
        return;
      }
      setloading(true);

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

      let response = await fetch(config.Calibmaster.URL + "/api/srf/deleteitem", requestOptions);
      response = await response.json();

      GlobalNotification.success({
        title: "SRF Item Deleted",
        description: "SRF Item Deleted Successfully"
      });
      if (response?.data?.items) {
        dispatch(childSrfItemsActions.changesrfitems(response.data.items));
      }
      await getSRFDetail();

    } catch (error) {
      console.log(error);
      GlobalNotification.error({
        title: "Error while Deleting SRF Item!!",
      });
    } finally {
      setloading(false);
    }
  };


  const UploadButton = ({ value }) => (
    <Button
      variant="neutral"
      label="Upload"
      onClick={() => {
        uploadModalHandler(modifiedItems[value - 1]);
      }}
    />
  );

  const newFileModalHandler = () => {
    const newstate = !newfilemodal;
    setNewFileModal(newstate);
    setNewFileError();
    setNewFileMessage();
  };

  // *** Upload Certificate to Customer Portal ***
  const newfileHanlder = async () => {
    // return console.log(files[0]);
    // console.log(auth.labId);
    // return console.log(uploadinfo);
    // return console.log(props.srf);

    if (files.length < 1) {
      setNewFileError("File not Selected!!");
      setNewFileMessage("");
    }
    if (files.length > 0) {

      setloading(true);

      const description = uploadinfo?.intrument_type?.instrument_full_name?.split(" ")?.join("_");
      const unique_number = new Date().getTime();
      const filename = auth.labId + "_" + uploadinfo.srf_item_id + "_" + description + "_" + unique_number + ".pdf";

      const data = new FormData();
      data.append("file", files[0]);
      data.append("item", JSON.stringify(uploadinfo));
      data.append("companyId", props?.srf?.customer?.customer_id);
      data.append("srf_number", props?.srf?.srf_number);
      data.append("srfId", uploadinfo?.srf_id);
      data.append("srf_item_id", uploadinfo?.srf_item_id);
      data.append("labId", auth.labId);
      data.append("filename", filename);

      const requestOptions = {
        method: "POST",
        headers: { Authorization: "Bearer " + auth.token },
        body: data,
      };

      fetch(config.Calibmaster.URL + "/api/certificate/upload", requestOptions)
        .then(async (response) => {
          const data = await response.json();
          console.log(data);
          const code = data.code;
          if (code !== 200) {
            setNewFileError(data.message);
          } else {
            setFiles("");
            setNewFileError("");
            setNewFileMessage(data.message);
            setTimeout(() => {
              setNewFileModal(!newfilemodal);
            }, 1000);
          }
          setloading(false);
        })
        .catch((err) => {
          console.log(err);
          setNewFileError("Failed to upload certificate.");
          setloading(false)
        });

      try {
        const requestOptions = {
          method: "POST",
          headers: {
            Authorization: "Bearer " + auth.token,
          },
          body: data,
        };

        let response = await fetch(config.CustomerPortal.URL + "/api/certificate/upload", requestOptions);
        response = await response.json();
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    }
  };

  // *** First Delivery Challan Btn Function ***
  const deliveryChallanBtn = ({ value }) => (
    <Button
      variant="outline-brand" className="rainbow-m-around_medium"
      label="Send"
      onClick={() => {
        // console.log(value);
        setsrfItemID(value);
        setIsDcModal(true);
      }}
    />
  );

  // *** Close Delivery Challan Modal ***
  const closeDCModalHandler = () => {
    return setIsDcModal(false);
  };

  // *** Mail Delivery Function ***
  const sendDCHandler = async () => {
    try {
      setdcModalLoader(true);

      const lab_id = auth.labId;
      const srf_id = props.srfId;
      const srf_item_id = srfItemID;

      const requestBody = {
        lab_id, srf_id, srf_item_id,
        returnAfterCalibration, sendForRepairs, notForSale, sendForCalibration, returnableMaterial
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(requestBody),
      };

      let response = await fetch(config.Calibmaster.URL + "/api/delivery-challan/create", requestOptions)
      response = await response.json();

      if (response.code == 200) {
        setMailSendResponse(response.msg);
        setdcModalLoader(false);
        setTimeout(() => {
          closeDCModalHandler();
          setMailSendResponse("");
        }, 3000);
      } else {
        setdcModalLoader(false);
      }
    } catch (error) {
      console.log(error);
      GlobalNotification.error({
        title: "Something went wrong",
      });
    }
  }

  // *** Open Enter Result Modal ***
  const enterResultHanler = ({ row }) => (
    <Button
      variant="border" className="rainbow-m-around_medium"
      label="Result"
      onClick={() => {
        setSrfItemInfo(row);
        setEnterResultModal(true);
      }}
    />
  );

  // *** Close Delivery Challan Modal ***
  const closeEnterResultModalHandler = () => {
    return setEnterResultModal(false);
  };

  const handleShowQR = async (record) => {
    setQrSelectedEq(record);
    setQrModalVisible(true);
    setQrLoading(true);
    try {
      const response = await fetch(`${config.Calibmaster.URL}/api/qr/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ lab_id: auth.labId, identification_details: record.identification_details })
      });
      const data = await response.json();
      if (data.qrUrl) {
        setQrSelectedEq(prev => ({ ...prev, qrUrl: data.qrUrl }));
      } else {
        setQrModalVisible(false);
        GlobalNotification.error({ title: 'Error', description: 'Failed to generate QR token.' });
      }
    } catch (error) {
      console.error('Error fetching QR token:', error);
      setQrModalVisible(false);
      GlobalNotification.error({ title: 'Error', description: 'An error occurred while generating QR.' });
    } finally {
      setQrLoading(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg-item");
    if (!svg) return;

    if (!svg.getAttribute("xmlns")) {
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const padding = 20; // Add quiet zone for better scanning
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${qrSelectedEq.identification_details}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printQR = () => {
    const svg = document.getElementById("qr-code-svg-item");
    if (!svg) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print QR Code - ${qrSelectedEq.identification_details}</title>
                <style>
                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                    .container { text-align: center; padding: 20px; border: 1px dashed #ccc; }
                    h2 { margin-bottom: 5px; }
                    p { margin-top: 0; color: #555; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${svg.outerHTML}
                    <h2>${qrSelectedEq.identification_details}</h2>
                    <p>${qrSelectedEq.make || 'N/A'} - ${qrSelectedEq.model || 'N/A'}</p>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
  };

  const getSRFDetail = async (p = page, l = limit, sb = sortBy, so = sortOrder) => {
    try {
      setloading(true);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
          srfId: props.srfId,
          page: p,
          limit: l,
          sortBy: sb,
          sortOrder: so
        })
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/getsrfbyid", requestOptions);
      const data = await response.json();

      if (response.ok && data?.data) {
        dispatch(srfitemsActions.changesrfitems(data.data.items || []));
        setTotalItems(data.data.pagination?.totalItems || (data.data.items || []).length);
      } else {
        throw new Error(data?.message || "Error while Getting SRF Detail!!");
      }
    } catch (error) {
      console.error(error);
      GlobalNotification.error({
        title: "Error while Getting SRF Detail!!",
      });
    } finally {
      setloading(false);
    }
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (items && items.length > 0) {
        return;
      }
    }
    if (props.srfId) {
      getSRFDetail(page, limit, sortBy, sortOrder);
    }
  }, [props.srfId]);

  const handleTableChange = (paginationObj, filtersObj, sorterObj) => {
    const newPage = paginationObj?.current || 1;
    const newLimit = paginationObj?.pageSize || 5;
    let newSortBy = sortBy;
    let newSortOrder = sortOrder;

    if (sorterObj && sorterObj.field) {
      newSortBy = sorterObj.field;
      newSortOrder = sorterObj.order === "ascend" ? "ASC" : "DESC";
    }

    setPage(newPage);
    setLimit(newLimit);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    getSRFDetail(newPage, newLimit, newSortBy, newSortOrder);
  };

  const [dupModalVisible, setDupModalVisible] = useState(false);
  const [targetDupItem, setTargetDupItem] = useState(null);
  const [engineersList, setEngineersList] = useState([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState(null);

  const openDuplicateModal = async (itemRow) => {
    setTargetDupItem(itemRow);
    setSelectedEngineerId(null);
    setDupModalVisible(true);
    try {
      let calibUsers = [];
      const res = await fetch(`${config.Calibmaster.URL}/api/users/get-calibration-engineers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ lab_id: auth.labId }),
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        calibUsers = data.data;
      } else {
        const res2 = await fetch(`${config.Calibmaster.URL}/api/users/getall`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify({ labId: auth.labId }),
        });
        const data2 = await res2.json();
        if (res2.ok && data2?.data) {
          calibUsers = data2.data.filter(u => u.department === "Calibration" || u.department === "CSD");
        }
      }

      setEngineersList(calibUsers);

      const assignedIds = (items || [])
        .filter(i => i.inward_no === itemRow.inward_no && i.rstatus === 1 && i.assignedTo)
        .map(i => Number(i.assignedTo));

      const available = calibUsers.find(e => !assignedIds.includes(Number(e.id)));
      if (available) {
        setSelectedEngineerId(available.id);
      }
    } catch (err) {
      console.error("Error fetching engineers:", err);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!targetDupItem) return;
    try {
      setloading(true);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
          srf_id: targetDupItem.srf_id,
          srf_item_id: targetDupItem.srf_item_id,
          lab_id: auth.labId,
          userId: auth.userId,
          assignedTo: selectedEngineerId,
        }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/duplicate-item", requestOptions);
      const data = await response.json();

      if (response.ok && data.code === 200) {
        GlobalNotification.success({
          title: "Item Duplicated Successfully",
          description: "Duplicate item created with continuous Certificate No and ULR No!",
        });
        setDupModalVisible(false);
        setTargetDupItem(null);
        getSRFDetail();
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
      setloading(false);
    }
  };

  const ActionsComponent = ({ row }) => {

    return <ButtonMenu menuAlignment="center" menuSize="x-small" title='actions' buttonSize={'small'} icon={<FontAwesomeIcon icon={faEllipsisV} />} >
      {hasPermission("VIEW_SRF_ITEM") && (
        <MenuItem label="View" icon={<FontAwesomeIcon icon={faEye} />} iconPosition="left" onClick={(event) => {
          setViewItem(row);
          viewItemModelHandler();
        }} />
      )}

      {hasPermission("VIEW_SRF_ITEM_AUDIT") && (
        <MenuItem label="Audit" icon={<FontAwesomeIcon icon={faHistory} />} iconPosition="left" onClick={() => {
          setAuditItem(row);
          setIsAuditModal(true);
        }} />
      )}

      {hasPermission("EDIT_SRF_ITEM") && (
        <MenuItem label="Edit" icon={<FontAwesomeIcon icon={faEdit} />} iconPosition="left" onClick={(event) => {
          setEditItem(row);
          editItemModelHandler();
        }} />
      )}

      {hasPermission("EDIT_SRF_ITEM") && (
        <MenuItem label="Duplicate Item" icon={<FontAwesomeIcon icon={faCopy} />} iconPosition="left" onClick={(event) => {
          openDuplicateModal(row);
        }} />
      )}

      {hasPermission("EDIT_SRF_ITEM") && (
        <MenuItem label="Update" icon={<FontAwesomeIcon icon={faEdit} />} iconPosition="left" onClick={(event) => {
          setUpdateItem(row);
          updateItemModelHandler();
        }} />
      )}

      {hasPermission("DELETE_SRF_ITEM") && (
        <MenuItem label="Delete" icon={<FontAwesomeIcon icon={faTrash} />} iconPosition="left" onClick={(event) => {
          deleteItemHandler(row);
        }} />
      )}

      {hasPermission("UPLOAD_CERTIFICATE") && (
        <MenuItem label="Upload" icon={<FontAwesomeIcon icon={faUpload} />} iconPosition="left" onClick={(event) => {
          uploadModalHandler(row);
        }} />
      )}

      {hasPermission("EDIT_SRF_ITEM") && (
        <MenuItem label="Delivery Challan" icon={<FontAwesomeIcon icon={faFileLines} />} iconPosition="left" onClick={(event) => {
          setsrfItemID(row.srf_item_id);
          setIsDcModal(true);
        }} />
      )}

      {hasPermission("EDIT_SRF_ITEM") && row?.calibration_due_date && (
        <MenuItem label="Generate Label" icon={<FontAwesomeIcon icon={faPrint} />} iconPosition="left" onClick={(event) => {
          handleGenerateLabel(event, row)
        }} />
      )}

      {hasPermission("ENTER_RESULT") && (!hasPermission("ASSIGNED_ACTION_ONLY") || row.assignedTo === auth.userId) && (
        <MenuItem label="Enter Result" icon={<FontAwesomeIcon icon={faFile} />} iconPosition="left"
          onClick={() => {
            let openInNewTab = true;
            const { srf_item_id, srf_id, intrument_type_id } = row;
            if (openInNewTab) {
              window.open(
                import.meta.env.BASE_URL + `enter-result/${srf_item_id}/${srf_id}/${intrument_type_id}`,
                "_blank"
              );
            } else {
              setSrfItemInfo(row);
              setEnterResultModal(true);
            }
          }}
        />
      )}
    </ButtonMenu>
  };

  const handleGenerateLabel = async (e, row) => {
    //e.preventDefault();
    setloading(true);
    try {
      const custInfo = props?.srf?.customer;
      const labInfo = props?.srf?.lab;

      let qrValue = "";
      try {
        const response = await fetch(`${config.Calibmaster.URL}/api/qr/generate-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ lab_id: auth.labId, identification_details: row.identification_details })
        });
        const data = await response.json();
        if (data.qrUrl) {
          qrValue = data.qrUrl;
        } else {
          GlobalNotification.error({ title: 'Error', description: 'Failed to generate QR token for label.' });
          return;
        }
      } catch (error) {
        console.error('Error fetching QR token:', error);
        GlobalNotification.error({ title: 'Error', description: 'An error occurred while generating QR.' });
        return;
      }

      const qrData = {
        customerName: `${custInfo?.customer_name}, ${custInfo?.address1}, ${custInfo?.city}, ${custInfo?.state} - ${custInfo?.pincode}`,
        instrument: row?.description,
        make: row?.make,
        sr_no: row?.serial_no,
        cal_date: row?.calibration_done_date,
        due_date: row?.calibration_due_date,
        labName: labInfo?.lab_name,
        labLogoPath: labInfo?.brand_logo_filename,
        labAddress: `${labInfo?.address1}, ${labInfo?.city}, ${labInfo?.state} - ${labInfo?.pincode}`,
        contact: labInfo?.contact_number1,
      }
      const logo = localStorage.getItem("logo");
      const logoUrl = `${config.Calibmaster.URL}/images/${logo}`;
      const component = <Card className={'delivery-label'}>
        <div class="row">
          <img
            className="logoImage"
            src={logoUrl}
            alt="company logo"
          />
          <div class="lab-name-column"><h3>{labInfo?.lab_name}</h3></div>
        </div>
        <div class="row">
          <div class="column"></div>
          <div class="column">
            <span class="row"><b className="label-content">Customer: </b> {`${custInfo?.customer_name}, ${custInfo?.address1}, ${custInfo?.city}, ${custInfo?.state} - ${custInfo?.pincode}`}</span>
            <span class="row"><b className="label-content">Instrument: </b> {row?.description}</span>
            <span class="row"><b className="label-content">Make: </b> {row?.make}</span>
            <span class="row"><b className="label-content">Serial No: </b> {row?.serial_no}</span>
            <span class="row"><b className="label-content">Calibration Date: </b> {formattedDate(row?.calibration_done_date)}</span>
            <span class="row"><b className="label-content">Due Date: </b> {formattedDate(row?.calibration_due_date)}</span>
          </div>
          <div class="column"> <QRCode className="qr-code" value={qrValue} size={200} /></div>
        </div>

        <div class="footer"><span style={{ display: 'flex' }}>{`${labInfo?.address1}, ${labInfo?.city}, ${labInfo?.state} - ${labInfo?.pincode}`}</span>
          <span>Cell: {labInfo?.contact_number1}</span>
        </div>
      </Card>;

      // Create a dynamic HTML element
      const htmlString = renderToString(component);
      const divContainer = document.createElement('div');
      divContainer.id = `Card-${row?.serial_no}`;
      divContainer.style.width = '740px';

      // Dynamically generate HTML content including a logo image
      divContainer.innerHTML = htmlString;

      // Append the element temporarily to the body (hidden or off-screen)
      document.body.appendChild(divContainer);

      // Use html2canvas to capture the HTML element and download it
      const canvas = await html2canvas(divContainer, { useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `card-${row?.serial_no}.png`;
      link.click();

      // Remove the dynamically created element after the image is downloaded
      document.body.removeChild(divContainer);
    } finally {
      setloading(false);
    }
  };


  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
  };

  const handleReset = (clearFilters, confirm) => {
    clearFilters();
    confirm(); // ✅ ensures table data refreshes correctly after reset
  };


  const getColumnSearchProps = (dataIndex, nestedPath) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${nestedPath || dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginRight: 8 }}
        >
          Search
        </Button>
        <Button onClick={() => handleReset(clearFilters, confirm)}>
          Reset
        </Button>
      </div>
    ),
    onFilter: (value, record) => {
      // ✅ Support nested property like record.intrument_type.instrument_full_name
      const targetValue = nestedPath
        ? nestedPath.split('.').reduce((acc, key) => acc?.[key], record)
        : record[dataIndex];

      return targetValue
        ? targetValue.toString().toLowerCase().includes(value.toLowerCase())
        : false;
    },
  });


  const LAB_TYPES = ["NABL", "NON-NABL", "SERVICE"];

  const formatRanges = (ranges = []) => {
    if (!Array.isArray(ranges) || ranges.length === 0) return "";

    const parts = [];

    ranges.forEach((item) => {
      const rawUom = item.InstrumentparameterUOM || "";
      const uom = rawUom === "Select" ? "" : rawUom;

      Object.keys(item).forEach((key) => {
        if (
          key !== "InstrumentUOMID" &&
          key !== "InstrumentparameterUOM" &&
          key !== "Symbols" &&
          key !== "SymbolPos" &&
          key !== "isNaN"
        ) {
          parts.push(`${key}: ${item[key]}${uom}`);
        }
      });
    });

    return parts.join(", ");
  };


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
    // {
    //   title: "Description of Item",
    //   dataIndex: "intrument_type",
    //   key: "intrument_type",
    //   align: "center",
    //   //render: (value) => <p>{value?.instrument_full_name}</p>,
    //   //...getColumnSearchProps("intrument_type", "intrument_type.instrument_full_name"),
    //   render: (value) => <p>{value?.instrument?.instrument_name}</p>,
    //   ...getColumnSearchProps("intrument_type", "intrument_type.instrument.instrument_name"),
    // },
    {
      title: "Description of Item",
      dataIndex: "intrument_type",
      key: "intrument_type",
      align: "center",
      render: (value, row) => {
        const instrumentName =
          value?.instrument?.instrument_name || "";

        const rangeText = formatRanges(row?.ranges);

        return (
          <p className="text-sm my-3 text-center w-full">
            {instrumentName}
            {rangeText ? ` ${rangeText}` : ""}
          </p>
        );
      },
      ...getColumnSearchProps("intrument_type", "intrument_type.instrument.instrument_name"),
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
      title: "Calibration At",
      dataIndex: "calibrationAt",
      key: "calibrationAt",
      align: "center",
      ...getColumnSearchProps("calibrationAt"),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      align: "center",
    },
    {
      title: "Action",
      key: "action",
      fixed: 'right',
      align: "center",
      render: (_, row) => {
        const menuItems = [
          ...(hasPermission("VIEW_SRF_ITEM")
            ? [{
              key: "view",
              icon: <FontAwesomeIcon icon={faEye} />,
              label: "View",
              onClick: () => {
                setViewItem(row);
                viewItemModelHandler();
              },
            }] : []),
          ...(hasPermission("VIEW_SRF_ITEM_AUDIT")
            ? [{
              key: "audit",
              icon: <FontAwesomeIcon icon={faHistory} />,
              label: "Audit",
              onClick: () => {
                setAuditItem(row);
                setIsAuditModal(true);
              },
            }] : []),
          ...(hasPermission("EDIT_SRF_ITEM")
            ? [
              {
                key: "edit",
                icon: <FontAwesomeIcon icon={faEdit} />,
                label: "Edit",
                onClick: () => {
                  setEditItem(row);
                  editItemModelHandler();
                },
              },
              {
                key: "duplicate",
                icon: <FontAwesomeIcon icon={faCopy} />,
                label: "Duplicate Item",
                onClick: () => {
                  openDuplicateModal(row);
                },
              },
            ] : []),
          ...(hasPermission("DELETE_SRF_ITEM")
            ? [
              {
                key: "delete",
                icon: <FontAwesomeIcon icon={faTrash} />,
                label: "Delete",
                onClick: () => {
                  deleteItemHandler(row);
                },
              },
            ] : []),
          ...(hasPermission("UPLOAD_CERTIFICATE")
            ? [
              {
                key: "upload",
                icon: <FontAwesomeIcon icon={faUpload} />,
                label: "Upload",
                onClick: () => {
                  uploadModalHandler(row);
                },
              },
            ] : []),
          ...(hasPermission("GENERATE_DC")
            ? [
              {
                key: "deliveryChallan",
                icon: <FontAwesomeIcon icon={faFileLines} />,
                label: "Delivery Challan",
                onClick: () => {
                  setsrfItemID(row.srf_item_id);
                  setIsDcModal(true);
                },
              },
            ] : []),
          ...(hasPermission("UPDATE_RESULT") && (!hasPermission("ASSIGNED_ACTION_ONLY") || row.assignedTo === auth.userId)
            ? [
              {
                key: "update",
                icon: <FontAwesomeIcon icon={faEdit} />,
                label: "Update",
                onClick: () => {
                  setUpdateItem(row);
                  updateItemModelHandler();
                },
              },
            ] : []),
          ...(hasPermission("ACCESS_QR_CODES") ? row?.status === 'Report Generated'
            ? [
              {
                key: "viewQR",
                icon: <FontAwesomeIcon icon={faQrcode} />,
                label: "View QR",
                onClick: () => {
                  handleShowQR(row);
                },
              },
            ] : []
            : []),
          ...(hasPermission("ENTER_RESULT") && (!hasPermission("ASSIGNED_ACTION_ONLY") || row.assignedTo === auth.userId)
            ? [
              {
                key: "enterResult",
                icon: <FontAwesomeIcon icon={faFile} />,
                label: "Enter Result",
                onClick: () => {
                  const { srf_item_id, srf_id, intrument_type_id } = row;
                  window.open(
                    import.meta.env.BASE_URL + `enter-result/${srf_item_id}/${srf_id}/${intrument_type_id}`,
                    "_blank"
                  );
                },
              },
            ]
            : []),
          ...(hasPermission("GENERATE_LABEL")
            ? row?.calibration_due_date
              ? [
                {
                  key: "generateLabel",
                  icon: <FontAwesomeIcon icon={faPrint} />,
                  label: "Generate Label",
                  onClick: (event) => {
                    handleGenerateLabel(event, row);
                  },
                },
              ]
              : []
            : []),

        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}  >
            <MoreOutlined style={{ cursor: "pointer", fontSize: 18 }} />
          </Dropdown>
        );
      },
    }
  ];

  return (

    <div className="w-full max-w-[100vw] overflow-x-hidden mt-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 md:px-4 w-full gap-4">
        <h2 className='text-lg font-bold text-center md:text-left w-full md:w-auto'>SRF Items List</h2>


        {props.checkbox && hasPermission("FILTER_BY_STATUS") && (
          <div className="flex flex-row items-center justify-center md:justify-end w-full md:w-auto min-w-[250px]">
            <label className="mr-3 text-sm font-medium whitespace-nowrap text-gray-700">Filter By Status:</label>
            <Select
              options={statusfilteroptions}
              value={statusfilter}
              borderRadius="semi-rounded"
              onChange={(e) => setStatusfilter(e.target.value)}
              className="w-full max-w-[200px]"
            />
          </div>
        )}
      </div>

      <AddBulkItems srf={props.srf} />

      <Table
        rowKey="slNo"
        dataSource={modifiedItems}
        columns={columns}
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total: totalItems,
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content', y: 550 }}
        rowSelection={
          props.checkbox
            ? {
              onChange: (_, selectedRows) =>
                dispatch(selecteditemsActions.changeselecteditems(selectedRows)),
            }
            : null
        }
      />


      {
        (hasAnyPermission(["ADD_ITEM"]) && (props.srf?.allowAddItem || hasPermission("BYPASS_SRF_DATE_RESTRICTION"))) &&
          !statusfilter ? (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <Button onClick={addItemHandler} variant="filled" type="primary" icon={<PlusOutlined />}>
              Add Item
            </Button>
          </div>
        ) : null
      }


      {(loading || dcModalLoader) ? <Loader /> : ""}

      {/* Add Item Modal */}
      {addItemModel && (
        <AddItemtoSRF
          onclose={addItemHandler}
          isopen={addItemModel}
          srf={props.srf}
        />
      )}

      {/* View Item Modal */}
      {viewItemModel && (
        <ViewSRFItem
          onclose={viewItemModelHandler}
          item={viewItem}
          isOpen={viewItemModel}
        />
      )}

      {/* Edit Item Modal */}
      {editItemModel && (
        <EditSRFItem
          onclose={editItemModelHandler}
          item={editItem}
          isopen={editItemModel}
        />
      )}

      {/* Update Item Modal */}
      {updateItemModel && (
        <UpdateCal
          onclose={updateItemModelHandler}
          item={updateItem}
          isOpen={updateItemModel}
          srf={props?.srf}
          modalType="srf_items_list"
        />
      )}

      {/* Upload File Modal */}
      {newfilemodal && (
        <Modal id="modal-1" isOpen={newfilemodal} onRequestClose={newFileModalHandler}>
          <div className="new_file_modal">
            <h2>Upload Certificate</h2>
            <div>
              <FileSelector
                className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
                style={containerStyles}
                label="File selector"
                placeholder="Drag & Drop or Click to Browse"
                bottomHelpText="Select only one file"
                variant="multiline"
                onChange={handleChange}
              />
            </div>
            <div className="button_container">
              <Button
                onClick={newfileHanlder}
                variant="success"
                type="primary"
              >Upload</Button>

            </div>
            <p className="new_file_error" style={{ textAlign: "center" }}>
              {newfileerror}
            </p>
            <p className="new_file_success" style={{ textAlign: "center" }}>
              {newfilemessage}
            </p>
          </div>
        </Modal>
      )}

      {/* Delivery Challan Modal */}
      {isDcModal && (
        <Modal
          title="Send Delivery Challan"
          isOpen={isDcModal} onRequestClose={closeDCModalHandler}
          footer={null}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            <Checkbox onChange={(e) => setReturnAfterCalibration(e.target.checked)}>
              Returned after calibration
            </Checkbox>

            <Checkbox onChange={(e) => setSendForRepairs(e.target.checked)}>
              Sent for Repairs & Servicing
            </Checkbox>

            <Checkbox onChange={(e) => setNotForSale(e.target.checked)}>
              Not For Sale
            </Checkbox>

            <Checkbox onChange={(e) => setsendForCalibration(e.target.checked)}>
              Sent for Calibration
            </Checkbox>

            <Checkbox onChange={(e) => setReturnableMaterial(e.target.checked)}>
              Returnable Material
            </Checkbox>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Button
                type="primary"
                onClick={sendDCHandler}
              >
                Send Delivery Challan
              </Button>
            </div>

            {newfileerror && (
              <Text type="danger" style={{ textAlign: "center" }}>
                {newfileerror}
              </Text>
            )}

            {mailSendResponse && (
              <Text style={{ textAlign: "center", color: "green" }}>
                {mailSendResponse}
              </Text>
            )}

          </div>
        </Modal>
      )}

      {/* Enter Result Modal */}
      {enterResultModal && (
        <EnterResult
          isOpen={enterResultModal}
          onRequestClose={closeEnterResultModalHandler}
          srfItemInfo={srfItemInfo}
        />
      )}

      {/* Equipment QR Code Modal */}
      <AntdModal
        title="Equipment QR Code"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={printQR}>
            Print
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadQR}>
            Download PNG
          </Button>
        ]}
        centered
        width={500}
      >
        {qrSelectedEq && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
            {qrLoading ? (
              <div className="w-full space-y-4">
                <Skeleton.Button active block style={{ height: 200 }} />
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ) : (
              <>
                <div
                  style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px', cursor: 'pointer' }}
                  onClick={() => window.open(qrSelectedEq.qrUrl, '_blank')}
                  title="Click to test the QR code link"
                >
                  <QRCode
                    id="qr-code-svg-item"
                    value={qrSelectedEq.qrUrl}
                    size={200}
                    level="H"
                  />
                </div>
                <Title level={4} style={{ margin: '0 0 8px 0' }}>{qrSelectedEq.identification_details}</Title>
                <Text type="secondary" style={{ display: 'block' }}>Make: {qrSelectedEq.make || 'N/A'}</Text>
                <Text type="secondary" style={{ display: 'block' }}>Model: {qrSelectedEq.model || 'N/A'}</Text>
                {/* <Text type="secondary" style={{ display: 'block' }}>Serial: {qrSelectedEq.serial_no || 'N/A'}</Text> */}

                <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                  <InfoCircleOutlined className="text-blue-500 mt-1" />
                  <div className="flex-1">
                    <Text strong className="text-blue-800 text-xs block mb-1">USAGE NOTE</Text>
                    <Text className="text-[11px] text-blue-600 leading-relaxed">
                      Scanning this QR code will allow anyone to instantly access the Calibration Certificate and verify the authenticity of this equipment through our digital verification portal.
                    </Text>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </AntdModal>

      {/* Duplicate Item Modal */}
      <AntdModal
        title={
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-lg">
            <CopyOutlined /> Duplicate SRF Item
          </div>
        }
        open={dupModalVisible}
        onCancel={() => setDupModalVisible(false)}
        onOk={handleConfirmDuplicate}
        okText="Duplicate & Assign"
        cancelText="Cancel"
        confirmLoading={loading}
        okButtonProps={{ disabled: !selectedEngineerId, className: "bg-blue-600 border-none h-10 px-5 rounded-lg" }}
        cancelButtonProps={{ className: "h-10 rounded-lg" }}
        width={560}
        centered
      >
        {targetDupItem && (
          <div className="py-3 flex flex-col gap-4">
            {/* Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs flex flex-col gap-2">
              <div className="font-bold text-slate-700 text-sm mb-1">Item Specifications</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><span className="text-slate-400 font-medium">Inward No:</span> <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{targetDupItem.inward_no}</span></div>
                <div><span className="text-slate-400 font-medium">ID Number:</span> <span className="font-semibold text-slate-800">{targetDupItem.identification_details || 'N/A'}</span></div>
                <div className="col-span-2"><span className="text-slate-400 font-medium">Description:</span> <span className="font-semibold text-slate-800">{targetDupItem.description || targetDupItem.intrument_type?.instrument_full_name}</span></div>
                <div><span className="text-slate-400 font-medium">Make / Model:</span> <span className="font-semibold text-slate-800">{targetDupItem.make || 'N/A'} / {targetDupItem.model || 'N/A'}</span></div>
                <div><span className="text-slate-400 font-medium">Lab Type:</span> <span className="font-semibold text-slate-800">{targetDupItem.labtype || 'NABL'}</span></div>
              </div>
            </div>

            {/* Calibration Engineer Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Select Calibration Engineer <span className="text-red-500">*</span>
              </label>
              <AntdSelect
                className="w-full h-11"
                placeholder="Choose Calibration Engineer"
                value={selectedEngineerId}
                onChange={(val) => setSelectedEngineerId(val)}
              >
                {engineersList.map((eng) => {
                  const isAssigned = (items || []).some(
                    (i) => i.inward_no === targetDupItem.inward_no && i.rstatus === 1 && Number(i.assignedTo) === Number(eng.id)
                  );
                  return (
                    <AntdSelect.Option
                      key={eng.id}
                      value={eng.id}
                      disabled={isAssigned}
                    >
                      {eng.name} {isAssigned ? "(Already Assigned - Disabled)" : ""}
                    </AntdSelect.Option>
                  );
                })}
              </AntdSelect>
              {(items || []).filter(i => i.inward_no === targetDupItem.inward_no && i.rstatus === 1 && i.assignedTo).length > 0 && (
                <div className="text-[11px] text-slate-500 mt-1">
                  💡 Previously assigned calibration engineer(s) for this Inward No are disabled to avoid duplicate assignment.
                </div>
              )}
            </div>
          </div>
        )}
      </AntdModal>

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

export default SRFItemsList;
