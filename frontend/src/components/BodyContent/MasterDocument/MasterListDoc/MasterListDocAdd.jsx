import React, { useContext, useState } from 'react';
import '../styles/style.css'
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.js";
import Loader from '../../../UI/Loader';
import MasterListDocumentForm from '../../Forms/MasterListDocumentForm';
import { Form } from 'antd';
import GlobalNotification from '../../../../utils/GlobalNotification';
function MasterListDocAdd() {
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState(false)
    const today = new Date();
    const twoYearsFromToday = new Date();
    twoYearsFromToday.setFullYear(today.getFullYear() + 2);
    const [formData, setFormData] = useState({
        docName: '',
        revisionNo: 'Rev-00',
        startDate: today,
        endDate: twoYearsFromToday,
    });
    const [errors, setErrors] = useState({
        docName: '',
        revisionNo: '',
    });
    const [form] = Form.useForm();

    const handleSubmit = async (formattedData) => {        
        setLoading(true);
        const allData = {
            docName: formattedData.docName,
            revisionNo: formattedData.revisionNo,
            startDate: formattedData.startDate,
            endDate: formattedData.endDate,
            labId: auth.labId,
            createdBy: auth.userId,
        };
        try {
            const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify(allData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong!');
            }

            const result = await response.json();

            // Reset state
            const today = new Date();
            const end = new Date();
            end.setFullYear(today.getFullYear() + 2);

            setFormData({
                docName: '',
                revisionNo: 'Rev-00',
                startDate: today,
                endDate: end,
            });
            form.resetFields();
            GlobalNotification.success({
                title: 'Document Created',
                description: 'The master list document was created successfully.',
            });
        } catch (error) {
            GlobalNotification.error({
                title: 'Submission Failed',
                description: error.message || 'Unable to submit the document.',
            });

        } finally {
            setLoading(false);
        }
    };
    return (
        //  <div className={'MasterListDoc_container'} >
        //         <Card className={'MasterListDoc_card'}>
        //             <h3 className='heading'>Add Master List Document</h3>

        //             <div className='formGrid'>
        //                 <div className='inputWrapper'>
        //                     <Input
        //                         label="Document Name"
        //                         placeholder="Enter document name"
        //                         type="text"
        //                         value={formData.docName}
        //                         onChange={(e) => handleChange('docName', e.target.value)}
        //                         required
        //                         error={errors.docName}
        //                     />
        //                 </div>

        //                 <div className='inputWrapper'>
        //                     <Input
        //                         label="Revision Number"
        //                         placeholder="Enter revision number"
        //                         type="text"
        //                         value={formData.revisionNo}
        //                         onChange={(e) => handleChange('revisionNo', e.target.value)}
        //                         required
        //                         error={errors.revisionNo}
        //                     />
        //                 </div>

        //                 <div className='inputWrapper'>
        //                     <DatePicker
        //                         id="start-date"
        //                         value={formData.startDate}
        //                         onChange={(value) => handleChange('startDate', value)}
        //                         label="Revision Start Date"
        //                         formatStyle="large"
        //                     //locale="en-US"
        //                     />
        //                 </div>

        //                 <div className='inputWrapper'>
        //                     <DatePicker
        //                         id="end-date"
        //                         value={formData.endDate}
        //                         onChange={(value) => handleChange('endDate', value)}
        //                         label="Revision End Date"
        //                         formatStyle="large"
        //                         //locale="en-US"
        //                         minDate={formData.startDate}
        //                     />
        //                 </div>
        //             </div>

        //             <div style={{ textAlign: 'center', marginTop: '20px' }}>
        //                 <Button
        //                     label="Create Document"
        //                     variant="brand"
        //                     onClick={handleSubmit}
        //                     className="rainbow-m-around_medium"
        //                 />
        //             </div>
        //         </Card>
        //  </div> 

        <>
            <MasterListDocumentForm
                initialValues={formData}
                onSubmit={handleSubmit}
                loading={loading}
                form={form}
                
            />

            {loading && <Loader />}
        </>

    );
}

export default MasterListDocAdd;
