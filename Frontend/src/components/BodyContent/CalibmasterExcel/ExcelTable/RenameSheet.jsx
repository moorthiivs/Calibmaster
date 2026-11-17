import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from 'antd';

function RenameSheet({ sheetName, sheetNames = [], isopen, onclose, onRename }) {
  const [newSheetName, setNewSheetName] = useState(sheetName);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setNewSheetName(sheetName);
    setErrorMessage('');
  }, [sheetName, isopen]);

  const validate = (name) => {
    const trimmed = name.trim();

    if (trimmed === '') {
      setErrorMessage('Sheet name cannot be empty.');
      return false;
    }

    if (trimmed === sheetName.trim()) {
      setErrorMessage('Please enter a different name.');
      return false;
    }

    if (sheetNames.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setErrorMessage('A sheet with this name already exists. Please choose another.');
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setErrorMessage(
        'Only letters, numbers, underscores, and hyphens are allowed. No spaces.'
      );
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Remove all characters except letters, numbers, underscores, hyphens
    const cleanedValue = value.replace(/[^a-zA-Z0-9_-]/g, '');
    setNewSheetName(cleanedValue);
    validate(cleanedValue);
  };

  const handleRename = () => {
    if (validate(newSheetName)) {
      onRename(newSheetName.trim());
      onclose();
    }
  };

  const isSaveDisabled =
    newSheetName.trim() === '' ||
    newSheetName.trim() === sheetName.trim() ||
    !!errorMessage;

  return (
    <Modal
      open={isopen}
      title="Rename Sheet"
      onCancel={onclose}
      footer={[
        <Button key="cancel" onClick={onclose}>
          Cancel
        </Button>,
        <Button
          key="rename"
          type="primary"
          onClick={handleRename}
          disabled={isSaveDisabled}
        >
          Rename
        </Button>,
      ]}
    >
      <Input
        placeholder="Enter new sheet name (no spaces or special characters)"
        value={newSheetName}
        onChange={handleInputChange}
        status={errorMessage ? 'error' : ''}
      />
      {errorMessage && (
        <div style={{ color: 'red', marginTop: 6 }}>{errorMessage}</div>
      )}
    </Modal>
  );
}

export default RenameSheet;
