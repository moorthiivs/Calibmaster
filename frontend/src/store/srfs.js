import { createSlice } from "@reduxjs/toolkit";

const srfsSlice = createSlice({
  name: "srfs",
  initialState: {
    list: [],
  },
  reducers: {
    changesrfs(state, action) {
      state.list = [...action.payload];
    },
  },
});

export default srfsSlice.reducer;
export const srfsActions = srfsSlice.actions;
