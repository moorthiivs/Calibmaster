//import { Spinner, Button, Modal, Input, Textarea, Select } from "react-rainbow-components";
import CustomInput from "../../Inputs/CustomInput";
import CustomTextArea from "../../Inputs/CustomTextArea";
import { useContext, useEffect, useState } from "react";
import { itemSchema } from "../../../Schemas/item";
import { useDispatch, useSelector } from "react-redux";
import { itemsActions } from "../../../store/items";
import { notificationActions } from "../../../store/nofitication";
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
import { Form, Modal } from "antd";
import AddItemForm from "../Forms/AddItemForm";
import { populateUomWithsysmbol } from "../Instrument/HelperFunction";

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
      body: JSON.stringify({ lab_id: auth?.labId })
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
      parameters: Array.isArray(props?.item?.ranges)
        ? props.item.ranges.map((row) => {
          const paramName = Object.keys(row).find(
            (key) => key !== "InstrumentUOMID" && 
                     key !== "InstrumentparameterUOM" && 
                     key !== "Symbols" && 
                     key !== "SymbolPos"
          );
          
          // Fallback to instrument type ranges if item ranges don't have symbols
          const typeRange = props.item.intrument_type?.ranges?.[0] || {};

          return {
            parameterName: paramName || "",
            value: row[paramName] || "",
            uom_id: row.InstrumentUOMID || "",
            Symbols: row.Symbols || typeRange.Symbols || "",
            SymbolPos: row.SymbolPos || typeRange.SymbolPos || ""
          };
        })
        : [],
      acceptRanges: props?.item?.intrument_type?.instrument?.ranges || null
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
      body: JSON.stringify({ srfId: props?.item?.srf_id })
    };

    const errornotification = {
      title: "Error while Getting SRF Detail!!",
      icon: "error",
      state: true,
      timeout: 15000,
    };

    fetch(config.Calibmaster.URL + "/api/srf/getsrfbyid", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        dispatch(srfitemsActions.changesrfitems(data.data.items));
      })
      .catch((err) => {
        dispatch(notificationActions.changenotification(errornotification));
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
        body: JSON.stringify({ labId: auth.labId }),
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

      const newNotification = {
        title: data?.message,
        description: "",
        icon: "success",
        state: true,
        timeout: 15000,
      };
      dispatch(notificationActions.changenotification(newNotification));

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
      const getUomData = await populateUomWithsysmbol(data.data);
      setUOM(getUomData);
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
      if (type === 'make') setMakes(data);
      else setModels(data);
    } catch (err) {

      console.log(err);

      message.error(`Failed to load ${type}s`);
    }
  };


  const handleSave = async (value) => {

    const dbParams = value.parameters.map(param => ({
      [param.parameterName]: param.value,
      InstrumentUOMID: param.uom_id,
      InstrumentparameterUOM: UOM.find(u => u.value === param.uom_id)?.label || "",
      Symbols: param.Symbols || "",
      SymbolPos: param.SymbolPos || ""
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
        instrument_type_at_calibration: value.type
      };
      const bodyData = {
        lab_id: auth.labId,
        srf_id: props?.item?.srf_id,
        srf_item_id: props?.item?.srf_item_id,
        item: newitem,
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
      // console.log(data);
      const newNotification = {
        title: data?.message,
        description: "",
        icon: "success",
        state: true,
        timeout: 15000,
      };
      dispatch(notificationActions.changenotification(newNotification));

      // *** Remove the selected srf-items from redux store ***
      dispatch(selecteditemsActions.changeselecteditems([]));
      // *** Get srf-items by id and save redux store ***
      await getSRFDetail();
      // *** Get all srf-items belongs to current lab and save redux store ***
      await fetchSRFItems();

      props.onclose();
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
      getContainer={false}

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
    </Modal >
  );
};

export default EditSRFItem;
