import { createSlice } from "@reduxjs/toolkit";

const masterlistSlice = createSlice({
  name: "masterlist",
  initialState: {
    list: [],
  },
  reducers: {
    changeitems(state, action) {
      state.list = [...action.payload];
    },
  },
});

export default masterlistSlice.reducer;
export const masterlistActions = masterlistSlice.actions;
