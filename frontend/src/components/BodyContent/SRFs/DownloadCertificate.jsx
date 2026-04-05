import React, { useContext } from 'react';
import { AuthContext } from '../../../context/auth-context';
import { useDispatch } from 'react-redux';
import config from "../../../utils/config.json";
import { notificationActions } from "../../../store/nofitication";
import { Button } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
//import { Button } from 'react-rainbow-components';

const DownloadCertificate = ({ item }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const viewCertificateHandler = async () => {

        try {

            // *** Create Request Body object ***
            const requestBody = {
                srf_item_id: item?.srf_item_id,
                type: "calibration"
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
        //     label="View Certificates"
        //     onClick={viewCertificateHandler}
        //     variant="success"
        // />

        <Button color='volcano' size='large' variant='solid' icon={<FilePdfOutlined  />} onClick={viewCertificateHandler}>
            Download Certificate
        </Button>
    )
}

export default DownloadCertificate