import { createSlice } from "@reduxjs/toolkit";

const filteredsrfsSlice = createSlice({
  name: "filteredsrfs",
  initialState: {
    list: [],
  },
  reducers: {
    changefilteredsrfs(state, action) {
      //console.log(action.payload);
      if (action.payload) {
        state.list = [...action.payload];
      }
      //state.list = [...action.payload];
    },
  },
});

export default filteredsrfsSlice.reducer;
export const filteredsrfsActions = filteredsrfsSlice.actions;
