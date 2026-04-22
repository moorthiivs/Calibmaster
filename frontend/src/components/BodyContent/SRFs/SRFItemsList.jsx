import { useEffect, useState, useContext } from "react";
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
import EditSRFItem from "./EditSRFItem";
import StatusBadge from "../../UI/StatusBadge";
import UpdateCal from "./UpdateCal";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { usePermissions } from "../../../hooks/usePermissions";
import EnterResult from "./ResultComponent/EnterResult";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { formattedDate } from "../../helpers/Helper";
import { faBars, faEdit, faEllipsisV, faEye, faFile, faFileLines, faPrint, faRemove, faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Loader from "../../UI/Loader";
import AddBulkItems from "../AddBulkItems/AddBulkItems";
import showConfirmationDialog from "../../../utils/showConfirmationToast";
import { Table, Dropdown, Menu, Input, Button, Checkbox, Typography, notification } from "antd";
import { MoreOutlined, PlusOutlined } from "@ant-design/icons";
const { Text } = Typography

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

  //*** Enter Result States ***/
  const [srfItemInfo, setSrfItemInfo] = useState({});
  const [enterResultModal, setEnterResultModal] = useState(false);
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();

  // TODO: This is connected with SRF Items Listing By SRF Id
  const items = useSelector((state) => state.srfitems.list);
  const selecteditems = useSelector((state) => state.selecteditems.list);

  useEffect(() => {
    if (items) {
      const modifieditems = items.filter((v) => (statusfilter ? statusfilter === v.status : true)).map((v, i) => ({
        ...v,
        description: v.intrument_type.instrument_full_name,
        sno: i + 1,
      }));
      setModifiedItems(modifieditems);
    }
  }, [items, statusfilter]);

  useEffect(() => {
    let updateModals = {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false
    };
    config.SRF_ITEM_STATUS_LIST.map((v, i) => {
      updateModals[i] = (v === statusfilter);
    })
    props.setupdateModals(updateModals)
  }, [statusfilter]);

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

      const confirmDelete = await showConfirmationDialog(
        "Are You Sure Want to Delete?",
        ".view__srf__modal"
      );

      if (!confirmDelete) {
        console.log("Cancel Delete!");
        return;
      }
      setloading(true);

      const requestBody = { srf_id, srf_item_id, lab_id, userId: auth.userId };
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

      const newnotification = {
        title: "SRF Item Deleted Successfully!!",
        icon: "success",
        state: true,
        timeout: 15000,
      };

      await getSRFDetail();
      //dispatch(notificationActions.changenotification(newnotification));
      notification.success({ message: "SRF Item Deleted Successfully" });
      dispatch(childSrfItemsActions.changesrfitems(response?.data?.items));

    } catch (error) {
      console.log(error);
      dispatch(notificationActions.changenotification({
        title: "Error while Deleting SRF Item!!",
        icon: "error",
        state: true,
        timeout: 15000,
      }));
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
      const newNotification = {
        title: "Something went wrong",
        description: "",
        icon: "error",
        state: true,
        timeout: 1500,
      };
      setdcModalLoader(false);
      dispatch(notificationActions.changenotification(newNotification));
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


  const getSRFDetail = async () => {

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ srfId: props.srfId })
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
        dispatch(srfitemsActions.changesrfitems(data.data.items));
        const labInfo = data?.data?.srf?.lab;

      })
      .catch((err) => {
        console.log(err);
        dispatch(notificationActions.changenotification(errornotification));
      });
  };

  const ActionsComponent = ({ row }) => {

    return <ButtonMenu menuAlignment="center" menuSize="x-small" title='actions' buttonSize={'small'} icon={<FontAwesomeIcon icon={faEllipsisV} />} >
      {hasPermission("VIEW_SRF_ITEM") && (
        <MenuItem label="View" icon={<FontAwesomeIcon icon={faEye} />} iconPosition="left" onClick={(event) => {
          setViewItem(row);
          viewItemModelHandler();
        }} />
      )}

      {hasPermission("EDIT_SRF_ITEM") && (
        <MenuItem label="Edit" icon={<FontAwesomeIcon icon={faEdit} />} iconPosition="left" onClick={(event) => {
          setEditItem(row);
          editItemModelHandler();
        }} />
      )}

      {hasPermission("EDIT_SRF_ITEM") && (
        <MenuItem label="Update" icon={<FontAwesomeIcon icon={faEdit} />} iconPosition="left" onClick={(event) => {
          setUpdateItem(modifiedItems[row.sno - 1]);
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
          uploadModalHandler(modifiedItems[row.sno - 1]);
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

      {hasPermission("ENTER_RESULT") && (
        <MenuItem label="Enter Result" icon={<FontAwesomeIcon icon={faFile} />} iconPosition="left"
          onClick={() => {
            let openInNewTab = true;
            const { srf_item_id, srf_id, intrument_type_id } = row;
            if (openInNewTab) {
              window.open(
                `/enter-result/${srf_item_id}/${srf_id}/${intrument_type_id}`,
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
    const custInfo = props?.srf?.customer;
    const labInfo = props?.srf?.lab;
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
        <div class="column"> <QRCode className="qr-code" value={JSON.stringify(qrData)} size={200} /></div>
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
      const uom = item.InstrumentparameterUOM || "";

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
          {
            key: "view",
            icon: <FontAwesomeIcon icon={faEye} />,
            label: "View",
            onClick: () => {
              setViewItem(row);
              viewItemModelHandler();
            },
          },
          ...(hasPermission("EDIT_SRF_ITEM") || hasPermission("ACCESS_SRF")
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
            ] : []),
          ...(hasPermission("DELETE_SRF_ITEM") || hasPermission("ACCESS_SRF")
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
          ...(hasPermission("UPLOAD_CERTIFICATE") || hasPermission("ACCESS_SRF")
            ? [
              {
                key: "upload",
                icon: <FontAwesomeIcon icon={faUpload} />,
                label: "Upload",
                onClick: () => {
                  uploadModalHandler(modifiedItems[row.sno - 1]);
                },
              },
            ] : []),
          ...(hasPermission("GENERATE_DC") || hasPermission("ACCESS_SRF")
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
          ...(hasPermission("UPDATE_RESULT")
            ? [
              {
                key: "update",
                icon: <FontAwesomeIcon icon={faEdit} />,
                label: "Update",
                onClick: () => {
                  setUpdateItem(modifiedItems[row.sno - 1]);
                  updateItemModelHandler();
                },
              },
            ] : []),
          ...(hasPermission("ENTER_RESULT")
            ? [
              {
                key: "enterResult",
                icon: <FontAwesomeIcon icon={faFile} />,
                label: "Enter Result",
                onClick: () => {
                  const { srf_item_id, srf_id, intrument_type_id } = row;
                  window.open(
                    `/enter-result/${srf_item_id}/${srf_id}/${intrument_type_id}`,
                    "_blank"
                  );
                },
              },
            ]
            : []),
          ...(hasPermission("ACCESS_REPORTS")
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

    <div >
        <div className="items__label" style={{ marginBottom: "60px" }}>
          <h2 className='text-lg font-bold my-5 text-center'>SRF Items List</h2>


          {props.checkbox && (
            <>
              <div className="status__filter__container">
                <label style={{ marginRight: "10px" }}>Filter By Status:</label>
                <Select
                  options={statusfilteroptions}
                  value={statusfilter}
                  borderRadius="semi-rounded"
                  onChange={(e) => setStatusfilter(e.target.value)}
                />
              </div>
            </>


          )}
        </div>

        <AddBulkItems srf={props.srf} />

        <Table
          rowKey="slNo"
          dataSource={modifiedItems}
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


        {
          hasAnyPermission(["CREATE_SRF", "ACCESS_SRF"]) &&
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
    </div>

  );
};

export default SRFItemsList;
