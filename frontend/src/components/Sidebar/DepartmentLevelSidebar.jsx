import React, { useContext } from "react";
import { Menu } from "antd";
import { AuthContext } from "../../context/auth-context";
import { FaListAlt, FaTasks } from "react-icons/fa";
import { MdAssignmentAdd } from "react-icons/md";
// FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCertificate,
  faList,
  faSquarePlus,
  faSliders,
  faUserGear,
  faPersonChalkboard,
  faInbox,
  faArrowCircleDown,
  faFileAlt
} from "@fortawesome/free-solid-svg-icons";

// React Icons
import { FaListUl } from "react-icons/fa";
import { BsHouseAddFill, BsList } from "react-icons/bs";
import { FcFactory, FcInvite, FcBusinessman, FcPortraitMode, FcImport, FcWorkflow } from "react-icons/fc";
import { HiViewGridAdd } from "react-icons/hi";
import { AiFillFileAdd, AiFillSetting } from "react-icons/ai";
import { BiSolidAddToQueue } from "react-icons/bi";
import { MdOutlineQrCodeScanner } from "react-icons/md";

import { useNavigate, useLocation } from "react-router-dom";

const iconsize = 18; // or whatever size fits your design

const DepartmentLevelSidebar = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarHandler = ({ key }) => {
    navigate(key);
  };

  return (
    <Menu mode="inline" theme="dark" selectedKeys={[location.pathname]} onClick={sidebarHandler}>
      {/* Root Access Items */}
      {auth.department === "root" && (
        <>
          <Menu.Item key="/dashboard/labs" icon={<BsHouseAddFill size={iconsize} />}>Add Lab</Menu.Item>
          <Menu.Item key="/dashboard/labs/list" icon={<FcFactory size={iconsize} />}>List Lab</Menu.Item>
          <Menu.Item key="/dashboard/certificate-config/create" icon={<FontAwesomeIcon icon={faCertificate} style={{ color: "#ff4747" }} />}>Create Config</Menu.Item>
          <Menu.Item key="/dashboard/certificate-config" icon={<FontAwesomeIcon icon={faList} style={{ color: "#ff4747" }} />}>List Config</Menu.Item>
        </>
      )}


      {/* Admin / Manager Access */}
      {(auth.department === "admin" || auth.department === "Manager") && (
        <>
          <Menu.Item key="/dashboard/customers/create" icon={<FontAwesomeIcon icon={faSquarePlus} style={{ color: "rebeccapurple" }} />}>Create Customer</Menu.Item>
          <Menu.Item key="/dashboard/customers" icon={<FontAwesomeIcon icon={faBuilding} style={{ color: "rebeccapurple" }} />}>List Customer</Menu.Item>
          <Menu.Item key="/dashboard/uom/create" icon={<HiViewGridAdd size={iconsize} style={{ color: "red" }} />}>UOM</Menu.Item>
          <Menu.Item key="/dashboard/uom" icon={<FaListAlt size={iconsize} style={{ color: "green" }} />}>List UOM</Menu.Item>
          <Menu.Item key="/dashboard/instruments/create" icon={<AiFillFileAdd size={iconsize} style={{ color: "#e3881c" }} />}>Add Instrument</Menu.Item>
          <Menu.Item key="/dashboard/instrument-types/create" icon={<BiSolidAddToQueue size={iconsize} style={{ color: "rebeccapurple" }} />}>Add Instrument Variants</Menu.Item>
          <Menu.Item key="/dashboard/instrument-types" icon={<FaListUl size={iconsize} style={{ color: "#048061" }} />}>List Instrument Variants</Menu.Item>
          <Menu.Item key="/dashboard/uncertainty/create" icon={<FontAwesomeIcon icon={faSquarePlus} style={{ color: "#0039e8" }} />}>Add Uncertainty Parameter</Menu.Item>
          <Menu.Item key="/dashboard/uncertainty" icon={<FaListAlt size={iconsize} style={{ color: "#0039e8" }} />}>List Uncertainty Parameter</Menu.Item>
          <Menu.Item key="/dashboard/ulr/add" icon={<FontAwesomeIcon icon={faSquarePlus} style={{ color: "rgb(51 180 255)" }} />}>ULR Setup</Menu.Item>
          <Menu.Item key="/dashboard/ulr" icon={<BsList size={iconsize} style={{ color: "rgb(51 180 255)" }} />}>List ULR</Menu.Item>
          <Menu.Item key="/dashboard/standard-details" icon={<FontAwesomeIcon icon={faSliders} style={{ color: "rebeccapurple" }} />}>Standard Details</Menu.Item>
          <Menu.Item key="/dashboard/masters" icon={<FontAwesomeIcon icon={faList} style={{ color: "rebeccapurple" }} />}>List Master</Menu.Item>
          <Menu.Item key="/dashboard/calibration-due" icon={<FaListAlt size={iconsize} style={{ color: "#5AB2FF" }} />}>Due date</Menu.Item>
          <Menu.Item key="/dashboard/bank-config/add" icon={<BiSolidAddToQueue size={iconsize} style={{ color: "blue" }} />}>Add Bank Config</Menu.Item>
          <Menu.Item key="/dashboard/bank-config" icon={<BiSolidAddToQueue size={iconsize} style={{ color: "blue" }} />}>List Bank Config</Menu.Item>
          <Menu.Item key="/dashboard/quotation-config/create" icon={<AiFillSetting size={iconsize} style={{ color: "#5AB2FF" }} />}>Add Quotation Config</Menu.Item>
          <Menu.Item key="/dashboard/quotation-config" icon={<BiSolidAddToQueue size={iconsize} style={{ color: "#5AB2FF" }} />}>List Quotation Config</Menu.Item>
          <Menu.Item key="/dashboard/quotation/create" icon={<FaListAlt size={iconsize} style={{ color: "#5AB2FF" }} />}>Generate Quotation</Menu.Item>
          <Menu.Item key="/dashboard/quotation/customers" icon={<FaListAlt size={iconsize} style={{ color: "#5AB2FF" }} />}>Quotation Customer List</Menu.Item>
          <Menu.Item key="/dashboard/email" icon={<FcInvite size={iconsize} />}>E-Mail</Menu.Item>
        </>
      )}

      {/* Admin Only */}
      {auth.department === "admin" && (
        <>
          <Menu.Item key="/dashboard/users/add" icon={<FcBusinessman size={iconsize} />}>Add User</Menu.Item>
          <Menu.Item key="/dashboard/users" icon={<FcPortraitMode size={iconsize} />}>Users</Menu.Item>
        </>
      )}

      {/* Calibration Department */}
      {auth.department === "Calibration" && (
        <>
          <Menu.Item key="/dashboard/ulr" icon={<BsList size={iconsize} style={{ color: "rgb(51 180 255)" }} />}>List ULR</Menu.Item>
          <Menu.Item key="/dashboard/srf-config" icon={<BsList size={iconsize} />}>List SRF Config</Menu.Item>
          <Menu.Item key="/dashboard/srf" icon={<FcWorkflow size={iconsize} />}>SRFs</Menu.Item>
          <Menu.Item key="/dashboard/scanner" icon={<MdOutlineQrCodeScanner size={iconsize} style={{ color: "rgb(51 180 255)" }} />}>QR Scanner</Menu.Item>
        </>
      )}

      {/* ─── Task Management (NEW) ────────────────────────────────────────── */}
      {(auth.department === "admin" || auth.department === "Manager") && (
        <Menu.Item
          key="/dashboard/tasks/create"
          icon={<MdAssignmentAdd size={iconsize} style={{ color: "#1f3864" }} />}
        >
          Create Task
        </Menu.Item>
      )}

      {/* Task List visible to Admin, Manager, Calibration, and CSD */}
      {(auth.department === "admin" || auth.department === "Manager" || auth.department === "Calibration" || auth.department === "CSD") && (
        <Menu.Item
          key="/dashboard/tasks"
          icon={<FaTasks size={iconsize} style={{ color: "#2e75b6" }} />}
        >
          Task List
        </Menu.Item>
      )}

      {/* Admin, CSD, Manager Shared Items */}
      {(auth.department === "admin" || auth.department === "CSD" || auth.department === "Manager") && (
        <>
          <Menu.Item key="/dashboard/ulr/add" icon={<FontAwesomeIcon icon={faSquarePlus} style={{ color: "rgb(51 180 255)" }} />}>ULR Setup</Menu.Item>
          <Menu.Item key="/dashboard/srf-config/add" icon={<AiFillSetting size={iconsize} />}>Add SRF Config</Menu.Item>
          <Menu.Item key="/dashboard/srf/add" icon={<FcImport size={iconsize} />}>Add SRF</Menu.Item>
          <Menu.Item key="/dashboard/srf" icon={<FcWorkflow size={iconsize} />}>SRFs</Menu.Item>
          <Menu.Item key="/dashboard/inward-reports" icon={<FontAwesomeIcon icon={faFileAlt} style={{ color: "rgb(51 180 255)" }} />}>Inward Report</Menu.Item>
          <Menu.Item key="/dashboard/employees/create" icon={<FontAwesomeIcon icon={faUserGear} style={{ color: "rgb(51 180 255)" }} />}>Create Employee</Menu.Item>
          <Menu.Item key="/dashboard/employees" icon={<FontAwesomeIcon icon={faList} style={{ color: "rgb(51 180 255)" }} />}>List Employee</Menu.Item>

        </>
      )}


      {/* Account Department */}

      {auth.department === "Accounts" && (
        <>
          <Menu.Item key="/dashboard/srf" icon={<FcWorkflow size={iconsize} />}>SRFs</Menu.Item>
          <Menu.Item key="/dashboard/quotation/create" icon={<FaListAlt size={iconsize} style={{ color: "#5AB2FF" }} />}>Generate Quotation</Menu.Item>
        </>


      )}

      {/* Visible to All Except Root */}
      {/* {auth.department !== "root" && (
        <Menu.Item key="SRFs" icon={<FcWorkflow size={iconsize} />}>SRFs</Menu.Item>
      )} */}

      {/* Certificate CMS Items */}
      {(auth.department === "admin" || auth.department === "Manager") && enableCertificateCMS && (
        <>
          <Menu.Item key="/dashboard/procedures/define" icon={<FontAwesomeIcon icon={faPersonChalkboard} style={{ color: "#ff4747" }} />}>Define Procedure</Menu.Item>
          <Menu.Item key="/dashboard/procedures" icon={<FontAwesomeIcon icon={faList} style={{ color: "#ff4747" }} />}>List Defined Procedure</Menu.Item>
          <Menu.Item key="/dashboard/excel/create" icon={<FontAwesomeIcon icon={faPersonChalkboard} style={{ color: "#ff4747" }} />}>Calibmaster Excel</Menu.Item>
          <Menu.Item key="/dashboard/excel" icon={<FontAwesomeIcon icon={faList} style={{ color: "#ff4747" }} />}>List Calibmaster Excel</Menu.Item>
        </>
      )}

    </Menu>

  );
};

export default DepartmentLevelSidebar;
