import { useContext } from "react";
import { AuthContext } from "../../context/auth-context";
import { useSelector } from "react-redux";
import SideBar from "../Sidebar/SideBar";
import "./BodyContent.css";

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

import CreateEmployee from "./EmployeeMasters/CreateEmployee";
import ListEmployee from "./EmployeeMasters/ListEmployee";

import DueDateChecker from "./CalibrationDueDate/DueDateCount";

import PasswordReset from "./AdminInfo/PasswordReset";

import AddBankConfig from "./BankConfig/AddBankDetails";
import ListBankConfig from "./BankConfig/ListBankDetails";

import QuotationConfig from './Quotation/QuotationConfig/QuotationConfig';
import QuotationConfigList from './Quotation/QuotationConfig/QuotationConfigList';
import QuotationItem from './Quotation/QuotationItem/QuotationItem';
import QuotationCustomerList from './Quotation/QuotationItem/QuotationCustomerList';

import AddULR from "./AddULR/AddULR";
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

        {sidebar === "Labs" ? <Labs /> : null}
        {sidebar === "List-Labs" ? <LabList /> : null}
        {sidebar === "Edit-Lab" ? <EditLab /> : null}

        {sidebar === "List-Customer" ? <ListCustomer /> : null}
        {sidebar === "Create-Customer" ? <CreateCustomer /> : null}
        {sidebar === "Edit-Customer" ? <EditCustomer /> : null}

        {sidebar === "Add User" ? <AddUser /> : null}
        {sidebar === "Users" ? <Users /> : null}

        {sidebar === "Create-UOM" ? <CreateUOM /> : null}
        {sidebar === "List-UOM" ? <ListUOM /> : null}
        {sidebar === "Edit-UOM" ? <EditUOM /> : null}

        {sidebar === "Create-Instrument" ? <CreateInstrument /> : null}
        {sidebar === "List-Instrument" ? <ListInstrument /> : null}
        {sidebar === "Edit-Instrument" ? <EditInstrument /> : null}

        {sidebar === "Create-Instrument-Type" ? <CreateInstrumentType /> : null}
        {sidebar === "List-Instrument-Type" ? <ListInstrumentType /> : null}
        {sidebar === "Edit-Instrument-Type" ? <EditInstrumentType /> : null}

        {sidebar === "Create-Uncertainty-Parameter" ? <CreateUncertaintyParameter /> : null}
        {sidebar === "List-Uncertainty-Parameter" ? <ListUncertaintyParameter /> : null}

        {sidebar === "Add-SRF-Config" ? <AddSRFConfig /> : null}
        {sidebar === "List-SRF-Config" ? <ListSRFConfig /> : null}

        {sidebar === "ULR-Setup" ? <AddULR /> : null}
        {sidebar === "List-ULR" ? <ListULR /> : null}

        {sidebar === "Add SRF" ? <AddSRF /> : null}
        {sidebar === "SRFs" ? <SRFs /> : null}

        {sidebar === "Standard-Details" ? <StandardDetails /> : null}
        {sidebar === "List-Master" ? <ListMaster /> : null}

        {sidebar === "Create-Config" ? <CreateCertificateConfig /> : null}
        {sidebar === "List-Config" ? <ListCertificateConfig /> : null}

        {sidebar === "Cretificate-format" ? <CertificateFormatCreator /> : null}

        {sidebar === "Master-ListDoc-Add" ? <MasterListDocAdd /> : null}
        {sidebar === "Master-ListDoc-List" ? <MasterListDocList /> : null}

        {sidebar === "Master-ListDocDetail-Add" ? <MasterListDocDetailAdd /> : null}
        {sidebar === "Master-ListDocDetail-List" ? <MasterListDocDetailList /> : null}

        {sidebar === "Master-ListDocFormat-Add" ? <MasterListDocFormatAdd /> : null}
        {sidebar === "Master-ListDocFormat-List" ? <MasterListDocFormatList /> : null}

        {sidebar === "Define-Procedure" ? <DefineProcedure /> : null}
        {sidebar === "List-Defined-Procedure" ? <ListDefinedProcedure /> : null}


        {sidebar === "Creat-Calibmaster-Excel" ? <CreateCalibmasterExcel /> : null}
        {sidebar === "List-Calibmaster-Excel" ? <ListCalibmasterExcel /> : null}


        {sidebar === "Create-Employee" ? <CreateEmployee /> : null}
        {sidebar === "List-Employee" ? <ListEmployee /> : null}

        {sidebar === "Due-date" ? <DueDateChecker /> : null}

        {sidebar === "Reset-Password" ? <PasswordReset /> : null}

        {sidebar === "Add-Bank-Config" ? <AddBankConfig /> : null}
        {sidebar === "List-Bank-Config" ? <ListBankConfig /> : null}

        {sidebar === "Quotation-Config" ? <QuotationConfig /> : null}
        {sidebar === "Quotation-Config-list" ? <QuotationConfigList /> : null}
        {sidebar === "Quotation-Item" ? <QuotationItem /> : null}
        {sidebar === "Quotation-Customer-list" ? <QuotationCustomerList /> : null}

        {sidebar === "E-Mail" ? <Email /> : null}
        {sidebar === null ? <WelcomeScreen /> : null}
        {sidebar === "Sync-Data" ? <SyncPage /> : null}

        {sidebar === "QR-Scanner" ? <ScannerEnterResult /> : null}
      </div>

      <CustomNotification />

    </div>
  );
};

export default BodyContent;
