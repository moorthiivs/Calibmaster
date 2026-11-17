import React, { useState, useEffect, useContext } from "react";
import { Card, Form, Input, Button, Typography, Space, Divider, Row, Col, Tooltip } from "antd";
import { UserOutlined, ShopOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, PlusOutlined, TeamOutlined, EditOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch, useSelector } from "react-redux";
import config from "../../../../utils/config.json";
import GlobalNotification from "../../../../utils/GlobalNotification";
import { companiesActions } from "../../../../store/companies";
import SetQuotationItem from "./SetQuotationItem";
import CompanyLookUpQuotation from "./CompanyLookUpQuotation";

const { Title, Text } = Typography;

const QuotationItem = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [customerDetail, setCustomerDetail] = useState({
    customer_name: "",
    company_name: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "",
    pincode: "",
    contactNumber: "",
    email: ""
  });
  const companies = useSelector((state) => state.companies.list);
  const [toggleCustomerButton, setToggleCustomerButton] = useState(true);
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();

  const fetchCustomers = () => {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ labId: auth.labId }),
    };

    fetch(config.Calibmaster.URL + "/api/customers/list", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        dispatch(companiesActions.changecompanies(data.data));
      })
      .catch((err) => {
        GlobalNotification.error({
          title: "Error while getting Companies!!",
          description: "Getting list of companies from server failed!!",
        });
        setError("Error While Getting Companies");
      });
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Sync form values with customerDetail state
    form.setFieldsValue(customerDetail);
  }, [customerDetail]);

  const onValuesChange = (changedValues, allValues) => {
    setCustomerDetail(allValues);
  };

  const handleSelectCustomer = (e) => {
    if (!e) {
      const reset = {
        customer_name: "",
        company_name: "",
        address1: "",
        address2: "",
        address3: "",
        city: "",
        state: "",
        pincode: "",
        contactNumber: "",
        email: ""
      };
      setCustomerDetail(reset);
      return;
    }
    const selected = {
      company_name: e.customer_name,
      customer_name: e.customer_contact.contact_fullname,
      address1: e.address1,
      address2: e.address2,
      address3: e.address3,
      city: e.city,
      state: e.state,
      pincode: e.pincode,
      contactNumber: e.customer_contact.contact_phone_1,
      email: e.customer_contact.contact_email
    };
    setCustomerDetail(selected);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="space-y-8">
        <Card 
          className="shadow-lg border-none rounded-3xl overflow-hidden"
          title={
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-md shadow-rose-200">
                  <EditOutlined className="text-2xl" />
                </div>
                <div>
                  <Title level={4} className="!m-0 text-slate-800">Create Quotation</Title>
                  <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">Step 1: Customer Information</Text>
                </div>
              </div>
              
              <Button
                type={toggleCustomerButton ? "default" : "primary"}
                icon={toggleCustomerButton ? <PlusOutlined /> : <TeamOutlined />}
                onClick={() => setToggleCustomerButton(!toggleCustomerButton)}
                className={`h-10 rounded-xl px-6 font-bold shadow-md flex items-center gap-2 ${!toggleCustomerButton ? 'bg-rose-500 hover:bg-rose-600 border-none' : ''}`}
              >
                {toggleCustomerButton ? "New Customer" : "Existing Customer"}
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onValuesChange={onValuesChange}
            requiredMark="optional"
            className="mt-2"
          >
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Divider orientation="left" className="!m-0 !mb-6"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest italic text-rose-500">Target Entity</Text></Divider>
              </Col>

              <Col xs={24} md={12}>
                {toggleCustomerButton ? (
                  <Form.Item
                    label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Existing Customer</span>}
                    required
                  >
                    <CompanyLookUpQuotation
                      options={companies}
                      onselect={handleSelectCustomer}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Customer Name (Company)</span>}
                    name="company_name"
                    rules={[{ required: true, message: 'Please enter customer name' }]}
                  >
                    <Input 
                      prefix={<ShopOutlined className="text-rose-500" />} 
                      placeholder="Enter company full name" 
                      className="h-11 rounded-xl text-base"
                      allowClear
                    />
                  </Form.Item>
                )}
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Contact Person Name</span>}
                  name="customer_name"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input 
                    prefix={<UserOutlined className="text-rose-500" />} 
                    placeholder="Enter full name of contact person" 
                    className="h-11 rounded-xl text-base"
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Divider orientation="left" className="!m-0 !my-6"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest italic text-rose-500">Location Details</Text></Divider>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Address Line 1</span>}
                  name="address1"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined className="text-rose-500" />} 
                    placeholder="Street, Building No, Area" 
                    className="h-11 rounded-xl text-base"
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Address Line 2</span>}
                  name="address2"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined className="text-rose-500" />} 
                    placeholder="Landmark, Locality" 
                    className="h-11 rounded-xl text-base"
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">City</span>}
                  name="city"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Enter City" className="h-11 rounded-xl text-base" allowClear />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">State</span>}
                  name="state"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Enter State" className="h-11 rounded-xl text-base" allowClear />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Pincode</span>}
                  name="pincode"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="Enter 6-digit PIN" className="h-11 rounded-xl font-mono text-base" allowClear maxLength={6} />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Divider orientation="left" className="!m-0 !my-6"><Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest italic text-rose-500">Communication</Text></Divider>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Contact Phone</span>}
                  name="contactNumber"
                  rules={[{ required: true, message: 'Required' }, { min: 10, message: 'Min 10 digits' }]}
                >
                  <Input 
                    prefix={<PhoneOutlined className="text-rose-500" />} 
                    placeholder="Enter 10-digit mobile number" 
                    className="h-11 rounded-xl text-base font-mono"
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Contact Email</span>}
                  name="email"
                  rules={[{ required: true, message: 'Required' }, { type: 'email', message: 'Invalid email' }]}
                >
                  <Input 
                    prefix={<MailOutlined className="text-rose-500" />} 
                    placeholder="e.g. contact@company.com" 
                    className="h-11 rounded-xl text-base"
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <SetQuotationItem customerDetail={customerDetail} />
        
        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-500 text-center font-semibold shadow-sm">
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.ant-form-item-label) {
          padding-bottom: 4px !important;
        }
        :global(.ant-divider-horizontal) {
          border-top-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}

export default QuotationItem
