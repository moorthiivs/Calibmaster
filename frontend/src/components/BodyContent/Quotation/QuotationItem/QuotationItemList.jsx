import React from 'react';
import { Card, Input, Table, ButtonIcon, TableWithBrowserPagination, Column, Button } from 'react-rainbow-components';
import "./QuotationTable.css"


const QuotationItemList = ({ items, deleteItemHandler }) => {
  const DeleteButton = ({ row }) => (
    <Button
      variant="destructive"
      label="Delete"
      onClick={() => {
        deleteItemHandler(row.id);
      }}
    />
  );

  return (
    <Card style={{ width: '97%' }}>
      <div className="items__label">
        <h2 className="text-lg font-bold my-5 text-center">Item List</h2>
      </div>
      <TableWithBrowserPagination
        pageSize={7}
        data={items}
        keyField="index"
      >
        <Column header="S.No" field="index" />
        <Column header="Description of Item" field="itemDescription" />
        <Column header="Range/Model" field="range_model" />
        <Column header="Remarks" field="remarks" />
        <Column header="Quantity" field="qty" />
        <Column header="Unit Price" field="unitPrice" />
        <Column header="Delete" field="srf_item_id" component={DeleteButton} />

      </TableWithBrowserPagination>

    </Card>
  )
}

export default QuotationItemList;
