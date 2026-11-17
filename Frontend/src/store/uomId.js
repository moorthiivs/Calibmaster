import { createSlice } from "@reduxjs/toolkit";

const uomIdSlice = createSlice({
    name: "uomId",
    initialState: {
        current: null,
    },
    reducers: {
        setUomId(state, action) {
            state.current = action.payload;
        },
    },
});

export default uomIdSlice.reducer;
export const uomIdActions = uomIdSlice.actions;
