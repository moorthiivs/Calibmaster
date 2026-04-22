import "./QuotationConfig.css";
import { Card, Spinner,Input, CheckboxToggle } from "react-rainbow-components";
import { useState, useEffect, useContext } from "react";
import CustomButton from "../../../Inputs/CustomButton";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../../store/nofitication";
import config from "../../../../utils/config.json";
import { useNavigate } from "react-router-dom";
import Loader from "../../../UI/Loader";

const QuotationConfig = () => {
    const [quotationDetail,setQuotationDetail]=useState({
        panNumber:"",
        labShortName:"",
        quotationShortName:"",
        currentFinancialYear:"",
        runningQuotationNumber:0,
        HSN_SAC:"",
        gstPercentage:""
    })
    const [error, setError] = useState("");
    const [isLoaded, setIsLoaded] = useState(true);
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
  const navigate = useNavigate();
    const fetchLabQuotationConfig = async () => {

        try {
            setIsLoaded(false);
            const requestOptions = {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + auth.token,
            }
          };
    
          let response = await fetch(config.Calibmaster.URL + `/api/quotation/fetch-lab-quotation-config/${auth.labId}`, requestOptions);
          response = await response.json();
          console.log(response)
          const {Running_Quotation_Number}=response.LabQuotationConfig[0] ? response.LabQuotationConfig[0]: 0;
          if(response){
            setIsLoaded(true);
            quotationDetail.runningQuotationNumber=Running_Quotation_Number;

            const newNotification = {
                title: "Quotation Detail fetched Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 1500,
            };
            dispatch(notificationActions.changenotification(newNotification));
            
        }
        } catch (error) {
          
          const errornotification = {
            title: "Quotation Detail not Found",
            icon: "error",
            state: true,
            timeout: 15000,
          };
          setIsLoaded(true);
          dispatch(notificationActions.changenotification(errornotification));
        }
      }
    
      useEffect(() => {
        fetchLabQuotationConfig();
      }, []);
    
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
            if (quotationDetail.runningQuotationNumber == "" || quotationDetail.runningQuotationNumber==undefined) {
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
            console.log(body);
      
            const requestOptions = {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + auth.token,
              },
              body: JSON.stringify(body),
            };
      
            let response = await fetch(config.Calibmaster.URL + "/api/quotation/config-quotation", requestOptions);
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
              navigate("/dashboard/quotation-config");
            } else {
              console.log(response.status==="FAILURE")
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
            console.log(error);
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
    
    return (
        <div className="quotation__page">
        <Card className="quotation__page__card">
          <div className="quotation__page__label">
            <h3 className="text-lg font-bold my-5 text-center">Create Quotation Configuration</h3>
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
  
            {/* Bank Account Number */}
            <div className="quotation__page__item">
              <Input
                placeholder="Lab Short Name"
                label="Lab Short Name"
                type="text"
                name="labShortName"
                // value={quotationDetail}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>
  
            {/* Bank Name */}
            <div className="quotation__page__item">
              <Input
                placeholder="Quotation Short Name"
                label="Quotation Short Name"
                type="text"
                name="quotationShortName"
                // value={quotationDetail?.bankName}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>


            {/* Bank Branch */}
            <div className="quotation__page__item">
              <Input
                name="currentFinancialYear"
                placeholder="Current Financial Year"
                label="Current Financial Year"
                type="text"
                // value={quotationDetail?.branch}
                onChange={handleChange}
                disabled={false}
                required={true}
              />
            </div>

            {/* Bank IFSC Code */}
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

            {/* HSN/SAC Code */}
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


  
            {!isLoaded ? <Loader /> : null}
            <div style={{width:"100%"}}>
                 {error && <p className="red center w100" style={{ margin: 0 }}>{error}</p>}
            </div>
            <div className="quotation__page__btn">
              <CustomButton
                label="Create or Update"
                variant="success"
                onclick={handleSubmit}
              />
            </div>

          </div>
        </Card>
      </div>
 
    )
}

export default QuotationConfig