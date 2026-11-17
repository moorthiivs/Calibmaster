import React, { useEffect, useRef, useContext, useCallback } from "react"
import { faSync } from "@fortawesome/free-solid-svg-icons"
import { useDispatch, useSelector } from "react-redux"
import { AuthContext } from "../../../context/auth-context"
import axios from "axios"
import useNotification from "./useNotification" // Import the custom hook
import {
  fetchLabById,
  fetchClientUsers,
  fetchCustomers,
  fetchCertificates,
  postLabData,
  postClientUserData,
  postCustomerData,
  postCertificateData,
  selectLabs,
  selectClientUsers,
  selectCustomers,
  selectCertificates,
  selectPostLab,
  selectPostCertificate,
  selectPostCustomer,
  selectPostClientUser,
} from "../../../store/syncDataSlice"
import {
  SyncPageContainer,
  Header,
  CardContainer,
  Card,
  CardTitle,
  SyncButton,
  SyncIcon,
} from "./styledComponents"

const SyncPage = () => {
  const dispatch = useDispatch()
  const effectRan = useRef(false)
  const auth = useContext(AuthContext)
  const labs = useSelector(selectLabs)
  const clientUsers = useSelector(selectClientUsers)
  const customers = useSelector(selectCustomers)
  const certificates = useSelector(selectCertificates)
  const postLabs = useSelector(selectPostLab)
  const postClientUsers = useSelector(selectPostClientUser)
  const postCustomers = useSelector(selectPostCustomer)
  const postCertificates = useSelector(selectPostCertificate)

  const fetchData = useCallback(() => {
    const labsCancelToken = axios.CancelToken.source()
    const clientUsersCancelToken = axios.CancelToken.source()
    const customersCancelToken = axios.CancelToken.source()
    const certificatesCancelToken = axios.CancelToken.source()

    dispatch(
      fetchLabById({
        labId: auth.labId,
        token: auth.token,
        cancelToken: labsCancelToken.token,
      })
    )
    dispatch(
      fetchClientUsers({
        labId: auth.labId,
        token: auth.token,
        cancelToken: clientUsersCancelToken.token,
      })
    )
    dispatch(
      fetchCustomers({
        id: auth.userId,
        token: auth.token,
        cancelToken: customersCancelToken.token,
      })
    )
    dispatch(
      fetchCertificates({
        lab_id: auth.labId,
        token: auth.token,
        cancelToken: certificatesCancelToken.token,
      })
    )
  }, [dispatch, auth.labId, auth.userId, auth.token])

  useEffect(() => {
    if (effectRan.current) return
    fetchData()
    effectRan.current = true
  }, [fetchData])

  // Use the custom hook for each post action status
  useNotification(
    postLabs.status,
    postLabs?.data?.message,
    "Failed to sync labs data."
  )
  useNotification(
    postClientUsers.status,
    postClientUsers?.data?.message,
    "Failed to sync Client Users data."
  )
  useNotification(
    postCustomers.status,
    postCustomers?.data?.message,
    "Failed to sync Customers data."
  )
  useNotification(
    postCertificates.status,
    postCertificates?.data?.message,
    "Failed to sync Certificates data."
  )

  const handleSyncLab = async () => {
    console.log("Sync button clicked for: Lab")
    if (!labs.data.lab.lab_id) {
      console.error("Lab ID is missing or invalid.")
      return;
    }
    try {
      dispatch(
        postLabData({
          data: { ...labs.data },
        })
      )
    } catch (error) {
      console.error("Failed to sync Lab:", error)
    }
  }

  const handleSyncClientUser = async () => {
    console.log("Sync button clicked for: Client User")
    const clientUserData = clientUsers.data;

    try {
      dispatch(postClientUserData(clientUserData))
    } catch (error) {
      console.error("Failed to sync Client User:", error)
    }
  }

  const handleSyncCustomer = async () => {
    console.log("Sync button clicked for: Customer")

    try {
      dispatch(postCustomerData(customers))
    } catch (error) {
      console.error("Failed to sync Customer:", error)
    }
  }

  const handleSyncCertificate = async () => {
    console.log("Sync button clicked for: Certificate Generation")
    try {
      dispatch(postCertificateData(certificates))
    } catch (error) {
      console.error("Failed to sync Certificate Generation:", error)
    }
  }

  // console.log("Labs", labs)
  //console.log("Users", clientUsers)
  //console.log("Customers", customers)

  return (
    <SyncPageContainer>
      <Header>Sync Data</Header>
      <CardContainer>
        <Card>
          <CardTitle>Labs</CardTitle>
          <SyncButton onClick={handleSyncLab}>
            <SyncIcon icon={faSync} />
            Sync Now
          </SyncButton>
        </Card>
        <Card>
          <CardTitle>Client User</CardTitle>
          <SyncButton onClick={handleSyncClientUser}>
            <SyncIcon icon={faSync} />
            Sync Now
          </SyncButton>
        </Card>
        <Card>
          <CardTitle>Customer</CardTitle>
          <SyncButton onClick={handleSyncCustomer}>
            <SyncIcon icon={faSync} />
            Sync Now
          </SyncButton>
        </Card>
        <Card>
          <CardTitle>Certificate Generation</CardTitle>
          <SyncButton onClick={handleSyncCertificate}>
            <SyncIcon icon={faSync} />
            Sync Now
          </SyncButton>
        </Card>
      </CardContainer>
    </SyncPageContainer>
  )
}

export default SyncPage
