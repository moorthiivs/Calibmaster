import React, { useEffect, useState } from "react";
import { Form, Input, Button, Row, Col, Divider, Card, Space, Tag, Tooltip, Menu, Switch, Collapse } from "antd";
import { useContext } from "react";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";
import { InfoCircleOutlined, SafetyCertificateOutlined, AppstoreOutlined, RightOutlined } from "@ant-design/icons";

const { Panel } = Collapse;



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

    // 3. Instruments
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

    // 4. UOM
    "UOM": [
        "CREATE_UOM",
        {
            parent: "LIST_UOM",
            children: ["EDIT_UOM", "DELETE_UOM"]
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
            children: [ "EDIT_DOC_DETAIL", "DELETE_DOC_DETAIL"]
        },
        // Master Doc Format
        "CREATE_DOC_FORMAT",
        {
            parent: "LIST_DOC_FORMAT",
            children: [ "EDIT_DOC_FORMAT", "DELETE_DOC_FORMAT"]
        },
    ],

    // 6. Procedures
    "Procedures": [
        // Procedures
        "CREATE_PROCEDURE",
        {
            parent: "LIST_PROCEDURE",
            children: [ "EDIT_PROCEDURE", "DELETE_PROCEDURE"]
        },
        // Calibmaster Excel
        "CREATE_EXCEL",
        {
            parent: "LIST_EXCEL",
            children: [ "EDIT_EXCEL", "DELETE_EXCEL"]
        },
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
            children: ["VIEW_SRF", "EDIT_SRF", "DELETE_SRF"]
        },
        // SRF Item-level permissions (operate on items within an SRF, not the SRF itself)
        {
            parent: "LIST_SRF_ITEM",
            children: ["VIEW_SRF_ITEM", "EDIT_SRF_ITEM", "DELETE_SRF_ITEM"]
        },
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

    // 10. Quotations (includes Bank Config)
    "Quotations": [
        "ACCESS_BANK_CONFIG",
        "ACCESS_QUOTATION_CONFIG",
        "CREATE_QUOTATION",
        {
            parent: "LIST_QUOTATION",
            children: ["EDIT_QUOTATION", "DELETE_QUOTATION"]
        },
    ],

    // 11. Task Management
    "Task Management": [
        "ACCESS_TASKS"
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
    ],
};

const CreateRole = ({ onSuccess, editingRole }) => {
    const [form] = Form.useForm();
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [activeGroup, setActiveGroup] = useState("Dashboard");
    const [refresh, setRefresh] = useState(0);
    const [expandAll, setExpandAll] = useState([]);

    useEffect(() => {
        if (editingRole) {
            form.setFieldsValue({
                name: editingRole.name,
                description: editingRole.description,
                permissions: editingRole.permissions || [],
            });
            setRefresh(prev => prev + 1);
        }
    }, [editingRole, form]);

    const onFinish = async (values) => {
        setLoading(true);
        const url = editingRole 
            ? config.Calibmaster.URL + "/api/roles/update" 
            : config.Calibmaster.URL + "/api/roles/create";
        
        const body = editingRole 
            ? { ...values, id: editingRole.id, labId: auth.labId } 
            : { ...values, labId: auth.labId };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (data.code === 200) {
                GlobalNotification.success({ 
                    title: editingRole ? "Role Updated" : "Role Created",
                    description: `Role "${values.name}" has been ${editingRole ? "updated" : "created"} successfully.`
                });
                form.resetFields();
                onSuccess();
            } else {
                GlobalNotification.error({ title: "Operation Failed", description: data.message });
            }
        } catch (err) {
            GlobalNotification.error({ title: "Network Error", description: "Failed to connect to server" });
        } finally {
            setLoading(false);
        }
    };

    const flattenGroupPerms = (group) => {
        const items = PERMISSIONS_GROUPS[group] || [];
        return items.reduce((acc, item) => {
            if (typeof item === 'string') {
                acc.push(item);
            } else {
                acc.push(item.parent, ...item.children);
            }
            return acc;
        }, []);
    };

    const handleTogglePermission = (permission, checked) => {
        const currentPerms = form.getFieldValue("permissions") || [];
        let newPerms = [...currentPerms];

        if (checked) {
            // Add the permission
            if (!newPerms.includes(permission)) {
                newPerms.push(permission);
            }

            // AUTO-ENABLE PARENT: If this is a child permission, ensure parent is also enabled
            Object.values(PERMISSIONS_GROUPS).forEach(group => {
                group.forEach(item => {
                    if (typeof item === 'object' && item.children.includes(permission)) {
                        if (!newPerms.includes(item.parent)) {
                            newPerms.push(item.parent);
                        }
                    }
                });
            });
        } else {
            newPerms = newPerms.filter(p => p !== permission);
            
            // When parent (LIST_*) is turned OFF, also turn off its children for clean UX
            Object.values(PERMISSIONS_GROUPS).forEach(group => {
                group.forEach(item => {
                    if (typeof item === 'object' && item.parent === permission) {
                        newPerms = newPerms.filter(p => !item.children.includes(p));
                    }
                });
            });
        }

        form.setFieldsValue({ permissions: [...new Set(newPerms)] });
        setRefresh(prev => prev + 1);
    };

    const handleSelectAll = (group, checked) => {
        const groupPerms = flattenGroupPerms(group);
        const currentPerms = form.getFieldValue("permissions") || [];
        const otherPerms = currentPerms.filter(p => !groupPerms.includes(p));
        
        if (checked) {
            form.setFieldsValue({ permissions: [...new Set([...otherPerms, ...groupPerms])] });
        } else {
            form.setFieldsValue({ permissions: otherPerms });
        }
        setRefresh(prev => prev + 1);
    };

    const renderPermissionSwitch = (p, isChild = false) => (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: isChild ? '10px 16px' : '14px 20px', 
            background: isChild ? '#f9f9f9' : '#fff', 
            border: isChild ? 'none' : '1px solid #e8e8e8', 
            borderRadius: isChild ? '0' : '10px',
            borderLeft: isChild ? '4px solid #1890ff' : '1px solid #e8e8e8',
            marginBottom: isChild ? '1px' : '16px',
            transition: 'all 0.3s ease',
            boxShadow: isChild ? 'none' : '0 2px 4px rgba(0,0,0,0.02)',
            width: '100%'
        }}>
            <span style={{ 
                fontSize: isChild ? '13px' : '14px', 
                color: '#262626', 
                fontWeight: isChild ? 400 : 500,
                letterSpacing: '0.01em'
            }}>
                {p.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
            </span>
            <Switch 
                size="small"
                checked={(form.getFieldValue("permissions") || []).includes(p)}
                onChange={(checked) => handleTogglePermission(p, checked)}
                onClick={(e) => e.stopPropagation()}
                style={{ marginLeft: '12px' }}
            />
        </div>
    );

    return (
        <div style={{ maxWidth: 1150, margin: '0 auto', padding: '10px', fontFamily: "'Inter', sans-serif" }}>
            <Card 
                title={
                    <Space size="middle">
                        <div style={{ background: '#e6f7ff', padding: '10px', borderRadius: '12px' }}>
                            <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: '22px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '20px', fontWeight: 800, color: '#141414', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>
                                {editingRole ? "Update Role Configuration" : "Establish New Role"}
                            </span>
                            <span style={{ fontSize: '13px', color: '#8c8c8c', fontWeight: 400, fontFamily: "'Inter', sans-serif" }}>
                                Define granular system access and security privileges for the organization
                            </span>
                        </div>
                    </Space>
                }
                bordered={false}
                style={{ borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                bodyStyle={{ padding: '32px' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ permissions: [] }}
                >
                    <Row gutter={32}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="name"
                                label={<span style={{ fontWeight: 700, color: '#434343', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>ROLE IDENTIFIER</span>}
                                rules={[{ required: true, message: "Role name is required" }]}
                            >
                                <Input placeholder="e.g. Technical Lead" size="large" style={{ borderRadius: '10px', height: '45px', fontFamily: "'Inter', sans-serif" }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="description"
                                label={<span style={{ fontWeight: 700, color: '#434343', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>OPERATIONAL SCOPE</span>}
                            >
                                <Input placeholder="Primary responsibilities of this role" size="large" style={{ borderRadius: '10px', height: '45px', fontFamily: "'Inter', sans-serif" }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider style={{ margin: '32px 0' }}>
                        <Space style={{ color: '#bfbfbf' }}>
                            <AppstoreOutlined />
                            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>Security Architecture</span>
                        </Space>
                    </Divider>

                    <Row gutter={0} style={{ border: '1px solid #e8e8e8', borderRadius: '16px', background: '#fff', minHeight: '500px', maxHeight: '70vh', overflow: 'hidden', display: 'flex' }}>
                        {/* Sidebar Column */}
                        <Col span={6} style={{ 
                            padding: 0, 
                            borderRight: '1px solid #e8e8e8', 
                            background: '#fcfcfc',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            minHeight: '500px',
                            maxHeight: '70vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{ flex: 1 }}>
                                <Menu
                                    mode="inline"
                                    selectedKeys={[activeGroup]}
                                    onClick={({ key }) => setActiveGroup(key)}
                                    style={{ 
                                        borderRight: 0, 
                                        background: 'transparent', 
                                        padding: '12px 8px' 
                                    }}
                                    items={Object.keys(PERMISSIONS_GROUPS).map(group => ({
                                        key: group,
                                        label: group,
                                        className: activeGroup === group ? 'custom-active-sidebar-item' : 'custom-inactive-sidebar-item'
                                    }))}
                                />
                            </div>
                            <style>{`
                                .custom-active-sidebar-item {
                                    background: #1890ff !important;
                                    color: #fff !important;
                                    border-radius: 8px !important;
                                    margin: 4px 0 !important;
                                    font-weight: 600 !important;
                                    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
                                }
                                .custom-active-sidebar-item span {
                                    color: #fff !important;
                                }
                                .custom-inactive-sidebar-item {
                                    margin: 4px 0 !important;
                                    border-radius: 8px !important;
                                    transition: all 0.2s !important;
                                }
                                .custom-inactive-sidebar-item:hover {
                                    background: #f0f7ff !important;
                                    color: #1890ff !important;
                                }
                                .ant-menu-item-selected {
                                    background: #1890ff !important;
                                }
                            `}</style>
                        </Col>

                        {/* Content Column */}
                        <Col span={18} style={{ background: '#fff', display: 'flex', flexDirection: 'column', minHeight: '500px', maxHeight: '70vh', overflow: 'hidden' }}>
                            {/* Unified Header */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '20px 28px', 
                                background: '#fff', 
                                borderBottom: '1px solid #e8e8e8',
                                zIndex: 10
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#262626' }}>{activeGroup}</h3>
                                    <Tag color="blue" style={{ borderRadius: '6px', fontSize: '12px', padding: '0 10px', border: 'none', background: '#e6f7ff', color: '#1890ff', fontWeight: 600 }}>
                                        {flattenGroupPerms(activeGroup).length} Control Points
                                    </Tag>
                                </div>
                                <Space size="middle">
                                    <Button
                                        size="small"
                                        style={{ fontSize: '12px', borderRadius: '6px' }}
                                        onClick={() => {
                                            // Expand All: set all group permissions' Collapse panels open
                                            const allParents = PERMISSIONS_GROUPS[activeGroup]
                                                .filter(item => typeof item === 'object')
                                                .map(item => item.parent);
                                            setExpandAll(allParents);
                                        }}
                                    >
                                        Expand All
                                    </Button>
                                    <Button
                                        size="small"
                                        style={{ fontSize: '12px', borderRadius: '6px' }}
                                        onClick={() => setExpandAll([])}
                                    >
                                        Collapse All
                                    </Button>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#8c8c8c' }}>Grant All Access</span>
                                    <Switch 
                                        size="default"
                                        checked={flattenGroupPerms(activeGroup).every(p => (form.getFieldValue("permissions") || []).includes(p))}
                                        onChange={(checked) => handleSelectAll(activeGroup, checked)}
                                    />
                                </Space>
                            </div>
                            
                            {/* Scrollable Permissions List */}
                             <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                                <Form.Item name="permissions" noStyle>
                                    <div>
                                        {PERMISSIONS_GROUPS[activeGroup].map((item, idx) => {
                                            if (typeof item === 'string') {
                                                return <div key={item}>{renderPermissionSwitch(item)}</div>;
                                            } else {
                                                return (
                                                    <Collapse 
                                                        ghost 
                                                        key={item.parent}
                                                        activeKey={expandAll.includes(item.parent) ? [idx] : undefined}
                                                        expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: '12px', color: '#bfbfbf' }} />}
                                                        onChange={(keys) => {
                                                            if (keys.length > 0) {
                                                                setExpandAll(prev => [...new Set([...prev, item.parent])]);
                                                            } else {
                                                                setExpandAll(prev => prev.filter(k => k !== item.parent));
                                                            }
                                                        }}
                                                        style={{ 
                                                            marginBottom: '16px', 
                                                            border: '1px solid #e8e8e8', 
                                                            borderRadius: '12px', 
                                                            background: '#fff',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <Panel 
                                                            header={
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '8px' }}>
                                                                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#141414' }}>
                                                                        {item.parent.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                                                                    </span>
                                                                    <Switch 
                                                                        size="small"
                                                                        checked={(form.getFieldValue("permissions") || []).includes(item.parent)}
                                                                        onChange={(checked) => handleTogglePermission(item.parent, checked)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                            }
                                                            key={idx}
                                                            style={{ border: 'none' }}
                                                        >
                                                            <div style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '4px 0' }}>
                                                                {item.children.map(child => (
                                                                    <div key={child}>{renderPermissionSwitch(child, true)}</div>
                                                                ))}
                                                            </div>
                                                        </Panel>
                                                    </Collapse>
                                                );
                                            }
                                        })}
                                    </div>
                                </Form.Item>
                            </div>
                        </Col>
                    </Row>

                    <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                        <Button size="large" style={{ borderRadius: '10px', padding: '0 40px', height: '48px', fontWeight: 500 }} onClick={onSuccess}>
                            Discard
                        </Button>
                        <Button type="primary" htmlType="submit" size="large" style={{ borderRadius: '10px', padding: '0 60px', height: '48px', fontWeight: 700, background: '#1890ff', boxShadow: '0 8px 20px rgba(24, 144, 255, 0.3)' }} loading={loading}>
                            {editingRole ? "Update Permissions" : "Initialize Role"}
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default CreateRole;
