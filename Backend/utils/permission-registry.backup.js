

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
        "ACCESS_DUE_DATE",
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
            children: ["VIEW_SRF", "EDIT_SRF", "BULK_DOWNLOAD_CERTIFICATE", "DELETE_SRF"]
        },
        // SRF Item-level permissions
        {
            parent: "LIST_SRF_ITEM",
            children: ["VIEW_SRF_ITEM", "EDIT_SRF_ITEM", "DELETE_SRF_ITEM"]
        },
        "VIEW_ASSIGNED_ONLY",
        "ASSIGNED_ACTION_ONLY",
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
    ],

    // 9. Reports
    "Reports": [
        "ACCESS_REPORTS",
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

const PERMISSION_DEPENDENCIES = {
    // SRF Operations require lookup access to customers, instruments, and config
    "CREATE_SRF": [
        { perm: "LIST_CUSTOMER",           scope: "api" },
        { perm: "LIST_INSTRUMENT",         scope: "api" },
        { perm: "LIST_UOM",                scope: "api" },
        { perm: "LIST_SRF_CONFIG",         scope: "api" },
        { perm: "ACCESS_MAKE_MODEL",       scope: "api" },
        { perm: "LIST_MASTER",             scope: "api" },
        { perm: "LIST_INSTRUMENT_VARIANT", scope: "api" },
        { perm: "LIST_CALIBRATION_ENGINEER", scope: "api" },
        { perm: "ULR_GENERATE",            scope: "api" }
    ],

    "VIEW_SRF": [
        { perm: "LIST_CUSTOMER",           scope: "api" },
        { perm: "LIST_INSTRUMENT",         scope: "api" },
        { perm: "LIST_INSTRUMENT_VARIANT", scope: "api" }
    ],

    "FILTER_BY_STATUS": ["VIEW_SRF", "EDIT_SRF"],

    // Quotations require customer and item lookups
    "CREATE_QUOTATION": ["LIST_CUSTOMER", "LIST_INSTRUMENT", "LIST_UOM", "LIST_INSTRUMENT_VARIANT"],

    // Instrument creation requires UOM and Make/Model
    "CREATE_INSTRUMENT": ["LIST_UOM"],

    "EDIT_INSTRUMENT": ["LIST_UOM"],

    // Instrument Variant creation requires Instrument and UOM context
    "CREATE_INSTRUMENT_VARIANT": ["LIST_INSTRUMENT", "LIST_UOM"],
    
    "EDIT_INSTRUMENT_VARIANT": ["LIST_INSTRUMENT", "LIST_UOM"],

    // Procedures require instrument and UOM context
    "CREATE_PROCEDURE": ["LIST_INSTRUMENT", "LIST_UOM", "LIST_MASTER"],

    // Calibmaster Excel creation requires Master context
    "CREATE_EXCEL": ["LIST_PROCEDURE"],

    "LIST_EXCEL": ["LIST_PROCEDURE", "LIST_INSTRUMENT_VARIANT"],


    // Calibration workflow requires viewing SRFs and Masters
    "UPDATE_RESULT": ["LIST_SRF", "VIEW_SRF"],
    "ENTER_RESULT": ["VIEW_SRF", "EXCEL_PRINT_SHEET_SELECT", { perm: "LIST_EXCEL", scope: "api" }, { perm: "LIST_CALIBRATION_ENGINEER", scope: "api" }],
    "REVIEW_RESULT": ["VIEW_SRF"],
    "AUTHORIZE_RESULT": ["VIEW_SRF"],
};

module.exports = {
    PERMISSIONS_GROUPS,
    PERMISSION_DEPENDENCIES
};
