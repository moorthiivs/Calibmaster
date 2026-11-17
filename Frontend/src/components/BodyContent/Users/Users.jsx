import { Card } from "antd";
import UsersList from "./UsersList";
import "./Users.css";

const Users = (props) => {
  return (
    <div className="users__container">
      <Card 
        className="users__card"
        title={<span className="text-xl font-bold">Users Management</span>}
        style={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
      >
        <UsersList />
      </Card>
    </div>
  );
};

export default Users;
