import React, { useState, useEffect, useContext } from "react";
import { Table, Button, Space, Card, Tag, Modal, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../context/auth-context";
import { usePermissions } from "../../../hooks/usePermissions";
import config from "../../../utils/config.json";
import CreateRole from "./CreateRole";
import GlobalNotification from "../../../utils/GlobalNotification";

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const auth = useContext(AuthContext);
    const { hasPermission } = usePermissions();

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await fetch(config.Calibmaster.URL + "/api/roles/list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId }),
            });
            const data = await response.json();
            if (data.code === 200) {
                setRoles(data.data);
            }
        } catch (err) {
            message.error("Failed to fetch roles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async (id) => {
        Modal.confirm({
            title: "Are you sure you want to delete this role?",
            content: "This action cannot be undone.",
            onOk: async () => {
                try {
                    const response = await fetch(config.Calibmaster.URL + "/api/roles/delete", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + auth.token,
                        },
                        body: JSON.stringify({ id }),
                    });
                    const data = await response.json();
                    if (data.code === 200) {
                        GlobalNotification.success({ title: "Role Deleted" });
                        fetchRoles();
                    } else {
                        message.error(data.message);
                    }
                } catch (err) {
                    message.error("Failed to delete role");
                }
            },
        });
    };

    const columns = [
        {
            title: "Role Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
        },
        {
            title: "Permissions",
            dataIndex: "permissions",
            key: "permissions",
            render: (permissions) => (
                <div style={{ maxWidth: 400, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(permissions || []).slice(0, 5).map((p) => (
                        <Tag color="blue" key={p}>{p}</Tag>
                    ))}
                    {(permissions || []).length > 5 && <Tag>+{(permissions || []).length - 5} more</Tag>}
                </div>
            ),
        },
        {
            title: "Last Modified",
            dataIndex: "updatedAt",
            key: "updatedAt",
            render: (date) => date ? new Date(date).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric"
            }) : "—",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    {hasPermission("EDIT_ROLE") && (
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditingRole(record);
                                setIsModalOpen(true);
                            }}
                        />
                    )}
                    {hasPermission("DELETE_ROLE") && (
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card
                title="Role Management"
                extra={
                    hasPermission("ACCESS_ROLES") && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingRole(null);
                                setIsModalOpen(true);
                            }}
                        >
                            Create Role
                        </Button>
                    )
                }
            >
                <Table
                    columns={columns}
                    dataSource={roles}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            <Modal
                title={editingRole ? "Edit Role" : "Create Role"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={1200}
            >
                <CreateRole
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchRoles();
                    }}
                    editingRole={editingRole}
                />
            </Modal>
        </div>
    );
};

export default Roles;
