import { useEffect, useState, useMemo, useRef } from "react";
import { AutoComplete } from "antd";

const CompanyLookUp = (props) => {

  const [searchValue, setSearchValue] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    if (props.options) {
      const companieslist = props.options.map((v) => ({
        ...v,
        label: v.customer_name,
        value: v.customer_name,
      }));
      setData(companieslist);
    }
  }, [props.options]);

  const filteredOptions = useMemo(() => {
    if (!searchValue) return [];
    const regex = new RegExp(searchValue, "i");
    return data
      .filter((item) => regex.test(item.label))
      .map((item) => ({
        value: item.customer_name,
        label: item.customer_name,
        rawData: item,
      }));
  }, [searchValue, data]);

  const handleSelect = (value, option) => {
    const selected = option.rawData;
    setSearchValue(value);
    props.onselect(selected);
    props.setContactPerson(selected?.customer_contact?.contact_fullname);
    props.setContactNumber(selected?.customer_contact?.contact_phone_1);
    props.setContactEmail(selected?.customer_contact?.contact_email);
    props.setcustomer_code(selected?.customer_code);
    props.setcontract_days(selected?.contract_days);
    props.setCompanyErr("");
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    props.setCompanyErr("");
  };

  const handleClear = () => {
    setSearchValue("");
    props.onselect("");
    props.setContactPerson("");
    props.setContactNumber("");
    props.setContactEmail("");
    props.setcustomer_code("");
    props.setcontract_days(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {props.label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <AutoComplete
        id={props.label}
        value={searchValue}
        options={filteredOptions}
        onSelect={handleSelect}
        onSearch={handleSearch}
        onClear={handleClear}
        allowClear
        placeholder={props.label}
        style={{ width: "100%" }}
        size="large"
        notFoundContent={searchValue ? "No results found" : null}
      />
    </div>
  );
};

export default CompanyLookUp;
