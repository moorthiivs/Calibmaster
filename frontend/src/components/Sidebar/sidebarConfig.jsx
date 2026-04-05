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
    { key: "/dashboard/labs", group: "Labs", type: "create", roles: ["root"] },
    { key: "/dashboard/labs/list", group: "Labs", type: "list", roles: ["root"] },
    { key: "/dashboard/labs/edit", group: "Labs", type: "edit", roles: ["root"] },

    // ================= CUSTOMER =================
    { key: "/dashboard/customers/create", group: "Customer", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/customers", group: "Customer", type: "list", roles: ["admin", "Manager"] },
    { key: "/dashboard/customers/edit", group: "Customer", type: "edit", roles: ["admin", "Manager"] },

    // ================= USERS =================
    { key: "/dashboard/users/add", group: "Users", type: "create", roles: ["admin"] },
    { key: "/dashboard/users", group: "Users", type: "list", roles: ["admin"] },
    { key: "/dashboard/reset-password", group: "Users", type: "create", roles: ["admin"] },

    // ================= UOM =================
    { key: "/dashboard/uom/create", group: "UOM", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/uom", group: "UOM", type: "list", roles: ["admin", "Manager"] },
    { key: "/dashboard/uom/edit", group: "UOM", type: "edit", roles: ["admin", "Manager"] },

    // ================= MAKE MODEL =================
    { key: "/dashboard/make-model", group: "MakeModel", type: "create", roles: ["admin", "Manager"] },


    // ================= INSTRUMENT =================
    { key: "/dashboard/instruments/create", group: "Instrument", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/instruments", group: "Instrument", type: "list", roles: ["admin", "Manager"] },
    { key: "/dashboard/instruments/edit", group: "Instrument", type: "edit", roles: ["admin", "Manager"] },

    // ================= INSTRUMENT TYPE =================
    { key: "/dashboard/instrument-types/create", group: "InstrumentType", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/instrument-types", group: "InstrumentType", type: "list", roles: ["admin", "Manager"] },
    { key: "/dashboard/instrument-types/edit", group: "InstrumentType", type: "edit", roles: ["admin", "Manager"] },


    // ================= MASTER =================
    { key: "/dashboard/standard-details", group: "Master", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/masters", group: "Master", type: "list", roles: ["admin", "Manager"] },

    { key: "/dashboard/master-doc/add", group: "MasterDocuments", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/master-doc", group: "MasterDocuments", type: "list", roles: ["admin", "Manager"] },
    { key: "/dashboard/master-doc-detail/add", group: "MasterDocDetails", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/master-doc-detail", group: "MasterDocDetails", type: "list", roles: ["admin", "Manager"] },
    { key: "/dashboard/master-doc-format/add", group: "MasterDocFormat", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/master-doc-format", group: "MasterDocFormat", type: "list", roles: ["admin", "Manager"] },

    // ================= PROCEDURE =================
    { key: "/dashboard/procedures/define", group: "Procedure", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/procedures", group: "Procedure", type: "list", roles: ["admin", "Manager"] },


    // ================= CALIBMASTER EXCEL =================
    { key: "/dashboard/excel/create", group: "CalibmasterExcel", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/excel", group: "CalibmasterExcel", type: "list", roles: ["admin", "Manager"] },

    // ================= UNCERTAINTY =================
    // { key: "Create-Uncertainty-Parameter", group: "Uncertainty", type: "create", roles: ["admin", "Manager"] },
    // { key: "List-Uncertainty-Parameter", group: "Uncertainty", type: "list", roles: ["admin", "Manager"] },


    // ================= ULR =================
    { key: "/dashboard/ulr/add", group: "ULR", type: "create", roles: ["admin", "Manager", "CSD"] },
    { key: "/dashboard/ulr", group: "ULR", type: "list", roles: ["admin", "Manager", "Calibration"] },

    // // ================= SRF CONFIG =================
    // { key: "Add-SRF-Config", group: "SRFConfig", type: "create", roles: ["admin", "Manager", "CSD"] },
    // { key: "List-SRF-Config", group: "SRFConfig", type: "list", roles: ["admin", "Manager", "Calibration"] },

    // ================= SRF =================
    { key: "/dashboard/srf/add", group: "SRF", type: "create", roles: ["admin", "Manager", "CSD"] },
    { key: "/dashboard/srf", group: "SRF", type: "list", roles: ["admin", "Manager", "CSD", "Calibration", "Accounts"] },



    // ================= CERTIFICATE =================
    { key: "/dashboard/certificate-config/create", group: "Certificate Config", type: "create", roles: ["root"] },
    { key: "/dashboard/certificate-config", group: "Certificate Config", type: "list", roles: ["root"] },
    { key: "/dashboard/certificate-format", group: "Certificate", type: "create", roles: ["root"] },


    // ================= EMPLOYEE =================
    { key: "/dashboard/employees/create", group: "Employee", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/employees", group: "Employee", type: "list", roles: ["admin", "Manager"] },

    // ================= REPORTS =================
    { key: "/dashboard/inward-reports", group: "Reports", type: "create", roles: ["admin", "Manager", "CSD"] },


    // ================= DUEDATE =================
    { key: "/dashboard/calibration-due", group: "DueDate", type: "list", roles: ["admin", "Manager"] },

    // ================= BANK CONFIG =================
    { key: "/dashboard/bank-config/add", group: "BankConfig", type: "create", roles: ["admin", "Manager"] },
    { key: "/dashboard/bank-config", group: "BankConfig", type: "list", roles: ["admin", "Manager"] },

    // ================= QUOTATION =================
    { key: "/dashboard/quotation-config/create", group: "Quotation", type: "create", roles: ["admin"] },
    { key: "/dashboard/quotation-config", group: "Quotation", type: "list", roles: ["admin"] },
    { key: "/dashboard/quotation/create", group: "Quotation", type: "create", roles: ["admin", "Accounts"] },
    { key: "/dashboard/quotation/customers", group: "Quotation", type: "list", roles: ["admin"] },

    // ================= EMAIL =================
    { key: "/dashboard/email", group: "Communication", type: "create", roles: ["admin", "Manager"] },
    
    // ================= OTHER =================

    { key: "/dashboard/data-storage", group: "Utilities", type: "create", roles: ["admin"] },
    { key: "/dashboard/sync", group: "Utilities", type: "create", roles: ["admin"] },

    { key: "/dashboard/scanner", group: "QR Scanner", type: "create", roles: ["Calibration"] },



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
    Employee: BsPeopleFill,
    Reports: BsClipboardData,
    DueDate: FaCalendarCheck,
    BankConfig: BsBank2,
    Quotation: BsFileEarmarkText,
    Utilities: BsGearFill,
    QRScanner: BsQrCodeScan,

    Communication: BsEnvelopeFill
};


export const sidebarConfig = rawSidebar.map(item => ({
    ...item,
    icon: groupIcons[item.group]
}));

export { rawSidebar };