//App.jsx
import "./App.css";
import { useEffect, useState, useCallback, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./context/auth-context";
import { useDispatch, useSelector } from "react-redux";

import { Spinner } from "react-rainbow-components";
import { jwtDecode } from "jwt-decode";
import Dashboard from "./Pages/Dashboard";
import LoginPage from "./Pages/LoginPage";
import UnavailablePage from "./Pages/UnavailablePage";
import OfflinePage from "./Pages/OfflinePage";
import config from "./utils/config.json";
import ExcelTable from "./components/BodyContent/CalibmasterExcel/ExcelTable/ExcelTable";
import EnterResult from "./components/BodyContent/SRFs/ResultComponent/EnterResult";
import { apipostHandler } from "./utils/api";
import { tryRefreshToken } from "./utils/apiClient";

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
import ExternalMasterAdd from "./components/BodyContent/ExternalMaster/ExternalMasterAdd";
import ListExternalMaster from "./components/BodyContent/ExternalMaster/ListExternalMaster";
import CreateCertificateConfig from "./components/BodyContent/CMSettings/Certificate/CreateCertificateConfig";
import ListCertificateConfig from "./components/BodyContent/CMSettings/Certificate/ListCertificateConfig";
import DefineProcedure from "./components/BodyContent/DefineProcedure/DefineProcedure";
import ListDefinedProcedure from "./components/BodyContent/DefineProcedure/ListDefinedProcedure";
import Roles from "./components/BodyContent/Roles/Roles";
import DueDateChecker from "./components/BodyContent/CalibrationDueDate/DueDateCount";
import PasswordReset from "./components/BodyContent/AdminInfo/PasswordReset";
import AddBankConfig from "./components/BodyContent/BankConfig/AddBankDetails";
import ListBankConfig from "./components/BodyContent/BankConfig/ListBankDetails";
import QuotationConfig from "./components/BodyContent/Quotation/QuotationConfig/QuotationConfig";
import QuotationConfigList from "./components/BodyContent/Quotation/QuotationConfig/QuotationConfigList";
import QuotationItem from "./components/BodyContent/Quotation/QuotationItem/QuotationItem";
import QuotationCustomerList from "./components/BodyContent/Quotation/QuotationItem/QuotationCustomerList";
import AddUlr from "./components/BodyContent/AddULR/AddULR";
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
import UserTrack from "./components/BodyContent/UserTrack/UserTrack";
import DashboardErrorBoundary from "./components/errors/DashboardErrorBoundary";
import PageErrorBoundary from "./components/errors/PageErrorBoundary";
import WarrringModel from "./components/UI/WarrringModel";
import ProtectedRoute from "./components/ProtectedRoute";
import ApprovalDashboard from "./components/BodyContent/Tasks/ApprovalDashboard";
import QRCodePage from "./components/BodyContent/QRCode/QRCodePage";

const AppContent = () => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [tokenExp, setTokenExp] = useState(null);
  const [name, setName] = useState(null);
  const [department, setDepartment] = useState(null);
  const [email, setEmail] = useState(null);
  const [availability, setAvailability] = useState(false);
  const [labId, setLabId] = useState(null);
  const [version, setVersion] = useState(null);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState(20);
  const [sessionSynced, setSessionSynced] = useState(false);
  const [logo, setLogo] = useState(localStorage.getItem("logo"));

  const [showIdleModal, setShowIdleModal] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const isLoading = useSelector((state) => state.isloading.state);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const lastActivityTimeRef = useRef(Date.now());
  const sessionWasStaleRef = useRef(false);
  const channelRef = useRef(null);



  useEffect(() => {
    fetch(config.Calibmaster.URL + "/api/heartbeat/check")
      .then(async (response) => {
        const data = await response.json();
        if (data?.status === "available") {
          setAvailability(true);
          setVersion(data.version);
        } else {
          setAvailability(false);
        }
      })
      .catch(() => {
        setAvailability(false);
      });
  }, []);


  const [roleId, setRoleId] = useState(null);
  const [permissions, setPermissions] = useState([]);

  const login = useCallback((uid, token, name, email, department, labid, roleIdParam, permissionsParam, expirationDate) => {

    const decodedToken = jwtDecode(token);
    // exp is in seconds → convert to milliseconds
    const tokenExpirationDate =
      expirationDate || new Date(decodedToken.exp * 1000);
    setToken(token);
    setUserId(uid);
    setName(name);
    setDepartment(department);
    setEmail(email);
    setLabId(labid);
    setRoleId(roleIdParam);
    setPermissions(permissionsParam || []);
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
        roleId: roleIdParam,
        logo: localStorage.getItem("logo"),
        permissions: permissionsParam || [],
        expiration: tokenExpirationDate.toISOString(),
      })
    );
    setLogo(localStorage.getItem("logo"));
  }, []);

  const logout = useCallback((type = "MANUAL") => {

    if (channelRef.current && type !== "SYNC_LOGOUT") {
      try {
        channelRef.current.postMessage({ type: "LOGOUT" });
      } catch (_) {
        // Channel may already be closed by useEffect cleanup — safe to ignore
      }
    }
    // Track Logout - Avoid hitting the API if it's a stale or synchronized broadcast logout
    if (userId && token && email !== "root@iviewsense.com" && type !== "STALE_SESSION" && type !== "SYNC_LOGOUT") {
      apipostHandler("/api/user-track/logout", { userId, logoutType: type }, token);
    }
    setShowIdleModal(false);
    setToken(null);
    setUserId(null);
    setTokenExp(null);
    setName(null);
    setDepartment(null);
    setEmail(null);
    setLabId(null);
    setRoleId(null);
    setLogo(null);
    setPermissions([]);
    localStorage.clear();
    sessionStorage.clear();
    localStorage.removeItem("calibmaster_userData");
    localStorage.removeItem("logo");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }, [userId, token, dispatch]);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("calibmaster_userData"));
    if (storedData?.token && new Date(storedData.expiration) > new Date()) {
      login(
        storedData.userId,
        storedData.token,
        storedData.name,
        storedData.email,
        storedData.department,
        storedData.labId,
        storedData.roleId,
        storedData.permissions,
        new Date(storedData.expiration)
      );
    }
  }, [login]);
  
  const switchLab = useCallback((newLabId) => {
    setLabId(newLabId);
    // Update localStorage so the change persists across refreshes
    const storedData = JSON.parse(localStorage.getItem("calibmaster_userData"));
    if (storedData) {
      localStorage.setItem(
        "calibmaster_userData",
        JSON.stringify({
          ...storedData,
          labId: newLabId,
        })
      );
    }
    // Note: When switching lab, the logo might also change. 
    // We should probably fetch the new lab's logo here or rely on the dashboard to fetch it.
  }, []);

  const updateLogo = useCallback((newLogo) => {
    setLogo(newLogo);
    localStorage.setItem("logo", newLogo);
    const storedData = JSON.parse(localStorage.getItem("calibmaster_userData"));
    if (storedData) {
      localStorage.setItem(
        "calibmaster_userData",
        JSON.stringify({
          ...storedData,
          logo: newLogo,
        })
      );
    }
  }, []);

  const updatePermissions = useCallback((newPermissions) => {
    setPermissions(newPermissions);
    const storedData = JSON.parse(localStorage.getItem("calibmaster_userData"));
    if (storedData) {
      localStorage.setItem(
        "calibmaster_userData",
        JSON.stringify({
          ...storedData,
          permissions: newPermissions,
        })
      );
    }
  }, []);

  // ── Token Expiry: Try Refresh First, Logout Only If Refresh Fails ──────────
  useEffect(() => {
    let logoutTimer;
    if (token && tokenExp) {
      const remainingTime = new Date(tokenExp).getTime() - new Date().getTime();

      const handleExpiry = async () => {
        // 1. Try to silently refresh the access token
        const newToken = await tryRefreshToken();
        if (newToken) {
          // Refresh succeeded — update React state + localStorage so everything uses new token
          try {
            const decoded = jwtDecode(newToken);
            const newExp = new Date(decoded.exp * 1000);
            setToken(newToken);
            setTokenExp(newExp);

            // Update calibmaster_userData so page refresh also gets the new token
            const stored = JSON.parse(localStorage.getItem("calibmaster_userData") || "{}");
            localStorage.setItem("calibmaster_userData", JSON.stringify({
              ...stored,
              token: newToken,
              expiration: newExp.toISOString(),
            }));
            localStorage.setItem("token", newToken);

            console.log("[App] Token silently refreshed — session continues");
          } catch (e) {
            console.error("[App] Failed to decode refreshed token", e);
            logout("SESSION_EXPIRED");
          }
        } else {
          // 2. Refresh failed (refresh token expired/revoked) → log out
          console.warn("[App] Refresh token expired — logging out");
          logout("SESSION_EXPIRED");
        }
      };

      if (remainingTime > 0) {
        // Fire refresh 5 seconds BEFORE token expires (works for tokens as short as 6s)
        const PROACTIVE_BUFFER_MS = 5000;
        const refreshAt = Math.max(remainingTime - PROACTIVE_BUFFER_MS, 0);
        console.log(`[App] Token refresh scheduled in ${Math.round(refreshAt / 1000)}s`);
        logoutTimer = setTimeout(handleExpiry, refreshAt);
      } else {
        // Already expired — try refresh immediately
        handleExpiry();
      }
    }
    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [token, tokenExp, logout]);

  // Fetch Global Settings
  useEffect(() => {
    if (token) {
      apipostHandler("/api/user-track/get-settings", {}, token)
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

    let throttleTimer = null;
    const updateActivityTime = () => {
      hasHadFirstActivity = true;
      const now = Date.now();
      lastActivityTimeRef.current = now;

      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          try {
            channel.postMessage({
              type: "ACTIVITY",
              time: now,
            });
          } catch (_) {}
          throttleTimer = null;
        }, 1000);
      }
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
      "scroll",
      "wheel",
      "touchstart",
      "click",
      "focus",
      "input",
      "keydown",
      "keypress",
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
        if (!sessionWasStaleRef.current) setShowIdleModal(false);
      }
    };
    const handleWindowFocus = () => {
      hasHadFirstActivity = true;
      lastActivityTimeRef.current = Date.now();
      if (!sessionWasStaleRef.current) setShowIdleModal(false);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    // ─────────────────────────────────────────────────────────────────────────

    const WARNING_DURATION = 60 * 1000; // 60 sec

    let checkInterval;
    checkInterval = setInterval(() => {
      // Exclude pages where internal editors (Handsontable, result entry) absorb
      // all pointer/keyboard events and they never reach document-level listeners.
      // Check dynamically on each tick so navigating away re-enables idle detection.
      const isExcludedFromIdle =
        email === "root@iviewsense.com" ||
        window.location.pathname.includes("/user-track");

      if (isExcludedFromIdle) return;

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
        if (!sessionWasStaleRef.current) setShowIdleModal(false);
      }

      if (timeSinceLastActivity >= idleTimeMillis + WARNING_DURATION) {
        try { channel.postMessage({ type: "LOGOUT" }); } catch (_) {}
        clearInterval(checkInterval);
        logout("INACTIVE");
      }
    }, 1000);

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
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);

      if (throttleTimer) clearTimeout(throttleTimer);
      if (checkInterval) clearInterval(checkInterval);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [token, idleTimeoutMinutes, logout]);

  // Tab Close Tracker (replaces interval Pings)
  const trackingInitialized = useRef(false);
  const isThisTabTracked = useRef(false);

  useEffect(() => {
    if (!token || !availability) {
      setSessionSynced(false);
      return;
    }

    if (email === "root@iviewsense.com") {
      setSessionSynced(true);
      return;
    }

    // 1. Verify Session
    apipostHandler("/api/user-track/verify-session", { userId }, token)
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
        location.pathname.includes("/user-track") ||
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

      if (newCount === 0 && email !== "root@iviewsense.com") {
        const url = config.Calibmaster.URL + "/api/user-track/intent-logout";
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


  // useEffect(() => {
  //   if (!token || !userId) return;

  //   const ping = () => {
  //     // Fire-and-forget — we don't want to block the UI or log errors on every ping
  //     apipostHandler("/api/user-track/heartbeat-ping", { userId }, token).catch(() => { });
  //   };

  //   ping(); // Immediate ping on mount / login
  //   const pingInterval = setInterval(ping, 90 * 1000); // every 90s
  //   return () => clearInterval(pingInterval);
  // }, [token, userId]);
  // ── Heartbeat ping — keeps the DB LOGIN record's updatedAt timestamp fresh ──
  // Paused while idle modal is showing so the backend doesn't close the session
  // while the user is deciding whether to click "Stay Logged In".
  // NOTE: No background-tab throttle! When the user works in a child tab
  // (Excel/Enter Result), this dashboard tab is hidden. Browser throttling of
  // setInterval can delay pings, but we must NOT add an extra gate — the idle
  // check on line 579 already stops pings for truly idle users.
  useEffect(() => {
    if (!token || !userId) return;

    const ping = () => {
      // Do NOT ping while the idle warning modal is showing.
      if (showIdleModal) return;

      // Check if the user is currently considered "Idle" (no interaction for > idleTimeout)
      const currentTime = Date.now();
      const idleMillis = (idleTimeoutMinutes || 20) * 60 * 1000;
      const timeSinceActivity = currentTime - lastActivityTimeRef.current;

      // If idle threshold reached, stop pinging to allow backend to expire session
      if (timeSinceActivity >= idleMillis) return;

      // Always read the latest token from localStorage (updated by refresh flow)
      const currentToken = localStorage.getItem("token") || token;

      apipostHandler("/api/user-track/heartbeat-ping", { userId }, currentToken)
        .then((res) => {
          if (res.data && res.data.valid === false) {
            const lType = res.data.logoutType;
            if (lType === "INACTIVE" || lType === "STALE_SESSION" || lType === "BROWSER_CLOSE" || lType === "AUTO") {
              // Show recovery modal — do NOT lock it with sessionWasStaleRef
              // so that user activity (mousemove, click) can dismiss it naturally.
              setShowIdleModal(true);
            } else {
              logout("ADMIN_RESET");
            }
          }
        })
        .catch(() => { });
    };

    ping(); // Immediate ping on mount / login
    const pingInterval = setInterval(ping, 60 * 1000);
    return () => clearInterval(pingInterval);
  }, [token, userId, idleTimeoutMinutes, showIdleModal]);


  // ── FIX 2: Countdown timer — triggers logout at 0 ──────────────────────────
  useEffect(() => {
    if (!showIdleModal) return;

    setCountdown(60);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 🔥 FIX 2: Actually logout when countdown hits 0.
          // Previously this just returned 0 and the user sat on a frozen dialog.
          logout("INACTIVE");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showIdleModal, logout]);

  useEffect(() => {
    if (!token) {
      setShowIdleModal(false);
    }
  }, [token]);

  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState(null);

  // ── FIX 3: handleStayLoggedIn — always re-creates session BEFORE resuming ──
  const handleStayLoggedIn = async () => {
    setIsRecovering(true);
    setRecoveryError(null);
    try {
      // Always re-create the backend session. The cron may have already closed it
      // while the user was looking at the warning modal (since heartbeat was paused).
      // This ensures a valid LOGIN record exists BEFORE heartbeat pings resume.
      const currentToken = localStorage.getItem("token") || token;
      const res = await apipostHandler("/api/user-track/login", { userId }, currentToken);
      
      if (res.error || res.data?.status === "ERROR") {
        // If the error is that we're "already logged in", it means our session is 
        // still active on the backend and we can safely resume heartbeats.
        if (res.data?.message?.includes("already logged in")) {
          console.log("Session recovery: Existing session is still active. Resuming...");
        } else {
          throw new Error(res.error || res.data?.message || "Session recovery failed");
        }
      }
      sessionWasStaleRef.current = false;

      // Reset the idle clock — this is what keeps the idle interval from re-triggering
      lastActivityTimeRef.current = Date.now();

      // Close the modal AFTER session is re-created — this unblocks heartbeat pings
      // (Fix 1 skips pings while showIdleModal is true)
      setShowIdleModal(false);
      setCountdown(60);

      // Broadcast activity to all tabs so their idle timers reset too
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "ACTIVITY",
          time: Date.now(),
        });
      }
    } catch (error) {
      console.error("Session recovery failed:", error);
      setRecoveryError(error.message || "Session recovery failed. Please logout and login again.");
    } finally {
      setIsRecovering(false);
    }
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
        roleId,
        logo,
        permissions,
        backEndVersion: version,
        login,
        logout,
        switchLab,
        setLogo: updateLogo,
        updatePermissions,
      }}
    >
      {isLoading && <Spinner size="medium" />}

      {showIdleModal && token && (
        <WarrringModel
          showIdleModal={showIdleModal}
          countdown={countdown}
          logout={logout}
          handleStayLoggedIn={handleStayLoggedIn}
          isRecovering={isRecovering}
          recoveryError={recoveryError}
        />
      )}

      <Routes>
        {/* Offline route */}
        <Route path="/offline" element={<OfflinePage />} />

        {/* Server unavailable */}
        {!availability && <Route path="*" element={<UnavailablePage />} />}

        {/* Login routes */}
        {availability && !token && (
          <>
            <Route path="/" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}

        {/* Authenticated routes */}
        {availability && token && !sessionSynced && (
          <Route path="*" element={null} /> // Render nothing while waiting for initial ping to sync
        )}

        {availability && token && sessionSynced && (
          <>
            <Route path="/dashboard" element={<DashboardErrorBoundary><Dashboard /></DashboardErrorBoundary>}>
              <Route index element={<WelcomeScreen />} />
              <Route path="labs" element={<ProtectedRoute requiredPermission="MANAGE_LABS" element={<Labs />} />} />
              <Route path="labs/list" element={<ProtectedRoute requiredPermission="MANAGE_LABS" element={<LabList />} />} />
              <Route path="labs/edit" element={<ProtectedRoute requiredPermission="ACCESS_LAB_INFO" element={<EditLab />} />} />
              <Route path="customers" element={<ProtectedRoute requiredPermission="LIST_CUSTOMER" element={<ListCustomer />} />} />
              <Route path="customers/create" element={<ProtectedRoute requiredPermission="CREATE_CUSTOMER" element={<CreateCustomer />} />} />
              <Route path="customers/edit" element={<ProtectedRoute requiredPermission="CREATE_CUSTOMER" element={<EditCustomer />} />} />
              <Route path="users/add" element={<ProtectedRoute requiredPermission="CREATE_USER" element={<AddUser />} />} />
              <Route path="users" element={<ProtectedRoute requiredPermission="LIST_USER" element={<Users />} />} />
              {/* UOM */}
              <Route path="uom/create" element={<ProtectedRoute requiredPermission="CREATE_UOM" element={<CreateUOM />} />} />
              <Route path="uom" element={<ProtectedRoute requiredPermission="LIST_UOM" element={<ListUOM />} />} />
              <Route path="uom/edit" element={<ProtectedRoute requiredPermission="EDIT_UOM" element={<EditUOM />} />} />

              {/* Instruments */}
              <Route path="make-model" element={<ProtectedRoute requiredPermission="ACCESS_MAKE_MODEL" element={<MakeModelPage />} />} />
              <Route path="instruments/create" element={<ProtectedRoute requiredPermission="CREATE_INSTRUMENT" element={<CreateInstrument />} />} />
              <Route path="instruments" element={<ProtectedRoute requiredPermission="LIST_INSTRUMENT" element={<ListInstrument />} />} />
              <Route path="instruments/edit" element={<ProtectedRoute requiredPermission="EDIT_INSTRUMENT" element={<EditInstrument />} />} />
              <Route path="instrument-types/create" element={<ProtectedRoute requiredPermission="CREATE_INSTRUMENT_VARIANT" element={<CreateInstrumentType />} />} />
              <Route path="instrument-types" element={<ProtectedRoute requiredPermission="LIST_INSTRUMENT_VARIANT" element={<ListInstrumentType />} />} />
              <Route path="instrument-types/edit" element={<ProtectedRoute requiredPermission="CREATE_INSTRUMENT_VARIANT" element={<EditInstrumentType />} />} />

              {/* Uncertainty Parameters */}
              <Route path="uncertainty/create" element={<ProtectedRoute requiredPermission="CREATE_MASTER" element={<CreateUncertaintyParameter />} />} />
              <Route path="uncertainty" element={<ProtectedRoute requiredPermission="LIST_MASTER" element={<ListUncertaintyParameter />} />} />

              {/* SRF Config */}
              <Route path="srf-config/add" element={<ProtectedRoute requiredPermission="CREATE_SRF_CONFIG" element={<AddSRFConfig />} />} />
              <Route path="srf-config" element={<ProtectedRoute requiredPermission="LIST_SRF_CONFIG" element={<ListSRFConfig />} />} />

              {/* ULR */}
              <Route path="ulr/add" element={<ProtectedRoute requiredPermission="CREATE_ULR" element={<AddUlr />} />} />
              <Route path="ulr" element={<ProtectedRoute requiredPermission="LIST_ULR" element={<ListULR />} />} />

              {/* SRF */}
              <Route path="srf/add" element={<ProtectedRoute requiredPermission="CREATE_SRF" element={<AddSRF />} />} />
              <Route path="srf" element={<ProtectedRoute requiredPermission="LIST_SRF" element={<SRFs />} />} />

              {/* Masters */}
              <Route path="standard-details" element={<ProtectedRoute requiredPermission="CREATE_MASTER" element={<StandardDetails />} />} />
              <Route path="masters" element={<ProtectedRoute requiredPermission="LIST_MASTER" element={<ListMaster />} />} />

              {/* External Masters */}
              <Route path="external-master/add" element={<ProtectedRoute requiredPermission="CREATE_EXTERNAL_MASTER" element={<ExternalMasterAdd />} />} />
              <Route path="external-masters" element={<ProtectedRoute requiredPermission="LIST_EXTERNAL_MASTER" element={<ListExternalMaster />} />} />

              {/* Certificate Config */}
              <Route path="certificate-config/create" element={<ProtectedRoute requiredPermission="ACCESS_CERTIFICATE_CONFIG" element={<CreateCertificateConfig />} />} />
              <Route path="certificate-config" element={<ProtectedRoute requiredPermission="ACCESS_CERTIFICATE_CONFIG" element={<ListCertificateConfig />} />} />
              <Route path="certificate-format" element={<ProtectedRoute requiredPermission="ACCESS_CERTIFICATE_FORMAT" element={<CertificateFormatCreator />} />} />

              {/* Data Storage */}
              <Route path="data-storage" element={<ProtectedRoute requiredPermission="ACCESS_DATA_STORAGE" element={<DeletedIndex />} />} />

              {/* Master Documents */}
              <Route path="master-doc/add" element={<ProtectedRoute requiredPermission="CREATE_MASTER_DOC" element={<MasterListDocAdd />} />} />
              <Route path="master-doc" element={<ProtectedRoute requiredPermission="LIST_MASTER_DOC" element={<MasterListDocList />} />} />
              <Route path="master-doc-detail/add" element={<ProtectedRoute requiredPermission="CREATE_DOC_DETAIL" element={<MasterListDocDetailAdd />} />} />
              <Route path="master-doc-detail" element={<ProtectedRoute requiredPermission="LIST_DOC_DETAIL" element={<MasterListDocDetailList />} />} />
              <Route path="master-doc-format/add" element={<ProtectedRoute requiredPermission="CREATE_DOC_FORMAT" element={<MasterListDocFormatAdd />} />} />
              <Route path="master-doc-format" element={<ProtectedRoute requiredPermission="LIST_DOC_FORMAT" element={<MasterListDocFormatList />} />} />

              {/* Procedures */}
              <Route path="procedures/define" element={<ProtectedRoute requiredPermission="CREATE_PROCEDURE" element={<DefineProcedure />} />} />
              <Route path="procedures" element={<ProtectedRoute requiredPermission="LIST_PROCEDURE" element={<ListDefinedProcedure />} />} />

              {/* Calibmaster Excel */}
              <Route path="excel/create" element={<ProtectedRoute requiredPermission="CREATE_EXCEL" element={<CreateCalibmasterExcel />} />} />
              <Route path="excel" element={<ProtectedRoute requiredPermission="LIST_EXCEL" element={<ListCalibmasterExcel />} />} />

              {/* Roles & Access */}
              <Route path="roles" element={<ProtectedRoute requiredPermission="ACCESS_ROLES" element={<Roles />} />} />
              <Route path="user-track" element={<ProtectedRoute requiredPermission="ACCESS_USER_TRACK" element={<UserTrack />} />} />

              {/* Calibration Due Dates */}
              <Route path="calibration-due" element={<ProtectedRoute requiredPermission="ACCESS_DUE_DATE" element={<DueDateChecker />} />} />

              {/* Self-service — no permission required */}
              <Route path="reset-password" element={<PasswordReset />} />

              {/* Bank Config — requires ACCESS_BANK_CONFIG (admin bypass applies) */}
              <Route path="bank-config/add" element={<ProtectedRoute requiredPermission="ACCESS_BANK_CONFIG" element={<AddBankConfig />} />} />
              <Route path="bank-config" element={<ProtectedRoute requiredPermission="ACCESS_BANK_CONFIG" element={<ListBankConfig />} />} />

              {/* Quotation */}
              <Route path="quotation-config/create" element={<ProtectedRoute requiredPermission="ACCESS_QUOTATION_CONFIG" element={<QuotationConfig />} />} />
              <Route path="quotation-config" element={<ProtectedRoute requiredPermission="ACCESS_QUOTATION_CONFIG" element={<QuotationConfigList />} />} />
              <Route path="quotation/create" element={<ProtectedRoute requiredPermission="CREATE_QUOTATION" element={<QuotationItem />} />} />
              <Route path="quotation/customers" element={<ProtectedRoute requiredPermission="LIST_QUOTATION" element={<QuotationCustomerList />} />} />

              {/* System */}
              <Route path="qr-codes" element={<ProtectedRoute requiredPermission="ACCESS_QR_CODES" element={<QRCodePage />} />} />
              <Route path="email" element={<ProtectedRoute requiredPermission="ACCESS_EMAIL" element={<Email />} />} />
              <Route path="sync" element={<ProtectedRoute requiredPermission="SYNC_DATA" element={<SyncPage />} />} />
              <Route path="scanner" element={<ProtectedRoute requiredPermission="ACCESS_SCANNER" element={<ScannerEnterResult />} />} />
               <Route path="inward-reports" element={<ProtectedRoute requiredPermission="ACCESS_REPORTS" element={<InwardReports />} />} />

              {/* Task Management */}
              <Route path="tasks/review-pending" element={<ProtectedRoute requiredPermission="REVIEW_RESULT" element={<ApprovalDashboard stage="REVIEW" />} />} />
              <Route path="tasks/auth-pending" element={<ProtectedRoute requiredPermission="AUTHORIZE_RESULT" element={<ApprovalDashboard stage="AUTH" />} />} />
            </Route>

            <Route path="/exceltable" element={<PageErrorBoundary ><ExcelTable /></PageErrorBoundary>} />
            <Route
              path="/enter-result/:srf_item_id/:srf_id/:intrument_type_id"
              element={<PageErrorBoundary ><EnterResult /></PageErrorBoundary>}
            />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}

        {/* User Track Routes */}
        {availability && (
          <Route path="/user-track" element={<UserTrack />} />
        )}
      </Routes>
    </AuthContext.Provider>
  );
};

const App = () => (
  <Router basename={import.meta.env.BASE_URL}>
    <AppContent />
  </Router>
);

export default App;
