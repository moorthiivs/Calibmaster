import React, { useContext, useEffect, useMemo, useState } from "react";
import { Card, Row, Col, DatePicker, Space, Typography, Select, Switch, Tooltip, Button, Modal } from "antd";
import dayjs from "dayjs";
import "./WelcomeScreen.css";
import "./HexagonMenu.css";
import TrendPieChart from "./Dashboard/TrendPieChart";
import config from '../../utils/config.json'
import { AuthContext } from "../../context/auth-context";
import { FileSearchOutlined, ClockCircleOutlined, CheckCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import DashboardCards from "./Dashboard/DashboardCards";
import { sidebarConfig } from "../Sidebar/sidebarConfig";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Drawer } from "antd";
import { usePermissions } from "../../hooks/usePermissions";
import { SlidersHorizontal } from "lucide-react";

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
import ExternalMasterAdd from "./ExternalMaster/ExternalMasterAdd";
import ListExternalMaster from "./ExternalMaster/ListExternalMaster";
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
import AddUlr from "./AddULR/AddULR";
import ListULR from "./AddULR/ListULR";
import AddSRF from "./AddSRF/AddSRF";
import SRFs from "./SRFs/SRFs";
import CreateCertificateConfig from "./CMSettings/Certificate/CreateCertificateConfig";
import ListCertificateConfig from "./CMSettings/Certificate/ListCertificateConfig";
import CertificateFormatCreator from "./CertificateFormatEditor/CertificateFormatEditor";
import Roles from "./Roles/Roles";
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
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const isAtDashboardRoot = location.pathname === "/dashboard" || location.pathname === "/dashboard/";
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
  const [timeRange, setTimeRange] = useState(6);
  const [linechartdata, setlinechartdata] = useState([])
  const [plantwiseData, setplantwiseData] = useState([])
  const [gaugewiseData, setgaugewiseData] = useState([])
  const [masterEquipmentData, setMasterEquipmentData] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [enableSingle, setEnableSingle] = useState(false)
  const [enableCustomer, setEnableCustomer] = useState(false)
  const [enableQuickMenu, setEnableQuickMenu] = useState(() => {
    const stored = sessionStorage.getItem("enableQuickMenu");
    return stored ? JSON.parse(stored) : false;
  });

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  
  // Dashboard customization preferences
  const [preferences, setPreferences] = useState(() => {
    const defaultPrefs = {
      cards: {
        "Total Calibrations": true,
        "Pending Calibrations": true,
        "Certificates Generated": true,
        "Upcoming Due": true,
        "Review Pending": true,
        "Auth Pending": true
      },
      charts: {
        "Calibration Trend": true,
        "Plant Completion Status": true,
        "Gauge Distribution": true,
        "Master Equipment Category": true
      }
    };
    try {
      const stored = localStorage.getItem(`dashboard_pref_${auth?.userId || 'default'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          cards: { ...defaultPrefs.cards, ...parsed.cards },
          charts: { ...defaultPrefs.charts, ...parsed.charts }
        };
      }
    } catch (e) {
      console.error("Error reading dashboard preferences:", e);
    }
    return defaultPrefs;
  });

  const savePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem(`dashboard_pref_${auth?.userId || 'default'}`, JSON.stringify(newPrefs));
    } catch (e) {
      console.error("Error saving dashboard preferences:", e);
    }
  };
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
    "/dashboard/external-master/add": <ExternalMasterAdd />,
    "/dashboard/external-masters": <ListExternalMaster />,
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
    "/dashboard/roles": <Roles />,
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
    if (!hasPermission("LIST_CUSTOMER")) return;
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
        setMasterEquipmentData(result.masterEquipmentData || [])
      }

    } catch (err) {
      console.log(err);
    } finally {
      setloading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    fetchdashboarddata();
    fetchchartdata();
  }, [dateRange, selectedDate, selectedCustomer, enableSingle, enableCustomer, timeRange]);


  useEffect(() => {
    sessionStorage.setItem(
      "enableQuickMenu",
      JSON.stringify(enableQuickMenu)
    );
  }, [enableQuickMenu]);



  // Compute effective date range for dashboard (used by chart click-through navigation)
  const effectiveDates = useMemo(() => {
    if (enableSingle && selectedDate) {
      const d = dayjs(selectedDate).format("DD-MM-YYYY");
      return { fromDate: d, toDate: d };
    } else if (!enableSingle && dateRange?.from && dateRange?.to) {
      return {
        fromDate: dayjs(dateRange.from).format("DD-MM-YYYY"),
        toDate: dayjs(dateRange.to).format("DD-MM-YYYY")
      };
    } else if (!enableSingle && dateRange?.from && !dateRange?.to) {
      const d = dayjs(dateRange.from).format("DD-MM-YYYY");
      return { fromDate: d, toDate: d };
    } else {
      return {
        fromDate: dayjs().startOf('month').format("DD-MM-YYYY"),
        toDate: dayjs().endOf('month').format("DD-MM-YYYY")
      };
    }
  }, [enableSingle, selectedDate, dateRange]);

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
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 md:p-8 custom-scrollbar max-w-[100vw] overflow-x-hidden">
        {isAtDashboardRoot ? (
          hasPermission("ACCESS_DASHBOARD") ? (
            <div className="max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500 w-full">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-border/40 w-full">
                <div>
                  <h1 className="text-2xl font-display font-semibold text-foreground tracking-tight">
                    {getGreeting()}, {capitalizeWords(auth.name || "User")}
                  </h1>
                  <h4 className="text-muted-foreground text-sm mt-1">Here's your operational overview for today.</h4>
                </div>
                <div className="flex flex-wrap md:flex-nowrap justify-start md:justify-end items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
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
                    onCustomizeClick={() => setSettingsModalOpen(true)}
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
                    gaugewiseData,
                    masterEquipmentData
                  }}
                  recentActivities={recentActivities}
                  enableQuickMenu={enableQuickMenu}
                  auth={auth}
                  effectiveDates={effectiveDates}
                  preferences={preferences}
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
          )
        ) : (
          <div className="animate-in fade-in duration-500">
            <Outlet />
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

      <Modal
        open={settingsModalOpen}
        onCancel={() => setSettingsModalOpen(false)}
        footer={null}
        width={550}
        centered
        title={
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <SlidersHorizontal className="text-primary animate-pulse" size={20} />
            <div>
              <span className="text-base font-semibold font-display text-foreground">Customize Dashboard Widgets</span>
              <p className="text-xs font-normal text-muted-foreground mt-0.5">Choose which scorecards and widgets are displayed on your dashboard.</p>
            </div>
          </div>
        }
      >
        <div className="p-4 space-y-6">
          {/* KPI Cards Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 pb-1.5">KPI Scorecards</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(preferences.cards).map(cardTitle => (
                <div key={cardTitle} className="flex justify-between items-center bg-secondary/20 hover:bg-secondary/40 p-3 rounded-lg border border-border/40 transition-colors">
                  <span className="text-xs font-medium text-foreground">{cardTitle}</span>
                  <Switch
                    checked={preferences.cards[cardTitle]}
                    onChange={(checked) => {
                      const newPrefs = {
                        ...preferences,
                        cards: {
                          ...preferences.cards,
                          [cardTitle]: checked
                        }
                      };
                      savePreferences(newPrefs);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Analytics & Charts Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 pb-1.5">Visual Analytics & Charts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(preferences.charts).map(chartTitle => (
                <div key={chartTitle} className="flex justify-between items-center bg-secondary/20 hover:bg-secondary/40 p-3 rounded-lg border border-border/40 transition-colors">
                  <span className="text-xs font-medium text-foreground">{chartTitle}</span>
                  <Switch
                    checked={preferences.charts[chartTitle]}
                    onChange={(checked) => {
                      const newPrefs = {
                        ...preferences,
                        charts: {
                          ...preferences.charts,
                          [chartTitle]: checked
                        }
                      };
                      savePreferences(newPrefs);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center border-t border-border/40 pt-4 mt-6">
            <button
              onClick={() => {
                const defaultPrefs = {
                  cards: {
                    "Total Calibrations": true,
                    "Pending Calibrations": true,
                    "Certificates Generated": true,
                    "Upcoming Due": true,
                    "Review Pending": true,
                    "Auth Pending": true
                  },
                  charts: {
                    "Calibration Trend": true,
                    "Plant Completion Status": true,
                    "Gauge Distribution": true,
                    "Master Equipment Category": true
                  }
                };
                savePreferences(defaultPrefs);
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer"
            >
              Reset to System Defaults
            </button>
            <button
              onClick={() => setSettingsModalOpen(false)}
              className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-6 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WelcomeScreen;
