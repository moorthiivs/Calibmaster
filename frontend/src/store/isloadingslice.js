import { createSlice } from "@reduxjs/toolkit";

const isloadingSlice = createSlice({
    name: "isloading",
    initialState: {
        state: false
    },
    reducers: {
        changeisloading(state, action) {
            state.state = action.payload;
        },
    },
});

export default isloadingSlice.reducer;
export const isloadingActions = isloadingSlice.actions;
