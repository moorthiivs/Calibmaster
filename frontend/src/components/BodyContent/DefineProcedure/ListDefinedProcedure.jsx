import React, { useContext, useState, useEffect } from 'react'
import {
  Modal,
  Card,
  TableWithBrowserPagination,
  Column,
  Spinner
} from 'react-rainbow-components'
//import { Button, Input} from 'react-rainbow-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClone } from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../../../context/auth-context'
import config from '../../../utils/config.json'
import { notificationActions } from '../../../store/nofitication'
import { useDispatch } from 'react-redux'

import EditDefinedProdedureModal from './EditDefinedProdedureModal'
import ReviewProcedureModal from './ReviewProcedure/ReviewProcedureModal'
import TestProcedureModal from './TestProcedure/TestProcedureModal'
import showConfirmationDialog from '../../../utils/showConfirmationToast'
import ReusableTable from '../../Table/ReusableTable'

import { Button, Input, Popconfirm, Space } from "antd";
import { DeleteOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";
import GlobalNotification from '../../../utils/GlobalNotification'

const ListDefinedProcedure = () => {
  const auth = useContext(AuthContext)
  const dispatch = useDispatch()

  const [data, setData] = useState([])
  const [loading, setloading] = useState(false)

  const [masterId, setMasterId] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [testModal, setTestModal] = useState(false)

  const fetchDefinedProcedures = async () => {
    try {
      setloading(true)
      const data = await fetch(
        config.Calibmaster.URL + '/api/design-procedures/findAllList',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + auth.token
          },
          body: JSON.stringify({ lab_id: auth.labId })
        }
      )

      let response = await data.json()
      setData(response)
      setFilteredData(response)
      setloading(false)

      const newNotification = {
        title: 'Defined Procedure List fetched Successfully',
        description: '',
        icon: 'success',
        state: true,
        timeout: 1500
      }

      GlobalNotification.success({
        title: 'Defined Procedure List fetched Successfully',
        description: "",
      });
      //return dispatch(notificationActions.changenotification(newNotification))
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
    }
  }

  useEffect(() => {
    fetchDefinedProcedures()
  }, [])

  const duplicateDefinedProcedure = async masterId => {
    try {
      const data = await fetch(
        config.Calibmaster.URL +
        '/api/design-procedures/duplicate-defined-procedure',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + auth.token
          },
          body: JSON.stringify({
            master_design_procedure_id: masterId,
            lab_id: auth.labId
          })
        }
      )

      let { procedureName } = await data.json()

      await fetchDefinedProcedures()

      const newNotification = {
        title: `Copy of ${procedureName} added Successfully`,
        description: '',
        icon: 'success',
        state: true,
        timeout: 1500
      }
      dispatch(notificationActions.changenotification(newNotification))
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
    }
  }

  const openModalHandler = id => {
    setMasterId(id)
    setOpenModal(true)
  }

  const closeModalHandler = () => {
    setOpenModal(false)
    fetchDefinedProcedures()
  }

  const closeReviewModalHandler = () => setReviewModal(false)

  const closeTestModalHandler = () => setTestModal(false)

  const EditBtn = data => {
    let id = data.row.master_design_procedure_id

    return (
      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          margin: '10px 0px'
        }}>


        <Button
          label='Edit Procedure'
          size='small'
          onClick={() => {
            openModalHandler(id)
          }}
          variant='success'
          className='rainbow-m-around_medium'
        />
      </div>
    )
  }

  const Deletebtn = data => {
    let id = data.row.master_design_procedure_id

    return (

      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          margin: '10px 0px'
        }}>

        <Button
          label='Delete Procedure'
          size='small'
          onClick={() => {
            handleDelete(id)
          }}
          variant='destructive'
          className='rainbow-m-around_medium'
        />
      </div>
    )
  }

  const handleDelete = async id => {
    try {

      const confirmDelete = await showConfirmationDialog("Are You Sure Want to Delete?");

      if (!confirmDelete) {
        console.log("Cancel Delete!");
        return;
      }
      setloading(true);


      if (confirmDelete) {
        const response = await fetch(
          `${config.Calibmaster.URL}/api/design-procedures/delete`,
          {
            method: 'Delete',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + auth.token
            },
            body: JSON.stringify({
              master_design_procedure_id: id
            })
          }
        )
        const result = await response.json()

        if (response.ok) {
          fetchDefinedProcedures()
          // dispatch(
          //   notificationActions.changenotification({
          //     title: `${result.response}`,
          //     icon: 'success',
          //     state: true,
          //     timeout: 1500
          //   })
          // )
          GlobalNotification.success({
            title: `${result.response}`,
            description: "",
          });

        }
      }
    } catch (error) {
      console.log(error)
    } finally {
      setloading(false);
    }
  }

  const reviewBtn = data => {
    let id = data.row.master_design_procedure_id
    return (
      <Button
        label='Review'
        variant='outline-brand'
        className='rainbow-m-around_medium'
        onClick={() => {
          setMasterId(id)
          setReviewModal(true)
        }}
      />
    )
  }

  const testBtn = data => {
    let id = data.row.master_design_procedure_id
    return (
      <Button
        label='Test'
        variant='border'
        className='rainbow-m-around_medium'
        onClick={() => {
          setMasterId(id)
          setTestModal(true)
        }}
      />
    )
  }
  const DuplicateBtn = data => {
    let id = data.row.master_design_procedure_id
    return (
      <Button
        variant='success'
        className='rainbow-m-around_medium'
        onClick={() => {
          let userConfirmed = confirm(
            `Are you sure you want to add another copy of ${data.row.calibration_procedure}`
          )
          if (userConfirmed) duplicateDefinedProcedure(id)
        }}
      >
        {'Duplicate'}
        <FontAwesomeIcon icon={faClone} style={{ paddingLeft: '10px' }} />
      </Button>
    )
  }


  const [filteredData, setFilteredData] = useState(data);



  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            onClick={() => confirm()}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters();
              confirm();
            }}
            size="small"
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      if (dataIndex === "instrument_full_name") {
        return record.instrument_type?.instrument_full_name
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase());
      }
      return record[dataIndex]
        ?.toString()
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  });



  const columns = [
    {
      title: "Sr No",
      render: (_, __, index) => index + 1,
      width: 80,
      align: "center",
    },
    {
      title: "Calibration Procedure",
      dataIndex: "calibration_procedure",
      key: "calibration_procedure",
      align: "center",
      ...getColumnSearchProps("calibration_procedure"),
    },
    {
      title: "Instrument Name",
      dataIndex: "instrument_name",
      key: "instrument_name",
      align: "center",
      render: (_, record) => record.instrument_type?.instrument_full_name || "-",
      ...getColumnSearchProps("instrument_full_name"),
    },
    {
      title: "REF.STD",
      dataIndex: "ref_std",
      key: "ref_std",
      align: "center",
    },
    {
      title: "Traceability",
      dataIndex: "traceability",
      key: "traceability",
      align: "center",
    },
    {
      title: "Validity",
      dataIndex: "validity",
      key: "validity",
      align: "center",
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => openModalHandler(record.master_design_procedure_id)}
        >
          Edit
        </Button>
      ),
      align: "center",
    },
    {
      title: "Delete",
      key: "delete",
      render: (record) => (
        <Popconfirm
          title="Are you sure you want to delete this record?"
          onConfirm={() => handleDelete(record.master_design_procedure_id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      ),
      align: "center",
    },
  ];



  return (



    <div className="p-4 bg-white shadow-md rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Defined Procedures List</h3>
      <ReusableTable
        data={data}  
        loading={loading}
        columns={columns}
        pageSize={15}
      />

      {openModal && (
        <EditDefinedProdedureModal
          isOpen={openModal}
          onRequestClose={closeModalHandler}
          masterId={masterId}
        />
      )}
    </div>

  )
}

export default ListDefinedProcedure
