//App.jsx
import "./App.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./context/auth-context";
import { useDispatch, useSelector } from "react-redux";

import { Spinner } from "react-rainbow-components";
import { notification } from "antd";
import { jwtDecode } from "jwt-decode";
import Dashboard from "./Pages/Dashboard";
import LoginPage from "./Pages/LoginPage";
import UnavailablePage from "./Pages/UnavailablePage";
import OfflinePage from "./Pages/OfflinePage";
import config from "./utils/config.js";
import ExcelTable from "./components/BodyContent/CalibmasterExcel/ExcelTable/ExcelTable";
import EnterResult from "./components/BodyContent/SRFs/ResultComponent/EnterResult";
import { apipostHandler } from "./utils/api";

// ✅ Import all page components
import AddSRF from "./components/BodyContent/AddSRF/AddSRF";
import AddUser from "./components/BodyContent/AddUser/AddUser";
import SRFs from "./components/BodyContent/SRFs/SRFs";
import Users from "./components/BodyContent/Users/Users";
import WelcomeScreen from "./components/BodyContent/WelcomeScreen";
import Labs from "./components/BodyContent/Labs/Labs";
import Email from "./components/BodyContent/Email/Email";
import LabList from "./components/BodyContent/Labs/LabList";
import EditLab from "./components/BodyContent/Labs/EditLab";
import CreateUOM from "./components/BodyContent/UOM/CreateUOM";
import ListUOM from "./components/BodyContent/UOM/ListUOM";
import EditUOM from "./components/BodyContent/UOM/EditUOM";
import CreateInstrument from "./components/BodyContent/Instrument/CreateInstrument";
import ListInstrument from "./components/BodyContent/Instrument/ListInstrument";
import EditInstrument from "./components/BodyContent/Instrument/EditInstrument";
import CreateInstrumentType from "./components/BodyContent/InstrumentType/CreateInstrumentType";
import ListInstrumentType from "./components/BodyContent/InstrumentType/ListInstrumentType";
import EditInstrumentType from "./components/BodyContent/InstrumentType/EditInstrumentType";
import ListCustomer from "./components/BodyContent/customer/ListCustomer";
import CreateCustomer from "./components/BodyContent/customer/CreateCustomer";
import EditCustomer from "./components/BodyContent/customer/EditCustomer";
import AddSRFConfig from "./components/BodyContent/SRFConfig/AddSRFConfig";
import ListSRFConfig from "./components/BodyContent/SRFConfig/ListSRFConfig";
import StandardDetails from "./components/BodyContent/StandardDetails/StandardDetails";
import ListMaster from "./components/BodyContent/StandardDetails/ListMaster";
import CreateCertificateConfig from "./components/BodyContent/CMSettings/Certificate/CreateCertificateConfig";
import ListCertificateConfig from "./components/BodyContent/CMSettings/Certificate/ListCertificateConfig";
import DefineProcedure from "./components/BodyContent/DefineProcedure/DefineProcedure";
import ListDefinedProcedure from "./components/BodyContent/DefineProcedure/ListDefinedProcedure";
import CreateEmployee from "./components/BodyContent/EmployeeMasters/CreateEmployee";
import ListEmployee from "./components/BodyContent/EmployeeMasters/ListEmployee";
import DueDateChecker from "./components/BodyContent/CalibrationDueDate/DueDateCount";
import PasswordReset from "./components/BodyContent/AdminInfo/PasswordReset";
import AddBankConfig from "./components/BodyContent/BankConfig/AddBankDetails";
import ListBankConfig from "./components/BodyContent/BankConfig/ListBankDetails";
import QuotationConfig from "./components/BodyContent/Quotation/QuotationConfig/QuotationConfig";
import QuotationConfigList from "./components/BodyContent/Quotation/QuotationConfig/QuotationConfigList";
import QuotationItem from "./components/BodyContent/Quotation/QuotationItem/QuotationItem";
import QuotationCustomerList from "./components/BodyContent/Quotation/QuotationItem/QuotationCustomerList";
import AddULR from "./components/BodyContent/AddULR/AddULR";
import ListULR from "./components/BodyContent/AddULR/ListULR";
import CreateUncertaintyParameter from "./components/BodyContent/Uncertainty-Parameter/CreateUncertaintyParameter";
import ListUncertaintyParameter from "./components/BodyContent/Uncertainty-Parameter/ListUncertaintyParameter";
import SyncPage from "./components/BodyContent/SyncData/SyncPage";
import ScannerEnterResult from "./components/BodyContent/SRFs/ResultComponent/ScannerEnterResult/ScannerEnterResult";
import CreateCalibmasterExcel from "./components/BodyContent/CalibmasterExcel/CreateCalibmasterExcel";
import ListCalibmasterExcel from "./components/BodyContent/CalibmasterExcel/ListCalibmasterExcel";
import MasterListDocAdd from "./components/BodyContent/MasterDocument/MasterListDoc/MasterListDocAdd";
import MasterListDocList from "./components/BodyContent/MasterDocument/MasterListDoc/MasterListDocList";
import MasterListDocDetailAdd from "./components/BodyContent/MasterDocument/MasterListDocDetail/MasterListDocDetailAdd";
import MasterListDocDetailList from "./components/BodyContent/MasterDocument/MasterListDocDetail/MasterListDocDetailList";
import MasterListDocFormatAdd from "./components/BodyContent/MasterDocument/MasterListDocFormat/MasterListDocFormatAdd";
import MasterListDocFormatList from "./components/BodyContent/MasterDocument/MasterListDocFormat/MasterListDocFormatList";
import CertificateFormatCreator from "./components/BodyContent/CertificateFormatEditor/CertificateFormatEditor";
import InwardReports from "./components/BodyContent/Reports/InwardReports";
import MakeModelPage from "./components/BodyContent/MakeAndModel/MakeModelPage";
import DeletedIndex from "./components/BodyContent/DataStorage/DeletedIndex";
import EmployeeTrack from "./components/BodyContent/EmployeeTrack/EmployeeTrack";

// ─── Task Management (NEW) ────────────────────────────────────────────────────
import TaskList from "./Pages/TaskManagement/TaskList";
import CreateTask from "./Pages/TaskManagement/CreateTask";
import TaskDetail from "./Pages/TaskManagement/TaskDetail";

import DashboardErrorBoundary from "./components/errors/DashboardErrorBoundary";
import PageErrorBoundary from "./components/errors/PageErrorBoundary";
import WarrringModel from "./components/UI/WarrringModel";

const AppContent = () => {
  // ✅ Synchronously initialize auth state from localStorage to prevent redirect loops on mount
  const [userData, setUserData] = useState(() => {
    const stored = localStorage.getItem("calibmaster_userData");
    if (stored) {
      const data = JSON.parse(stored);
      if (new Date(data.expiration) > new Date()) return data;
    }
    return null;
  });

  const [token, setToken] = useState(userData?.token || null);
  const [userId, setUserId] = useState(userData?.userId || null);
  const [tokenExp, setTokenExp] = useState(userData ? new Date(userData.expiration) : null);
  const [name, setName] = useState(userData?.name || null);
  const [department, setDepartment] = useState(userData?.department || null);
  const [email, setEmail] = useState(userData?.email || null);
  const [labId, setLabId] = useState(userData?.labId || null);
  // ✅ Check if running in Electron
  const isDesktop = !!window.electron;

  // ✅ Initialize states from cache to allow offline boot
  const [availability, setAvailability] = useState(() => {
    return JSON.parse(localStorage.getItem("calibmaster_availability") || "true");
  });
  const [version, setVersion] = useState(() => {
    return localStorage.getItem("calibmaster_version") || "1.0.0";
  });
  const [networkOnline, setNetworkOnline] = useState(true);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState(20);
  const [sessionSynced, setSessionSynced] = useState(false);

  const [showIdleModal, setShowIdleModal] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const isLoading = useSelector((state) => state.isloading.state);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const lastActivityTimeRef = useRef(Date.now());
  const channelRef = useRef(null);


  // useEffect(() => {
  //   const handleOnline = () => {
  //     setNetworkOnline(true);
  //     notification.success({
  //       message: "Back Online",
  //       description: "Internet connection restored.",
  //       placement: "bottomRight",
  //     });
  //     navigate(-1); // go back to last page
  //   };

  //   const handleOffline = () => {
  //     setNetworkOnline(false);
  //     notification.warning({
  //       message: "Offline Mode",
  //       description: "You are currently offline. Redirecting...",
  //       placement: "bottomRight",
  //     });
  //     navigate("/offline");
  //   };

  //   window.addEventListener("online", handleOnline);
  //   window.addEventListener("offline", handleOffline);

  //   return () => {
  //     window.removeEventListener("online", handleOnline);
  //     window.removeEventListener("offline", handleOffline);
  //   };
  // }, [navigate]);


  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch(config.Calibmaster.URL + "/api/heartbeat/check");
        const data = await response.json();

        if (data?.status === "available") {
          setAvailability(true);
          setVersion(data.version);
          // Sync to cache
          localStorage.setItem("calibmaster_availability", "true");
          localStorage.setItem("calibmaster_version", data.version);
        } else {
          setAvailability(false);
          localStorage.setItem("calibmaster_availability", "false");
        }
      } catch (err) {
        console.warn("Heartbeat failed (Offline):", err);
        // On Desktop, we don't block access if the network fails
        if (!isDesktop) {
          setAvailability(false);
        }
      }
    };

    checkAvailability();
    // Re-check periodically
    const interval = setInterval(checkAvailability, 60000);
    return () => clearInterval(interval);
  }, [isDesktop]);


  const login = useCallback((uid, token, name, email, department, labid, expirationDate) => {

    const decodedToken = jwtDecode(token);
    //const tokenExpirationDate = expirationDate || new Date(new Date().getTime() + 1000 * 60); // 1 minute for testing
    // exp is in seconds → convert to milliseconds
    const tokenExpirationDate =
      expirationDate || new Date(decodedToken.exp * 1000);
    setToken(token);
    setUserId(uid);
    setName(name);
    setDepartment(department);
    setEmail(email);
    setLabId(labid);
    setTokenExp(tokenExpirationDate);

    localStorage.setItem(
      "calibmaster_userData",
      JSON.stringify({
        userId: uid,
        token,
        name,
        department,
        email,
        labId: labid,
        expiration: tokenExpirationDate.toISOString(),
      })
    );
  }, []);

  const logout = useCallback((type = "MANUAL") => {

    if (channelRef.current && type !== "SYNC_LOGOUT") {
      channelRef.current.postMessage({ type: "LOGOUT" });
    }
    // Track Logout - Avoid hitting the API if it's a stale or synchronized broadcast logout
    if (userId !== null && userId !== undefined && token && type !== "STALE_SESSION" && type !== "SYNC_LOGOUT") {
      apipostHandler("/api/employee-track/logout", { userId, logoutType: type }, token);
    }
    setShowIdleModal(false);
    setToken(null);
    setUserId(null);
    setTokenExp(null);
    setName(null);
    setDepartment(null);
    setEmail(null);
    setLabId(null);
    localStorage.clear()
    sessionStorage.clear()
    localStorage.removeItem("calibmaster_userData");
    localStorage.removeItem("logo");
  }, [userId, token, dispatch]);

  // (Redundant but safe: logic moved to sync initializer)
  useEffect(() => {
    if (!token) {
      const storedData = JSON.parse(localStorage.getItem("calibmaster_userData"));
      if (storedData?.token && new Date(storedData.expiration) > new Date()) {
        login(
          storedData.userId,
          storedData.token,
          storedData.name,
          storedData.email,
          storedData.department,
          storedData.labId,
          new Date(storedData.expiration)
        );
      }
    }
  }, [login, token]);

  // Auto Logout (Token Expiration)
  useEffect(() => {
    let logoutTimer;
    if (token && tokenExp) {
      const remainingTime = new Date(tokenExp).getTime() - new Date().getTime();
      if (remainingTime > 0) {
        logoutTimer = setTimeout(() => logout("SESSION_EXPIRED"), remainingTime);
      } else {
        logout("SESSION_EXPIRED");
      }
    }
    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [token, tokenExp, logout]);

  // Fetch Global Settings
  useEffect(() => {
    if (token) {
      apipostHandler("/api/employee-track/get-settings", {}, token)
        .then(({ data }) => {
          if (data && data.status === "SUCCESS") {
            setIdleTimeoutMinutes(data.data.idleTimeoutMinutes || 20);
          }
        })
        .catch(err => console.error("Failed to load global tracking settings:", err));
    }
  }, [token]);



  useEffect(() => {
    if (!token || !idleTimeoutMinutes) return;

    // Reset on every mount so the clock starts fresh
    lastActivityTimeRef.current = Date.now();

    channelRef.current = new BroadcastChannel("user-activity");
    const channel = channelRef.current;

    // Idle only starts counting after the user's FIRST real interaction.
    // This prevents logging out immediately if the browser restores a stale tab.
    let hasHadFirstActivity = false;

    const updateActivityTime = () => {
      const now = Date.now();
      hasHadFirstActivity = true;
      lastActivityTimeRef.current = now;

      channel.postMessage({
        type: "ACTIVITY",
        time: now,
      });
    };

    channel.onmessage = (event) => {
      if (event.data?.type === "ACTIVITY") {
        hasHadFirstActivity = true;
        lastActivityTimeRef.current = event.data.time;
      }
    };

    const events = [
      "pointerdown",
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "focus",
      "input",
      "change",
    ];

    events.forEach((event) =>
      // capture:true fires BEFORE Handsontable (or any child component) handles the
      // event, so idle detection works correctly even inside the Excel editor grid.
      document.addEventListener(event, updateActivityTime, { capture: true })
    );

    // ─── Tab Visibility / Focus Handling ──────────────────────────────────────
    // When the user is on another tab (PDF blob, another page), no DOM events
    // fire here. Fix: whenever this tab becomes visible or regains focus, reset
    // the idle clock so time away on another tab doesn't count as idle here.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        hasHadFirstActivity = true;
        lastActivityTimeRef.current = Date.now();
        setShowIdleModal(false);
      }
    };
    const handleWindowFocus = () => {
      hasHadFirstActivity = true;
      lastActivityTimeRef.current = Date.now();
      setShowIdleModal(false);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    // ─────────────────────────────────────────────────────────────────────────

    const WARNING_DURATION = 10 * 1000; // 10 sec

    // Exclude pages where internal editors (Handsontable, result entry) absorb
    // all pointer/keyboard events and they never reach document-level listeners,
    // causing false idle timeouts. These pages don't need idle logout.
    const isExcludedFromIdle =

      location.pathname.includes("/exceltable") ||
      location.pathname.includes("/enter-result") ||
      location.pathname.includes("/employee-track");

    let checkInterval;
    if (!isExcludedFromIdle) {
      checkInterval = setInterval(() => {
        // Don't start the idle countdown until the user has interacted at least once
        if (!hasHadFirstActivity) return;

        const currentTime = Date.now();
        const idleTimeMillis = idleTimeoutMinutes * 60 * 1000;
        const timeSinceLastActivity = currentTime - lastActivityTimeRef.current;

        if (
          timeSinceLastActivity >= idleTimeMillis &&
          timeSinceLastActivity < idleTimeMillis + WARNING_DURATION
        ) {
          setShowIdleModal(true);
        } else if (timeSinceLastActivity < idleTimeMillis) {
          setShowIdleModal(false);
        }

        if (timeSinceLastActivity >= idleTimeMillis + WARNING_DURATION) {
          console.log('logout idel running');
          channel.postMessage({ type: "LOGOUT" });
          clearInterval(checkInterval);
          logout("INACTIVE");
        }
      }, 1000);
    }

    // 🔥 Listen logout from other tabs
    const handleLogoutSync = (event) => {
      if (event.data?.type === "LOGOUT") {
        logout("SYNC_LOGOUT"); // Quietly log out without hitting the backend API again
      }
    };

    channel.addEventListener("message", handleLogoutSync);

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, updateActivityTime, { capture: true })
      );
      //document.removeEventListener("visibilitychange", handleVisibilityChange);
      //window.removeEventListener("focus", handleWindowFocus);

      if (checkInterval) clearInterval(checkInterval);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [token, idleTimeoutMinutes, logout, location.pathname]);

  // Tab Close Tracker (replaces interval Pings)
  const trackingInitialized = useRef(false);
  const isThisTabTracked = useRef(false);

  useEffect(() => {
    if (!token || !availability) {
      setSessionSynced(false);
      return;
    }

    // 1. Verify Session
    apipostHandler("/api/employee-track/verify-session", { userId }, token)
      .then((res) => {
        if (res.data && res.data.valid === false) {
          logout("STALE_SESSION");
        } else {
          setSessionSynced(true);
        }
      })
      .catch((err) => {
        console.error("Session verify error", err);
        setSessionSynced(true);
      });

    // 2. Track total open tabs exclusively in JS memory to dodge sessionStorage cloning bugs
    if (!trackingInitialized.current) {
      trackingInitialized.current = true;

      const isUntrackedRoute =
        location.pathname.includes("/employee-track") ||
        location.pathname.includes("/exceltable") ||
        location.pathname.includes("/enter-result");

      if (!isUntrackedRoute) {
        isThisTabTracked.current = true;
        const currentTabs = parseInt(localStorage.getItem('cm_open_tabs') || '0', 10);
        localStorage.setItem('cm_open_tabs', currentTabs + 1);
      }
    }

    // 3. Handle actual tab/browser close
    const handleBeforeUnload = () => {
      // If this tab was spawned as an untracked child, ignore its death!
      if (!isThisTabTracked.current) return;

      const activeTabs = parseInt(localStorage.getItem('cm_open_tabs') || '1', 10);
      const newCount = Math.max(0, activeTabs - 1);
      localStorage.setItem('cm_open_tabs', newCount);

      if (newCount === 0) {
        const url = config.Calibmaster.URL + "/api/employee-track/intent-logout";
        const params = new URLSearchParams();
        params.append("userId", userId);
        navigator.sendBeacon(url, params);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [token, userId, availability, logout]);


  // Heartbeat ping: keeps the DB LOGIN record's `updatedAt` timestamp fresh
  // every 90 seconds. The heartbeatLogout cron watches `updatedAt` and closes
  // sessions that have been silent for > 2.5 min — so without this ping,
  // a normally active session would be killed within minutes.


  useEffect(() => {
    if (!token || !userId) return;

    const ping = () => {
      // Periodic heartbeat check: ensures the session is still valid in the database
      // and updates the updatedAt timestamp to prevent auto-cleanup crons.
      apipostHandler("/api/employee-track/heartbeat-ping", { userId }, token)
        .then((res) => {
          if (res.data && res.data.valid === false) {
            // Admin reset or database logout detected — immediately terminate session
            logout("ADMIN_RESET");
          }
        })
        .catch(() => { });
    };

    ping(); // Immediate ping on mount / login
    const pingInterval = setInterval(ping, 20 * 1000); // Check every 20 seconds
    return () => clearInterval(pingInterval);
  }, [token, userId]);


  useEffect(() => {
    if (!showIdleModal) return;

    setCountdown(10);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showIdleModal]);

  useEffect(() => {
    if (!token) {
      setShowIdleModal(false);
    }
  }, [token]);

  const handleStayLoggedIn = () => {
    lastActivityTimeRef.current = Date.now();
    setShowIdleModal(false);
    setCountdown(10);

    channel.postMessage({
      type: "ACTIVITY",
      time: Date.now(),
    });
  };
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        token,
        userId,
        name,
        email,
        department,
        labId,
        backEndVersion: version,
        login,
        logout,
      }}
    >
      {isLoading && <Spinner size="medium" />}

      {showIdleModal && token && (
        <WarrringModel
          showIdleModal={showIdleModal}
          countdown={countdown}
          logout={logout}
          handleStayLoggedIn={handleStayLoggedIn}
        />
      )}

      <Routes>
        {/* Offline route */}
        <Route path="/offline" element={<OfflinePage />} />

        {/* Server unavailable */}
        {!availability && <Route path="*" element={<UnavailablePage />} />}

        {/* Login routes */}
        {((availability || isDesktop) && !token) && (
          <>
            <Route path="/" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}

        {/* Authenticated routes */}
        {((availability || isDesktop) && token && !sessionSynced) && (
          <Route path="*" element={null} /> // Render nothing while waiting for initial ping to sync
        )}

        {((availability || isDesktop) && token && sessionSynced) && (
          <>
            <Route path="/dashboard" element={<DashboardErrorBoundary><Dashboard /></DashboardErrorBoundary>}>
              <Route index element={<WelcomeScreen />} />
              <Route path="labs" element={<Labs />} />
              <Route path="labs/list" element={<LabList />} />
              <Route path="labs/edit" element={<EditLab />} />
              <Route path="customers" element={<ListCustomer />} />
              <Route path="customers/create" element={<CreateCustomer />} />
              <Route path="customers/edit" element={<EditCustomer />} />
              <Route path="users/add" element={<AddUser />} />
              <Route path="users" element={<Users />} />
              <Route path="uom/create" element={<CreateUOM />} />
              <Route path="uom" element={<ListUOM />} />
              <Route path="uom/edit" element={<EditUOM />} />
              <Route path="make-model" element={<MakeModelPage />} />
              <Route path="instruments/create" element={<CreateInstrument />} />
              <Route path="instruments" element={<ListInstrument />} />
              <Route path="instruments/edit" element={<EditInstrument />} />
              <Route path="instrument-types/create" element={<CreateInstrumentType />} />
              <Route path="instrument-types" element={<ListInstrumentType />} />
              <Route path="instrument-types/edit" element={<EditInstrumentType />} />
              <Route path="uncertainty/create" element={<CreateUncertaintyParameter />} />
              <Route path="uncertainty" element={<ListUncertaintyParameter />} />
              <Route path="srf-config/add" element={<AddSRFConfig />} />
              <Route path="srf-config" element={<ListSRFConfig />} />
              <Route path="ulr/add" element={<AddULR />} />
              <Route path="ulr" element={<ListULR />} />
              <Route path="srf/add" element={<AddSRF />} />
              <Route path="srf" element={<SRFs />} />
              <Route path="standard-details" element={<StandardDetails />} />
              <Route path="masters" element={<ListMaster />} />
              <Route path="certificate-config/create" element={<CreateCertificateConfig />} />
              <Route path="certificate-config" element={<ListCertificateConfig />} />
              <Route path="certificate-format" element={<CertificateFormatCreator />} />
              <Route path="data-storage" element={<DeletedIndex />} />
              <Route path="master-doc/add" element={<MasterListDocAdd />} />
              <Route path="master-doc" element={<MasterListDocList />} />
              <Route path="master-doc-detail/add" element={<MasterListDocDetailAdd />} />
              <Route path="master-doc-detail" element={<MasterListDocDetailList />} />
              <Route path="master-doc-format/add" element={<MasterListDocFormatAdd />} />
              <Route path="master-doc-format" element={<MasterListDocFormatList />} />
              <Route path="procedures/define" element={<DefineProcedure />} />
              <Route path="procedures" element={<ListDefinedProcedure />} />
              <Route path="excel/create" element={<CreateCalibmasterExcel />} />
              <Route path="excel" element={<ListCalibmasterExcel />} />
              <Route path="employees/create" element={<CreateEmployee />} />
              <Route path="employees" element={<ListEmployee />} />
              <Route path="calibration-due" element={<DueDateChecker />} />
              <Route path="reset-password" element={<PasswordReset />} />
              <Route path="bank-config/add" element={<AddBankConfig />} />
              <Route path="bank-config" element={<ListBankConfig />} />
              <Route path="quotation-config/create" element={<QuotationConfig />} />
              <Route path="quotation-config" element={<QuotationConfigList />} />
              <Route path="quotation/create" element={<QuotationItem />} />
              <Route path="quotation/customers" element={<QuotationCustomerList />} />
              <Route path="email" element={<Email />} />
              <Route path="sync" element={<SyncPage />} />
              <Route path="scanner" element={<ScannerEnterResult />} />
              <Route path="inward-reports" element={<InwardReports />} />

              {/* ─── Task Management (NEW) ───────────────────────────────── */}
              <Route path="tasks" element={<TaskList />} />
              <Route path="tasks/create" element={<CreateTask />} />
              <Route path="tasks/:task_id" element={<TaskDetail />} />
            </Route>

            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/unavailable" element={<UnavailablePage />} />

            <Route path="/exceltable" element={<PageErrorBoundary ><ExcelTable /></PageErrorBoundary>} />
            <Route
              path="/enter-result/:srf_item_id/:srf_id/:intrument_type_id"
              element={<PageErrorBoundary ><EnterResult /></PageErrorBoundary>}
            />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}

        {/* Employee Track Routes */}
        {availability && (
          <Route path="/employee-track" element={<EmployeeTrack />} />
        )}
      </Routes>
    </AuthContext.Provider>
  );
};

const App = () => {
  const Router = import.meta.env.VITE_ELECTRON === 'true' ? HashRouter : BrowserRouter;

  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
