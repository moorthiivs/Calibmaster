import React, { useContext, useEffect, useState } from 'react';
import '../styles/style.css';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.json";
import MasterListDocDetailForm from '../../Forms/MasterListDocDetailForm';
import { Form } from 'antd';
import dayjs from 'dayjs';
import GlobalNotification from '../../../../utils/GlobalNotification';

function MasterListDocDetailEdit({ detailId, onClose, onUpdate }) {
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState(false)
    const [docs, setDocs] = useState([]);
    const [formReady, setFormReady] = useState(false);
    const [form] = Form.useForm();
    useEffect(() => {
        const fetchInitialData = async () => {
            try {

                setFormReady(false); // prevent premature render
                // Fetch all master list docs
                const docsResponse = await fetch(`${config.Calibmaster.URL}/api/master-list-docs/fetchAll?labid=${auth.labId}`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                });
                const docsData = await docsResponse.json();
                setDocs(docsData);

                // Fetch the detail by ID
                const detailResponse = await fetch(`${config.Calibmaster.URL}/api/master-list-docs-details/${detailId}`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                });
                const detailData = await detailResponse.json();

                const formattedData = {
                    groupName: detailData.groupName || '',
                    docNumber: detailData.docNumber || '',
                    docTitle: detailData.docTitle || '',
                    revisionNo: detailData.revisionNo || '',
                    issueRevDate: detailData.issueRevDate ? dayjs(detailData.issueRevDate) : null,
                    effectiveStartDate: detailData.effectiveStartDate ? dayjs(detailData.effectiveStartDate) : null,
                    effectiveEndDate: detailData.effectiveEndDate ? dayjs(detailData.effectiveEndDate) : null,
                    retentionPeriod: detailData.retentionPeriod || '',
                    possession: detailData.possession || '',
                    mslId: detailData.mslId ? Number(detailData.mslId) : null,
                };
                form.setFieldsValue(formattedData);
                setFormReady(true);
            } catch (error) {
                console.error("Error loading detail data:", error);
            }
        };

        fetchInitialData();
    }, [auth.labId, auth.token, detailId]);

    const handleSubmit = async (values) => {
        setLoading(true)
        try {
            const updateData = {
                ...values,
                labId: auth.labId,
                updatedBy: auth.userId,
            };

            const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs-details/update/${detailId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Update failed!');
            }
            GlobalNotification.success({
                title: 'Document Detail',
                description: 'The Document Detail was Updated successfully.',
                duration: 2
            });
            if (onUpdate) onUpdate();
            if (onClose) onClose();

        } catch (error) {
            console.error('Update failed:', error.message)
            GlobalNotification.error({
                title: 'Update Failed',
                description: error.message || 'Something went wrong!',
                duration: 2
            });

        } finally {
            setLoading(false)
        }
    };

    return (

        // <div className='MasterListDoc_container' style={{ width: "auto" }}>
        //     <Card className='MasterListDoc_card'>
        //         <h3 className='heading'>Edit Document Detail</h3>
        //         <div className='formGrid'>
        //             <div className='inputWrapper'>
        //                 <Select
        //                     label="Master List Doc Name"
        //                     placeholder="Select DocName"
        //                     options={docs.map(doc => ({ label: doc.mslDocName, value: doc.mslId }))}
        //                     value={formData.mslId}
        //                     onChange={value => handleChange('mslId', value)}
        //                     error={errors.mslId}
        //                 />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <Input label="Group Name" value={formData.groupName} onChange={e => handleChange('groupName', e.target.value)} error={errors.groupName} />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <Input label="Document Number" value={formData.docNumber} onChange={e => handleChange('docNumber', e.target.value)} error={errors.docNumber} />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <Input label="Document Title" value={formData.docTitle} onChange={e => handleChange('docTitle', e.target.value)} error={errors.docTitle} />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <Input label="Revision Number" value={formData.revisionNo} onChange={e => handleChange('revisionNo', e.target.value)} error={errors.revisionNo} />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <DatePicker label="Issue/Revision Date" value={formData.issueRevDate} onChange={value => handleChange('issueRevDate', value)} error={errors.issueRevDate} />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <DatePicker label="Effective Start Date" value={formData.effectiveStartDate} onChange={value => handleChange('effectiveStartDate', value)} error={errors.effectiveStartDate} />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <DatePicker label="Effective End Date" value={formData.effectiveEndDate} onChange={value => handleChange('effectiveEndDate', value)} minDate={formData.effectiveStartDate} error={errors.effectiveEndDate} />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <Input label="Retention Period" value={formData.retentionPeriod} onChange={e => handleChange('retentionPeriod', e.target.value)} />
        //             </div>
        //             <div className='inputWrapper'>
        //                 <Input label="Possession" value={formData.possession} onChange={e => handleChange('possession', e.target.value)} />
        //             </div>
        //         </div>

        //         <div style={{ textAlign: 'center', marginTop: '20px' }}>
        //             <Button
        //                 label="Update Document"
        //                 variant="brand"
        //                 onClick={handleSubmit}
        //                 className="rainbow-m-around_medium"
        //             />
        //         </div>
        //     </Card>
        // </div>
        <>
            {formReady && (
                <MasterListDocDetailForm
                    mode='edit'
                    form={form}
                    docs={docs}
                    loading={loading}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    );
}

export default MasterListDocDetailEdit;
