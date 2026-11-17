import { useContext, useEffect, useState } from "react";
import { Modal, Button, Input, Select } from 'react-rainbow-components';
import config from "../../../../utils/config.json";
import axios from 'axios';
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../../context/auth-context";
import GlobalNotification from "../../../../utils/GlobalNotification";
import { umpListActions } from "../../../../store/umpItemsList";

const AddUncertaintyParameterModal = ({ isopen, onclose }) => {

    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [umpId, setUmpId] = useState("");

    // *** Fetch Uncertainty Parameters List From Redux Store ***
    const umpListItems = useSelector((state) => state.umpListItems.list);

    // *** Fetch Uncertainty Parameters List ***
    const fetchUMPList = async () => {
        try {
            setIsLoading(true);

            const headers = {
                "Content-Type": "application/json",
                Authorization: "Bearer " + auth.token,
            };

            const response = await axios
                .get(`${config.Calibmaster.URL}/api/uncertainty-master-parameters/list/${auth.labId}`,
                    { headers }
                );

            if (response?.status === 200) {
                const { msg, query } = response.data;
                setIsLoading(false);

                const modify = query.map((item) => {
                    item.value = item.uncertainty_master_parameter_id;
                    item.label = item.name;
                    return item;
                })
                modify.unshift({ value: "", label: "Select" })
                setData(modify);
            } else {
                setIsLoading(false);
                GlobalNotification.error({
                    title: "Something went wrong",
                });
            }
        } catch (error) {
            console.log(error);
            setIsLoading(false)
            GlobalNotification.error({
                title: "Internal Server Error",
            });
        }
    }

    useEffect(() => {
        fetchUMPList();
    }, []);

    // *** Add Uncertainty Parameter Handler ***
    const addUncertaintyParameterHandler = () => {

        if (umpId) {
            let check = false;

            umpListItems.map((item) => {
                if (item.uncertainty_master_parameter_id == umpId) {
                    return check = true;
                }
            })

            if (!check) {
                data.filter((item) => {
                    if (item.uncertainty_master_parameter_id == umpId) {
                        dispatch(umpListActions.addUMPList(item));
                        onclose();
                    }
                })
            } else {
                GlobalNotification.success({
                    title: "Item is already added",
                });
            }
        } else {
            GlobalNotification.warning({
                title: "No Selection",
                description: "Please Select a Parameter",
            });
        }
    }

    if (isLoading)
        return <Loader />;

    return (
        <Modal
            isOpen={isopen}
            onRequestClose={onclose}
            title={`Add Uncertainty Parameter`}
            style={{ width: '90%' }}
            footer={
                <div className='ump_modal_footer'>
                    {error && <p className="err_tag">{error}</p>}
                    <Button label="Add" variant="brand"
                        onClick={addUncertaintyParameterHandler}
                    />
                </div>
            }
        >
            <div className="edit_modal_container">

                <div className="each_input_item">
                    <Select
                        label="Select Uncertainty Parameters"
                        options={data}
                        onChange={(e) => setUmpId(e.target.value)}
                    />
                </div>

            </div>
        </Modal>
    )
}

export default AddUncertaintyParameterModal;