import "./CustomNotification.css";
import { Notification } from "react-rainbow-components";
import { useDispatch, useSelector } from "react-redux";
import { notificationActions } from "../../store/nofitication";

const CustomNotification = (props) => {
  const notification = useSelector((state) => state.notification);
  const dispatch = useDispatch();
  const clearNotification = () => {
    const clearnotification = {
      title: null,
      description: null,
      icon: null,
      state: false,
      timeout: 15000,
    };
    dispatch(notificationActions.changenotification(clearnotification));
  };
  setTimeout(() => {
    clearNotification();
  }, notification.timeout);

  return (
    <>
      {notification.state ? (
        <Notification
          className="notification"
          title={notification.title}
          description={notification.description}
          icon={notification.icon}
          onRequestClose={clearNotification}
        />
      ) : null}
    </>
  );
};

export default CustomNotification;
