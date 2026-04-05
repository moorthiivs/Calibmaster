import "./CustomButton.css";
import { Button } from "react-rainbow-components";

const CustomButton = (props) => {
  return (
    <Button
      label={props.label}
      onClick={() => props.onclick()}
      variant={props.variant}
      className="rainbow-m-around_medium"
    />
  );
};

export default CustomButton;
