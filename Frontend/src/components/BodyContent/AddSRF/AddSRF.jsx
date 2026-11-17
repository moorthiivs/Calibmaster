import { Card, Input, DatePicker, Switch, Typography, Divider, notification, Skeleton, Select } from "antd";
import { useContext, useEffect, useState } from "react";
import CompanyLookUp from "./CompanyLookUp";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { companiesActions } from "../../../store/companies";
import { notificationActions } from "../../../store/nofitication";
import ItemsList from "../ItemsList/ItemsList";
import { useNavigate } from "react-router-dom";
import { itemsActions } from "../../../store/items";
import { formattedDate } from "../../helpers/Helper";
import Loader from "../../UI/Loader";
import dayjs from "dayjs";
import { usePermissions } from "../../../hooks/usePermissions";

const { TextArea } = Input;
const { Text } = Typography;

// ─── Field Helper Components (Outside to avoid remounting state loss) ───
const FieldWrapper = ({ children, className = "" }) => (
  <div className={`transition-all duration-200 hover:transform hover:-translate-y-px ${className}`}>
    <div className="space-y-2">{children}</div>
  </div>
);

const FieldLabel = ({ label, required = false }) => (
  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-0.5">
    {label} {required && <span className="text-red-500">*</span>}
  </label>
);

const FieldError = ({ message }) =>
  message ? <p className="text-red-500 text-[10px] mt-1 ml-0.5 font-medium animate-pulse">{message}</p> : null;

const AddSRF = () => {
  const [api, contextHolder] = notification.useNotification();

  const [srfdate, setSrfDate] = useState(new Date());
  const [company, setCompany] = useState("");
  const [contactperson, setContactPerson] = useState("");
  const [contactnumber, setContactNumber] = useState("");
  const [addcompanymodel, setAddCompanyModal] = useState(false);
  const [ruscflag, setRusc] = useState(true);
  const [department, setDepartment] = useState("");
  const [customerdc, setCustomerDC] = useState("");
  const [customerDCFile, setCustomerDCFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [repcompany, setrepCompany] = useState();
  const [customerdcdate, setCustomerDcDate] = useState(formattedDate(new Date()));

  const [srfno, setSRFNo] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [statementofconflag, setStatementofConFlag] = useState(false);
  const [statmentofconfirmity, setStatementofConfirmity] = useState("");
  const [uncertainityflag, setUncertainityFlag] = useState(false);
  const [issueno, setIssueNo] = useState("");
  const [issuedate, setIssueDate] = useState();
  const [amendno, setAmendNo] = useState("");
  const [amenddate, setAmendDate] = useState();
  const [sendsrf, setSendSRF] = useState(false);
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [type, setType] = useState("I");
  const [dc_remarks, setDC_remarks] = useState("Returned after Calibration");
  const [returnable_material, setReturnable_material] = useState(false);
  const [Calibrationat, setCalibrationat] = useState("Lab");
  const [customer_code, setcustomer_code] = useState("");

  const [contract_days, setcontract_days] = useState(null);
  const [agreeddate, setagreedDate] = useState(null);

  const [existingSrfDates, setExistingSrfDates] = useState([]);
  const [srfAssignedTo, setSrfAssignedTo] = useState(null);
  const [assignedEngineers, setAssignedEngineers] = useState([]);

  const auth = useContext(AuthContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const items = useSelector((state) => state.items.list);
  const companies = useSelector((state) => state.companies.list);

  // Error State
  const [companyErr, setCompanyErr] = useState("");
  const [srfNoErr, setSrfNoErr] = useState("");
  const [contactPersonNameErr, setContactPersonNameErr] = useState("");
  const [contactPersonNumberErr, setContactPersonNumberErr] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [srfDateErr, setSrfDateErr] = useState("");
  const [cutomerDCDateErr, setcutomerDCDateErr] = useState("");
  const [customerDCErr, setCustomerDCErr] = useState("");
  const [customerDCFileErr, setCustomerDCFileErr] = useState("");
  const [CalibrationatErr, setCalibrationatErr] = useState("");

  // Check if input error
  useEffect(() => {
    setError();
  }, [
    srfno, srfdate, company, contactperson, contactnumber,
    contactEmail, department, repcompany, customerdc,
    customerdcdate, agreeddate, statementofconflag,
    statmentofconfirmity, uncertainityflag, sendsrf,
    issueno, issuedate, amendno, amenddate,
  ]);

  // Fetch SRF Configuration
  const fetchSRFConfig = async (dateStr = null) => {
    try {
      const url = config.Calibmaster.URL + `/api/srf-config/fetch/${auth.labId}` + (dateStr ? `?date=${dateStr}` : '');
      const data = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      });

      let response = await data.json();
      const { result, srfNo, existingSrfDates } = response;
      setSRFNo(srfNo);
      setExistingSrfDates(existingSrfDates);
      if (result?.length > 0) {
        setIssueNo(result[0]?.issue_no);
        setAmendNo(result[0]?.amend_no);
        setIssueDate(new Date(result[0]?.issue_date));
        setAmendDate(new Date(result[0]?.amend_date));
      }
    } catch (error) {
      console.log(error);
    }
  };
  // Fetch Companies
  useEffect(() => {
    const loadCompanies = async () => {
      if (!hasPermission("LIST_CUSTOMER") && !hasPermission("CREATE_SRF")) return;

      try {
        const response = await fetch(config.Calibmaster.URL + "/api/customers/list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify({ labId: auth.labId }),
        });
        const data = await response.json();
        if (data.code === 200 || data.data) {
          dispatch(companiesActions.changecompanies(data.data));
        }
      } catch (err) {
        console.error("Error while getting Companies:", err);
        setError("Error While Getting Companies");
      }
    };

    const fetchCalibrationEngineers = async () => {
      try {
        const res = await fetch(`${config.Calibmaster.URL}/api/users/get-calibration-engineers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify({ labId: auth.labId }),
        });
        const result = await res.json();
        if (result.status === "SUCCESS") {
          setAssignedEngineers(result.data.map(eng => ({ label: eng.name, value: eng.id })));
        }
      } catch (err) {
        console.error("Failed to fetch engineers", err);
      }
    };

    const loadAllData = async () => {
      setPageLoading(true);
      try {
        await Promise.all([loadCompanies(), fetchSRFConfig(), fetchCalibrationEngineers()]);
      } finally {
        setPageLoading(false);
      }
    };

    loadAllData();
  }, []);

  const addCompanyHandler = () => {
    const isopen = addcompanymodel;
    setAddCompanyModal(!isopen);
  };

  const sendsrfHandler = () => {
    setSendSRF(!sendsrf);
  };

  const ruscHandler = () => {
    setRusc(!ruscflag);
  };

  const statmentofconfHandler = () => {
    setStatementofConFlag(!statementofconflag);
  };

  const uncertainityflagHandler = () => {
    setUncertainityFlag(!uncertainityflag);
  };

  // Company 3 Address Handler
  const companyAddressesHandler = (company) => {
    let fullAddress = "";
    if (company?.address1) {
      fullAddress = company?.address1;
    }
    if (company?.address2) {
      fullAddress = `${company?.address1}, ${company?.address2}`;
    }
    if (company?.address3) {
      fullAddress = `${company?.address1}, ${company?.address2}, ${company?.address3}`;
    }
    return fullAddress;
  };

  // Add SRF Handler Function
  const addsrfHandler = async () => {
    setIsLoaded(false);
    let reportcompany;

    if (ruscflag) {
      reportcompany = company;
    } else {
      if (repcompany) {
        reportcompany = repcompany;
      } else {
        setIsLoaded(true);
        setError("Report Company Not Selected");
        api.error({
          message: "Input Required",
          description: "Please select a Report Company.",
        });
        return;
      }
    }

    if (srfno == "" || !srfno) {
      setIsLoaded(true);
      setSrfNoErr("SRF Number is required !!!");
      api.error({
        message: "Input Required",
        description: "SRF Number is required!",
      });
      return false;
    }

    if (!company || !reportcompany) {
      setIsLoaded(true);
      setCompanyErr("Company Not Selected");
      api.error({
        message: "Input Required",
        description: "Please select a Customer.",
      });
      return;
    }

    if (contactperson == "") {
      setIsLoaded(true);
      setContactPersonNameErr("Contact Person Name is required");
      api.error({
        message: "Input Required",
        description: "Contact Person Name is required.",
      });
      return;
    }

    if (contactnumber == "") {
      setIsLoaded(true);
      setContactPersonNumberErr("Contact Person Number is required");
      api.error({
        message: "Input Required",
        description: "Contact Person Number is required.",
      });
      return;
    }

    if (contactEmail == "") {
      setIsLoaded(true);
      setContactPersonEmail("Contact Person Email is required");
      api.error({
        message: "Input Required",
        description: "Contact Person Email is required.",
      });
      return;
    }

    // Customer DC No defaults to "NA" if left empty or whitespace
    const finalCustomerDC = customerdc?.trim() ? customerdc.trim() : "NA";


    if (customerdcdate == "") {
      setIsLoaded(true);
      setcutomerDCDateErr("Customer DC Date is required");
      api.error({
        message: "Input Required",
        description: "Date of Receipt (Customer DC Date) is required.",
      });
      return;
    }

    if (Calibrationat == "") {
      setIsLoaded(true);
      setCalibrationatErr("Calibration At is required");
      api.error({
        message: "Input Required",
        description: "Please select where the calibration is being done.",
      });
      return;
    }

    if (items.length === 0) {
      setIsLoaded(true);
      api.error({
        message: "No Items Added",
        description: "Please add at least one item to the SRF before submitting.",
      });
      return;
    }

    let customer_dc_file_path = null;
    if (customerDCFile) {
      const formData = new FormData();
      formData.append("file", customerDCFile);
      try {
        const uploadRes = await fetch(config.Calibmaster.URL + "/api/srf/upload-dc", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + auth.token,
          },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.code === 200) {
          customer_dc_file_path = uploadData.filename;
        } else {
          setIsLoaded(true);
          api.error({
            message: "Upload Failed",
            description: "Failed to upload Customer DC file.",
          });
          return;
        }
      } catch (err) {
        setIsLoaded(true);
        api.error({ message: "Upload Failed", description: "Failed to upload Customer DC file." });
        return;
      }
    }

    const newsrf = {
      srfno: srfno,
      type: type,
      symbol: auth.symbol,
      date: srfdate,
      CompanyId: company.customer_id,
      contact_name: contactperson,
      contact_number: contactnumber,
      contact_email: contactEmail,
      department: department,
      reportcompanyId: reportcompany.customer_id,
      customer_dc: finalCustomerDC,
      customer_dc_file_path: customer_dc_file_path,
      customer_dc_date: customerdcdate,
      agreed_date: agreeddate,
      statement_of_confirmity_flag: statementofconflag,
      statement_of_confirmity: statmentofconfirmity,
      uncertainity_consider_flag: uncertainityflag,
      issue_no: issueno,
      issue_date: issuedate,
      amend_no: amendno,
      amend_date: amenddate,
      sendsrf,
      dc_remarks, returnable_material,
      Calibrationat,
      customer_code,
    };

    const requestBody = {
      srf: newsrf,
      items: items,
      labId: auth.labId,
    };

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify(requestBody),
    };

    fetch(config.Calibmaster.URL + "/api/srf/add", requestOptions)
      .then(async (response) => {
        const data = await response.json();

        setIsLoaded(true);

        if (data.code === 201) {
          setIsLoaded(true);
          dispatch(itemsActions.removeAllItem());
          navigate("/dashboard/srf");
          api.success({
            message: "SRF Added Successfully!!",
            description: data.message,
          });
        } else {
          setIsLoaded(true);
          api.error({
            message: "Error",
            description: data.message,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        setIsLoaded(true);
        api.error({
          message: "Error while Adding SRF!!",
          description: "Adding SRF Failed!!",
        });
      });
  };

  useEffect(() => {
    if (contract_days !== null) {
      setagreedDate(dayjs().add(contract_days, "day").format("YYYY-MM-DD"));
    }
  }, [contract_days]);

  const recentDate = existingSrfDates
    .map((d) => new Date(d))
    .reduce((max, curr) => (curr > max ? curr : max), new Date(0));

  const recentDateStr = recentDate.toISOString().split("T")[0];

  if (pageLoading) {
    return (
      <div className="p-2 sm:p-4 w-full max-w-[100vw] overflow-x-hidden">
        {contextHolder}
        <Card className="w-full shadow-md border-0 rounded-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <Skeleton.Input active size="small" style={{ width: 220, margin: '0 auto', display: 'block' }} />
          </div>
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Section header */}
            <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 24 }} />
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-12 gap-y-6 sm:gap-y-8 mb-8 sm:mb-12">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
                  <Skeleton.Input active block style={{ width: '100%' }} />
                </div>
              ))}
            </div>
            {/* Section header 2 */}
            <Skeleton.Input active size="small" style={{ width: 160, marginBottom: 24 }} />
            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-12 gap-y-6 sm:gap-y-8 mb-8 sm:mb-12">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
                  <Skeleton.Input active block style={{ width: '100%' }} />
                </div>
              ))}
            </div>
            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-12 gap-y-6 sm:gap-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton.Input active size="small" style={{ width: 90, marginBottom: 8 }} />
                  <Skeleton.Input active block style={{ width: '100%' }} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 w-full max-w-[100vw] overflow-x-hidden">
      {contextHolder}
      <Card className="w-full shadow-md border-0 rounded-2xl overflow-hidden">

        <div className="bg-linear-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-2 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 text-center uppercase tracking-widest">
            New SRF Creation
          </h2>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">

          {/* ═══════ SECTION 1: SRF Details ═══════ */}
          <div className="mb-12">
            <h4 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">

              SRF Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-12 gap-y-6 sm:gap-y-8 px-1 sm:px-2">

              {/* SRF Date */}
              <FieldWrapper>
                <FieldLabel label="SRF Date (Inward date)" />
                <DatePicker
                  showTime={{ format: "HH:mm" }}
                  format="DD/MM/YYYY HH:mm"
                  value={srfdate ? dayjs(srfdate) : null}
                  onChange={(value) => {
                    const dateObj = value ? value.toDate() : null;
                    setSrfDate(dateObj);
                    if (dateObj) {
                      setSrfDateErr("");
                      setCustomerDcDate(formattedDate(dateObj));
                      setcutomerDCDateErr("");
                      setagreedDate(dayjs(dateObj).add(7, "day").format("YYYY-MM-DD"));
                      
                      // Also update SRF Number preview
                      fetchSRFConfig(dateObj.toISOString());
                    } else {
                      setCustomerDcDate("");
                      fetchSRFConfig();
                    }
                  }}
                  disabledDate={(current) => {
                    if (!current) return false;
                    const tooEarly = recentDateStr ? current < dayjs(recentDateStr).startOf("day") : false;
                    const tooLate = current > dayjs().endOf("day");
                    return tooEarly || tooLate;
                  }}
                  size="large"
                  className="w-full"
                  placeholder="Select date & time"
                />
                <FieldError message={srfDateErr} />
              </FieldWrapper>

              {/* SRF Number */}
              <FieldWrapper>
                <FieldLabel label="SRF Number" required />
                <Input
                  placeholder="SRF Number"
                  type="text"
                  value={srfno}
                  disabled
                  size="large"
                  onChange={(e) => setSRFNo(e.target.value)}
                />
                <FieldError message={srfNoErr} />
              </FieldWrapper>

            </div>
          </div>

          <Divider className="my-2!" />

          {/* ═══════ SECTION 2: Customer Details ═══════ */}
          <div className="mb-12">
            <h4 className="text-sm font-black text-green-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">

              Customer Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-12 gap-y-6 sm:gap-y-8 px-1 sm:px-2">

              {/* Customer (Company Lookup) */}
              <FieldWrapper>
                <CompanyLookUp
                  options={companies}
                  onselect={(e) => setCompany(e)}
                  setContactPerson={(e) => setContactPerson(e)}
                  setContactNumber={(e) => setContactNumber(e)}
                  setContactEmail={(e) => setContactEmail(e)}
                  setcustomer_code={(e) => setcustomer_code(e)}
                  setcontract_days={(e) => setcontract_days(e)}
                  setCompanyErr={setCompanyErr}
                  label="Customer"
                  required
                />
                <FieldError message={companyErr} />
              </FieldWrapper>

              {/* Customer Code */}
              <FieldWrapper>
                <FieldLabel label="Customer Code / Customer Ref.No" />
                <Input
                  placeholder="Customer Code"
                  type="text"
                  size="large"
                  value={company ? company.customer_code : ""}
                  onChange={(e) => setcustomer_code(e.target.value)}
                />
              </FieldWrapper>

              {/* Customer DC No */}
              <FieldWrapper>
                <div className="flex items-center justify-between">
                  <FieldLabel label="Customer DC No" />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerDC("NA");
                      setCustomerDCErr("");
                    }}
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 underline cursor-pointer mb-1"
                  >
                    Set N/A
                  </button>
                </div>
                <Input
                  placeholder="Customer DC No (Default: NA)"
                  type="text"
                  size="large"
                  value={customerdc}
                  onChange={(e) => {
                    setCustomerDC(e.target.value);
                    setCustomerDCErr("");
                  }}
                />
                <FieldError message={customerDCErr} />
              </FieldWrapper>

              {/* Customer DC File */}
              <FieldWrapper>
                <FieldLabel label="Customer DC File (PDF Only)" />
                <Input
                  key={fileInputKey}
                  type="file"
                  accept=".pdf"
                  size="large"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.type !== "application/pdf") {
                      api.error({ message: "Invalid File", description: "File not allowed for upload" });
                      setCustomerDCFile(null);
                      setFileInputKey(Date.now());
                    } else {
                      setCustomerDCFile(file);
                    }
                  }}
                />
                <FieldError message={customerDCFileErr} />
              </FieldWrapper>

              {/* Date Of Receipt */}
              <FieldWrapper>
                <FieldLabel label="Date Of Receipt" required />
                <DatePicker
                  format="DD/MM/YYYY"
                  value={customerdcdate ? dayjs(customerdcdate) : null}
                  onChange={(value) => {
                    const dateObj = value ? value.toDate() : null;
                    // if (srfdate && dateObj && new Date(dateObj) > new Date(srfdate)) {
                    //   setcutomerDCDateErr("Customer DC Date cannot be after Inward date");
                    //   setCustomerDcDate(null);
                    // } else {
                    //   setcutomerDCDateErr("");
                    //   setCustomerDcDate(dateObj ? formattedDate(dateObj) : "");
                    // }
                    setCustomerDcDate(dateObj ? formattedDate(dateObj) : "");
                  }}
                  disabledDate={(current) => {
                    if (!current) return false;
                    const tooEarly = srfdate ? current < dayjs(srfdate).startOf("day") : false;
                    const tooLate = current > dayjs().endOf("day");
                    return tooEarly || tooLate;
                  }}
                  disabled
                  size="large"
                  className="w-full"
                  placeholder="Select date"
                />
                <FieldError message={cutomerDCDateErr} />
              </FieldWrapper>

              {/* Agreed Date of Completion */}
              <FieldWrapper>
                <FieldLabel label="Agreed Date of Completion" />
                <DatePicker
                  format="DD/MM/YYYY"
                  value={agreeddate ? dayjs(agreeddate) : null}
                  onChange={(value) => {
                    const dateObj = value ? value.toDate() : null;
                    setagreedDate(dateObj ? formattedDate(dateObj) : null);
                  }}
                  disabledDate={(current) => {
                    if (!srfdate) return false;
                    return current && current < dayjs(srfdate).startOf("day");
                  }}
                  size="large"
                  className="w-full"
                  placeholder="Select date"
                />
              </FieldWrapper>

              {/* Contact Person Name */}
              <FieldWrapper>
                <FieldLabel label="Contact Person Name" required />
                <Input
                  placeholder="Contact Person Name"
                  type="text"
                  size="large"
                  value={company ? company.customer_contact?.contact_fullname : ""}
                  onChange={(e) => {
                    setContactPerson(e.target.value);
                    setContactPersonNameErr("");
                  }}
                />
                <FieldError message={contactPersonNameErr} />
              </FieldWrapper>

              {/* Contact Person Number */}
              <FieldWrapper>
                <FieldLabel label="Contact Person Number" required />
                <Input
                  placeholder="Contact Person Number"
                  type="number"
                  size="large"
                  value={company ? company.customer_contact?.contact_phone_1 : ""}
                  onChange={(e) => {
                    setContactNumber(e.target.value);
                    setContactPersonNumberErr("");
                  }}
                />
                <FieldError message={contactPersonNumberErr} />
              </FieldWrapper>

              {/* Contact Person Email */}
              <FieldWrapper>
                <FieldLabel label="Contact Person Email" required />
                <Input
                  placeholder="Contact Person Email"
                  type="text"
                  size="large"
                  value={company ? company.customer_contact?.contact_email : ""}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    setContactPersonEmail("");
                  }}
                />
                <FieldError message={contactPersonEmail} />
              </FieldWrapper>

              {/* Customer Address */}
              <FieldWrapper className="lg:col-span-2">
                <FieldLabel label="Customer Address" required />
                <TextArea
                  value={companyAddressesHandler(company)}
                  rows={3}
                  disabled
                  className="bg-gray-50! dark:bg-gray-800! dark:text-gray-300 dark:border-gray-700!"
                />
              </FieldWrapper>

            </div>

            {/* Report Company (conditional - hidden by default since ruscflag is true) */}
            {!ruscflag && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 px-1 sm:px-2 mt-4">
                <FieldWrapper>
                  <FieldLabel label="Report Company Name" required />
                  <CompanyLookUp
                    options={companies}
                    onselect={(v) => setrepCompany(v)}
                    setContactPerson={() => { }}
                    setContactNumber={() => { }}
                    setContactEmail={() => { }}
                    setcustomer_code={() => { }}
                    setcontract_days={() => { }}
                    setCompanyErr={() => { }}
                    label="Report Company Name"
                    required
                  />
                </FieldWrapper>
                <FieldWrapper>
                  <FieldLabel label="Report Company Address" required />
                  <TextArea
                    value={
                      repcompany
                        ? repcompany.address1 + ", " + repcompany.address2 + ", " + repcompany.address3
                        : ""
                    }
                    rows={4}
                    disabled
                    className="bg-gray-50!"
                  />
                </FieldWrapper>
              </div>
            )}
          </div>

          <Divider className="my-2!" />

          {/* ═══════ SECTION 3: Options ═══════ */}
          <div className="mb-6">
            <h4 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              Configuration Options
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-12 gap-y-6 sm:gap-y-8 px-1 sm:px-2">

              {/* Assigned To (SRF Level) */}
              <FieldWrapper>
                <FieldLabel label="Assigned To (Calibration Engineer)" />
                <Select
                  showSearch
                  size="large"
                  allowClear
                  placeholder="Select Calibration Engineer"
                  options={assignedEngineers}
                  value={srfAssignedTo}
                  onChange={(v) => setSrfAssignedTo(v)}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  className="w-full"
                />
              </FieldWrapper>

              {/* Send SRF through Email */}
              <FieldWrapper>
                <FieldLabel label="Send SRF through Email" />
                <Switch
                  checked={sendsrf}
                  onChange={sendsrfHandler}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                />
              </FieldWrapper>

              {/* Statement of Conformity Toggle */}
              <FieldWrapper>
                <FieldLabel label="Statement of conformity" />
                <Switch
                  checked={statementofconflag}
                  onChange={statmentofconfHandler}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                />
              </FieldWrapper>

              {/* Uncertainty Toggle */}
              <FieldWrapper className="lg:col-span-2">
                <FieldLabel label="Uncertainty should be consider for the declaration of statement of the conformity" />
                <Switch
                  checked={uncertainityflag}
                  onChange={uncertainityflagHandler}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                />
              </FieldWrapper>

            </div>

            {/* Statement of Conformity TextArea (conditional) */}
            {statementofconflag && (
              <div className="px-2 mt-4 max-w-xl">
                <FieldLabel label="Statement of Conformity" required />
                <TextArea
                  value={statmentofconfirmity}
                  onChange={(e) => setStatementofConfirmity(e.target.value)}
                  rows={4}
                  placeholder="Enter statement of conformity..."
                />
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-center mt-4 font-medium">{error}</p>
          )}
        </div>
      </Card>

      {/* ─── SRF ITEMS TABLE ──────────────────────────────── */}
      <div className="mt-8">
        <ItemsList addsrf={addsrfHandler} isLoaded={isLoaded} srfAssignedTo={srfAssignedTo} />
      </div>
      {!isLoaded && <Loader />}
    </div>
  );
};

export default AddSRF;
