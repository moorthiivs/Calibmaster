import "./CustomLookup.css";
import { Lookup } from "react-rainbow-components";
import { useEffect, useState } from "react";

const containerStyles = {
  maxWidth: 700,
};

const CustomLookup = (props) => {

  const [state, setState] = useState({ options: null });
  const [data, setData] = useState();

  useEffect(() => {
    if (props.options) {
      const companieslist = props.options.map((v, i) => ({
        ...v,
        label: v.customer_name,
      }));
      setData(companieslist);
    }
  }, [props.options]);

  const selectHandler = (option) => {
    setState({ option });
    props.onselect(option);
  };

  function filter(query, options) {
    if (query) {
      return options.filter((item) => {
        const regex = new RegExp(query, "i");
        return regex.test(item.label);
      });
    }
    return [];
  }

  function search(value) {
    if (state.options && state.value && value.length > state.value.length) {
      setState({
        options: filter(value, state.options),
        value,
      });
    } else if (value) {
      setState({
        value,
      });
      setState({
        options: filter(value, data),
        value,
      });
    } else {
      setState({
        value: "",
        options: null,
      });
    }
  }
  return (
    <Lookup
      id={props.label}
      label={props.label}
      placeholder={props.label}
      options={state.options}
      value={state.option}
      onChange={(option) => selectHandler(option)}
      onSearch={search}
      style={containerStyles}
      required={props.required ? true : false}
      className="rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto"
    />
  );
};

export default CustomLookup;
