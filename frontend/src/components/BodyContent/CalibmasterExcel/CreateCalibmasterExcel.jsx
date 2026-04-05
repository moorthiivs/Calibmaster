import React, { useState, useContext, useEffect } from 'react'
import { Card, Select } from 'react-rainbow-components'
import CustomButton from '../../Inputs/CustomButton'
import CustomFilePicker from '../../Inputs/CustomFilePicker'
import Loader from '../../UI/Loader'
import { useDispatch } from 'react-redux'
import { AuthContext } from '../../../context/auth-context'
import { notificationActions } from '../../../store/nofitication'
import config from '../../../utils/config.json'
import { useNavigate } from "react-router-dom";
import CalibmasterExcelForm from '../Forms/CalibmasterExcelForm'
import { message, notification } from 'antd'
//import './style/createCalimasterExcel.css'

function CreateCalibmasterExcel() {
  const auth = useContext(AuthContext)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [resetKey, setResetKey] = useState(0)

  const [DropdownprocedureName, SetDropdownprocedureName] = useState([])

  const [masterId, setMasterId] = useState('')

  const [DiagramImage, setDiagramImage] = useState([])

  const [DiagramImageerror, setDiagramImageerror] = useState('')

  const [DiagramresetKey, setDiagramresetKey] = useState(0)

  const handleFileChange = value => {
    if (value.length > 0) {
      const file = value[0]
      const name = file.name.toLowerCase()
      const extension = name.split('.').pop()
      const validExtensions = ['xlsx', 'xls']
      const validMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]

      const isValid =
        validExtensions.includes(extension) &&
        validMimeTypes.includes(file.type)

      if (isValid) {
        setFiles([file])
        setFileName(name)
        setError('')
      } else {
        setFiles([])
        setFileName('')
        setError('Only Excel files (.xlsx or .xls) are allowed.')
      }
    } else {
      setFiles([])
      setFileName('')
      setError('Please upload a file.')
    }
  }

  const fetchDefinedProcedures = async () => {
    setLoading(true)
    try {
      const data = await fetch(
        config.Calibmaster.URL + '/api/design-procedures/listProcedure',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + auth.token
          },
          body: JSON.stringify({
            lab_id: auth.labId
          })
        }
      )

      let response = await data.json()

      if (data?.ok) {
        let newArray = [{ value: '', label: 'Select' }]

        await response?.definedProcedures?.map((item, index) => {
          newArray[index + 1] = {
            value: item?.master_design_procedure_id,
            //label: item?.calibration_procedure
            label: `${item?.calibration_procedure} (${item?.instrument_type?.instrument_full_name})`
          }
        })

        SetDropdownprocedureName(newArray)
      } else {
        let newArray = [{ value: '', label: 'Select' }]

        await response?.definedProcedures?.map((item, index) => {
          newArray[index + 1] = {
            value: item?.master_design_procedure_id,
            label: item?.calibration_procedure
          }
        })
        SetDropdownprocedureName(newArray)
      }

      notification.success({ message: `Defined Procedure List fetched Successfully` });
      return
    } catch (error) {
      console.log(error)
      notification.error({ message: `Something went wrong` });
    } finally {
      setLoading(false)
    }
  }

  // const handleCreateCalibmasterExcel = async () => {
  //   if (masterId === '') {
  //     setError('Please Select One Procedure Name')
  //     return
  //   }

  //   if (files.length === 0) {
  //     setError('Please upload a valid Excel file.')
  //     return
  //   }
  //   try {
  //     setLoading(true)
  //     const formData = new FormData()
  //     formData.append('excel_file', files[0])
  //     formData.append('fileName', fileName)
  //     formData.append('userId', auth.userId)
  //     formData.append('labId', auth.labId)
  //     formData.append('master_design_procedure_id', masterId)
  //     DiagramImage.forEach(img => {
  //       formData.append('diagram_image', img)
  //     })

  //     const response = await fetch(
  //       `${config.Calibmaster.URL}/api/calibmasterexcel/create-calibmaster-excel`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           Authorization: 'Bearer ' + auth.token
  //         },
  //         body: formData
  //       }
  //     )

  //     const result = await response.json()

  //     if (response.ok) {
  //       setFiles([])
  //       setFileName('')
  //       setResetKey(prev => prev + 1)
  //       dispatch(
  //         notificationActions.changenotification({
  //           title: 'Calibmaster Excel uploaded successfully!',
  //           icon: 'success',
  //           state: true,
  //           timeout: 1500
  //         })
  //       )
  //       dispatch(sidebarActions.changesidebar('List-Calibmaster-Excel'))
  //     } else {
  //       setError(result?.message)
  //       dispatch(
  //         notificationActions.changenotification({
  //           title: result?.message || 'Failed to upload Excel.',
  //           icon: 'error',
  //           state: true,
  //           timeout: 2000
  //         })
  //       )
  //     }
  //   } catch (error) {
  //     console.error(error)
  //     dispatch(
  //       notificationActions.changenotification({
  //         title: 'An error occurred while uploading.',
  //         icon: 'error',
  //         state: true,
  //         timeout: 1500
  //       })
  //     )
  //   } finally {
  //     setLoading(false)
  //   }
  // }



  const handleCreateCalibmasterExcel = async ({ masterId, excelFile, DiagramImage }) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('excel_file', excelFile);
      formData.append('fileName', excelFile?.name || '');
      formData.append('userId', auth.userId);
      formData.append('labId', auth.labId);
      formData.append('master_design_procedure_id', masterId);

      DiagramImage.forEach(img => {
        formData.append('diagram_image', img);
      });

      const response = await fetch(
        `${config.Calibmaster.URL}/api/calibmasterexcel/create-calibmaster-excel`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + auth.token
          },
          body: formData
        }
      );

      const result = await response.json();
      if (response.ok) {
        message.success('Calibmaster Excel uploaded successfully!');
        navigate("/dashboard/excel");
      } else {
        setError(result?.message);
        message.error(result?.message || 'Failed to upload Excel.');
      }
    } catch (error) {
      console.error(error);
      message.error('An error occurred while uploading.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDefinedProcedures()
  }, [])

  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file) // Convert file to Base64
    })
  }

  const handleImageUpload = async value => {
    if (value.length === 0) {
      setDiagramImage([])
      return
    }

    const file = value[0]

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']

    if (!allowedTypes.includes(file.type)) {
      console.error('Only JPG/PNG images are allowed!')
      alert('Please upload a JPG or PNG image')
      setDiagramresetKey(prev => prev + 1)
      setDiagramImageerror('Please upload a JPG or PNG image')
      return
    }

    const maxSize = 2 * 1024 * 1024 // 2MB limit

    if (file.size > maxSize) {
      console.error('File size exceeds 2MB limit!')
      alert('Image size must be less than 2MB')
      setDiagramresetKey(prev => prev + 1)
      setDiagramImageerror('Image size must be less than 2MB')
      return
    }

    if (value.length > 0 && value.length <= 2) {
      const imageData = await Promise.all(
        Array.from(value).map(file => getBase64(file))
      )
      setDiagramImage(imageData)
      setDiagramImageerror('')
    } else {
      setDiagramImage([])
      setDiagramresetKey(prev => prev + 1)
      setDiagramImageerror('You can only upload 1 to 2 images.')
      alert(' You can only upload 1 to 2 images.')
    }
  }

  return (
    <>
      {/* <div className='create__Calibmaster__Excel_container'>
        <Card className='create__Calibmaster__Excelcard'>
          <div className='add__user__label'>
            <h3>Add Calibmaster Excel</h3>
          </div>

          <div className='create_Calibmaster__Excel_form'>
            <div
              className='input_group'
              style={{ marginLeft: 'auto', marginRight: 'auto' }}
            >
              <Select
                label='Select Procedure'
                options={DropdownprocedureName}
                required={true}
                className='rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto'
                onChange={e => {
                  setMasterId(e.target.value)
                }}
              />
            </div>
            <div
              className='fileselect-upload-excelsheet'
              style={{
                marginTop: '45px',
                display: 'flex',
                flexdirection: 'row',
                justifyContent: 'space-between',
                gap: '70px',
                alignItems: 'center'
              }}
            >
              <div className='excel-file-select'>
                <CustomFilePicker
                  className='rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto'
                  label='Upload Your Excel Sheet Here'
                  placeholder='Drag & Drop or Click to Browse'
                  bottomHelpText='Select only one file'
                  onchange={handleFileChange}
                  resetKey={resetKey}
                  required={true}
                  containerStyle={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '20vw',
                    alignItems: 'center'
                  }}
                  multiple={false}
                />
                {error && <p className='error-text'>{error}</p>}
              </div>

              <div className='digram-image-select'>
                <CustomFilePicker
                  className='rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto'
                  label='Upload Diagram Image Here'
                  placeholder='Drag & Drop or Click to Browse'
                  bottomHelpText='Select only one file'
                  onchange={handleImageUpload}
                  resetKey={DiagramresetKey}
                  containerStyle={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '20vw',
                    alignItems: 'center'
                  }}
                  multiple={true}
                  accept='image/jpg, image/jpeg, image/png'
                />
                {DiagramImageerror && (
                  <p className='error-text'>{DiagramImageerror}</p>
                )}
                {DiagramImage && (
                  <div
                    className='child_controller_btn_area'
                    style={{ justifyContent: 'center' }}
                  >
                    {DiagramImage.map(image => {
                      return (
                        <img
                          src={image}
                          alt='table-image'
                          width={100}
                          height={80}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div
              className='submit-button-calibmaster-excel'
              style={{ marginTop: '45px' }}
            >
              <CustomButton
                label='Upload Excel'
                variant='success'
                required={true}
                onclick={handleCreateCalibmasterExcel}
              />
            </div>
          </div>
        </Card>
      </div>

      {loading && <Loader />} */}

      <CalibmasterExcelForm
        DropdownprocedureName={DropdownprocedureName}
        handleFileChange={handleFileChange}
        handleCreateCalibmasterExcel={handleCreateCalibmasterExcel}
      />
    </>
  )
}

export default CreateCalibmasterExcel
