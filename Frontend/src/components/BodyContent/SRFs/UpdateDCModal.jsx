import { Modal, Table, Input, DatePicker, Select, Button, Card, Descriptions, Row, Col, Space, Typography, Tag, Divider, Form } from "antd";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { AuthContext } from "../../../context/auth-context";
import { srfitemsActions } from "../../../store/srfitems";
import GlobalNotification from "../../../utils/GlobalNotification";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { selecteditemsActions } from "../../../store/selecteditems";
import StatusBadge from "../../UI/StatusBadge";
import config from "../../../utils/config.json";
import Loader from "../../UI/Loader";
import showErrorDialog from "../../../utils/showErrorToast";
import { usePermissions } from "../../../hooks/usePermissions";
import { convertDateFormat } from "../../../utils/filters";

const { Title, Text } = Typography;

const UpdateDCModal = (props) => {
  const [isLoaded, setIsLoaded] = useState(true);
  const [srf, setSRF] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [form] = Form.useForm();

  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const { hasPermission } = usePermissions();
  const selecteditems = useSelector((state) => state.selecteditems.list);

  useEffect(() => {
    if (Array.isArray(selecteditems) && selecteditems.length === 1) {
      const singleItem = selecteditems[0];
      if (singleItem?.report_done_date) {
        form.setFieldsValue({ reportGenerateDate: dayjs(singleItem.report_done_date) });
        return;
      }
    }
    form.setFieldsValue({ reportGenerateDate: dayjs() });
  }, [selecteditems, form]);

  const getSRFDetail = async () => {
    if (props.srfid) {
      setIsLoaded(false);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ srfId: props.srfid, srfNo: props.srfNo, userId: auth.userId }),
      };

      try {
        const response = await fetch(config.Calibmaster.URL + "/api/srf/getsrfbyid", requestOptions);
        const data = await response.json();
        setIsLoaded(true);

        if (data && data.code === 200) {
          setSRF(data.data.srf);
          dispatch(srfitemsActions.changesrfitems(data.data.items));
        } else {
          notification.error({ message: data.message || "Error while Getting SRF Detail!!" });
        }
      } catch (err) {
        notification.error({ message: "Error while Getting SRF Detail!!" });
        setIsLoaded(true);
      }
    }
  };

  useEffect(() => {
    if (props.srfid) {
      getSRFDetail();
    }
  }, [props.srfid]);

  useEffect(() => {
    if (srf?.customer_dc) {
      form.setFieldsValue({ dispatchDcNo: srf.customer_dc });
    }
  }, [srf, form]);

  const handleUpdate = async (values) => {
    Modal.confirm({
      title: "Confirm Dispatch Update",
      content: "Are you sure you want to update the dispatch details and report date for the selected items?",
      okText: "Yes, Update",
      cancelText: "No",
      centered: true,
      onOk: async () => {
        const { dispatchDcNo, dispatchDcDate, dispatchDcMode, reportGenerateDate } = values;

        try {
          setIsLoading(true);
          const bodyData = {
            items: selecteditems,
            dispatchInfo: {
              dispatch_dc: dispatchDcNo,
              dispatch_date: dispatchDcDate.toDate(),
              dispatch_mode: dispatchDcMode,
              status: "Dispatched",
              labId: auth.labId
            },
            srfId: srf.srf_id,
            report_done_by_empname: auth.name,
            report_done_date: reportGenerateDate ? reportGenerateDate.toDate() : new Date(),
            userId: auth.userId
          };

          const requestOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + auth.token,
            },
            body: JSON.stringify(bodyData)
          };

          const response = await fetch(config.Calibmaster.URL + "/api/srf-status/dispatch", requestOptions);
          const data = await response.json();

          if (data?.code === 201) {
            GlobalNotification.success({
              title: data.message,
            });
            dispatch(selecteditemsActions.changeselecteditems([]));
            await getSRFDetail();
            await fetchSRFItems();
            props.onclose();
          } else {
            setResponseMsg(data?.message);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  async function fetchSRFItems() {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId, userId: auth.userId }),
      };
      const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
      const { data } = await response.json();
      const { items } = data;
      const getSRFList = items.map((item, index) => ({ ...item, slNo: index + 1 }));
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));
    } catch (error) {
      console.error(error);
    }
  }

  if (!isLoaded || isLoading) return <Loader />;

  return (
    <Modal
      title={<Title level={4} className="m-0">Update SRF Items Dispatch Information</Title>}
      open={props.isopen}
      onCancel={props.onclose}
      width={1200}
      footer={null}
      destroyOnClose
      centered
    >
      {srf && (
        <div className="flex flex-col gap-6 p-2 font-sans">
          {/* SRF Header Information */}
          <Card size="small" className="bg-slate-50 border-none shadow-sm">
            <Descriptions 
              title="SRF Information" 
              bordered 
              size="small" 
              column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="SRF Number">{srf?.srf_number}</Descriptions.Item>
              <Descriptions.Item label="SRF Date">{convertDateFormat(srf?.created_timestamp)}</Descriptions.Item>
              <Descriptions.Item label="Customer DC">{srf?.customer_dc}</Descriptions.Item>
              <Descriptions.Item label="Customer DC Date">{convertDateFormat(srf?.customer_dc_date)}</Descriptions.Item>
              <Descriptions.Item label="Company Name" span={2}>{srf?.customer?.customer_name}</Descriptions.Item>
              <Descriptions.Item label="Company Address" span={2}>
                {[srf?.customer?.address1, srf?.customer?.address2, srf?.customer?.address3].filter(Boolean).join(", ")}
              </Descriptions.Item>
              {hasPermission("EDIT_SRF") && (
                <>
                  <Descriptions.Item label="Contact Person">{srf?.contact_name}</Descriptions.Item>
                  <Descriptions.Item label="Contact Number">{srf?.contact_number}</Descriptions.Item>
                  <Descriptions.Item label="Department">{srf?.department}</Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>

          {/* Selected Items Table */}
          <div className="flex flex-col gap-4">
            <Text strong className="text-lg">Selected Items for Dispatch</Text>
            <SRFItemsListView srfItems={selecteditems} />
          </div>

          <Divider className="m-0" />

          {/* Dispatch Information Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            initialValues={{
              dispatchDcMode: 'Post'
            }}
          >
            <Row gutter={16}>
              <Col span={6} xs={24} sm={12} md={6}>
                <Form.Item
                  label="Report Generated Date"
                  name="reportGenerateDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker className="w-full" format="DD-MM-YYYY" size="large" />
                </Form.Item>
              </Col>
              <Col span={6} xs={24} sm={12} md={6}>
                <Form.Item
                  label="Dispatch DC No"
                  name="dispatchDcNo"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Enter DC Number" size="large" />
                </Form.Item>
              </Col>
              <Col span={6} xs={24} sm={12} md={6}>
                <Form.Item
                  label="Dispatch DC Date"
                  name="dispatchDcDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker 
                    showTime={{ format: 'hh:mm A', use12Hours: true }} 
                    className="w-full" 
                    format="DD-MM-YYYY hh:mm A" 
                    size="large" 
                  />
                </Form.Item>
              </Col>
              <Col span={6} xs={24} sm={12} md={6}>
                <Form.Item
                  label="Dispatch Mode"
                  name="dispatchDcMode"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select
                    size="large"
                    options={[
                      { value: 'Post', label: 'Post' },
                      { value: 'Courier', label: 'Courier' },
                      { value: 'By Hand', label: 'By Hand' }
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex flex-col items-end gap-2 mt-4">
              {responseMsg && <Text type="danger">{responseMsg}</Text>}
              <Space>
                <Button size="large" onClick={props.onclose}>Cancel</Button>
                <Button type="primary" htmlType="submit" size="large">
                  Update Dispatch Details
                </Button>
              </Space>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
};

const SRFItemsListView = ({ srfItems }) => {
  const columns = [
    {
      title: "S.No",
      dataIndex: "slNo",
      key: "slNo",
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: "Description of Item",
      dataIndex: "intrument_type",
      key: "intrument_type",
      render: (val) => val?.instrument_full_name
    },
    {
      title: "Make",
      dataIndex: "make",
      key: "make",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "Serial Number",
      dataIndex: "serial_no",
      key: "serial_no",
    },
    {
      title: "Id Number",
      dataIndex: "identification_details",
      key: "identification_details",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: 'center',
      render: (status) => <StatusBadge value={status} />
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
    }
  ];

  if (srfItems.some(item => !!item.report_done_date)) {
    columns.push({
      title: "Report Done Date",
      dataIndex: "report_done_date",
      key: "report_done_date",
      render: (date) => convertDateFormat(date)
    });
  }

  return (
    <Table
      dataSource={srfItems}
      columns={columns}
      pagination={false}
      size="small"
      rowKey="srf_item_id"
      bordered
      className="shadow-sm rounded-lg overflow-hidden"
    />
  );
};

export default UpdateDCModal;
