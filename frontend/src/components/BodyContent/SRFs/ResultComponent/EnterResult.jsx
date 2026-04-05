import React, { useState, useEffect, useContext } from 'react'
import {
  Modal,
  Button,
  Card,
  TableWithBrowserPagination,
  Column,
  Select
} from 'react-rainbow-components'
import config from '../../../../utils/config.json'
import { AuthContext } from '../../../../context/auth-context'
import { useDispatch } from 'react-redux'
import { notificationActions } from '../../../../store/nofitication'
import EditDefinedProdedureModal from './EditDefinedProdedureModal'
import Loader from '../../../UI/Loader'
import { useParams } from "react-router-dom";

const EnterResult = ({ isOpen, onRequestClose, srfItemInfo }) => {

  const params = useParams();

  const srf_item_id = srfItemInfo?.srf_item_id || params.srf_item_id;
  const srf_id = srfItemInfo?.srf_id || params.srf_id;
  const intrument_type_id = srfItemInfo?.intrument_type_id || params.intrument_type_id;

  const auth = useContext(AuthContext)
  const dispatch = useDispatch()

  const [setTitle, setSetTitle] = useState(false)
  const [disableFrom, setDisableFrom] = useState(false)

  const [data, setData] = useState([])

  const [seletecdProcedure, setSeletecdProcedure] = useState('')
  const [loading, setloading] = useState(false)

  const [masterId, setMasterId] = useState('')

  const [openModal, setOpenModal] = useState(false)

  const fetchDefinedProcedures = async () => {
    try {
      setloading(true)
      const data = await fetch(
        config.Calibmaster.URL + '/api/design-procedures/list',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + auth.token
          },
          body: JSON.stringify({
            lab_id: auth.labId,
            instrument_type_id: intrument_type_id,
            srf_id,
            srf_item_id
          })
        }
      )

      let response = await data.json()
      setSeletecdProcedure(response?.definedProcedures[0]?.calibration_procedure);
      if (response?.is_exist) {
        let newArray = [{ value: '', label: 'Select' }]

        await response?.definedProcedures?.map((item, index) => {
          newArray[index + 1] = {
            value: item?.master_design_procedure_id,
            label: item?.calibration_procedure
          }
        })

        setData(newArray)



        setMasterId(response?.existingResultMaster?.master_result_table_id)

        setSetTitle(response?.is_exist)

        setDisableFrom(response?.is_exist)

        setOpenModal(true)

        setloading(false)
      } else {
        let newArray = [{ value: '', label: 'Select' }]

        await response?.definedProcedures?.map((item, index) => {
          newArray[index + 1] = {
            value: item?.master_design_procedure_id,
            label: item?.calibration_procedure
          }
        })

        setData(newArray)
        setloading(false)
      }

      const newNotification = {
        title: 'Defined Procedure List fetched Successfully',
        description: '',
        icon: 'success',
        state: true,
        timeout: 1500
      }
      return dispatch(notificationActions.changenotification(newNotification))
    } catch (error) {
      console.log(error)
      const newNotification = {
        title: 'Something went wrong',
        description: '',
        icon: 'error',
        state: true,
        timeout: 1500
      }
      dispatch(notificationActions.changenotification(newNotification))
      setloading(false)
    }
  }

  const openModalHandler = () => {
    setOpenModal(true)
  }

  const closeModalHandler = () => {
    setOpenModal(false)
  }

  const [dropdownfilename, setdropdownfilename] = useState([])


  useEffect(() => {
    fetchDefinedProcedures()

  }, [])

  const handleChangeMaster = async id => {
    try {
      if (!id) {
        return alert('Please Select one Master')
      }

      const response = await fetch(
        `${config.Calibmaster.URL}/api/calibmasterexcel/fetchOne-calibmaster-excel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + auth.token
          },
          body: JSON.stringify({
            lab_id: auth.labId,
            master_design_procedure_id: parseInt(id)
          })
        }
      )
      const result = await response.json()


      //console.log(result,"result");


      if (response.ok) {
        let newArray = [
          { value: result.result.cmeid, label: result.result.FileName }
        ]

        setdropdownfilename(newArray)
        // console.log(result.result.ExcelData, 'result.result.ExcelData')

        //setExcelFileData(result.result)

        //setselectedSheetData(result.result)

        dispatch(
          notificationActions.changenotification({
            title: `${result.response}`,
            icon: 'success',
            state: true,
            timeout: 1500
          })
        )
      } else {
        setdropdownfilename([])
        dispatch(
          notificationActions.changenotification({
            title: result?.message || 'No Procedure Excel Found',
            icon: 'error',
            state: true,
            timeout: 1500
          })
        )

      }
    } catch (error) {
      console.log(error)
    }
  }

  // if (loading) return <Loader />

  return (
    // <Modal
    //   isOpen={isOpen}
    //   onRequestClose={onRequestClose}
    //   title={setTitle ? 'Update Result' : 'Enter Result'}
    //   style={{ width: '100%', height: '100%', zIndex: 9990 }}
    //   className="rainbow-modal edit_enter_result_modal"
    // >


    <>
      <p style={{ display: 'none' }}>
        srf_item_id: {JSON.stringify(srf_item_id)}, srf_id:{' '}
        {JSON.stringify(srf_id)}, intrument_type_id:{' '}
        {JSON.stringify(intrument_type_id)}
      </p>

      <Card
        title={
          <div>
            <h2 style={{ margin: 0 }}>Enter Result</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#888" }}>
              {seletecdProcedure}
            </p>
          </div>
        }
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          alignItems: 'center'
        }}
      >
        <div style={{ display: disableFrom ? 'none' : 'grid', width: '100%', alignItems: "center", justifyItems: "center" }}>
          {/* Select Procedure */}
          <div className='input_group'>
            <Select
              label='Select Procedure'
              options={data}
              required={true}
              disabled={disableFrom}
              className='rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto'
              onChange={e => {
                handleChangeMaster(e.target.value)
                setMasterId(e.target.value)
              }}
            />

            {dropdownfilename.length !== 0 && (
              <Select
                label={`Procedure File Name "${dropdownfilename[0].label}"`}
                options={dropdownfilename}
                required={true}
                disabled={dropdownfilename.length > 0 ? false : disableFrom}
                className='rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto'
                // onChange={e => handleSelectfilename(e.target.value)}
                style={{ marginTop: '10px' }}
              />
            )}
          </div>

          {/* Modal Open button */}
          <Button
            label='Select'
            disabled={disableFrom}
            onClick={() => {
              if (masterId != '') {
                openModalHandler()
                setDisableFrom(true)
              }
            }}
            variant='success'
            style={{ width: '15%', height: '45px' }}
          />
        </div>



        {openModal && (
          <EditDefinedProdedureModal
            isOpen={openModal}
            onRequestClose={closeModalHandler}
            masterId={masterId}
            srf_id={srf_id}
            srf_item_id={srf_item_id}
            setSetTitle={setSetTitle}
            parentModalClose={onRequestClose}
          //sheetData={selectedSheetData}
          />
        )}
      </Card>
    </>

    // </Modal>
  )
}

export default EnterResult
