import React, { useEffect, useState } from "react";
import { Form, Input, Button, Row, Col, Divider, Card, Space, Tag, Tooltip, Menu, Switch, Collapse, Modal } from "antd";
import { useContext } from "react";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";
import { InfoCircleOutlined, SafetyCertificateOutlined, AppstoreOutlined, RightOutlined } from "@ant-design/icons";

const { Panel } = Collapse;



// PERMISSIONS_GROUPS is now loaded dynamically from the backend API

const CreateRole = ({ onSuccess, editingRole }) => {
    const [form] = Form.useForm();
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [schemaLoading, setSchemaLoading] = useState(true);
    const [groups, setGroups] = useState({});
    const [descriptions, setDescriptions] = useState({});
    const [dependencies, setDependencies] = useState({});
    const [activeGroup, setActiveGroup] = useState("");
    const [refresh, setRefresh] = useState(0);
    const [expandAll, setExpandAll] = useState([]);
    const [apiDepModal, setApiDepModal] = useState({
        visible: false,
        triggerPermission: null,
        apiDeps: [],
        selectedDeps: [],
        pendingPerms: []
    });

    const [disableDepModal, setDisableDepModal] = useState({
        visible: false,
        triggerPermission: null,
        forcedDisable: [],
        optionalDisable: [],
        selectedOptional: [],
        pendingPerms: []
    });

    // Fetch Permission Schema from Backend
    useEffect(() => {
        const fetchSchema = async () => {
            try {
                const response = await fetch(config.Calibmaster.URL + "/api/permissions/schema", {
                    headers: { Authorization: "Bearer " + auth.token },
                });
                const data = await response.json();
                if (data.code === 200) {
                    setGroups(data.data.groups);
                    setDescriptions(data.data.descriptions || {});
                    setDependencies(data.data.dependencies || {});
                    // Set first group as active by default
                    const firstGroup = Object.keys(data.data.groups)[0];
                    if (firstGroup) setActiveGroup(firstGroup);
                } else {
                    GlobalNotification.error({ title: "Sync Error", description: "Failed to load permission registry" });
                }
            } catch (err) {
                GlobalNotification.error({ title: "Connection Error", description: "Backend unreachable" });
            } finally {
                setSchemaLoading(false);
            }
        };
        fetchSchema();
    }, [auth.token]);

    useEffect(() => {
        if (editingRole) {
            form.setFieldsValue({
                name: editingRole.name,
                description: editingRole.description,
                permissions: editingRole.permissions || [],
            });
            setRefresh(prev => prev + 1);
        } else {
            form.resetFields();
            form.setFieldsValue({ permissions: [] });
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

                // If the updated role is the current user's role, sync permissions immediately
                if (editingRole && editingRole.id === auth.roleId) {
                    auth.updatePermissions(values.permissions || []);
                    GlobalNotification.info({
                        title: "Permissions Synced",
                        description: "Your own role was updated. Permissions have been refreshed."
                    });
                }

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
        const items = groups[group] || [];
        return items.reduce((acc, item) => {
            if (typeof item === 'string') {
                acc.push(item);
            } else {
                acc.push(item.parent, ...item.children);
            }
            return acc;
        }, []);
    };

    // Helper to format technical keys (CREATE_SRF -> Create Srf)
    const formatPermissionName = (p) => {
        return p.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    };

    const getDepPerm = (dep) => typeof dep === 'string' ? dep : dep.perm;
    const isApiScoped = (dep) => typeof dep === 'object' && dep.scope === 'api';

    // Find which enabled permissions depend on the given permission
    const getActiveDependents = (permission) => {
        const currentPerms = form.getFieldValue("permissions") || [];
        return Object.entries(dependencies)
            .filter(([parent, children]) => currentPerms.includes(parent) && children.some(d => getDepPerm(d) === permission))
            .map(([parent]) => parent);
    };

    const handleTogglePermission = (permission, checked) => {
        const currentPerms = form.getFieldValue("permissions") || [];
        let newPerms = [...currentPerms];

        if (checked) {
            // Add the permission
            if (!newPerms.includes(permission)) {
                newPerms.push(permission);
            }

            // AUTO-ENABLE DEPENDENCIES (Cross-group dependencies)
            if (dependencies[permission]) {
                const screenDeps = dependencies[permission].filter(d => !isApiScoped(d));
                const apiDeps = dependencies[permission].filter(d => isApiScoped(d));

                screenDeps.forEach(dep => {
                    const depPerm = getDepPerm(dep);
                    if (!newPerms.includes(depPerm)) newPerms.push(depPerm);
                });

                if (apiDeps.length > 0) {
                    setApiDepModal({
                        visible: true,
                        triggerPermission: permission,
                        apiDeps,
                        selectedDeps: apiDeps.filter(d => d.defaultScreen).map(d => getDepPerm(d)),
                        pendingPerms: newPerms
                    });
                    return;
                }
            }

            // AUTO-ENABLE PARENT: If this is a child permission, ensure parent is also enabled
            Object.values(groups).forEach(group => {
                group.forEach(item => {
                    if (typeof item === 'object' && item.children.includes(permission)) {
                        if (!newPerms.includes(item.parent)) {
                            newPerms.push(item.parent);
                        }
                    }
                });
            });
        } else {
            // DISABLING
            // Recursive function to get all deep dependents
            const getDeepDependents = (permToDisable, current) => {
                let deps = current.filter(p => dependencies[p] && dependencies[p].some(d => getDepPerm(d) === permToDisable));
                let allDeps = [...deps];
                deps.forEach(d => {
                    allDeps = [...allDeps, ...getDeepDependents(d, current)];
                });
                return [...new Set(allDeps)];
            };
            const activeDependents = getDeepDependents(permission, currentPerms);

            let activeChildren = [];
            Object.values(groups).forEach(group => {
                group.forEach(item => {
                    if (typeof item === 'object' && item.parent === permission) {
                        activeChildren = item.children.filter(child => currentPerms.includes(child) && !activeDependents.includes(child));
                    }
                });
            });

            // Find all dependencies that were required by the permission being disabled (or its strict dependents)
            // that are NO LONGER required by any remaining active permissions.
            let orphanedDeps = [];
            const permsBeingDisabled = [permission, ...activeDependents, ...activeChildren];
            const remainingPerms = currentPerms.filter(p => !permsBeingDisabled.includes(p));

            permsBeingDisabled.forEach(p => {
                if (dependencies[p]) {
                    dependencies[p].forEach(dep => {
                        const depPerm = getDepPerm(dep);
                        // If it's still enabled and not already queued to be disabled
                        if (currentPerms.includes(depPerm) && !permsBeingDisabled.includes(depPerm) && !orphanedDeps.find(o => o.perm === depPerm)) {
                            // Does any REMAINING permission still require this?
                            const stillRequired = remainingPerms.some(rp => dependencies[rp] && dependencies[rp].some(d => getDepPerm(d) === depPerm));
                            if (!stillRequired) {
                                orphanedDeps.push({ perm: depPerm, isApi: isApiScoped(dep) });
                            }
                        }
                    });
                }
            });

            if (activeDependents.length > 0 || activeChildren.length > 0 || orphanedDeps.length > 0) {
                setDisableDepModal({
                    visible: true,
                    triggerPermission: permission,
                    forcedDisable: activeDependents,
                    optionalDisable: [
                        ...activeChildren.map(c => ({ perm: c, type: 'Child Screen' })),
                        ...orphanedDeps.map(d => ({ perm: d.perm, type: d.isApi ? 'API Dependency' : 'Screen Dependency' }))
                    ],
                    selectedOptional: [...activeChildren, ...orphanedDeps.map(d => d.perm)],
                    pendingPerms: currentPerms.filter(p => p !== permission && !activeDependents.includes(p))
                });
                return;
            }

            newPerms = newPerms.filter(p => p !== permission);
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
            // Unselect All: only keep permissions that have dependents OUTSIDE this group
            let nextPerms = [...otherPerms];
            let changed = true;

            // Iteratively add permissions from the group that are required by the remaining set
            // (Handles dependency chains)
            while (changed) {
                changed = false;
                for (const p of groupPerms) {
                    if (!nextPerms.includes(p)) {
                        const activeDeps = Object.entries(dependencies)
                            .filter(([parent, children]) => nextPerms.includes(parent) && children.some(d => getDepPerm(d) === p));

                        if (activeDeps.length > 0) {
                            nextPerms.push(p);
                            changed = true;
                        }
                    }
                }
            }

            form.setFieldsValue({ permissions: nextPerms });
        }
        setRefresh(prev => prev + 1);
    };

    const renderPermissionSwitch = (p, isChild = false) => {
        const activeDependents = getActiveDependents(p);
        const hasDependents = activeDependents.length > 0;

        return (
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
                width: '100%',
                opacity: 1
            }}>
                <span style={{
                    fontSize: isChild ? '13px' : '14px',
                    color: '#262626',
                    fontWeight: isChild ? 400 : 500,
                    letterSpacing: '0.01em',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    flex: 1,
                }}>
                    <span>{formatPermissionName(p)}</span>
                    {descriptions[p] && (
                        <span style={{
                            fontSize: '11px',
                            color: '#8c8c8c',
                            fontWeight: 400,
                            lineHeight: '1.4',
                            letterSpacing: '0',
                        }}>
                            {descriptions[p]}
                        </span>
                    )}
                </span>
                {hasDependents ? (
                    <Tooltip
                        title={`Required by ${activeDependents.map(d => formatPermissionName(d)).join(", ")}`}
                        placement="left"
                    >
                        <div style={{ display: 'inline-block' }}>
                            <Switch
                                size="small"
                                checked={(form.getFieldValue("permissions") || []).includes(p)}
                                onChange={(checked) => handleTogglePermission(p, checked)}
                                onClick={(_, e) => e && e.stopPropagation()}
                                style={{ marginLeft: '12px' }}
                            />
                        </div>
                    </Tooltip>
                ) : (
                    <div style={{ display: 'inline-block' }}>
                        <Switch
                            size="small"
                            checked={(form.getFieldValue("permissions") || []).includes(p)}
                            onChange={(checked) => handleTogglePermission(p, checked)}
                            onClick={(_, e) => e && e.stopPropagation()}
                            style={{ marginLeft: '12px' }}
                        />
                    </div>
                )}
            </div>
        );
    };

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

                style={{ borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
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
                                    items={Object.keys(groups).map(group => {
                                        const groupPerms = flattenGroupPerms(group);
                                        const currentPerms = form.getFieldValue("permissions") || [];
                                        const enabledCount = groupPerms.filter(p => currentPerms.includes(p)).length;
                                        const totalCount = groupPerms.length;
                                        const isActive = activeGroup === group;
                                        const allEnabled = enabledCount === totalCount && totalCount > 0;
                                        const noneEnabled = enabledCount === 0;

                                        return {
                                            key: group,
                                            label: (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                    <span>{group}</span>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        padding: '1px 7px',
                                                        borderRadius: '10px',
                                                        minWidth: '36px',
                                                        textAlign: 'center',
                                                        background: isActive
                                                            ? 'rgba(255,255,255,0.25)'
                                                            : allEnabled
                                                                ? '#f6ffed'
                                                                : noneEnabled
                                                                    ? '#f5f5f5'
                                                                    : '#e6f7ff',
                                                        color: isActive
                                                            ? '#fff'
                                                            : allEnabled
                                                                ? '#52c41a'
                                                                : noneEnabled
                                                                    ? '#bfbfbf'
                                                                    : '#1890ff',
                                                        border: isActive
                                                            ? '1px solid rgba(255,255,255,0.4)'
                                                            : allEnabled
                                                                ? '1px solid #b7eb8f'
                                                                : noneEnabled
                                                                    ? '1px solid #e8e8e8'
                                                                    : '1px solid #91d5ff',
                                                        lineHeight: '18px',
                                                        transition: 'all 0.3s ease'
                                                    }}>
                                                        {enabledCount}/{totalCount}
                                                    </span>
                                                </div>
                                            ),
                                            className: isActive ? 'custom-active-sidebar-item' : 'custom-inactive-sidebar-item'
                                        };
                                    })}
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
                                            const allParents = groups[activeGroup]
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
                                        {(groups[activeGroup] || []).map((item, idx) => {
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
                                                                        {formatPermissionName(item.parent)}
                                                                    </span>
                                                                    <Tooltip
                                                                        title={getActiveDependents(item.parent).length > 0 ? `Linked to ${getActiveDependents(item.parent).map(d => formatPermissionName(d)).join(", ")}` : ""}
                                                                        placement="left"
                                                                    >
                                                                        <div style={{ display: 'inline-block' }}>
                                                                            <Switch
                                                                                size="small"
                                                                                checked={(form.getFieldValue("permissions") || []).includes(item.parent)}
                                                                                onChange={(checked) => handleTogglePermission(item.parent, checked)}
                                                                                onClick={(_, e) => e && e.stopPropagation()}
                                                                            />
                                                                        </div>
                                                                    </Tooltip>
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

            <Modal
                title={`Additional Access for "${formatPermissionName(apiDepModal.triggerPermission || '')}"`}
                open={apiDepModal.visible}
                onOk={() => {
                    const finalPerms = [...apiDepModal.pendingPerms];
                    apiDepModal.selectedDeps.forEach(dep => {
                        if (!finalPerms.includes(dep)) finalPerms.push(dep);
                    });
                    form.setFieldsValue({ permissions: [...new Set(finalPerms)] });
                    setRefresh(prev => prev + 1);
                    setApiDepModal({ visible: false, triggerPermission: null, apiDeps: [], selectedDeps: [], pendingPerms: [] });
                }}
                onCancel={() => {
                    // Revert the action completely if cancelled
                    setApiDepModal({ visible: false, triggerPermission: null, apiDeps: [], selectedDeps: [], pendingPerms: [] });
                }}
                okText="Confirm"
                cancelText="Cancel"
            >
                <p style={{ marginBottom: 16, color: '#595959' }}>
                    The following permissions are required at <strong>API level</strong> for this action to work.
                    Check any that should also show a <strong>screen / menu item</strong> for this role. 
                    <em>(Leave unchecked for API access only)</em>:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {apiDepModal.apiDeps.map(dep => {
                        const perm = getDepPerm(dep);
                        const checked = apiDepModal.selectedDeps.includes(perm);
                        return (
                            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', border: `1px solid ${checked ? '#1890ff' : '#e8e8e8'}`, borderRadius: 8, background: checked ? '#e6f7ff' : '#fafafa', transition: 'all 0.2s' }}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={e => {
                                        setApiDepModal(prev => ({
                                            ...prev,
                                            selectedDeps: e.target.checked
                                                ? [...prev.selectedDeps, perm]
                                                : prev.selectedDeps.filter(d => d !== perm)
                                        }));
                                    }}
                                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                                />
                                <span style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 600, color: '#262626' }}>{formatPermissionName(perm)}</span>
                                </span>
                                <span style={{ fontSize: 11, color: checked ? '#1890ff' : '#8c8c8c', fontWeight: 500 }}>
                                    {checked ? 'Screen + API' : 'API only'}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </Modal>
            <Modal
                title={`Disable Linked Permissions`}
                open={disableDepModal.visible}
                onOk={() => {
                    let finalPerms = [...disableDepModal.pendingPerms];
                    // Also remove the optional dependencies that the user kept checked
                    finalPerms = finalPerms.filter(p => !disableDepModal.selectedOptional.includes(p));
                    
                    form.setFieldsValue({ permissions: [...new Set(finalPerms)] });
                    setRefresh(prev => prev + 1);
                    setDisableDepModal({ visible: false, triggerPermission: null, forcedDisable: [], optionalDisable: [], selectedOptional: [], pendingPerms: [] });
                }}
                onCancel={() => {
                    setDisableDepModal({ visible: false, triggerPermission: null, forcedDisable: [], optionalDisable: [], selectedOptional: [], pendingPerms: [] });
                }}
                okText="Disable Selected"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
            >
                <p style={{ marginBottom: 16, color: '#595959' }}>
                    You are disabling <strong>{formatPermissionName(disableDepModal.triggerPermission || '')}</strong>.
                    This affects other linked permissions.
                </p>

                {disableDepModal.forcedDisable.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 600, color: '#cf1322', marginBottom: 8 }}>Must also be disabled (Strict Dependencies):</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {disableDepModal.forcedDisable.map(perm => (
                                <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid #ffa39e', borderRadius: 6, background: '#fff1f0', opacity: 0.8 }}>
                                    <input type="checkbox" checked readOnly style={{ width: 14, height: 14 }} />
                                    <span style={{ fontWeight: 500, color: '#a8071a' }}>{formatPermissionName(perm)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {disableDepModal.optionalDisable.length > 0 && (
                    <div>
                        <div style={{ fontWeight: 600, color: '#262626', marginBottom: 8 }}>Optional to disable (Children & API):</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {disableDepModal.optionalDisable.map(item => {
                                const checked = disableDepModal.selectedOptional.includes(item.perm);
                                return (
                                    <label key={item.perm} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', border: `1px solid ${checked ? '#1890ff' : '#e8e8e8'}`, borderRadius: 6, background: checked ? '#e6f7ff' : '#fafafa', transition: 'all 0.2s' }}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={e => {
                                                setDisableDepModal(prev => ({
                                                    ...prev,
                                                    selectedOptional: e.target.checked
                                                        ? [...prev.selectedOptional, item.perm]
                                                        : prev.selectedOptional.filter(p => p !== item.perm)
                                                }));
                                            }}
                                            style={{ width: 14, height: 14, cursor: 'pointer' }}
                                        />
                                        <span style={{ flex: 1, fontWeight: 500, color: '#262626' }}>{formatPermissionName(item.perm)}</span>
                                        <span style={{ fontSize: 11, color: checked ? '#1890ff' : '#8c8c8c' }}>{item.type}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CreateRole;
