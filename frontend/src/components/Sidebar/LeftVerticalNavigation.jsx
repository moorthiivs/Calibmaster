import React, { useContext } from "react";
import { Menu } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "../../context/auth-context";
import {
  faSquarePlus, faClipboardList, faKey, faSync,
  faUsers,
  faUserShield,
  faCubes,
  faRetweet,
  faCogs,
  faEnvelope,
  faMoneyCheckAlt,
  faCalendarCheck,
  faUserTie,
  faUniversity,
  faFlask,
  faRulerCombined,
  faMicroscope,
  faShapes,
  faLayerGroup,
  faProjectDiagram,
  faFileExcel,
  faFile,
  faFileInvoice,
  faFileAlt,
  faTools,
  faTasks
} from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

const icon = (fa) => <FontAwesomeIcon icon={fa} />;

const LeftVerticalNavigation = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarHandler = ({ key }) => {
    navigate(key);
  };

  const item = (key, label, fa) => ({ key, label, icon: icon(fa) });
  const group = (key, label, fa, children) => ({ key, label, icon: icon(fa), children });

  const menuItems = [
    // Customers
    group("Customers", "Customers", faUsers, [
      item("/dashboard/customers/create", "Create", faSquarePlus),
      item("/dashboard/customers", "List", faClipboardList),
    ]),

    // Users (admin only)
    ...(auth.department === "admin"
      ? [group("Users", "Users", faUserShield, [
        item("/dashboard/users/add", "Create", faSquarePlus),
        item("/dashboard/users", "List", faClipboardList),
      ])]
      : []),

    // UOM
    group("UOM", "UOM", faRulerCombined, [
      item("/dashboard/uom/create", "Create", faSquarePlus),
      item("/dashboard/uom", "List", faClipboardList),
    ]),


    // Instrument
    group("Instrument", "Instrument", faMicroscope, [
      item("/dashboard/instruments/create", "Create", faSquarePlus),
      item("/dashboard/instruments", "List", faClipboardList),
    ]),

    // Instrument Variants
    group("Instrument Variants", "Instrument Variants", faShapes, [
      item("/dashboard/instrument-types/create", "Create", faSquarePlus),
      item("/dashboard/instrument-types", "List", faClipboardList),
    ]),

    // Make & Model
    group("Make&Model", "MakeModel", faTools, [
      item("/dashboard/make-model", "List", faSquarePlus),
    ]),

    // Master Document
    group("MasterListDoc", "MasterListDoc", faFile, [
      item("/dashboard/master-doc/add", "Create DocList", faSquarePlus),
      item("/dashboard/master-doc", "Doc List", faClipboardList),
      item("/dashboard/master-doc-detail/add", "Create DocDetail", faSquarePlus),
      item("/dashboard/master-doc-detail", "DocDetail List", faClipboardList),
      item("/dashboard/master-doc-format/add", "Create DocFormat", faSquarePlus),
      item("/dashboard/master-doc-format", "DocFormat List", faClipboardList),
    ]),

    // Master
    group("Master", "Master", faLayerGroup, [
      item("/dashboard/standard-details", "Create", faSquarePlus),
      item("/dashboard/masters", "List", faClipboardList),
    ]),

    // Procedure
    group("Procedure", "Procedure", faProjectDiagram, [
      item("/dashboard/procedures/define", "Create", faSquarePlus),
      item("/dashboard/procedures", "List", faClipboardList),
    ]),

    // CalibmasterExcel
    group("CalibmasterExcel", "CalibmasterExcel", faFileExcel, [
      item("/dashboard/excel/create", "Create", faSquarePlus),
      item("/dashboard/excel", "List", faClipboardList),
    ]),

    // ULR Setup
    group("ULR", "ULR Setup", faUniversity, [
      item("/dashboard/ulr/add", "Create", faSquarePlus),
      item("/dashboard/ulr", "List", faClipboardList),
    ]),

    // SRF
    group("SRF", "SRF", faCogs, [
      item("/dashboard/srf-config/add", "Create Config", faSquarePlus),
      item("/dashboard/srf-config", "List Config", faClipboardList),
      item("/dashboard/srf/add", "Create SRF", faSquarePlus),
      item("/dashboard/srf", "List SRF", faClipboardList),
    ]),

    // Employee
    group("Employee", "Employee", faUserTie, [
      item("/dashboard/employees/create", "Create", faSquarePlus),
      item("/dashboard/employees", "List", faClipboardList),
    ]),

    // Reports
    group("Report", "Reports", faFileAlt, [
      item("/dashboard/inward-reports", "Inward Report", faFileAlt),
    ]),

    //Task
    group("Task", "Task", faTasks, [
      item("/dashboard/tasks/create", "Create", faSquarePlus),
      item("/dashboard/tasks", "List", faClipboardList),
    ]),

    // Calibration Due Date
    group("CalibrationDue", "Calibration Due Date", faCalendarCheck, [
      item("/dashboard/calibration-due", "Due Date", faClipboardList),
    ]),

    // Bank Setup
    group("BankSetup", "Bank Setup", faMoneyCheckAlt, [
      item("/dashboard/bank-config/add", "Create", faSquarePlus),
      item("/dashboard/bank-config", "List", faClipboardList),
    ]),

    // Quotation Setup
    group("Quotation", "Quotation Setup", faUsers, [
      item("/dashboard/quotation-config/create", "Create Config", faSquarePlus),
      item("/dashboard/quotation-config", "List Config", faClipboardList),
      item("/dashboard/quotation/create", "Create Quotation", faSquarePlus),
      item("/dashboard/quotation/customers", "Customer List", faClipboardList),
    ]),

    // E-Mail
    group("Email", "E-Mail", faEnvelope, [
      item("/dashboard/email", "Update", faClipboardList),
    ]),

    // Sync Data
    group("Sync", "Sync Data", faSync, [
      item("/dashboard/sync", "Sync Data", faSync),
    ]),

    // Lab Info (admin only)
    ...(auth.department === "admin"
      ? [group("LabInfo", "Lab Info", faCogs, [
        item("/dashboard/labs/edit", "Update", faClipboardList),
      ])]
      : []),

    // Admin Info (admin only)
    ...(auth.department === "admin"
      ? [group("AdminInfo", "Admin Info", faKey, [
        item("/dashboard/reset-password", "Reset Password", faKey),
      ])]
      : []),
  ];

  return (
    <Menu
      mode="inline"
      theme="dark"
      selectedKeys={[location.pathname]}
      onClick={sidebarHandler}
      items={menuItems}
    />
  );
};

export default LeftVerticalNavigation;
