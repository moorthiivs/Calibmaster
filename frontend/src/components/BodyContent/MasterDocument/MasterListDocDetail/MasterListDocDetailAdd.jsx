import React, { useContext, useEffect, useState } from 'react';
import '../styles/style.css';
import { AuthContext } from '../../../../context/auth-context';
import config from "../../../../utils/config.js";
import { useDispatch } from 'react-redux';
import MasterListDocDetailForm from '../../Forms/MasterListDocDetailForm';
import { Form } from 'antd';
import GlobalNotification from '../../../../utils/GlobalNotification';

function MasterListDocDetailAdd() {
    const today = new Date();
    const twoYearsFromToday = new Date();
    twoYearsFromToday.setFullYear(today.getFullYear() + 2);
    const auth = useContext(AuthContext);
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch();
    const [docs, setDocs] = useState([]);
    const [formData, setFormData] = useState({
        groupName: '',
        docNumber: '',
        docTitle: '',
        revisionNo: '',
        issueRevDate: today,
        effectiveStartDate: today,
        effectiveEndDate: twoYearsFromToday,
        retentionPeriod: '',
        possession: '',
        mslId: null,
    });

    const [form] = Form.useForm();


    useEffect(() => {
        const fetchDocs = async () => {
            setLoading(true)
            try {
                const response = await fetch(`${config.Calibmaster.URL}/api/master-list-docs/fetchAll?labid=${auth.labId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch documents');
                }
                const data = await response.json();

                console.log(data, "data");
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, mslId: Number(data[0].mslId) }));
                }
                setDocs(data);
            } catch (error) {
                console.error('Error fetching docs:', error.message);
            } finally {
                setLoading(false)
            }
        };

        fetchDocs();
    }, []);

    const handleSubmit = async (values) => {
        setLoading(true)
        try {
            const allData = {
                ...values,
                issueRevDate: values.issueRevDate?.format("YYYY-MM-DD"),
                effectiveStartDate: values.effectiveStartDate?.format("YYYY-MM-DD"),
                effectiveEndDate: values.effectiveEndDate?.format("YYYY-MM-DD"),
                labId: auth.labId,
                createdBy: auth.userId,
            };
            const response = await fetch(config.Calibmaster.URL + '/api/master-list-docs-details/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(allData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong!');
            }

            const result = await response.json();
            setFormData({
                groupName: '',
                docNumber: '',
                docTitle: '',
                revisionNo: '',
                issueRevDate: null,
                effectiveStartDate: null,
                effectiveEndDate: null,
                retentionPeriod: '',
                possession: '',
                mslId: null
            });

            form.resetFields();
            GlobalNotification.success({
                title: 'Document Details Created',
                description: 'The Document Details was created successfully.',
            });

        } catch (error) {
            console.error(error);
            GlobalNotification.error({
                title: 'Submission Failed',
                description: error.message || 'Something went wrong!',
            });
        } finally {
            setLoading(false)
        }
    };

    return (


        <>
            {/* <div className='MasterListDoc_container'>
                <Card className='MasterListDoc_card'>
                    <h3 className='heading'>Add Master List Document</h3>
                    <div className='formGrid'>

                        <div className='inputWrapper'>
                            <Select
                                label="Master List Doc Name"
                                placeholder="Select DocName"
                                options={docs.map(doc => ({ label: doc.mslDocName, value: doc.mslId }))}
                                value={formData.mslId}
                                onChange={e => handleChange('mslId', Number(e.target.value))}
                                error={errors.mslId}
                                required={true}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <Input
                                label="Group Name"
                                placeholder="Enter group name"
                                type="text"
                                value={formData.groupName}
                                onChange={e => handleChange('groupName', e.target.value)}
                                error={errors.groupName}
                                required={true}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <Input
                                label="Document Number"
                                placeholder="Enter document number"
                                type="text"
                                value={formData.docNumber}
                                onChange={e => handleChange('docNumber', e.target.value)}
                                error={errors.docNumber}
                                required={true}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <Input
                                label="Document Title"
                                placeholder="Enter document title"
                                type="text"
                                value={formData.docTitle}
                                onChange={e => handleChange('docTitle', e.target.value)}
                                error={errors.docTitle}
                                required={true}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <Input
                                label="Revision Number"
                                placeholder="Enter revision number"
                                type="text"
                                value={formData.revisionNo}
                                onChange={e => handleChange('revisionNo', e.target.value)}
                                error={errors.revisionNo}
                                required={true}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <DatePicker
                                id="issueRevDate"
                                value={formData.issueRevDate}
                                onChange={value => handleChange('issueRevDate', value)}
                                label="Issue/Revision Date"
                                formatStyle="large"
                                //locale="en-US"
                                error={errors.issueRevDate}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <DatePicker
                                id="effectiveStartDate"
                                value={formData.effectiveStartDate}
                                onChange={value => handleChange('effectiveStartDate', value)}
                                label="Effective Start Date"
                                formatStyle="large"
                                //locale="en-US"
                                error={errors.effectiveStartDate}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <DatePicker
                                id="effectiveEndDate"
                                value={formData.effectiveEndDate}
                                onChange={value => handleChange('effectiveEndDate', value)}
                                label="Effective End Date"
                                formatStyle="large"
                                //locale="en-US"
                                minDate={formData.effectiveStartDate}
                                error={errors.effectiveEndDate}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <Input
                                label="Retention Period"
                                placeholder="Enter retention period (optional)"
                                type="text"
                                value={formData.retentionPeriod}
                                onChange={e => handleChange('retentionPeriod', e.target.value)}
                                error={errors.retentionPeriod}
                            />
                        </div>

                        <div className='inputWrapper'>
                            <Input
                                label="Possession"
                                placeholder="Enter possession (optional)"
                                type="text"
                                value={formData.possession}
                                onChange={e => handleChange('possession', e.target.value)}
                                error={errors.possession}
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Button
                            label="Create Document"
                            variant="brand"
                            onClick={handleSubmit}
                            className="rainbow-m-around_medium"
                        />
                    </div>
                </Card>
            </div>
            {loading && <Loader />} */}
            <MasterListDocDetailForm
                mode='create'
                form={form}
                docs={docs}
                initialValues={formData}
                loading={loading}
                onSubmit={handleSubmit}
            />
        </>

    );
}

export default MasterListDocDetailAdd;
