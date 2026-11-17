import "./MasterList.css";
import CustomInput from "../../Inputs/CustomInput";
import { useContext, useState, useEffect } from "react";
import {
  Card,
  Spinner,
  TableWithBrowserPagination,
  Column,
  Button,
  Modal,
  Badge,
} from "react-rainbow-components";
import CustomButton from "../../Inputs/CustomButton";
import { AuthContext } from "../../../context/auth-context";
import { useDispatch, useSelector } from "react-redux";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";
import { masterlistActions } from "../../../store/masterlist";
import Loader from "../../UI/Loader";
const MasterList = (props) => {
  const [name, setName] = useState();
  const [editname, seteditName] = useState();
  const auth = useContext(AuthContext);
  const [error, setError] = useState();
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(true);
  const masterlist = useSelector((state) => state.masterlist.list);
  const [itemEditModal, setitemEditModal] = useState(false);
  const [editId, setEditId] = useState();
  const [unit, setUnit] = useState();
  const [units, setUnits] = useState([]);
  const addtoUnitsHandler = () => {
    const updatedunits = [...units, unit];
    setUnits(updatedunits);
    setUnit("");
  };
  useEffect(() => {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ labId: auth.labId }),
    };

    fetch(config.Calibmaster.URL + "/api/masterlist/getall", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            //console.log(data);

            let oldmasterlist = data.data;
            const modified = oldmasterlist.map((v, i) => {
              return { id: v.id, sno: i + 1, name: v.name, units: v.units };
            });
            dispatch(masterlistActions.changeitems(modified));
          } else {
            setError(data.message);
            GlobalNotification.error({
              title: "Getting Masterlist Failed!!",
              description: data.message,
            });
          }
        } else {
          setError("Error While Getting Masterlist!!");
          GlobalNotification.error({
            title: "Error while getting MasterList!!",
            description: "Getting masterlist from server failed!!",
          });
        }
      })
      .catch((err) => {
        setIsLoaded(true);
        //console.log(err);
        setError("Error While Getting Masterlist!!");
        GlobalNotification.error({
          title: "Error while getting MasterList!!",
          description: "Getting masterlist from server failed!!",
        });
      });
  }, []);
  const addtoMasterListHandler = async () => {
    setIsLoaded(false);
    const newcomponent = {
      name,
      units,
      labId: auth.labId,
    };
    const isValid =
      name != undefined && name != null && name.length > 3 && units.length > 0;
    if (!isValid) {
      setError("Input Validation Failed!!");
      setIsLoaded(true);
      return;
    }
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify(newcomponent),
    };

    fetch(config.Calibmaster.URL + "/api/masterlist/addcomponent", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            GlobalNotification.success({
              title: "Component Added Successfully",
              description: name,
            });

            let oldmasterlist = data.data;
            const modified = oldmasterlist.map((v, i) => {
              return { id: v.id, sno: i + 1, name: v.name, units: v.units };
            });
            dispatch(masterlistActions.changeitems(modified));
            setName();
          } else {
        GlobalNotification.error({
          title: "Error while Adding Component!!",
          description: name,
        });
        setError("Error while Adding Component");
          }
        }
      });
  };

  const itemdeleteHandler = async (v) => {
    setIsLoaded(false);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ masterlistId: v, labId: auth.labId }),
    };

    fetch(config.Calibmaster.URL + "/api/masterlist/deletebyid", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            GlobalNotification.success({
              title: "Masterlist Item Deleted Successfully",
              description: "masterlistId: " + v,
            });
            //console.log(data);
            let oldmasterlist = data.data;
            const modified = oldmasterlist.map((v, i) => {
              return { id: v.id, sno: i + 1, name: v.name, units: v.units };
            });
            dispatch(masterlistActions.changeitems(modified));
            dispatch(masterlistActions.changeitems(modified));
          } else {
            GlobalNotification.error({
              title: "Error while Deleting Masterlist Item!!",
              description: "masterlistId: " + v,
            });
          }
        } else {
          GlobalNotification.error({
            title: "Error while Deleting Masterlist Item!!",
            description: "masterlistId: " + v,
          });
        }
      })
      .catch((err) => {
        GlobalNotification.error({
          title: "Error while Deleting Masterlist Item!!",
          description: "masterlistId: " + v,
        });
      });
  };
  const editMasterListHandler = async () => {
    setIsLoaded(false);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({
        masterlistId: editId,
        labId: auth.labId,
        name: editname,
      }),
    };

    fetch(config.Calibmaster.URL + "/api/masterlist/updatebyid", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            GlobalNotification.success({
              title: "Masterlist Item Updated Successfully",
              description: "masterlistId: " + editId,
            });
            //console.log(data);
            let oldmasterlist = data.data;
            const modified = oldmasterlist.map((v, i) => {
              return { id: v.id, sno: i + 1, name: v.name, units: v.units };
            });
            dispatch(masterlistActions.changeitems(modified));
            dispatch(masterlistActions.changeitems(modified));
            editmodalHandler();
          } else {
            GlobalNotification.error({
              title: "Error while Updating Masterlist Item!!",
              description: "masterlistId: " + editId,
            });
          }
        } else {
          GlobalNotification.error({
            title: "Error while Updating Masterlist Item!!",
            description: "masterlistId: " + editId,
          });
        }
      })
      .catch((err) => {
        GlobalNotification.error({
          title: "Error while Updating Masterlist Item!!",
          description: "masterlistId: " + editId,
        });
      });
  };

  const itemeditHandler = (v) => {
    setitemEditModal(true);
    setEditId(v);
  };

  const editmodalHandler = () => {
    const itemeditmodal = itemEditModal;
    setitemEditModal(!itemeditmodal);
  };
  const EditItem = ({ value }) => {
    const edithandler = (val) => {
      const check = (v) => {
        return v.id === value;
      };
      let item = masterlist.filter(check);
      //console.log(item);
      itemeditHandler(value);
      seteditName(item[0].name);
    };

    return (
      <Button
        variant="neutral"
        label="Edit"
        onClick={() => edithandler(value)}
      />
    );
  };
  const DeleteItem = ({ value }) => (
    <Button
      variant="destructive"
      label="Delete"
      onClick={() => itemdeleteHandler(value)}
    />
  );

  if (!isLoaded)
    return <Loader />;

  return (
    <div className="masterlist">
      <div className="add__masterlist__container">
        <Card className="add__user__card">

          <div className="add__user__label">
            <h3>Add to MasterList</h3>
          </div>

          <div className="add__user__form">
            <div className="add__user__item">
              <CustomInput
                label="Component Name"
                type="text"
                value={name}
                onchange={(v) => setName(v)}
                disabled={false}
                required={true}
              />
            </div>
            {units.length > 0 ? <p className="red center">{error}</p> : null}
            {units.map((v, i) => {
              return (
                <Badge
                  className="rainbow-m-around_medium lowercase"
                  label={v}
                  variant="brand"
                  title={v}
                />
              );
            })}

            <div className="add__user__item">
              <CustomInput
                label="Unit"
                type="text"
                value={unit}
                onchange={(v) => setUnit(v)}
                disabled={false}
                required={true}
              />
            </div>
            <div className="add__user__item">
              <CustomButton
                label="Add Unit"
                variant="brand"
                onclick={addtoUnitsHandler}
              />
            </div>
            <p className="red center">{error}</p>
            <div className="add__user__item">
              <CustomButton
                label="Add Component"
                variant="success"
                onclick={addtoMasterListHandler}
              />
            </div>
          </div>

        </Card>
      </div>

      <div className="masterlist__container">
        <Card className="masterlist__table__card">
          <div className="items__label">
            <h2>MasterList</h2>
          </div>

          <TableWithBrowserPagination
            className="srf__items__table"
            pageSize={10}
            data={masterlist}
            keyField="id"
          >
            <Column header="S.No" field="sno" />
            <Column header="Description of Item" field="name" />
            <Column header="Units" field="units" />
            <Column header="Edit" field="id" component={EditItem} />
            <Column header="Delete" field="id" component={DeleteItem} />
          </TableWithBrowserPagination>
        </Card>
      </div>
      {itemEditModal ? (
        <Modal
          id="masterlist_edit"
          isOpen={itemEditModal}
          onRequestClose={editmodalHandler}
        >
          <div className="center add__user__label">
            <h3>Edit MasterList Item</h3>
          </div>
          <div className="add__user__form">
            <div className="add__user__item">
              <CustomInput
                label="Component Name"
                type="text"
                value={editname}
                onchange={(v) => seteditName(v)}
                disabled={false}
                required={true}
              />
            </div>
            <p className="red center">{error}</p>
            <div className="add__user__item">
              <CustomButton
                label="Update Component"
                variant="success"
                onclick={editMasterListHandler}
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

export default MasterList;
