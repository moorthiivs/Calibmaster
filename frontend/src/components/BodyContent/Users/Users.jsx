import { Card } from "react-rainbow-components";
import UsersList from "./UsersList";
import "./Users.css";

const Users = (props) => {
  return (
    <div className="users__container">
      <Card className="users__card">
        <div className="users__label">
          <h3 className="text-xl font-bold my-5">Users</h3>
        </div>
        <UsersList />
      </Card>
    </div>
  );
};

export default Users;
