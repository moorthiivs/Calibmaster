import React, { useContext } from 'react';
import { AuthContext } from '../../../context/auth-context';
import { useDispatch } from 'react-redux';
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { Button } from 'antd';
import { FileSearchOutlined } from '@ant-design/icons';
//import { Button } from 'react-rainbow-components';

const DownloadObservation = ({ item }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const viewCertificateHandler = async () => {

        try {

            // *** Create Request Body object ***
            const requestBody = {
                srf_item_id: item?.srf_item_id,
                type: "observation"
            }

            // *** Create Request Options object ***
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(requestBody)
            };

            let response = await fetch(config.Calibmaster.URL + "/api/generate-certificate/download", requestOptions);
            let blob = await response.blob()
            if (response.status !== 200) {
                throw new Error('file not found');
            }
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');

        } catch (error) {
            const errNotification = {
                title: "Failed to View Certificate",
                icon: "error",
                state: true,
                timeout: 15000,
            };
            dispatch(notificationActions.changenotification(errNotification));
        }
    }

    return (
        // <Button
        //     label="View Observation"
        //     onClick={viewCertificateHandler}

        // />

        <Button type="primary" size='large' icon={<FileSearchOutlined />} onClick={viewCertificateHandler}>
            Download Observation
        </Button>
    )
}

export default DownloadObservation
