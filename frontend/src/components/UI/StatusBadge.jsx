import "./StatusBadge.css";
import { Badge } from "react-rainbow-components";
const StatusBadge = ({ value }) => {
  const signalStyles = {
    color: "white",
    backgroundColor: "forestgreen",
    boxShadow: "inset 0 0 0 1px",
  };
  if (value === "Not Calibrated") {
    return (
      <Badge
        className="rainbow-m-around_medium"
        label={value}
        variant="error"
        title={value}
      />
    );
  } else if (value === "Calibrated") {
    return (
      <Badge
        className="rainbow-m-around_medium"
        label={value}
        variant="inverse"
        title={value}
      />
    );
  } else if (value === "Report Generated") {
    return (
      <Badge
        className="rainbow-m-around_medium"
        label={value}
        variant="warning"
        title={value}
      />
    );
  } else if (value === "Dispatched") {
    return (
      <Badge
        className="rainbow-m-around_medium"
        label={value}
        variant="brand"
        title={value}
      />
    );
  } else if (value === "Invoice Generated") {
    return (
      <Badge
        className="rainbow-m-around_medium"
        label={value}
        style={signalStyles}
        title={value}
      />
    );
  } else if (value === "Report Dispatched") {
    return (
      <Badge
        className="rainbow-m-around_medium"
        label={value}
        variant="success"
        title={value}
      />
    );
  } else {
    return (
      <Badge
        className="rainbow-m-around_medium"
        label={value}
        variant="lightest"
        title={value}
      />
    );
  }
};
export default StatusBadge;
