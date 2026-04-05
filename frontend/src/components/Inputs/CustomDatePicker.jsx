import "./CustomDatePicker.css";
import { DatePicker } from "react-rainbow-components";
import { formattedDate} from "../helpers/Helper";

const CustomDatePicker = (props) => {
  return (
    <DatePicker
      id={props.label}
      value={props.date}
      onChange={(value) => props.setDate(formattedDate(value))}
      label={props.label}
      formatStyle="medium"
      locale="en-IN"
      required={props.required ? true : false}
      maxDate={props.maxDate}
      minDate={props.minDate}
    />
  );
};

export default CustomDatePicker;
