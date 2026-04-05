import { createSlice } from '@reduxjs/toolkit';

const initialState = []

const procedureSlice = createSlice({
    name: 'procedures',
    initialState,
    reducers: {
        addProcedures: (state, action) => {
            state = action.payload;
            return state;
        },
        updateKeyValProcedures: (state, action) => {
            const { rowObj } = action.payload;

            try {
                for (const subArray of state) {
                    for (const objRow of subArray) {
                        for (const EachKey in objRow) {

                            for (const eachCompareKey in rowObj) {
                                if (EachKey == eachCompareKey) {

                                    objRow[EachKey] = rowObj[eachCompareKey]
                                }
                            }
                        }
                    }
                }

                return state;
            } catch (error) {
                console.log(error);
            }
        },
    }
});

// this is for configureStore
export default procedureSlice.reducer;

// this is for dispatch
export const { addProcedures, updateKeyValProcedures } = procedureSlice.actions;