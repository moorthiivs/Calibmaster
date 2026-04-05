import { createSlice } from "@reduxjs/toolkit";

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState: {
    availability: true,
  },
  reducers: {
    setAvailability(state, action) {
      state.availability = action.payload;
    },
  },
});

export default sidebarSlice.reducer;
export const sidebarActions = sidebarSlice.actions;
