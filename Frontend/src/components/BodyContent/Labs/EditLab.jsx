import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../context/auth-context";
import { useDispatch, useSelector } from "react-redux";
import config from "../../../utils/config.json";
import "./Labs.css";
import { useNavigate } from "react-router-dom";
import Loader from "../../UI/Loader";
import LabForm from "../Forms/LabForm";
import GlobalNotification from "../../../utils/GlobalNotification";

const EditLab = () => {

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
                setLabData({
                    name: data?.lab_name,
                    address1: data?.address1,
                    address2: data?.address2,
                    address3: data?.address3,
                    city: data?.city,
                    state: data?.state,
                    country: data?.country,
                    pincode: data?.pincode,
                    gstNumber: data?.gst_number,
                    labWebsite: data?.lab_website,
                    contactEmail: data?.contact_email,
                    contactNumber1: data?.contact_number1,
                    contactNumber2: data?.contact_number2,
                    labActiveFlag: data?.lab_active_flag,

                    // SMTP
                    emailSmtpServerHost: data?.email_smtp_server_host,
                    emailSmtpServerPort: data?.email_smtp_server_port,
                    senderEmail: data?.sender_email,
                    senderPassword: data?.sender_password,

                    // Logos
                    brandLogo: data?.brand_logo_filename,
                    otherLogo1: data?.other_logo1_image_filename,
                    otherLogo2: data?.other_logo2_image_filename,
                    sealLogo: data?.seal_image_filename,
                    nablLogo: data?.nabl_logo_filename,

                    // QR Codes
                    nablQR1: data?.certificate_accreditation_qr_code_logo_1,
                    nablQR2: data?.scope_accreditation_qr_code_logo_2,
                    NableURL_1: data?.certificate_accreditation_url_1,
                    NableURL_2: data?.scope_accreditation_url_2,

                    // Admin (if available)
                    adminName: data?.admin_name,
                    adminEmail: data?.admin_email,
                });

                GlobalNotification.success({
                    title: response?.message,
                });

                setIsLoaded(false);
            } else {
                GlobalNotification.error({
                    title: "Something went wrong",
                    description: response?.message || "Edit Lab",
                });
                setIsLoaded(false);
            }
        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong",
                description: "Edit Lab",
            });
            setIsLoaded(false);
        }
    }

    useEffect(() => {
        fetchLabById();
        if (!(labIdvalue && !auth.labId)) {
            setIsAdmin(true);
        }
    }, [labIdvalue, auth.labId]);



    // Removed legacy code




    const addLabHandlers = async (value) => {
        //     setIsAdmin(false);
        //     return;
        // }
        try {
            setIsLoaded(true);

            const newlab = {
                labId: labIdvalue || auth.labId,
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
                email_smtp_server_port: value.emailSmtpServerPort ? parseInt(value.emailSmtpServerPort) : null,
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
                other_logo2_image_mime_type: value.otherLogo2?.mimeType,
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

                // Update the logo in AuthContext if the updated lab is the current lab
                if (data.brand_logo_filename && (labIdvalue === auth.labId || !labIdvalue)) {
                    auth.setLogo(data.brand_logo_filename);
                }

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
        // Removed legacy code
        <>
            {isLoaded && <Loader />}
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