import { createSlice } from "@reduxjs/toolkit";

const labIdSlice = createSlice({
    name: "labId",
    initialState: {
        current: null,
    },
    reducers: {
        setLabId(state, action) {
            state.current = action.payload;
        },
    },
});

export default labIdSlice.reducer;
export const labIdActions = labIdSlice.actions;