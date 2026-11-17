import { createSlice } from "@reduxjs/toolkit";

const instrumentTypeIdSlice = createSlice({
    name: "instrumentTypeId",
    initialState: {
        current: null,
    },
    reducers: {
        setInstrumentTypeId(state, action) {
            state.current = action.payload;
        },
    },
});

export default instrumentTypeIdSlice.reducer;
export const instrumentTypeIdActions = instrumentTypeIdSlice.actions;
