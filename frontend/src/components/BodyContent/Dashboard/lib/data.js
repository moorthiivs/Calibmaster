import { rawSidebar } from "../../../Sidebar/sidebarConfig";



const getRoles = (link) => {
  const item = rawSidebar.find(r => r.key === link);
  return item ? item.roles : [];
};

export const quickMenuItems = [
  { title: "Labs", icon: "FlaskConical", link: "/dashboard/labs" },
  { title: "Customers", icon: "Users", link: "/dashboard/customers" },
  { title: "Users", icon: "UserPlus", link: "/dashboard/users" },
  { title: "UOM", icon: "Scale", link: "/dashboard/uom" },
  { title: "Make Model", icon: "Settings", link: "/dashboard/make-model" },
  { title: "Instruments", icon: "Box", link: "/dashboard/instruments" },
  { title: "Instrument Types", icon: "Layers", link: "/dashboard/instrument-types" },
  { title: "Standards", icon: "FileBadge", link: "/dashboard/standard-details" },
  { title: "Masters", icon: "FileText", link: "/dashboard/masters" },
  { title: "Master Docs", icon: "FileStack", link: "/dashboard/master-doc" },
  { title: "Master Doc Details", icon: "FileSearch", link: "/dashboard/master-doc-detail" },
  { title: "Master Formats", icon: "LayoutTemplate", link: "/dashboard/master-doc-format" },
  { title: "Procedures", icon: "ClipboardList", link: "/dashboard/procedures" },
  { title: "Excel", icon: "FileSpreadsheet", link: "/dashboard/excel" },
  { title: "ULR", icon: "Hash", link: "/dashboard/ulr" },
  { title: "SRF", icon: "ClipboardCopy", link: "/dashboard/srf" },
  { title: "Certificate Config", icon: "BadgeCheck", link: "/dashboard/certificate-config" },
  { title: "Certificate Format", icon: "FileSignature", link: "/dashboard/certificate-format" },
  { title: "Employees", icon: "UserCog", link: "/dashboard/employees" },
  { title: "Inward Reports", icon: "BarChart", link: "/dashboard/inward-reports" },
  { title: "Calibration Due", icon: "CalendarClock", link: "/dashboard/calibration-due" },
  { title: "Bank Config", icon: "Landmark", link: "/dashboard/bank-config" },
  { title: "Quotation Config", icon: "Settings2", link: "/dashboard/quotation-config" },
  { title: "Quotation", icon: "FileText", link: "/dashboard/quotation/customers" },
  { title: "Email", icon: "Mail", link: "/dashboard/email" },
  { title: "Data Storage", icon: "Database", link: "/dashboard/data-storage" },
  { title: "Sync", icon: "RefreshCw", link: "/dashboard/sync" },
  { title: "Scanner", icon: "ScanLine", link: "/dashboard/scanner" },
].map(item => ({
  ...item,
  role: getRoles(item.link)
}));

export const quickMenuItems1 = [
  { title: "Labs", icon: "FlaskConical", link: "/dashboard/labs" },
  { title: "Lab List", icon: "List", link: "/dashboard/labs/list" },
  { title: "Edit Lab", icon: "Pencil", link: "/dashboard/labs/edit" },

  { title: "Create Customer", icon: "UserPlus", link: "/dashboard/customers/create" },
  { title: "Customers", icon: "Users", link: "/dashboard/customers" },
  { title: "Edit Customer", icon: "UserCog", link: "/dashboard/customers/edit" },

  { title: "Add User", icon: "UserPlus", link: "/dashboard/users/add" },
  { title: "Users", icon: "Users", link: "/dashboard/users" },

  { title: "Reset Password", icon: "KeyRound", link: "/dashboard/reset-password" },

  { title: "Create UOM", icon: "PlusSquare", link: "/dashboard/uom/create" },
  { title: "UOM List", icon: "Scale", link: "/dashboard/uom" },
  { title: "Edit UOM", icon: "Pencil", link: "/dashboard/uom/edit" },

  { title: "Make Model", icon: "Settings", link: "/dashboard/make-model" },

  { title: "Create Instrument", icon: "PlusSquare", link: "/dashboard/instruments/create" },
  { title: "Instruments", icon: "Box", link: "/dashboard/instruments" },
  { title: "Edit Instrument", icon: "Pencil", link: "/dashboard/instruments/edit" },

  { title: "Create Instrument Type", icon: "PlusSquare", link: "/dashboard/instrument-types/create" },
  { title: "Instrument Types", icon: "Layers", link: "/dashboard/instrument-types" },
  { title: "Edit Instrument Type", icon: "Pencil", link: "/dashboard/instrument-types/edit" },

  { title: "Standard Details", icon: "FileBadge", link: "/dashboard/standard-details" },

  { title: "Masters", icon: "FileText", link: "/dashboard/masters" },

  { title: "Add Master Doc", icon: "PlusSquare", link: "/dashboard/master-doc/add" },
  { title: "Master Docs", icon: "FileStack", link: "/dashboard/master-doc" },

  { title: "Add Master Doc Detail", icon: "PlusSquare", link: "/dashboard/master-doc-detail/add" },
  { title: "Master Doc Detail", icon: "FileSearch", link: "/dashboard/master-doc-detail" },

  { title: "Add Master Doc Format", icon: "PlusSquare", link: "/dashboard/master-doc-format/add" },
  { title: "Master Doc Format", icon: "LayoutTemplate", link: "/dashboard/master-doc-format" },

  { title: "Define Procedure", icon: "ClipboardEdit", link: "/dashboard/procedures/define" },
  { title: "Procedures", icon: "ClipboardList", link: "/dashboard/procedures" },

  { title: "Create Excel", icon: "PlusSquare", link: "/dashboard/excel/create" },
  { title: "Excel List", icon: "FileSpreadsheet", link: "/dashboard/excel" },

  { title: "Add ULR", icon: "PlusSquare", link: "/dashboard/ulr/add" },
  { title: "ULR List", icon: "Hash", link: "/dashboard/ulr" },

  { title: "Add SRF", icon: "PlusSquare", link: "/dashboard/srf/add" },
  { title: "SRF List", icon: "ClipboardCopy", link: "/dashboard/srf" },

  { title: "Create Certificate Config", icon: "PlusSquare", link: "/dashboard/certificate-config/create" },
  { title: "Certificate Config", icon: "BadgeCheck", link: "/dashboard/certificate-config" },

  { title: "Certificate Format", icon: "FileSignature", link: "/dashboard/certificate-format" },

  { title: "Create Employee", icon: "UserPlus", link: "/dashboard/employees/create" },
  { title: "Employees", icon: "UserCog", link: "/dashboard/employees" },

  { title: "Inward Reports", icon: "BarChart", link: "/dashboard/inward-reports" },
  { title: "Calibration Due", icon: "CalendarClock", link: "/dashboard/calibration-due" },

  { title: "Add Bank Config", icon: "PlusSquare", link: "/dashboard/bank-config/add" },
  { title: "Bank Config", icon: "Landmark", link: "/dashboard/bank-config" },

  { title: "Create Quotation Config", icon: "PlusSquare", link: "/dashboard/quotation-config/create" },
  { title: "Quotation Config", icon: "Settings2", link: "/dashboard/quotation-config" },

  { title: "Create Quotation", icon: "FilePlus", link: "/dashboard/quotation/create" },
  { title: "Quotation Customers", icon: "FileText", link: "/dashboard/quotation/customers" },

  { title: "Email", icon: "Mail", link: "/dashboard/email" },

  { title: "Data Storage", icon: "Database", link: "/dashboard/data-storage" },

  { title: "Sync", icon: "RefreshCw", link: "/dashboard/sync" },

  { title: "Scanner", icon: "ScanLine", link: "/dashboard/scanner" },
];