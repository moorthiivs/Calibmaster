import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

const YearDropdown = ({ startYear, endYear, onChange, value }) => {
  const years = React.useMemo(() => {
    const yearArray = [];
    for (let i = startYear; i <= endYear; i++) {
      yearArray.push(i);
    }
    return yearArray;
  }, [startYear, endYear]);

  return (
    <Select
      value={value}
      onChange={(val) => onChange({ target: { value: val } })}
      className="w-32"
      dropdownClassName="rounded-lg shadow-lg"
    >
      {years.map(year => (
        <Option key={year} value={year}>
          {year}
        </Option>
      ))}
    </Select>
  );
};

export default YearDropdown;
