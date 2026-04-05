import "./UserInfo.css";
import { ButtonIcon, Avatar } from "react-rainbow-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPowerOff } from "@fortawesome/free-solid-svg-icons";
import user from "../../images/user.png";
import { useContext } from "react";
import { AuthContext } from "../../context/auth-context";
const UserInfo = (props) => {
  const auth = useContext(AuthContext);
  const logoutHandler = () => {
    auth.logout();
  };
  return (
    <div className="user__info__container">
      <div className="user__img__container">
        <div className="rainbow-m-horizontal_medium">
          <Avatar
            src={user}
            assistiveText="Tahimi Leon"
            title={auth.name || 'User'}
            size="large"
          />
        </div>
      </div>
      <div className="user__info">
        <h3>{auth.name}</h3>
        <h4>{auth.department.toUpperCase()}</h4>
      </div>
      <div className="signout__button__container">
        <ButtonIcon
          variant="border-filled"
          size="large"
          icon={<FontAwesomeIcon icon={faPowerOff} />}
          onClick={logoutHandler}
        />
      </div>
    </div>
  );
};

export default UserInfo;
