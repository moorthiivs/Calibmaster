import { useState, useEffect, useContext } from "react";
import { Card } from "react-rainbow-components";
import SRFsList from "./SRFsList";
import "./SRFs.css";

import { useDispatch } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.js";
import { notificationActions } from "../../../store/nofitication";
import { masterlistActions } from "../../../store/masterlist";
import ItemsFilter from "./ItemsFilter";

const SRFs = (props) => {

  const [isLoaded, setisLoaded] = useState();
  const auth = useContext(AuthContext);
  const dispatch = useDispatch();
  const [error, setError] = useState("");

  useEffect(() => {
    // const requestOptions = {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: "Bearer " + auth.token,
    //   },
    //   body: JSON.stringify({ labId: auth.labId }),
    // };

    // fetch(config.Calibmaster.URL + "/api/masterlist/getall", requestOptions)
    //   .then(async (response) => {
    //     const data = await response.json();
    //     setisLoaded(true);

    //     let oldmasterlist = data.data;
    //     const modified = oldmasterlist.map((v, i) => {
    //       return { id: v.id, sno: i + 1, name: v.name };
    //     });
    //     dispatch(masterlistActions.changeitems(modified));
    //   })
    //   .catch((err) => {
    //     setisLoaded(true);
    //     setError("Error While Getting Masterlist!!");
    //   });
  }, []);

  return (
    // <div className="srfs__container">
    //   <Card className="srfs__card">
    //     <div className="srfs__label">
    //       <h3>SRFs Listing</h3>
    //     </div>
    //     <SRFsList />
    //   </Card>
    //   <ItemsFilter />
    // </div>


    <div style={{ backgroundColor: '#f0f2f5' }}>
      <Card>
        <SRFsList />
        <ItemsFilter />
      </Card>
    </div>

  );
};

export default SRFs;
