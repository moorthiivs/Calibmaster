import { createSlice } from "@reduxjs/toolkit";

const childSrfItemsSlice = createSlice({
    name: "childSrfItems",
    initialState: {
        list: [],
    },
    reducers: {
        changesrfitems(state, action) {
            state.list = [...action.payload];
        }
    }
});

export default childSrfItemsSlice.reducer;
export const childSrfItemsActions = childSrfItemsSlice.actions;