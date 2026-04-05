import React, { useEffect, useState } from 'react';
import { Lookup } from 'react-rainbow-components';
import showErrorDialog from '../../../../../utils/showErrorToast';

const AddMasterEquipments = ({ masterList, addEquipmets, setAddEquipmets }) => {

    const [state, setState] = useState({ options: null });
    const [data, setData] = useState([]);

    useEffect(() => {
        const masterlist = masterList.map((v) => ({
            ...v,
            label: v.uid
                ? `ID - ${v.uid} ${v.name_of_equipment}`
                : v.name_of_equipment,
        }));
        setData(masterlist);
    }, [masterList]);


    const selectHandler = async (option) => {
        console.log(option);
        if (!option) return;

        // Zero‑out the time part so we’re comparing pure dates
        const lastCalDate = new Date(option.calibration_valid_upto);
        lastCalDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ‑‑ Block when lastCalDate ≤ today ‑‑
        if (lastCalDate <= today) {
            const formattedDate = lastCalDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });

            await showErrorDialog(
                "Unavailable Equipment",
                `This Master Cannot be Used Because its last Calibration Date Was <b style="color: #d33;">${formattedDate}</b>.`,
                "error",
                ".edit_enter_result_modal",
                true
            );
            return;
        }

        setState({ option });

        if (option != null) {
            if (addEquipmets.indexOf(option) === -1) {
                setAddEquipmets([...addEquipmets, option]);
            }
        }
    };

    function filter(query, options) {
        if (query) {
            return options.filter((item) => {
                const regex = new RegExp(query, "i");
                return regex.test(item.label);
            });
        }
        return [];
    }

    function search(value) {
        if (state.options && state.value && value.length > state.value.length) {
            setState({
                options: filter(value, state.options),
                value,
            });
        } else if (value) {
            setState({
                value,
            });
            setState({
                options: filter(value, data),
                value,
            });
        } else {
            setState({
                value: "",
                options: null,
            });
        }
    }

    return (
        <Lookup
            label={"Master Equipments"}
            placeholder={"Master Equipments"}
            options={state?.options}
            value={state?.options}
            onChange={(option) => selectHandler(option)}
            onSearch={search}
            required={true}
        />
    );
}

export default AddMasterEquipments;