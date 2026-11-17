import React, { useState, useEffect, useContext } from "react";
import { Card, Form, Input, Button, Typography, Space, Divider, Row, Col, InputNumber, Tooltip, Empty } from "antd";
import { FileTextOutlined, PlusOutlined, DeleteOutlined, SendOutlined, InfoCircleOutlined, DollarOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { AuthContext } from "../../../../context/auth-context";
import { useDispatch } from "react-redux";
import GlobalNotification from "../../../../utils/GlobalNotification";
import config from "../../../../utils/config.json";
import QuotationTableItemInput from "./QuotationTableItemInput";
import Loader from "../../../UI/Loader";

const { Title, Text } = Typography;

const SetQuotationItem = (props) => {
  const [form] = Form.useForm();
  const [isLoaded, setIsLoaded] = useState(true);
  const auth = useContext(AuthContext);
  const [otherCharges, setotherCharges] = useState(0);
  const [notes, setNotes] = useState(["", ""]);
  const [customerDetail, setCustomerDetail] = useState({});
  const [customer_item_description, setcustomer_item_description] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    setCustomerDetail(props);
  }, [props]);

  function fetchData(Data) {
    setcustomer_item_description(Data);
  }

  async function handleSubmit() {
    try {
      const { customerDetail: cd } = customerDetail;
      
      if (!cd || !cd.customer_name) {
        GlobalNotification.error({ title: "Missing Information", description: "Please enter Customer Name" });
        return;
      }
      if (!cd.company_name) {
        GlobalNotification.error({ title: "Missing Information", description: "Please enter Company Name" });
        return;
      }
      if (!cd.address1) {
        GlobalNotification.error({ title: "Missing Information", description: "Please enter Address" });
        return;
      }
      if (!cd.city) {
        GlobalNotification.error({ title: "Missing Information", description: "Please enter City" });
        return;
      }
      if (customer_item_description.length === 0) {
        GlobalNotification.error({ title: "No Items", description: "Please add at least one item to the quotation" });
        return;
      }

      setIsLoaded(false);

      const body = {
        lab_id: auth.labId,
        customer_Detail: cd,
        customer_item_description: customer_item_description,
        otherCharges: otherCharges,
        notes: notes.filter(n => n.trim() !== "")
      }
      
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(body),
      };

      let response = await fetch(config.Calibmaster.URL + "/api/quotation/create-quotation", requestOptions);
      const responseData = await response.json();

      if (response.ok && responseData?.success) {
        GlobalNotification.success({
          title: responseData?.msg || "Quotation generated and mail sent successfully!",
        });
        setIsLoaded(true);
      } else {
        const backendMessage = responseData?.message || responseData?.msg || "Something went wrong while sending the quotation.";
        GlobalNotification.error({
          title: "Quotation Error",
          description: backendMessage,
        });
        setIsLoaded(true);
      }
    } catch (error) {
      console.error(error);
      GlobalNotification.error({
        title: "Something went wrong !!",
        description: "An unexpected error occurred. Please try again.",
      });
      setIsLoaded(true);
    }
  }

  const addNotesHandler = () => {
    setNotes([...notes, ""]);
  }

  const notesChangeHandler = (value, i) => {
    const newNotes = [...notes];
    newNotes[i] = value;
    setNotes(newNotes);
  }

  const deleteNotesHandler = (i) => {
    const newNotes = notes.filter((_, index) => index !== i);
    setNotes(newNotes);
  }

  return (
    <div className="space-y-6">
      <Card 
        className="shadow-lg border-none rounded-3xl overflow-hidden"
        title={
          <div className="flex items-center gap-3 py-4">
            <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-md shadow-emerald-100">
              <FileTextOutlined className="text-2xl" />
            </div>
            <div>
              <Title level={4} className="!m-0 text-slate-800">Step 2: Quotation Items & Charges</Title>
              <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold">Finalize pricing and additional conditions</Text>
            </div>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Items Section */}
          <section>
            <QuotationTableItemInput fetchData={fetchData} />
          </section>

          <Divider className="!m-0" />

          {/* Charges and Notes Section */}
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={8}>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <DollarOutlined className="text-emerald-500 text-lg" />
                  <Title level={5} className="!m-0 text-slate-700 uppercase text-xs tracking-widest font-bold">Additional Charges</Title>
                </div>
                <Text type="secondary" className="text-[11px] mb-4 block font-medium">Enter service or handling fees</Text>
                
                <InputNumber
                  placeholder="0.00"
                  className="w-full h-12 rounded-xl flex items-center font-bold text-lg font-mono shadow-inner bg-white"
                  value={otherCharges}
                  onChange={(val) => setotherCharges(val)}
                  prefix={<span className="text-emerald-500 mr-2 font-bold">₹</span>}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </div>
            </Col>

            <Col xs={24} lg={16}>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm min-h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UnorderedListOutlined className="text-blue-500 text-lg" />
                    <Title level={5} className="!m-0 text-slate-700 uppercase text-xs tracking-widest font-bold">Terms & Conditions / Notes</Title>
                  </div>
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={addNotesHandler}
                    className="rounded-lg font-bold border-blue-400 text-blue-600 hover:bg-blue-50"
                  >
                    Add Row
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" className="text-xs">No notes added. Click 'Add Row' to include special terms.</Text>} className="py-2" />
                  ) : (
                    notes.map((note, i) => (
                      <div key={i} className="flex gap-2 group animate-in fade-in slide-in-from-left-2 duration-300">
                        <Input
                          placeholder={`Enter special note or condition #${i + 1}`}
                          value={note}
                          onChange={(e) => notesChangeHandler(e.target.value, i)}
                          className="h-11 rounded-xl border-slate-200 group-hover:border-blue-400 transition-all text-sm font-medium shadow-sm bg-white"
                          prefix={<InfoCircleOutlined className="text-blue-400" />}
                          allowClear
                        />
                        <Tooltip title="Remove Note">
                          <Button 
                            danger 
                            type="text" 
                            icon={<DeleteOutlined />} 
                            onClick={() => deleteNotesHandler(i)}
                            className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 rounded-lg"
                          />
                        </Tooltip>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <Divider className="!m-0" />

          {/* Action Button */}
          <div className="flex flex-col items-center pt-4">
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={!isLoaded}
              className="h-14 px-12 rounded-2xl bg-rose-600 hover:bg-rose-700 border-none font-bold text-lg shadow-md shadow-rose-200 flex items-center gap-3 transform hover:scale-105 transition-all"
            >
              Generate & Send Quotation
            </Button>
            <Text type="secondary" className="mt-4 text-[10px] uppercase tracking-widest font-bold">
              This will generate a PDF and prepare the email for dispatch
            </Text>
          </div>
        </div>
      </Card>

      {!isLoaded && <Loader />}
      
      <style jsx>{`
        :global(.ant-card-head) {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        :global(.ant-input-number-affix-wrapper) {
          padding-left: 16px !important;
        }
      `}</style>
    </div>
  );
}

export default SetQuotationItem;