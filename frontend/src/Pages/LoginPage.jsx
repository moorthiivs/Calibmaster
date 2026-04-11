import React, { useState } from "react";
// import { Redirect } from "react-router-dom";

import "./LoginPage.css";
import background from "../images/calibration.jpg";
import LoginCard from "../components/Login/LoginCard";
import { useNavigate } from "react-router-dom";

const LoginPage = (props) => {

  const [redirect, setRedirect] = useState(false);

  const navigate = useNavigate();

  const redirectHandler = (state) => {
    setRedirect(state);
  };

  if (redirect) {
    return <Navigate to="/dashboard" />;
  } else {
    return (
      <div
        className="background"
        style={{ backgroundImage: `url(${background})` }}
      >
        <LoginCard redirect={redirectHandler} />
      </div>
    );
  }
};

export default LoginPage;
