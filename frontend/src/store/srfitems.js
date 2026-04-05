import { createSlice } from "@reduxjs/toolkit";

const srfitemsSlice = createSlice({
  name: "srfitems",
  initialState: {
    list: [],
  },
  reducers: {
    changesrfitems(state, action) {
      state.list = [...action.payload];
    }
  }
});

export default srfitemsSlice.reducer;
export const srfitemsActions = srfitemsSlice.actions;
