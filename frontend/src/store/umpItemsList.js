import { createSlice } from "@reduxjs/toolkit";

const umpListSlice = createSlice({
    name: "umpListItems",
    initialState: {
        list: [],
    },
    reducers: {
        addUMPList(state, action) {
            state.list = [...state.list, action.payload];
        },
        removeUMPItem(state, action) {
            state.list.splice(action.payload, 1);
        },
        removeAllUMPItem(state, action) {
            state.list = [];
        },
        addBulkUMPList(state, action) {
            state.list = action.payload;
        },
    },
});

export default umpListSlice.reducer;
export const umpListActions = umpListSlice.actions;