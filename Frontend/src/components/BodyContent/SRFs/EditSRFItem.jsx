//import { Spinner, Button, Modal, Input, Textarea, Select } from "react-rainbow-components";
import CustomInput from "../../Inputs/CustomInput";
import CustomTextArea from "../../Inputs/CustomTextArea";
import { useContext, useEffect, useState } from "react";
import { itemSchema } from "../../../Schemas/item";
import { useDispatch, useSelector } from "react-redux";
import { itemsActions } from "../../../store/items";
import CustomSelect from "../../Inputs/CustomSelect";
import { masterlistActions } from "../../../store/masterlist";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import CustomLookup1 from "../../Inputs/CustomLookup1";
import { number } from "yup";
import CustomDatePicker from "../../Inputs/CustomDatePicker";
import { srfitemsActions } from "../../../store/srfitems";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { selecteditemsActions } from "../../../store/selecteditems";
import Loader from "../../UI/Loader";
import { Form, Modal, Checkbox, Progress } from "antd";
import AddItemForm from "../Forms/AddItemForm";
import { populateUomWithsysmbol } from "../Instrument/HelperFunction";
import GlobalNotification from "../../../utils/GlobalNotification";
import { startCertRegenerationJob } from "../../../utils/certProgressStore";

const EditSRFItem = (props) => {

  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [serialno, setSerialNo] = useState("");
  const [idno, setIdno] = useState("");
  const [remarks, setRemarks] = useState("");
  const [ulrno, setULRNo] = useState();
  const [masterlistId, setmasterListId] = useState("");
  const [calibrationDueDate, setCalibrationDueDate] = useState("");
  const [srf_item_no, setSrf_item_no] = useState(0);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const instrumentTypes = useSelector((state) => state.masterlist.list);
  const auth = useContext(AuthContext);

  //Default Instrument Types
  const [defaultInstrumentTypes, setDefaultInstrumentTypes] = useState("");

  // Error State
  const [instrumentTypeErr, setInstrumentTypeErr] = useState("");
  const [serialNoErr, setSerialNoErr] = useState("");
  const [remarksErr, setRemarksErr] = useState("");
  const [responseError, setResponseError] = useState("");


  const [electroParameter, setelectroParameter] = useState({
    isEnable: false,
    voltage: "",
    current: "",
    class: "",
    meterconstant: ""
  })

  const [customRemarks, setCustomRemarks] = useState('');

  const [instrument_name, setInstrument_name] = useState('');
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressJobId, setProgressJobId] = useState(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [progressData, setProgressData] = useState({ completed: 0, total: 100, status: 'processing' });

  const startPollingProgress = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${config.Calibmaster.URL}/api/srf/progress/${jobId}`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        const json = await res.json();
        if (json.status === 'SUCCESS' && json.data) {
          setProgressData(json.data);
          if (json.data.status === 'completed' || json.data.status === 'error') {
            clearInterval(interval);
            setTimeout(() => {
              setProgressModalVisible(false);
              if (json.data.status === 'completed') {
                GlobalNotification.success({
                  title: 'Success',
                  description: `Successfully regenerated certificates and re-sequenced ${json.data.total} item(s).`,
                  duration: 15
                });
              } else {
                GlobalNotification.error({
                  title: 'Error',
                  description: 'An error occurred during certificate regeneration.',
                  duration: 15
                });
              }
            }, 1000);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  };
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [instrumentCategories, setInstrumentCategories] = useState([]);
  const [UOM, setUOM] = useState([]);

  // Fetch Instrument Type List
  useEffect(() => {

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ lab_id: auth?.labId, userId: auth.userId })
    };

    fetch(config.Calibmaster.URL + "/api/instrument-types/list", requestOptions)
      .then(async (response) => {
        const data = await response.json();

        setIsLoading(true);

        let oldmasterlist = data.data;
        const modified = oldmasterlist.map((v, i) => {
          return {
            id: v.instrument_type_id,
            name: v.type ? `${v.instrument_full_name} Type-${v.type}` : v.instrument_full_name,
            //name: extractTypePart(v.instrument_full_name) ? v.instrument_full_name : `${v.instrument_full_name} Type-${v.type}`,
            units: v.ins_uom_name
          };
        });

        const ismatch = oldmasterlist.some((values, index) => values.instrument_type_id === props?.item?.intrument_type_id && values.ins_dis_name === "ELECTRO TECHNICAL")



        setelectroParameter((prev) => ({ ...prev, isEnable: ismatch }))


        dispatch(masterlistActions.changeitems(modified));
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        setError("Error While Getting Instrument Types List");
      });


    fetch(config.Calibmaster.URL + "/api/instrument-types/listCategoryofInstruments", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setInstrumentCategories(data.data);
        } else {
          setInstrumentCategories([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setInstrumentCategories([]);
      });


  }, []);

  // Pre Fill All Input Fields
  useEffect(() => {
    setDefaultInstrumentTypes({ label: props?.item?.intrument_type?.instrument_full_name });

    setmasterListId(props?.item?.intrument_type?.instrument_type_id);
    setMake(props?.item?.make);
    setModel(props?.item?.model);
    setSerialNo(props?.item?.serial_no);
    setIdno(props?.item?.identification_details);
    //setRemarks(props?.item?.remarks);
    if (
      props?.item?.remarks &&
      !['Okay', 'Good', 'Satisfactory'].includes(props.item.remarks)
    ) {
      setRemarks('Others');
      setCustomRemarks(props.item.remarks);
    } else {
      setRemarks(props.item.remarks || '');
      setCustomRemarks('');
    }

    setSrf_item_no(props?.item?.srf_item_no);
    setULRNo(props?.item?.url_number);
    setInstrument_name(props?.item?.intrument_type?.instrument?.instrument_name)

    const formValues = {
      labType: props.item.labtype,
      Category: props.item.instrument_type_at_calibration ? "Variable" : "Attribute",
      instrumentType: props?.item?.intrument_type?.instrument_type_id || '',
      intrument_type_id: props?.item?.intrument_type?.instrument_type_id,
      make: props.item.make || "",
      model: props.item.model || '',
      serialNumber: props.item.serial_no,
      assetId: props.item.identification_details,
      reminderFrequency: props.item.reminder_frequency,
      reminderDays: props.item.frequency_days,
      calibrationAt: props.item.calibrationAt,
      remarks: props.item.remarks,
      customRemarks: props.item.remarks,
      type: props.item.instrument_type_at_calibration || null,
      assignedTo: props.item.assignedTo,
      parameters: Array.isArray(props?.item?.ranges)
        ? props.item.ranges.map((row) => {
          const paramName = Object.keys(row).find(
            (key) => key !== "InstrumentUOMID" &&
              key !== "InstrumentparameterUOM" &&
              key !== "Symbols" &&
              key !== "SymbolPos"
          );

          // Find matching range in instrument type for fallback symbols
          const typeRange = (props.item.intrument_type?.ranges || []).find(r => r[paramName] !== undefined) || {};

          return {
            parameterName: paramName || "",
            value: row[paramName] || "",
            uom_id: row.InstrumentUOMID || "",
            Symbols: row.Symbols || typeRange.Symbols || "",
            SymbolPos: row.SymbolPos || typeRange.SymbolPos || "Prefix",
            isNaN: row.isNaN || false
          };
        })
        : [],
      acceptRanges: props?.item?.intrument_type?.instrument?.ranges || null,
      instrumentUOM: props?.item?.instrumentData?.uom_id || ""
    };
    form.setFieldsValue(formValues);

    setTimeout(() => {
      form.validateFields(["parameters"]);
    }, 0);
  }, [props.item]);

  const selectItemHandler = (v) => {
    if (v) {
      setDescription(v.name);
      setmasterListId(v.id);
    }
  };

  // *** Get srf-items by id Function Handler ***
  const getSRFDetail = async () => {

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ srfId: props?.item?.srf_id, userId: auth.userId })
    };

    fetch(config.Calibmaster.URL + "/api/srf/getsrfbyid", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        dispatch(srfitemsActions.changesrfitems(data.data.items));
      })
      .catch((err) => {
        GlobalNotification.error({
          title: "Error while Getting SRF Detail!!",
        });
        setError("Error while Getting SRF Detail!!");
      });
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
        body: JSON.stringify({ labId: auth.labId, userId: auth.userId }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
      const { data } = await response.json();
      const { items } = data;

      const newSRFList = async (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i].slNo = i + 1;
        }
        //console.log(arr)
        return arr;
      }
      let getSRFList = await newSRFList(items);
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));




    } catch (error) {
      console.log(error);
    }
  }

  // Add SRF Items
  const addSrfItemHandler = async () => {

    try {

      setIsLoading(true)
      const finalRemarks = remarks === "Others" ? customRemarks : remarks;

      const bodyData = {
        lab_id: auth.labId,
        srf_id: props?.item?.srf_id,
        srf_item_id: props?.item?.srf_item_id,
        item: {
          srf_item_no: srf_item_no,
          make: make,
          model: model,
          serial_no: serialno,
          identification_details: idno,
          remarks: finalRemarks,
          url_number: ulrno,
          intrument_type_id: masterlistId,
          voltage: electroParameter.voltage,
          current: electroParameter.current,
          class: electroParameter.class,
          meterconstant: electroParameter.meterconstant
        }
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(bodyData)
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/updateitem", requestOptions);
      const data = await response.json();

      GlobalNotification.success({
        title: data?.message,
      });

      // *** Remove the selected srf-items from redux store ***
      dispatch(selecteditemsActions.changeselecteditems([]));
      // *** Get srf-items by id and save redux store ***
      await getSRFDetail();
      // *** Get all srf-items belongs to current lab and save redux store ***
      await fetchSRFItems();
      // *** Close this modal ***
      props.onclose();

    } catch (error) {
      console.log(error);
      setResponseError("Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }


  const containerStyles = {
    maxWidth: 700,
  };

  const options = [
    { value: 'Okay', label: 'Okay' },
    { value: 'Good', label: 'Good' },
    { value: 'Satisfactory', label: 'Satisfactory' },
    { value: 'Others', label: 'Others' },
  ];


  useEffect(() => {
    fetchData('make');
    fetchData('model');
    fetchUomData()
  }, []);

  const fetchUomData = async () => {
    try {
      const uomResponse = await fetch(config.Calibmaster.URL + "/api/uom/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      });
      const data = await uomResponse.json();
      console.log(data, "data");

      if (data.code === 200 && Array.isArray(data.data)) {
        const getUomData = await populateUomWithsysmbol(data.data);
        setUOM(getUomData);
      } else {
        setUOM([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchData = async (type) => {
    try {
      const res = await fetch(config.Calibmaster.URL + `/api/makemodel/${type}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        if (type === 'make') setMakes(data);
        else setModels(data);
      } else {
        if (type === 'make') setMakes([]);
        else setModels([]);
      }
    } catch (err) {

      console.log(err);

      message.error(`Failed to load ${type}s`);
    }
  };


  const handleSave = async (value) => {
    const oldLabType = props?.item?.labtype;
    const newLabType = value.labType;
    const isLabTypeChanged = oldLabType !== newLabType && (oldLabType === 'NABL' || newLabType === 'NABL');

    if (isLabTypeChanged) {
      let regenerate = false;
      Modal.confirm({
        title: 'Confirm Lab Type Change',
        width: 480,
        content: (
          <div style={{ paddingTop: 6 }}>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: '1.5', marginBottom: 14 }}>
              Changing the lab type from <strong>{oldLabType || 'NON-NABL'}</strong> to <strong>{newLabType}</strong> will re-sequence ULR numbers for all subsequent items.
            </p>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px 14px',
                marginTop: 8
              }}
            >
              <Checkbox
                onChange={(e) => regenerate = e.target.checked}
                style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}
              >
                Regenerate certificates for affected items?
              </Checkbox>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, paddingLeft: 24 }}>
                (Only items with status &quot;Review Pending&quot; will have PDF certificates regenerated)
              </div>
            </div>
          </div>
        ),
        okText: 'Yes, Proceed',
        cancelText: 'Cancel',
        onOk: () => submitData(value, regenerate),
      });
    } else {
      submitData(value, false);
    }
  };

  const submitData = async (value, regenerateCertificates = false) => {

    const dbParams = value.parameters.map(param => ({
      [param.parameterName]: param.value,
      InstrumentUOMID: param.uom_id,
      InstrumentparameterUOM: UOM.find(u => u.value === param.uom_id)?.label || "",
      Symbols: param.Symbols || "",
      SymbolPos: param.SymbolPos || "",
      isNaN: param.isNaN || false
    }));

    setLoading(true);
    try {
      const finalRemarks = value.remarks === "Others" ? value.customRemarks : value.remarks;
      const newitem = {
        name: instrument_name,
        srf_item_no: srf_item_no,
        make: value.make,
        model: value.model,
        serial_no: value.serialNumber,
        identification_details: value.assetId,
        remarks: finalRemarks,
        url_number: ulrno,
        intrument_type_id: value.instrumentType,
        calibrationDueDate: `${calibrationDueDate}`,
        reminder_frequency: value.reminderFrequency,
        frequency_days: value.reminderDays,
        calibrationAt: value.calibrationAt,
        labtype: value.labType,
        ranges: dbParams,
        instrument_type_at_calibration: value.type,
        assignedTo: value.assignedTo,
        instrumentData: {
          uom_id: value.instrumentUOM,
          instrumentUOM: UOM.find(u => u.value === value.instrumentUOM)?.label || ""
        }
      };
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
          lab_id: auth.labId,
          srf_id: props?.item?.srf_id,
          srf_item_id: props?.item?.srf_item_id,
          item: newitem,
          regenerateCertificates
        })
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/updateitem", requestOptions);
      const data = await response.json();
      // *** Remove the selected srf-items from redux store ***
      dispatch(selecteditemsActions.changeselecteditems([]));
      // *** Get srf-items by id and save redux store ***
      await getSRFDetail();
      // *** Get all srf-items belongs to current lab and save redux store ***
      await fetchSRFItems();

      props.onclose();

      GlobalNotification.success({ title: data?.message || "Item Updated Successfully", duration: 10 });

      if (data?.jobId) {
        startCertRegenerationJob(data.jobId);
        GlobalNotification.info({
          title: "Certificate Regeneration Started",
          description: `Background certificate regeneration started for updated items with status 'Review Pending'. Monitor live progress in the top header.`,
          duration: 10
        });
      } else if (data?.labTypeChanged && data?.ulrResequence) {
        const { updatedCount } = data.ulrResequence;
        GlobalNotification.warning({
          title: `Lab Type Changed`,
          description: `${updatedCount} item(s) had their ULR numbers re-sequenced successfully.`,
          duration: 10,
        });
      }

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading)
    return <Loader />;

  return (
    <Modal
      id="modal-2"
      open={props.isopen}
      onCancel={props.onclose}
      centered={true}
      width="80%"
      maskClosable={false}
      footer={null}
    >
      <AddItemForm
        mode="edit"
        loading={loading}
        onChange={(data) => setFormData(data)}
        options={options}
        auth={auth}
        makes={makes}
        models={models}
        onSubmit={handleSave}
        setInstrument_name={setInstrument_name}
        setDescription={setDescription}
        form={form}
        instrumentCategories={instrumentCategories}
        UOM={UOM}
      />
    </Modal>
  );
};

export default EditSRFItem;
