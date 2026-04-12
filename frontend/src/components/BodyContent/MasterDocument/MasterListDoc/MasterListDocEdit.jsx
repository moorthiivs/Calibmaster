import React, { useContext, useEffect, useState } from 'react';
import '../styles/style.css';
import { useDispatch } from 'react-redux';
import { AuthContext } from '../../../../context/auth-context';
import config from '../../../../utils/config.js';
import MasterListDocumentForm from '../../Forms/MasterListDocumentForm';
import { Form } from 'antd';
import dayjs from 'dayjs';
import GlobalNotification from '../../../../utils/GlobalNotification';

function MasterListDocEdit({ mslId, onClose, onUpdate }) {
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchDoc = async () => {
            try {

                const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs/${mslId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${auth.token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch document.');
                }
                const doc = await response.json();
                const formattedData = {
                    docName: doc.mslDocName,
                    revisionNo: doc.mslDocRevisionNo,
                    startDate: dayjs(doc.mslRevDateStart),
                    endDate: dayjs(doc.mslRevDateEnd),
                };
                form.setFieldsValue(formattedData);
            } catch (error) {
                console.error('Error fetching doc:', error.message);
            }
        };

        fetchDoc();
    }, [mslId, auth.labId, auth.token]);

    const handleSubmit = async (values) => {

        setLoading(true)
        const updateData = {
            mslId,
            mslDocName: values.docName,
            revisionNo: values.revisionNo,
            startDate: values.startDate,
            endDate: values.endDate,
            labId: auth.labId,
            updatedBy: auth.userId,
        };

        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs/update/${mslId}`, {
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
                title: 'Document Updated',
                description: 'The master list document was Updated successfully.',
                duration: 2
            });


            if (onUpdate) onUpdate();
            if (onClose) onClose();

        } catch (error) {
            console.error('Update failed:', error.message);
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
        // <div className={'MasterListDoc_container'} style={{ width: "auto" }}>
        //     <Card className={'MasterListDoc_card'}>
        //         <h3 className='heading'>Edit Master List Document</h3>
        //         <div className='formGrid'>
        //             <div className='inputWrapper'>
        //                 <Input
        //                     label="Document Name"
        //                     placeholder="Enter document name"
        //                     type="text"
        //                     value={formData.docName}
        //                     onChange={(e) => handleChange('docName', e.target.value)}
        //                     required
        //                     error={errors.docName}
        //                 />
        //             </div>

        //             <div className='inputWrapper'>
        //                 <Input
        //                     label="Revision Number"
        //                     placeholder="Enter revision number"
        //                     type="text"
        //                     value={formData.revisionNo}
        //                     onChange={(e) => handleChange('revisionNo', e.target.value)}
        //                     required
        //                     error={errors.revisionNo}
        //                 />
        //             </div>

        //             <div className='inputWrapper'>
        //                 <DatePicker
        //                     id="start-date"
        //                     value={formData.startDate}
        //                     onChange={(value) => handleChange('startDate', value)}
        //                     label="Revision Start Date"
        //                     formatStyle="large"
        //                     //locale="en-US"
        //                 />
        //             </div>

        //             <div className='inputWrapper'>
        //                 <DatePicker
        //                     id="end-date"
        //                     value={formData.endDate}
        //                     onChange={(value) => handleChange('endDate', value)}
        //                     label="Revision End Date"
        //                     formatStyle="large"
        //                     //locale="en-US"
        //                     minDate={formData.startDate}
        //                 />
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
        <MasterListDocumentForm
            mode='edit'
            initialValues={{}}
            onSubmit={handleSubmit}
            loading={loading}
            form={form}
        />
    );
}

export default MasterListDocEdit;
