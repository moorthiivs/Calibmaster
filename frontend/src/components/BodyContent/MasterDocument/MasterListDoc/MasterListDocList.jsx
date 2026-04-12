import React, { useContext, useEffect, useState } from 'react';
import { Button, ButtonIcon, Card, Column, Modal, TableWithBrowserPagination } from 'react-rainbow-components';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.js";
import { format } from 'date-fns';
import MasterListDocEdit from './MasterListDocEdit';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

function MasterListDocList() {

  const auth = useContext(AuthContext);
  const [docs, setDocs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const fetchDocs = async () => {
    try {
      const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs/fetchAll?labid=${auth.labId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocs(data);
    } catch (error) {
      console.error('Error fetching docs:', error.message);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [auth.labId, auth.token]);


  const handleEdit = (mslId) => {
    setSelectedDocId(mslId);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedDocId(null);
  };

  const EditBtn = ({ row }) => (
    <Button
      label="Edit"
      variant="success"
      className="rainbow-m-around_medium"
      onClick={() => handleEdit(row.mslId)}
    />
  );

  return (
    <div>
      <Card style={{ width: "100%" }}>
        <h3 style={{ textAlign: "center" }} className="text-lg font-bold my-5">Document List</h3>
        <TableWithBrowserPagination
          className="labs__table"
          pageSize={15}
          data={docs}
          keyField="mslId"
        >
          <Column header="Sr No" component={({ index }) => index + 1} cellAlignment="center" />
          <Column header="Document Name" field="mslDocName" cellAlignment="center" />
          <Column header="Revision No" field="mslDocRevisionNo" cellAlignment="center" />
          <Column
            header="Revision Date"
            component={(rowData) => {
              if (!rowData) return '';
              const date = rowData.row.mslRevDateStart;
              return date ? format(new Date(date), 'dd-MM-yyyy') : '';
            }}
            cellAlignment="center"
          />
          <Column
            header="Action"
            field="mslId"
            component={EditBtn}
            cellAlignment="center"
          />
        </TableWithBrowserPagination>
      </Card>


      <Modal isOpen={isOpen} onRequestClose={() => { }} size="large" hideCloseButton={true}>
        <div style={{ textAlign: 'right', marginBottom: '10px' }} onClick={closeModal}>
          <ButtonIcon variant="border-filled" icon={<FontAwesomeIcon icon={faTimes} />} />
        </div>
        {selectedDocId && (
          <MasterListDocEdit
            mslId={selectedDocId}
            onClose={closeModal}
            onUpdate={fetchDocs}
          />
        )}
      </Modal>
    </div>
  );
}

export default MasterListDocList;
