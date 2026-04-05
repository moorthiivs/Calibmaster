import "./CustomSearch.css";
import { useState, useEffect } from "react";
import CustomInput from "./CustomInput";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import {
  filterbyCompanyName,
  filterbycustomerDC,
  filterbyDepartment,
  filterbyEmail,
  filterbyId,
  filterbyName,
  filterbysrfNo,
  filterbyCustomerName,
  filterbyIdNo,
  filterbySerialNo,
  filterbyDispatchDC,
} from "../../utils/filters";

const CustomSearch = (props) => {

  const [state, setState] = useState({ options: null });

  useEffect(() => {
    setState({ options: props.options });
  }, [props.options]);

  useEffect(() => {
    props.onfilter(state.options);
  }, [state]);

  function filter(query, options, filterby) {
    if (query) {
      if (filterby === "id") {
        return filterbyId(query, options);
      } else if (filterby === "name") {
        return filterbyName(query, options);
      } else if (filterby === "email") {
        return filterbyEmail(query, options);
      } else if (filterby === "department") {
        return filterbyDepartment(query, options);
      } else if (filterby === "customer_dc") {
        return filterbycustomerDC(query, options);
      } else if (filterby === "companyname") {
        return filterbyCompanyName(query, options);
      } else if (filterby === "srfno") {
        return filterbysrfNo(query, options);
      } else if (filterby === "customername") {
        return filterbyCustomerName(query, options);
      } else if (filterby === "serialno") {
        return filterbySerialNo(query, options);
      } else if (filterby === "dispatch_dc") {
        return filterbyDispatchDC(query, options);
      } else if (filterby === "idno") {
        return filterbyIdNo(query, options);
      }
    }
  }

  function search(value) {
    if (state.options && state.value && value.length > state.value.length) {
      setState({
        options: filter(value, state.options, props.filterby),
        value,
      });
    } else if (value) {
      setState({
        value,
      });
      setState({
        options: filter(value, props.options, props.filterby),
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
    <div className="custom__search__container">
      <CustomInput
        label={props.label}
        type="text"
        onchange={(v) => search(v)}
        disabled={false}
        icon={
          <FontAwesomeIcon icon={faSearch} className="rainbow-color_gray-3" />
        }
        iconPosition="right"
      />
    </div>
  );
};

export default CustomSearch;
