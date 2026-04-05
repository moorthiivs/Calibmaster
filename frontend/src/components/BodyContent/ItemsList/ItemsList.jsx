import { useEffect, useState } from "react";
import { Card, Table, Button, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { itemsActions } from "../../../store/items";
import AddItem from "../AddItem/AddItem";
import AddBulkItems from "../AddBulkItems/AddBulkItems";

const ItemsList = (props) => {

  const items = useSelector((state) => state.items.list);
  const [modifiedItems, setModifiedItems] = useState([]);
  const [addItemModel, setAddItemModel] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (items) {
      const modifieditems = items.map((v, i) => ({
        ...v,
        sno: i + 1
      }));
      setModifiedItems(modifieditems);
    }
  }, [items]);

  const addItemHandler = () => {
    const isopen = addItemModel;
    setAddItemModel(!isopen);
  };

  const itemdeleteHandler = (v) => {
    const delindex = v - 1;
    dispatch(itemsActions.removeitem(delindex));
  };

  const columns = [
    {
      title: "S.NO",
      dataIndex: "sno",
      key: "sno",
      width: 80,
      align: "center",
    },
    {
      title: "DESCRIPTION OF ITEM",
      dataIndex: "description",
      key: "description",
      align: "center",
      width: 250,
    },
    {
      title: "MAKE",
      dataIndex: "make",
      key: "make",
      align: "center",
    },
    {
      title: "MODEL",
      dataIndex: "model",
      key: "model",
      align: "center",
    },
    {
      title: "SERIAL NUMBER",
      dataIndex: "serialno",
      key: "serialno",
      align: "center",
    },
    {
      title: "ID NUMBER",
      dataIndex: "idno",
      key: "idno",
      align: "center",
    },
    {
      title: "REMARKS",
      dataIndex: "remarks",
      key: "remarks",
      align: "center",
    },
    {
      title: "DELETE",
      dataIndex: "sno",
      key: "action",
      align: "center",
      width: 100,
      render: (sno) => (
        <Popconfirm
          title="Delete this item?"
          description="This action cannot be undone."
          onConfirm={() => itemdeleteHandler(sno)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Button
            danger
            type="primary"
            size="small"
            icon={<DeleteOutlined />}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      className="mt-4 w-full shadow-sm"
      styles={{ body: { padding: "16px 24px" } }}
    >
      <h2 className="text-lg font-bold text-center mb-4">SRF Items</h2>

      <AddBulkItems />

      <Table
        columns={columns}
        dataSource={modifiedItems}
        rowKey="sno"
        pagination={{ pageSize: 5, showSizeChanger: false }}
        bordered
        size="small"
        scroll={{ x: 900 }}
        className="mt-3"
      />

      <div className="flex items-center justify-center gap-4 mt-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={addItemHandler}
          style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
        >
          Add Item
        </Button>
        {items.length > 0 && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={props.isLoaded && props.addsrf}
          >
            Add SRF
          </Button>
        )}
      </div>

      {addItemModel && (
        <AddItem onclose={addItemHandler} isopen={addItemModel} />
      )}
    </Card>
  );
};

export default ItemsList;
