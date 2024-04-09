import React from 'react';
import clsx from "clsx"

function TextInput({ innerRef, className, onEnter = () => {}, ...props }) {

  className = clsx(
    'bg-white dark:bg-zinc-800 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm',
    className
  )

  return (
    <input
      ref={innerRef}
      className={className}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onEnter()
        }
      }}
      {...props}
    />
  )
}

export default TextInput
