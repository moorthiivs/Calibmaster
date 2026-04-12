// import "./Email.css";
// import { Card, Spinner, CheckboxToggle } from "react-rainbow-components";
// import { useState, useEffect, useContext } from "react";
// import CustomInput from "../../Inputs/CustomInput";
// import CustomButton from "../../Inputs/CustomButton";
// import { AuthContext } from "../../../context/auth-context";
// import { useDispatch } from "react-redux";
// import { notificationActions } from "../../../store/nofitication";
// import config from "../../../utils/config.js";
// import { emailconfigSchema } from "../../../Schemas/emailconfig";
// import Loader from "../../UI/Loader";

// const Email = () => {

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [host, setHost] = useState("");
//   const [port, setPort] = useState(0);
//   const [error, setError] = useState("");
//   const [isLoaded, setIsLoaded] = useState(true);
//   const [testmailFlag, setTestMailFlag] = useState(false);
//   const [remail, setREmail] = useState("");
//   const [fieldsEnable, setFieldsEnable] = useState(true);

//   const auth = useContext(AuthContext);
//   const dispatch = useDispatch();

//   const fetchLabSMTPConfig = async () => {
//     setIsLoaded(false)

//     try {

//       const requestOptions = {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Bearer " + auth.token,
//         },
//         body: JSON.stringify({ labId: auth.labId }),
//       };

//       let response = await fetch(config.Calibmaster.URL + "/api/lab/fetch-lab-smtp-config", requestOptions);
//       response = await response.json();
//       // console.log(response);

//       const { email_smtp_server_host, email_smtp_server_port, sender_email, sender_password } = response?.data;

//       setEmail(sender_email);
//       setPassword(sender_password);
//       setHost(email_smtp_server_host);
//       setPort(email_smtp_server_port);

//     } catch (error) {
//       console.log(error);
//       const errornotification = {
//         title: "Email Configuration not Found",
//         icon: "error",
//         state: true,
//         timeout: 15000,
//       };
//       dispatch(notificationActions.changenotification(errornotification));
//     }
//     setIsLoaded(true)
//   }

//   useEffect(() => {
//     fetchLabSMTPConfig();
//   }, []);

//   useEffect(() => {
//     setError();
//   }, [email, password, host, port]);

//   const testmailFlagHandler = () => {
//     const testmailflag = testmailFlag;
//     setTestMailFlag(!testmailflag);
//   };

//   /** Update SMTP Config */
//   const updateEmailHandler = async () => {
//     try {
//       if (fieldsEnable) {
//         setFieldsEnable(false);
//         return;
//       }
//       if (host == "") {
//         setError("Please Enter SMTP Host"); return;
//       }
//       if (port == "") {
//         setError("Please Enter SMTP Port Number"); return;
//       }
//       if (email == "") {
//         setError("Please Enter SMTP Sender Email Address"); return;
//       }
//       if (password == "") {
//         setError("Please Enter SMTP Sender Email Password"); return;
//       }

//       setIsLoaded(false);

//       const body = {
//         lab_id: auth.labId,
//         email_smtp_server_host: host,
//         email_smtp_server_port: parseInt(port),
//         sender_email: email,
//         sender_password: password,
//       };

//       const requestOptions = {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: "Bearer " + auth.token,
//         },
//         body: JSON.stringify(body),
//       };

//       let response = await fetch(config.Calibmaster.URL + "/api/lab/update-lab-smtp-config", requestOptions);
//       response = await response.json();
//       // console.log(response);
//       setIsLoaded(true);
//       if (response?.success) {
//         const newNotification = {
//           title: response?.msg,
//           description: "",
//           icon: "success",
//           state: true,
//           timeout: 15000,
//         };
//         dispatch(notificationActions.changenotification(newNotification));
//         setFieldsEnable(true);
//         fetchLabSMTPConfig();
//       } else {
//         const errornotification = {
//           title: "Something went wrong !!!",
//           description: "",
//           icon: "error",
//           state: true,
//           timeout: 15000,
//         };
//         dispatch(notificationActions.changenotification(errornotification));
//       }
//     } catch (error) {
//       console.log(error);
//       const errornotification = {
//         title: "Something went wrong !!!",
//         description: "",
//         icon: "error",
//         state: true,
//         timeout: 15000,
//       };
//       dispatch(notificationActions.changenotification(errornotification));
//       setIsLoaded(true);
//     }
//   };

//   const testMailHandler = async () => {
//     setIsLoaded(false);
//     const portn = parseInt(port);
//     const emailconfig = {
//       email,
//       password,
//       host,
//       port: portn,
//       remail,
//     };
//     const isValid = await emailconfigSchema.isValid(emailconfig);
//     if (!isValid) {
//       setError("Input Validation Failed!! Please Check!!");
//       setIsLoaded(true);
//       return;
//     }
//     const requestOptions = {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: "Bearer " + auth.token,
//       },
//       body: JSON.stringify({ emailconfig, labId: auth.labId }),
//     };
//     //console.log(requestOptions);

//     const errornotification = {
//       title: "Error While Sending Test Email!!",
//       description: "Please check the Entered Parameters!!",
//       icon: "error",
//       state: true,
//       timeout: 15000,
//     };

//     fetch(config.Calibmaster.URL + "/api/lab/testmail", requestOptions)
//       .then(async (response) => {
//         const data = await response.json();
//         setIsLoaded(true);
//         //console.log(data);
//         if (data) {
//           if (data.code === 200) {
//             const newNotification = {
//               title: "Test Email Sent Successfully!!",
//               description: "Please check Receiver Inbox!!",
//               icon: "success",
//               state: true,
//               timeout: 15000,
//             };
//             dispatch(notificationActions.changenotification(newNotification));
//           } else {
//             setError(data.message);

//             dispatch(notificationActions.changenotification(errornotification));
//           }
//         } else {
//           setError("Error While Sending Test Email!!");
//           dispatch(notificationActions.changenotification(errornotification));
//         }
//       })
//       .catch((err) => {
//         setIsLoaded(true);
//         setError("Error While Sending Test Email!!");
//         dispatch(notificationActions.changenotification(errornotification));
//       });
//   };

//   return (
//     <div className="email__page">
//       <Card className="email__page__card">
//         <div className="email__page__label">
//           <h3 style={{ textAlign: "center" }}>Email Configuration</h3>
//         </div>
//         <div className="email__page__form">

//           {/* Sender Email Address */}
//           <div className="email__page__item">
//             <CustomInput
//               label="Sender Email Address"
//               type="text"
//               value={email}
//               onchange={(v) => setEmail(v)}
//               disabled={fieldsEnable}
//               required={true}
//             />
//           </div>

//           {/* Sender Email's Password */}
//           <div className="email__page__item">
//             <CustomInput
//               label="Sender Email's Password"
//               type="password"
//               value={password}
//               onchange={(v) => setPassword(v)}
//               disabled={fieldsEnable}
//               required={true}
//             />
//           </div>

//           {/* Email SMTP Server Host */}
//           <div className="email__page__item">
//             <CustomInput
//               label="Email SMTP Server Host"
//               type="text"
//               value={host}
//               onchange={(v) => setHost(v)}
//               disabled={fieldsEnable}
//               required={true}
//             />
//           </div>

//           {/* Email SMTP Server Port */}
//           <div className="email__page__item">
//             <CustomInput
//               label="Email SMTP Server Port"
//               type="number"
//               value={port}
//               min={1}
//               onchange={(v) => setPort(v)}
//               disabled={fieldsEnable}
//               required={true}
//             />
//           </div>

//           {/* Send a Test Mail Toggle */}
//           <div className="email__page__item__special">
//             <CheckboxToggle
//               label="Send a Test Mail"
//               value={testmailFlag}
//               onChange={testmailFlagHandler}
//             />
//           </div>

//           {testmailFlag ? (
//             <div className="email__page__item">
//               <CustomInput
//                 label="Receiver Email Address"
//                 type="text"
//                 value={remail}
//                 onchange={(v) => setREmail(v)}
//                 disabled={false}
//                 required={false}
//               />
//             </div>
//           ) : null}
//           {testmailFlag ? (
//             <div className="email__page__item__special">
//               <CustomButton
//                 label="Send Test Mail"
//                 variant="brand"
//                 onclick={testMailHandler}
//               />
//             </div>
//           ) : null}

//           {error && <p className="red center w100" style={{ margin: 0 }}>{error}</p>}

//           {!isLoaded ? <Loader /> : null}

//           <div className="email__page__btn">
//             <CustomButton
//               label={fieldsEnable ? "Edit SMTP Configuration" : "Update SMTP Configuration"}
//               variant="success"
//               onclick={updateEmailHandler}
//             />
//           </div>

//         </div>
//       </Card>
//     </div>
//   );
// };

// export default Email;



import { useState, useEffect, useContext } from "react";
import { Form, Input, Button, Card, Switch, notification, Spin, Row, Col, Divider } from "antd";
import { AuthContext } from "../../../context/auth-context";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
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
      notification.error({ message: "Email configuration not found" });
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
        notification.success({ message: data?.msg });
        setFieldsEnable(true);
        fetchLabSMTPConfig();
      } else {
        notification.error({ message: "Something went wrong" });
      }

    } catch (error) {
      notification.error({ message: "Something went wrong" });
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
        return notification.error({ message: "Invalid input values" });
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
        notification.success({ message: "Test Email Sent!" });
      } else {
        notification.error({ message: data?.message || "Error while sending mail" });
      }
    } catch {
      notification.error({ message: "Error while sending test mail" });
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
