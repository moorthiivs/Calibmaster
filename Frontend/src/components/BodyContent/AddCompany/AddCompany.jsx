import "./AddCompany.css";
import { Modal, Button, Spinner } from "react-rainbow-components";
import CustomInput from "../../Inputs/CustomInput";
import CustomTextArea from "../../Inputs/CustomTextArea";
import { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import { companySchema } from "../../../Schemas/company";
import config from "../../../utils/config.json";
import { AuthContext } from "../../../context/auth-context";
import { companiesActions } from "../../../store/companies";
import Loader from "../../UI/Loader";

const AddCompany = (props) => {
  const [companyname, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [error, setError] = useState();
  const [isLoaded, setisLoaded] = useState(true);
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);

  useEffect(() => {
    setError();
  }, [companyname, email, address1, address2, address3]);

  const newcompanyHandler = async () => {
    setisLoaded(false);
    const newcompany = {
      companyname,
      email,
      address1,
      address2,
      address3,
      labId: auth.labId,
    };
    const isValid = await companySchema.isValid(newcompany);
    if (!isValid) {
      setError("Input Validation Failed!! Please Check!!");
      setisLoaded(true);
      return;
    }
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify(newcompany),
    };

    const requestOptions1 = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({ labId: auth.labId }),
    };

    const errornotification = {
      title: "Error while getting Companies!!",
      description: "Getting list of companies from server failed!!",
      icon: "error",
      state: true,
      timeout: 15000,
    };

    fetch(config.Calibmaster.URL + "/api/customers/create", requestOptions)
      .then(async (response) => {
        const data = await response.json();
        setisLoaded(true);

        props.onclose();

        const newNotification = {
          title: "Company Added Successfully",
          description: companyname,
          icon: "success",
          state: true,
          timeout: 15000,
        };
        dispatch(notificationActions.changenotification(newNotification));

        fetch(config.Calibmaster.URL + "/api/customers/list", requestOptions1)
          .then(async (response) => {
            const data = await response.json();

            if (data) {
              if (data.code === 200) {
                dispatch(companiesActions.changecompanies(data.data));
              } else {
                dispatch(
                  notificationActions.changenotification(errornotification)
                );
              }
            } else {
              dispatch(
                notificationActions.changenotification(errornotification)
              );
            }
          })
          .catch((err) => {
            dispatch(
              notificationActions.changenotification(errornotification)
            );
          });
      })
      .catch((err) => {
        setisLoaded(true);
        const newNotification = {
          title: "Adding Company Failed!!",
          description: companyname,
          icon: "error",
          state: true,
        };
        dispatch(notificationActions.changenotification(newNotification));
        setError("Error While Adding Company!!");
      });
  };
  if (!isLoaded)
    return <Loader />;

  return (
    <div className="new__company__modal__container">
      <Modal
        id="modal-2"
        isOpen={props.isopen}
        onRequestClose={props.onclose}
        title="New Company"
        footer={
          <div className="rainbow-flex center">
            <p className="red">{error}</p>
            <Button
              label="Add Company"
              variant="brand"
              onClick={newcompanyHandler}
            />
          </div>
        }
      >
        <div className="new__company__modal__body">
          <div className="new__company__item">
            <CustomInput
              label="Company Name"
              value={companyname}
              type="text"
              required={true}
              onchange={(v) => setCompanyName(v)}
            />
          </div>
          <div className="new__company__item">
            <CustomInput
              label="Email"
              value={email}
              type="text"
              required={true}
              onchange={(v) => setEmail(v)}
            />
          </div>
          <div className="new__company__item">
            <CustomInput
              label="Address 1"
              value={address1}
              type="text"
              required={true}
              onchange={(v) => setAddress1(v)}
            />
          </div>
          <div className="new__company__item">
            <CustomInput
              label="Address 2"
              value={address2}
              type="text"
              required={true}
              onchange={(v) => setAddress2(v)}
            />
          </div>
          <div className="new__company__item">
            <CustomInput
              label="Address 3"
              value={address3}
              type="text"
              required={true}
              onchange={(v) => setAddress3(v)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddCompany;
