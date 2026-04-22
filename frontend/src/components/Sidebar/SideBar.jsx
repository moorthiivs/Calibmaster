import React, { useContext } from "react";
import { Layout } from "antd";
import { AuthContext } from "../../context/auth-context";
import DynamicSidebar from "./DynamicSidebar";
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

      <DynamicSidebar />
    </Sider>
  );
};

export default SideBar;
