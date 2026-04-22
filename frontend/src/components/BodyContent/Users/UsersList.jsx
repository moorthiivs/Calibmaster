import { useContext, useEffect, useState } from "react";
import { Spinner, MenuItem, CheckboxToggle, ButtonMenu } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEllipsisV, faLock, faSearch, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import { usePermissions } from "../../../hooks/usePermissions";
import config from "../../../utils/config.json";
import { notificationActions } from "../../../store/nofitication";
import { usersActions } from "../../../store/users";
import EditUserModal from "./EditUserModal";
import CustomSearch from "../../Inputs/CustomSearch";
import ResetPasswordModal from "./ResetPasswordModal";
import "./UsersList.css";
import ClientUserModal from "./ClientUserModal";
import Loader from "../../UI/Loader";
import DataTable from "../../common/DataTable";
import { Input, Space, Button, Tooltip, Modal, message } from "antd";
import { EyeFilled, EyeInvisibleFilled, SearchOutlined } from "@ant-design/icons";


const UsersList = (props) => {

  const [modifiedUsers, setModifiedUsers] = useState();
  const [isLoaded, setIsLoaded] = useState(true);
  const [editUserModal, setEditUserModal] = useState(false);
  const [editId, setEditId] = useState();
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userList, setuserList] = useState([]);

  const auth = useContext(AuthContext);
  const dispatch = useDispatch();
  const users = useSelector((state) => state.users.list);
  const { hasPermission } = usePermissions();

  const [resetPasswordModal, setResetPasswordModal] = useState(false);

  const [clientUserId, setclientUserId] = useState("");
  const [clientInfo, setClientInfo] = useState({});
  const [clientViewModal, setclientViewModal] = useState(false);

  // ! *** We do not need that ***
  useEffect(() => {
    if (users) {
      const modifiedusers = users.map((v, i) => ({
        ...v,
        sno: i + 1,
      }));
      setModifiedUsers(modifiedusers);
    }
  }, [users]);

  // *** Fetch Users ***
  function fetchUsers() {

    setIsLoaded(false);

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ labId: auth.labId }),
    };

    const errornotification = {
      title: "Error while Getting Users!!",
      description: "Getting List of Users Failed!!",
      icon: "error",
      state: true,
      timeout: 15000,
    };

    fetch(config.Calibmaster.URL + "/api/users/getall", requestOptions)
      .then(async (response) => {
        let data = await response.json();

        if (data) {
          setIsLoaded(true);
          setuserList(data.data);
          dispatch(usersActions.changeusers(data?.data));
        } else {
          setIsLoaded(true);
          dispatch(notificationActions.changenotification(errornotification));
        }
      })
      .catch((err) => {
        console.log(err);
        setIsLoaded(true);
        dispatch(notificationActions.changenotification(errornotification));
      });
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const userDeleteHandler = (v) => {
    Modal.confirm({
      title: "Are you sure you want to delete this user?",
      content: "This action cannot be undone. If the user has history in the system, they should be disabled instead.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setIsLoaded(false);
        try {
          const response = await fetch(config.Calibmaster.URL + "/api/users/deleteuser", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + auth.token,
            },
            body: JSON.stringify({ userId: v, labId: auth.labId }),
          });
          const data = await response.json();
          setIsLoaded(true);

          if (data.code === 200) {
            dispatch(notificationActions.changenotification({
              title: "User Deleted Successfully",
              icon: "success",
              state: true,
              timeout: 5000,
            }));
            fetchUsers();
          } else {
            // Show the specific error message from backend (e.g. "associated with records")
            message.error(data.message || "Failed to delete user");
          }
        } catch (err) {
          setIsLoaded(true);
          message.error("An error occurred while deleting the user.");
        }
      },
    });
  };

  const userEditHandler = (v) => {
    setEditUserModal(true);
    setEditId(v);
  };

  const editmodalHandler = () => {
    const usereditmodal = editUserModal;
    setEditUserModal(!usereditmodal);
  };

  // const EditUser = ({ value }) => (
  //   <Button
  //     variant="neutral"
  //     label="Edit"
  //     onClick={() => userEditHandler(value)}
  //   />
  // );

  // const DeleteUser = ({ value }) => (
  //   <Button
  //     variant="destructive"
  //     label="Disable"
  //     onClick={() => userdeleteHandler(value)}
  //   />
  // );

  const userDisableHandler = async (v) => {
    setIsLoaded(false);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ userId: v, labId: auth.labId }),
    };
    const errornotification = {
      title: "Error while Deleting User!!",
      description: "UserId: " + v,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/users/disableuser", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        if (data) {
          if (data.code === 200) {
            const newNotification = {
              title: "User Disabled Successfully",
              description: "UserId: " + v,
              icon: "success",
              state: true,
              timeout: 15000,
            };
            //console.log(data);
            fetchUsers();
            dispatch(usersActions.changeusers(data.data));
            dispatch(notificationActions.changenotification(newNotification));
          } else {
            dispatch(notificationActions.changenotification(errornotification));
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
        }
      })
      .catch((err) => {
        setIsLoaded(true);
        dispatch(notificationActions.changenotification(errornotification));
      });
  }

  const userEnableHandler = async (v) => {
    setIsLoaded(false);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ userId: v, labId: auth.labId }),
    };
    const errornotification = {
      title: "Error while Deleting User!!",
      description: "UserId: " + v,
      icon: "error",
      state: true,
      timeout: 15000,
    };
    fetch(config.Calibmaster.URL + "/api/users/enableuser", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setIsLoaded(true);
        console.log(data);
        if (data) {
          if (data.code === 200) {
            const newNotification = {
              title: "User Enabled Successfully",
              description: "UserId: " + v,
              icon: "success",
              state: true,
              timeout: 15000,
            };
            //console.log(data);
            fetchUsers();
            dispatch(usersActions.changeusers(data.data));
            dispatch(notificationActions.changenotification(newNotification));
          } else {
            dispatch(notificationActions.changenotification(errornotification));
          }
        } else {
          dispatch(notificationActions.changenotification(errornotification));
        }
      })
      .catch((err) => {
        setIsLoaded(true);
        dispatch(notificationActions.changenotification(errornotification));
      });
  }

  // const DeleteUser = ({ value, row }) => {

  //   const enableDisableUserHandler = () => {
  //     if (row.rstatus == 1) {
  //       userDisableHandler(value);
  //     }
  //     else {
  //       userEnableHandler(value);
  //     }
  //   }

  //   return (
  //     <Button
  //       variant={row.rstatus == 1 ? "destructive" : "success"}
  //       label={row.rstatus == 1 ? "Disable" : "Enable"}
  //       onClick={enableDisableUserHandler}
  //     // disabled={row.rstatus === 1}
  //     />
  //   );
  // }



  const passwordResetHandler = (v) => {
    setResetPasswordModal(true);
    setEditId(v.id);
    setclientUserId(v.calibmaster_client_id);
    setClientInfo(v);
  }

  const resetPassword = ({ row }) => (
    <Button
      variant="outline-brand"
      label="Reset Password"
      onClick={() => {
        passwordResetHandler(row);
      }}
    />
  );

  // *** Search by S.No ***
  const searchSNoHandler = async (query) => {
    if (query !== "") {

      const newArr = [...users];

      const result = newArr.filter((item) => {
        const regex = new RegExp(query, "i");
        return regex.test(item.slNo);
      });
      setuserList(result)

    } else {
      setuserList([]);
      fetchUsers();
    }
  }

  // ***Search By Name ***
  const searchNameHandler = async (query) => {
    if (query !== "") {

      const newArr = [...users];

      const result = newArr.filter((item) => {
        const regex = new RegExp(query, "i");
        return regex.test(item.name);
      });
      setuserList(result)

    } else {
      setuserList([]);
      fetchUsers();
    }
  }

  // *** Search By Email ***
  const searchEmailHandler = async (query) => {
    if (query !== "") {

      const newArr = [...users];

      const result = newArr.filter((item) => {
        const regex = new RegExp(query, "i");
        return regex.test(item.email);
      });
      setuserList(result)

    } else {
      setuserList([]);
      fetchUsers();
    }
  }

  // *** Search By Department ***
  const searchDepartmentHandler = async (query) => {
    if (query !== "") {

      const newArr = [...users];

      const result = newArr.filter((item) => {
        const regex = new RegExp(query, "i");
        return regex.test(item.department);
      });
      setuserList(result)

    } else {
      setuserList([]);
      fetchUsers();
    }
  }

  const clientInfoHandler = ({ row }) => {
    if (row.department == "Client") {
      return <Tooltip title="View Client">
        <Button
          type="dashed"
          icon={<EyeFilled />}
          onClick={() => {
            setclientUserId(row.calibmaster_client_id);
            setclientViewModal(true);
          }}
        />
      </Tooltip>
    } else {
      return <Tooltip title="Not Client">
        <Button
          type="dashed"
          icon={<EyeInvisibleFilled />}
          disabled={true}
        />
      </Tooltip>
    }
  }

  const closeClientViewModalHandler = () => {
    setclientViewModal(false);
  }
  const toggleUserStatus = (row) => {
    if (row.rstatus === 1) {
      userDisableHandler(row.id);
    } else {
      userEnableHandler(row.id);
    }
  };

  const renderToggle = ({ row }) => {
    if (hasPermission("EDIT_USER")) {
      return (
        <CheckboxToggle
          value={row.rstatus}
          onChange={() => toggleUserStatus(row)}
        />
      );
    }
    // Read-only status badge for users without EDIT_USER
    return (
      <span style={{
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        background: row.rstatus === 1 ? "#d1fae5" : "#fee2e2",
        color: row.rstatus === 1 ? "#065f46" : "#991b1b",
      }}>
        {row.rstatus === 1 ? "Active" : "Inactive"}
      </span>
    );
  };

  const ActionsComponent = ({ row }) => {
    return <ButtonMenu menuAlignment="center" menuSize="x-small" title='actions' buttonSize={'small'} icon={<FontAwesomeIcon icon={faEllipsisV} />} >
      {(row?.department != 'Client' && hasPermission("EDIT_USER")) && (
        <MenuItem label="Edit" icon={<FontAwesomeIcon icon={faEdit} />} iconPosition="left" onClick={(event, data) => userEditHandler(row.id)} />
      )}
      {hasPermission("PASSWORD_RESET_USER") && (
        <MenuItem label="Reset Password" icon={<FontAwesomeIcon icon={faLock} />} iconPosition="left" onClick={(event, data) => passwordResetHandler(row)} />
      )}
      {hasPermission("DELETE_USER") && (
        <MenuItem label="Delete" icon={<FontAwesomeIcon icon={faTrash} />} iconPosition="left" onClick={(event, data) => userDeleteHandler(row.id)} variant="destructive" />
      )}
    </ButtonMenu>
  };


  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      align: "center",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      align: "center",
    },
    {
      title: "Role",
      dataIndex: "department",
      key: "department",
      align: "center",
    },
    {
      title: "Enable/Disable",
      key: "rstatus",
      dataIndex: "rstatus",
      align: "center",
      render: (_, row) => renderToggle({ row }),
    },
    {
      title: "Client Info",
      key: "clientInfo",
      dataIndex: "id",
      align: "center",
      render: (_, row) => clientInfoHandler({ row }),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 120,
      render: (_, row) => <ActionsComponent row={row} />,
    },
  ];


  return (
    <div className="users__container">
      <Space style={{ marginBottom: "16px" }} wrap>
        <Input
          placeholder="Search by S.No"
          onChange={(e) => searchSNoHandler(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          size="large"
        />
        <Input
          placeholder="Search By Name"
          onChange={(e) => searchNameHandler(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          size="large"
        />

        <Input
          placeholder="Search By Email"
          onChange={(e) => searchEmailHandler(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          size="large"
        />

        <Input
          placeholder="Search By Department"
          onChange={(e) => searchDepartmentHandler(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          size="large"
        />

      </Space>



      <div className="users__table">
        <DataTable
          columns={columns}
          data={userList}
          loading={!isLoaded}
          pageSize={5}
          showSerialNo={true}
          rowKey={(record) => record.id}
        />
      </div>


      {/* {!isLoaded ? <Loader /> : null} */}

      {editUserModal ? (
        <EditUserModal
          isopen={editUserModal}
          onclose={editmodalHandler}
          userid={editId}
          fetchUsers={fetchUsers}
        />
      ) : null}

      {resetPasswordModal ? (
        <ResetPasswordModal
          isopen={resetPasswordModal}
          onclose={setResetPasswordModal}
          userid={editId}
          clientUserId={clientUserId}
          clientInfo={clientInfo}
        />
      ) : null}

      {clientViewModal ? (
        <ClientUserModal
          isopen={clientViewModal}
          onclose={closeClientViewModalHandler}
          clientUserId={clientUserId}
        />
      ) : ""}


    </div>
  );
};

export default UsersList;
