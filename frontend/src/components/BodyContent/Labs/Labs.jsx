import "./Labs.css";
import CustomInput from "../../Inputs/CustomInput";
import { useContext, useState, useEffect } from "react";
import { Card, Input, Textarea } from "react-rainbow-components";
import CustomButton from "../../Inputs/CustomButton";
import { AuthContext } from "../../../context/auth-context";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
import CustomFilePicker from "../../Inputs/CustomFilePicker";
import { labSchema } from "../../../Schemas/lab";
import { getBase64 } from "../../../utils/utilfuns";
import { useNavigate } from "react-router-dom";
import Loader from '../../UI/Loader'
import LabForm from "../Forms/LabForm";

const Labs = (props) => {

  const [name, setName] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");

  const [city, setCity] = useState("");
  const [lstate, setLstate] = useState("");
  const [country, setCountry] = useState("");
  const [pincode, setPincode] = useState("");

  const [labWebsite, setLabWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNumber1, setContactNumber1] = useState("");
  const [contactNumber2, setContactNumber2] = useState("");

  const [symbol, setSymbol] = useState("");

  const [emailSmtpServerHost, setEmailSmtpServerHost] = useState("");
  const [emailSmtpServerPort, setEmailSmtpServerPort] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPassword, setsenderPassword] = useState("");

  const [gstNumber, setGstNumber] = useState("");
  const [labActiveFlag, setLabActiveFlag] = useState(false);

  const [limageName, setLImageName] = useState("");
  const [limageType, setLImageType] = useState("");
  const [limageData, setLImageData] = useState("");
  const [limageSize, setLImageSize] = useState("");
  const [MainLogo, setMainLogo] = useState(null);

  const [OLImage1Name, setOLImage1Name] = useState("");
  const [OLImage1mageType, setOLImage1mageType] = useState("");
  const [OLImage1mageData, setOLImage1mageData] = useState("");
  const [OLImage1mageSize, setOLImage1mageSize] = useState("");
  const [secondLogo, setSecondLogo] = useState(null);

  const [OLImage2Name, setOLImage2Name] = useState("");
  const [OLImage2mageType, setOLImage2mageType] = useState("");
  const [OLImage2mageData, setOLImage2mageData] = useState("");
  const [OLImage2mageSize, setOLImage2mageSize] = useState("");
  const [thirdLogo, setThirdLogo] = useState(null);

  /** State For New Logos & QR Codes **/
  const [sealLogo, setsealLogo] = useState(null);
  const [nablLogo, setnablLogo] = useState(null);

  const [nabl_qr_Code_logo_1, setNabl_qr_Code_logo_1] = useState(null);
  const [nableURL_1, setNableURL_1] = useState("");

  const [nabl_qr_Code_logo_2, setNabl_qr_Code_logo_2] = useState(null);
  const [nableURL_2, setNableURL_2] = useState("");

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const auth = useContext(AuthContext);
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setError();
  }, [
    name,
  ]);

  // *** Brand Logo Handler ***
  const lhandler = (v) => {
    if (v && v[0]) {
      if (v[0].type == "image/png" || v[0].type == "image/jpeg" || v[0].type == "image/jpg") {
        if (v[0].size < 60000) {
          setLImageSize(v[0].size);
          setLImageName(v[0].name);
          setLImageType(v[0].type);
          getBase64(v[0], (result) => {
            console.log(result);
            setMainLogo(result);
            setLImageData(result);
          });
        } else {
          setError("File size not allowed!! Please select file below 50kb!!");
        }
      } else {
        setError("File type not allowed!! Please select jpeg, jpg, png file!!");
      }
    } else {
      setError("");
    }
  };

  // *** Other Brand Logo 1 Handler ***
  const OL1handler = (v) => {
    if (v && v[0]) {
      if (v[0].type == "image/png" || v[0].type == "image/jpeg" || v[0].type == "image/jpg") {
        if (v[0].size < 60000) {
          setOLImage1mageSize(v[0].size);
          setOLImage1Name(v[0].name);
          setOLImage1mageType(v[0].type);
          getBase64(v[0], (result) => {
            //console.log(result);
            setOLImage1mageData(result);
            setSecondLogo(result);
          });
        } else {
          setError("File size not allowed!! Please select file below 50kb!!");
        }
      } else {
        setError("File type not allowed!! Please select jpeg, jpg, png file!!");
      }
    } else {
      setError("");
    }
  }

  // *** Other Brand Logo 2 Handler ***
  const OL2handler = (v) => {
    if (v && v[0]) {
      if (v[0].type == "image/png" || v[0].type == "image/jpeg" || v[0].type == "image/jpg") {
        if (v[0].size < 60000) {
          setOLImage2mageSize(v[0].size);
          setOLImage2Name(v[0].name);
          setOLImage2mageType(v[0].type);
          getBase64(v[0], (result) => {
            //console.log(result);
            setOLImage2mageData(result);
            setThirdLogo(result);
          });
        } else {
          setError("File size not allowed!! Please select file below 50kb!!");
        }
      } else {
        setError("File type not allowed!! Please select jpeg, jpg, png file!!");
      }
    } else {
      setError("");
    }
  }

  // *** Seal Logo Handler ***
  const SealLogohandler = (v) => {
    if (v && v[0]) {
      if (v[0].type == "image/png" || v[0].type == "image/jpeg" || v[0].type == "image/jpg") {
        if (v[0].size < 60000) {

          getBase64(v[0], (result) => {
            // console.log(result);
            setsealLogo(result);
          });
        } else {
          setError("File size not allowed!! Please select file below 50kb!!");
        }
      } else {
        setError("File type not allowed!! Please select jpeg, jpg, png file!!");
      }
    } else {
      setError("");
    }
  }

  // *** NABL Logo Handler ***
  const NABLLogohandler = (v) => {
    if (v && v[0]) {
      if (v[0].type == "image/png" || v[0].type == "image/jpeg" || v[0].type == "image/jpg") {
        if (v[0].size < 60000) {

          getBase64(v[0], (result) => {
            setnablLogo(result);
          });
        } else {
          setError("File size not allowed!! Please select file below 50kb!!");
        }
      } else {
        setError("File type not allowed!! Please select jpeg, jpg, png file!!");
      }
    } else {
      setError("");
    }
  }

  // *** Nable QR Code-1 Handler ***
  const NableQRCode1handler = (v) => {
    if (v && v[0]) {
      if (v[0].type == "image/png" || v[0].type == "image/jpeg" || v[0].type == "image/jpg") {
        if (v[0].size < 60000) {

          getBase64(v[0], (result) => {
            // console.log(result);
            setNabl_qr_Code_logo_1(result);
          });
        } else {
          setError("File size not allowed!! Please select file below 50kb!!");
        }
      } else {
        setError("File type not allowed!! Please select jpeg, jpg, png file!!");
      }
    } else {
      setError("");
    }
  }

  // *** Nable QR Code-2 Handler ***
  const NableQRCode2handler = (v) => {
    if (v && v[0]) {
      if (v[0].type == "image/png" || v[0].type == "image/jpeg" || v[0].type == "image/jpg") {
        if (v[0].size < 60000) {

          getBase64(v[0], (result) => {
            // console.log(result);
            setNabl_qr_Code_logo_2(result);
          });
        } else {
          setError("File size not allowed!! Please select file below 50kb!!");
        }
      } else {
        setError("File type not allowed!! Please select jpeg, jpg, png file!!");
      }
    } else {
      setError("");
    }
  }

  // *** Lab Active Handler ***
  const labActiveHandler = (e) => {
    console.log(e.target.checked);
    if (e.target.checked) {
      setLabActiveFlag(true)
    } else {
      setLabActiveFlag(false);
    }
  }



  // *** Add Lab Handler ***
  // const addLabHandler = async () => {

  //   if (name == "") {
  //     setError("Lab Name is required");
  //     return;
  //   }

  //   if (address1 == "") {
  //     setError("Address Line 1 is required");
  //     return;
  //   }

  //   if (city == "") {
  //     setError("City is required");
  //     return;
  //   }

  //   if (lstate == "") {
  //     setError("State is required");
  //     return;
  //   }

  //   if (country == "") {
  //     setError("Country is required");
  //     return;
  //   }

  //   if (pincode == "") {
  //     setError("Pincode is required");
  //     return;
  //   }

  //   if (labWebsite == "") {
  //     setError("Website URL is required");
  //     return;
  //   }

  //   if (contactEmail == "") {
  //     setError("Contact Email-Id is required");
  //     return;
  //   }

  //   if (contactNumber1 == "") {
  //     setError("Contact Number 1 is required");
  //     return;
  //   }

  //   if (contactNumber2 == "") {
  //     setError("Contact Number 2 is required");
  //     return;
  //   }

  //   if (gstNumber == "") {
  //     setError("GST Number is required");
  //     return;
  //   }

  //   if (limageName == "" && limageType == "" && limageData == "") {
  //     setError("Primary Brand Logo is required");
  //     return;
  //   }

  //   if (sealLogo == "" || sealLogo == null) {
  //     setError("Seal Logo is required");
  //     return;
  //   }

  //   if (nablLogo == "" || nablLogo == null) {
  //     setError("NABL Logo is required");
  //     return;
  //   }

  //   if (adminName == "") {
  //     setError("Admin Name is required");
  //     return;
  //   }

  //   if (adminEmail == "") {
  //     setError("Admin Email is required");
  //     return;
  //   }

  //   if (adminPassword == "") {
  //     setError("Admin Password is required");
  //     return;
  //   }

  //   setError("");

  //   const newlab = {
  //     lab_name: name,

  //     address1,
  //     address2,
  //     address3,

  //     city,
  //     state: lstate,
  //     country,
  //     pincode,

  //     lab_website: labWebsite,
  //     contact_email: contactEmail,
  //     contact_number1: contactNumber1,
  //     contact_number2: contactNumber2,

  //     symbol,

  //     email_smtp_server_host: emailSmtpServerHost.replace(/\s/g, ''),
  //     email_smtp_server_port: emailSmtpServerPort,
  //     sender_email: senderEmail.replace(/\s/g, ''),
  //     sender_password: senderPassword.replace(/\s/g, ''),

  //     gst_number: gstNumber,
  //     lab_active_flag: labActiveFlag,

  //     brand_logo_filename: limageName,
  //     brand_logo_mime_type: limageType,
  //     brand_logo: limageData,

  //     other_logo1_image_filename: OLImage1Name,
  //     other_logo1_image_mime_type: OLImage1mageType,
  //     other_logo1_image: OLImage1mageData,

  //     other_logo2_image_filename: OLImage2Name,
  //     other_logo2_image_mime_type: OLImage2mageType,
  //     other_logo2_image: OLImage2mageData,

  //     adminName,
  //     adminEmail,
  //     adminPassword,

  //     MainLogo,
  //     secondLogo,
  //     thirdLogo,

  //     sealLogo,
  //     nablLogo,

  //     nabl_qr_Code_logo_1, nableURL_1,
  //     nabl_qr_Code_logo_2, nableURL_2
  //   };

  //   const requestOptions = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + auth.token,
  //     },
  //     body: JSON.stringify(newlab)
  //   };

  //   try {
  //     setIsLoaded(true);

  //     const response = await fetch(config.Calibmaster.URL + "/api/lab/new", requestOptions);
  //     const data = await response.json();
  //     // console.log(data);

  //     if (data?.code === 201) {
  //       const newNotification = {
  //         title: "Lab Added Successfully",
  //         description: name,
  //         icon: "success",
  //         state: true,
  //         timeout: 15000,
  //       };

  //       dispatch(notificationActions.changenotification(newNotification));
  //       dispatch(sidebarActions.changesidebar("List-Labs"));
  //     } else {
  //       const errornotification = {
  //         title: data?.message,
  //         icon: "error",
  //         state: true,
  //         timeout: 15000,
  //       };
  //       dispatch(notificationActions.changenotification(errornotification));
  //       setError(data?.message);
  //     }
  //     setIsLoaded(false);

  //   } catch (error) {
  //     const errornotification = {
  //       title: "Error while Adding Lab!!",
  //       description: "Adding new Lab failed!!",
  //       icon: "error",
  //       state: true,
  //       timeout: 15000,
  //     };
  //     dispatch(notificationActions.changenotification(errornotification));
  //     setError("Error While Adding Lab!!");
  //     setIsLoaded(false);
  //   }
  // };



  const addLabHandler = async (value) => {

    const newlab = {
      lab_name: value.name,
      address1: value.address1,
      address2: value.address2,
      address3: value.address3,
      city: value.city,
      state: value.state,
      country: value.country,
      pincode: value.pincode,
      lab_website: value.labWebsite,
      contact_email: value.contactEmail,
      contact_number1: value.contactNumber1,
      contact_number2: value.contactNumber2,
      gst_number: value.gstNumber,
      lab_active_flag: value.isActive,

      // SMTP info
      email_smtp_server_host: value.emailSmtpServerHost?.trim(),
      email_smtp_server_port: value.emailSmtpServerPort,
      sender_email: value.senderEmail?.trim(),
      sender_password: value.senderPassword?.trim(),

      // Logos
      brand_logo_filename: value.brandLogo?.filename,
      brand_logo_mime_type: value.brandLogo?.mimeType,
      brand_logo: value.brandLogo?.data,


      other_logo1_image_filename: value.otherLogo1?.filename,
      other_logo1_image_mime_type: value.otherLogo1?.mimeType,
      other_logo1_image: value.otherLogo1?.data,

      other_logo2_image_filename: value.otherLogo2?.filename,
      other_logo2_image_mime_type: value.otherLogo2?.mimeTypemageType,
      other_logo2_image: value.otherLogo2?.data,

      seal_logo_filename: value.sealLogo?.filename,
      seal_logo_mime_type: value.sealLogo?.mimeType,
      seal_logo: value.sealLogo?.data,

      nabl_logo_filename: value.nablLogo?.filename,
      nabl_logo_mime_type: value.nablLogo?.mimeType,
      nabl_logo: value.nablLogo?.data,


      adminName: value.adminName,
      adminEmail: value.adminEmail,
      adminPassword: value.adminPassword,


      MainLogo: value.brandLogo?.data,
      secondLogo: value.otherLogo1?.data,
      thirdLogo: value.otherLogo2?.data,

      sealLogo: value.sealLogo?.data,
      nablLogo: value.nablLogo?.data,

      // QR Codes
      nabl_qr_Code_logo_1: value.nablQR1?.data,
      nableURL_1: value.NableURL_1,

      nabl_qr_Code_logo_2: value.nablQR2?.data,
      nableURL_2: value.NableURL_2,
    };


    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify(newlab)
    };

    try {
      setIsLoaded(true);

      const response = await fetch(config.Calibmaster.URL + "/api/lab/new", requestOptions);
      const data = await response.json();
      // console.log(data);

      if (data?.code === 201) {
        const newNotification = {
          title: "Lab Added Successfully",
          description: name,
          icon: "success",
          state: true,
          timeout: 15000,
        };

        dispatch(notificationActions.changenotification(newNotification));
        navigate("/dashboard/labs/list");
      } else {
        const errornotification = {
          title: data?.message,
          icon: "error",
          state: true,
          timeout: 15000,
        };
        dispatch(notificationActions.changenotification(errornotification));
        setError(data?.message);
      }
      setIsLoaded(false);

    } catch (error) {
      const errornotification = {
        title: "Error while Adding Lab!!",
        description: "Adding new Lab failed!!",
        icon: "error",
        state: true,
        timeout: 15000,
      };
      dispatch(notificationActions.changenotification(errornotification));
      setError("Error While Adding Lab!!");
      setIsLoaded(false);
    }
  };



  return (







    //     <div className="add__lab__container">

    //   <Card className="add__lab__card">

    //     <div className="add__lab__label">
    //       <h3>Add new Lab</h3>
    //     </div>

    //     <div className="add__lab__form">

    //       {/* Lab Name */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Lab Name"
    //           type="text"
    //           onchange={(e) => setName(e)}
    //           disabled={false}
    //           required={true}
    //           placeholder="Lab Name"
    //         />
    //       </div>

    //       {/* Address 1 */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Address Line 1"
    //           type="text"
    //           onchange={(v) => setAddress1(v)}
    //           disabled={false}
    //           required={true}
    //           placeholder="Address Line 1"
    //         />
    //       </div>

    //       {/* Address 2 */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Address Line 2"
    //           type="text"
    //           onchange={(v) => setAddress2(v)}
    //           disabled={false}
    //           required={false}
    //           placeholder="Address Line 2"
    //         />
    //       </div>

    //       {/* Address 3 */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Address Line 3"
    //           type="text"
    //           onchange={(v) => setAddress3(v)}
    //           disabled={false}
    //           required={false}
    //           placeholder="Address Line 3"
    //         />
    //       </div>

    //       {/* City  */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="City"
    //           type="text"
    //           value={city}
    //           onchange={(v) => setCity(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* State  */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="State"
    //           type="text"
    //           value={lstate}
    //           onchange={(v) => setLstate(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* Country  */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Country"
    //           type="text"
    //           value={country}
    //           onchange={(v) => setCountry(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* Pincode  */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Pincode"
    //           type="number"
    //           value={pincode}
    //           onchange={(v) => setPincode(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* Lab Website  */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Lab Website"
    //           type="text"
    //           value={labWebsite}
    //           onchange={(v) => setLabWebsite(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* Contact Email  */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Contact Email"
    //           type="text"
    //           value={contactEmail}
    //           onchange={(v) => setContactEmail(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* Contact Number 1 */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Contact Number 1"
    //           type="text"
    //           value={contactNumber1}
    //           onchange={(v) => setContactNumber1(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* Contact Number 2 */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Contact Number 2"
    //           type="text"
    //           value={contactNumber2}
    //           onchange={(v) => setContactNumber2(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* Symbol*/}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Symbol"
    //           type="text"
    //           value={symbol}
    //           onchange={(v) => setSymbol(v)}
    //           disabled={false}
    //           required={false}
    //         />
    //       </div>

    //       {/* Email Smtp Server Host */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Email Smtp Server Host"
    //           type="text"
    //           value={emailSmtpServerHost}
    //           onchange={(v) => setEmailSmtpServerHost(v)}
    //           disabled={false}
    //           required={false}
    //         />
    //       </div>

    //       {/* Email Smtp Server Port */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Email Smtp Server Port"
    //           type="number"
    //           value={emailSmtpServerPort}
    //           onchange={(v) => setEmailSmtpServerPort(v)}
    //           disabled={false}
    //           required={false}
    //         />
    //       </div>

    //       {/* Sender Email */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Sender Email"
    //           type="text"
    //           value={senderEmail}
    //           onchange={(v) => setSenderEmail(v)}
    //           disabled={false}
    //           required={false}
    //         />
    //       </div>

    //       {/* Sender Password */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Sender Password"
    //           type="text"
    //           value={senderPassword}
    //           onchange={(v) => setsenderPassword(v)}
    //           disabled={false}
    //           required={false}
    //         />
    //       </div>

    //       {/* GST Number*/}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="GST Number"
    //           type="text"
    //           value={gstNumber}
    //           onchange={(v) => setGstNumber(v)}
    //           disabled={false}
    //           required={true}
    //         />
    //       </div>

    //       {/* Lab Active Flag */}
    //       <div className="add__lab__item">
    //         <Input
    //           label="Lab Active Flag"
    //           className="rainbow-m-around_medium"
    //           type="checkbox"
    //           disabled={false}
    //           required={true}
    //           onChange={labActiveHandler}
    //         />
    //       </div>

    //       {/* Brand Logo */}
    //       <div className="add__lab__item">
    //         <CustomFilePicker
    //           label="Brand Logo"
    //           placeholder="Select or Drag and Drop image file"
    //           helptext="Select only one jpeg or png file. File size should be less than 50kb"
    //           required={true}
    //           onchange={lhandler}
    //         />
    //       </div>

    //       {/* Other Brand Logo 1 */}
    //       <div className="add__lab__item">
    //         <CustomFilePicker
    //           label="Other Brand Logo 1"
    //           placeholder="Select or Drag and Drop image file"
    //           helptext="Select only one jpeg or png file. File size should be less than 50kb"
    //           required={false}
    //           onchange={OL1handler}
    //         />
    //       </div>

    //       {/* Other Brand Logo 2 */}
    //       <div className="add__lab__item">
    //         <CustomFilePicker
    //           label="Other Brand Logo 2"
    //           placeholder="Select or Drag and Drop image file"
    //           helptext="Select only one jpeg or png file. File size should be less than 50kb"
    //           required={false}
    //           onchange={OL2handler}
    //         />
    //       </div>

    //       {/* Seal Logo */}
    //       <div className="add__lab__item">
    //         <CustomFilePicker
    //           label="Seal Logo"
    //           placeholder="Select or Drag and Drop image file"
    //           helptext="Select only one jpeg or png file. File size should be less than 50kb"
    //           required={true}
    //           onchange={SealLogohandler}
    //         />
    //       </div>

    //       {/* NABL Logo */}
    //       <div className="add__lab__item">
    //         <CustomFilePicker
    //           label="NABL Logo"
    //           placeholder="Select or Drag and Drop image file"
    //           helptext="Select only one jpeg or png file. File size should be less than 50kb"
    //           required={true}
    //           onchange={NABLLogohandler}
    //         />
    //       </div>

    //       {/* QR Code Info  */}
    //       <div className="add__lab__label">
    //         <h3>QR Code Info</h3>
    //       </div>

    //       {/* NABL Certificate of Accreditation QR code */}
    //       <div className="add__lab__item">
    //         <CustomFilePicker
    //           label="NABL Certificate of Accreditation QR code"
    //           placeholder="Select or Drag and Drop image file"
    //           helptext="Select only one jpeg or png file. File size should be less than 50kb"
    //           required={false}
    //           onchange={NableQRCode1handler}
    //         />
    //       </div>

    //       {/* NABL Certificate of Accreditation URL */}
    //       <div className="add__lab__item">
    //         <Textarea
    //           label="NABL Certificate of Accreditation URL"
    //           rows={4}
    //           required={false}
    //           placeholder="Placeholder Text"
    //           onChange={(e) => setNableURL_1(e.target.value)}
    //         />
    //       </div>

    //       {/* NABL Scope of Accreditation QR Code */}
    //       <div className="add__lab__item">
    //         <CustomFilePicker
    //           label="NABL Scope of Accreditation QR Code"
    //           placeholder="Select or Drag and Drop image file"
    //           helptext="Select only one jpeg or png file. File size should be less than 50kb"
    //           required={false}
    //           onchange={(e) => NableQRCode2handler(e)}
    //         />
    //       </div>

    //       {/* NABL Scope of Accreditation URL */}
    //       <div className="add__lab__item">
    //         <Textarea
    //           label="NABL Scope of Accreditation URL"
    //           rows={4}
    //           required={false}
    //           placeholder="Placeholder Text"
    //           onChange={(e) => setNableURL_2(e.target.value)}
    //         />
    //       </div>

    //       {/* Admin Headline  */}
    //       <div className="add__lab__label">
    //         <h3>Admin Details</h3>
    //       </div>

    //       {/* Admin Input  */}
    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Admin Name"
    //           type="text"
    //           value={adminName}
    //           onchange={(v) => setAdminName(v)}
    //           disabled={false}
    //           required={true}
    //           placeholder="Admin Name"
    //         />
    //       </div>

    //       <input type="email" id="email" style={{ height: 0, width: 0, border: 0 }} />
    //       <input type="password" id="password" style={{ height: 0, width: 0, border: 0 }} />

    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Admin Email"
    //           type="text"
    //           onchange={(v) => setAdminEmail(v)}
    //           disabled={false}
    //           required={true}
    //           placeholder="Admin Email"
    //         />
    //       </div>

    //       <div className="add__lab__item">
    //         <CustomInput
    //           label="Admin Password"
    //           type="password"
    //           onchange={(v) => setAdminPassword(v)}
    //           disabled={false}
    //           required={true}
    //           placeholder="Admin Password"
    //         />
    //       </div>

    //       {
    //         error && <p className="red center w100" style={{ display: "block", width: "100%" }}>
    //           {error}
    //         </p>
    //       }

    //       {isLoaded ? <Loader /> : ""}

    //       <div className="add__lab__btn">
    //         <CustomButton
    //           label="Add Lab"
    //           variant="success"
    //           onclick={!isLoaded ? addLabHandler : null}
    //         />
    //       </div>

    //     </div>

    //   </Card>

    // </div>
    <>
      <LabForm onSubmit={addLabHandler} />
    </>

  );
};

export default Labs;
