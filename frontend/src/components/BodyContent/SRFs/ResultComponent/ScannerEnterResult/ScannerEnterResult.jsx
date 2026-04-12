// import React from 'react';
// import { useContext, useEffect, useState } from "react";
// import { useDispatch } from 'react-redux';
// import { Button, Card, Select } from 'react-rainbow-components';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

// import { AuthContext } from "../../../../../context/auth-context";
// import { notificationActions } from '../../../../../store/nofitication';
// import config from "../../../../../utils/config.js";
// import QRScanner from '../../../QRReader/QRReader';
// import Loader from '../../../../UI/Loader';
// import EditDefinedProdedureModal from './EditDefinedProdedureModal';
// import { useNavigate } from "react-router-dom";

// const ScannerEnterResult = () => {
//   const navigate = useNavigate();
//   const auth = useContext(AuthContext);
//   const dispatch = useDispatch();
//   const [SRFitem, setSRFitem] = useState(null);
//   const [isSRFitem, setIsSRFitem] = useState(null);
//   const [data, setData] = useState([]);
//   const [masterId, setMasterId] = useState("");

//   const [loading, setloading] = useState(false);
//   const [setTitle, setSetTitle] = useState(false);
//   const [disableFrom, setDisableFrom] = useState(false);

//   const ItemNotFound = () => {
//     return (
//       <div style={{ textAlign: 'center', padding: '50px' }}>
//         <FontAwesomeIcon icon={faExclamationCircle} size="3x" color="red" />
//         <h2>Item Not Found</h2>
//         <Button onClick={() => setSRFitem(null)}>
//           Refresh
//         </Button>
//       </div>
//     );
//   };

//   const fetchDefinedProcedures = async () => {
//     try {
//       setloading(true);

//       const data = await fetch(config.Calibmaster.URL + "/api/design-procedures/list", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Bearer " + auth.token,
//         },
//         body: JSON.stringify({
//           lab_id: auth.labId,
//           instrument_type_id: SRFitem?.intrument_type_id,
//           srf_id: SRFitem?.srf_id,
//           srf_item_id: SRFitem?.srf_item_id
//         })
//       });

//       let response = await data.json();

//       if (response?.is_exist) {

//         let newArray = [{ value: '', label: 'Select' }];

//         await response?.definedProcedures?.map((item, index) => {
//           newArray[index + 1] = {
//             value: item?.master_design_procedure_id,
//             label: item?.calibration_procedure
//           }
//         });

//         setData(newArray);
//         setMasterId(response?.existingResultMaster?.master_result_table_id);
//         setSetTitle(response?.is_exist);
//         setDisableFrom(response?.is_exist);
//         setloading(false);

//       } else {

//         let newArray = [{ value: '', label: 'Select' }];

//         await response?.definedProcedures?.map((item, index) => {
//           newArray[index + 1] = {
//             value: item?.master_design_procedure_id,
//             label: item?.calibration_procedure
//           }
//         });
//         setData(newArray);
//         setloading(false);
//       }

//       const newNotification = {
//         title: "Defined Procedure List fetched Successfully",
//         description: "",
//         icon: "success",
//         state: true,
//         timeout: 1500,
//       };
//       return dispatch(notificationActions.changenotification(newNotification));
//     } catch (error) {
//       console.log(error);
//       const newNotification = {
//         title: "Something went wrong",
//         description: "",
//         icon: "error",
//         state: true,
//         timeout: 1500,
//       };
//       dispatch(notificationActions.changenotification(newNotification));
//       setloading(false);
//     }
//   }

//   const fetchsrfItem = async () => {
//     setloading(true);
//     try {
//       const responses = await fetch(config.Calibmaster.URL + "/api/srf/fetchSrfItem", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Bearer " + auth.token,
//         },
//         body: JSON.stringify({
//           lab_id: auth.labId,
//           srf_item_id: SRFitem?.srf_item_id
//         })
//       });

//       let response = await responses.json();
//       const { data } = response;
//       setIsSRFitem(data);
//       setloading(false);
//       return data;
//     } catch (error) {
//       console.log(error);
//       const newNotification = {
//         title: "Something went wrong",
//         description: "",
//         icon: "error",
//         state: true,
//         timeout: 1500,
//       };
//       dispatch(notificationActions.changenotification(newNotification));
//     }
//     setloading(false);
//   }


//   function ScanHandler(itemDetails) {
//     try {
//       itemDetails = JSON.parse(itemDetails);
//       const { lab_id, srf_id, srf_item_id, srf_no, intrument_type_id } = itemDetails;
//       if (lab_id && lab_id === auth.labId && srf_id && srf_item_id && srf_no && intrument_type_id) {
//         navigate(`/enter-result/${srf_item_id}/${srf_id}/${intrument_type_id}`);
//         //setSRFitem(itemDetails);
//         return true;
//       }
//       else {
//         const newNotification = {
//           title: "The QR code does not match any records in our system.",
//           description: "",
//           icon: "warning",
//           state: true,
//           timeout: 1500,
//         };
//         dispatch(notificationActions.changenotification(newNotification));
//       }
//     } catch (error) {

//       console.log(error);

//     }

//   }

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         if (SRFitem && !data.length) {
//           const res = await fetchsrfItem();
//           res && await fetchDefinedProcedures();
//         }
//       } catch (error) {
//         console.log(error);
//       }

//     };

//     fetchData();
//   }, [SRFitem, data.length]);

//   return <>
//     {!loading && (!SRFitem ? (
//       <QRScanner ScanData={ScanHandler} />
//     ) : (
//       <Card style={{ width: '100%', padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
//         {isSRFitem ?
//           <>
//             <div className="users__label">
//               <h3>{setTitle ? 'Update Result' : 'Enter Result'}</h3>
//             </div>

//             {/** Procedure Selection **/}
//             {(!masterId && !disableFrom) ?
//               <>
//                 <div className="input_group">
//                   <Select
//                     label="Select Procedure"
//                     options={data}
//                     required
//                     disabled={disableFrom}
//                     className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
//                     onChange={(e) => setMasterId(e.target.value)}
//                   />
//                 </div>
//                 <Button
//                   label="Select"
//                   disabled={disableFrom}
//                   onClick={() => masterId && setDisableFrom(true)}
//                   variant="success"
//                 />
//               </>
//               : <EditDefinedProdedureModal masterId={masterId}
//                 srf_id={SRFitem?.srf_id}
//                 srf_item_id={SRFitem?.srf_item_id}
//                 setSetTitle={setSetTitle}
//               />}</>
//           : <ItemNotFound />}
//       </Card>
//     ))}
//     {loading && <Loader />}
//   </>

// };

// export default ScannerEnterResult;



import React, { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Card, Select, Spin } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../../../../context/auth-context";
import { notificationActions } from "../../../../../store/nofitication";
import config from "../../../../../utils/config.js";
import QRScanner from "../../../QRReader/QRReader";
import EditDefinedProdedureModal from "./EditDefinedProdedureModal";

const { Option } = Select;

const ScannerEnterResult = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();
  const [SRFitem, setSRFitem] = useState(null);
  const [isSRFitem, setIsSRFitem] = useState(null);
  const [data, setData] = useState([]);
  const [masterId, setMasterId] = useState("");

  const [loading, setLoading] = useState(false);
  const [setTitle, setSetTitle] = useState(false);
  const [disableFrom, setDisableFrom] = useState(false);

  const ItemNotFound = () => (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <FontAwesomeIcon icon={faExclamationCircle} size="3x" color="red" />
      <h2>Item Not Found</h2>
      <Button onClick={() => setSRFitem(null)}>Refresh</Button>
    </div>
  );

  const fetchDefinedProcedures = async () => {
    try {
      setLoading(true);
      const data = await fetch(config.Calibmaster.URL + "/api/design-procedures/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
          lab_id: auth.labId,
          instrument_type_id: SRFitem?.intrument_type_id,
          srf_id: SRFitem?.srf_id,
          srf_item_id: SRFitem?.srf_item_id,
        }),
      });

      let response = await data.json();

      let newArray = [{ value: "", label: "Select" }];
      response?.definedProcedures?.forEach((item, index) => {
        newArray[index + 1] = {
          value: item?.master_design_procedure_id,
          label: item?.calibration_procedure,
        };
      });

      setData(newArray);

      if (response?.is_exist) {
        setMasterId(response?.existingResultMaster?.master_result_table_id);
        setSetTitle(true);
        setDisableFrom(true);
      }

      dispatch(
        notificationActions.changenotification({
          title: "Defined Procedure List fetched Successfully",
          description: "",
          icon: "success",
          state: true,
          timeout: 1500,
        })
      );
    } catch (error) {
      console.error(error);
      dispatch(
        notificationActions.changenotification({
          title: "Something went wrong",
          description: "",
          icon: "error",
          state: true,
          timeout: 1500,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchsrfItem = async () => {
    setLoading(true);
    try {
      const responses = await fetch(config.Calibmaster.URL + "/api/srf/fetchSrfItem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
          lab_id: auth.labId,
          srf_item_id: SRFitem?.srf_item_id,
        }),
      });

      let response = await responses.json();
      const { data } = response;
      setIsSRFitem(data);
      return data;
    } catch (error) {
      console.error(error);
      dispatch(
        notificationActions.changenotification({
          title: "Something went wrong",
          description: "",
          icon: "error",
          state: true,
          timeout: 1500,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  function ScanHandler(itemDetails) {
    try {
      itemDetails = JSON.parse(itemDetails);
      const { lab_id, srf_id, srf_item_id, srf_no, intrument_type_id } = itemDetails;
      if (lab_id && lab_id === auth.labId && srf_id && srf_item_id && srf_no && intrument_type_id) {
        navigate(`/enter-result/${srf_item_id}/${srf_id}/${intrument_type_id}`);
        return true;
      } else {
        dispatch(
          notificationActions.changenotification({
            title: "The QR code does not match any records in our system.",
            description: "",
            icon: "warning",
            state: true,
            timeout: 1500,
          })
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (SRFitem && !data.length) {
        const res = await fetchsrfItem();
        res && (await fetchDefinedProcedures());
      }
    };
    fetchData();
  }, [SRFitem, data.length]);

  return (
    <>
      {!loading && !SRFitem ? (
        <QRScanner ScanData={ScanHandler} />
      ) : !loading && SRFitem ? (
        <Card style={{ width: "100%", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {isSRFitem ? (
            <>
              <div className="users__label">
                <h3>{setTitle ? "Update Result" : "Enter Result"}</h3>
              </div>
              {!masterId && !disableFrom ? (
                <>
                  <div className="input_group" style={{ marginBottom: 20 }}>
                    <Select
                      placeholder="Select Procedure"
                      value={masterId || undefined}
                      onChange={(val) => setMasterId(val)}
                      disabled={disableFrom}
                      style={{ width: 250 }}
                    >
                      {data.map((item, index) => (
                        <Option key={index} value={item.value}>
                          {item.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="primary"
                    disabled={disableFrom}
                    onClick={() => masterId && setDisableFrom(true)}
                  >
                    Select
                  </Button>
                </>
              ) : (
                <EditDefinedProdedureModal
                  masterId={masterId}
                  srf_id={SRFitem?.srf_id}
                  srf_item_id={SRFitem?.srf_item_id}
                  setSetTitle={setSetTitle}
                />
              )}
            </>
          ) : (
            <ItemNotFound />
          )}
        </Card>
      ) : (
        <Spin size="large" />
      )}
    </>
  );
};

export default ScannerEnterResult;
