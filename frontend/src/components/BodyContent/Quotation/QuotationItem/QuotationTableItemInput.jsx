import React, { useContext, useEffect, useState } from 'react';
import { Button, Input, Select, Spinner } from 'react-rainbow-components';
import "./QuotationTable.css"
import CustomButton from "../../../Inputs/CustomButton";
import config from "../../../../utils/config.js";
import QuotationItemList from './QuotationItemList';
import { populateInstrumentData } from '../../InstrumentType/HelperFunction';
import { useDispatch } from 'react-redux';
import { notificationActions } from "../../../../store/nofitication";
import { AuthContext } from '../../../../context/auth-context';
import Loader from '../../../UI/Loader';

const QuotationTableItemInput = ({ fetchData }) => {
  const [items, setitems] = useState([]);
  const [instrument, setInstrument] = useState([]);
  const [handleToggleButton, sethandleToggleButton] = useState(true);
  const [QuotationItems, setQuotationItems] = useState({
    itemDescription: '',
    range_model: '',
    remarks: '',
    qty: 1,
    unitPrice: 1,
  });
  const [error, setError] = useState("");
  const [loading, setloading] = useState(false);
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);

  async function fetchDataFromServer() {
    setloading(true);

    try {
      const instrumentResonse = await fetch(config.Calibmaster.URL + "/api/instrument/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ lab_id: auth.labId })
      }).then((res) => res.json());
      let getInstrumentData = await populateInstrumentData(instrumentResonse.data);
      setInstrument(getInstrumentData);
      setloading(false);
    } catch (error) {
      console.log(error)
      const errNotification = {
        title: "Something went wrong",
        description: "",
        icon: "error",
        state: true,
        timeout: 1500,
      };
      setloading(false);
      dispatch(notificationActions.changenotification(errNotification));
    }
  }

  useEffect(() => {
    fetchDataFromServer();
  }, []);

  const addRow = () => {
    if (QuotationItems.itemDescription === "" || QuotationItems.itemDescription == "Select") {
      setError("Item Description is required")
      return;
    }
    if (QuotationItems.range_model === '') {
      setError("Range/Model is required")
      return;
    }
    if (QuotationItems.remarks === '') {
      setError("Remarks is required")
      return;
    }
    setError("");
    const newRow = { id: items.length + 1, ...QuotationItems };
    setitems([...items, newRow]);
    setQuotationItems({
      itemDescription: '',
      range_model: '',
      remarks: '',
      qty: 1,
      unitPrice: 1,
    });
  };

  const deleteRow = (id) => {

    const updateditems = items.filter((row) => row.id !== id);
    setitems(updateditems);
  };

  const handleManualInputChange = (e) => {
    const { name, value } = e.target;
    setQuotationItems((prevInputs) => ({
      ...prevInputs,
      [name]: value,
    }));
    setError("")
  };
  const itemsWithIndex = items.map((item, index) => ({ ...item, index: index + 1 }));

  useEffect(() => {
    fetchData(itemsWithIndex)
  }, [items]);

  return (
    <div style={{ width: "100%" }}>
      <div>
        <div className="Quotation-item-input">
          {handleToggleButton ?
            <div>
              <Select
                style={{ width: "240px", marginBottom: "5px" }}
                label="Item Description"
                options={instrument}
                required={true}
                onChange={async (e) => {
                  let index = e.target.selectedIndex;
                  let thisValue = e.target[index].innerText;
                  setQuotationItems((prev) => ({
                    ...prev,
                    itemDescription: thisValue
                  }))
                  setError("")
                }}
              />
              <Button
                label="New Instrument"
                onClick={() => sethandleToggleButton((prev) => !prev)}
                variant="success"
              />
            </div> : <div>
              <Input
                placeholder="Item Description"
                label="Item Description"
                type="text"
                name="itemDescription"
                value={QuotationItems?.itemDescription}
                onChange={handleManualInputChange}
                disabled={false}
                required
                style={{ marginBottom: "5px" }}
              />
              <Button
                label="Existing Instrument"
                onClick={() => sethandleToggleButton((prev) => !prev)}
                variant="success"
              />
            </div>
          }
          <Input
            placeholder="Range/Model"
            label="Range/Model"
            type="text"
            name="range_model"
            value={QuotationItems?.range_model}
            onChange={handleManualInputChange}
            disabled={false}
            required
          />

          <Input
            placeholder="Remarks"
            label="Remarks"
            type="text"
            name="remarks"
            value={QuotationItems?.remarks}
            onChange={handleManualInputChange}
            disabled={false}
            required
          />
          <Input
            placeholder="Quantity"
            label="Quantity"
            type="number"
            name="qty"
            value={QuotationItems?.qty}
            onChange={handleManualInputChange}
            disabled={false}
            required
            min={1}
          />
          <Input
            placeholder="Unit Price"
            label="Unit Price"
            type="number"
            name="unitPrice"
            value={QuotationItems?.unitPrice}
            onChange={handleManualInputChange}
            disabled={false}
            required
            min={0}
          />
        </div>
        <div style={{ width: "100%" }}>
          {error && <p className="red center w100" style={{ margin: 0 }}>{error}</p>}
        </div>
        <br></br>
        <CustomButton
          label="Add Data"
          variant="brand"
          onclick={addRow}
        />
        <div><br></br></div>
        <QuotationItemList items={itemsWithIndex} deleteItemHandler={deleteRow} />
      </div>
      {(loading) ? <Loader /> : ""}
    </div>

  );
};


export default QuotationTableItemInput;




