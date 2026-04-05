import { Layout, theme } from "antd";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/auth-context";
import { Outlet } from "react-router-dom";
import SideBar from "../Sidebar/SideBar";
import Header from "../Header/Header"; // Custom header with toggle
import CustomNotification from "../UI/CustomNotification";
import "./Layout.css";

// ✅ Import all page components
// Imports moved to App.jsx





const { Content } = Layout;

const AppLayout = () => {
    const auth = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapsed = () => setCollapsed((prev) => !prev);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()
    return (
        <Layout style={{ minHeight: "100vh", overflow: "hidden" }} hasSider>
            <SideBar collapsed={collapsed} onCollapse={setCollapsed} />
            <Layout style={{ overflow: "auto" }}>
                <Header collapsed={collapsed} toggleCollapsed={toggleCollapsed} style={{ padding: 0, background: colorBgContainer }} />
                <Content style={{
                    // marginLeft: collapsed ? 80 : 220, // matches sider width
                    marginTop: 64,
                    padding: "20px",
                    overflowY: "auto",
                    height: "calc(100vh - 64px)",
                    transition: "margin-left 0.3s"
                }}>
                    <Outlet />
                </Content>
            </Layout>
            <CustomNotification />
        </Layout>
    );
};

export default AppLayout;
