import React, { useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useRef } from 'react'
import { RadioGroup } from '@headlessui/react'
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline'

function SelectFile({ files, onChange, emptyMessage, compact }) {
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (onChange && selected) {
      onChange(selected)
    }
  }, [selected])

  return (
    <div className="w-full p-4">
      <div className="mx-auto w-full max-w-md">
        <RadioGroup value={selected} onChange={setSelected}>
          <RadioGroup.Label className="sr-only">Filename</RadioGroup.Label>
          <div className="space-y-2">
            {files.map((filename) => (
              <RadioGroup.Option
                key={filename}
                value={filename}
                className={({ active, checked }) =>
                  `${checked ? 'bg-violet-700 bg-opacity-75' : 'bg-zinc-700'}
                    relative flex cursor-pointer rounded-lg px-5 py-3 shadow-md focus:outline-none`
                }
              >
                {({ active, checked }) => (
                  <>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <RadioGroup.Label
                            as="p"
                            className={`font-medium  ${
                              checked ? 'text-white' : 'text-gray-100'
                            }`}
                          >
                            {filename}
                          </RadioGroup.Label>
                          <RadioGroup.Description
                            as="span"
                            className={`inline ${
                              checked ? 'text-sky-100' : 'text-gray-100'
                            }`}
                          ></RadioGroup.Description>
                        </div>
                      </div>
                      {checked ? (
                        <div className="shrink-0 text-white">
                          <CheckIcon className="h-6 w-6" />
                        </div>
                      ) : (
                        <div
                          __className="shrink-0 text-white p-2 rounded-full bg-zinc-600 hover:bg-zinc-500"
                          onClick={() => onChange(filename, true)}
                        >
                          <ArrowDownOnSquareIcon className="bg-zinc-600 text-white rounded-full p-1 h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            ))}
            {!files.length ? (
              <p className="text-gray-200 text-center text-sm antialiased">
                {emptyMessage || `No files loaded yet`}
              </p>
            ) : null}
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
      <path
        d="M7 13l3 3 7-7"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LoadFileModal({
  files,
  open,
  setOpen,
  onChange,
  emptyMessage,
  compact
}) {
  const cancelButtonRef = useRef(null)

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-zinc-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <SelectFile
                  files={files}
                  onChange={onChange}
                  emptyMessage={emptyMessage}
                  compact={compact}
                />

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-1 sm:gap-3">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-zinc-800 px-4 py-2 text-base font-medium text-gray-200 shadow-sm hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                    onClick={() => setOpen(false)}
                    ref={cancelButtonRef}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default LoadFileModal
