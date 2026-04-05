import { createSlice } from "@reduxjs/toolkit";

const usersSlice = createSlice({
  name: "users",
  initialState: {
    list: [],
  },
  reducers: {
    changeusers(state, action) {
      state.list = [...action.payload];
    },
  },
});

export default usersSlice.reducer;
export const usersActions = usersSlice.actions;
