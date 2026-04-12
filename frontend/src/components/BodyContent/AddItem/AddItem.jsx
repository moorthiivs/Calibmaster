import "./AddItem.css";
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
import config from "../../../utils/config.js";
import CustomLookup1 from "../../Inputs/CustomLookup1";
import { number } from "yup";
import CustomDatePicker from "../../Inputs/CustomDatePicker";
import Loader from "../../UI/Loader";
import AddItemForm from "../Forms/AddItemForm";
import { Form, Modal } from "antd";
import { populateUomWithsysmbol } from "../Instrument/HelperFunction";

const AddItem = (props) => {

  const [form] = Form.useForm();
  const [isLoaded, setisLoaded] = useState(true);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [serialno, setSerialNo] = useState("");
  const [idno, setIdno] = useState("");
  const [remarks, setRemarks] = useState("Okay");
  const [ulrno, setULRNo] = useState();
  const [masterlistId, setmasterListId] = useState("");
  const [unitOptions, setUnitOptions] = useState([]);
  const [calibrationDueDate, setCalibrationDueDate] = useState("");
  const [srf_item_no, setSrf_item_no] = useState(1);
  const [reminder_frequency, setReminder_frequency] = useState("0");
  const [frequency_days, setFrequency_days] = useState("0");

  const dispatch = useDispatch();
  const masterlist = useSelector((state) => state.masterlist.list);
  const auth = useContext(AuthContext);


  // Error State
  const [instrumentTypeErr, setInstrumentTypeErr] = useState("");
  const [serialNoErr, setSerialNoErr] = useState("");
  const [remarksErr, setRemarksErr] = useState("");


  const [customRemarks, setCustomRemarks] = useState('');
  const [instrument_name, setInstrument_name] = useState('');

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);

  const [instrumentCategories, setInstrumentCategories] = useState([]);
  const [UOM, setUOM] = useState([]);


  useEffect(() => {

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ lab_id: auth.labId }),
    };
    fetch(config.Calibmaster.URL + "/api/instrument-types/list", requestOptions)
      .then(async (response) => {
        const data = await response.json();

        setisLoaded(true);
        let oldmasterlist = data.data;


        const modified = oldmasterlist.map((v, i) => {
          return {
            id: v.instrument_type_id,
            sno: i + 1,
            //name: `${v.instrument_full_name}${v.type && ' Type-' + v.type}`,
            name: v.type ? `${v.instrument_full_name} Type-${v.type}` : v.instrument_full_name,
            units: v.ins_uom_name,
            inst_name: v.instrument_name
          };
        });
        dispatch(masterlistActions.changeitems(modified));
      })
      .catch((err) => {
        setisLoaded(true);
        setError("Error While Getting Masterlist!!");
      });


    fetch(config.Calibmaster.URL + "/api/instrument-types/listCategoryofInstruments", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        console.log("Category List:", data);

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






  const newitemHandler = async () => {
    setisLoaded(false);
    if (masterlistId == "") {
      setInstrumentTypeErr("Instrument Type is required");
      setisLoaded(true);
      return;
    }

    if (serialno == "") {
      setSerialNoErr("Serial Number is required");
      setisLoaded(true);
      return;
    }

    if (remarks == "") {
      setRemarksErr("Remarks is required");
      setisLoaded(true);
      return;
    }

    if (remarks === "Others" && customRemarks === "") {
      setRemarksErr("Enter Condition of DUC");
      return;
    }


    const finalRemarks = remarks === "Others" ? customRemarks : remarks;
    const newitem = {
      name: instrument_name,
      description,
      make,
      model,
      serialno,
      idno,
      remarks: finalRemarks,
      ulrno,
      masterlistId: masterlistId,
      calibrationDueDate: `${calibrationDueDate}`,
      reminder_frequency,
      frequency_days
    };

    // return console.log(newitem);
    const newNotification = {
      title: "Item Added Successfully",
      description: description,
      icon: "info",
      state: true,
      timeout: 10000,
    };
    dispatch(itemsActions.additem(newitem));
    dispatch(notificationActions.changenotification(newNotification));
    props.onclose();
  };

  const selectItemHandler = (v) => {
    console.log(v.inst_name);
    if (v) {
      setDescription(v.name);
      setmasterListId(v.id);
      setInstrument_name(v.inst_name)
    }
  };

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
    fetchUomData();
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
    setisLoaded(true);

    const dbParams = value.parameters.map(param => ({
      [param.parameterName]: param.value,
      InstrumentUOMID: param.uom_id,
      InstrumentparameterUOM: UOM.find(u => u.value === param.uom_id)?.label || "",
      Symbols: param.Symbols || "",
      SymbolPos: param.SymbolPos || ""
    }));

    try {
      const finalRemarks = value.remarks === "Others" ? value.customRemarks : value.remarks;
      const newitem = {
        name: instrument_name,
        description,
        make: value.make,
        model: value.model,
        serialno: value.serialNumber,
        idno: value.assetId,
        remarks: finalRemarks,
        ulrno,
        masterlistId: value.instrumentType,
        calibrationDueDate: `${calibrationDueDate}`,
        reminder_frequency: value.reminderFrequency,
        frequency_days: value.reminderDays,
        calibrationAt: value.calibrationAt,
        labtype: value.labType,
        ranges: dbParams,
        instrument_type_at_calibration: value.type
      };
      // return console.log(newitem);
      const newNotification = {
        title: "Item Added Successfully",
        description: description,
        icon: "info",
        state: true,
        timeout: 10000,
      };
      dispatch(itemsActions.additem(newitem));
      dispatch(notificationActions.changenotification(newNotification));
      props.onclose();
    } catch (error) {
      console.log(error);
    } finally {
      setisLoaded(false);
    }
  };




  if (!isLoaded)
    return <Loader />;

  return (

    <>

      <Modal
        // title="Add Instrument"
        open={props.isopen}
        onCancel={props.onclose}
        width="90%"
        footer={null}
        maskClosable={false}
      >
        <AddItemForm
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


    </>
  );
};

export default AddItem;
