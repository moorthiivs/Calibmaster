import React, { useContext, useEffect, useState } from "react";
import { Card, Row, Col, DatePicker, Space, Typography, Select, Switch, Tooltip, Button } from "antd";
import dayjs from "dayjs";
import "./WelcomeScreen.css";
import "./HexagonMenu.css";
import TrendPieChart from "./Dashboard/TrendPieChart";
import config from '../../utils/config.json'
import { AuthContext } from "../../context/auth-context";
import { FileSearchOutlined, ClockCircleOutlined, CheckCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import DashboardCards from "./Dashboard/DashboardCards";
import { sidebarConfig } from "../Sidebar/sidebarConfig";
import { useNavigate } from "react-router-dom";
import { Drawer } from "antd";

// Import all page components
import Labs from "./Labs/Labs";
import LabList from "./Labs/LabList";
import EditLab from "./Labs/EditLab";
import ListCustomer from "./customer/ListCustomer";
import CreateCustomer from "./customer/CreateCustomer";
import EditCustomer from "./customer/EditCustomer";
import AddUser from "./AddUser/AddUser";
import Users from "./Users/Users";
import PasswordReset from "./AdminInfo/PasswordReset";
import CreateUOM from "./UOM/CreateUOM";
import ListUOM from "./UOM/ListUOM";
import EditUOM from "./UOM/EditUOM";
import MakeModelPage from "./MakeAndModel/MakeModelPage";
import CreateInstrument from "./Instrument/CreateInstrument";
import ListInstrument from "./Instrument/ListInstrument";
import EditInstrument from "./Instrument/EditInstrument";
import CreateInstrumentType from "./InstrumentType/CreateInstrumentType";
import ListInstrumentType from "./InstrumentType/ListInstrumentType";
import EditInstrumentType from "./InstrumentType/EditInstrumentType";
import StandardDetails from "./StandardDetails/StandardDetails";
import ListMaster from "./StandardDetails/ListMaster";
import MasterListDocAdd from "./MasterDocument/MasterListDoc/MasterListDocAdd";
import MasterListDocList from "./MasterDocument/MasterListDoc/MasterListDocList";
import MasterListDocDetailAdd from "./MasterDocument/MasterListDocDetail/MasterListDocDetailAdd";
import MasterListDocDetailList from "./MasterDocument/MasterListDocDetail/MasterListDocDetailList";
import MasterListDocFormatAdd from "./MasterDocument/MasterListDocFormat/MasterListDocFormatAdd";
import MasterListDocFormatList from "./MasterDocument/MasterListDocFormat/MasterListDocFormatList";
import DefineProcedure from "./DefineProcedure/DefineProcedure";
import ListDefinedProcedure from "./DefineProcedure/ListDefinedProcedure";
import CreateCalibmasterExcel from "./CalibmasterExcel/CreateCalibmasterExcel";
import ListCalibmasterExcel from "./CalibmasterExcel/ListCalibmasterExcel";
import AddUlr from "./AddULR/AddUlr";
import ListULR from "./AddULR/ListULR";
import AddSRF from "./AddSRF/AddSRF";
import SRFs from "./SRFs/SRFs";
import CreateCertificateConfig from "./CMSettings/Certificate/CreateCertificateConfig";
import ListCertificateConfig from "./CMSettings/Certificate/ListCertificateConfig";
import CertificateFormatCreator from "./CertificateFormatEditor/CertificateFormatEditor";
import CreateEmployee from "./EmployeeMasters/CreateEmployee";
import ListEmployee from "./EmployeeMasters/ListEmployee";
import InwardReports from "./Reports/InwardReports";
import DueDateChecker from "./CalibrationDueDate/DueDateCount";
import AddBankConfig from "./BankConfig/AddBankDetails";
import ListBankConfig from "./BankConfig/ListBankDetails";
import QuotationConfig from "./Quotation/QuotationConfig/QuotationConfig";
import QuotationConfigList from "./Quotation/QuotationConfig/QuotationConfigList";
import QuotationItem from "./Quotation/QuotationItem/QuotationItem";
import QuotationCustomerList from "./Quotation/QuotationItem/QuotationCustomerList";
import Email from "./Email/Email";
import DeletedIndex from "./DataStorage/DeletedIndex";
import SyncPage from "./SyncData/SyncPage";
import ScannerEnterResult from "./SRFs/ResultComponent/ScannerEnterResult/ScannerEnterResult";
import { Layout2 } from "./Dashboard/Layout2";
import DateRangeFilter from "../UI/DateRangeFilter";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;



const WelcomeScreen = () => {
  const auth = useContext(AuthContext)
  // const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [dateRange, setDateRange] = useState({
    from: dayjs().startOf("month").toDate(),
    to: dayjs().endOf("month").toDate(),
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [loading, setloading] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);
  const [drawerTitle, setDrawerTitle] = useState("");

  const [cardsData, setcardsData] = useState([])

  const [isAllPagemenu, setisAllPagemenu] = useState(false)
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState(6);
  const [linechartdata, setlinechartdata] = useState([])
  const [plantwiseData, setplantwiseData] = useState([])
  const [gaugewiseData, setgaugewiseData] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [enableSingle, setEnableSingle] = useState(false)
  const [enableCustomer, setEnableCustomer] = useState(false)
  const [enableQuickMenu, setEnableQuickMenu] = useState(() => {
    const stored = sessionStorage.getItem("enableQuickMenu");
    return stored ? JSON.parse(stored) : false;
  });
  const componentMap = {
    "/dashboard/labs": <Labs />,
    "/dashboard/labs/list": <LabList />,
    "/dashboard/labs/edit": <EditLab />,
    "/dashboard/customers/create": <CreateCustomer />,
    "/dashboard/customers": <ListCustomer />,
    "/dashboard/customers/edit": <EditCustomer />,
    "/dashboard/users/add": <AddUser />,
    "/dashboard/users": <Users />,
    "/dashboard/reset-password": <PasswordReset />,
    "/dashboard/uom/create": <CreateUOM />,
    "/dashboard/uom": <ListUOM />,
    "/dashboard/uom/edit": <EditUOM />,
    "/dashboard/make-model": <MakeModelPage />,
    "/dashboard/instruments/create": <CreateInstrument />,
    "/dashboard/instruments": <ListInstrument />,
    "/dashboard/instruments/edit": <EditInstrument />,
    "/dashboard/instrument-types/create": <CreateInstrumentType />,
    "/dashboard/instrument-types": <ListInstrumentType />,
    "/dashboard/instrument-types/edit": <EditInstrumentType />,
    "/dashboard/standard-details": <StandardDetails />,
    "/dashboard/masters": <ListMaster />,
    "/dashboard/master-doc/add": <MasterListDocAdd />,
    "/dashboard/master-doc": <MasterListDocList />,
    "/dashboard/master-doc-detail/add": <MasterListDocDetailAdd />,
    "/dashboard/master-doc-detail": <MasterListDocDetailList />,
    "/dashboard/master-doc-format/add": <MasterListDocFormatAdd />,
    "/dashboard/master-doc-format": <MasterListDocFormatList />,
    "/dashboard/procedures/define": <DefineProcedure />,
    "/dashboard/procedures": <ListDefinedProcedure />,
    "/dashboard/excel/create": <CreateCalibmasterExcel />,
    "/dashboard/excel": <ListCalibmasterExcel />,
    "/dashboard/ulr/add": <AddUlr />,
    "/dashboard/ulr": <ListULR />,
    "/dashboard/srf/add": <AddSRF />,
    "/dashboard/srf": <SRFs />,
    "/dashboard/certificate-config/create": <CreateCertificateConfig />,
    "/dashboard/certificate-config": <ListCertificateConfig />,
    "/dashboard/certificate-format": <CertificateFormatCreator />,
    "/dashboard/employees/create": <CreateEmployee />,
    "/dashboard/employees": <ListEmployee />,
    "/dashboard/inward-reports": <InwardReports />,
    "/dashboard/calibration-due": <DueDateChecker />,
    "/dashboard/bank-config/add": <AddBankConfig />,
    "/dashboard/bank-config": <ListBankConfig />,
    "/dashboard/quotation-config/create": <QuotationConfig />,
    "/dashboard/quotation-config": <QuotationConfigList />,
    "/dashboard/quotation/create": <QuotationItem />,
    "/dashboard/quotation/customers": <QuotationCustomerList />,
    "/dashboard/email": <Email />,
    "/dashboard/data-storage": <DeletedIndex />,
    "/dashboard/sync": <SyncPage />,
    "/dashboard/scanner": <ScannerEnterResult />,
  };

  const handleNavigation = (key, title) => {
    if (componentMap[key]) {
      setDrawerContent(componentMap[key]);
      setDrawerTitle(title);
      setDrawerVisible(true);
    } else {
      navigate(key);
    }
  };

  const fetchCustomers = async () => {
    setloading(true)
    try {
      const response = await fetch(config.Calibmaster.URL + "/api/customers/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId })
      });
      let { data } = await response.json();
      setCustomerList(data);
    } catch (error) {
      console.log(error);
    } finally {
      setloading(false)
    }
  }


  const fetchdashboarddata = async () => {
    setloading(true)
    try {

      const payload = {
        labId: auth.labId,
        customerId: enableCustomer ? (selectedCustomer || "") : "",
      };

      if (enableSingle && selectedDate) {
        payload.selectedDate = dayjs(selectedDate).format("DD-MM-YYYY");
      }
      // If range is selected and both dates are valid
      else if (!enableSingle && dateRange?.from && dateRange?.to) {
        payload.fromDate = dayjs(dateRange.from).format("DD-MM-YYYY");
        payload.toDate = dayjs(dateRange.to).format("DD-MM-YYYY");
      }
      // If range is selected but only 'from' is valid
      else if (!enableSingle && dateRange?.from && !dateRange?.to) {
        payload.fromDate = dayjs(dateRange.from).format("DD-MM-YYYY");
        payload.toDate = dayjs(dateRange.from).format("DD-MM-YYYY");
      }
      // If both are cleared or default, use current month
      else if (!enableSingle) {
        payload.fromDate = dayjs().startOf('month').format("DD-MM-YYYY");
        payload.toDate = dayjs().format("DD-MM-YYYY");
      }

      const response = await fetch(config.Calibmaster.URL + "/api/dashboard/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      //console.log(result);

      if (result) {
        setcardsData(result.cards)
      }

    } catch (error) {

      console.log(error);

    } finally {
      setloading(false)
    }
  }

  const fetchchartdata = async () => {
    try {
      setloading(true)
      const payload = {
        labId: auth.labId,
        customerId: enableCustomer ? (selectedCustomer || "") : "",
        range: timeRange
      };
      const response = await fetch(config.Calibmaster.URL + "/api/dashboard/line-chart-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result) {
        setlinechartdata(result.linechartdata)
        setplantwiseData(result.plantwiseData)
        setgaugewiseData(result.gaugeWiseData)
        setRecentActivities(result.recentActivities)
      }

    } catch (err) {
      console.log(err);
    } finally {
      setloading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
    fetchdashboarddata()
  }, [])



  useEffect(() => {
    fetchchartdata()
  }, [timeRange]);


  useEffect(() => {
    sessionStorage.setItem(
      "enableQuickMenu",
      JSON.stringify(enableQuickMenu)
    );
  }, [enableQuickMenu]);


  const groupedMenu = sidebarConfig
    .filter(item => item.roles.includes(auth.department))
    .reduce((acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = {};
      }
      acc[item.group][item.type] = item;
      return acc;
    }, {});

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const capitalizeWords = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  return (
    <div className="dashboard-container">

      <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
        {auth.department?.toLowerCase() === "admin" || auth.department?.toLowerCase() === "root" ? (
          <div className="max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
              <div>
                <h1 className="text-2xl font-display font-semibold text-foreground tracking-tight">  {getGreeting()}, {capitalizeWords(auth.name || "admin")}</h1>
                <h4 className="text-muted-foreground text-sm mt-1">Here's your operational overview for today.</h4>
              </div>

              <div className="flex gap-3">
                <DateRangeFilter
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  singleDate={selectedDate}
                  setSingleDate={setSelectedDate}
                  selectedCustomer={selectedCustomer}
                  setSelectedCustomer={setSelectedCustomer}
                  enableSingle={enableSingle}
                  setEnableSingle={setEnableSingle}
                  enableCustomer={enableCustomer}
                  setEnableCustomer={setEnableCustomer}
                  enableQuickMenu={enableQuickMenu}
                  setEnableQuickMenu={setEnableQuickMenu}
                  customerList={customerList}
                  onApplyFilter={() => {
                    fetchdashboarddata();
                    fetchchartdata();
                  }}
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <Layout2
                cardsData={cardsData}
                ChartData={{
                  timeRange,
                  setTimeRange,
                  data: linechartdata,
                  plantwiseData,
                  gaugewiseData
                }}
                recentActivities={recentActivities}
                enableQuickMenu={enableQuickMenu}
                auth={auth}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center bg-card border border-border rounded-xl p-12 shadow-sm max-w-lg">
              <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight mb-3">
                Welcome to Calibmaster
              </h1>
              <h4 className="text-muted-foreground text-base">
                {getGreeting()}, {capitalizeWords(auth.name || "User")}! Please select an option from the sidebar menu to get started.
              </h4>
            </div>
          </div>
        )}
      </div>

      <Drawer
        title={drawerTitle}
        placement="right"
        width="100%"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        destroyOnClose
      >
        {drawerContent}
      </Drawer>
    </div>
  );
};

export default WelcomeScreen;
