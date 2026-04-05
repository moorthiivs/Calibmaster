import { createSlice } from "@reduxjs/toolkit";

const descriptionSlice = createSlice({
  name: "description",
  initialState: {
    list: [],
  },
  reducers: {
    additem(state, action) {
      state.list = [...state.list, action.payload];
    },
    removeitem(state, action) {
      state.list.splice(action.payload, 1);
    },
  },
});

export default descriptionSlice.reducer;
export const descriptionActions = descriptionSlice.actions;
