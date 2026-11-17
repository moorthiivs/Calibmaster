import { createSlice } from "@reduxjs/toolkit";

const customerId_Slice = createSlice({
    name: "customerId",
    initialState: {
        current: null,
    },
    reducers: {
        setCustomerId(state, action) {
            state.current = action.payload;
        },
    },
});

export default customerId_Slice.reducer;
export const customerIdActions = customerId_Slice.actions;
