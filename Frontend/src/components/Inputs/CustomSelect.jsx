import "./CustomSelect.css";
import { Select } from "react-rainbow-components";

const CustomSelect = (props) => {
  return (
    <Select
      label={props.label}
      required={props.required ? true : false}
      options={props.options}
      value={props.value}
      onChange={(value) => props.onselect(value.target.value)}
      autocomplete="off"
      className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
    />
  );
};

export default CustomSelect;
