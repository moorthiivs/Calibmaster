import './CustomFilePicker.css'
import { FileSelector } from 'react-rainbow-components'

const containerStyles = {
  maxWidth: 700
}

const CustomFilePicker = props => {
  return (
    <div className='customfilepicker-conrtainer' style={props.containerStyle}>
      <FileSelector
        key={props.resetKey}
        className='rainbow-m-vertical_x-large rainbow-p-horizontal_medium rainbow-m_auto file-selector'
        style={containerStyles}
        label={props.label}
        placeholder={props.placeholder}
        bottomHelpText={props.helptext}
        variant='multiline'
        required={props.required}
        disabled={props.disabled}
        value={props.value}
        onChange={v => {
          props.onchange(v)
        }}
        multiple={props.multiple}
        accept={props.accept}
      />
    </div>
  )
}

export default CustomFilePicker
