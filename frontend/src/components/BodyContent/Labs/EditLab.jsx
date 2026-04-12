import { useContext, useState, useEffect } from "react";
import CustomInput from "../../Inputs/CustomInput";
import { Card, Spinner, Textarea } from "react-rainbow-components";
import CustomButton from "../../Inputs/CustomButton";
import { AuthContext } from "../../../context/auth-context";
import { useDispatch, useSelector } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
import CustomFilePicker from "../../Inputs/CustomFilePicker";
import { labSchema } from "../../../Schemas/editLab";
import { getBase64 } from "../../../utils/utilfuns";
import { Input } from "react-rainbow-components";
import "./Labs.css";
import { useNavigate } from "react-router-dom";
import noImage from "../../../assets/no-image.jpg";
import Loader from "../../UI/Loader";
import LabForm from "../Forms/LabForm";
import GlobalNotification from "../../../utils/GlobalNotification";

const EditLab = () => {

    const [labId, setLabId] = useState("");
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
    const [MainLogo, setMainLogo] = useState(null);
    const [previewMainLogo, setPreviewMainLogo] = useState("");

    const [OLImage1Name, setOLImage1Name] = useState("");
    const [OLImage1mageType, setOLImage1mageType] = useState("");
    const [OLImage1mageData, setOLImage1mageData] = useState("");
    const [secondLogo, setSecondLogo] = useState(null);
    const [previewSecondLogo, setPreviewSecondLogo] = useState("");

    const [OLImage2Name, setOLImage2Name] = useState("");
    const [OLImage2mageType, setOLImage2mageType] = useState("");
    const [OLImage2mageData, setOLImage2mageData] = useState("");
    const [thirdLogo, setThirdLogo] = useState(null);
    const [previewThirdLogo, setPreviewThirdLogo] = useState("");

    /** State For New Logos & QR Codes **/
    const [sealLogo, setsealLogo] = useState(null);
    const [previewSealLogo, setPreviewSealLogo] = useState(null);

    const [nablLogo, setnablLogo] = useState(null);
    const [previewNablLogo, setPreviewNablLogo] = useState(null);

    const [nabl_qr_Code_logo_1, setNabl_qr_Code_logo_1] = useState(null);
    const [previewNabl_qr_Code_logo_1, setPreviewNabl_qr_Code_logo_1] = useState(null);
    const [nableURL_1, setNableURL_1] = useState("");

    const [nabl_qr_Code_logo_2, setNabl_qr_Code_logo_2] = useState(null);
    const [previewNabl_qr_Code_logo_2, setPreviewNabl_qr_Code_logo_2] = useState(null);
    const [nableURL_2, setNableURL_2] = useState("");

    const auth = useContext(AuthContext);
    const [error, setError] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [labData, setLabData] = useState({});
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const labIdvalue = useSelector((state) => state.labIdKey.current);
    const fetchLabById = async () => {
        try {
            setIsLoaded(true);
            let response = await fetch(config.Calibmaster.URL + "/api/lab/fetchLab", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: labIdvalue || auth.labId })
            })
            response = await response.json();
            const { data } = response

            if (response.code === 200) {

                setName(data?.lab_name);

                setAddress1(data?.address1);
                setAddress2(data?.address2);
                setAddress3(data?.address3);

                setCity(data?.city);
                setLstate(data?.state);
                setCountry(data?.country);
                setPincode(data?.pincode);

                setLabWebsite(data?.lab_website);
                setContactEmail(data?.contact_email);
                setContactNumber1(data?.contact_number1);
                setContactNumber2(data?.contact_number1);

                setSymbol(data?.symbol);

                setEmailSmtpServerHost(data?.email_smtp_server_host);
                setEmailSmtpServerPort(data?.email_smtp_server_port);
                setSenderEmail(data?.sender_email);
                setsenderPassword(data?.sender_password);

                setGstNumber(data?.gst_number);
                setLabActiveFlag(data?.lab_active_flag);

                setNableURL_1(data?.certificate_accreditation_url_1);
                setNableURL_2(data?.scope_accreditation_url_2);

                setPreviewMainLogo(data?.brand_logo_filename);
                setPreviewSecondLogo(data?.other_logo1_image_filename);
                setPreviewThirdLogo(data?.other_logo2_image_filename);

                setPreviewSealLogo(data?.seal_image_filename);
                setPreviewNablLogo(data?.nabl_logo_filename)

                setPreviewNabl_qr_Code_logo_1(data?.certificate_accreditation_qr_code_logo_1);
                setPreviewNabl_qr_Code_logo_2(data?.scope_accreditation_qr_code_logo_2);


                const d = data;

                setLabData({
                    name: d.lab_name,
                    address1: d.address1,
                    address2: d.address2,
                    address3: d.address3,
                    city: d.city,
                    state: d.state,
                    country: d.country,
                    pincode: d.pincode,
                    gstNumber: d.gst_number,
                    labWebsite: d.lab_website,
                    contactEmail: d.contact_email,
                    contactNumber1: d.contact_number1,
                    contactNumber2: d.contact_number2,
                    labActiveFlag: d.lab_active_flag,

                    // SMTP
                    emailSmtpServerHost: d.email_smtp_server_host,
                    emailSmtpServerPort: d.email_smtp_server_port,
                    senderEmail: d.sender_email,
                    senderPassword: d.sender_password,

                    // Logos
                    brandLogo: d?.brand_logo_filename,
                    otherLogo1: d?.other_logo1_image_filename,
                    otherLogo2: d?.other_logo2_image_filename,
                    sealLogo: d?.seal_image_filename,
                    nablLogo: d?.nabl_logo_filename,

                    // QR Codes
                    nablQR1: d.certificate_accreditation_qr_code_logo_1,
                    nablQR2: d.scope_accreditation_qr_code_logo_2,
                    NableURL_1: d.certificate_accreditation_url_1,
                    NableURL_2: d.scope_accreditation_url_2,

                    // Admin (if available)
                    adminName: d.admin_name,
                    adminEmail: d.admin_email,
                });

                const newNotification = {
                    title: response?.message,
                    icon: "success",
                    state: true,
                    timeout: 5000
                };
                dispatch(notificationActions.changenotification(newNotification));

                setIsLoaded(false);
            } else {
                const newNotification = {
                    title: "Something went wrong",
                    description: "Edit Lab",
                    icon: "error",
                    state: true,
                };
                dispatch(notificationActions.changenotification(newNotification));
                setIsLoaded(false);
            }
        } catch (error) {
            console.log(error);
            const newNotification = {
                title: "Something went wrong",
                description: "Edit Lab",
                icon: "error",
                state: true,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setIsLoaded(false);
        }
    }

    useEffect(() => {
        if (labIdvalue && !auth.labId) {
            setLabId(labIdvalue);
            fetchLabById();
        }
        else {
            setLabId(auth.labId)
            fetchLabById();
            setIsAdmin(true);
        }
    }, [labIdvalue, labId, auth.labId]);



    // *** Brand Logo Handler ***
    const lhandler = (v) => {
        if (v && v[0]) {
            if (v[0].type == "image/png" || v[0].type == "image/jpeg" || v[0].type == "image/jpg") {
                if (v[0].size < 60000) {
                    setLImageName(v[0].name);
                    setLImageType(v[0].type);
                    getBase64(v[0], (result) => {
                        //console.log(result);
                        setMainLogo(result);
                        setLImageData(result);
                        setPreviewMainLogo(result);
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
                    setOLImage1Name(v[0].name);
                    setOLImage1mageType(v[0].type);
                    getBase64(v[0], (result) => {
                        //console.log(result);
                        setOLImage1mageData(result);
                        setSecondLogo(result);
                        setPreviewSecondLogo(result);
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
                    setOLImage2Name(v[0].name);
                    setOLImage2mageType(v[0].type);
                    getBase64(v[0], (result) => {
                        //console.log(result);
                        setOLImage2mageData(result);
                        setThirdLogo(result);
                        setPreviewThirdLogo(result);
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
                        setPreviewSealLogo(result);
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
                        setPreviewNabl_qr_Code_logo_1(result);
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
                        setPreviewNabl_qr_Code_logo_2(result);
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
        if (e.target.checked) {
            setLabActiveFlag(true)
        } else {
            setLabActiveFlag(false);
        }
    }

    // *** Add Lab Handler ***
    // const addLabHandler = async () => {
    //     if (isAdmin) {
    //         setIsAdmin(false);
    //         return;
    //     }
    //     if (name == "") {
    //         setError("Lab Name is required");
    //         return;
    //     }

    //     if (address1 == "") {
    //         setError("Address Line 1 is required");
    //         return;
    //     }

    //     if (city == "") {
    //         setError("City is required");
    //         return;
    //     }

    //     if (lstate == "") {
    //         setError("State is required");
    //         return;
    //     }

    //     if (country == "") {
    //         setError("Country is required");
    //         return;
    //     }

    //     if (pincode == "") {
    //         setError("Pincode is required");
    //         return;
    //     }

    //     if (labWebsite == "") {
    //         setError("Website URL is required");
    //         return;
    //     }

    //     if (contactEmail == "") {
    //         setError("Contact Email-Id is required");
    //         return;
    //     }

    //     if (contactNumber1 == "") {
    //         setError("Contact Number 1 is required");
    //         return;
    //     }

    //     if (contactNumber2 == "") {
    //         setError("Contact Number 2 is required");
    //         return;
    //     }

    //     if (gstNumber == "") {
    //         setError("GST Number is required");
    //         return;
    //     }

    //     setError("");

    //     try {
    //         setIsLoaded(true);

    //         const newlab = {
    //             labId,
    //             lab_name: name,

    //             address1,
    //             address2,
    //             address3,

    //             city,
    //             state: lstate,
    //             country,
    //             pincode,

    //             lab_website: labWebsite,
    //             contact_email: contactEmail,
    //             contact_number1: contactNumber1,
    //             contact_number2: contactNumber2,

    //             symbol,

    //             email_smtp_server_host: emailSmtpServerHost?.replace(/\s/g, ''),
    //             email_smtp_server_port: emailSmtpServerPort,
    //             sender_email: senderEmail?.replace(/\s/g, ''),
    //             sender_password: senderPassword?.replace(/\s/g, ''),

    //             gst_number: gstNumber,
    //             lab_active_flag: labActiveFlag,

    //             brand_logo_filename: limageName,
    //             brand_logo_mime_type: limageType,
    //             brand_logo: limageData,

    //             other_logo1_image_filename: OLImage1Name,
    //             other_logo1_image_mime_type: OLImage1mageType,
    //             other_logo1_image: OLImage1mageData,

    //             other_logo2_image_filename: OLImage2Name,
    //             other_logo2_image_mime_type: OLImage2mageType,
    //             other_logo2_image: OLImage2mageData,

    //             MainLogo,
    //             secondLogo,
    //             thirdLogo,

    //             sealLogo,
    //             nablLogo,

    //             nabl_qr_Code_logo_1, nableURL_1,
    //             nabl_qr_Code_logo_2, nableURL_2
    //         };

    //         const requestOptions = {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: "Bearer " + auth.token,
    //             },
    //             body: JSON.stringify(newlab)
    //         };

    //         const response = await fetch(config.Calibmaster.URL + "/api/lab/edit-lab", requestOptions);
    //         const data = await response.json();
    //         // console.log(data);

    //         setIsLoaded(false);
    //         if (data.code == 200) {
    //             const newNotification = {
    //                 title: "Lab updated Successfully",
    //                 icon: "success",
    //                 state: true,
    //                 timeout: 5000,
    //             };
    //             dispatch(notificationActions.changenotification(newNotification));

    //             if (labIdvalue && !auth.labId) dispatch(sidebarActions.changesidebar("List-Labs"));
    //             else setIsAdmin(true);

    //         } else {
    //             const errornotification = {
    //                 title: "Error while Updating Lab!!!",
    //                 icon: "error",
    //                 state: true,
    //                 timeout: 15000,
    //             };
    //             dispatch(notificationActions.changenotification(errornotification));
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         const errornotification = {
    //             title: "Error while Updating Lab!!!",
    //             icon: "error",
    //             state: true,
    //             timeout: 15000,
    //         };
    //         dispatch(notificationActions.changenotification(errornotification));
    //         setIsLoaded(false);
    //     }
    // };




    const addLabHandlers = async (value) => {
        // if (isAdmin) {
        //     setIsAdmin(false);
        //     return;
        // }
        try {
            setIsLoaded(true);

            const newlab = {
                labId,
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

            console.log(newlab, "newlab");

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(newlab)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/lab/edit-lab", requestOptions);
            const data = await response.json();
            // console.log(data);

            setIsLoaded(false);
            if (data.code == 200) {
                GlobalNotification.success({
                    title: "Lab updated Successfully",
                    description: data.message
                });
                if (labIdvalue && !auth.labId) navigate("/dashboard/labs/list");
                else setIsAdmin(true);

            } else {
                GlobalNotification.error({
                    title: "Error while Updating Lab!!!",
                    description: data.message
                });
            }
        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Error while Updating Lab!!!",
                description: data.message
            });
            setIsLoaded(false);
        }
    };
    return (
        // <div className="add__lab__container">

        //         <Card className="add__lab__card">

        //             <div className="add__lab__label">
        //                 <h3 style={{ textAlign: "center" }}>{labIdvalue ? 'Edit Lab' : 'Lab Info'}</h3>
        //             </div>

        //             <div className="add__lab__form">

        //                 {/* Lab Name */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Lab Name"
        //                         type="text"
        //                         onchange={(e) => setName(e)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                         value={name}
        //                         placeholder="Lab Name"
        //                     />
        //                 </div>

        //                 {/* Address 1 */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Address Line 1"
        //                         type="text"
        //                         onchange={(v) => setAddress1(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                         value={address1}
        //                         placeholder="Address Line 1"
        //                     />
        //                 </div>

        //                 {/* Address 2 */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Address Line 2"
        //                         type="text"
        //                         onchange={(v) => setAddress2(v)}
        //                         disabled={isAdmin}
        //                         required={false}
        //                         value={address2}
        //                         placeholder="Address Line 2"
        //                     />
        //                 </div>

        //                 {/* Address 3 */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Address Line 3"
        //                         type="text"
        //                         onchange={(v) => setAddress3(v)}
        //                         disabled={isAdmin}
        //                         required={false}
        //                         value={address3}
        //                         placeholder="Address Line 3"
        //                     />
        //                 </div>

        //                 {/* City  */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="City"
        //                         type="text"
        //                         value={city}
        //                         onchange={(v) => setCity(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* State  */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="State"
        //                         type="text"
        //                         value={lstate}
        //                         onchange={(v) => setLstate(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* Country  */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Country"
        //                         type="text"
        //                         value={country}
        //                         onchange={(v) => setCountry(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* Pincode  */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Pincode"
        //                         type="number"
        //                         value={pincode}
        //                         onchange={(v) => setPincode(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* Lab Website  */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Lab Website"
        //                         type="text"
        //                         value={labWebsite}
        //                         onchange={(v) => setLabWebsite(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* Contact Email  */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Contact Email"
        //                         type="text"
        //                         value={contactEmail}
        //                         onchange={(v) => setContactEmail(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* Contact Number 1 */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Contact Number 1"
        //                         type="text"
        //                         value={contactNumber1}
        //                         onchange={(v) => setContactNumber1(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* Contact Number 2 */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Contact Number 2"
        //                         type="text"
        //                         value={contactNumber2}
        //                         onchange={(v) => setContactNumber2(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* Symbol*/}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Symbol"
        //                         type="text"
        //                         value={symbol}
        //                         onchange={(v) => setSymbol(v)}
        //                         disabled={isAdmin}
        //                         required={false}
        //                     />
        //                 </div>

        //                 {/* Email Smtp Server Host */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Email Smtp Server Host"
        //                         type="text"
        //                         value={emailSmtpServerHost}
        //                         onchange={(v) => setEmailSmtpServerHost(v)}
        //                         disabled={isAdmin}
        //                         required={false}
        //                     />
        //                 </div>

        //                 {/* Email Smtp Server Port */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Email Smtp Server Port"
        //                         type="number"
        //                         value={emailSmtpServerPort}
        //                         onchange={(v) => setEmailSmtpServerPort(v)}
        //                         disabled={isAdmin}
        //                         required={false}
        //                     />
        //                 </div>

        //                 {/* Sender Email */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Sender Email"
        //                         type="text"
        //                         value={senderEmail}
        //                         onchange={(v) => setSenderEmail(v)}
        //                         disabled={isAdmin}
        //                         required={false}
        //                     />
        //                 </div>

        //                 {/* Sender Password */}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="Sender Password"
        //                         type="text"
        //                         value={senderPassword}
        //                         onchange={(v) => setsenderPassword(v)}
        //                         disabled={isAdmin}
        //                         required={false}
        //                     />
        //                 </div>

        //                 {/* GST Number*/}
        //                 <div className="add__lab__item">
        //                     <CustomInput
        //                         label="GST Number"
        //                         type="text"
        //                         value={gstNumber}
        //                         onchange={(v) => setGstNumber(v)}
        //                         disabled={isAdmin}
        //                         required={true}
        //                     />
        //                 </div>

        //                 {/* Lab Active Flag */}
        //                 <div className="add__lab__item">
        //                     <Input
        //                         label="Lab Active Flag"
        //                         className="rainbow-m-around_medium"
        //                         type="checkbox"
        //                         checked={labActiveFlag ? true : false}
        //                         disabled={isAdmin}
        //                         required={true}
        //                         onChange={labActiveHandler}
        //                     />
        //                 </div>

        //                 {/* Brand Logo */}
        //                 <div className="add__lab__item">
        //                     <img
        //                         style={{ height: '80px', objectFit: 'scale-down' }}
        //                         src={previewMainLogo ? (MainLogo || `${config.Calibmaster.URL}/images/${previewMainLogo}`) : noImage}
        //                         alt="brand-logo"
        //                     />
        //                     <CustomFilePicker
        //                         label="Brand Logo"
        //                         placeholder="Select or Drag and Drop image file"
        //                         helptext="Select only one jpeg or png file. File size should be less than 50kb"
        //                         required={true}
        //                         onchange={lhandler}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>

        //                 {/* Other Brand Logo 1 */}
        //                 <div className="add__lab__item">
        //                     <img
        //                         style={{ height: '80px', objectFit: 'scale-down' }}
        //                         src={previewSecondLogo ? (secondLogo || `${config.Calibmaster.URL}/images/${previewSecondLogo}`) : noImage}
        //                         alt="brand-logo"
        //                     />
        //                     <CustomFilePicker
        //                         label="Other Brand Logo 1"
        //                         placeholder="Select or Drag and Drop image file"
        //                         helptext="Select only one jpeg or png file. File size should be less than 50kb"
        //                         required={false}
        //                         onchange={OL1handler}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>

        //                 {/* Other Brand Logo 2 */}
        //                 <div className="add__lab__item">
        //                     <img
        //                         style={{ height: '80px', objectFit: 'scale-down' }}
        //                         src={previewThirdLogo ? (thirdLogo || `${config.Calibmaster.URL}/images/${previewThirdLogo}`) : noImage}
        //                         alt="brand-logo"
        //                     />
        //                     <CustomFilePicker
        //                         label="Other Brand Logo 2"
        //                         placeholder="Select or Drag and Drop image file"
        //                         helptext="Select only one jpeg or png file. File size should be less than 50kb"
        //                         required={false}
        //                         onchange={OL2handler}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>

        //                 {/* Seal Logo */}
        //                 <div className="add__lab__item">
        //                     <img
        //                         style={{ height: '80px', objectFit: 'scale-down' }}
        //                         src={previewSealLogo ? (sealLogo || `${config.Calibmaster.URL}/images/${previewSealLogo}`) : noImage}
        //                         alt="brand-logo"
        //                     />
        //                     <CustomFilePicker
        //                         label="Seal Logo"
        //                         placeholder="Select or Drag and Drop image file"
        //                         helptext="Select only one jpeg or png file. File size should be less than 50kb"
        //                         required={true}
        //                         onchange={SealLogohandler}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>

        //                 {/* NABL Logo */}
        //                 <div className="add__lab__item">
        //                     <img
        //                         style={{ height: '80px', objectFit: 'scale-down' }}
        //                         src={previewNablLogo ? (nablLogo || `${config.Calibmaster.URL}/images/${previewNablLogo}`) : noImage}
        //                         alt="brand-logo"
        //                     />
        //                     <CustomFilePicker
        //                         label="NABL Logo"
        //                         placeholder="Select or Drag and Drop image file"
        //                         helptext="Select only one jpeg or png file. File size should be less than 50kb"
        //                         required={true}
        //                         onchange={NABLLogohandler}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>


        //                 {/* QR Code Info  */}
        //                 <div className="add__lab__label">
        //                     <h3 style={{ textAlign: "center" }}>QR Code Info</h3>
        //                 </div>

        //                 {/* NABL Certificate of Accreditation QR code */}
        //                 <div className="add__lab__item">
        //                     <img
        //                         style={{ height: '80px', objectFit: 'scale-down' }}
        //                         src={previewNabl_qr_Code_logo_1 ? (nabl_qr_Code_logo_1 || `${config.Calibmaster.URL}/images/${previewNabl_qr_Code_logo_1}`) : noImage}
        //                         alt="brand-logo"
        //                     />
        //                     <CustomFilePicker
        //                         label="NABL Certificate of Accreditation QR code"
        //                         placeholder="Select or Drag and Drop image file"
        //                         helptext="Select only one jpeg or png file. File size should be less than 50kb"
        //                         required={false}
        //                         onchange={NableQRCode1handler}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>

        //                 {/* NABL Certificate of Accreditation URL */}
        //                 <div className="add__lab__item">
        //                     <Textarea
        //                         label="NABL Certificate of Accreditation URL"
        //                         rows={4}
        //                         required={false}
        //                         value={nableURL_1}
        //                         placeholder="Placeholder Text"
        //                         onChange={(e) => setNableURL_1(e.target.value)}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>

        //                 {/* NABL Scope of Accreditation QR Code */}
        //                 <div className="add__lab__item">
        //                     <img
        //                         style={{ height: '80px', objectFit: 'scale-down' }}
        //                         src={previewNabl_qr_Code_logo_2 ? (nabl_qr_Code_logo_2 || `${config.Calibmaster.URL}/images/${previewNabl_qr_Code_logo_2}`) : noImage}
        //                         alt="brand-logo"
        //                     />
        //                     <CustomFilePicker
        //                         label="NABL Scope of Accreditation QR Code"
        //                         placeholder="Select or Drag and Drop image file"
        //                         helptext="Select only one jpeg or png file. File size should be less than 50kb"
        //                         required={false}
        //                         onchange={(e) => NableQRCode2handler(e)}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>

        //                 {/* NABL Scope of Accreditation URL */}
        //                 <div className="add__lab__item">
        //                     <Textarea
        //                         label="NABL Scope of Accreditation URL"
        //                         rows={4}
        //                         required={false}
        //                         value={nableURL_2}
        //                         placeholder="Placeholder Text"
        //                         onChange={(e) => setNableURL_2(e.target.value)}
        //                         disabled={isAdmin}
        //                     />
        //                 </div>

        //                 {error && <p className="red center w100" style={{ display: "block", width: "100%" }}> {error}</p>}

        //                 <div className="add__lab__btn">
        //                     <CustomButton
        //                         label={isAdmin ? 'Edit Lab' : 'Update'}
        //                         variant="success"
        //                         onclick={addLabHandler}
        //                     />
        //                 </div>

        //             </div>

        //             {isLoaded && <Loader />}

        //         </Card>
        // </div>
        <>
            <LabForm
                initialValues={labData}
                mode="edit"
                onSubmit={addLabHandlers}
                loading={isLoaded}
            />

        </>

    )
}

export default EditLab;
