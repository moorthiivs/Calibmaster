import "./CompanyLogo.css";
import config from "../../utils/config.js";
import packageconfig from "../../../package.json";
import companylogo from "../../images/CalibMaster_Logo2.png";
import { AuthContext } from "../../context/auth-context";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AntDesignOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';

const CompanyLogo = (props) => {
  const auth = useContext(AuthContext);
  const logo = localStorage.getItem("logo");
  const frontEndVersion = packageconfig.version || "0.0.0";
  const navigate = useNavigate();

  return (

    <>
      {logo ? (
        <div className="company__logo__containers" onClick={() => navigate("/dashboard")}>
          <img
            className="company__logos"
            src={`${config.Calibmaster.URL}/images/${logo}`}
            alt="company logo"
            title={`version ${frontEndVersion}/${auth.backEndVersion}`}
          />
        </div>
      ) : (
        <div style={{padding:"10px 10px"}}>
          <Avatar
            size={{ xs: 20, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 }}
            icon={<AntDesignOutlined />}
            src={companylogo}
          />
        </div>

      )}

    </>
  );
};

export default CompanyLogo;



