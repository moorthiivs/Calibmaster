import { createSlice } from "@reduxjs/toolkit";

const filtereditemsSlice = createSlice({
  name: "filtereditems",
  initialState: {
    list: [],
  },
  reducers: {
    changeitems(state, action) {
      state.list = [...action.payload];
    },
  },
});

export default filtereditemsSlice.reducer;
export const filtereditemsActions = filtereditemsSlice.actions;
