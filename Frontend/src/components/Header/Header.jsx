//Header.jsx
import { ArrowLeftOutlined, AppstoreOutlined, DownOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PoweroffOutlined, SettingOutlined, UserOutlined, PlusOutlined, SunOutlined, MoonOutlined, BellOutlined, SyncOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Avatar, Button, Drawer, Dropdown, Space, Tooltip, Select, Badge, Popover, Progress } from "antd";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../context/auth-context";
import { toggleTheme } from "../../store/themeSlice";
import config from "../../utils/config.json";
import user from "../../images/user.png";
import { START_CERT_JOB_EVENT } from "../../utils/certProgressStore";
import GlobalNotification from "../../utils/GlobalNotification";
import "./Header.css";

const Header = ({ collapsed, toggleCollapsed }) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  const [open, setOpen] = useState(false);

  // Background Job Progress State
  const [activeJobId, setActiveJobId] = useState(null);
  const [progressData, setProgressData] = useState({ completed: 0, total: 0, status: 'idle' });

  useEffect(() => {
    const handleStartJob = (e) => {
      if (e.detail?.jobId) {
        setActiveJobId(e.detail.jobId);
        setProgressData({ completed: 0, total: 0, status: 'processing' });
      }
    };

    window.addEventListener(START_CERT_JOB_EVENT, handleStartJob);
    return () => window.removeEventListener(START_CERT_JOB_EVENT, handleStartJob);
  }, []);

  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${config.Calibmaster.URL}/api/srf/progress/${activeJobId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        const json = await res.json();
        if (json.status === 'SUCCESS' && json.data) {
          setProgressData(json.data);
          if (json.data.status === 'completed' || json.data.status === 'error') {
            clearInterval(interval);
            if (json.data.status === 'completed') {
              GlobalNotification.success({
                title: 'Certificate Regeneration Complete',
                description: `Successfully regenerated certificates for ${json.data.completed} item(s).`,
                duration: 10
              });
            } else {
              GlobalNotification.error({
                title: 'Certificate Regeneration Error',
                description: 'An error occurred during certificate regeneration.',
                duration: 10
              });
            }
          }
        }
      } catch (err) {
        console.error("Progress polling error", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId, auth.token]);

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

  const [labs, setLabs] = useState([]);
  const [labLoading, setLabLoading] = useState(false);

  useEffect(() => {
    if (auth.department === "root" && auth.token) {
      const fetchLabs = async () => {
        try {
          setLabLoading(true);
          const response = await fetch(config.Calibmaster.URL + "/api/lab/listing", {
            headers: { Authorization: "Bearer " + auth.token },
          });
          const result = await response.json();
          if (response.ok) {
            setLabs(result.data || []);
          }
        } catch (error) {
          console.error("Failed to fetch labs", error);
        } finally {
          setLabLoading(false);
        }
      };
      fetchLabs();
    }
  }, [auth.department, auth.token, auth.labId]);

  const handleLabChange = (value) => {
    auth.switchLab(value);
    // Optionally force a page reload or notify the user
    window.location.reload(); 
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

  const notificationPopoverContent = (
    <div style={{ width: 260, padding: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
        Certificate Regeneration Status
      </div>
      {progressData.status === 'idle' ? (
        <div style={{ color: '#64748b', fontSize: 13 }}>No active background tasks.</div>
      ) : (
        <div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            {progressData.status === 'processing' ? 'Regenerating certificates...' : progressData.status === 'completed' ? 'Completed successfully!' : 'Regeneration failed.'}
          </div>
          <Progress
            percent={Math.round((progressData.completed / (progressData.total || 1)) * 100)}
            status={progressData.status === 'error' ? 'exception' : progressData.status === 'completed' ? 'success' : 'active'}
            size="small"
          />
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, textAlign: 'right' }}>
            {progressData.completed} / {progressData.total} items
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="header">
      <div className="header-left">
        <span className="trigger" onClick={toggleCollapsed}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
      </div>

      <div className={`header-right ${collapsed ? "collapsed" : "expanded"}`}>
        <Button 
          type="text" 
          icon={themeMode === "light" ? <MoonOutlined /> : <SunOutlined />} 
          onClick={() => dispatch(toggleTheme())} 
          style={{ fontSize: "16px", marginRight: 12 }}
        />

        {/* Live Notification Progress Widget */}
        <Popover content={notificationPopoverContent} title={null} trigger="click" placement="bottomRight">
          <Tooltip title="Certificate Regeneration Progress">
            <Badge 
              count={progressData.status === 'processing' ? `${progressData.completed}/${progressData.total}` : 0} 
              overflowCount={9999}
              style={{ backgroundColor: '#3b82f6', fontSize: 10 }}
            >
              <Button
                type="text"
                icon={progressData.status === 'processing' ? <SyncOutlined spin style={{ color: '#3b82f6' }} /> : <BellOutlined />}
                style={{ fontSize: "18px", marginRight: 16 }}
              />
            </Badge>
          </Tooltip>
        </Popover>

        {auth.department === "root" && (
          <Space size="middle" style={{ marginRight: 24 }}>
            <span style={{ fontSize: 13, color: !auth.labId ? '#3b82f6' : '#64748b', fontWeight: !auth.labId ? 700 : 500 }}>
              {labs.length === 0 ? "No Labs Found:" : "Active Lab:"}
            </span>
            {labs.length > 0 ? (
              <Select
                loading={labLoading}
                value={auth.labId || undefined}
                onChange={handleLabChange}
                placeholder="Select Lab"
                style={{ width: 220 }}
                className={`lab-switcher-select ${!auth.labId ? "lab-switcher-highlighted" : ""}`}
                options={labs.map(l => ({ label: l.lab_name, value: l.lab_id }))}
              />
            ) : (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => navigate("/dashboard/labs")}
                danger={!auth.labId}
              >
                Create First Lab
              </Button>
            )}
          </Space>
        )}
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


