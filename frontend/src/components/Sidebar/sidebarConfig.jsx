// sidebarConfig.jsx
import {

    BsHouseAddFill,
    BsPeopleFill,
    BsBoxSeam,
    BsGearFill,
    BsClipboardData,
    BsFileEarmarkText,
    BsBank2,
    BsQrCodeScan,
    BsEnvelopeFill
} from "react-icons/bs";
import { FaCalendarCheck, FaFileExcel } from "react-icons/fa";


const rawSidebar = [

    // ================= LABS =================
    { key: "/dashboard/labs", group: "Labs", type: "create", permission: "MANAGE_LABS" },
    { key: "/dashboard/labs/list", group: "Labs", type: "list", permission: "MANAGE_LABS" },
    { key: "/dashboard/labs/edit", group: "Labs", type: "edit", permission: "ACCESS_LAB_INFO" },

    // ================= CUSTOMER =================
    { key: "/dashboard/customers/create", group: "Customer", type: "create", permission: "CREATE_CUSTOMER" },
    { key: "/dashboard/customers", group: "Customer", type: "list", permission: "LIST_CUSTOMER" },
    { key: "/dashboard/customers/edit", group: "Customer", type: "edit", permission: "CREATE_CUSTOMER" },

    // ================= USERS =================
    { key: "/dashboard/users/add", group: "Users", type: "create", permission: "ACCESS_USERS" },
    { key: "/dashboard/users", group: "Users", type: "list", permission: "ACCESS_USERS" },
    { key: "/dashboard/roles", group: "Users", type: "list", permission: "ACCESS_ROLES" },
    { key: "/dashboard/user-track", group: "Users", type: "list", permission: "ACCESS_USER_TRACK" },
    { key: "/dashboard/reset-password", group: "Users", type: "create", roles: ["admin"] },

    // ================= UOM =================
    { key: "/dashboard/uom/create", group: "UOM", type: "create", permission: "CREATE_UOM" },
    { key: "/dashboard/uom", group: "UOM", type: "list", permission: "LIST_UOM" },
    { key: "/dashboard/uom/edit", group: "UOM", type: "edit", permission: "EDIT_UOM" },

    // ================= MAKE MODEL =================
    { key: "/dashboard/make-model", group: "MakeModel", type: "create", permission: "ACCESS_MAKE_MODEL" },


    // ================= INSTRUMENT =================
    { key: "/dashboard/instruments/create", group: "Instrument", type: "create", permission: "CREATE_INSTRUMENT" },
    { key: "/dashboard/instruments", group: "Instrument", type: "list", permission: "LIST_INSTRUMENT" },
    { key: "/dashboard/instruments/edit", group: "Instrument", type: "edit", permission: "EDIT_INSTRUMENT" },

    // ================= INSTRUMENT TYPE =================
    { key: "/dashboard/instrument-types/create", group: "InstrumentType", type: "create", permission: "CREATE_INSTRUMENT_VARIANT" },
    { key: "/dashboard/instrument-types", group: "InstrumentType", type: "list", permission: "LIST_INSTRUMENT_VARIANT" },
    { key: "/dashboard/instrument-types/edit", group: "InstrumentType", type: "edit", permission: "CREATE_INSTRUMENT_VARIANT" },


    // ================= MASTER =================
    { key: "/dashboard/standard-details", group: "Master", type: "create", permission: "CREATE_MASTER" },
    { key: "/dashboard/masters", group: "Master", type: "list", permission: "LIST_MASTER" },

    { key: "/dashboard/master-doc/add", group: "MasterDocuments", type: "create", permission: "CREATE_MASTER_DOC" },
    { key: "/dashboard/master-doc", group: "MasterDocuments", type: "list", permission: "LIST_MASTER_DOC" },
    { key: "/dashboard/master-doc-detail/add", group: "MasterDocDetails", type: "create", permission: "CREATE_DOC_DETAIL" },
    { key: "/dashboard/master-doc-detail", group: "MasterDocDetails", type: "list", permission: "LIST_DOC_DETAIL" },
    { key: "/dashboard/master-doc-format/add", group: "MasterDocFormat", type: "create", permission: "CREATE_DOC_FORMAT" },
    { key: "/dashboard/master-doc-format", group: "MasterDocFormat", type: "list", permission: "LIST_DOC_FORMAT" },

    // ================= PROCEDURE =================
    { key: "/dashboard/procedures/define", group: "Procedure", type: "create", permission: "CREATE_PROCEDURE" },
    { key: "/dashboard/procedures", group: "Procedure", type: "list", permission: "LIST_PROCEDURE" },


    // ================= CALIBMASTER EXCEL =================
    { key: "/dashboard/excel/create", group: "CalibmasterExcel", type: "create", permission: "CREATE_EXCEL" },
    { key: "/dashboard/excel", group: "CalibmasterExcel", type: "list", permission: "LIST_EXCEL" },

    // ================= UNCERTAINTY =================
    // { key: "Create-Uncertainty-Parameter", group: "Uncertainty", type: "create", roles: ["admin", "Manager"] },
    // { key: "List-Uncertainty-Parameter", group: "Uncertainty", type: "list", roles: ["admin", "Manager"] },


    // ================= ULR =================
    { key: "/dashboard/ulr/add", group: "ULR", type: "create", permission: "CREATE_ULR" },
    { key: "/dashboard/ulr", group: "ULR", type: "list", permission: "LIST_ULR" },

    // // ================= SRF CONFIG =================
    // { key: "Add-SRF-Config", group: "SRFConfig", type: "create", roles: ["admin", "Manager", "CSD"] },
    // { key: "List-SRF-Config", group: "SRFConfig", type: "list", roles: ["admin", "Manager", "Calibration"] },

    // ================= SRF =================
    { key: "/dashboard/srf/add", group: "SRF", type: "create", permission: "CREATE_SRF" },
    { key: "/dashboard/srf", group: "SRF", type: "list", permission: "LIST_SRF" },



    // ================= CERTIFICATE =================
    { key: "/dashboard/certificate-config/create", group: "Certificate Config", type: "create", permission: "ACCESS_CERTIFICATE_CONFIG" },
    { key: "/dashboard/certificate-config", group: "Certificate Config", type: "list", permission: "ACCESS_CERTIFICATE_CONFIG" },
    { key: "/dashboard/certificate-format", group: "Certificate", type: "create", permission: "ACCESS_CERTIFICATE_FORMAT" },




    // ================= REPORTS =================
    { key: "/dashboard/inward-reports", group: "Reports", type: "create", permission: "ACCESS_REPORTS" },


    // ================= DUEDATE =================
    { key: "/dashboard/calibration-due", group: "DueDate", type: "list", permission: "ACCESS_DUE_DATE" },

    // ================= BANK CONFIG =================
    { key: "/dashboard/bank-config/add", group: "BankConfig", type: "create", permission: "ACCESS_BANK_CONFIG" },
    { key: "/dashboard/bank-config", group: "BankConfig", type: "list", permission: "ACCESS_BANK_CONFIG" },

    // ================= QUOTATION =================
    { key: "/dashboard/quotation-config/create", group: "Quotation", type: "create", permission: "ACCESS_QUOTATION_CONFIG" },
    { key: "/dashboard/quotation-config", group: "Quotation", type: "list", permission: "ACCESS_QUOTATION_CONFIG" },
    { key: "/dashboard/quotation/create", group: "Quotation", type: "create", permission: "CREATE_QUOTATION" },
    { key: "/dashboard/quotation/customers", group: "Quotation", type: "list", permission: "LIST_QUOTATION" },

    // ================= EMAIL =================
    { key: "/dashboard/email", group: "Communication", type: "create", permission: "ACCESS_EMAIL" },
    
    // ================= OTHER =================

    { key: "/dashboard/data-storage", group: "Utilities", type: "create", permission: "ACCESS_DATA_STORAGE" },
    { key: "/dashboard/sync", group: "Utilities", type: "create", permission: "SYNC_DATA" },

    // ================= TASK MANAGEMENT =================
    { key: "/dashboard/tasks/create", group: "TaskManagement", type: "create", permission: "ACCESS_TASKS" },
    { key: "/dashboard/tasks", group: "TaskManagement", type: "list", permission: "ACCESS_TASKS" },

    { key: "/dashboard/scanner", group: "QR Scanner", type: "create", permission: "ACCESS_SCANNER" },



];

const groupIcons = {
    Labs: BsHouseAddFill,
    Customer: BsPeopleFill,
    Users: BsPeopleFill,
    UOM: BsBoxSeam,
    MakeModel: BsGearFill,
    Instrument: BsBoxSeam,
    InstrumentType: BsBoxSeam,
    Uncertainty: BsClipboardData,
    SRFConfig: BsClipboardData,
    ULR: BsClipboardData,
    SRF: BsClipboardData,
    Standard: BsFileEarmarkText,
    Master: BsFileEarmarkText,
    MasterDocuments: BsFileEarmarkText,
    MasterDocDetails: BsFileEarmarkText,
    MasterDocFormat: BsFileEarmarkText,
    CertificateConfig: BsFileEarmarkText,
    Certificate: BsFileEarmarkText,
    Procedure: BsFileEarmarkText,
    CalibmasterExcel: FaFileExcel,

    Reports: BsClipboardData,
    DueDate: FaCalendarCheck,
    BankConfig: BsBank2,
    Quotation: BsFileEarmarkText,
    Utilities: BsGearFill,
    QRScanner: BsQrCodeScan,

    Communication: BsEnvelopeFill,
    TaskManagement: BsClipboardData
};


export const sidebarConfig = rawSidebar.map(item => ({
    ...item,
    icon: groupIcons[item.group]
}));

export { rawSidebar };