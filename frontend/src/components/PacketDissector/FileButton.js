import React from 'react'
import { useRef } from 'react'
import { Button } from './Button'

function FileButton({ onFileSelected, children, ...props }) {
  const hiddenFileInput = useRef(null)

  const loadFile = () => {
    hiddenFileInput.current.click()
  }

  return (
    <>
      <input
        ref={hiddenFileInput}
        className="hidden"
        onChange={onFileSelected}
        type="file"
      />
      <Button {...props} onClick={loadFile}>
        {children}
      </Button>
    </>
  )
}

export default FileButton
