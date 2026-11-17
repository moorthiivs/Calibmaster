import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import config from "../utils/config.json"

const initialState = {
  labs: { data: null, status: "idle", error: null },
  clientUsers: { data: null, status: "idle", error: null },
  customers: { data: null, status: "idle", error: null },
  certificates: { data: null, status: "idle", error: null },
  postLab: { data: null, status: "idle", error: null },
  postClientUser: { data: null, status: "idle", error: null },
  postCustomer: { data: null, status: "idle", error: null },
  postCertificate: { data: null, status: "idle", error: null },
}

// Define async thunks
export const fetchLabById = createAsyncThunk(
  "syncData/fetchLabById",
  async ({ labId, token, cancelToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        config.Calibmaster.URL + "/api/lab/fetchLabById",
        { labId },
        {
          cancelToken,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const fetchClientUsers = createAsyncThunk(
  "syncData/fetchClientUsers",
  async ({ labId, token, cancelToken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        config.Calibmaster.URL + `/api/users/getuserbyLabid/${labId}`,
        {
          cancelToken,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const fetchCustomers = createAsyncThunk(
  "syncData/fetchCustomers",
  async ({ id, token, cancelToken }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        config.Calibmaster.URL + `/api/customers/fetch_customer/${id}`,
        {
          cancelToken,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const fetchCertificates = createAsyncThunk(
  "syncData/fetchCertificates",
  async ({ lab_id, token, cancelToken }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        config.Calibmaster.URL + "/api/certificate/fetchCertificateById",
        { lab_id },
        {
          method: "GET",
          cancelToken,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

// Define async thunks for posting data
export const postLabData = createAsyncThunk(
  "syncData/postLabData",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        config.CustomerPortal.URL + "/api/lab/postLabData",
        data.data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const postClientUserData = createAsyncThunk(
  "syncData/postClientUserData",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        config.CustomerPortal.URL + "/api/users/postUserData",
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const postCustomerData = createAsyncThunk(
  "syncData/postCustomerData",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        config.CustomerPortal.URL + "/api/company/postCustomerData",
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

export const postCertificateData = createAsyncThunk(
  "syncData/postCertificateData",
  async (certificateData, { rejectWithValue }) => {
    console.log(certificateData)
    try {
      const response = await axios.post(
        config.CustomerPortal.URL + "/api/certificate/postCertificateData",
        certificateData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data)
    }
  }
)

// Create slice
const syncDataSlice = createSlice({
  name: "syncData",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Labs
    builder
      .addCase(fetchLabById.pending, (state) => {
        state.labs.status = "loading"
      })
      .addCase(fetchLabById.fulfilled, (state, action) => {
        state.labs.status = "succeeded"
        state.labs.data = action.payload
      })
      .addCase(fetchLabById.rejected, (state, action) => {
        state.labs.status = "failed"
        state.labs.error = action.payload
      })
      .addCase(postLabData.pending, (state) => {
        state.postLab.status = "loading"
      })
      .addCase(postLabData.fulfilled, (state, action) => {
        state.postLab.status = "succeeded"
        state.postLab.data = action.payload
      })
      .addCase(postLabData.rejected, (state, action) => {
        state.postLab.status = "failed"
        state.postLab.error = action.payload
      })

    // Client Users
    builder
      .addCase(fetchClientUsers.pending, (state) => {
        state.clientUsers.status = "loading"
      })
      .addCase(fetchClientUsers.fulfilled, (state, action) => {
        state.clientUsers.status = "succeeded"
        state.clientUsers.data = action.payload
      })
      .addCase(fetchClientUsers.rejected, (state, action) => {
        state.clientUsers.status = "failed"
        state.clientUsers.error = action.payload
      })
      .addCase(postClientUserData.pending, (state) => {
        state.postClientUser.status = "loading"
      })
      .addCase(postClientUserData.fulfilled, (state, action) => {
        state.postClientUser.status = "succeeded"
        state.postClientUser.data = action.payload
      })
      .addCase(postClientUserData.rejected, (state, action) => {
        state.postClientUser.status = "failed"
        state.postClientUser.error = action.payload
      })

    // Customers
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.customers.status = "loading"
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers.status = "succeeded"
        state.customers.data = action.payload
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.customers.status = "failed"
        state.customers.error = action.payload
      })
      .addCase(postCustomerData.pending, (state) => {
        state.postCustomer.status = "loading"
      })
      .addCase(postCustomerData.fulfilled, (state, action) => {
        state.postCustomer.status = "succeeded"
        state.postCustomer.data = action.payload
      })
      .addCase(postCustomerData.rejected, (state, action) => {
        state.postCustomer.status = "failed"
        state.postCustomer.error = action.payload
      })

    // Certificates
    builder
      .addCase(fetchCertificates.pending, (state) => {
        state.certificates.status = "loading"
      })
      .addCase(fetchCertificates.fulfilled, (state, action) => {
        state.certificates.status = "succeeded"
        state.certificates.data = action.payload
      })
      .addCase(fetchCertificates.rejected, (state, action) => {
        state.certificates.status = "failed"
        state.certificates.error = action.payload
      })
      .addCase(postCertificateData.pending, (state) => {
        state.postCertificate.status = "loading"
      })
      .addCase(postCertificateData.fulfilled, (state, action) => {
        state.postCertificate.status = "succeeded"
        state.postCertificate.data = action.payload
      })
      .addCase(postCertificateData.rejected, (state, action) => {
        state.postCertificate.status = "failed"
        state.postCertificate.error = action.payload
      })
  },
})

export default syncDataSlice.reducer

// Selectors
export const selectLabs = (state) => state.syncData.labs.data
export const selectClientUsers = (state) => state.syncData.clientUsers.data
export const selectCustomers = (state) => state.syncData.customers.data
export const selectCertificates = (state) => state.syncData.certificates.data
export const selectPostLab = (state) => state.syncData.postLab
export const selectPostClientUser = (state) => state.syncData.postClientUser
export const selectPostCustomer = (state) => state.syncData.postCustomer
export const selectPostCertificate = (state) => state.syncData.postCertificate
