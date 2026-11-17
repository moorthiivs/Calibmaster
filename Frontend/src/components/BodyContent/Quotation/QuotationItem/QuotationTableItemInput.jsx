import React, { useContext, useEffect, useState } from 'react';
import { Form, Input, Select, Button, Row, Col, Typography, Divider, Tooltip, InputNumber } from 'antd';
import { PlusOutlined, DatabaseOutlined, EditOutlined, ShoppingCartOutlined, DollarOutlined, InfoCircleOutlined, TagsOutlined } from '@ant-design/icons';
import config from "../../../../utils/config.json";
import QuotationItemList from './QuotationItemList';
import { populateInstrumentData } from '../../InstrumentType/HelperFunction';
import { useDispatch } from 'react-redux';
import GlobalNotification from '../../../../utils/GlobalNotification';
import { AuthContext } from '../../../../context/auth-context';
import Loader from '../../../UI/Loader';

const { Text, Title } = Typography;
const { Option } = Select;

const QuotationTableItemInput = ({ fetchData }) => {
  const [form] = Form.useForm();
  const [items, setitems] = useState([]);
  const [instrument, setInstrument] = useState([]);
  const [handleToggleButton, sethandleToggleButton] = useState(true);
  const [loading, setloading] = useState(false);
  const auth = useContext(AuthContext);

  async function fetchDataFromServer() {
    setloading(true);
    try {
      const instrumentResonse = await fetch(config.Calibmaster.URL + "/api/instrument/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ lab_id: auth.labId })
      }).then((res) => res.json());
      
      // The populateInstrumentData seems to return an array of { label, value }
      let getInstrumentData = await populateInstrumentData(instrumentResonse.data);
      setInstrument(getInstrumentData);
      setloading(false);
    } catch (error) {
      console.error(error);
      GlobalNotification.error({ title: "Something went wrong" });
      setloading(false);
    }
  }

  useEffect(() => {
    fetchDataFromServer();
  }, []);

  const onFinish = (values) => {
    const newRow = { 
      id: items.length + 1, 
      itemDescription: values.itemDescription,
      range_model: values.range_model,
      remarks: values.remarks,
      qty: values.qty,
      unitPrice: values.unitPrice
    };
    const updatedItems = [...items, newRow];
    setitems(updatedItems);
    
    // Only reset fields related to the item, keeping the description if they want to add similar items? 
    // Usually better to reset all for a clean start.
    form.resetFields(['range_model', 'remarks', 'qty', 'unitPrice']);
    if (!handleToggleButton) {
        form.resetFields(['itemDescription']);
    }
  };

  const deleteRow = (id) => {
    const updateditems = items.filter((row) => row.id !== id);
    setitems(updateditems);
  };

  const itemsWithIndex = items.map((item, index) => ({ ...item, index: index + 1 }));

  useEffect(() => {
    fetchData(itemsWithIndex);
  }, [items]);

  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 p-2 rounded-xl text-white shadow-md shadow-rose-100">
              <ShoppingCartOutlined className="text-xl" />
            </div>
            <div>
              <Title level={5} className="!m-0 text-slate-800">Add Items to Quotation</Title>
              <Text type="secondary" className="text-xs">Define the instruments and pricing for this quotation</Text>
            </div>
          </div>
          
          <Button 
            type={handleToggleButton ? "default" : "primary"}
            icon={handleToggleButton ? <EditOutlined /> : <DatabaseOutlined />}
            onClick={() => {
              sethandleToggleButton(!handleToggleButton);
              form.resetFields(['itemDescription']);
            }}
            className={`rounded-lg font-semibold flex items-center gap-2 ${!handleToggleButton ? 'bg-rose-500 hover:bg-rose-600 border-none' : ''}`}
          >
            {handleToggleButton ? "Manual Entry" : "Select from Master"}
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ qty: 1, unitPrice: 0 }}
          requiredMark="optional"
        >
          <Row gutter={[16, 0]} align="bottom">
            <Col xs={24} md={12}>
              {handleToggleButton ? (
                <Form.Item
                  name="itemDescription"
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Item Description</span>}
                  rules={[{ required: true, message: 'Please select an item' }]}
                >
                  <Select
                    placeholder="Search and select instrument from master"
                    showSearch
                    optionFilterProp="children"
                    className="w-full h-11"
                    suffixIcon={<DatabaseOutlined className="text-rose-500" />}
                    allowClear
                  >
                    {instrument.map((inst, idx) => (
                      <Option key={idx} value={inst.label}>{inst.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item
                  name="itemDescription"
                  label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Item Description</span>}
                  rules={[{ required: true, message: 'Please enter description' }]}
                >
                  <Input 
                    placeholder="Enter instrument name (e.g. Pressure Gauge)" 
                    className="h-11 rounded-lg text-base"
                    prefix={<EditOutlined className="text-rose-500" />}
                    allowClear
                  />
                </Form.Item>
              )}
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="range_model"
                label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Range / Model</span>}
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input 
                  placeholder="Enter range (e.g. 0-10 bar)" 
                  className="h-11 rounded-lg text-base"
                  prefix={<TagsOutlined className="text-rose-500" />}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="remarks"
                label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Remarks</span>}
                rules={[{ required: true, message: 'Required' }]}
                className="mb-0 md:mb-6"
              >
                <Input 
                  placeholder="Any special remarks" 
                  className="h-11 rounded-lg text-base"
                  prefix={<InfoCircleOutlined className="text-rose-500" />}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={12} md={4}>
              <Form.Item
                name="qty"
                label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Qty</span>}
                rules={[{ required: true, message: 'Required' }]}
                className="mb-0 md:mb-6"
              >
                <InputNumber 
                  min={1} 
                  className="w-full h-11 rounded-lg flex items-center font-bold text-base" 
                />
              </Form.Item>
            </Col>

            <Col xs={12} md={4}>
              <Form.Item
                name="unitPrice"
                label={<span className="text-slate-700 font-semibold text-sm uppercase tracking-tight">Unit Price</span>}
                rules={[{ required: true, message: 'Required' }]}
                className="mb-0 md:mb-6"
              >
                <InputNumber 
                  min={0} 
                  className="w-full h-11 rounded-lg flex items-center font-bold text-base"
                  prefix={<span className="text-rose-500 font-bold">₹</span>}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8} className="mb-0 md:mb-6">
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                size='large'
                className="w-full h-11 rounded-lg !bg-rose-500 hover:!bg-rose-600 border-none font-bold shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
              >
                Add to List
              </Button>
            </Col>
          </Row>
        </Form>
      </div>

      <QuotationItemList items={itemsWithIndex} deleteItemHandler={deleteRow} />
      
      {loading && <Loader />}
    </div>
  );
};

export default QuotationTableItemInput;
