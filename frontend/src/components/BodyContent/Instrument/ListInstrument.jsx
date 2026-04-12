import { useContext, useState, useEffect } from "react";
import { Card, Input, Button, Tooltip, Dropdown, message } from "antd";
import { SearchOutlined, EditOutlined, DeleteFilled, MoreOutlined, EditFilled } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { useNavigate } from "react-router-dom";
import { instrumentIdActions } from "../../../store/instrumentId";
import { addNewId, searchByNameFunction } from "./higherOrderFunction";
import Loader from "../../UI/Loader";
import DataTable from "../../common/DataTable";
import showConfirmationDialog from "../../../utils/showConfirmationToast";

const ListInstrument = () => {
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [instrumentList, setInstrumentList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInstrument = async () => {
    try {
      setLoading(true);
      const data = await fetch(config.Calibmaster.URL + "/api/instrument/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ lab_id: auth.labId }),
      });

      let response = await data.json();
      response = await addNewId(response.data);

      setInstrumentList(response);
      setLoading(false);
    } catch (error) {
      console.error(error);
      dispatch(
        notificationActions.changenotification({
          title: "Something went wrong",
          icon: "error",
          state: true,
          timeout: 1500,
        })
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstrument();
  }, []);

  const searchNameFunction = async (val) => {
    if (val) {
      setLoading(true);
      setInstrumentList([]);
      const data = await searchByNameFunction(val, auth.labId, auth);
      let response = await addNewId(data);
      setInstrumentList(response);
      setLoading(false);
    } else {
      fetchInstrument();
    }
  };

  const redirectHandler = (id) => {
    console.log(id);

    dispatch(instrumentIdActions.setInstrumentId(id));
    navigate("/dashboard/instruments/edit");
  };

  const handleDelete = async (id) => {
    try {
      const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?");

      if (!confirmDelete) {
        console.log("Cancel Delete!");
        return;
      }

      const bodyData = {
        instrument_id: id,
        labid: auth.labId,
        userid: auth.userId
      }
      const response = await fetch(config.Calibmaster.URL + "/api/instrument/instrument-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(bodyData),
      })
      if (response.ok) {
        await fetchInstrument();
        message.success("Instrument Deleted Successfully")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const ActionMenu = ({ row }) => {
    const menuItems = [
      {
        key: "edit",
        label: "Edit",
        icon: <EditFilled />,
        onClick: () => {
          redirectHandler(row.instrument_id)
        },
      },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteFilled />,
        danger: true,
        onClick: () => handleDelete(row.instrument_id),
      },
    ];

    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        placement="bottomCenter"
      >
        <Button icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  const columns = [
    {
      title: "Instrument Name",
      dataIndex: "instrument_name",
      align: "center",
    },
    {
      title: "UOM",
      dataIndex: "uom_name",
      align: "center",
    },
    {
      title: "Discipline",
      dataIndex: "instrument_discipline",
      align: "center",
    },
    {
      title: "UOM Group",
      dataIndex: "group_details",
      align: "center",
    },
    // {
    //   title: "Action",
    //   dataIndex: "instrument_id",
    //   align: "center",
    //   render: (id) => (
    //     <Tooltip title="Edit Instrument">
    //       <Button type="primary" icon={<EditOutlined />} onClick={() => redirectHandler(id)}>
    //         Edit
    //       </Button>
    //     </Tooltip>
    //   ),
    // },

    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, row) => <ActionMenu row={row} />,
    },
  ];

  return (
    <div className="users__containers">
      <Card className="users__cards" title="Instrument List">
        {/* Search */}
        <div className="searchers__container" style={{ marginBottom: "16px" }}>
          <Input
            placeholder="Search By Instrument Name"
            onChange={(e) => searchNameFunction(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            size="large"
          />
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={instrumentList} loading={loading} />
      </Card>

      {/* {loading && <Loader />} */}
    </div>
  );
};

export default ListInstrument;
