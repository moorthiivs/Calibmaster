import React, { useContext } from "react";
import { Layout } from "antd";
import { AuthContext } from "../../context/auth-context";
import RootLevelSidebar from "./RootLevelSidebar";
import DepartmentLevelSidebar from "./DepartmentLevelSidebar";
import LeftVerticalNavigation from "./LeftVerticalNavigation";
import "./SideBar.css";
import CompanyLogo from "../Header/CompanyLogo";

const { Sider } = Layout;

const siderStyle = {
  backgroundColor: "#001529",
  overflow: 'auto',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  scrollbarWidth: 'thin',
  scrollbarGutter: 'stable',
};

const SideBar = ({ collapsed, onCollapse }) => {
  const auth = useContext(AuthContext);

  return (
    <Sider width={220} style={siderStyle} trigger={null} collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
    >


      <div className="sidebar__logo__wrapper">
        <CompanyLogo />
      </div>

      {auth.department === "root" && <RootLevelSidebar />}
      {(auth.department === "admin" || auth.department === "Manager") && <LeftVerticalNavigation />}
      {(auth.department !== "root" && auth.department !== "admin" && auth.department !== "Manager") && (
        <DepartmentLevelSidebar />
      )}
    </Sider>
  );
};

export default SideBar;
