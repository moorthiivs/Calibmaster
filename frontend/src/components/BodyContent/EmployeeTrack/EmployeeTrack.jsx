import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../../context/auth-context";
import { apipostHandler } from "../../../utils/api";
import config from "../../../utils/config.json";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Users,
  Clock,
  Calendar,
  Search,
  ChevronRight,
  ArrowLeft,
  FileText,
  User as UserIcon,
  LogIn,
  LogOut,
  MoreVertical,
  Activity,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Tooltip, Modal, Spin, Switch, InputNumber, Button, Form, message, notification, DatePicker, Select, Segmented, Checkbox } from "antd";

const { RangePicker } = DatePicker;
const { Option } = Select;


const EmployeeTrack = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [stats, setStats] = useState({ todayHours: 0, monthlyHours: 0, user: null });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dateRange, setDateRange] = useState([dayjs(), dayjs()]);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [form] = Form.useForm();

  const formatDuration = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) return "0 hr 0 min";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours} hr ${minutes} min`;
  };

  const formatDurationExact = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) return "0 hr 0 min 0 sec";
    const totalSeconds = Math.round(decimalHours * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (seconds === 0 && hours === 0 && minutes === 0) return "0 hr 0 min 0 sec";
    if (seconds === 0) return `${hours} hr ${minutes} min`;
    return `${hours} hr ${minutes} min ${seconds} sec`;
  };

  // Fetch all labs for manual selection
  const fetchLabs = useCallback(async () => {
    try {
      // Use the new public route
      const result = await fetch(config.Calibmaster.URL + "/api/employee-track/labs");
      const data = await result.json();
      if (data.status === "SUCCESS") {
        setLabs(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch labs", err);
    }
  }, []);

  const fetchActiveEmployees = useCallback(async (labId, startDate = selectedDate, endDate = null, skipClearSelection = false) => {
    if (!labId) return;
    setLoading(true);
    // Ensure dates are formatted as YYYY-MM-DD strings
    const formattedStart = (typeof startDate === "string") ? startDate : (dayjs.isDayjs(startDate) ? startDate.format("YYYY-MM-DD") : dayjs(startDate).format("YYYY-MM-DD"));
    const formattedEnd = endDate ? ((typeof endDate === "string") ? endDate : (dayjs.isDayjs(endDate) ? endDate.format("YYYY-MM-DD") : dayjs(endDate).format("YYYY-MM-DD"))) : null;

    const result = await apipostHandler("/api/employee-track/active-employees", {
      labId,
      date: formattedStart,
      endDate: formattedEnd
    }, null);

    if (result.data?.status === "SUCCESS") {
      const emps = result.data.data;
      setActiveEmployees(emps);
      // Clear multi-selection when switching labs or dates
      if (!skipClearSelection) {
        setSelectedUserIds([]);
        setSelectedUser(null);
      }
    }
    setLoading(false);
  }, [selectedDate]);

  const fetchUserDetailStats = async (userId, labId, date = selectedDate) => {
    setLoading(true); // Start loading when fetching user details

    // Ensure date is formatted as YYYY-MM-DD string
    const formattedDate = (typeof date === "string") ? date : (dayjs.isDayjs(date) ? date.format("YYYY-MM-DD") : dayjs(date).format("YYYY-MM-DD"));

    // Stats are only for single user view
    if (userId && !Array.isArray(userId)) {
      const statsResult = await apipostHandler("/api/employee-track/user-stats", { userId, labId, date: formattedDate }, null);
      if (statsResult.data?.status === "SUCCESS") {
        setStats(statsResult.data.data);
      }
    } else {
      setStats({ todayHours: 0, monthlyHours: 0, user: null });
    }

    const logsResult = await apipostHandler("/api/employee-track/daily-report", { userId, date: formattedDate, labId }, null);
    if (logsResult.data?.status === "SUCCESS") {
      setLogs(logsResult.data.data);
      setCurrentPage(1); // Reset to first page when user or date changes
    }
    setLoading(false); // End loading
  };

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  const handleLabSelect = (lab) => {
    setSelectedLab(lab);
    fetchActiveEmployees(lab.lab_id);
  };

  const handleUserSelect = (employee) => {
    // Single select:Focus on this user, show stats
    setSelectedUser(employee);
    // Also include in bulk selection if not already there
    if (!selectedUserIds.includes(employee.userId)) {
      setSelectedUserIds([employee.userId]);
    }
    fetchUserDetailStats(employee.userId, selectedLab.lab_id, selectedDate);
    // On mobile, close sidebar after selection
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleBulkToggle = (userId) => {
    setSelectedUserIds(prev => {
      const newIds = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];

      // Auto-trigger fetch if something is selected
      if (newIds.length > 0) {
        if (isRangeMode) {
          fetchFilteredReport(newIds.length === activeEmployees.length ? null : newIds, selectedLab.lab_id, dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD"));
        } else {
          fetchUserDetailStats(newIds.length === activeEmployees.length ? null : newIds, selectedLab.lab_id, selectedDate.format("YYYY-MM-DD"));
        }
      }
      return newIds;
    });
    // Deselect single focus if we are checking/unchecking
    setSelectedUser(null);
  };

  const handleToggleAll = (checked) => {
    if (checked) {
      const allIds = activeEmployees.map(e => e.userId);
      setSelectedUserIds(allIds);
      setSelectedUser(null);
      if (isRangeMode && dateRange[0] && dateRange[1]) {
        fetchFilteredReport(null, selectedLab?.lab_id, dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD"));
      } else if (!isRangeMode && selectedLab) {
        fetchUserDetailStats(null, selectedLab.lab_id, selectedDate.format("YYYY-MM-DD"));
      }
    } else {
      setSelectedUserIds([]);
      setSelectedUser(null);
      setLogs([]);
      setStats({ todayHours: 0, monthlyHours: 0, user: null });
    }
  };

  const handleDateChange = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const formattedDate = date.format("YYYY-MM-DD");
    if (selectedLab) {
      fetchActiveEmployees(selectedLab.lab_id, formattedDate);
      const targetIds = selectedUserIds.length > 1 ? selectedUserIds : (selectedUser ? selectedUser.userId : (selectedUserIds.length === 1 ? selectedUserIds[0] : null));
      fetchUserDetailStats(targetIds, selectedLab.lab_id, formattedDate);
    }
  };

  const fetchFilteredReport = async (userId, labId, startDate, endDate) => {
    setLoading(true);
    try {
      const result = await apipostHandler("/api/employee-track/filtered-report", {
        userId,
        labId,
        startDate,
        endDate
      }, null);
      if (result.data?.status === "SUCCESS") {
        setLogs(result.data.data);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to fetch filtered report", err);
      message.error("Failed to fetch reports for the selected range.");
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (dates) => {
    if (!dates) {
      setIsRangeMode(false);
      return;
    }
    const [start, end] = dates;
    setDateRange([start, end]);
    setIsRangeMode(true);
    if (selectedLab) {
      const targetIds = (selectedUserIds.length > 1 || (!selectedUser && selectedUserIds.length === 1))
        ? selectedUserIds
        : (selectedUser ? selectedUser.userId : (selectedUserIds.length === activeEmployees.length ? null : selectedUserIds));

      fetchFilteredReport(
        targetIds.length === 0 ? null : targetIds,
        selectedLab.lab_id,
        start.format("YYYY-MM-DD"),
        end.format("YYYY-MM-DD")
      );
      // Also update the sidebar to only show employees active in this range
      fetchActiveEmployees(selectedLab.lab_id, start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    }
  };

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;

    let reportTitle = "Employee_Activity_Report";
    if (!selectedUser && selectedUserIds.length === activeEmployees.length) {
      reportTitle = "Full_Team_Activity_Report";
    } else if (selectedUserIds.length > 1) {
      reportTitle = "Group_Activity_Report";
    } else if (selectedUser) {
      reportTitle = `Activity_Report_${selectedUser.User.name.replace(/\s+/g, '_')}`;
    }

    const headers = ["Employee", "Date", "Status", "Login Time", "Logout Time", "Type / Reason", "IP Address", "Duration (Hrs)"];
    const csvRows = logs.map(log => {
      const row = [
        `"${log.User?.name || "Unknown"}"`,
        dayjs(log.loginAt).format("YYYY-MM-DD"),
        log.status,
        dayjs(log.loginAt).format("hh:mm A"),
        log.status === "LOGOUT" ? dayjs(log.logoutAt).format("hh:mm A") : "—",
        `"${log.status === "LOGOUT" ? (log.logoutType || 'Manual') : "Session Start"}"`,
        log.ipAddress || "::1",
        log.status === "LOGOUT" ? log.totalHours : "Active"
      ];
      return row;
    });

    const csvContent = [
      headers.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");

    const fileName = `${reportTitle}_${dayjs().format("YYYYMMDD")}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!logs || logs.length === 0) return;
    const doc = new jsPDF();

    let reportTitle = "Employee Activity Report";
    let fileNameTitle = "Activity_Report";

    if (!selectedUser && selectedUserIds.length === activeEmployees.length) {
      reportTitle = "Full Team Activity Report";
      fileNameTitle = "Full_Team_Report";
    } else if (selectedUserIds.length > 1) {
      reportTitle = "Group Activity Report";
      fileNameTitle = "Group_Report";
    } else if (selectedUser) {
      reportTitle = `Activity Report: ${selectedUser.User.name}`;
      fileNameTitle = selectedUser.User.name.replace(/\s+/g, '_');
    }

    const tableColumn = ["Employee", "Date", "Event", "Login Time", "Logout Time", "Reason", "Duration"];
    const tableRows = logs.map(log => {
      return [
        log.User?.name || "Unknown",
        dayjs(log.loginAt).format("DD-MM-YYYY"),
        log.status,
        dayjs(log.loginAt).format("hh:mm A"),
        log.status === "LOGOUT" ? dayjs(log.logoutAt).format("hh:mm A") : "—",
        log.status === "LOGOUT" ? (log.logoutType || "Manual") : "Session Start",
        log.status === "LOGOUT" ? formatDuration(log.totalHours) : "Active"
      ];
    });

    // --- Calculate Summary Totals per Employee ---
    const userTotals = {};
    logs.forEach(log => {
      const name = log.User?.name || "Unknown";
      if (!userTotals[name]) userTotals[name] = 0;
      // Only sum if it's a closed session with duration
      if (log.status === "LOGOUT" && log.totalHours) {
        userTotals[name] += log.totalHours;
      }
    });

    const summaryRows = Object.entries(userTotals).map(([name, total]) => [
      name,
      formatDuration(total)
    ]);

    const rangeText = isRangeMode
      ? `Range: ${dateRange[0].format("DD MMM YYYY")} to ${dateRange[1].format("DD MMM YYYY")}`
      : `Date: ${dayjs(selectedDate).format("DD MMM YYYY")}`;

    doc.setFontSize(16);
    doc.text(reportTitle, 14, 15);
    doc.setFontSize(10);
    doc.text(rangeText, 14, 22);
    doc.text(`Laboratory: ${selectedLab?.lab_name}`, 14, 27);

    // Initial starting point for the first table
    let currentY = 32;

    if (selectedUser && selectedUserIds.length === 1) {
      doc.text(`Department: ${selectedUser?.User.department}`, 14, 32);
      currentY = 37;
    }

    // --- Render Summary Table ---
    if (summaryRows.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text("Activity Summary (Total Hours)", 14, currentY);

      autoTable(doc, {
        head: [["Employee", "Total Working Hours"]],
        body: summaryRows,
        startY: currentY + 3,
        theme: "grid",
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 12;
    }

    // --- Render Detailed History Table ---
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("Detailed Activity History", 14, currentY);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY + 3,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] }, // Tailwind blue-600
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 }
    });

    doc.save(`${fileNameTitle}_${dayjs().format("YYYYMMDD")}.pdf`);
  };

  const openSettings = async () => {
    setIsSettingsOpen(true);
    setSettingsLoading(true);
    try {
      const { data } = await apipostHandler("/api/employee-track/get-settings", {}, auth.token);
      if (data && data.status === "SUCCESS") {
        form.setFieldsValue({
          idleTimeoutMinutes: data.data.idleTimeoutMinutes,
          preventConcurrentLogins: data.data.preventConcurrentLogins,
        });
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const values = await form.validateFields();
      setSettingsLoading(true);
      const { data } = await apipostHandler("/api/employee-track/update-settings", values, auth.token);
      if (data && data.status === "SUCCESS") {
        notification.success({
          message: "Settings Saved Successfully",
          description: "Global tracking settings have been updated. The new auto-logout timer will apply upon the next screen refresh.",
          placement: "topRight"
        });
        setIsSettingsOpen(false);
      }
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Failed to Save",
        description: "An error occurred while trying to save the settings.",
        placement: "topRight"
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const filteredEmployees = activeEmployees.filter(emp =>
    emp.User.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.User.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!selectedLab) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6 overflow-y-auto">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Laboratory Tracking Terminal</h1>
            <p className="text-slate-500 font-medium">Select a laboratory branch to view real-time employee attendance and working hours.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <button
                key={lab.lab_id}
                onClick={() => handleLabSelect(lab)}
                className="group bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all text-left flex flex-col items-start gap-4 active:scale-95"
              >
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{lab.lab_name}</h3>
                  <p className="text-slate-400 text-sm font-medium line-clamp-1">{lab.city}</p>
                </div>
                <div className="mt-2 w-full flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-500 transition-colors">Explore Assets</span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar - Active Employees List */}
      <div
        className={`fixed inset-y-0 left-0 lg:relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden z-40 lg:z-20 ${isSidebarOpen
          ? "translate-x-0 w-80 shadow-2xl lg:shadow-none"
          : "-translate-x-full lg:translate-x-0 w-0 lg:w-0 border-none"
          }`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Workspace</h2>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedUserIds.length === activeEmployees.length && activeEmployees.length > 0}
                indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < activeEmployees.length}
                onChange={(e) => handleToggleAll(e.target.checked)}
                className="scale-90"
              />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activity Monitor</h3>
            </div>
            {loading ? (
              <div className="h-4 w-12 bg-slate-200 rounded-full animate-pulse"></div>
            ) : (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeEmployees.filter(emp => emp.status === "LOGIN").length > 0
                ? "bg-emerald-100 text-emerald-700 shadow-sm"
                : "bg-slate-100 text-slate-500"
                }`}>
                {activeEmployees.filter(emp => emp.status === "LOGIN").length} ONLINE
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {loading ? (
              <div className="w-full h-10 bg-slate-200 rounded-xl animate-pulse"></div>
            ) : (
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Global / All Employees Entry */}
          {!loading && filteredEmployees.length > 0 && (
            <button
              onClick={() => {
                setSelectedUser(null);
                setSelectedUserIds(activeEmployees.map(e => e.userId));
                if (isRangeMode && dateRange[0] && dateRange[1]) {
                  fetchFilteredReport(null, selectedLab?.lab_id, dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD"));
                } else if (!isRangeMode && selectedLab) {
                  fetchUserDetailStats(null, selectedLab.lab_id, selectedDate.format("YYYY-MM-DD"));
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${!selectedUser && selectedUserIds.length === activeEmployees.length
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "hover:bg-slate-50 text-slate-600"
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-sm">All Employees</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Group Overview</p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${!selectedUser ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`} />
            </button>
          )}

          <div className="h-px bg-slate-100 my-2" />

          {loading ? (
            // Sidebar Skeleton Loader
            [...Array(5)].map((_, i) => (
              <div key={i} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => (
              <div key={emp.userId} className="relative group/card">
                <button
                  onClick={() => handleUserSelect(emp)}
                  className={`w-full flex items-center gap-3 p-3 pr-10 rounded-xl transition-all group ${selectedUser?.userId === emp.userId || (selectedUserIds.includes(emp.userId) && !selectedUser)
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "hover:bg-slate-50 text-slate-600"
                    }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden">
                      <UserIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    {/* Animated online dot */}
                    <div className="absolute bottom-0 right-0">
                      {emp.status === "LOGIN" ? (
                        <span className="relative flex w-3 h-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 border-2 border-white"></span>
                          <span className="relative inline-flex rounded-full w-3 h-3 bg-green-500 border-2 border-white"></span>
                        </span>
                      ) : (
                        <span className="relative flex w-3 h-3">
                          <span className="relative inline-flex rounded-full w-3 h-3 bg-slate-300 border-2 border-white"></span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-sm truncate">{emp.User.name}</p>
                    <p className="text-[10px] text-slate-400 truncate tracking-tight uppercase font-black">
                      {emp.User.department}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedUser?.userId === emp.userId ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`} />
                </button>

                {/* Bulk Select Checkbox overlay */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <Checkbox
                    checked={selectedUserIds.includes(emp.userId)}
                    onChange={() => handleBulkToggle(emp.userId)}
                    className="scale-110"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No employee activity found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Navbar Overlay when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs lg:hidden z-25"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Tracking Report</h1>
          </div>
          <button
            onClick={() => setSelectedLab(null)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          {/* Identity & Context Row */}
          <div className="px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {/* <button
                  onClick={() => navigate("/dashboard")}
                  className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-blue-100"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button> */}

                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2.5 bg-blue-50/50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100/30"
                  title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                  {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                </button>
              </div>

              <div className="h-10 w-px bg-slate-100 hidden md:block mx-1"></div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-800 uppercase truncate">
                    {selectedUser ? selectedUser.User.name : (selectedLab ? "All Activity View" : "Employee Monitor")}
                  </h1>
                  {selectedUser && (
                    <span className={`shrink-0 w-2 h-2 rounded-full ${selectedUser.status === 'LOGIN' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[10px] sm:text-xs font-medium">
                  {selectedUser ? (
                    <>
                      <span className="text-blue-600 font-bold tracking-tight truncate">{selectedUser.User.email}</span>
                      <span className="hidden sm:inline w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase text-[9px] sm:text-[10px] font-black">{selectedUser.User.department}</span>
                    </>
                  ) : (
                    <span>{selectedLab ? `Viewing activity summary for ${selectedLab.lab_name}` : "Select an employee to begin session tracking"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                placeholder="Laboratory"
                value={selectedLab?.lab_id}
                onChange={(value) => {
                  const lab = labs.find(l => l.lab_id === value);
                  if (lab) handleLabSelect(lab);
                }}
                className="w-full sm:w-[220px]"
                suffixIcon={<Activity className="w-4 h-4 text-blue-500" />}
              >
                {labs.map(lab => (
                  <Option key={lab.lab_id} value={lab.lab_id}>
                    <span className="font-semibold">{lab.lab_name}</span>
                  </Option>
                ))}
              </Select>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedLab(null)}
                  className="flex-1 sm:flex-none p-2.5 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all border border-slate-100 flex items-center justify-center gap-2"
                  title="Switch Lab"
                >
                  <Users className="w-5 h-5" />
                  <span className="sm:hidden font-bold text-xs uppercase">Switch</span>
                </button>

                <button
                  onClick={openSettings}
                  className="flex-1 sm:flex-none p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                  title="System Settings"
                >
                  <Settings className="w-5 h-5" />
                  <span className="sm:hidden font-bold text-xs uppercase">Config</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar Row */}
          <div className="px-6 py-3 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Segmented
                shape="round"
                options={[
                  { label: <div className="flex items-center gap-2 px-1" ><Clock className="w-3.5 h-3.5" /> Daily</div>, value: 'daily' },
                  { label: <div className="flex items-center gap-2 px-1"><Calendar className="w-3.5 h-3.5" /> Historical</div>, value: 'historical' }
                ]}
                value={isRangeMode ? 'historical' : 'daily'}
                onChange={(value) => {
                  if (value === 'daily') {
                    setIsRangeMode(false);
                    if (selectedUser) fetchUserDetailStats(selectedUser.userId, selectedLab.lab_id, selectedDate.format("YYYY-MM-DD"));
                  } else {
                    setIsRangeMode(true);
                    if (selectedUser) fetchFilteredReport(selectedUser.userId, selectedLab.lab_id, dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD"));
                  }
                }}
                className="p-1 bg-white rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto"
                block={window.innerWidth < 640}
                size="large"

              />

              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              {isRangeMode ? (
                <RangePicker
                  value={dateRange}
                  onChange={handleRangeChange}
                  className="h-10 rounded-xl border-slate-200 bg-white w-full sm:w-auto"
                  placeholder={["Start Date", "End Date"]}
                  format="DD-MM-YYYY"
                  style={{ borderRadius: "var(--radius-xl)" }}
                />
              ) : (
                <div className="relative group w-full sm:w-auto">
                  {/* <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" /> */}
                  {/* <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="h-10 w-full sm:w-[180px] pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none cursor-pointer"
                  /> */}

                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => handleDateChange(date)}
                    format="DD-MM-YYYY"
                    className="h-10 w-full sm:w-[180px] pl-10 pr-4"
                    style={{ borderRadius: "var(--radius-xl)" }}
                  />

                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => {
                  const targetIds = selectedUserIds.length > 1 
                    ? selectedUserIds 
                    : (selectedUser ? selectedUser.userId : (selectedUserIds.length === 1 ? selectedUserIds[0] : null));

                  const isAllSelected = selectedUserIds.length === activeEmployees.length;
                  const fetchTarget = (isAllSelected && !selectedUser) ? null : targetIds;

                  if (isRangeMode && dateRange[0] && dateRange[1]) {
                    fetchFilteredReport(fetchTarget, selectedLab?.lab_id, dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD"));
                  } else {
                    fetchActiveEmployees(selectedLab?.lab_id, selectedDate.format("YYYY-MM-DD"), null, true);
                    fetchUserDetailStats(fetchTarget, selectedLab?.lab_id, selectedDate.format("YYYY-MM-DD"));
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm h-10"
              >
                <Activity className="w-4 h-4" />
                Refresh
              </button>

              {logs.length > 0 && (
                <div className="flex items-center gap-2 flex-1 sm:flex-none sm:pl-2 sm:border-l sm:border-slate-200 h-10">
                  <button
                    onClick={handleExportPDF}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-black hover:bg-rose-100 transition-all active:scale-95 h-full"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="sm:hidden lg:inline">PDF Export</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-sm font-black hover:bg-blue-100 transition-all active:scale-95 h-full"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="sm:hidden lg:inline">CSV Export</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {(selectedUser || logs.length > 0 || (isRangeMode && !loading)) ? (
            <>
              {/* Stats Grid - Only for single user focus */}
              {selectedUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Today's Total Hours</h3>
                    <div className="flex items-baseline gap-1">
                      {loading ? (
                        <div className="h-8 bg-slate-200 rounded w-24 animate-pulse"></div>
                      ) : (
                        <Tooltip title={formatDurationExact(stats.todayHours)} placement="top">
                          <span className="text-3xl font-black text-slate-800 cursor-pointer">{formatDuration(stats.todayHours)}</span>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                        <Calendar className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Monthly Total Hours</h3>
                    <div className="flex items-baseline gap-1">
                      {loading ? (
                        <div className="h-8 bg-slate-200 rounded w-24 animate-pulse"></div>
                      ) : (
                        <Tooltip title={formatDurationExact(stats.monthlyHours)} placement="top">
                          <span className="text-3xl font-black text-slate-800 cursor-pointer">{formatDuration(stats.monthlyHours)}</span>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 hidden lg:block">
                    <div className="flex justify-between items-start mb-4 text-white">
                      <div className="p-3 bg-white/10 rounded-2xl">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Department</h3>
                    {loading ? (
                      <div className="h-6 bg-slate-700 rounded w-32 animate-pulse"></div>
                    ) : (
                      <p className="text-xl font-black text-white">{selectedUser.User.department}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Event Timeline / Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {isRangeMode ? "Range Activity Log" : "Daily Activity Log"}
                  </h2>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                    {isRangeMode && dateRange[0] && dateRange[1]
                      ? `${dateRange[0].format("DD MMM, YYYY")} - ${dateRange[1].format("DD MMM, YYYY")}`
                      : dayjs(selectedDate).format("DD MMM, YYYY")}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        {!selectedUser && <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Employee</th>}
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Event</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Login Time</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Logout Time</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type / Reason</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">IP Address</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        [...Array(5)].map((_, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20 animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div></td>
                            <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 animate-pulse ml-auto"></div></td>
                          </tr>
                        ))
                      ) : paginatedLogs.length > 0 ? (
                        <>
                          {paginatedLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              {!selectedUser && (
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                      {log.User?.name?.charAt(0) || "U"}
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm whitespace-nowrap ">{log.User?.name || "Unknown"}</span>
                                  </div>
                                </td>
                              )}
                              <td className="px-6 py-5">
                                {log.status === "LOGOUT" ? (
                                  <span className="text-slate-500 font-medium text-sm">
                                    {dayjs(log.date).format("DD MMM, YYYY")}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-sm">Session Start</span>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                {log.status === "LOGIN" ? (
                                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                    <LogIn className="w-3 h-3" />
                                    Login
                                  </span>
                                ) : (
                                  <div className="inline-flex items-center gap-2">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                      <LogIn className="w-3 h-3" />
                                      Login
                                    </span>
                                    /
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                      <LogOut className="w-3 h-3" />
                                      Logout
                                    </span>
                                  </div>
                                )}
                              </td>
                              {/* Login Time — always shown */}
                              <td className="px-6 py-5">
                                <p className="font-bold text-slate-700">{dayjs(log.loginAt).format("hh:mm A")}</p>
                              </td>
                              {/* Logout Time — shown when session is completed */}
                              <td className="px-6 py-5">
                                {log.status === "LOGOUT" && log.logoutAt ? (
                                  <p className="font-bold text-slate-700">
                                    {dayjs(log.logoutAt).format("hh:mm A")}
                                  </p>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                {log.status === "LOGOUT" ? (
                                  <span className="text-slate-500 font-medium text-sm">
                                    {log.logoutType}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-sm">Session Start</span>
                                )}
                              </td>
                              <td className="px-6 py-5">
                                <code className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">
                                  {log.ipAddress || "::1"}
                                </code>
                              </td>
                              <td className="px-6 py-5 text-right font-black text-slate-800">
                                {log.status === "LOGOUT" ? (
                                  <Tooltip title={formatDurationExact(log.totalHours)} placement="left">
                                    <span className="cursor-pointer">{formatDuration(log.totalHours)}</span>
                                  </Tooltip>
                                ) : (
                                  <span className="text-slate-200">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={selectedUser ? "6" : "7"} className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  Showing {paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, logs.length)} of {logs.length} events
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                  >
                                    <ArrowLeft className="w-4 h-4" />
                                  </button>
                                  <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                    Page {currentPage} of {totalPages || 1}
                                  </div>
                                  <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={selectedUser ? "6" : "7"} className="px-6 py-20 text-center">
                            <Activity className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No activity recorded for this selection yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Users className="w-12 h-12 text-slate-200" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Select an Employee</h2>
              <p className="text-slate-400 max-w-sm mb-8">
                Choose an active employee from the left panel to view their detailed working hours, login events, and activity logs.
              </p>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-2 h-2 bg-blue-100 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <Settings className="w-5 h-5 text-blue-600" />
            Employee Tracking Settings
          </div>
        }
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsSettingsOpen(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={saveSettings} loading={settingsLoading} className="bg-blue-600">
            Save Changes
          </Button>,
        ]}
        centered
      >
        <Spin spinning={settingsLoading}>
          <Form form={form} layout="vertical" className="mt-4">
            <div className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-6 text-sm border border-blue-100">
              Configure global behavior for activity tracking. Changes to Auto-Logout will apply the next time a user opens or refreshes the app.
            </div>

            <Form.Item
              name="idleTimeoutMinutes"
              label={<span className="font-semibold text-slate-700">Auto-Logout After Inactivity (Minutes)</span>}
              rules={[{ required: true, message: 'Please set an idle timeout' }]}
              className="mb-2"
            >
              <InputNumber min={1} max={525600} className="w-full h-10 rounded-lg" />
            </Form.Item>

            <Form.Item
              shouldUpdate={(prevValues, currentValues) => prevValues.idleTimeoutMinutes !== currentValues.idleTimeoutMinutes}
              className="mb-4 text-sm"
            >
              {({ getFieldValue }) => {
                const idleMins = getFieldValue('idleTimeoutMinutes');
                if (!idleMins) {
                  return <p className="text-slate-500 mb-0">The system will automatically log out users if no mouse movement or keyboard presses are detected for this duration.</p>;
                }

                const hrs = Math.floor(idleMins / 60);
                const mins = idleMins % 60;

                return (
                  <div className="flex justify-between items-start gap-4 text-slate-500">
                    <p className="mb-0">The system will automatically log out users if no mouse movement or keyboard presses are detected for this duration.</p>
                    <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 whitespace-nowrap mt-[-4px]">
                      ≈ {hrs > 0 ? `${hrs} hr ` : ''}{mins > 0 ? `${mins} min` : (hrs > 0 ? '' : '0 min')}
                    </span>
                  </div>
                );
              }}
            </Form.Item>

            <div className="h-px bg-slate-100 my-4" />

            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Prevent Concurrent Logins</h4>
                <p className="text-sm text-slate-500">
                  If enabled, users will be blocked from logging in on a new device or browser if they already have an active session elsewhere.
                </p>
              </div>
              <Form.Item
                name="preventConcurrentLogins"
                valuePropName="checked"
                className="mb-0 mt-1"
              >
                <Switch />
              </Form.Item>
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default EmployeeTrack;
