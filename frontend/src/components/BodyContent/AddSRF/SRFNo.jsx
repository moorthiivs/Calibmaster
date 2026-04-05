import "./SRFNo.css";
import { Input } from "react-rainbow-components";
const SRFNo = (props) => {
  return (
    <div className="add__srf__item__container">
      <Input
        label="SRF Number"
        placeholder="SRF Number"
        type="text"
        disabled
        value={props.srfno}
        className="rainbow-p-around_medium add__srf__item"
      />
    </div>
  );
};

export default SRFNo;
