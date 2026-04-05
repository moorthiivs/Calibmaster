import { createSlice } from "@reduxjs/toolkit";

const instrumentIdSlice = createSlice({
  name: "instrumentId",
  initialState: {
    current: null,
  },
  reducers: {
    setInstrumentId(state, action) {
      state.current = action.payload;
    },
  },
});

export default instrumentIdSlice.reducer;
export const instrumentIdActions = instrumentIdSlice.actions;