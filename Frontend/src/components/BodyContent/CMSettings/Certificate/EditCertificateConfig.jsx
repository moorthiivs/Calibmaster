import { useContext, useEffect, useState } from "react";
import { CheckboxToggle } from "react-rainbow-components";
import { useDispatch } from 'react-redux';
import config from "../../../../utils/config.json";
import { notificationActions } from "../../../../store/nofitication";
import { AuthContext } from '../../../../context/auth-context';
import '../Styles/common.css'

const EditCertificateConfig = ({ configData, fetchCertificateConfig }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [configId, setConfigId] = useState("");
    const [enable, setEnable] = useState(false);

    useEffect(() => {

        const { cmssetting_id, setting_value } = configData;

        setConfigId(cmssetting_id);
        const getValue = setting_value === "YES" ? true : false;

        setEnable(getValue);

    }, []);

    const updateConfigHandler = async () => {

        try {

            const bodyData = { setting_value: !enable ? "YES" : "NO", cmssetting_id: configId };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/cms-setting/edit-cms-certificate", requestOptions);
            const data = await response.json();
            console.log(data);

            fetchCertificateConfig();
            const newNotification = {
                title: "Certifacte Config Updated Successfully",
                description: "",
                icon: "success",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(newNotification));
        } catch (err) {
            console.log(err);
            const newNotification = {
                title: "Something went wrong",
                description: "",
                icon: "error",
                state: true,
            };
            dispatch(notificationActions.changenotification(newNotification));
        }
    }

    return (
        <CheckboxToggle
            label="Set Configuration"
            value={enable}
            onChange={() => {
                setEnable(!enable);
                updateConfigHandler();
            }}
        />
    )
}

export default EditCertificateConfig;