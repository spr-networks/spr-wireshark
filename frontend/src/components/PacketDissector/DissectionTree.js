import React from 'react'
import {
  Bars2Icon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { NO_SELECTION } from '../PacketDissector.js'

function DissectionSubTree({ id, node, select, selected, setFilter }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setOpen(selected.startsWith(id + '-'))
    }
  }, [id, selected, open])

  const toggle = () => {
    if (open && selected.startsWith(id + '-')) {
      select(NO_SELECTION)
    }

    setOpen(!open)
  }

  return (
    <>
      <div
        className={clsx(
          'inline-flex items-center w-full',
          node.length > 0 ? 'cursor-pointer' : '',
          id === selected ? 'bg-gray-600 text-white' : ''
        )}
      >
        {node.tree && node.tree.length > 0 ? (
          <>
            {open ? (
              <ChevronDownIcon
                onClick={toggle}
                className="shrink-0 w-4 h-4 text-gray-200 dark:text-gray-600 fill-gray-500"
              />
            ) : (
              <ChevronRightIcon
                onClick={toggle}
                className="shrink-0 w-4 h-4 text-gray-200 dark:text-gray-600 fill-gray-500"
              />
            )}
          </>
        ) : (
          <Bars2Icon className="shrink-0 w-4 h-4 text-gray-200 dark:text-gray-600 fill-gray-500" />
        )}

        <span
          onClick={(e) => {
            if (e.detail == 2 && setFilter) {
              setFilter(node.filter)
            }

            if (node.length > 0) {
              select({
                id: id,
                idx: node.data_source_idx,
                start: node.start,
                length: node.length
              })
            }
          }}
          onDoubleClick={toggle}
          className="ml-1 w-full"
        >
          {node.label}
        </span>
      </div>
      {node.tree && node.tree.length > 0 && open && (
        <DissectionTree
          id={id}
          tree={node.tree}
          select={select}
          selected={selected}
          setFilter={setFilter}
        />
      )}
    </>
  )
}

function DissectionTree({
  id,
  tree,
  select = () => {},
  root = false,
  selected = '',
  setFilter
}) {
  return (
    <ul className={clsx(root ? '' : 'pl-2 ml-2 border-l')}>
      {tree.map((n, i) => (
        <li className="leading-none" key={`${id}-${i}`}>
          <DissectionSubTree
            id={`${id}-${i}`}
            node={n}
            select={select}
            selected={selected}
            setFilter={setFilter}
          />
        </li>
      ))}
    </ul>
  )
}

export default DissectionTree
