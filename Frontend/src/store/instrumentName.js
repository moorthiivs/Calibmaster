import { createSlice } from "@reduxjs/toolkit";

const instrumentNameSlice = createSlice({

    name: "instrumentName",
    initialState: {
        current: null,
    },
    reducers: {
        changeInstrumentName(state, action) {

            const {
                name,
                rangeMin,
                rangeMax,
                rangeUom,
                lc,
                lcUOM,
                size,
                sizeUom
            } = action.payload;

            let createValue = `${name} ${(rangeMin && rangeMax && rangeUom) ? rangeMin + "-" + rangeMax + " " + rangeUom : ""
                } ${(lc && lcUOM && lcUOM != "Select") ? "LC " + lc + " " + lcUOM : ""} ${(size && sizeUom && sizeUom != "Select") ? "Size " + size + " " + sizeUom : ""
                }`;

            state.current = createValue;
        },
    },
});

export default instrumentNameSlice.reducer;
export const instrumentNameActions = instrumentNameSlice.actions;