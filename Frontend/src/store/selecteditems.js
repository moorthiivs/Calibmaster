import { createSlice } from "@reduxjs/toolkit";

const selecteditemsSlice = createSlice({
  name: "selecteditems",
  initialState: {
    list: [],
  },
  reducers: {
    changeselecteditems(state, action) {
      state.list = [...action.payload];
    },
  },
});

export default selecteditemsSlice.reducer;
export const selecteditemsActions = selecteditemsSlice.actions;
