import { createSlice, current } from "@reduxjs/toolkit";
import { containsObject } from "../utils/utilfuns";

const companiesSlice = createSlice({
  name: "companies",
  initialState: {
    list: [],
  },
  reducers: {
    changecompanies(state, action) {
      const newcompanies = [];
      action.payload.map((v, i) => {
        const contains = containsObject(v, current(state.list));
        if (!contains) {
          newcompanies.push(v);
        }
        return v;
      });
      state.list = [...current(state.list), ...newcompanies];
      //console.log(state.list);
    },
  },
});

export default companiesSlice.reducer;
export const companiesActions = companiesSlice.actions;
