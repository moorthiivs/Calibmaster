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
import { srfitemsActions } from "../../../store/srfitems";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { selecteditemsActions } from "../../../store/selecteditems";
import Loader from "../../UI/Loader";
import AddItemForm from "../Forms/AddItemForm";
import { Form, Modal } from "antd";
import { populateUomWithsysmbol } from "../Instrument/HelperFunction";

const AddItemtoSRF = (props) => {

  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
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
  const instrumentTypes = useSelector((state) => state.masterlist.list);
  const auth = useContext(AuthContext);

  // Error State
  const [instrumentTypeErr, setInstrumentTypeErr] = useState("");
  const [serialNoErr, setSerialNoErr] = useState("");
  const [remarksErr, setRemarksErr] = useState("");
  const [responseError, setResponseError] = useState("");


  //masterData
  const [allMasterData, setallMasterData] = useState([])

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


  const retruntype = (v) => {

    switch (v) {
      case value:

        break;

      default:
        break;
    }

  }

  const extractTypePart = (fullName) => {
    return fullName.includes("Type");
  };

  // Fetch Instrument Type List
  useEffect(() => {

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ lab_id: auth.labId })
    };

    fetch(config.Calibmaster.URL + "/api/instrument-types/list", requestOptions)
      .then(async (response) => {
        const data = await response.json();


        setIsLoading(true);

        let oldmasterlist = data.data;
        const modified = oldmasterlist.map((v, i) => {
          return {
            id: v.instrument_type_id,
            sno: i + 1,
            name: v.type ? `${v.instrument_full_name} Type-${v.type}` : v.instrument_full_name,
            //name: extractTypePart(v.instrument_full_name) ? v.instrument_full_name : `${v.instrument_full_name} Type-${v.type}`,
            units: v.ins_uom_name,
            inst_name: v.instrument_name

          };
        });
        setallMasterData(oldmasterlist)
        dispatch(masterlistActions.changeitems(modified));
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        setError("Error While Getting Masterlist!!");
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

  const selectItemHandler = (v) => {
    if (v) {
      setDescription(v.name);
      setmasterListId(v.id);
      setInstrument_name(v.inst_name)
    }
  };

  // *** Get srf-items by id Function Handler ***
  const getSRFDetail = async () => {
    setIsLoading(true);
    if (props?.srf) {

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ srfId: props?.srf?.srf_id })
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
      setIsLoading(false);
    }
  };

  //*** Fetch SRF Items ***/
  async function fetchSRFItems() {
    setIsLoading(true);
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
        return arr;
      }
      let getSRFList = await newSRFList(items);
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  // Add SRF Items
  const addSrfItemHandler = async () => {
    setIsLoading(true);
    try {
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
      const bodyData = {
        srfId: props?.srf?.srf_id,

        item: {
          name: instrument_name,
          srf_item_no: srf_item_no,
          make: make,
          model: model,
          serial_no: serialno,
          identification_details: idno,
          remarks: finalRemarks,
          url_number: ulrno,
          intrument_type_id: masterlistId,
          reminder_frequency: reminder_frequency || 0,
          frequency_days,
          voltage: electroParameter.voltage,
          current: electroParameter.current,
          class: electroParameter.class,
          meterconstant: electroParameter.meterconstant
        },
        labId: auth.labId
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(bodyData)
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/additemtosrf", requestOptions);
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
      // *** Close this modal ***
      props.onclose();

      props.onclose();
    } catch (error) {
      console.log(error);
      setResponseError("Something went wrong.")
    }
    setIsLoading(false);
  }

  const handleselect = async (v) => {
    try {

      console.log(v);

      if (!v) return

      const ismatch = allMasterData.some((values, index) => values.instrument_type_id === v.id && values.ins_dis_name === "ELECTRO TECHNICAL")

      setelectroParameter((prev) => ({ ...prev, isEnable: ismatch }))

      selectItemHandler(v)

    } catch (error) {
      console.log(error);

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
    setLoading(true);

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
        srf_item_no: srf_item_no,
        description,
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

      //return console.log(newitem);
      const bodyData = {
        srfId: props?.srf?.srf_id,
        item: newitem,
        labId: auth.labId
      };

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(bodyData)
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/additemtosrf", requestOptions);
      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.message ||
          "Something went wrong while saving. Please try again.";
        throw new Error(message);
      }
      const { createdItem } = data.data

      await updateUlrNumber(value.labType, createdItem.srf_item_id)

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
      dispatch(
        notificationActions.changenotification({
          title: "Error",
          description: error.message,
          icon: "error",
          state: true,
          timeout: 15000,
        })
      );
    } finally {
      setLoading(false);
    }
  };



  const updateUlrNumber = async (lab_type, srf_item_id) => {

    if (lab_type === 'NON-NABL') return
    const requestBody = {
      lab_id: auth?.labId,
      items: [{ srf_item_id: srf_item_id }]
    };

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify(requestBody),
    };

    let res = await fetch(config.Calibmaster.URL + "/api/ulr-no-generation/update-ulr-number", requestOptions);
    res = await res.json();
  }



  if (isLoading)
    return <Loader />;

  return (


    <>

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
          mode={"create"}
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
    </>
  );
};

export default AddItemtoSRF;
