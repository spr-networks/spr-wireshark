import React from 'react'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'

function TabButton({ children, className }) {
  return (
    <Tab
      className={({ selected }) =>
        clsx(
          selected
            ? 'bg-zinc-800 text-zinc-300 dark:text-violet-100'
            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
          'px-3 py-2 font-medium text-sm rounded-md',
          className
        )
      }
    >
      {children}
    </Tab>
  )
}

export default TabButton
