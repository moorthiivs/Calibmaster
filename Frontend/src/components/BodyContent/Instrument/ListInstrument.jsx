import { useContext, useState, useEffect } from "react";
import { Card, Input, Button, Tooltip, Dropdown, Table, Space, Tag, Typography } from "antd";
import GlobalNotification from "../../../utils/GlobalNotification";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ToolOutlined,
  TagOutlined,
  ExperimentOutlined,
  DeploymentUnitOutlined,
  FileExcelOutlined
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { usePermissions } from "../../../hooks/usePermissions";
import config from "../../../utils/config.json";
import { useNavigate } from "react-router-dom";
import { instrumentIdActions } from "../../../store/instrumentId";
import { addNewId, searchByNameFunction } from "./higherOrderFunction";
import PageHeader from "../../UI/PageHeader";
import showConfirmationDialog from "../../../utils/showConfirmationToast";
import BulkUploadInstrumentModal from "./BulkUploadInstrumentModal";
import ReusableTable from "../../Table/ReusableTable";
const { Text } = Typography;

const ListInstrument = () => {
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [instrumentList, setInstrumentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originalList, setOriginalList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [bulkUploadModal, setBulkUploadModal] = useState(false);

  const fetchInstrument = async () => {
    try {
      setLoading(true);
      const data = await fetch(config.Calibmaster.URL + "/api/instrument/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ lab_id: auth.labId }),
      });

      let response = await data.json();
      const formattedData = await addNewId(response.data);

      setInstrumentList(formattedData);
      setOriginalList(formattedData);
      setLoading(false);
    } catch (error) {
      console.error(error);
      GlobalNotification.error({
        title: "Fetch Error",
        description: "Something went wrong while fetching instruments"
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstrument();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    const query = value.toLowerCase().trim();

    if (query !== "") {
      const result = originalList.filter((item) =>
        (item.instrument_name || "").toLowerCase().includes(query) ||
        (item.uom_name || "").toLowerCase().includes(query) ||
        (item.instrument_discipline || "").toLowerCase().includes(query) ||
        (item.group_details || "").toLowerCase().includes(query)
      );
      setInstrumentList(result);
    } else {
      setInstrumentList(originalList);
    }
  };

  const redirectHandler = (id) => {
    dispatch(instrumentIdActions.setInstrumentId(id));
    navigate("/dashboard/instruments/edit");
  };

  const handleDelete = async (id) => {
    try {
      const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?");

      if (!confirmDelete) return;

      const bodyData = {
        instrument_id: id,
        labid: auth.labId,
        userid: auth.userId
      }
      const response = await fetch(config.Calibmaster.URL + "/api/instrument/instrument-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(bodyData),
      })
      if (response.ok) {
        await fetchInstrument();
        GlobalNotification.success({
          title: "Instrument Deleted",
          description: "Instrument Deleted Successfully"
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  const columns = [
    {
      title: 'S. No',
      key: 'sno',
      width: 70,
      align: 'center',
      render: (_, __, index) => <Text type="secondary" strong>{index + 1}</Text>,
    },
    {
      title: "Instrument Details",
      key: "instrument_details",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-blue-600">{record.instrument_name}</Text>
          <Space size={4}><TagOutlined className="text-slate-400" /><Text type="secondary" className="text-xs">ID: {record.instrument_id}</Text></Space>
        </Space>
      ),
      sorter: (a, b) => a.instrument_name.localeCompare(b.instrument_name),
    },
    {
      title: "Unit of Measurement",
      dataIndex: "uom_name",
      key: "uom_name",
      render: (text) => <Tag color="cyan">{text}</Tag>,
    },
    {
      title: "Discipline",
      dataIndex: "instrument_discipline",
      key: "instrument_discipline",
      render: (text) => (
        <Space>
          <ExperimentOutlined className="text-purple-500" />
          <Text className="text-slate-600">{text}</Text>
        </Space>
      ),
    },
    {
      title: "UOM Group",
      dataIndex: "group_details",
      key: "group_details",
      render: (text) => (
        <Space>
          <DeploymentUnitOutlined className="text-emerald-500" />
          <Text className="text-slate-500 italic">{text}</Text>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: 'center',
      render: (_, row) => (
        <Space>
          {hasPermission("EDIT_INSTRUMENT") && (
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined className="text-blue-600" />}
                onClick={() => redirectHandler(row.instrument_id)}
              />
            </Tooltip>
          )}
          {hasPermission("DELETE_INSTRUMENT") && (
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(row.instrument_id)}
              />
            </Tooltip>
          )}
        </Space>
      )
    },
  ];

  return (
    <>
      <div className="p-6">
        <PageHeader
          title="Instrument List"
          breadcrumbItems={[
            { title: 'Dashboard' },
            { title: 'Instrument' },
            { title: 'Instrument Details' },
          ]}
          searchText={searchText}
          onSearchChange={handleSearch}
          searchPlaceholder="Search by name, UOM, or discipline..."
          actionButtonText="Add Instrument"
          onActionClick={() => navigate("/dashboard/instruments/create")}
          actionButtonIcon={<PlusOutlined />}
          showActionButton={hasPermission("CREATE_INSTRUMENT")}
          extraAction={
            hasPermission("CREATE_INSTRUMENT") && (
              <Button
                size="large"
                icon={<FileExcelOutlined />}
                onClick={() => setBulkUploadModal(true)}
                className="h-11 px-6 rounded-xl font-semibold border-emerald-400 text-emerald-700 hover:bg-emerald-50 transition-all"
                style={{
                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  borderColor: "#6ee7b7",
                  color: "#047857",
                  fontWeight: 600,
                }}
              >
                Bulk Upload
              </Button>
            )
          }
        />

        <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
          <ReusableTable
            columns={columns}
            data={instrumentList}
            rowKey="instrument_id"
            loading={loading}
            className="instrument-table"
          />

          <style>{`
          .instrument-table .ant-table-thead > tr > th {
            background: #f8fafc !important;
            color: #1e293b !important;
            font-weight: 700 !important;
            font-size: 13px !important;
            padding: 12px 16px !important;
          }
          .instrument-table .ant-table-tbody > tr > td {
            font-size: 13px !important;
            padding: 12px 16px !important;
            color: #334155 !important;
          }
          .instrument-table .ant-table-row:hover {
            cursor: pointer;
          }
          .ant-card-body {
            padding: 0 !important;
          }
        `}</style>
        </Card>
      </div>

      {bulkUploadModal && (
        <BulkUploadInstrumentModal
          isopen={bulkUploadModal}
          onclose={() => setBulkUploadModal(false)}
          onSuccess={() => fetchInstrument()}
        />
      )}
    </>
  );
};

export default ListInstrument;

