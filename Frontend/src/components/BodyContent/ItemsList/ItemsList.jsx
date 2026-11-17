import { useContext, useEffect, useState } from "react";
import { Card, Table, Button, Popconfirm, Modal, Form } from "antd";
import { PlusOutlined, DeleteOutlined, SendOutlined, EditOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { itemsActions } from "../../../store/items";
import GlobalNotification from "../../../utils/GlobalNotification";
import { AuthContext } from "../../../context/auth-context";
import AddItem from "../AddItem/AddItem";
import AddBulkItems from "../AddBulkItems/AddBulkItems";
import AddItemForm from "../Forms/AddItemForm";
import config from "../../../utils/config.json";
import { populateUomWithsysmbol } from "../Instrument/HelperFunction";

const ItemsList = (props) => {

  const items = useSelector((state) => state.items.list);
  const [modifiedItems, setModifiedItems] = useState([]);
  const [addItemModel, setAddItemModel] = useState(false);
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);

  // ── Edit State ──────────────────────────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editForm] = Form.useForm();
  const [editDescription, setEditDescription] = useState("");
  const [editInstrumentName, setEditInstrumentName] = useState("");
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [UOM, setUOM] = useState([]);
  const [instrumentCategories, setInstrumentCategories] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (items) {
      const modifieditems = items.map((v, i) => ({
        ...v,
        sno: i + 1
      }));
      setModifiedItems(modifieditems);
    }
  }, [items]);

  const addItemHandler = () => {
    const isopen = addItemModel;
    setAddItemModel(!isopen);
  };

  const itemdeleteHandler = (v) => {
    const delindex = v - 1;
    dispatch(itemsActions.removeitem(delindex));
  };

  // ── Edit Helpers ────────────────────────────────────────────────────
  const fetchEditData = async () => {
    try {
      const [makeRes, modelRes, uomRes, catRes] = await Promise.all([
        fetch(config.Calibmaster.URL + "/api/makemodel/make", {
          headers: { Authorization: `Bearer ${auth.token}` }
        }),
        fetch(config.Calibmaster.URL + "/api/makemodel/model", {
          headers: { Authorization: `Bearer ${auth.token}` }
        }),
        fetch(config.Calibmaster.URL + "/api/uom/list", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
        }),
        fetch(config.Calibmaster.URL + "/api/instrument-types/listCategoryofInstruments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify({ lab_id: auth.labId }),
        }),
      ]);

      const makeData = await makeRes.json();
      const modelData = await modelRes.json();
      const uomData = await uomRes.json();
      const catData = await catRes.json();

      setMakes(makeData);
      setModels(modelData);
      const getUomData = await populateUomWithsysmbol(uomData.data);
      setUOM(getUomData);
      if (catData.success && Array.isArray(catData.data)) {
        setInstrumentCategories(catData.data);
      }
    } catch (err) {
      console.error("Failed to load edit dependencies", err);
    }
  };

  const handleEditClick = async (record) => {
    const idx = record.sno - 1;
    const item = items[idx];
    if (!item) return;

    setEditIndex(idx);
    setEditDescription(item.description || "");
    setEditInstrumentName(item.name || "");
    setEditLoading(true);
    setEditModalOpen(true);

    await fetchEditData();

    // Pre-fill the form with the item's data
    const paramEntries = Array.isArray(item.ranges)
      ? item.ranges.map((row) => {
        const paramName = Object.keys(row).find(
          (key) =>
            key !== "InstrumentUOMID" &&
            key !== "InstrumentparameterUOM" &&
            key !== "Symbols" &&
            key !== "SymbolPos" &&
            key !== "isNaN"
        );
        return {
          parameterName: paramName || "",
          value: row[paramName] || "",
          uom_id: row.InstrumentUOMID || "",
          Symbols: row.Symbols || "",
          SymbolPos: row.SymbolPos || "Prefix",
          isNaN: row.isNaN || false,
        };
      })
      : [];

    editForm.setFieldsValue({
      labType: item.labtype || "NABL",
      Category: item.instrument_type_at_calibration ? "Variable" : "Attribute",
      instrumentType: item.masterlistId,
      intrument_type_id: item.masterlistId, // AddItemForm's edit useEffect reads this field
      make: item.make,
      model: item.model,
      serialNumber: item.serialno,
      assetId: item.idno,
      remarks: item.remarks,
      calibrationAt: item.calibrationAt || "Metrology Lab",
      reminderFrequency: item.reminder_frequency,
      reminderDays: item.frequency_days,
      type: item.instrument_type_at_calibration,
      assignedTo: item.assignedTo,
      parameters: paramEntries,
      instrumentUOM: item.instrumentData?.uom_id || "",
    });

    setEditLoading(false);
  };

  const handleEditSave = async (values) => {
    const dbParams = values.parameters.map((param) => ({
      [param.parameterName]: param.value,
      InstrumentUOMID: param.uom_id,
      InstrumentparameterUOM: UOM.find((u) => u.value === param.uom_id)?.label || "",
      Symbols: param.Symbols || "",
      SymbolPos: param.SymbolPos || "",
      isNaN: param.isNaN || false,
    }));

    const finalRemarks = values.remarks === "Others" ? values.customRemarks : values.remarks;
    const updatedItem = {
      name: editInstrumentName,
      description: editDescription,
      make: values.make,
      model: values.model,
      serialno: values.serialNumber,
      idno: values.assetId,
      remarks: finalRemarks,
      masterlistId: values.instrumentType,
      calibrationDueDate: "",
      reminder_frequency: values.reminderFrequency,
      frequency_days: values.reminderDays,
      calibrationAt: values.calibrationAt,
      labtype: values.labType,
      ranges: dbParams,
      instrument_type_at_calibration: values.type,
      assignedTo: values.assignedTo,
      instrumentData: {
        uom_id: values.instrumentUOM,
        instrumentUOM: UOM.find(u => u.value === values.instrumentUOM)?.label || ""
      }
    };

    dispatch(itemsActions.updateitem({ index: editIndex, item: updatedItem }));
    GlobalNotification.success({
      title: "Item Updated Successfully",
      description: editDescription,
    });
    setEditModalOpen(false);
    editForm.resetFields();
  };

  const options = [
    { value: "Okay", label: "Okay" },
    { value: "Good", label: "Good" },
    { value: "Satisfactory", label: "Satisfactory" },
    { value: "Others", label: "Others" },
  ];

  const columns = [
    {
      title: "S.NO",
      dataIndex: "sno",
      key: "sno",
      width: 60,
      align: "center",
    },
    {
      title: "DESCRIPTION OF ITEM",
      dataIndex: "description",
      key: "description",
      align: "center",
      width: 250,
    },
    {
      title: "MAKE",
      dataIndex: "make",
      key: "make",
      align: "center",
    },
    {
      title: "MODEL",
      dataIndex: "model",
      key: "model",
      align: "center",
    },
    {
      title: "ID NUMBER",
      dataIndex: "idno",
      key: "idno",
      align: "center",
    },
    {
      title: "REMARKS",
      dataIndex: "remarks",
      key: "remarks",
      align: "center",
    },
    {
      title: "ACTIONS",
      dataIndex: "sno",
      key: "action",
      align: "center",
      width: 180,
      render: (sno, record) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this item?"
            description="This action cannot be undone."
            onConfirm={() => itemdeleteHandler(sno)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              type="primary"
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Card
      className="mt-4 w-full shadow-sm rounded-xl overflow-hidden"
      styles={{ body: { padding: "16px" } }}
    >
      <h2 className="text-lg font-bold text-center mb-4">SRF Items</h2>

      <AddBulkItems />

      <Table
        columns={columns}
        dataSource={modifiedItems}
        rowKey="sno"
        pagination={{ pageSize: 5, showSizeChanger: false }}
        bordered
        size="small"
        scroll={{ x: 900 }}
        className="mt-3"
      />

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 w-full">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addItemHandler}
          className="w-full sm:w-auto"
          style={{ backgroundColor: "#52c41a", borderColor: "#52c41a", height: '40px', borderRadius: '8px' }}
        >
          Add Item
        </Button>
        {items.length > 0 && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={props.isLoaded && props.addsrf}
            className="w-full sm:w-auto"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            Add SRF
          </Button>
        )}
      </div>

      {addItemModel && (
        <AddItem onclose={addItemHandler} isopen={addItemModel} srfAssignedTo={props.srfAssignedTo} />
      )}

      {/* ── Edit Item Modal ───────────────────────────────────────── */}
      <Modal
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
        }}
        width="90%"
        footer={null}
        maskClosable={false}
        destroyOnClose
      >
        <AddItemForm
          mode="edit"
          loading={editLoading}
          options={options}
          auth={auth}
          makes={makes}
          models={models}
          onSubmit={handleEditSave}
          setInstrument_name={setEditInstrumentName}
          setDescription={setEditDescription}
          form={editForm}
          instrumentCategories={instrumentCategories}
          UOM={UOM}
        />
      </Modal>
    </Card>
  );
};

export default ItemsList;
