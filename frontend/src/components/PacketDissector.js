import React, { forwardRef } from 'react'
import { useEffect, useImperativeHandle, useMemo, useState } from 'react'
import FileButton from './PacketDissector/FileButton'
import TextInput from './PacketDissector/TextInput'
import { Buffer } from 'buffer'
import DissectionTree from './PacketDissector/DissectionTree'
import DissectionDump from './PacketDissector/DissectionDump'
import { Allotment } from 'allotment'
import 'allotment/dist/style.css'
import PacketVirtualTable from './PacketDissector/PacketVirtualTable'
import { Button } from './PacketDissector/Button'
import PacketSummaryModal from './PacketDissector/PacketSummaryModal'
//import LoadFileModal from './PacketDissector/LoadFileModal'
import { Tab } from '@headlessui/react'
import TabButton from './PacketDissector/TabButton'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import clsx from 'clsx'
import { Tag } from './PacketDissector/Tag'

const NO_SELECTION = { id: '', idx: 0, start: 0, length: 0 }

const EXAMPLE_CAPTURES = [
  //  new URL("../examples/captures/http.cap", import.meta.url),
  //  new URL("../examples/captures/bfd-raw-auth-simple.pcap", import.meta.url),
  //  new URL("../examples/captures/dns.cap", import.meta.url),
]

const checkFilter = (worker, filter) =>
  new Promise((res, rej) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = ({ data }) => {
      channel.port1.close()
      if (data.error) {
        rej(data.error)
      } else {
        res(data.result)
      }
    }

    worker.postMessage({ type: 'check-filter', filter: filter }, [
      channel.port2
    ])
  })

const getFrames = (worker, filter, skip, limit) =>
  new Promise((res, rej) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = ({ data }) => {
      channel.port1.close()
      if (data.error) {
        rej(data.error)
      } else {
        res(data.result)
      }
    }

    worker.postMessage(
      { type: 'select-frames', filter: filter, skip: skip, limit: limit },
      [channel.port2]
    )
  })

const PacketDissector = forwardRef((props, ref) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useImperativeHandle(ref, () => ({
    init() {
      clear()
      setSummary(null)
      setSelectedFrame(1)
      setSelectedPacket(null)
    },
    async ingest(filename, data) {

      if (isProcessing) {
        return;
      }

      //console.log('setFile:', filename, data)
      //setSummary(null)
      //setSelectedFrame(1)
      //setSelectedPacket(null)
      setIsProcessing(true);
      processData(filename, data)
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsProcessing(false);
    }
  }))

  const logMessage = props.logMessage

  const queryClient = new QueryClient()
  const [totalFrames, setTotalFrames] = useState(0)
  const [matchedFrames, setMatchedFrames] = useState(0)
  const [status, setStatus] = useState('LOADING...')
  const [columns, setColumns] = useState([])
  const [filter, setFilter] = useState('')
  const [filterError, setFilterError] = useState(null)
  const [currentFilter, setCurrentFilter] = useState('')
  const [selectedFrame, setSelectedFrame] = useState(1)
  const [selectedPacket, setSelectedPacket] = useState(null)
  const [preparedPositions, setPreparedPositions] = useState(new Map())
  const [selectedTreeEntry, setSelectedTreeEntry] = useState(NO_SELECTION)
  const [finishedProcessing, setFinishedProcessing] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [loadFileOpen, setLoadFileOpen] = useState(false)
  const [selectedDataSourceIndex, setSelectedDataSourceIndex] = useState(0)
  const [fileName, setFileName] = useState('')

  const [message, setMessage] = useState({})
  const [worker, setWorker] = useState(null)

  const clear = useMemo(
    () => () => {
      setSelectedFrame(1)
      setSelectedPacket(null)
      setPreparedPositions({})
      setSelectedTreeEntry(NO_SELECTION)
      setSelectedDataSourceIndex(0)
    },
    []
  )

  useEffect(() => {
    /*console.log(
      'MSG=',
      message?.type,
      message?.type == 'columns' ? message : null
    )*/

    if (message.type === 'init') {
      worker.postMessage({ type: 'columns' })
      setInitialized(true)
      setStatus('Ready')
    } else if (message.type === 'columns') {
      setColumns(message.data)
    } else if (message.type === 'status') {
      setStatus(message.status)
    } else if (message.type === 'error') {
      setStatus(`Error: ${message.error}`)
    } else if (message.type === 'selected') {
      setSelectedPacket(message.data)
      setPreparedPositions(preparePositions('root', message.data))
      setSelectedTreeEntry(NO_SELECTION)
      setSelectedDataSourceIndex(0)
    } else if (message.type === 'processed') {
      // setStatus(`Error: non-zero return code (${message.code})`);
      const response = message.data
      // console.log(response);
      setFinishedProcessing(true)
      setFileName(message.name)

      if (response.code === 0) {
        setTotalFrames(response.summary.packet_count)
        if (summary === null) {
          //setSummary(response.summary)
        }
      }
    }
  }, [message])

  useEffect(() => {
    let _worker = new Worker(
      new URL('../workers/wiregasm.worker.js', import.meta.url)
    )
    setWorker(_worker)
  }, [])

  useEffect(() => {
    if (!worker) {
      return
    }

    worker.onmessage = (e) => {
      setMessage({ ...e.data })
    }
  }, [worker])

  const processData = useMemo(
    () => (name, data) => {
      //clear()
      //setSummary(null)
      setFinishedProcessing(false)
      worker.postMessage({ type: 'process-data', name: name, data: data })
    },
    [clear, worker]
  )

  const preparePositions = useMemo(
    () => (id, node) => {
      let map = new Map()

      if (node.tree && node.tree.length > 0) {
        for (let i = 0; i < node.tree.length; i++) {
          map = new Map([
            ...map,
            ...preparePositions(`${id}-${i}`, node.tree[i])
          ])
        }
      } else if (node.length > 0) {
        map.set(id, {
          id: id,
          idx: node.data_source_idx,
          start: node.start,
          length: node.length
        })
      }

      return map
    },
    []
  )

  const findSelection = useMemo(
    () => (src_idx, pos) => {
      // find the smallest one
      let current = null

      for (let [k, pp] of preparedPositions) {
        if (pp.idx !== src_idx) continue

        if (pos >= pp.start && pos <= pp.start + pp.length) {
          if (
            current != null &&
            preparedPositions.get(current).length > pp.length
          ) {
            current = k
          } else {
            current = k
          }
        }
      }

      if (current != null) {
        setSelectedTreeEntry(preparedPositions.get(current))
      }
    },
    [preparedPositions]
  )

  useEffect(() => {
    setSelectedDataSourceIndex(selectedTreeEntry.idx)
  }, [selectedTreeEntry])

  useEffect(() => {
    if (!initialized) {
      return
    }

    checkFilter(worker, filter)
      .then(() => {
        setFilterError(null)
      })
      .catch((e) => {
        setFilterError(e)
      })
  }, [filter, worker, initialized])

  useEffect(() => {
    if (
      finishedProcessing &&
      selectedFrame >= 1 &&
      selectedFrame <= totalFrames
    ) {
      worker.postMessage({ type: 'select', number: selectedFrame })
    }
  }, [selectedFrame, totalFrames, worker, finishedProcessing])

  const process = useMemo(
    () => (f) => {
      clear()
      setFinishedProcessing(false)
      worker.postMessage({ type: 'process', file: f })
    },
    [worker, clear]
  )

  const fetchPackets = useMemo(
    () => async (filter, skip, limit) => {
      // console.log("fetchPackets", filter, skip, limit);
      if (initialized && finishedProcessing) {
        const res = await getFrames(worker, filter, skip, limit)
        setMatchedFrames(res.matched)
        return res.frames
      }

      return []
    },
    [worker, initialized, finishedProcessing]
  )

  const loadFile = useMemo(
    () => (e) => {
      const f = e.target.files[0]
      //console.log('file:', f)
      setSummary(null)
      setSelectedFrame(1)
      setSelectedPacket(null)
      process(f)
    },
    [process]
  )

  useEffect(() => {
    clear()

    return () => {
      if (worker) {
        worker.terminate()
      }
    }
  }, [worker, clear])

  const emuLoadFile = async (filename) => {
    //let result = await emulator.read_file(filename)
    //processData(filename, result)
    //setLoadFileOpen(!loadFileOpen)
  }

  const [files, setFiles] = useState([])

  const getFiles = async () => {
    /*
    let files = await window.emulator.fs9p.read_dir('/')
    files = files.filter((filename) => filename.endsWith('.pcap'))
    setFiles(files)
    */
  }

  useEffect(() => {
    if (window.emulator) {
      getFiles()
    }
  }, [loadFileOpen])

  return (
    <div>
      <PacketSummaryModal
        open={summaryOpen}
        setOpen={setSummaryOpen}
        summary={summary}
      />
      <div className="flex items-center w-full">
        {/*<LoadFileModal
          open={loadFileOpen}
          setOpen={setLoadFileOpen}
          files={files}
          onChange={emuLoadFile}
          emptyMessage={'no pcaps in /mnt'}
        />
        <button
          className="text-zinc-400 hover:text-zinc-600 text-sm font-semibold antialiased"
          variant="text"
          onClick={() => setLoadFileOpen(!loadFileOpen)}
        >
          Load file
        </button>*/}

        <FileButton variant="outline" onFileSelected={loadFile}>
          Upload file
        </FileButton>

        {/* <Button className={"ml-5"} variant="text" onClick={loadExample}>Load Random Example</Button>  */}
        <div className="ml-5 text-sm text-gray-500">
          <strong className="text-gray-500">Status: </strong>
          {status}
        </div>
        {currentFilter.length > 0 && (
          <Tag className={'ml-5'} color="emerald">
            {currentFilter}
          </Tag>
        )}
        {summary != null && (
          <Button
            className="ml-5 text-zinc-400 hover:text-zinc-200"
            variant="text"
            onClick={() => setSummaryOpen(true)}
          >
            Summary
          </Button>
        )}
        <div className="ml-auto text-sm">
          {matchedFrames} / {totalFrames} packets
        </div>
      </div>
      <TextInput
        type="text"
        name="filter"
        id="filter"
        className={clsx(
          'p-1 mt-2 w-full text-black',
          filterError != null
            ? 'border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500'
            : ''
        )}
        placeholder="display filter, example: tcp"
        value={filter}
        onEnter={() => setCurrentFilter(filter)}
        onChange={(e) => setFilter(e.target.value)}
        autoComplete={'off'}
      />

      <div className="text-xs text-red-500 h-3 py-1">{filterError || ''}</div>

      <div className="h-[70vh] mt-3">
        <Allotment vertical>
          <Allotment.Pane minSize={200} preferredSize={200}>
            <QueryClientProvider client={queryClient}>
              <PacketVirtualTable
                columns={columns}
                fileName={fileName}
                filter={currentFilter}
                fetchPackets={fetchPackets}
                total={matchedFrames}
                totalFrames={totalFrames}
                selectedFrame={selectedFrame}
                setSelectedFrame={setSelectedFrame}
              />
            </QueryClientProvider>
          </Allotment.Pane>
          <Allotment.Pane>
            {selectedPacket != null && (
              <div className="h-full">
                <Allotment>
                  <Allotment.Pane>
                    <div className="font-mono text-xs whitespace-nowrap pt-3 pb-3 overflow-y-auto h-full select-none text-gray-500">
                      <DissectionTree
                        id="root"
                        select={(entry) => setSelectedTreeEntry(entry)}
                        selected={selectedTreeEntry.id}
                        setFilter={(f) => {
                          setCurrentFilter(f)
                          setFilter(f)
                        }}
                        tree={selectedPacket.tree}
                        root
                      />
                    </div>
                  </Allotment.Pane>
                  <Allotment.Pane>
                    <div className="ml-5 pt-3 pb-3 overflow-y-auto h-full">
                      <Tab.Group
                        selectedIndex={selectedDataSourceIndex}
                        onChange={setSelectedDataSourceIndex}
                      >
                        <Tab.List className="flex space-x-4">
                          {selectedPacket.data_sources.map((ds, idx) => (
                            <TabButton
                              className="px-1 py-0 text-xs"
                              key={`tb-${idx}`}
                            >
                              {ds.name}
                            </TabButton>
                          ))}
                        </Tab.List>
                        <Tab.Panels className="mt-2">
                          {selectedPacket.data_sources.map((ds, idx) => {
                            const pos =
                              idx === selectedTreeEntry.idx
                                ? [
                                    selectedTreeEntry.start,
                                    selectedTreeEntry.length
                                  ]
                                : [0, 0]
                            return (
                              <Tab.Panel key={`tp-${idx}`}>
                                <DissectionDump
                                  buffer={Buffer.from(ds.data, 'base64')}
                                  select={(pos) => findSelection(idx, pos)}
                                  selected={pos}
                                />
                              </Tab.Panel>
                            )
                          })}
                        </Tab.Panels>
                      </Tab.Group>
                    </div>
                  </Allotment.Pane>
                </Allotment>
              </div>
            )}
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  )
})

export default PacketDissector
PacketDissector.displayName = 'PacketDissector'
export { PacketDissector, NO_SELECTION }
