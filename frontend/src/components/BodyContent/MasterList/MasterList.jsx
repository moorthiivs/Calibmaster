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
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
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
    const errornotification = {
      title: "Error while getting MasterList!!",
      description: "Getting masterlist from server failed!!",
      icon: "error",
      state: true,
      timeout: 15000,
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
            const newNotification = {
              title: "Getting Masterlist Failed!!",
              description: data.message,
              icon: "error",
              state: true,
            };
            dispatch(notificationActions.changenotification(newNotification));
          }
        } else {
          setError("Error While Getting Masterlist!!");
          dispatch(notificationActions.changenotification(errornotification));
        }
      })
      .catch((err) => {
        setIsLoaded(true);
        //console.log(err);
        setError("Error While Getting Masterlist!!");
        dispatch(notificationActions.changenotification(errornotification));
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
    const errornotification = {
      title: "Error while Adding Component!!",
      description: name,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/masterlist/addcomponent", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            const newNotification = {
              title: "Component Added Successfully",
              description: name,
              icon: "success",
              state: true,
              timeout: 15000,
            };

            let oldmasterlist = data.data;
            const modified = oldmasterlist.map((v, i) => {
              return { id: v.id, sno: i + 1, name: v.name, units: v.units };
            });
            dispatch(masterlistActions.changeitems(modified));
            dispatch(notificationActions.changenotification(newNotification));
            setName();
          } else {
            dispatch(notificationActions.changenotification(errornotification));
            setError(data.message);
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
          setError("Error while Adding Component");
        }
      })
      .catch((err) => {
        dispatch(notificationActions.changenotification(errornotification));
        setError("Error while Adding Component");
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
    const errornotification = {
      title: "Error while Deleting Masterlist Item!!",
      description: "masterlistId: " + v,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/masterlist/deletebyid", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            const newNotification = {
              title: "Masterlist Item Deleted Successfully",
              description: "masterlistId: " + v,
              icon: "success",
              state: true,
              timeout: 15000,
            };
            //console.log(data);
            let oldmasterlist = data.data;
            const modified = oldmasterlist.map((v, i) => {
              return { id: v.id, sno: i + 1, name: v.name, units: v.units };
            });
            dispatch(masterlistActions.changeitems(modified));
            dispatch(notificationActions.changenotification(newNotification));
          } else {
            dispatch(notificationActions.changenotification(errornotification));
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
        }
      })
      .catch((err) => {
        dispatch(notificationActions.changenotification(errornotification));
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
    const errornotification = {
      title: "Error while Updating Masterlist Item!!",
      description: "masterlistId: " + editId,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/masterlist/updatebyid", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        //console.log(data);
        if (data) {
          if (data.code === 200) {
            const newNotification = {
              title: "Masterlist Item Updated Successfully",
              description: "masterlistId: " + editId,
              icon: "success",
              state: true,
              timeout: 15000,
            };
            //console.log(data);
            let oldmasterlist = data.data;
            const modified = oldmasterlist.map((v, i) => {
              return { id: v.id, sno: i + 1, name: v.name, units: v.units };
            });
            dispatch(masterlistActions.changeitems(modified));
            dispatch(notificationActions.changenotification(newNotification));
            editmodalHandler();
          } else {
            dispatch(notificationActions.changenotification(errornotification));
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
        }
      })
      .catch((err) => {
        dispatch(notificationActions.changenotification(errornotification));
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
