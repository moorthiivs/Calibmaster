import React from 'react'
import { MultiSelect, Option } from 'react-rainbow-components'

const containerStyles = {
  maxWidth: 400
}

function MultiSelectComponent (props) {


  return (
    <MultiSelect
      id='multiselect-component-1'
      label={props.label}
      placeholder={props.placeholder}
      style={containerStyles}
      className='rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto'
      value={props.value}
      onChange={props.onChange}
      bottomHelpText='You can select several options.'
      showCheckbox
    
    >
      {props.options.map(option => (
        <Option name={option} label={option} value={option} />
      ))}
    </MultiSelect>
  )
}

export default MultiSelectComponent
