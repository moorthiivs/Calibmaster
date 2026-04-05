/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Modal, Checkbox, Spin, Empty } from "antd";

const ExcelPermissionModal = ({
  visible,
  onClose,
  onSave,
  users = [], // List of all users to extract roles/departments
  initialPermissions = [], // List of roles already restricted
  isLoading = false
}) => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    if (visible && users) {
      // Extract unique departments handling nulls/undefined
      const roles = [
        ...new Set(
          users
            .map((u) => u.department)
            .filter((d) => d && d.toLowerCase() !== "admin") // Exclude admin
        ),
      ].sort();
      setAvailableRoles(roles);
      // Initialize selection with existing permissions
      // Ensure we only show valid roles from the current list (optional)
      setSelectedRoles(initialPermissions || []);
    }
  }, [visible, users, initialPermissions]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRoles(availableRoles);
    } else {
      setSelectedRoles([]);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = () => {
    onSave(selectedRoles);
    onClose();
  };

  const isAllSelected =
    availableRoles.length > 0 && selectedRoles.length === availableRoles.length;
  const isIndeterminate =
    selectedRoles.length > 0 && selectedRoles.length < availableRoles.length;

  return (
    <Modal
      title="Cell Permission Settings"
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText="Save Permissions"
      width={400}
    >
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <Spin size="large" />
        </div>
      ) : availableRoles.length === 0 ? (
        <Empty description="No other roles found (excluding Admin)" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p>Select roles that should have <b>READ-ONLY</b> access to the selected cell(s).</p>
          
          <div style={{ borderBottom: '1px solid #eee', paddingBottom: 8 }}>
            <Checkbox
              indeterminate={isIndeterminate}
              checked={isAllSelected}
              onChange={handleSelectAll}
            >
              Select All Roles
            </Checkbox>
          </div>
          
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableRoles.map((role) => (
              <Checkbox
                key={role}
                checked={selectedRoles.includes(role)}
                onChange={() => handleRoleChange(role)}
              >
                {role}
              </Checkbox>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExcelPermissionModal;
