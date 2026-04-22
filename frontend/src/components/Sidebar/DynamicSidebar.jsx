import React, { useContext } from "react";
import { Menu } from "antd";
import { AuthContext } from "../../context/auth-context";
import { usePermissions } from "../../hooks/usePermissions";
import { useNavigate, useLocation } from "react-router-dom";

import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineWrenchScrewdriver,
  HiOutlineDocumentText,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineChartBar,
  HiOutlineQrCode,
  HiOutlineBanknotes,
  HiOutlineBookOpen,
  HiOutlineServerStack,
  HiOutlineArrowsRightLeft,
  HiOutlineTruck,
  HiOutlineBeaker,
  HiOutlineScale,
  HiOutlineShieldCheck,
  HiOutlineUserPlus,
  HiOutlinePlusCircle,
  HiOutlineListBullet,
  HiOutlineWrench,
  HiOutlineTag,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineQueueList,
  HiOutlineInformationCircle,
  HiOutlineTableCells,
  HiOutlineCalendarDays,
  HiOutlineDocumentDuplicate,
  HiOutlineClipboardDocument,
  HiOutlinePencilSquare,
  HiOutlineDocumentChartBar,
  HiOutlineCog,
  HiOutlineBuildingLibrary,
  HiOutlineDocumentPlus,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineBuildingOffice,
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlineCloudArrowUp,
} from "react-icons/hi2";

import "./DynamicSidebar.css";

const DynamicSidebar = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, hasAnyPermission } = usePermissions();

  const sidebarHandler = ({ key }) => {
    navigate(key);
  };

  const iconStyle = { fontSize: '18px' };

  // Compute which submenu groups should be open based on current URL
  const getOpenKeysFromPath = (pathname) => {
    const keys = [];
    if (pathname.startsWith('/dashboard/customers')) keys.push('Customers');
    if (pathname.startsWith('/dashboard/instruments') || pathname.startsWith('/dashboard/make-model') || pathname.startsWith('/dashboard/instrument-types')) {
      keys.push('Instrument');
      if (pathname.startsWith('/dashboard/instrument-types')) keys.push('InstrumentVariants');
    }
    if (pathname.startsWith('/dashboard/uom')) keys.push('UOM');
    if (
      pathname.startsWith('/dashboard/standard-details') ||
      pathname.startsWith('/dashboard/masters') ||
      pathname.startsWith('/dashboard/calibration-due') ||
      pathname.startsWith('/dashboard/master-doc')
    ) {
      keys.push('Master');
      if (pathname.startsWith('/dashboard/master-doc')) keys.push('MasterDocs');
    }
    if (pathname.startsWith('/dashboard/procedures') || pathname.startsWith('/dashboard/excel')) {
      keys.push('Procedure');
      if (pathname.startsWith('/dashboard/excel')) keys.push('CalibmasterExcel');
    }
    if (pathname.startsWith('/dashboard/ulr')) keys.push('ULR');
    if (pathname.startsWith('/dashboard/srf') || pathname.startsWith('/dashboard/scanner')) keys.push('SRF');
    if (
      pathname.startsWith('/dashboard/bank-config') ||
      pathname.startsWith('/dashboard/quotation-config') ||
      pathname.startsWith('/dashboard/quotation')
    ) keys.push('Quotation');
    if (
      pathname.startsWith('/dashboard/users') ||
      pathname.startsWith('/dashboard/roles') ||
      pathname.startsWith('/dashboard/user-track')
    ) keys.push('Users');
    if (
      pathname.startsWith('/dashboard/tasks')
    ) keys.push('TaskManagement');
    if (
      pathname.startsWith('/dashboard/email') ||
      pathname.startsWith('/dashboard/sync') ||
      pathname.startsWith('/dashboard/labs') ||
      pathname.startsWith('/dashboard/reset-password') ||
      pathname.startsWith('/dashboard/certificate') ||
      pathname.startsWith('/dashboard/data-storage')
    ) keys.push('Config');
    return keys;
  };

  const [openKeys, setOpenKeys] = React.useState(() => getOpenKeysFromPath(location.pathname));

  // Update open keys when navigating to a new route
  React.useEffect(() => {
    setOpenKeys(getOpenKeysFromPath(location.pathname));
  }, [location.pathname]);

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <Menu
      mode="inline"
      theme="dark"
      selectedKeys={[location.pathname]}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      onClick={sidebarHandler}
    >

      {/* 1. Dashboard */}
      {hasPermission("ACCESS_DASHBOARD") && (
        <Menu.Item key="/dashboard" icon={<HiOutlineSquares2X2 style={iconStyle} />}>
          Dashboard
        </Menu.Item>
      )}

      {/* 2. Customer */}
      {hasAnyPermission(["CREATE_CUSTOMER", "LIST_CUSTOMER"]) && (
        <Menu.SubMenu key="Customers" title="Customers" icon={<HiOutlineUserGroup style={iconStyle} />}>
          {hasPermission("CREATE_CUSTOMER") && <Menu.Item key="/dashboard/customers/create" icon={<HiOutlineUserPlus style={iconStyle} />}>Create Customer</Menu.Item>}
          {hasPermission("LIST_CUSTOMER") && <Menu.Item key="/dashboard/customers" icon={<HiOutlineUsers style={iconStyle} />}>List Customer</Menu.Item>}
        </Menu.SubMenu>
      )}

      {/* 3. UOM */}
      {hasAnyPermission(["CREATE_UOM", "LIST_UOM"]) && (
        <Menu.SubMenu key="UOM" title="UOM" icon={<HiOutlineScale style={iconStyle} />}>
          {hasPermission("CREATE_UOM") && <Menu.Item key="/dashboard/uom/create" icon={<HiOutlinePlusCircle style={iconStyle} />}>Create UOM</Menu.Item>}
          {hasPermission("LIST_UOM") && <Menu.Item key="/dashboard/uom" icon={<HiOutlineListBullet style={iconStyle} />}>List UOM</Menu.Item>}
        </Menu.SubMenu>
      )}

      {/* 4. Instruments */}
      {hasAnyPermission(["CREATE_INSTRUMENT", "LIST_INSTRUMENT", "ACCESS_MAKE_MODEL", "CREATE_INSTRUMENT_VARIANT", "LIST_INSTRUMENT_VARIANT"]) && (
        <Menu.SubMenu key="Instrument" title="Instruments" icon={<HiOutlineWrenchScrewdriver style={iconStyle} />}>
          {hasPermission("CREATE_INSTRUMENT") && <Menu.Item key="/dashboard/instruments/create" icon={<HiOutlinePlusCircle style={iconStyle} />}>Add Instrument</Menu.Item>}
          {hasPermission("LIST_INSTRUMENT") && <Menu.Item key="/dashboard/instruments" icon={<HiOutlineWrench style={iconStyle} />}>List Instrument</Menu.Item>}
          {hasPermission("ACCESS_MAKE_MODEL") && <Menu.Item key="/dashboard/make-model" icon={<HiOutlineTag style={iconStyle} />}>Make &amp; Model</Menu.Item>}
          {/* Variants SubMenu */}
          {hasAnyPermission(["CREATE_INSTRUMENT_VARIANT", "LIST_INSTRUMENT_VARIANT"]) && (
            <Menu.SubMenu key="InstrumentVariants" title="Variants" icon={<HiOutlineAdjustmentsHorizontal style={iconStyle} />}>
              {hasPermission("CREATE_INSTRUMENT_VARIANT") && <Menu.Item key="/dashboard/instrument-types/create" icon={<HiOutlinePlusCircle style={iconStyle} />}>Add Variants</Menu.Item>}
              {hasPermission("LIST_INSTRUMENT_VARIANT") && <Menu.Item key="/dashboard/instrument-types" icon={<HiOutlineQueueList style={iconStyle} />}>List Variants</Menu.Item>}
            </Menu.SubMenu>
          )}
        </Menu.SubMenu>
      )}



      {/* 5. Master Data */}
      {hasAnyPermission(["CREATE_MASTER", "LIST_MASTER", "ACCESS_DUE_DATE", "LIST_MASTER_DOC", "CREATE_MASTER_DOC", "LIST_DOC_DETAIL", "CREATE_DOC_DETAIL", "LIST_DOC_FORMAT", "CREATE_DOC_FORMAT"]) && (
        <Menu.SubMenu key="Master" title="Master Data" icon={<HiOutlineServerStack style={iconStyle} />}>
          {hasPermission("CREATE_MASTER") && <Menu.Item key="/dashboard/standard-details" icon={<HiOutlineInformationCircle style={iconStyle} />}>Standard Details</Menu.Item>}
          {hasPermission("LIST_MASTER") && <Menu.Item key="/dashboard/masters" icon={<HiOutlineTableCells style={iconStyle} />}>List Master</Menu.Item>}
          {hasPermission("ACCESS_DUE_DATE") && <Menu.Item key="/dashboard/calibration-due" icon={<HiOutlineCalendarDays style={iconStyle} />}>Due Dates</Menu.Item>}
          {/* Master List Docs SubMenu */}
          {hasAnyPermission(["LIST_MASTER_DOC", "CREATE_MASTER_DOC", "LIST_DOC_DETAIL", "CREATE_DOC_DETAIL", "LIST_DOC_FORMAT", "CREATE_DOC_FORMAT"]) && (
            <Menu.SubMenu key="MasterDocs" title="Master Docs" icon={<HiOutlineDocumentDuplicate style={iconStyle} />}>
              {hasPermission("CREATE_MASTER_DOC") && <Menu.Item key="/dashboard/master-doc/add" icon={<HiOutlinePlusCircle style={iconStyle} />}>Create Doc List</Menu.Item>}
              {hasPermission("LIST_MASTER_DOC") && <Menu.Item key="/dashboard/master-doc" icon={<HiOutlineClipboardDocument style={iconStyle} />}>Doc List</Menu.Item>}
              {hasPermission("CREATE_DOC_DETAIL") && <Menu.Item key="/dashboard/master-doc-detail/add" icon={<HiOutlinePlusCircle style={iconStyle} />}>Create DocDetail</Menu.Item>}
              {hasPermission("LIST_DOC_DETAIL") && <Menu.Item key="/dashboard/master-doc-detail" icon={<HiOutlineListBullet style={iconStyle} />}>DocDetail List</Menu.Item>}
              {hasPermission("CREATE_DOC_FORMAT") && <Menu.Item key="/dashboard/master-doc-format/add" icon={<HiOutlinePlusCircle style={iconStyle} />}>Create DocFormat</Menu.Item>}
              {hasPermission("LIST_DOC_FORMAT") && <Menu.Item key="/dashboard/master-doc-format" icon={<HiOutlineDocumentText style={iconStyle} />}>DocFormat List</Menu.Item>}
            </Menu.SubMenu>
          )}
        </Menu.SubMenu>
      )}

      {/* 6. Procedures */}
      {hasAnyPermission(["LIST_PROCEDURE", "CREATE_PROCEDURE", "LIST_EXCEL", "CREATE_EXCEL"]) && (
        <Menu.SubMenu key="Procedure" title="Procedures" icon={<HiOutlineBookOpen style={iconStyle} />}>
          {hasPermission("CREATE_PROCEDURE") && <Menu.Item key="/dashboard/procedures/define" icon={<HiOutlinePencilSquare style={iconStyle} />}>Define Procedure</Menu.Item>}
          {hasPermission("LIST_PROCEDURE") && <Menu.Item key="/dashboard/procedures" icon={<HiOutlineListBullet style={iconStyle} />}>List Procedures</Menu.Item>}
          {/* Calibmaster Excel SubMenu */}
          {hasAnyPermission(["LIST_EXCEL", "CREATE_EXCEL"]) && (
            <Menu.SubMenu key="CalibmasterExcel" title="Calibmaster Excel" icon={<HiOutlineDocumentChartBar style={iconStyle} />}>
              {hasPermission("CREATE_EXCEL") && <Menu.Item key="/dashboard/excel/create" icon={<HiOutlinePlusCircle style={iconStyle} />}>Calibmaster Excel</Menu.Item>}
              {hasPermission("LIST_EXCEL") && <Menu.Item key="/dashboard/excel" icon={<HiOutlineListBullet style={iconStyle} />}>Excel List</Menu.Item>}
            </Menu.SubMenu>
          )}
        </Menu.SubMenu>
      )}

      {/* 7. ULR Setup */}
      {hasAnyPermission(["CREATE_ULR", "LIST_ULR"]) && (
        <Menu.SubMenu key="ULR" title="ULR Setup" icon={<HiOutlineArrowsRightLeft style={iconStyle} />}>
          {hasPermission("CREATE_ULR") && <Menu.Item key="/dashboard/ulr/add" icon={<HiOutlinePlusCircle style={iconStyle} />}>Create ULR</Menu.Item>}
          {hasPermission("LIST_ULR") && <Menu.Item key="/dashboard/ulr" icon={<HiOutlineListBullet style={iconStyle} />}>List ULR</Menu.Item>}
        </Menu.SubMenu>
      )}

      {/* 8. SRF Operations */}
      {hasAnyPermission(["CREATE_SRF_CONFIG", "LIST_SRF_CONFIG", "CREATE_SRF", "LIST_SRF", "ACCESS_SCANNER"]) && (
        <Menu.SubMenu key="SRF" title="SRF Operations" icon={<HiOutlineTruck style={iconStyle} />}>
          {hasPermission("CREATE_SRF_CONFIG") && <Menu.Item key="/dashboard/srf-config/add" icon={<HiOutlinePlusCircle style={iconStyle} />}>Add SRF Config</Menu.Item>}
          {hasPermission("LIST_SRF_CONFIG") && <Menu.Item key="/dashboard/srf-config" icon={<HiOutlineCog style={iconStyle} />}>List SRF Config</Menu.Item>}
          {hasPermission("CREATE_SRF") && <Menu.Item key="/dashboard/srf/add" icon={<HiOutlinePlusCircle style={iconStyle} />}>Add SRF</Menu.Item>}
          {hasPermission("LIST_SRF") && <Menu.Item key="/dashboard/srf" icon={<HiOutlineListBullet style={iconStyle} />}>SRFs List</Menu.Item>}
          {hasPermission("ACCESS_SCANNER") && <Menu.Item key="/dashboard/scanner" icon={<HiOutlineQrCode style={iconStyle} />}>QR Scanner</Menu.Item>}
        </Menu.SubMenu>
      )}

      {/* 9. Reports */}
      {hasPermission("ACCESS_REPORTS") && (
        <Menu.Item key="/dashboard/inward-reports" icon={<HiOutlineChartBar style={iconStyle} />}>
          Inward Reports
        </Menu.Item>
      )}

      {/* 10. Quotations (includes Bank Config) */}
      {hasAnyPermission(["ACCESS_BANK_CONFIG", "ACCESS_QUOTATION_CONFIG", "CREATE_QUOTATION", "LIST_QUOTATION"]) && (
        <Menu.SubMenu key="Quotation" title="Quotations" icon={<HiOutlineBanknotes style={iconStyle} />}>
          {hasPermission("ACCESS_BANK_CONFIG") && <Menu.Item key="/dashboard/bank-config/add" icon={<HiOutlinePlusCircle style={iconStyle} />}>Add Bank Config</Menu.Item>}
          {hasPermission("ACCESS_BANK_CONFIG") && <Menu.Item key="/dashboard/bank-config" icon={<HiOutlineBuildingLibrary style={iconStyle} />}>List Bank Config</Menu.Item>}
          {hasPermission("ACCESS_QUOTATION_CONFIG") && <Menu.Item key="/dashboard/quotation-config/create" icon={<HiOutlinePlusCircle style={iconStyle} />}>Add Config</Menu.Item>}
          {hasPermission("ACCESS_QUOTATION_CONFIG") && <Menu.Item key="/dashboard/quotation-config" icon={<HiOutlineCog style={iconStyle} />}>List Config</Menu.Item>}
          {hasPermission("CREATE_QUOTATION") && <Menu.Item key="/dashboard/quotation/create" icon={<HiOutlineDocumentPlus style={iconStyle} />}>Generate Quotation</Menu.Item>}
          {hasPermission("LIST_QUOTATION") && <Menu.Item key="/dashboard/quotation/customers" icon={<HiOutlineUsers style={iconStyle} />}>Customer List</Menu.Item>}
        </Menu.SubMenu>
      )}

      {/* 11. Access Control */}
      {hasAnyPermission(["CREATE_USER", "LIST_USER", "ACCESS_ROLES", "ACCESS_USER_TRACK"]) && (
        <Menu.SubMenu key="Users" title="Access Control" icon={<HiOutlineShieldCheck style={iconStyle} />}>
          {hasPermission("CREATE_USER") && <Menu.Item key="/dashboard/users/add" icon={<HiOutlineUserPlus style={iconStyle} />}>Add User</Menu.Item>}
          {hasPermission("LIST_USER") && <Menu.Item key="/dashboard/users" icon={<HiOutlineUsers style={iconStyle} />}>Users List</Menu.Item>}
          {hasPermission("ACCESS_ROLES") && <Menu.Item key="/dashboard/roles" icon={<HiOutlineShieldCheck style={iconStyle} />}>Roles &amp; Permissions</Menu.Item>}
          {hasPermission("ACCESS_USER_TRACK") && <Menu.Item key="/dashboard/user-track" icon={<HiOutlineClock style={iconStyle} />}>User Activity</Menu.Item>}
        </Menu.SubMenu>
      )}

      {/* 11.5 Task Management */}
      {hasAnyPermission(["ACCESS_TASKS"]) && (
        <Menu.SubMenu key="TaskManagement" title="Task Management" icon={<HiOutlineClipboardDocumentList style={iconStyle} />}>
          {hasPermission("ACCESS_TASKS") && <Menu.Item key="/dashboard/tasks/create" icon={<HiOutlinePlusCircle style={iconStyle} />}>Create Task</Menu.Item>}
          {hasPermission("ACCESS_TASKS") && <Menu.Item key="/dashboard/tasks" icon={<HiOutlineQueueList style={iconStyle} />}>List Tasks</Menu.Item>}
        </Menu.SubMenu>
      )}

      {/* 12. Configuration */}
      {hasAnyPermission(["ACCESS_EMAIL", "SYNC_DATA", "ACCESS_LAB_INFO", "ACCESS_CERTIFICATE_CONFIG", "ACCESS_CERTIFICATE_FORMAT", "ACCESS_DATA_STORAGE", "MANAGE_LABS"]) && (
        <Menu.SubMenu key="Config" title="Configuration" icon={<HiOutlineCog6Tooth style={iconStyle} />}>
          {hasPermission("ACCESS_EMAIL") && <Menu.Item key="/dashboard/email" icon={<HiOutlineEnvelope style={iconStyle} />}>Email Setup</Menu.Item>}
          {hasPermission("SYNC_DATA") && <Menu.Item key="/dashboard/sync" icon={<HiOutlineArrowsRightLeft style={iconStyle} />}>Sync Data</Menu.Item>}
          {hasPermission("ACCESS_LAB_INFO") && <Menu.Item key="/dashboard/labs/edit" icon={<HiOutlineBuildingOffice style={iconStyle} />}>Lab Info</Menu.Item>}
          <Menu.Item key="/dashboard/reset-password" icon={<HiOutlineUser style={iconStyle} />}>Admin Info</Menu.Item>
          {hasPermission("ACCESS_CERTIFICATE_CONFIG") && <Menu.Item key="/dashboard/certificate-config/create" icon={<HiOutlineAcademicCap style={iconStyle} />}>Cert Config</Menu.Item>}
          {hasPermission("ACCESS_CERTIFICATE_FORMAT") && <Menu.Item key="/dashboard/certificate-format" icon={<HiOutlineDocumentText style={iconStyle} />}>Cert Format</Menu.Item>}
          {hasPermission("ACCESS_DATA_STORAGE") && <Menu.Item key="/dashboard/data-storage" icon={<HiOutlineCloudArrowUp style={iconStyle} />}>Data Storage</Menu.Item>}
          {hasPermission("MANAGE_LABS") && <Menu.Item key="/dashboard/labs" icon={<HiOutlinePlusCircle style={iconStyle} />}>Add Lab</Menu.Item>}
          {hasPermission("MANAGE_LABS") && <Menu.Item key="/dashboard/labs/list" icon={<HiOutlineListBullet style={iconStyle} />}>List Labs</Menu.Item>}
        </Menu.SubMenu>
      )}

    </Menu>
  );
};

export default DynamicSidebar;
