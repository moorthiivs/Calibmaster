import React, { useState, useEffect, useContext } from 'react';
import { Drawer, Form, message } from 'antd';
import AddItemForm from '../../components/BodyContent/Forms/AddItemForm';
import { AuthContext } from '../../context/auth-context';
import config from '../../utils/config.json';
import { populateUomWithsysmbol } from "../../components/BodyContent/Instrument/HelperFunction";

const TaskCalibrationDrawer = ({ visible, onClose, item, onSaveSuccess }) => {
    const auth = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);
    const [instrumentCategories, setInstrumentCategories] = useState([]);
    const [UOM, setUOM] = useState([]);
    const [instrument_name, setInstrument_name] = useState('');
    const [description, setDescription] = useState('');

    const options = [
        { value: 'Okay', label: 'Okay' },
        { value: 'Good', label: 'Good' },
        { value: 'Satisfactory', label: 'Satisfactory' },
        { value: 'Others', label: 'Others' },
    ];

    useEffect(() => {
        if (visible) {
            fetchInitialData();
            if (item) {
                initializeForm(item);
            }
        } else {
            form.resetFields();
        }
    }, [visible, item]);

    const fetchInitialData = async () => {
        const categories = ['makes', 'models', 'categories', 'uoms'];
        
        try {
            // 1. Try Online First
            const [makesRes, modelsRes, categoriesRes, uomRes] = await Promise.all([
                fetch(`${config.Calibmaster.URL}/api/makemodel/make`, { headers: { Authorization: `Bearer ${auth.token}` } }),
                fetch(`${config.Calibmaster.URL}/api/makemodel/model`, { headers: { Authorization: `Bearer ${auth.token}` } }),
                fetch(`${config.Calibmaster.URL}/api/instrument-types/listCategoryofInstruments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
                    body: JSON.stringify({ lab_id: auth.labId })
                }),
                fetch(`${config.Calibmaster.URL}/api/uom/list`, { headers: { Authorization: `Bearer ${auth.token}` } })
            ]);

            const [makesData, modelsData, categoriesData, uomData] = await Promise.all([
                makesRes.json(),
                modelsRes.json(),
                categoriesRes.json(),
                uomRes.json()
            ]);

            setMakes(makesData);
            setModels(modelsData);
            setInstrumentCategories(categoriesData.data || []);
            const populatedUOM = await populateUomWithsysmbol(uomData.data || []);
            setUOM(populatedUOM);
        } catch (err) {
            console.warn("Network fetch for master data failed, trying local storage...", err);
            
            // 2. Fallback to Local SQLite
            if (window.electron?.db) {
                try {
                    const localMakes = await window.electron.db.getMasterData('makes');
                    const localModels = await window.electron.db.getMasterData('models');
                    const localCats = await window.electron.db.getMasterData('categories');
                    const localUoms = await window.electron.db.getMasterData('uoms');

                    if (localMakes) setMakes(localMakes);
                    if (localModels) setModels(localModels);
                    if (localCats) setInstrumentCategories(localCats);
                    if (localUoms) {
                        const populatedUOM = await populateUomWithsysmbol(localUoms);
                        setUOM(populatedUOM);
                    }
                    
                    if (localMakes || localModels || localCats || localUoms) {
                        message.info("Loaded calibration lookup data from local storage.");
                    }
                } catch (dbErr) {
                    console.error("Local database fetch failed", dbErr);
                }
            }
        }
    };

    const initializeForm = (item) => {
        // Pre-fill form from TaskItem
        form.setFieldsValue({
            instrumentType: item.instrument_type_id,
            labType: item.lab_type || "NABL",
            Category: item.category || null,
            remarks: "Okay"
        });
        
        // If it's already completing an existing srfitem
        if (item.srfItem) {
            const si = item.srfItem;
            form.setFieldsValue({
                make: si.make,
                model: si.model,
                serialNumber: si.serial_no,
                assetId: si.identification_details,
                remarks: si.remarks || "Okay"
            });
        }
    };

    const handleSave = async (values) => {
        setLoading(true);
        try {
            const dbParams = values.parameters?.map(param => ({
                [param.parameterName]: param.value,
                InstrumentUOMID: param.uom_id,
                InstrumentparameterUOM: UOM.find(u => u.value === param.uom_id)?.label || "",
                Symbols: param.Symbols || "",
                SymbolPos: param.SymbolPos || ""
            })) || [];

            const finalRemarks = values.remarks === "Others" ? values.customRemarks : values.remarks;
            
            const payload = {
                item: {
                    name: instrument_name || item.instrumentType?.instrument_full_name,
                    description: description || item.instrumentType?.instrument_full_name,
                    make: values.make,
                    model: values.model,
                    serial_no: values.serialNumber,
                    identification_details: values.assetId,
                    remarks: finalRemarks,
                    intrument_type_id: values.instrumentType,
                    reminder_frequency: values.reminderFrequency || 0,
                    frequency_days: values.reminderDays || 0,
                    calibrationAt: values.calibrationAt,
                    labtype: values.labType,
                    ranges: dbParams,
                    instrument_type_at_calibration: values.type
                },
                labId: auth.labId
            };

            // 1. Try Online Save
            try {
                const response = await fetch(`${config.Calibmaster.URL}/api/tasks/items/${item.task_item_id}/web-calibrate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth.token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    message.success("Calibration results saved and synced!");
                    onSaveSuccess();
                    onClose();
                    return;
                } else {
                    const result = await response.json();
                    throw new Error(result.message || "Server rejected calibration data");
                }
            } catch (err) {
                // 2. Fallback to Local SQLite
                if (window.electron?.db) {
                    await window.electron.db.saveMeasurement({
                        taskId: item.task_id,
                        taskItemId: item.task_item_id,
                        payload: payload
                    });
                    
                    message.warning("Saved Locally: Network unavailable. Data stored in SQLite.");
                    onSaveSuccess();
                    onClose();
                } else {
                    message.error(err.message || "Network error. No local database available.");
                }
            }
        } catch (globalErr) {
            console.error(globalErr);
            message.error("An unexpected error occurred while saving.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            title={`Calibrate: ${item?.instrumentType?.instrument_full_name || 'Instrument'}`}
            placement="right"
            width={1000}
            onClose={onClose}
            open={visible}
            maskClosable={false}
        >
            <AddItemForm
                mode={item?.srf_item_id ? "edit" : "create"}
                loading={loading}
                options={options}
                auth={auth}
                makes={makes}
                models={models}
                onSubmit={handleSave}
                setInstrument_name={setInstrument_name}
                setDescription={setDescription}
                form={form}
                instrumentCategories={instrumentCategories}
                UOM={UOM}
            />
        </Drawer>
    );
};

export default TaskCalibrationDrawer;
