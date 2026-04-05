import { configureStore } from "@reduxjs/toolkit";
import sidebarReducer from "./sidebar";
import notificationReducer from "./nofitication";
import companiesReducer from "./companies";
import itemsReducer from "./items";
import usersReducer from "./users";
import srfsReducer from "./srfs";
import srfitemsReducer from "./srfitems";
import selecteditemsReducer from "./selecteditems";
import masterlistReducer from "./masterlist";
import filtereditemsReducer from "./filtereditems";
import filteredsrfsReducer from "./filteredsrfs";
import isloadingReducer from "./isloadingslice";
import labIdReducer from "./labId";
import instrumentNameReducer from "./instrumentName";
import childSrfItemsReducer from "./childSrfItems";
import umpListItemsReducer from "./umpItemsList";
import procedureReducer from "./procedureSlice";
import instrumentIdReducer from "./instrumentId";
import syncDataReducer from "./syncDataSlice";

const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    notification: notificationReducer,
    companies: companiesReducer,
    items: itemsReducer,
    users: usersReducer,
    srfs: srfsReducer,
    srfitems: srfitemsReducer,
    selecteditems: selecteditemsReducer,
    masterlist: masterlistReducer,
    filtereditems: filtereditemsReducer,
    filteredsrfs: filteredsrfsReducer,
    isloading: isloadingReducer,
    labIdKey: labIdReducer,
    instrumentNameKey: instrumentNameReducer,
    childSrfItems: childSrfItemsReducer,
    umpListItems: umpListItemsReducer,
    procedures: procedureReducer,
    instrumentId: instrumentIdReducer,
    syncData: syncDataReducer,
  },
});

export default store;
