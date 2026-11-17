import { notification } from 'antd';

const GlobalNotification = {
    success: ({ title, description, duration = 6 }) => {
        notification.success({
            message: title,
            description,
            duration,
        });
    },

    error: ({ title, description, duration = 8 }) => {
        notification.error({
            message: title,
            description,
            duration,
        });
    },

    warning: ({ title, description, duration = 6 }) => {
        notification.warning({
            message: title,
            description,
            duration,
        });
    },

    info: ({ title, description, duration = 6 }) => {
        notification.info({
            message: title,
            description,
            duration,
        });
    },
};

export default GlobalNotification;
