import React, { useContext, useEffect, useState } from 'react';
import { Button, ButtonIcon, Card, Column, Modal, TableWithBrowserPagination } from 'react-rainbow-components';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.json";
import { differenceInYears, format, parseISO } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import MasterListDocDetailEdit from './MasterListDocDetailEdit';

function MasterListDocDetailList() {

  const auth = useContext(AuthContext);
  const [docsDetails, setDocsDetails] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);


  const fetchDocs = async () => {
    try {
      const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs-details/fetchAll?labid=${auth.labId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();

      console.log(data);

      setDocsDetails(data);
    } catch (error) {
      console.error('Error fetching docs:', error.message);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [auth.labId, auth.token]);


  const handleEdit = (detailId) => {
    setSelectedDocId(detailId);
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
      onClick={() => {
        handleEdit(row.detailId)
      }}
    />
  );

  return (
    <div>
      <Card style={{ width: "100%" }}>

        <h3 style={{ textAlign: "center" }} className="text-lg font-bold my-5">Document List</h3>

        <TableWithBrowserPagination
          className="labs__table"
          pageSize={15}
          data={docsDetails}
          keyField="detailId"
        >
          <Column header="Sr No" component={({ index }) => index + 1} cellAlignment="center" />
          <Column header="groupName" field="groupName" cellAlignment="center" />
          <Column header="docNumber" field="docNumber" cellAlignment="center" />
          <Column header="docTitle" field="docTitle" cellAlignment="center" />
          <Column header="revisionNo" field="revisionNo" cellAlignment="center" />
          <Column
            header="Issue/Rev. Date"
            component={(rowData) => {
              if (!rowData) return '';
              const date = rowData.row.issueRevDate;
              return date ? format(new Date(date), 'dd-MM-yyyy') : '';
            }}
            cellAlignment="center"
          />

          <Column
            header="Effective Date"
            component={(rowData) => {
              if (!rowData) return '';
              const date = rowData.row.effectiveStartDate;
              return date ? format(new Date(date), 'dd-MM-yyyy') : '';
            }}
            cellAlignment="center"
          />
          <Column
            header="Retention Period"
            component={(rowData) => {
              if (!rowData) return '';
              const start = rowData.row.effectiveStartDate;
              const end = rowData.row.effectiveEndDate;
              if (!start || !end) return '';
              const startDate = typeof start === 'string' ? parseISO(start) : new Date(start);
              const endDate = typeof end === 'string' ? parseISO(end) : new Date(end);
              const years = differenceInYears(endDate, startDate);
              return `${years} year${years !== 1 ? 's' : ''}`;
            }}
            cellAlignment="center"
          />


          <Column
            header="Action"
            field="detailId"
            component={EditBtn}
            cellAlignment={"center"}
          />
        </TableWithBrowserPagination>

      </Card>

      <Modal isOpen={isOpen}  size="large" hideCloseButton={true}>
        <div style={{ textAlign: 'right', marginBottom: '10px' }} onClick={closeModal}>
          <ButtonIcon variant="border-filled" icon={<FontAwesomeIcon icon={faTimes} />} />
        </div>
        {selectedDocId && (
          <MasterListDocDetailEdit
            detailId={selectedDocId}
            onClose={closeModal}
            onUpdate={fetchDocs}
          />
        )}
      </Modal>
    </div>
  );
}

export default MasterListDocDetailList;
