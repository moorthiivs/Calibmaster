import { Modal, Table, Input, DatePicker, Select, Button, Card, Descriptions, Row, Col, Space, Typography, Divider, Form, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
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
import { getBase64 } from "../../../utils/utilfuns";
import Loader from "../../UI/Loader";
import { usePermissions } from "../../../hooks/usePermissions";
import { convertDateFormat } from "../../../utils/filters";

const { Title, Text } = Typography;
const { Dragger } = Upload;

const UpdateInvoice = (props) => {
  const [isLoaded, setIsLoaded] = useState(true);
  const [srf, setSRF] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [responseFileName, setResponseFileName] = useState("");
  const [files, setFiles] = useState("");
  const [newfilemodal, setNewFileModal] = useState(false);
  const [form] = Form.useForm();

  const dispatch = useDispatch();
  const auth = useContext(AuthContext);
  const { hasPermission } = usePermissions();
  const selecteditems = useSelector((state) => state.selecteditems.list);

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
          GlobalNotification.error({
            title: "Fetch Error",
            description: data.message || "Error while Getting SRF Detail!!"
          });
        }
      } catch (err) {
        GlobalNotification.error({
          title: "Network Error",
          description: "Error while Getting SRF Detail!!"
        });
        setIsLoaded(true);
      }
    }
  };

  useEffect(() => {
    if (props.srfid) {
      getSRFDetail();
    }
  }, [props.srfid]);

  const handleUpdate = async (values) => {
    if (!files) {
      return GlobalNotification.warning({
        title: "Missing File",
        description: "Please upload the invoice file"
      });
    }

    Modal.confirm({
      title: "Confirm Invoice Generation",
      content: "Are you sure you want to generate the invoice for the selected items?",
      okText: "Yes, Generate",
      cancelText: "No",
      centered: true,
      onOk: async () => {
        const { invoiceNo, invoiceDate, invoiceDueDate } = values;
        try {
          setIsLoading(true);
          const bodyData = {
            items: selecteditems,
            invoiceinfo: {
              invoice_no: invoiceNo,
              invoice_date: invoiceDate.toDate(),
              invoice_due_date: invoiceDueDate.toDate(),
              status: "Invoice Generated",
              labId: auth.labId
            },
            srfId: srf.srf_id,
            file: files,
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

          const response = await fetch(config.Calibmaster.URL + "/api/srf/updateinvoice", requestOptions);
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

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.png,.jpg,.jpeg',
    beforeUpload: (file) => {
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        GlobalNotification.error({
            title: "File Too Large",
            description: "File must be smaller than 2MB!"
        });
        return Upload.LIST_IGNORE;
      }
      getBase64(file, (result) => {
        setFiles(result);
        GlobalNotification.success({
            title: "File Prepared",
            description: `${file.name} prepared for upload.`
        });
        setNewFileModal(false);
      });
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFiles("");
    }
  };

  if (!isLoaded || isLoading) return <Loader />;

  return (
    <Modal
      title={<Title level={4} className="m-0">Update Invoice Detail</Title>}
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
            <Descriptions title="SRF Information" bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
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
            <Text strong className="text-lg">Selected Items for Invoice</Text>
            <SRFItemsListView srfItems={selecteditems} />
          </div>

          <Divider className="m-0" />

          {/* Invoice Information Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            initialValues={{
              invoiceDate: dayjs(),
              invoiceDueDate: dayjs().add(30, 'day')
            }}
          >
            <Row gutter={16} align="bottom">
              <Col span={6} xs={24} sm={12} md={6}>
                <Form.Item
                  label="Invoice No."
                  name="invoiceNo"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Enter Invoice No" size="large" />
                </Form.Item>
              </Col>
              <Col span={6} xs={24} sm={12} md={6}>
                <Form.Item
                  label="Invoice Date"
                  name="invoiceDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker className="w-full" format="DD-MM-YYYY" size="large" />
                </Form.Item>
              </Col>
              <Col span={6} xs={24} sm={12} md={6}>
                <Form.Item
                  label="Invoice Due Date"
                  name="invoiceDueDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker className="w-full" format="DD-MM-YYYY" size="large" />
                </Form.Item>
              </Col>
              <Col span={6} xs={24} sm={12} md={6}>
                <div className="mb-6">
                  <Button 
                    size="large" 
                    icon={<InboxOutlined />} 
                    className="w-full"
                    onClick={() => setNewFileModal(true)}
                    type={files ? "primary" : "default"}
                    ghost={!!files}
                  >
                    {files ? "File Selected" : "Upload Invoice PDF"}
                  </Button>
                </div>
              </Col>
            </Row>

            <div className="flex flex-col items-end gap-2 mt-4">
              {responseMsg && <Text type="danger">{responseMsg}</Text>}
              {responseFileName && <Text type="success">Last Uploaded: {responseFileName}</Text>}
              <Space>
                <Button size="large" onClick={props.onclose}>Cancel</Button>
                <Button type="primary" htmlType="submit" size="large">
                  Update Invoice Detail
                </Button>
              </Space>
            </div>
          </Form>
        </div>
      )}

      {/* File Upload Modal */}
      <Modal
        title="Upload Invoice PDF"
        open={newfilemodal}
        onCancel={() => setNewFileModal(false)}
        footer={null}
        centered
      >
        <div className="p-4">
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Support for single upload. Allowed: PDF, PNG, JPG (Max 2MB).
            </p>
          </Dragger>
        </div>
      </Modal>
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

export default UpdateInvoice;