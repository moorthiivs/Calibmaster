import "./CustomInput.css";
import { Input } from "react-rainbow-components";

const CustomInput = (props) => {
  const inputHandler = (e) => {
    props.onchange(e.target.value);

  };
  return (
    <Input
      label={props.label}
      placeholder={props.label}
      type={props.type}
      disabled={props.disabled ? true : false}
      value={props.value}
      onChange={inputHandler}
      autoComplete={false}
      min={props.min ? props.min : 1}
      className="rainbow-p-around_medium add__srf__item"
      required={props.required ? true : false}
      icon={props.icon}
      iconPosition={props.iconPosition}
    />
  );
};

export default CustomInput;

// Input

// placeholder