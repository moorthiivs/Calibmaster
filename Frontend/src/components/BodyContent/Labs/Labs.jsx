import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { useNavigate } from "react-router-dom";
import Loader from '../../UI/Loader'
import LabForm from "../Forms/LabForm";
import GlobalNotification from "../../../utils/GlobalNotification";

const Labs = (props) => {

  const auth = useContext(AuthContext);
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const navigate = useNavigate();

  // Removed unused handlers







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
        GlobalNotification.success({
          title: "Lab Added Successfully",
          description: value.name,
        });
        
        // If no lab is currently selected, auto-select the new lab
        if (!auth.labId && data.result?.lab_id) {
          auth.switchLab(data.result.lab_id);
          navigate("/dashboard");
        } else {
          navigate("/dashboard/labs/list");
        }
      } else {
        GlobalNotification.error({
          title: "Error while Adding Lab!!",
          description: data?.message,
        });
        setError(data?.message);
      }
      setIsLoaded(false);

    } catch (error) {
      GlobalNotification.error({
        title: "Error while Adding Lab!!",
        description: "Adding new Lab failed!!",
      });
      setError("Error While Adding Lab!!");
      setIsLoaded(false);
    }
  };



  return (

    <>
      {isLoaded && <Loader />}
      <LabForm onSubmit={addLabHandler} loading={isLoaded} />
    </>

  );
};

export default Labs;
