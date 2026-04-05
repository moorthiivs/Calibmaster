import React, { useContext, useEffect, useState } from 'react';
import { Form } from 'antd';
import MasterListDocFormatForm from '../../Forms/MasterListDocFormatForm';
import config from '../../../../utils/config.json';
import { AuthContext } from '../../../../context/auth-context';
import { useDispatch } from 'react-redux';
import { notificationActions } from '../../../../store/nofitication';
import dayjs from 'dayjs';
import GlobalNotification from '../../../../utils/GlobalNotification';

function MasterListDocFormatAdd() {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [docs, setDocs] = useState([]);
    const [docsDetails, setDocsDetails] = useState([]);
    const [filteredDetails, setFilteredDetails] = useState([]);
    const [loading, setLoading] = useState(false);

    
    const handleValuesChange = (changedValues, allValues) => {
        const mslId = allValues.mslId;
        if (changedValues.mslId) {
            const relatedDetails = docsDetails.filter(d => d.mslId === Number(mslId));
            setFilteredDetails(relatedDetails);
            form.setFieldsValue({ detailId: null });
        }

        if (changedValues.detailId) {
            const selectedDetail = docsDetails.find(d => d.detailId === Number(changedValues.detailId));
            if (selectedDetail) {
                const current = form.getFieldsValue();
                form.setFieldsValue({
                    detailId: selectedDetail.detailId,
                    formatName: form.isFieldTouched("formatName") ? current.formatName : selectedDetail.docTitle,
                    sectionNo: form.isFieldTouched("sectionNo") ? current.sectionNo : selectedDetail.docNumber,
                    revNo: form.isFieldTouched("revNo") ? current.revNo : selectedDetail.revisionNo,
                    revStartDate: form.isFieldTouched("revStartDate") ? current.revStartDate : dayjs(selectedDetail.effectiveStartDate),
                    revEndDate: form.isFieldTouched("revEndDate") ? current.revEndDate : dayjs(selectedDetail.effectiveEndDate),
                });
            }
        }
    };




    const handleSubmit = async values => {
        try {
            setLoading(true);
            const body = {
                ...values,
                labId: auth.labId,
                createdBy: auth.userId,
            };
            const res = await fetch(`${config.Calibmaster.URL}/api/master-list-docs-format/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify(body),
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.message);

            dispatch(notificationActions.changenotification({
                title: "Success",
                description: "Master List Format created successfully.",
                icon: "success",
                state: true,
                timeout: 6000,
            }));

            GlobalNotification.success({
                title: 'Master List Format Created',
                description: 'The Master List Format was created successfully.',
            });

            form.resetFields();
            setFilteredDetails([]);
        } catch (err) {
            GlobalNotification.error({
                title: 'Submission Failed',
                description: err.message || 'Something went wrong!',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchDocs = async () => {
            setLoading(true);
            try {
                const [docRes, detailRes] = await Promise.all([
                    fetch(`${config.Calibmaster.URL}/api/master-list-docs/fetchAll?labid=${auth.labId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${auth.token}`,
                        },
                    }),
                    fetch(`${config.Calibmaster.URL}/api/master-list-docs-details/fetchAll?labid=${auth.labId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${auth.token}`,
                        },
                    }),
                ]);

                const docsData = await docRes.json();
                const detailsData = await detailRes.json();

                setDocs(docsData);
                setDocsDetails(detailsData);
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, [auth.labId, auth.token]);

    return (
        <MasterListDocFormatForm
            form={form}
            docs={docs}
            filteredDetails={filteredDetails}
            loading={loading}
            onSubmit={handleSubmit}
            initialValues={{}}
            onValuesChange={handleValuesChange}
        />
    );
}

export default MasterListDocFormatAdd;
