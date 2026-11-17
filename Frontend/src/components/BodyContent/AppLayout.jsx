import { Layout, theme } from "antd";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/auth-context";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import SideBar from "../Sidebar/SideBar";
import Header from "../Header/Header"; // Custom header with toggle
import CustomNotification from "../UI/CustomNotification";
import { ArrowUpOutlined, PlusOutlined } from "@ant-design/icons";
import "./Layout.css";


const { Content } = Layout;

const AppLayout = () => {
    const auth = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapsed = () => setCollapsed((prev) => !prev);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    // Root user should only be frozen if they haven't selected a lab AND they aren't on the Labs page to create/select one
    const isRootWithoutLab = auth.department === "root" && !auth.labId && !location.pathname.includes("/labs");

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
                    transition: "margin-left 0.3s",
                    position: "relative"
                }}>
                    {isRootWithoutLab ? (
                        <div className="lab-freeze-overlay">
                            <div className="freeze-content">
                                <div className="pulse-circle">
                                    <ArrowUpOutlined style={{ fontSize: 48, color: '#3b82f6' }} />
                                </div>
                                <h2 className="freeze-title">Laboratory Selection Required</h2>
                                <p className="freeze-subtitle">
                                    Please use the <strong>Active Lab</strong> switcher in the top header to begin your session.
                                </p>
                                <div style={{ marginTop: 24 }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Don't have a lab yet?</span>
                                    <br />
                                    <button 
                                        onClick={() => navigate('/dashboard/labs')}
                                        className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <PlusOutlined /> Create Your First Lab
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </Content>
            </Layout>
            <CustomNotification />
        </Layout>
    );
};

export default AppLayout;
