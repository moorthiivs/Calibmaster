// import { useContext, useEffect, useState } from "react";
// import { Card, Spinner, Input, Select } from "react-rainbow-components";
// import "../InstrumentType/style.css";
// import CustomButton from "../../Inputs/CustomButton";
// import { useDispatch, useSelector } from "react-redux";
// import config from "../../../utils/config.js";
// import { notificationActions } from "../../../store/nofitication";
// import { AuthContext } from "../../../context/auth-context";
// import { useNavigate } from "react-router-dom";
// import {
//   populateUomData,
//   populateDisciplineData,
//   populateGroupData,
//   populateUomWithsysmbol,
// } from "./HelperFunction";
// import Loader from "../../UI/Loader";
// import InstrumentForm from "../Forms/InstrumentForm";
// import { Form } from "antd";
// import GlobalNotification from "../../../utils/GlobalNotification";

// const EditInstrument = () => {
//   const [instrumentName, setInstrumentName] = useState("");
//   const [uomValue, setUomValue] = useState("");
//   const [disciplineValue, setDisciplineValue] = useState("");
//   const [groupValue, setGroupValue] = useState("");

//   const [UOMs, setUOM] = useState([]);
//   const [Discipline, setDiscipline] = useState([]);
//   const [Group, setGroup] = useState([]);

//   const [enableGroup, setenableGroup] = useState(true);

//   const [instrumentNameErr, setInstrumentNameErr] = useState("");
//   const [uomErr, setuomErr] = useState("");
//   const [groupErr, setgroupErr] = useState("");

//   const [loading, setloading] = useState(false);
//   const [error, setError] = useState("");

//   const auth = useContext(AuthContext);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const instrumentId = useSelector((state) => state.instrumentId.current);

//   const [UOMwithSymbol, setUOMwithSymbol] = useState([]);

//   const [form] = Form.useForm();

//   async function fetchData() {
//     setloading(true);

//     try {
//       const uomResonse = await fetch(config.Calibmaster.URL + "/api/uom/list", {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Bearer " + auth.token,
//         },
//       }).then((res) => res.json());
//       let getUomData = await populateUomData(uomResonse.data);
//       let getUomwithSymbolData = await populateUomWithsysmbol(uomResonse.data);
//       setUOM(getUomData);
//       setUOMwithSymbol(getUomwithSymbolData);

//       const disciplineResponse = await fetch(
//         config.Calibmaster.URL + "/api/instrument-discipline/list",
//         {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: "Bearer " + auth.token,
//           },
//         }
//       ).then((res) => res.json());
//       let getDisciplineData = await populateDisciplineData(
//         disciplineResponse.data
//       );
//       setDiscipline(getDisciplineData);

//       setloading(false);
//     } catch (error) {
//       const errNotification = {
//         title: "Something went wrong",
//         description: "",
//         icon: "error",
//         state: true,
//         timeout: 1500,
//       };
//       dispatch(notificationActions.changenotification(errNotification));
//     }
//   }




//   const handleDisciplineChange = async (disciplineId) => {
//     if (!disciplineId) {
//       setGroup([]);
//       setenableGroup(true);
//       return;
//     }

//     setloading(true);
//     try {
//       const groupRes = await fetch(
//         config.Calibmaster.URL + `/api/instrument-groups/fetch/${disciplineId}`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${auth.token}`,
//           },
//         }
//       ).then((res) => res.json());

//       let getGroupData = await populateGroupData(groupRes.data)


//       setGroup(getGroupData);

//       //setGroup(populateGroupData(groupRes.data));
//       setenableGroup(false);
//     } catch (error) {
//       dispatch(
//         notificationActions.changenotification({
//           title: "Error loading groups",
//           icon: "error",
//           state: true,
//           timeout: 3000,
//         })
//       );
//       setGroup([]);
//     } finally {
//       setloading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // *** fetchinstrumentId ***
//   async function fetchinstrumentId() {
//     try {
//       setloading(true);

//       const response = await fetch(
//         config.Calibmaster.URL + "/api/instrument/fetch/" + instrumentId,
//         {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: "Bearer " + auth.token,
//           },
//         }
//       );

//       const data = await response.json();
//       if (data) {
//         const {
//           instrument_name,
//           instrument_uom_id,
//           instrument_discipline_id,
//           instrument_group_id,
//           ranges
//         } = data?.result;

//         console.log(data);

//         setInstrumentName(instrument_name);
//         setUomValue(instrument_uom_id);
//         setDisciplineValue(instrument_discipline_id);
//         setGroupValue(instrument_group_id);
//         handleDisciplineChange(instrument_discipline_id);

//         const acceptRangesObject = {};
//         const labTypes = [];

//         ranges.forEach(item => {
//           labTypes.push(item.labtype);

//           acceptRangesObject[item.labtype] = {
//             min: item.min,
//             max: item.max,
//             unit: item.unit,
//             decimalPlace: item.decimalPlace || ''
//           };
//         });

//         const formatted = {
//           name: instrument_name,
//           uom: instrument_uom_id,
//           discipline: instrument_discipline_id,
//           group: instrument_group_id,
//           labType: labTypes,
//           accept_ranges: acceptRangesObject
//         };
//         form.setFieldsValue(formatted);
//       }

//       setloading(false);
//     } catch (error) {
//       const newNotification = {
//         title: "Something went wrong",
//         description: "",
//         icon: "error",
//         state: true,
//       };
//       dispatch(notificationActions.changenotification(newNotification));
//       setloading(false);
//     }
//   }

//   useEffect(() => {
//     if (instrumentId) {
//       fetchinstrumentId();
//     }
//   }, [instrumentId]);


//   const saveInstrument = async (values) => {
//     setloading(true);

//     // const formattedRanges = Object.entries(values.accept_ranges || {}).map(
//     //   ([labtype, range]) => ({
//     //     min: range.min,
//     //     max: range.max,
//     //     unit: range.unit,
//     //     labtype
//     //   })
//     // );


//     const formattedRanges = Object.entries(values.accept_ranges || {}).map(
//       ([labtype, range]) => {
//         const selectedUom = UOMwithSymbol.find(
//           (uom) => uom.value === range.unit
//         );
//         return {
//           min: range.min,
//           max: range.max,
//           unit: range.unit,
//           unitsymbol: selectedUom?.label || "",
//           decimalPlace: range.decimalPlace,
//           labtype
//         };
//       }
//     );
//     const updateinstrument = {
//       instrument_id: instrumentId,
//       instrument_name: values.name,
//       instrument_uom_id: values.uom ? parseInt(values.uom) : '',
//       instrument_discipline_id: values.discipline ? parseInt(values.discipline) : '',
//       instrument_group_id: values.group ? parseInt(values.group) : '',
//       ranges: formattedRanges,
//     };

//     try {
//       const requestOptions = {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Bearer " + auth.token,
//         },
//         body: JSON.stringify(updateinstrument),
//       };

//       const response = await fetch(
//         config.Calibmaster.URL + "/api/instrument/edit",
//         requestOptions
//       );
//       const data = await response.json();

//       if (response.ok) {
//         GlobalNotification.success({
//           title: 'Instrument Updated',
//           description: 'The Instrument was Updated successfully.',
//           duration: 2
//         });
//         navigate("/dashboard/instruments");
//         setError("");
//       } else {
//         GlobalNotification.error({
//           title: 'Update Failed',
//           description: data?.message || 'Something went wrong!',
//           duration: 2
//         });
//         setError(data?.message);
//       }
//       setloading(false);
//     } catch (err) {
//       GlobalNotification.error({
//         title: 'Submission Failed',
//         description: err.message || 'Something went wrong!',
//         duration: 2
//       });
//       setError("Error While Instrument Lab!!");
//       setloading(false);
//     }
//   };

//   return (


//     <>

//       <InstrumentForm
//         form={form}
//         mode="edit"
//         initialData={{}}
//         onSubmit={saveInstrument}
//         isLoading={loading}
//         error={error}
//         uomOptions={UOMs}
//         disciplineOptions={Discipline}
//         groupOptions={Group}
//         enableGroup={enableGroup}
//         onDisciplineChange={handleDisciplineChange}
//         onAddParameters={() => {
//           setisenableParameter(true);
//         }}
//         UOMwithSymbol={UOMwithSymbol}
//       />
//     </>
//   );
// };

// export default EditInstrument;


import { useContext, useEffect, useState } from "react";
import { Card, Spinner, Input, Select } from "react-rainbow-components";
import "../InstrumentType/style.css";
import CustomButton from "../../Inputs/CustomButton";
import { useDispatch, useSelector } from "react-redux";
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { AuthContext } from "../../../context/auth-context";
import { useNavigate } from "react-router-dom";
import {
  populateUomData,
  populateDisciplineData,
  populateGroupData,
  populateUomWithsysmbol,
} from "./HelperFunction";
import Loader from "../../UI/Loader";
import InstrumentForm from "../Forms/InstrumentForm";
import { Form } from "antd";
import GlobalNotification from "../../../utils/GlobalNotification";

const EditInstrument = () => {
  const [instrumentName, setInstrumentName] = useState("");
  const [uomValue, setUomValue] = useState("");
  const [disciplineValue, setDisciplineValue] = useState("");
  const [groupValue, setGroupValue] = useState("");

  const [UOMs, setUOM] = useState([]);
  const [Discipline, setDiscipline] = useState([]);
  const [Group, setGroup] = useState([]);

  const [enableGroup, setenableGroup] = useState(true);

  const [instrumentNameErr, setInstrumentNameErr] = useState("");
  const [uomErr, setuomErr] = useState("");
  const [groupErr, setgroupErr] = useState("");

  const [loading, setloading] = useState(false);
  const [error, setError] = useState("");

  const auth = useContext(AuthContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const instrumentId = useSelector((state) => state.instrumentId.current);

  const [UOMwithSymbol, setUOMwithSymbol] = useState([]);

  const [form] = Form.useForm();

  async function fetchData() {
    setloading(true);

    try {
      const uomResonse = await fetch(config.Calibmaster.URL + "/api/uom/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      }).then((res) => res.json());
      let getUomData = await populateUomData(uomResonse.data);
      let getUomwithSymbolData = await populateUomWithsysmbol(uomResonse.data);
      setUOM(getUomData);
      setUOMwithSymbol(getUomwithSymbolData);

      const disciplineResponse = await fetch(
        config.Calibmaster.URL + "/api/instrument-discipline/list",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
        }
      ).then((res) => res.json());
      let getDisciplineData = await populateDisciplineData(
        disciplineResponse.data
      );
      setDiscipline(getDisciplineData);

      setloading(false);
    } catch (error) {
      const errNotification = {
        title: "Something went wrong",
        description: "",
        icon: "error",
        state: true,
        timeout: 1500,
      };
      dispatch(notificationActions.changenotification(errNotification));
    }
  }

  const handleDisciplineChange = async (disciplineId) => {
    if (!disciplineId) {
      setGroup([]);
      setenableGroup(true);
      return;
    }

    setloading(true);
    try {
      const groupRes = await fetch(
        config.Calibmaster.URL + `/api/instrument-groups/fetch/${disciplineId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        }
      ).then((res) => res.json());

      let getGroupData = await populateGroupData(groupRes.data);
      setGroup(getGroupData);
      setenableGroup(false);
    } catch (error) {
      dispatch(
        notificationActions.changenotification({
          title: "Error loading groups",
          icon: "error",
          state: true,
          timeout: 3000,
        })
      );
      setGroup([]);
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // *** fetchinstrumentId ***
  async function fetchinstrumentId() {
    try {
      setloading(true);

      const response = await fetch(
        config.Calibmaster.URL + "/api/instrument/fetch/" + instrumentId,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
        }
      );

      const data = await response.json();
      if (data) {
        const {
          instrument_name,
          instrument_uom_id,
          instrument_discipline_id,
          instrument_group_id,
          ranges = []
        } = data?.result;

        console.log(data);

        setInstrumentName(instrument_name);
        setUomValue(instrument_uom_id);
        setDisciplineValue(instrument_discipline_id);
        setGroupValue(instrument_group_id);
        handleDisciplineChange(instrument_discipline_id);

        // ✅ Step 1: Reset stale form data
        form.resetFields(["labType", "accept_ranges"]);

        // ✅ Step 2: Build accept_ranges as ARRAY per lab type
        const acceptRangesObject = {};
        const labTypesSet = new Set();

        ranges.forEach(item => {
          labTypesSet.add(item.labtype);

          if (!acceptRangesObject[item.labtype]) {
            acceptRangesObject[item.labtype] = [];
          }

          acceptRangesObject[item.labtype].push({
            min: item.min,
            max: item.max,
            unit: item.unit,
            decimalPlace: item.decimalPlace || undefined,
            isEnable: item.isEnable || false
          });
        });

        const labTypesArray = [...labTypesSet];

        // ✅ Step 3: Set labType FIRST (this renders the Form.List components)
        // DO NOT set accept_ranges here
        form.setFieldsValue({
          name: instrument_name,
          uom: instrument_uom_id,
          discipline: instrument_discipline_id,
          group: instrument_group_id,
          labType: labTypesArray,
        });

        // ✅ Step 4: Set accept_ranges AFTER Form.List has mounted
        setTimeout(() => {
          form.setFieldsValue({
            accept_ranges: acceptRangesObject
          });
        }, 100);
      }

      setloading(false);
    } catch (error) {
      const newNotification = {
        title: "Something went wrong",
        description: "",
        icon: "error",
        state: true,
      };
      dispatch(notificationActions.changenotification(newNotification));
      setloading(false);
    }
  }

  useEffect(() => {
    if (instrumentId) {
      fetchinstrumentId();
    }
  }, [instrumentId]);

  const saveInstrument = async (values) => {
    setloading(true);

    // ✅ Updated: Handle array structure from Form.List
    const formattedRanges = [];
    const acceptRanges = values.accept_ranges || {};

    Object.entries(acceptRanges).forEach(([labtype, rangesArray]) => {
      if (Array.isArray(rangesArray)) {
        rangesArray.forEach((range) => {
          const selectedUom = UOMwithSymbol.find(
            (uom) => uom.value === range.unit
          );
          formattedRanges.push({
            min: range.min,
            max: range.max,
            unit: range.unit,
            unitsymbol: selectedUom?.label || "",
            decimalPlace: range.decimalPlace,
            labtype,
            isEnable: range.isEnable
          });
        });
      }
    });

    const updateinstrument = {
      instrument_id: instrumentId,
      instrument_name: values.name,
      instrument_uom_id: values.uom ? parseInt(values.uom) : '',
      instrument_discipline_id: values.discipline ? parseInt(values.discipline) : '',
      instrument_group_id: values.group ? parseInt(values.group) : '',
      ranges: formattedRanges,
    };

    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(updateinstrument),
      };

      const response = await fetch(
        config.Calibmaster.URL + "/api/instrument/edit",
        requestOptions
      );
      const data = await response.json();

      if (response.ok) {
        GlobalNotification.success({
          title: 'Instrument Updated',
          description: 'The Instrument was Updated successfully.',
          duration: 2
        });
        navigate("/dashboard/instruments");
        setError("");
      } else {
        GlobalNotification.error({
          title: 'Update Failed',
          description: data?.message || 'Something went wrong!',
          duration: 2
        });
        setError(data?.message);
      }
      setloading(false);
    } catch (err) {
      GlobalNotification.error({
        title: 'Submission Failed',
        description: err.message || 'Something went wrong!',
        duration: 2
      });
      setError("Error While Instrument Lab!!");
      setloading(false);
    }
  };

  return (
    <>
      <InstrumentForm
        form={form}
        mode="edit"
        initialData={{}}
        onSubmit={saveInstrument}
        isLoading={loading}
        error={error}
        uomOptions={UOMs}
        disciplineOptions={Discipline}
        groupOptions={Group}
        enableGroup={enableGroup}
        onDisciplineChange={handleDisciplineChange}
        onAddParameters={() => { }}
        UOMwithSymbol={UOMwithSymbol}
      />
    </>
  );
};

export default EditInstrument;
