import { useContext } from "react";
import { AuthContext } from "../../context/auth-context";
import { useSelector } from "react-redux";
import SideBar from "../Sidebar/SideBar";
import "./BodyContent.css";
import PermissionGuard from "../common/PermissionGuard";

import AddSRF from "./AddSRF/AddSRF";
import CustomNotification from "../UI/CustomNotification";
import AddUser from "./AddUser/AddUser";
import SRFs from "./SRFs/SRFs";
import Invoices from "./Invoices/Invoices";
import Users from "./Users/Users";
import WelcomeScreen from "./WelcomeScreen";
import MasterList from "./MasterList/MasterList";
import Labs from "./Labs/Labs";
import Email from "./Email/Email";
import LabList from "./Labs/LabList";
import EditLab from "./Labs/EditLab";

import CreateUOM from "./UOM/CreateUOM";
import ListUOM from "./UOM/ListUOM";
import EditUOM from "./UOM/EditUOM";

import CreateInstrument from "./Instrument/CreateInstrument";
import ListInstrument from "./Instrument/ListInstrument";
import EditInstrument from "./Instrument/EditInstrument";

import CreateInstrumentType from "./InstrumentType/CreateInstrumentType";
import ListInstrumentType from "./InstrumentType/ListInstrumentType";
import EditInstrumentType from "./InstrumentType/EditInstrumentType";

import ListCustomer from "./customer/ListCustomer";
import CreateCustomer from "./customer/CreateCustomer";
import EditCustomer from "./customer/EditCustomer";
import AddSRFConfig from "./SRFConfig/AddSRFConfig";
import ListSRFConfig from "./SRFConfig/ListSRFConfig";
import StandardDetails from "./StandardDetails/StandardDetails";
import ListMaster from "./StandardDetails/ListMaster";

import CreateCertificateConfig from "./CMSettings/Certificate/CreateCertificateConfig";
import ListCertificateConfig from "./CMSettings/Certificate/ListCertificateConfig";

import DefineProcedure from "./DefineProcedure/DefineProcedure";
import ListDefinedProcedure from "./DefineProcedure/ListDefinedProcedure";

import Roles from "./Roles/Roles";

import DueDateChecker from "./CalibrationDueDate/DueDateCount";

import PasswordReset from "./AdminInfo/PasswordReset";

import AddBankConfig from "./BankConfig/AddBankDetails";
import ListBankConfig from "./BankConfig/ListBankDetails";

import QuotationConfig from './Quotation/QuotationConfig/QuotationConfig';
import QuotationConfigList from './Quotation/QuotationConfig/QuotationConfigList';
import QuotationItem from './Quotation/QuotationItem/QuotationItem';
import QuotationCustomerList from './Quotation/QuotationItem/QuotationCustomerList';

import AddUlr from "./AddULR/AddUlr";
import ListULR from "./AddULR/ListULR";

import CreateUncertaintyParameter from "./Uncertainty-Parameter/CreateUncertaintyParameter";
import ListUncertaintyParameter from "./Uncertainty-Parameter/ListUncertaintyParameter";
import SyncPage from "./SyncData/SyncPage";

import ScannerEnterResult from "./SRFs/ResultComponent/ScannerEnterResult/ScannerEnterResult";

import CreateCalibmasterExcel from "./CalibmasterExcel/CreateCalibmasterExcel";
import ListCalibmasterExcel from "./CalibmasterExcel/ListCalibmasterExcel";
import MasterListDocAdd from "./MasterDocument/MasterListDoc/MasterListDocAdd";
import MasterListDocList from "./MasterDocument/MasterListDoc/MasterListDocList";
import MasterListDocDetailAdd from "./MasterDocument/MasterListDocDetail/MasterListDocDetailAdd";
import MasterListDocDetailList from "./MasterDocument/MasterListDocDetail/MasterListDocDetailList";
import MasterListDocFormatAdd from "./MasterDocument/MasterListDocFormat/MasterListDocFormatAdd";
import MasterListDocFormatList from "./MasterDocument/MasterListDocFormat/MasterListDocFormatList";
import CertificateFormatCreator from "./CertificateFormatEditor/CertificateFormatEditor";

const BodyContent = () => {

  const auth = useContext(AuthContext);
  const sidebar = useSelector((state) => state.sidebar.current);

  return (
    <div className="body__container">

      <SideBar />

      <div
        className="body__content"
        style={{ margin: (auth.department === "admin" || auth.department === "Manager") && "85px 20px 20px 250px" }}
      >
        {/* Lab Management — Root/Admin only */}
        {sidebar === "Labs" ? <PermissionGuard permission="MANAGE_LABS"><Labs /></PermissionGuard> : null}
        {sidebar === "List-Labs" ? <PermissionGuard permission="MANAGE_LABS"><LabList /></PermissionGuard> : null}
        {sidebar === "Edit-Lab" ? <PermissionGuard permission="MANAGE_LABS"><EditLab /></PermissionGuard> : null}

        {/* Customer Management */}
        {sidebar === "List-Customer" ? <PermissionGuard permission="LIST_CUSTOMER"><ListCustomer /></PermissionGuard> : null}
        {sidebar === "Create-Customer" ? <PermissionGuard permission="CREATE_CUSTOMER"><CreateCustomer /></PermissionGuard> : null}
        {sidebar === "Edit-Customer" ? <PermissionGuard permission="EDIT_CUSTOMER"><EditCustomer /></PermissionGuard> : null}

        {/* User Management */}
        {sidebar === "Add User" ? <PermissionGuard permission="CREATE_USER"><AddUser /></PermissionGuard> : null}
        {sidebar === "Users" ? <PermissionGuard permission="LIST_USER"><Users /></PermissionGuard> : null}

        {/* UOM Management */}
        {sidebar === "Create-UOM" ? <PermissionGuard permission="CREATE_UOM"><CreateUOM /></PermissionGuard> : null}
        {sidebar === "List-UOM" ? <PermissionGuard permission="LIST_UOM"><ListUOM /></PermissionGuard> : null}
        {sidebar === "Edit-UOM" ? <PermissionGuard permission="EDIT_UOM"><EditUOM /></PermissionGuard> : null}

        {/* Instrument Management */}
        {sidebar === "Create-Instrument" ? <PermissionGuard permission="CREATE_INSTRUMENT"><CreateInstrument /></PermissionGuard> : null}
        {sidebar === "List-Instrument" ? <PermissionGuard permission="LIST_INSTRUMENT"><ListInstrument /></PermissionGuard> : null}
        {sidebar === "Edit-Instrument" ? <PermissionGuard permission="EDIT_INSTRUMENT"><EditInstrument /></PermissionGuard> : null}

        {/* Instrument Types */}
        {sidebar === "Create-Instrument-Type" ? <PermissionGuard permission="CREATE_INSTRUMENT_VARIANT"><CreateInstrumentType /></PermissionGuard> : null}
        {sidebar === "List-Instrument-Type" ? <PermissionGuard permission="LIST_INSTRUMENT_VARIANT"><ListInstrumentType /></PermissionGuard> : null}
        {sidebar === "Edit-Instrument-Type" ? <PermissionGuard permission="CREATE_INSTRUMENT_VARIANT"><EditInstrumentType /></PermissionGuard> : null}

        {/* Uncertainty Parameters */}
        {sidebar === "Create-Uncertainty-Parameter" ? <PermissionGuard permission="CREATE_MASTER"><CreateUncertaintyParameter /></PermissionGuard> : null}
        {sidebar === "List-Uncertainty-Parameter" ? <PermissionGuard permission="LIST_MASTER"><ListUncertaintyParameter /></PermissionGuard> : null}

        {/* SRF Configuration */}
        {sidebar === "Add-SRF-Config" ? <PermissionGuard permission="CREATE_SRF_CONFIG"><AddSRFConfig /></PermissionGuard> : null}
        {sidebar === "List-SRF-Config" ? <PermissionGuard permission="LIST_SRF_CONFIG"><ListSRFConfig /></PermissionGuard> : null}

        {/* ULR */}
        {sidebar === "ULR-Setup" ? <PermissionGuard permission="CREATE_ULR"><AddUlr /></PermissionGuard> : null}
        {sidebar === "List-ULR" ? <PermissionGuard permission="LIST_ULR"><ListULR /></PermissionGuard> : null}

        {/* SRF Operations */}
        {sidebar === "Add SRF" ? <PermissionGuard permission="CREATE_SRF"><AddSRF /></PermissionGuard> : null}
        {sidebar === "SRFs" ? <PermissionGuard permission="LIST_SRF"><SRFs /></PermissionGuard> : null}

        {/* Masters / Standard Details */}
        {sidebar === "Standard-Details" ? <PermissionGuard permission="CREATE_MASTER"><StandardDetails /></PermissionGuard> : null}
        {sidebar === "List-Master" ? <PermissionGuard permission="LIST_MASTER"><ListMaster /></PermissionGuard> : null}

        {/* Certificate Config */}
        {sidebar === "Create-Config" ? <PermissionGuard permission="ACCESS_CERTIFICATE_CONFIG"><CreateCertificateConfig /></PermissionGuard> : null}
        {sidebar === "List-Config" ? <PermissionGuard permission="ACCESS_CERTIFICATE_CONFIG"><ListCertificateConfig /></PermissionGuard> : null}
        {sidebar === "Cretificate-format" ? <PermissionGuard permission="ACCESS_CERTIFICATE_FORMAT"><CertificateFormatCreator /></PermissionGuard> : null}

        {/* Master Documents */}
        {sidebar === "Master-ListDoc-Add" ? <PermissionGuard permission="ACCESS_MASTER_DOCS"><MasterListDocAdd /></PermissionGuard> : null}
        {sidebar === "Master-ListDoc-List" ? <PermissionGuard permission="ACCESS_MASTER_DOCS"><MasterListDocList /></PermissionGuard> : null}
        {sidebar === "Master-ListDocDetail-Add" ? <PermissionGuard permission="ACCESS_MASTER_DOCS"><MasterListDocDetailAdd /></PermissionGuard> : null}
        {sidebar === "Master-ListDocDetail-List" ? <PermissionGuard permission="ACCESS_MASTER_DOCS"><MasterListDocDetailList /></PermissionGuard> : null}
        {sidebar === "Master-ListDocFormat-Add" ? <PermissionGuard permission="ACCESS_MASTER_DOCS"><MasterListDocFormatAdd /></PermissionGuard> : null}
        {sidebar === "Master-ListDocFormat-List" ? <PermissionGuard permission="ACCESS_MASTER_DOCS"><MasterListDocFormatList /></PermissionGuard> : null}

        {/* Procedures */}
        {sidebar === "Define-Procedure" ? <PermissionGuard permission="ACCESS_PROCEDURES"><DefineProcedure /></PermissionGuard> : null}
        {sidebar === "List-Defined-Procedure" ? <PermissionGuard permission="ACCESS_PROCEDURES"><ListDefinedProcedure /></PermissionGuard> : null}

        {/* Calibmaster Excel */}
        {sidebar === "Creat-Calibmaster-Excel" ? <PermissionGuard permission="ACCESS_CALIBMASTER_EXCEL"><CreateCalibmasterExcel /></PermissionGuard> : null}
        {sidebar === "List-Calibmaster-Excel" ? <PermissionGuard permission="ACCESS_CALIBMASTER_EXCEL"><ListCalibmasterExcel /></PermissionGuard> : null}

        {/* Roles & Access Control */}
        {sidebar === "Roles" ? <PermissionGuard permission="ACCESS_ROLES"><Roles /></PermissionGuard> : null}

        {/* Miscellaneous */}
        {sidebar === "Due-date" ? <PermissionGuard permission="ACCESS_DUE_DATE"><DueDateChecker /></PermissionGuard> : null}
        {sidebar === "Reset-Password" ? <PasswordReset /> : null}

        {/* Bank Config */}
        {sidebar === "Add-Bank-Config" ? <PermissionGuard permission="ACCESS_BANK_CONFIG"><AddBankConfig /></PermissionGuard> : null}
        {sidebar === "List-Bank-Config" ? <PermissionGuard permission="ACCESS_BANK_CONFIG"><ListBankConfig /></PermissionGuard> : null}

        {/* Quotation */}
        {sidebar === "Quotation-Config" ? <PermissionGuard permission="ACCESS_QUOTATION_CONFIG"><QuotationConfig /></PermissionGuard> : null}
        {sidebar === "Quotation-Config-list" ? <PermissionGuard permission="ACCESS_QUOTATION_CONFIG"><QuotationConfigList /></PermissionGuard> : null}
        {sidebar === "Quotation-Item" ? <PermissionGuard permission="CREATE_QUOTATION"><QuotationItem /></PermissionGuard> : null}
        {sidebar === "Quotation-Customer-list" ? <PermissionGuard permission="LIST_QUOTATION"><QuotationCustomerList /></PermissionGuard> : null}

        {/* System */}
        {sidebar === "E-Mail" ? <PermissionGuard permission="ACCESS_EMAIL"><Email /></PermissionGuard> : null}
        {sidebar === "Sync-Data" ? <PermissionGuard permission="SYNC_DATA"><SyncPage /></PermissionGuard> : null}
        {sidebar === "QR-Scanner" ? <PermissionGuard permission="ACCESS_SCANNER"><ScannerEnterResult /></PermissionGuard> : null}

        {sidebar === null ? <WelcomeScreen /> : null}

      </div>

      <CustomNotification />

    </div>
  );
};

export default BodyContent;