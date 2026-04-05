import React, { useContext, useEffect, useState } from 'react';
import { Spinner, Button, Card, Input, DatePicker, Select, Textarea, FileSelector, MultiSelect } from "react-rainbow-components";
import { notificationActions } from "../../../store/nofitication";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import { getBase64, populateDisciplineData, populateGroupData } from './HelperFunction';
import "./StandardDetails.css";
import { formattedDate } from '../../helpers/Helper';
import Loader from '../../UI/Loader';
import { Option } from 'react-rainbow-components';
import { Modal, notification } from 'antd';
import EquipmentForm from '../Forms/EquipmentForm';
import dayjs from "dayjs";
// import { Modal } from "react-rainbow-components";
const EditMaster = (props) => {

    const { fetchMaster } = props;


    const [Discipline, setDiscipline] = useState([]);
    const [Group, setGroup] = useState([]);

    const [disciplineValue, setDisciplineValue] = useState(fetchMaster?.instrument_discipline_id);
    const [groupValue, setGroupValue] = useState(fetchMaster?.instrument_group_id);
    const [enableGroup, setenableGroup] = useState(true);

    const [masterId, setMasterId] = useState(fetchMaster?.master_list_equipment_id);
    const [standardMaintained, setStandardMaintained] = useState(fetchMaster?.standard_maintained);
    const [nameOfEquipment, setNameOfEquipment] = useState(fetchMaster?.name_of_equipment);
    const [uid, setUid] = useState(fetchMaster?.uid);
    const [typeOfFacility, setTypeOfFacility] = useState(fetchMaster?.type_of_facility);
    const [make, setMake] = useState(fetchMaster?.make);
    const [modelType, setModelType] = useState(fetchMaster?.model_type);
    const [yearOfMake, setYearOfMake] = useState(fetchMaster?.year_Of_make);
    const [serialNo, setSerialNo] = useState(fetchMaster?.serial_no);
    const [assetNumber, setAssetNumber] = useState(fetchMaster?.asset_number);
    const [receiptDate, setReceiptDate] = useState(fetchMaster?.receipt_date);
    const [datePlacedInService, setDatePlacedInService] = useState(fetchMaster?.date_placed_in_service);
    const [range, setRange] = useState(fetchMaster?.range);
    const [uncertainty, setUncertainty] = useState(fetchMaster?.uncertainty || 'N/A');
    const [leastCount, setLeastCount] = useState(fetchMaster?.least_Count);
    const [leastProductTolerance, setLeastProductTolerance] = useState(fetchMaster?.least_product_tolerance);
    const [accuracy, setAccuracy] = useState(fetchMaster?.accuracy);
    const [historyCardNumber, setHistoryCardNumber] = useState(fetchMaster?.history_card_number);
    const [department, setDepartment] = useState(fetchMaster?.department);
    const [dateOfLastCalibrationDate, setDateOfLastCalibrationDate] = useState(fetchMaster?.date_of_last_calibration_date);
    const [calibrationCertificateNo, setCalibrationCertificateNo] = useState(fetchMaster?.calibration_certificate_no);
    const [calibrationFrequency, setCalibrationFrequency] = useState(fetchMaster?.calibration_frequency);
    const [calibrationValidUpto, setCalibrationValidUpto] = useState(fetchMaster?.calibration_valid_upto);
    const [calibrationAgency, setCalibrationAgency] = useState(fetchMaster?.calibration_agency);
    const [calibratedBy, setCalibratedBy] = useState(fetchMaster?.calibrated_by);
    const [equipmentStatus, setEquipmentStatus] = useState([
        { value: '--', label: 'Select' },
        { value: 'Calibrated', label: 'Calibrated' },
        { value: 'Expired', label: 'Expired' },
        { value: 'Sent for Calibration', label: 'Sent for Calibration' },
        { value: 'Under Repair', label: 'Under Repair' },
        { value: 'Retired', label: 'Retired' }
    ]);
    const [equipmentStatusValue, setEquipmentStatusValue] = useState(fetchMaster?.equipment_status);
    const [traceablity, setTraceablity] = useState(fetchMaster?.traceability);
    const [nextCalibrationRemainder, setNextCalibrationRemainder] = useState(fetchMaster?.next_calibration_reminder);
    const [remark, setRemark] = useState(fetchMaster?.remark);
    const [masterCalibration, setMasterCalibration] = useState("");

    const [masterCalibrationErr, setMasterCalibrationErr] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [electroParameters, setelectroParameters] = useState([])

    const [selectedDiscipline, setselectedDiscipline] = useState(false)



    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [makes, setMakes] = useState([]);
    const [models, setModels] = useState([]);

    const fetchData = async () => {
        try {

            setLoading(true);
            const disciplineResponse = await fetch(config.Calibmaster.URL + "/api/instrument-discipline/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
            }).then((res) => res.json());
            let getDisciplineData = await populateDisciplineData(disciplineResponse.data);



            const ismatch = getDisciplineData.some((item, index) => item.value === fetchMaster?.instrument_discipline_id && item.label === "ELECTRO TECHNICAL")


            setselectedDiscipline(ismatch)
            setDiscipline(getDisciplineData);

            setLoading(false);
        } catch (error) {
            notification.error({
                message: "Something went wrong",
                description: "",
            });
            setLoading(false);
        }
    }


    const fetchMakeandModel = async (type) => {
        try {
            const res = await fetch(config.Calibmaster.URL + `/api/makemodel/${type}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }
            });
            const data = await res.json();
            if (type === 'make') setMakes(data);
            else setModels(data);
        } catch (err) {
            message.error(`Failed to load ${type}s`);
        }
    };

    useEffect(() => {
        fetchData();
        fetchMakeandModel('make')
        fetchMakeandModel('model')
    }, []);

    useEffect(() => {
        if (props.fetchMaster) {
            disciplineHandler(disciplineValue);

            if (fetchMaster.electro_parameter && Array.isArray(fetchMaster.electro_parameter)) {
                const formatted = fetchMaster.electro_parameter.map((param) => ({
                    name: param,
                    label: param
                }));
                setelectroParameters(formatted);
            }

        }
    }, [props]);

    // TODO: Handles file uploads
    const handleFileChange = async (info) => {

        const file = info?.fileList?.[0]?.originFileObj;
        if (!file) return;
        //const file = files[0];
        if (file) {
            const validTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/pdf'
            ];
            if (!validTypes.includes(file.type)) {
                setMasterCalibrationErr('Please select a JPEG, PNG, or PDF file.');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setMasterCalibrationErr('File size must be less than 2MB.');
            } else {
                try {
                    const base64 = await getBase64(file);
                    setMasterCalibration(base64);
                    setMasterCalibrationErr('');
                } catch (error) {
                    setMasterCalibrationErr('Error While converting file.');
                };
            }
        };
    }

    const disciplineHandler = async (id) => {
        try {
            if (id != "") {
                setLoading(true);
                setDisciplineValue(id);

                const groupResponse = await fetch(config.Calibmaster.URL + `/api/instrument-groups/fetch/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + auth.token,
                    },
                }).then((res) => res.json());
                let getGroupData = await populateGroupData(groupResponse.data)

                // console.log(getGroupData.length);

                setGroup(getGroupData);
                setenableGroup(false);
                setLoading(false);
            } else {
                setenableGroup(true);
                setLoading(false);
                return;
            }
        } catch (error) {
            notification.error({
                message: "Error While Getting Instrument Group!!!",
                description: "",
            });
            setLoading(false);
        }
    }



    const editMasterListHandler = async (values) => {
        setLoading(true);
        try {
            const requestBody = {
                master_list_equipment_id: masterId,
                lab_id: auth.labId,
                instrument_discipline_id: values.discipline,
                instrument_group_id: values.group,
                standard_maintained: values.standardMaintained,
                name_of_equipment: values.nameOfEquipment,
                uid: values.uid,
                type_of_facility: values.typeOfFacility,
                make: values.make,
                model_type: values.modelType,
                year_Of_make: values.yearOfMake,
                serial_no: values.serialNo,
                asset_number: values.assetNumber,
                receipt_date: values.receiptDate,
                date_placed_in_service: values.datePlacedInService,
                range: values.range,
                least_Count: values.leastCount,
                least_product_tolerance: values.leastProductTolerance,
                accuracy: values.accuracy,
                uncertainty: values.uncertainty,
                history_card_number: values.historyCardNumber,
                department: values.department,
                date_of_last_calibration_date: values.dateOfLastCalibrationDate,
                calibration_certificate_no: values.calibrationCertificateNo,
                calibration_frequency: values.calibrationFrequency,
                calibration_valid_upto: values.calibrationValidUpto,
                calibration_agency: values.calibrationAgency,
                calibrated_by: values.calibratedBy,
                equipment_status: values.equipmentStatus,
                traceability: values.traceability,
                next_calibration_reminder: values.nextCalibrationRemainder,
                remark: values.remark,
                master_calibration: masterCalibration,
                electro_parameter: values.electroParameters || [],
            };

            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(requestBody)
            };



            const response = await fetch(config.Calibmaster.URL + "/api/master-list-equipments/update", requestOptions);
            const data = await response.json();

            if (data?.code == 200) {
                notification.success({
                    message: "Success",
                    description: "Equipment updated successfully",
                    duration: 1
                });
                props.onclose();
            } else {
                notification.error({
                    message: data?.message,
                    description: "",
                });
                setError(data?.message);
            }
        } catch (error) {
            notification.error({
                message: "Something went wrong",
                description: "",
            });
        } finally {
            setLoading(false);
        }
    }

    const initialData = {
        discipline: disciplineValue,
        group: groupValue,
        standardMaintained: standardMaintained,
        nameOfEquipment: nameOfEquipment,
        uid: uid,
        typeOfFacility: typeOfFacility,
        make: make,
        modelType: modelType,
        yearOfMake: yearOfMake ? dayjs(yearOfMake) : null,
        serialNo: serialNo,
        assetNumber: assetNumber,
        receiptDate: receiptDate ? dayjs(receiptDate) : null,
        datePlacedInService: datePlacedInService ? dayjs(datePlacedInService) : null,
        range: range,
        uncertainty: uncertainty,
        leastCount: leastCount,
        leastProductTolerance: leastProductTolerance,
        accuracy: accuracy,
        historyCardNumber: historyCardNumber,
        department: department,
        dateOfLastCalibrationDate: dateOfLastCalibrationDate ? dayjs(dateOfLastCalibrationDate) : null,
        calibrationCertificateNo: calibrationCertificateNo,
        calibrationFrequency: calibrationFrequency,
        calibrationValidUpto: calibrationValidUpto ? dayjs(calibrationValidUpto) : null,
        calibrationAgency: calibrationAgency,
        calibratedBy: calibratedBy,
        equipmentStatus: equipmentStatusValue,
        traceability: traceablity,
        nextCalibrationRemainder: nextCalibrationRemainder,
        electroParameters: electroParameters?.map(item => item.name) || [],
        remark: remark
    };



    return (


        <>

            <Modal open={props.isopen}
                onCancel={props.onclose}
                destroyOnClose
                footer={null}
                width="100%"
                style={{ top: 0, padding: 0 }}
                className="full-screen-modal"
            >

                <EquipmentForm
                    mode='edit'
                    initialData={initialData}
                    Discipline={Discipline}
                    Group={Group}
                    equipmentStatus={equipmentStatus}
                    disciplineHandler={disciplineHandler}
                    handleFileChange={handleFileChange}
                    isselectedDiscipline={selectedDiscipline}
                    onSubmit={editMasterListHandler}
                    makes={makes}
                    models={models}
                    isLoading={loading}
                />
            </Modal>
        </>
    )
}

export default EditMaster