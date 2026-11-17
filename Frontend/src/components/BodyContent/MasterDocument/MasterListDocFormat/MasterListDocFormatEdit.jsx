import React, { useContext, useEffect, useState } from 'react';
import { Form } from 'antd';
import MasterListDocFormatForm from '../../Forms/MasterListDocFormatForm';
import config from '../../../../utils/config.json';
import { AuthContext } from '../../../../context/auth-context';
import { useDispatch } from 'react-redux';
import { notificationActions } from '../../../../store/nofitication';
import dayjs from 'dayjs';
import GlobalNotification from '../../../../utils/GlobalNotification';

function MasterListDocFormatEdit({ formatId, onUpdate, onClose }) {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [docs, setDocs] = useState([]);
    const [docsDetails, setDocsDetails] = useState([]);
    const [filteredDetails, setFilteredDetails] = useState([]);
    const [loading, setLoading] = useState(false);

    const [initialValues, setInitialValues] = useState({});


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

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const payload = {
                ...values,
                labId: auth.labId,
                updatedBy: auth.userId,
            };
            const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs-format/update/${formatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            GlobalNotification.success({
                title: 'Update Success',
                description: 'Master List Document Format was Updated successfully.',
                duration: 2
            });
            if (onUpdate) onUpdate();
            if (onClose) onClose();
        } catch (err) {
            GlobalNotification.error({
                title: 'Update Failed',
                description: err.message || 'Something went wrong!',
                duration: 2
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [docsRes, detailsRes, formatRes] = await Promise.all([
                    fetch(`${config.Calibmaster.URL}/api/master-list-docs/fetchAll?labid=${auth.labId}`, {
                        headers: { Authorization: `Bearer ${auth.token}` },
                    }),
                    fetch(`${config.Calibmaster.URL}/api/master-list-docs-details/fetchAll?labid=${auth.labId}`, {
                        headers: { Authorization: `Bearer ${auth.token}` },
                    }),
                    fetch(`${config.Calibmaster.URL}/api/master-list-docs-format/${formatId}`, {
                        headers: { Authorization: `Bearer ${auth.token}` },
                    }),
                ]);

                const [docsData, detailsData, formatData] = await Promise.all([
                    docsRes.json(),
                    detailsRes.json(),
                    formatRes.json(),
                ]);

                setDocs(docsData);
                setDocsDetails(detailsData);
                setFilteredDetails(detailsData.filter(detail => detail.mslId === formatData.mslId));

                setInitialValues({
                    ...formatData,
                    revStartDate: formatData.revStartDate ? dayjs(formatData.revStartDate) : null,
                    revEndDate: formatData.revEndDate ? dayjs(formatData.revEndDate) : null,
                });

                form.setFieldsValue({
                    ...formatData,
                    revStartDate: formatData.revStartDate ? dayjs(formatData.revStartDate) : null,
                    revEndDate: formatData.revEndDate ? dayjs(formatData.revEndDate) : null,
                });
            } catch (err) {
                console.error("Failed to load edit data:", err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [auth.labId, auth.token, formatId]);

    return (
        <MasterListDocFormatForm
            mode='edit'
            form={form}
            docs={docs}
            filteredDetails={filteredDetails}
            loading={loading}
            onSubmit={handleSubmit}
            initialValues={initialValues}
            onValuesChange={handleValuesChange}
        />
    );
}

export default MasterListDocFormatEdit;
