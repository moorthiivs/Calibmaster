import "./QuotationConfig.css";
import { Card, Spinner,Input, CheckboxToggle, Modal } from "react-rainbow-components";
import { useState, useEffect, useContext } from "react";
import CustomButton from "../../../Inputs/CustomButton";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../../store/nofitication";
import config from "../../../../utils/config.js";
import Loader from "../../../UI/Loader";


const EditQuotationConfig = ({ isOpen, onRequestClose, data }) => {
    const [quotationDetail,setQuotationDetail]=useState({
        panNumber:data.PAN_number,
        labShortName:data.Lab_Short_Name,
        quotationShortName:data.Quotation_Short_Name,
        currentFinancialYear:data.Current_Financial_Year,
        runningQuotationNumber:data.Running_Quotation_Number,
        HSN_SAC:data.HSN_SAC,
        gstPercentage:data.GST_Percentage
    })
    const [error, setError] = useState("");
    const [isLoaded, setIsLoaded] = useState(true);
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    
    function handleChange(event) {
        setQuotationDetail((prev) => {
            return { ...prev, [event.target.name]: event.target.value }
        })
    }
    const handleSubmit= async ()=>{
        try {
            if (quotationDetail.panNumber == "") {
              setError("Please Enter PAN Number"); return;
            }
            if (quotationDetail.labShortName == "") {
              setError("Please Enter Lab Short Name"); return;
            }
            if (quotationDetail.quotationShortName == "") {
              setError("Please Enter Quotation Short Name"); return;
            }
            if (quotationDetail.currentFinancialYear == "") {
                setError("Please Enter Current Financial Year"); return;
            }
            if (quotationDetail.runningQuotationNumber == "") {
                setError("Please Enter Running Quotation Number"); return;
            }
            if (quotationDetail.HSN_SAC == "") {
              setError("Please Enter HSN/SAC Code"); return;
            }
      
            setIsLoaded(false);
      
            const body = {
              lab_id: auth.labId,
              quotationDetail:quotationDetail  
            };
      
            const requestOptions = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + auth.token,
              },
              body: JSON.stringify(body),
            };
      
            let response = await fetch(config.Calibmaster.URL + "/api/quotation/update-config-quotation", requestOptions);
            response = await response.json();
            if (response?.success) {
                setError("");
                const newNotification = {
                title: response?.msg,
                description: "",
                icon: "success",
                state: true,
                timeout: 15000,
              };
              dispatch(notificationActions.changenotification(newNotification));
              setIsLoaded(true);
            } else {
              // console.log(response.status==="FAILURE")
                setError("");
                const errornotification = {
                title: "Something went wrong !!!",
                description: response.message,
                icon: "error",
                state: true,
                timeout: 15000,
              };
              setIsLoaded(true);
              dispatch(notificationActions.changenotification(errornotification));
            }
          } catch (error) {
            // console.log(error);
            const errornotification = {
              title: "Something went wrong !!!",
              description: "",
              icon: "error",
              state: true,
              timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errornotification));
          }
    }
    
    if (!isLoaded)
      return <Loader />;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
        >
           <div className="quotation__page__label" style={{textAlign:"center"}}>
            <h3>Update Quotation Configuration</h3>
          </div>
          <div className="quotation__page__form">

  
            {/* PAN Number */}
            <div className="quotation__page__item">
              <Input
                placeholder="PAN Number"
                label="PAN Number"
                type="text"
                name="panNumber"
                value={quotationDetail?.panNumber}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>

            {/* GST Percentage */}
            <div className="quotation__page__item">
              <Input
                placeholder="GST Percentage"
                label="GST Percentage"
                type="number"
                name="gstPercentage"
                value={quotationDetail?.gstPercentage}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>
  

            <div className="quotation__page__item">
              <Input
                placeholder="Lab Short Name"
                label="Lab Short Name"
                type="text"
                name="labShortName"
                value={quotationDetail?.labShortName}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>
  
           
            <div className="quotation__page__item">
              <Input
                placeholder="Quotation Short Name"
                label="Quotation Short Name"
                type="text"
                name="quotationShortName"
                value={quotationDetail?.quotationShortName}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>


           
            <div className="quotation__page__item">
              <Input
                name="currentFinancialYear"
                placeholder="Current Financial Year"
                label="Current Financial Year"
                type="text"
                value={quotationDetail?.currentFinancialYear}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>

          
            <div className="quotation__page__item">
              <Input
                placeholder="Running Quotation Number"
                name="runningQuotationNumber"
                label="Running Quotation Number"
                type="number"
                value={quotationDetail?.runningQuotationNumber}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>

          
            <div className="quotation__page__item">
              <Input
                placeholder="HSN/SAC Code"
                label="HSN/SAC Code"
                type="text"
                name="HSN_SAC"
                value={quotationDetail.HSN_SAC}
                min={1}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>

            <div style={{width:"100%"}}>
                 {error && <p className="red center w100" style={{ margin: 0 }}>{error}</p>}
            </div>
            <div className="quotation__page__btn">
              <CustomButton
                label="Update"
                variant="success"
                onclick={handleSubmit}
              />
            </div>

          </div>
        </Modal>
    )
}

export default EditQuotationConfig
