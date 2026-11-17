import { createSlice } from "@reduxjs/toolkit";

const itemsSlice = createSlice({
  name: "items",
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
    updateitem(state, action) {
      const { index, item } = action.payload;
      state.list[index] = item;
    },
    removeAllItem(state, action) {
      state.list = [];
    }
  },
});

export default itemsSlice.reducer;
export const itemsActions = itemsSlice.actions;
