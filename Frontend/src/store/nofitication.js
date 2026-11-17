import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    title: null,
    description: null,
    icon: null,
    state: false,
    timeout: 15000,
  },
  reducers: {
    changenotification(state, action) {
      state.title = action.payload.title;
      state.description = action.payload.description;
      state.icon = action.payload.icon;
      state.state = action.payload.state;
      state.timeout = action.payload.timeout;
    },
  },
});

export default notificationSlice.reducer;
export const notificationActions = notificationSlice.actions;
