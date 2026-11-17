import React, { useContext, useEffect, useState } from 'react';
import { Modal, Button, Card, CheckboxToggle } from 'react-rainbow-components';
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import GlobalNotification from "../../../utils/GlobalNotification";

const UpdateConfig = ({ isOpen, onRequestClose, configLabId }) => {

    const auth = useContext(AuthContext);

    const [formDiv, setFormDiv] = useState([]);

    const fetchConfig = async () => {

        try {
            let response = await fetch(config.Calibmaster.URL + "/api/cms-permissions-setting/fetch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: configLabId })
            });

            response = await response.json();
             console.log(response);

            const { result } = response;
            setFormDiv(result);

        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
        }
    }

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title="View & Update Settings"
        >
            {
                formDiv.map((item, index) => {
                    return <EachForm
                        key={index} configInfo={item} auth={auth}
                    />
                })
            }
        </Modal>
    )
}

export default UpdateConfig;


const EachForm = ({ configInfo, auth }) => {

    const [labId, setLabId] = useState(configInfo.lab_id);
    const [enable, setEnable] = useState(configInfo.is_enable);

    const handleToggleChange = async () => {

        try {

            const bodyData = {
                lab_id: labId,
                setting_name: configInfo.setting_name,
                setting_lable: configInfo.setting_lable,
                setting_description: configInfo.setting_description,
                setting_value: !enable ? "YES" : "NO",
                is_enable: !enable
            };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData)
            };

            const response = await fetch(config.Calibmaster.URL + "/api/cms-permissions-setting/edit", requestOptions);
            const data = await response.json();
            // console.log(data);

            GlobalNotification.success({
                title: "Configuration Updated Successfully",
            });
        } catch (error) {
            console.log(error);
            GlobalNotification.error({
                title: "Something went wrong",
            });
        }
    }

    return <>
        <Card className='card_style' style={{ maxWidth: '90%', marginLeft: 'auto', marginRight: "auto" }}>

            <div className="label_header">
                <h5 style={{ textAlign: 'center' }}>{configInfo.setting_lable}</h5>
            </div>

            <div className="form_container">

                <div className="each_form" style={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                }}>
                    <CheckboxToggle
                        label="Enable Configuration"
                        value={enable}
                        onChange={() => {
                            setEnable(!enable);
                            handleToggleChange();
                        }}
                    />
                </div>

            </div>

        </Card>
    </>
}