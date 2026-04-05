import React, { useMemo } from 'react';

const YearDropdown = ({ startYear, endYear, onChange }) => {
  const selectStyle = {
    width: '100px',
    padding: '8px 20px',
    borderRadius: '30px',
    backgroundColor: '#fff',
    fontSize: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'border-color 0.3s ease',
    margin: '0 10px',
  };
  const years = useMemo(() => {
    const yearArray = [];
    for (let i = startYear; i <= endYear; i++) {
      yearArray.push(i);
    }
    return yearArray;
  }, [startYear, endYear]);

  return (
    <select onChange={onChange} defaultValue={new Date().getFullYear()} style={selectStyle}>
      {years.map(year => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
};

export default YearDropdown;
