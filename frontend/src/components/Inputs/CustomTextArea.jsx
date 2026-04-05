import "./CustomTextArea.css";
import { Textarea } from "react-rainbow-components";

const CustomTextArea = (props) => {
  return (
    <Textarea
      label={props.label}
      disabled={props.disabled ? props.disabled : false}
      rows={props.rows}
      placeholder={props.label}
      value={props.value}
      onChange={(event) => props.onchange(event.target.value)}
      required={props.required ? true : false}
      className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
    />
  );
};

export default CustomTextArea;
