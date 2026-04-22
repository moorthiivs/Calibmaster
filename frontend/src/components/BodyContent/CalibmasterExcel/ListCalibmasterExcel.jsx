import './style/listCalibmasterExcel.css'
import React, { useContext, useEffect, useState } from 'react'
import {
  ButtonIcon,
} from 'react-rainbow-components'
import { useDispatch } from 'react-redux'
import { AuthContext } from '../../../context/auth-context'
import config from '../../../utils/config.json'
import { notificationActions } from '../../../store/nofitication'
import Loader from '../../UI/Loader'
import { format, isEqual } from 'date-fns'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from "react-router-dom";
import ExcelTable from './ExcelTable/ExcelTable'
import { Link } from 'react-router-dom'
import ViewDiagramImage from './ViewDiagramImage'
import showConfirmationDialog from '../../../utils/showConfirmationToast'
import DataTable from "../../common/DataTable";
import { Button, Space, Tooltip, Input, Dropdown, Menu, notification, Modal, Select } from 'antd'
import { DeleteFilled, EditFilled, PlusOutlined, SearchOutlined, MoreOutlined, EyeFilled } from '@ant-design/icons'

function ListCalibmasterExcel() {
  const auth = useContext(AuthContext)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [ExcelFileData, setExcelFileData] = useState([])
  const [searchText, setSearchText] = useState('')

  const [isExcelopen, setisExcelopen] = useState(false)

  const [labType, setLabType] = useState('')
  const [sortOrder, setSortOrder] = useState('default')

  const [files, setfiles] = useState({})

  const [isviewDiagramImage, setisviewDiagramImage] = useState(false)

  const [viewDiagramImageData, setviewDiagramImageData] = useState({})

  const fetchCalibmasterExcelFile = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${config.Calibmaster.URL}/api/calibmasterexcel/fetch-calibmaster-excel/${auth.labId}`,
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + auth.token
          }
        }
      )

      const result = await response.json()


      if (response.ok) {
        setExcelFileData(result.result)
        notification.success({ message: `${result.response}`, duration: 1 });
      } else {
        notification.error({ message: result?.message || 'Failed to Fetch Excel.' });
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalibmasterExcelFile()
    const channel = new BroadcastChannel('excel_list_update');
    channel.onmessage = (event) => {
      if (event.data === 'REFRESH_EXCEL_LIST') {
        fetchCalibmasterExcelFile();
      }
    };

    return () => {
      channel.close();
    };
  }, [])

  const search = searchText.trim().toLowerCase();

  const filteredData = ExcelFileData.filter(item => {
    const procedure = item?.master_design_procedure;
    if (!procedure) return false;

    const calibrationMatch =
      procedure.calibration_procedure?.trim().toLowerCase().includes(search);

    const instrumentMatch =
      procedure.instrument_type?.instrument_full_name
        ?.trim()
        .toLowerCase()
        .includes(search);



    const labTypeMatch =
      !labType || procedure.instrument_type?.labtype === labType;

    // Return true only if:
    // (calibrationMatch AND labTypeMatch) OR (instrumentMatch AND labTypeMatch)
    return (calibrationMatch && labTypeMatch) || (instrumentMatch && labTypeMatch);
  });

  // Apply sort / filter based on sortOrder
  const sortedData = (() => {
    if (sortOrder === 'updated') {
      // Only records that have been edited (updatedAt differs from createdAt)
      return [...filteredData]
        .filter(item => {
          const c = new Date(item.createdAt);
          const u = new Date(item.updatedAt);
          return !isEqual(c, u);
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    // Default: already sorted by cmeid DESC from the server
    return filteredData;
  })();


  const handleView = file => {
    console.log('View file:', file)
  }

  const handleEdit = file => {
    setisExcelopen(true)
    setfiles(file)
    console.log('Edit file:', file)
  }

  const handleDelete = async file => {
    try {

      const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?");

      if (!confirmDelete) {
        console.log("Cancel Delete!");
        return;
      }
      setLoading(true)

      if (confirmDelete) {
        const response = await fetch(
          `${config.Calibmaster.URL}/api/calibmasterexcel/delete-calibmaster-excel`,
          {
            method: 'Delete',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + auth.token
            },
            body: JSON.stringify({
              lab_id: file.labid,
              master_design_procedure_id: file.master_design_procedure_id,
              filename: file.FileName,
              Fileid: file.cmeid
            })
          }
        )
        const result = await response.json()

        if (response.ok) {
          fetchCalibmasterExcelFile()
          notification.success({ message: `${result?.msg}` });
        } else {
          notification.error({ message: result?.msg || 'Failed to Fetch Excel.' });
        }
      } else {
        console.log(`Deletion canceled for ${file}.`)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return format(date, 'dd-MM-yyyy hh:mm a')
  }

  const CreatedDateComponent = ({ row }) => {
    if (!row || !row.createdAt) {
      return <span style={{ display: 'block', textAlign: 'center' }}>NA</span>
    }
    return (
      <span style={{ display: 'block', textAlign: 'center' }}>
        {formatDate(row.createdAt)}
      </span>
    )
  }

  const UpdatedDateComponent = ({ row }) => {
    const date1 = new Date(row.createdAt)
    const date2 = new Date(row.updatedAt)
    const areDatesEqual = isEqual(date1, date2)

    if (!row || !row.updatedAt || areDatesEqual) {
      return <span style={{ display: 'block', textAlign: 'center' }}>NA</span>
    }
    return (
      <span style={{ display: 'block', textAlign: 'center' }}>
        {formatDate(row.updatedAt)}
      </span>
    )
  }


  const ActionButtons = ({ row }) => (
    <Space style={{ justifyContent: "center", width: "100%" }}>
      <Button
        type="primary"
        icon={<EditFilled />}
        onClick={() => {
          sessionStorage.setItem("excelTableData", JSON.stringify(row));
          window.open(import.meta.env.BASE_URL + "exceltable", "_blank");
        }}
      >
        Edit File
      </Button>
    </Space>
  );


  const DeleteButtons = ({ row }) => (
    <Space style={{ justifyContent: "center", width: "100%" }}>
      <Button
        type="primary"
        icon={<DeleteFilled />}
        danger
        onClick={() => handleDelete(row)}
      >
        Delete Excel File
      </Button>
    </Space>
  );



  const viewDiagramImage = ({ row }) => {
    if (!row || !row.diagram_image || row.diagram_image.length === 0) {
      return <span style={{ display: "block", textAlign: "center" }}>No Diagrams</span>;
    }

    return (
      <Space style={{ justifyContent: "center", width: "100%" }}>
        <Button
          type="default"
          onClick={() => {
            setisviewDiagramImage(true);
            setviewDiagramImageData(row);
          }}
        >
          View Diagram
        </Button>
      </Space>
    );
  };



  const instrument_type_spec = ['Attribute', 'Variable']

  const ActionMenu = ({ row }) => {
    const menuItems = [
      auth.permissions.includes("EDIT_EXCEL") && {
        key: "edit",
        label: "Edit File",
        icon: <EditFilled />,
        onClick: () => {
          sessionStorage.setItem("excelTableData", JSON.stringify(row));
          window.open(import.meta.env.BASE_URL + "exceltable", "_blank");
        },
      },
      {
        key: "view",
        label: "View Diagram",
        icon: <EyeFilled />,
        onClick: () => {
          setisviewDiagramImage(true);
          setviewDiagramImageData(row);
        },
        //disabled: !row?.diagram_image || row.diagram_image.length === 0,
      },
      auth.permissions.includes("DELETE_EXCEL") && {
        key: "delete",
        label: "Delete Excel File",
        icon: <DeleteFilled />,
        danger: true,
        onClick: () => handleDelete(row),
      },
    ].filter(Boolean);

    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        placement="bottomCenter"
      >
        <Button icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  const columns = [
    {
      title: "Procedure Name",
      dataIndex: ["master_design_procedure", "calibration_procedure"],
      key: "procedureName",
      align: "center",
      render: (_, row) =>
        row.master_design_procedure?.calibration_procedure || "N/A",
    },
    {
      title: "Instrument Name",
      dataIndex: ["master_design_procedure", "instrument_type"],
      key: "instrument_full_name",
      align: "center",
      render: (_, row) =>
        row.master_design_procedure?.instrument_type?.instrument_full_name || "N/A",
    },

    {

      title: "Category of Instruments",
      dataIndex: ["master_design_procedure", "instrument_type"],
      key: "instrument_type_spec",
      align: "center",
      render: (_, row) =>
        row.master_design_procedure?.instrument_type?.instrument_type_spec || "N/A",
      filters: instrument_type_spec.map((type) => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.master_design_procedure?.instrument_type?.instrument_type_spec === value,
    },
    {

      title: "labtype",
      dataIndex: ["master_design_procedure", "instrument_type"],
      key: "labtype",
      align: "center",
      render: (_, row) =>
        row.master_design_procedure?.instrument_type?.labtype || "N/A",
    },
    // {
    //   title: "File Name",
    //   dataIndex: "FileName",
    //   key: "FileName",
    //   align: "center",
    // },
    {
      title: "Created Date",
      key: "createdAt",
      align: "center",
      render: (_, row) => <CreatedDateComponent row={row} />,
    },
    {
      title: "Updated Date",
      key: "updatedAt",
      align: "center",
      render: (_, row) => <UpdatedDateComponent row={row} />,
    },
    auth.permissions.includes("EDIT_EXCEL") && {
      title: "Edit File",
      key: "edit",
      align: "center",
      render: (_, row) => <ActionButtons row={row} />,
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, row) => <ActionMenu row={row} />,
    },
  ].filter(Boolean);



  return (
    <>
      <div
        className="search-input"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10px",
          gap: "20px",
        }}
      >
        <Input
          placeholder="Search by Procedure or Filename..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 300 }}
          size='large'
        />

        <Select
          placeholder="Select Lab Type"
          style={{ width: 200 }}
          size="large"
          value={labType || undefined}
          onChange={(value) => setLabType(value ?? '')}
          allowClear
        >
          <Select.Option value="NABL">NABL</Select.Option>
          <Select.Option value="NON-NABL">Non-NABL</Select.Option>
        </Select>

        <Select
          placeholder="Sort / Filter"
          style={{ width: 200 }}
          size="large"
          value={sortOrder}
          onChange={(value) => setSortOrder(value)}
        >
          <Select.Option value="default">Default (Newest First)</Select.Option>
          <Select.Option value="updated">Updated (Latest First)</Select.Option>
        </Select>

        {auth.permissions.includes("CREATE_EXCEL") && (
          <Tooltip title="Add New Calibmaster Excel Sheet">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size='large'
              onClick={() => {
                navigate("/dashboard/excel/create");
              }}
            />
          </Tooltip>
        )}
      </div>


      <DataTable
        columns={columns}
        data={sortedData}
        loading={loading}
        pageSize={10}
        showSerialNo={true}
        rowKey={(record) => record.cmeid}
      />






      {/* {loading && <Loader />} */}

      {isExcelopen && (
        <Modal
          size='large'
          open={isExcelopen}
          onCancel={() => {
            setisExcelopen(false)
          }}
          style={{ width: '100vw', height: '100%' }}
          title={files.FileName}
        >
          <ExcelTable file={files} isModalOpen={isExcelopen} />
        </Modal>
      )}

      {isviewDiagramImage && (
        <Modal
          open={isviewDiagramImage}
          onCancel={() => {
            setisviewDiagramImage(false)
            fetchCalibmasterExcelFile()

          }}
          title={files.FileName}
          footer={null}
          centered={true}
          width="80%"
        >
          <ViewDiagramImage viewDiagramImageData={viewDiagramImageData} auth={auth} />
        </Modal>
      )}
    </>
  )
}

export default ListCalibmasterExcel
