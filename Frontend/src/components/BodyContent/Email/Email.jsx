import { useState, useEffect, useContext } from "react";
import { Form, Input, Button, Card, Switch, Spin, Row, Col, Divider } from "antd";
import GlobalNotification from "../../../utils/GlobalNotification";
import { AuthContext } from "../../../context/auth-context";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.json";
import { emailconfigSchema } from "../../../Schemas/emailconfig";

const Email = () => {

  const [form] = Form.useForm();
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [fieldsEnable, setFieldsEnable] = useState(true);
  const [testmailFlag, setTestMailFlag] = useState(false);

  const fetchLabSMTPConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(config.Calibmaster.URL + "/api/lab/fetch-lab-smtp-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId }),
      });

      const data = await res.json();
      const { email_smtp_server_host, email_smtp_server_port, sender_email, sender_password } = data?.data || {};

      form.setFieldsValue({
        email: sender_email,
        password: sender_password,
        host: email_smtp_server_host,
        port: email_smtp_server_port
      });

    } catch (error) {
      GlobalNotification.error({
        title: "Error",
        description: "Email configuration not found"
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLabSMTPConfig();
  }, []);

  const updateEmailHandler = async () => {
    try {
      if (fieldsEnable) return setFieldsEnable(false);

      const values = form.getFieldsValue();
      const { email, password, host, port } = values;

      setLoading(true);

      const body = {
        lab_id: auth.labId,
        email_smtp_server_host: host,
        email_smtp_server_port: parseInt(port),
        sender_email: email,
        sender_password: password,
      };

      const res = await fetch(config.Calibmaster.URL + "/api/lab/update-lab-smtp-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data?.success) {
        GlobalNotification.success({
          title: "Success",
          description: data?.msg || "Updated successfully"
        });
        setFieldsEnable(true);
        fetchLabSMTPConfig();
      } else {
        GlobalNotification.error({
          title: "Error",
          description: "Something went wrong"
        });
      }

    } catch (error) {
      GlobalNotification.error({
        title: "Error",
        description: "Something went wrong"
      });
    }
    finally {
      setLoading(false);
    }
  };

  const testMailHandler = async () => {
    try {
      const values = form.getFieldsValue();
      const { email, password, host, port, remail } = values;

      setLoading(true);

      const emailconfig = {
        email, password, host, port: parseInt(port), remail
      };

      const isValid = await emailconfigSchema.isValid(emailconfig);
      if (!isValid) {
        return GlobalNotification.error({
          title: "Invalid Input",
          description: "Invalid input values"
        });
      }

      const res = await fetch(
        `${config.Calibmaster.URL}/api/lab/testmail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ emailconfig, labId: auth.labId }),
        }
      );

      const data = await res.json();

      if (data?.code === 200) {
        GlobalNotification.success({
          title: "Success",
          description: "Test Email Sent!"
        });
      } else {
        GlobalNotification.error({
          title: "Error",
          description: data?.message || "Error while sending mail"
        });
      }
    } catch {
      GlobalNotification.error({
        title: "Error",
        description: "Error while sending test mail"
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<strong>Email Configuration</strong>}
        style={{ maxWidth: 700, margin: "auto" }}
      >
        <Spin spinning={loading}>
          <Form layout="vertical" form={form}>
            <Row gutter={[16, 16]}>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Sender Email Address"
                  name="email"
                  rules={[{ required: true, message: "Please enter email" }]}
                >
                  <Input placeholder="example@mail.com" disabled={fieldsEnable} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Sender Email Password"
                  name="password"
                  rules={[{ required: true, message: "Please enter password" }]}
                >
                  <Input.Password placeholder="********" disabled={fieldsEnable} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="SMTP Host"
                  name="host"
                  rules={[{ required: true, message: "Please enter SMTP Host" }]}
                >
                  <Input placeholder="smtp.gmail.com" disabled={fieldsEnable} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="SMTP Port"
                  name="port"
                  rules={[{ required: true, message: "Please enter SMTP Port" }]}
                >
                  <Input type="number" placeholder="587" disabled={fieldsEnable} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: 10 }}>
              <Switch checked={testmailFlag} onChange={setTestMailFlag} />{" "}
              <span style={{ marginLeft: 8 }}>Send Test Email</span>
            </div>

            {testmailFlag && (
              <>
                <Form.Item
                  label="Receiver Email"
                  name="remail"
                  rules={[{ required: true, message: "Please enter receiver email" }]}
                >
                  <Input placeholder="receiver@mail.com" />
                </Form.Item>

                <Button
                  type="primary"
                  block
                  onClick={testMailHandler}
                  disabled={loading}
                >
                  Send Test Mail
                </Button>

                <Divider />
              </>
            )}

            <Button
              type={fieldsEnable ? "default" : "primary"}
              block
              onClick={updateEmailHandler}
              size="large"
              disabled={loading}
            >
              {fieldsEnable ? "Edit SMTP Configuration" : "Update SMTP Configuration"}
            </Button>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default Email;
