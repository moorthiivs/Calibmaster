

const PERMISSIONS_GROUPS = {
    // 1. Dashboard
    "Dashboard": ["ACCESS_DASHBOARD"],

    // 2. Customers
    "Customers": [
        "CREATE_CUSTOMER",
        {
            parent: "LIST_CUSTOMER",
            children: ["EDIT_CUSTOMER", "DELETE_CUSTOMER"]
        }
    ],

    // 3. UOM
    "UOM": [
        "CREATE_UOM",
        {
            parent: "LIST_UOM",
            children: ["EDIT_UOM", "DELETE_UOM"]
        }
    ],

    // 4. Instruments
    "Instruments": [
        "CREATE_INSTRUMENT",
        {
            parent: "LIST_INSTRUMENT",
            children: ["EDIT_INSTRUMENT", "DELETE_INSTRUMENT"]
        },
        "ACCESS_MAKE_MODEL",
        "CREATE_INSTRUMENT_VARIANT",
        {
            parent: "LIST_INSTRUMENT_VARIANT",
            children: ["EDIT_INSTRUMENT_VARIANT", "DELETE_INSTRUMENT_VARIANT"]
        }
    ],

    // 5. Master Data
    "Masters": [
        "CREATE_MASTER",
        {
            parent: "LIST_MASTER",
            children: ["EDIT_MASTER", "DELETE_MASTER"]
        },
        // Master Doc List
        "CREATE_MASTER_DOC",
        {
            parent: "LIST_MASTER_DOC",
            children: ["EDIT_MASTER_DOC", "DELETE_MASTER_DOC"]
        },
        // Master Doc Detail
        "CREATE_DOC_DETAIL",
        {
            parent: "LIST_DOC_DETAIL",
            children: ["EDIT_DOC_DETAIL", "DELETE_DOC_DETAIL"]
        },
        // Master Doc Format
        "CREATE_DOC_FORMAT",
        {
            parent: "LIST_DOC_FORMAT",
            children: ["EDIT_DOC_FORMAT", "DELETE_DOC_FORMAT"]
        },
        // External Master
        "CREATE_EXTERNAL_MASTER",
        {
            parent: "LIST_EXTERNAL_MASTER",
            children: ["EDIT_EXTERNAL_MASTER", "DELETE_EXTERNAL_MASTER"]
        },
    ],

    // 6. Procedures
    "Procedures": [
        // Procedures
        "CREATE_PROCEDURE",
        {
            parent: "LIST_PROCEDURE",
            children: ["EDIT_PROCEDURE", "DELETE_PROCEDURE"]
        },
        // Calibmaster Excel
        "CREATE_EXCEL",
        {
            parent: "LIST_EXCEL",
            children: ["EDIT_EXCEL", "DELETE_EXCEL"]
        },
        "VIEW_HIDDEN_SHEETS", // THIS PERMISSION WHILE ENTER RESULT FOR HIDE THE SHEET FROM USER
    ],

    // 6b. Excel Editor Toolbar
    "Excel Editor": [
        "EXCEL_FORMAT_CELLS",       // Alignment, Bold, Font Color, Fill Color
        "EXCEL_MERGE_CELLS",        // Merge / Unmerge cells
        "EXCEL_DECIMAL_PRECISION",  // Increase / Decrease decimal
        "EXCEL_CONDITIONAL_FORMAT", // Conditional formatting rules
        "EXCEL_SAVE",               // Save button
        "EXCEL_PAGE_SETUP",         // Page setup / margins
        "EXCEL_DOWNLOAD",           // Download all sheets as xlsx
        "EXCEL_PRINT_SHEET_SELECT", // Select Calibration / Observation print sheets
        "EXCEL_MANAGE_SHEETS",      // Add, delete, duplicate, rename sheets
        "EXCEL_HIDDEN_SHEETS",      // Select which sheets to hide
        "EXCEL_CELL_LOCK_PERMISSIONS", // Edit read cell permissions
    ],

    // 7. ULR Setup
    "ULR Setup": [
        "CREATE_ULR",
        "LIST_ULR",
    ],

    // 8. SRF Operations
    "SRF Operations": [
        "CREATE_SRF_CONFIG",
        "LIST_SRF_CONFIG",
        "CREATE_SRF",
        {
            parent: "LIST_SRF",
            children: ["VIEW_SRF","ADD_ITEM", "EDIT_SRF", "BULK_DOWNLOAD_CERTIFICATE", "DELETE_SRF"]
        },
       
        {
            parent: "LIST_SRF_ITEM",
            children: ["VIEW_SRF_ITEM", "EDIT_SRF_ITEM", "DELETE_SRF_ITEM", "VIEW_SRF_ITEM_AUDIT"]
        },
        "VIEW_ASSIGNED_ONLY",
        "ASSIGNED_ACTION_ONLY",
        "BYPASS_SRF_DATE_RESTRICTION",
        "FILTER_BY_STATUS",
        "ACCESS_SCANNER",
    ],

    // Calibration Workflow
    "Calibration": [
        "ENTER_RESULT",
        "UPDATE_RESULT",
        "REVIEW_RESULT",
        "AUTHORIZE_RESULT",
        "UPLOAD_CERTIFICATE",
        "GENERATE_LABEL",
        "ACCESS_QR_CODES",
    ],

    // 9. Reports
    "Reports": [
        "ACCESS_REPORTS",
    ],

    // 9b. Reports
    "Calibration Due": [
        "ACCESS_DUE_DATE"
    ],

    // 10. Quotations
    "Quotations": [
        "ACCESS_BANK_CONFIG",
        "ACCESS_QUOTATION_CONFIG",
        "CREATE_QUOTATION",
        {
            parent: "LIST_QUOTATION",
            children: ["EDIT_QUOTATION", "DELETE_QUOTATION"]
        },
    ],

    // 11. Access Control
    "Access Control": [
        "CREATE_USER",
        {
            parent: "LIST_USER",
            children: ["EDIT_USER", "DELETE_USER", "PASSWORD_RESET_USER"]
        },
        {
            parent: "ACCESS_ROLES",
            children: ["EDIT_ROLE", "DELETE_ROLE"]
        },
        "ACCESS_USER_TRACK",
    ],

    // 12. Configuration
    "Configuration": [
        "ACCESS_EMAIL",
        "SYNC_DATA",
        "ACCESS_LAB_INFO",
        "ACCESS_CERTIFICATE_CONFIG",
        "ACCESS_CERTIFICATE_FORMAT",
        "ACCESS_DATA_STORAGE",
        "MANAGE_LABS",

    ]
};

const PERMISSION_DESCRIPTIONS = {
    // Dashboard
    "ACCESS_DASHBOARD": "View the main dashboard with statistics, charts, and quick actions overview",

    // Customers
    "CREATE_CUSTOMER": "Add new customer records to the system",
    "LIST_CUSTOMER": "View the list of all registered customers",
    "EDIT_CUSTOMER": "Modify existing customer details",
    "DELETE_CUSTOMER": "Remove customer records from the system",

    // UOM
    "CREATE_UOM": "Add new Unit of Measurement entries",
    "LIST_UOM": "View the list of all units of measurement",
    "EDIT_UOM": "Modify existing UOM entries",
    "DELETE_UOM": "Remove UOM entries from the system",

    // Instruments
    "CREATE_INSTRUMENT": "Add new instrument types (e.g., Vernier Caliper, Micrometer)",
    "LIST_INSTRUMENT": "View the list of all instrument types",
    "EDIT_INSTRUMENT": "Modify existing instrument type details",
    "DELETE_INSTRUMENT": "Remove instrument types from the system",
    "ACCESS_MAKE_MODEL": "Access and manage Make & Model master data for instruments",
    "CREATE_INSTRUMENT_VARIANT": "Add new instrument variants with specific ranges and least counts",
    "LIST_INSTRUMENT_VARIANT": "View the list of all instrument variants",
    "EDIT_INSTRUMENT_VARIANT": "Modify existing instrument variant details",
    "DELETE_INSTRUMENT_VARIANT": "Remove instrument variants from the system",

    // Masters
    "CREATE_MASTER": "Add new master equipment records used as calibration standards",
    "LIST_MASTER": "View the list of all master equipment",
    "EDIT_MASTER": "Modify existing master equipment details",
    "DELETE_MASTER": "Remove master equipment records from the system",
    "CREATE_MASTER_DOC": "Add new master document list entries",
    "LIST_MASTER_DOC": "View master document list",
    "EDIT_MASTER_DOC": "Modify existing master document entries",
    "DELETE_MASTER_DOC": "Remove master document entries",
    "CREATE_DOC_DETAIL": "Add new document detail records",
    "LIST_DOC_DETAIL": "View document detail records",
    "EDIT_DOC_DETAIL": "Modify existing document detail records",
    "DELETE_DOC_DETAIL": "Remove document detail records",
    "CREATE_DOC_FORMAT": "Add new document format templates",
    "LIST_DOC_FORMAT": "View document format templates",
    "EDIT_DOC_FORMAT": "Modify existing document format templates",
    "DELETE_DOC_FORMAT": "Remove document format templates",

    // External Master
    "CREATE_EXTERNAL_MASTER": "Add new external master equipment records for reference/storage",
    "LIST_EXTERNAL_MASTER": "View the list of all external master equipment",
    "EDIT_EXTERNAL_MASTER": "Modify existing external master equipment details",
    "DELETE_EXTERNAL_MASTER": "Remove external master equipment records from the system",

    // Procedures
    "CREATE_PROCEDURE": "Create new calibration procedures defining steps and parameters",
    "LIST_PROCEDURE": "View the list of all calibration procedures",
    "EDIT_PROCEDURE": "Modify existing calibration procedures",
    "DELETE_PROCEDURE": "Remove calibration procedures from the system",
    "CREATE_EXCEL": "Create new Calibmaster Excel templates for calibration data entry",
    "LIST_EXCEL": "View the list of all Calibmaster Excel templates",
    "EDIT_EXCEL": "Modify existing Calibmaster Excel templates",
    "DELETE_EXCEL": "Remove Calibmaster Excel templates",
    "VIEW_HIDDEN_SHEETS": "View sheets marked as hidden during Enter Result — without this, hidden sheets are not visible to the user",

    // Excel Editor Toolbar
    "EXCEL_FORMAT_CELLS": "Use cell formatting tools: alignment, bold, font color, and fill color",
    "EXCEL_MERGE_CELLS": "Merge and unmerge cells in the Excel editor",
    "EXCEL_DECIMAL_PRECISION": "Increase or decrease decimal precision for cell values",
    "EXCEL_CONDITIONAL_FORMAT": "Apply conditional formatting rules to cells (e.g., Go/No-Go highlighting)",
    "EXCEL_SAVE": "Save changes made in the Excel editor",
    "EXCEL_PAGE_SETUP": "Configure page setup and print margins for the Excel sheet",
    "EXCEL_DOWNLOAD": "Download all sheets as an XLSX file",
    "EXCEL_PRINT_SHEET_SELECT": "Select which sheet prints on the Certificate and Observation pages",
    "EXCEL_MANAGE_SHEETS": "Add, delete, duplicate, and rename sheets in the Excel editor",
    "EXCEL_HIDDEN_SHEETS": "Configure which sheets are hidden from users without VIEW_HIDDEN_SHEETS permission",
    "EXCEL_CELL_LOCK_PERMISSIONS": "Set read-only or editable cell-level permissions for specific users",

    // ULR Setup
    "CREATE_ULR": "Create new ULR (Unique Lab Reference) configuration",
    "LIST_ULR": "View ULR configuration list",

    // SRF Operations
    "CREATE_SRF_CONFIG": "Create SRF number format configuration (prefix, suffix, numbering)",
    "LIST_SRF_CONFIG": "View SRF configuration settings",
    "CREATE_SRF": "Create new Service Request Forms with item entries",
    "LIST_SRF": "View the list of all SRFs in the system",
    "VIEW_SRF": "Open and view individual SRF details and items",
    "ADD_ITEM": "Add new items (instruments) to an existing SRF for calibration",
    "EDIT_SRF": "Modify existing SRF details and add/remove items",
    "BULK_DOWNLOAD_CERTIFICATE": "Download all certificates for items in a SRF as a bulk ZIP file",
    "DELETE_SRF": "Remove SRF records from the system",
    "LIST_SRF_ITEM": "View the list of items within an SRF",
    "VIEW_SRF_ITEM": "Open and view individual SRF item details",
    "EDIT_SRF_ITEM": "Modify existing SRF item details",
    "DELETE_SRF_ITEM": "Remove individual items from an SRF",
    "VIEW_SRF_ITEM_AUDIT": "View real-time lifecycle audit trail and system timestamps for SRF items",
    "VIEW_ASSIGNED_ONLY": "Restrict user to see only SRF items assigned to them — hides other users' items",
    "ASSIGNED_ACTION_ONLY": "Only allow actions (Enter Result, etc.) on items assigned to this user",
    "BYPASS_SRF_DATE_RESTRICTION": "Allow creating SRFs with past dates that would normally be restricted",
    "FILTER_BY_STATUS": "Enable status-based filtering in the SRF items list (e.g., Calibrated, Not Calibrated)",
    "ACCESS_SCANNER": "Access the barcode/QR scanner feature to quickly find SRF items",

    // Calibration Workflow
    "ENTER_RESULT": "Open the Enter Result screen to fill calibration data into the Excel template",
    "UPDATE_RESULT": "Modify previously entered calibration results",
    "REVIEW_RESULT": "Review and approve/reject calibration results submitted by engineers",
    "AUTHORIZE_RESULT": "Final authorization of calibration results before certificate generation",
    "UPLOAD_CERTIFICATE": "Upload external calibration certificates (PDF) for SRF items",
    "GENERATE_LABEL": "Generate printable calibration labels/stickers for calibrated instruments",
    "ACCESS_QR_CODES": "Access QR code for each instrument — scanning the QR shows the most recent calibration certificate",

    // Reports
    "ACCESS_REPORTS": "View and generate calibration reports and analytics",

    // Calibration Due
    "ACCESS_DUE_DATE": "View the calibration due date tracker to monitor upcoming re-calibrations",

    // Quotations
    "ACCESS_BANK_CONFIG": "Configure bank account details used in quotation invoices",
    "ACCESS_QUOTATION_CONFIG": "Configure quotation settings like terms, conditions, and templates",
    "CREATE_QUOTATION": "Create new quotation documents for customers",
    "LIST_QUOTATION": "View the list of all quotations",
    "EDIT_QUOTATION": "Modify existing quotation details",
    "DELETE_QUOTATION": "Remove quotation records from the system",

    // Access Control
    "CREATE_USER": "Add new user accounts to the system",
    "LIST_USER": "View the list of all user accounts",
    "EDIT_USER": "Modify existing user account details and role assignments",
    "DELETE_USER": "Deactivate or remove user accounts",
    "PASSWORD_RESET_USER": "Reset passwords for other user accounts",
    "ACCESS_ROLES": "View and manage role definitions and their permissions",
    "EDIT_ROLE": "Modify role permissions and settings",
    "DELETE_ROLE": "Remove role definitions from the system",
    "ACCESS_USER_TRACK": "View user activity logs and login history",

    // Configuration
    "ACCESS_EMAIL": "Configure email settings for notifications and certificate delivery",
    "SYNC_DATA": "Trigger data synchronization operations",
    "ACCESS_LAB_INFO": "View and edit laboratory information (name, address, logo, accreditation)",
    "ACCESS_CERTIFICATE_CONFIG": "Configure certificate generation settings and numbering format",
    "ACCESS_CERTIFICATE_FORMAT": "Manage certificate format templates and layouts",
    "ACCESS_DATA_STORAGE": "Access data storage management for backups and file management",
    "MANAGE_LABS": "Create, edit, and manage multiple laboratory configurations",
};

const PERMISSION_DEPENDENCIES = {
    // SRF Operations require lookup access to customers, instruments, and config
    "CREATE_SRF": [
        { perm: "LIST_CUSTOMER", scope: "api" },
        { perm: "LIST_INSTRUMENT", scope: "api" },
        { perm: "LIST_UOM", scope: "api" },
        { perm: "LIST_SRF_CONFIG", scope: "api" },
        { perm: "ACCESS_MAKE_MODEL", scope: "api" },
        { perm: "LIST_MASTER", scope: "api" },
        { perm: "LIST_INSTRUMENT_VARIANT", scope: "api" },
        { perm: "LIST_CALIBRATION_ENGINEER", scope: "api" },
        { perm: "ULR_GENERATE", scope: "api" }
    ],

    "VIEW_SRF": [
        { perm: "LIST_CUSTOMER", scope: "api" },
        { perm: "LIST_INSTRUMENT", scope: "api" },
        { perm: "LIST_INSTRUMENT_VARIANT", scope: "api" }
    ],

    "FILTER_BY_STATUS": [
        { perm: "VIEW_SRF", scope: "api" },
        { perm: "EDIT_SRF", scope: "api" }
    ],

    // Quotations require customer and item lookups
    "CREATE_QUOTATION": [
        { perm: "LIST_CUSTOMER", scope: "api" },
        { perm: "LIST_INSTRUMENT", scope: "api" },
        { perm: "LIST_UOM", scope: "api" },
        { perm: "LIST_INSTRUMENT_VARIANT", scope: "api" }
    ],

    // Instrument creation requires UOM and Make/Model
    "CREATE_INSTRUMENT": [
        { perm: "LIST_UOM", scope: "api" }
    ],

    "EDIT_INSTRUMENT": [
        { perm: "LIST_UOM", scope: "api" }
    ],

    // Instrument Variant creation requires Instrument and UOM context
    "CREATE_INSTRUMENT_VARIANT": [
        { perm: "LIST_INSTRUMENT", scope: "api" },
        { perm: "LIST_UOM", scope: "api" }
    ],

    "EDIT_INSTRUMENT_VARIANT": [
        { perm: "LIST_INSTRUMENT", scope: "api" },
        { perm: "LIST_UOM", scope: "api" }
    ],

    // Procedures require instrument and UOM context
    "CREATE_PROCEDURE": [
        { perm: "LIST_INSTRUMENT", scope: "api" },
        { perm: "LIST_UOM", scope: "api" },
        { perm: "LIST_MASTER", scope: "api" }
    ],

    // Calibmaster Excel creation requires Master context
    "CREATE_EXCEL": [
        { perm: "LIST_PROCEDURE", scope: "api" }
    ],

    "LIST_EXCEL": [
        { perm: "LIST_PROCEDURE", scope: "api" },
        { perm: "LIST_INSTRUMENT_VARIANT", scope: "api" }
    ],


    "ENTER_RESULT": [
        { perm: "VIEW_SRF", scope: "api", defaultScreen: true },
        { perm: "VIEW_SRF_ITEM", scope: "api", defaultScreen: true },
        { perm: "EXCEL_PRINT_SHEET_SELECT", scope: "api", defaultScreen: true },
        { perm: "LIST_EXCEL", scope: "api" },
        { perm: "LIST_CALIBRATION_ENGINEER", scope: "api" },
        { perm: "EXCEL_SAVE", scope: "api", defaultScreen: true },
    ],

    "UPDATE_RESULT": [
        { perm: "LIST_SRF", scope: "api" },
        { perm: "VIEW_SRF", scope: "api" }
    ],

    "REVIEW_RESULT": [
        { perm: "VIEW_SRF", scope: "api" }
    ],

    "AUTHORIZE_RESULT": [
        { perm: "VIEW_SRF", scope: "api" }
    ],

    "VIEW_SRF_ITEM_AUDIT": [
        { perm: "LIST_SRF_ITEM", scope: "api" },
        { perm: "VIEW_SRF_ITEM", scope: "api" }
    ],
};

module.exports = {
    PERMISSIONS_GROUPS,
    PERMISSION_DESCRIPTIONS,
    PERMISSION_DEPENDENCIES
};
