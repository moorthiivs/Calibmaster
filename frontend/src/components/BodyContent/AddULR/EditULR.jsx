import { useContext, useEffect, useState } from "react";
import accreditationDetailValidation from "./accreditationDetailValidation";
import { Modal, Input, Spinner, Button, Select, DatePicker } from "react-rainbow-components";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.js";
import axios from "axios";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import { locationGenerator } from "./helpers";
import "./style.css";
import { formattedDate } from "../../helpers/Helper";
import Loader from "../../UI/Loader";

const EditULR = ({ isopen, onclose, ulrInfo }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const each_input_group = {
        width: '27%',
        marginBottom: '1rem',
        padding: '1rem'
    };

    const currentYear = new Date().getFullYear();

    const [accreditationDetail, setAccreditationDetail] = useState({
        accreditationNumber: "",
        currentYear: currentYear % 100,
        location: "",
        runningNumber: "",
        accreditedScope: "",
        effectiveFlag: "",
        effectiveStartDateString: "",
        effectiveEndDateString: "",
        ulrcount: 1
    });
    const [locationOptions, setLocationOptions] = useState([]);
    const [validationError, setValidationError] = useState({});
    const [loading, setloading] = useState(false);

    useEffect(() => {
        setAccreditationDetail((prev) => {
            return {
                ...prev,
                accreditationNumber: ulrInfo?.accreditationNumber,
                currentYear: ulrInfo?.currentYear,
                location: ulrInfo?.location,
                runningNumber: ulrInfo?.runningNumber,
                accreditedScope: ulrInfo?.accreditedScope,
                effectiveFlag: ulrInfo?.effectiveFlag,
                effectiveStartDateString: ulrInfo?.effectiveStartDate,
                effectiveEndDateString: ulrInfo?.effectiveEndDate,
            }
        })
        setLocationOptions(locationGenerator());
    }, [ulrInfo]);

    function handleChange(event) {
        let value = (event.target.value).toUpperCase().trim();
        if (/^[a-zA-Z]*$/.test(value)) {
            setAccreditationDetail((prev) => {
                return { ...prev, [event.target.name]: value }
            })
        }
    }

    function dateChangeHandler(data, type) {
        if (type == "start") {
            setAccreditationDetail((prev) => {
                return { ...prev, effectiveStartDateString: data }
            })
        }
        if (type == "end") {
            setAccreditationDetail((prev) => {
                return { ...prev, effectiveEndDateString: data }
            })
        }
    }

    async function handleSubmitSave() {

        let validationError = accreditationDetailValidation(accreditationDetail);
        setValidationError(validationError);

        if (
            validationError.ulrcount == "" && validationError.accreditationNumber == "" &&
            validationError.currentYear == "" && validationError.location == ""
        ) {
            accreditationDetail.lab_id = auth.labId;
            setloading(true);

            await axios.post(config.Calibmaster.URL + "/api/ulr-no-generation/ulr-update", accreditationDetail)
                .then((res) => {
                    const newNotification = {
                        title: "Date Updated successfully",
                        icon: "success",
                        state: true,
                        timeout: 1500,
                    };
                    dispatch(notificationActions.changenotification(newNotification));
                    setloading(false);
                    onclose();
                }).catch((err) => {
                    console.log(err);
                    const newNotification = {
                        title: "Something went wrong",
                        icon: "error",
                        state: true,
                        timeout: 1500,
                    };
                    dispatch(notificationActions.changenotification(newNotification));
                    setloading(false);
                })
        }
    }

    if (loading)
        return <Loader />;

    return (
        <Modal
            isOpen={isopen}
            onRequestClose={onclose}
            title="Edit ULR Info"
            style={{ width: "90%" }}
            footer={
                <div className="rainbow-flex center">
                    <Button
                        label="Update"
                        variant="brand"
                        onClick={handleSubmitSave}
                    />
                </div>
            }
        >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>

                <div style={each_input_group}>
                    <Input
                        label="Accreditation Number:"
                        placeholder="Accreditation Number"
                        name="accreditationNumber"
                        value={accreditationDetail.accreditationNumber}
                        required
                        onChange={handleChange}
                        maxLength={7}
                        minLength={7}
                    />
                    {validationError.accreditationNumber && <span style={{ color: "red" }}>{validationError.accreditationNumber}</span>}
                    <span className="helper">Accreditation Certificate Number e.g., TC-XXXX, CC-XXXX, RC-XXXX</span>
                </div>
                <div style={each_input_group}>
                    <Input
                        label="Current Year:"
                        placeholder="Current Year"
                        name="currentYear"
                        required
                        onChange={handleChange}
                        maxLength={2}
                        minLength={2}
                        value={accreditationDetail.currentYear}
                    />
                    {validationError.currentYear && <span style={{ color: "red" }}>{validationError.currentYear}</span>}
                    <span className="helper">Year e.g., 20 for the year 2020</span>
                </div>
                <div style={each_input_group}>
                    <Select
                        label="Select Location"
                        options={locationOptions}
                        value={accreditationDetail?.location}
                        name="location"
                        required
                        onChange={handleChange}
                    />
                    {validationError.location && <span style={{ color: "red" }}>{validationError.location}</span>}
                    <span className="helper">
                        Location identification, e.g., O is for laboratories with single
                        location. In case of multi-location laboratories, 1,2,3,4,5 stand for location 1,2 etc.
                    </span>
                </div>
                <div style={each_input_group}>
                    <Input
                        label="Running Number"
                        name="runningNumber"
                        placeholder="Running Number"
                        value={accreditationDetail.runningNumber}
                        readOnly
                        disabled
                    />
                    <span className="helper">
                        Running number of the report starting from 00000001 to 99999999
                        in each calendar year. The numbering has to be started afresh
                        in each calendar year.
                    </span>
                </div>
                <div style={each_input_group}>
                    <Input
                        label="Accredited Scope:"
                        placeholder="Accredited Scope"
                        required
                        name="accreditedScope"
                        value={accreditationDetail.accreditedScope}
                        onChange={handleChange}
                        maxLength={1}
                    />
                    {validationError.accreditedScope && <span style={{ color: "red" }}>{validationError.accreditedScope}</span>}
                    <span className="helper">
                        Denotes that all the parameters in the report are in the accredited
                        scope. Non-accredited parameters are not mentioned in the report.
                    </span>
                </div>
                <div style={each_input_group}>
                    <DatePicker
                        label="Effective Start Date"
                        formatStyle="medium"
                        locale="en-IN"
                        value={accreditationDetail?.effectiveStartDateString}
                        required={true}
                        onChange={(val) => dateChangeHandler(formattedDate(val), "start")}
                    />
                </div>
                <div style={each_input_group}>
                    <DatePicker
                        label="Effective End Date"
                        formatStyle="medium"
                        locale="en-IN"
                        value={accreditationDetail?.effectiveEndDateString}
                        required={true}
                        onChange={(val) => dateChangeHandler(formattedDate(val), "end")}
                    />
                </div>
                <div style={each_input_group}>
                    <Input
                        label="Effective Flag"
                        placeholder="Effective Flag"
                        name="effectiveFlag"
                        value={accreditationDetail.effectiveFlag}
                        readOnly
                        disabled
                    />
                </div>
            </div>
        </Modal>
    )
}

export default EditULR;
