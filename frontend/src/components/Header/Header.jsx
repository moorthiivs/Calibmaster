//Header.jsx
import { ArrowLeftOutlined, AppstoreOutlined, DownOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PoweroffOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Drawer, Dropdown, Space, Tooltip } from "antd";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import user from "../../images/user.png";
import "./Header.css";

const Header = ({ collapsed, toggleCollapsed }) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Simple back navigation using browser history (now managed by React Router)
  const handleBack = () => {
    navigate(-1);
  };

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const logoutHandler = () => {
    auth.logout();
  };


  const items = [
    {
      key: 'account',
      label: (
        <div>
          <strong>{auth.name || "User"}</strong><br />
          <small>{auth.department?.toUpperCase() || "DEPARTMENT"}</small>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: '4',
      label: 'Settings',
      icon: <SettingOutlined />,
      extra: '⌘S',
    },
    {
      key: 'logout',
      icon: <PoweroffOutlined />,
      label: 'Logout',
      onClick: logoutHandler,
    },
  ];

  return (
    <div className="header">
      <div className="header-left">
        {/* <Tooltip title="Back">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ fontSize: "16px", marginRight: 8 }}
          />
        </Tooltip> */}
        <span className="trigger" onClick={toggleCollapsed}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
        {/* <Tooltip title="Menu">
          <Button
            type="text"
            icon={<AppstoreOutlined />}
            onClick={showDrawer}
            style={{ fontSize: "16px" }}
          />
        </Tooltip> */}
      </div>

      <div  className={`header-right ${collapsed ? "collapsed" : "expanded"}`}>
        <Dropdown menu={{ items }} placement="bottomRight" arrow trigger={["click"]}>
          <Space style={{ cursor: "pointer" }}>
            <Avatar size={40} src={user} icon={<UserOutlined />} />
            <DownOutlined style={{ fontSize: 12 }} />
          </Space>
        </Dropdown>
      </div>
      <Drawer title="Menu" placement="right" onClose={onClose} open={open}>
        <p>Menu Item 1</p>
        <p>Menu Item 2</p>
        <p>Menu Item 3</p>
      </Drawer>
    </div>
  );
};

export default Header;


