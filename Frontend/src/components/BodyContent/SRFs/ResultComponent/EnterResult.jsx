import React, { useState, useEffect, useContext } from 'react'
import { Select, Button, Card, Typography, Spin, Skeleton, Divider, Space } from 'antd'
import config from '../../../../utils/config.json'
import { AuthContext } from '../../../../context/auth-context'
import EditDefinedProdedureModal from './EditDefinedProdedureModal'

import { useParams } from "react-router-dom";
import GlobalNotification from '../../../../utils/GlobalNotification'

const { Title, Text } = Typography;


const EnterResult = ({ isOpen, onRequestClose, srfItemInfo }) => {

  const params = useParams();

  const srf_item_id = srfItemInfo?.srf_item_id || params.srf_item_id;
  const srf_id = srfItemInfo?.srf_id || params.srf_id;
  const intrument_type_id = srfItemInfo?.intrument_type_id || params.intrument_type_id;

  const auth = useContext(AuthContext)


  const [setTitle, setSetTitle] = useState(false)
  const [disableFrom, setDisableFrom] = useState(false)

  const [data, setData] = useState([])

  const [seletecdProcedure, setSeletecdProcedure] = useState('')
  const [loading, setloading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)

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

      GlobalNotification.success({
        title: 'Defined Procedure List fetched Successfully',
        description: '',
      })
    } catch (error) {
      console.log(error)
      GlobalNotification.error({
        title: 'Something went wrong',
        description: 'Failed to fetch procedure list.',
      })
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
      setFileLoading(true)
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

      if (response.ok) {
        let newArray = [
          { value: result.result.cmeid, label: result.result.FileName }
        ]

        setdropdownfilename(newArray)

        GlobalNotification.success({
          title: result.response,
        })
      } else {
        setdropdownfilename([])
        GlobalNotification.error({
          title: result?.message || 'No Procedure Excel Found',
        })
      }
    } catch (error) {
      console.log(error)
    } finally {
      setFileLoading(false)
    }
  }

  return (
    <>
      <p className="hidden">
        srf_item_id: {JSON.stringify(srf_item_id)}, srf_id:{' '}
        {JSON.stringify(srf_id)}, intrument_type_id:{' '}
        {JSON.stringify(intrument_type_id)}
      </p>

      <div className="w-full shadow-sm" style={{ borderRadius: 12 }}>
        {loading ? (
          <div className="p-4">
            <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 3 }} />
            <Divider />
            <Skeleton.Button active block size="large" style={{ height: 45 }} />
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div
              className="text-center mb-6 p-4 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                border: '1px solid #e2e8f0'
              }}
            >
              <Title level={4} style={{ color: '#1e293b', marginBottom: 4, marginTop: 0 }}>
                Enter Calibration Result
              </Title>
              {seletecdProcedure && (
                <Text type="secondary" className="text-sm font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                  {seletecdProcedure}
                </Text>
              )}
            </div>

            {/* Procedure Selection */}
            {!disableFrom && (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="w-full max-w-xl">
                  <Space direction="vertical" className="w-full" size="small">
                    <Text strong className="text-xs text-slate-500 uppercase tracking-wide">
                      Select Procedure <span className="text-red-500">*</span>
                    </Text>
                    <Select
                      options={data}
                      value={masterId}
                      disabled={disableFrom}
                      onChange={(value) => {
                        handleChangeMaster(value)
                        setMasterId(value)
                      }}
                      size="large"
                      className="w-full"
                      placeholder="Select defined procedure"
                    />
                  </Space>

                  <Spin spinning={fileLoading}>
                    {dropdownfilename.length !== 0 && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Space direction="vertical" className="w-full" size="small">
                          <Text strong className="text-xs text-slate-500 uppercase tracking-wide">
                            Procedure File: <Text code>{dropdownfilename[0].label}</Text>
                          </Text>
                          <Select
                            options={dropdownfilename}
                            disabled={dropdownfilename.length > 0 ? false : disableFrom}
                            size="large"
                            className="w-full"
                            value={dropdownfilename[0].value}
                          />
                        </Space>
                      </div>
                    )}
                  </Spin>
                </div>

                <Button
                  type="primary"
                  disabled={!masterId || disableFrom}
                  onClick={() => {
                    if (masterId !== '') {
                      openModalHandler()
                      setDisableFrom(true)
                    }
                  }}
                  size="large"
                  className="min-w-[200px] shadow-md"
                  style={{ borderRadius: 8, height: 45 }}
                >
                  Continue to Results
                </Button>
              </div>
            )}

            {/* Placeholder if procedure is already selected and modal is managing it */}
            {disableFrom && !openModal && (
              <div className="text-center py-8">
                <Text type="secondary">Procedure already selected and initialized.</Text>
                <div className="mt-4">
                  <Button type="link" onClick={() => setDisableFrom(false)}>
                    Change Procedure
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Defined Procedure Modal */}
        {openModal && (
          <EditDefinedProdedureModal
            isOpen={openModal}
            onRequestClose={closeModalHandler}
            masterId={masterId}
            srf_id={srf_id}
            srf_item_id={srf_item_id}
            setSetTitle={setSetTitle}
            parentModalClose={onRequestClose}
          />
        )}
      </div>
    </>
  )
}

export default EnterResult
