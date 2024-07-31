import React, { useRef, useEffect, useState } from 'react'
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectInput,
  Icon,
  SelectIcon,
  ChevronDownIcon,
  SelectDragIndicator,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  View } from '@gluestack-ui/themed'
import { Button } from './components/PacketDissector/Button.js'

import PacketDissector from './components/PacketDissector.js'
import { api } from './API'

const downloadFile = async (url) => {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error, status = ${response.status}`)
    }

    return response.arrayBuffer()
  })
}

const SPRWireshark = () => {
  const refPacketDissector = useRef()
  const [filename, setFilename] = useState('dot11-sample.pcap')
  const [labels, setLabels] = useState({})
  const [ifaces, setIfaces] = useState([])
  const [selectedIface, setSelectedIface] = useState('eth0');

  const getLabel = (iface) => {
    if (labels[iface]) return labels[iface]
    return iface
  }

  useEffect(() =>  {
    api.get('/ip/addr').then((result) => {
      let new_ifaces = result.map(x => x.ifname).filter(x => !['lo', 'sprloop'].includes(x))

      //we have an opportunity here to also populate device names. lets try
      for (let iface of new_ifaces) {
        if (iface.startsWith("wlan")) {
          api.get(`/hostapd/${iface}/all_stations`).then((result) => {

            setLabels((prevLabels) => {
              let newLabels = prevLabels
              for (let entry in result) {
                if (result[entry].vlan_id) {
                  //set the MAC address of the client for now
                  newLabels[iface + "." + result[entry].vlan_id] = entry
                }
              }
              return newLabels
            })
          }).catch((e) => {
          })
        }
      }

      setIfaces(new_ifaces)
    });
  }, [])

  //read file, currently fetch from /public/ in dev mode
  //TODO have api code (either this plugin or for spr) that index dir of .pcap's, fetch this as .json
  const loadFile = async () => {
    let data = await downloadFile(filename)
    refPacketDissector.current.ingest(filename, data)
  }

  let currentReader = null

  //start with 1M
  let bigbuffer_end = 0
  let bigbuffer_cap = 1024*1024
  let maxcap = 10 * 1024 * 1024 //cap at 10MB for now
  let bigbuffer

  const array_concat = (views) => {
      let length = 0
      for (const v of views) {
          if (!v.byteLength) continue
          length += v.byteLength
      }
      let buf = new Uint8Array(length)
      let offset = 0
      for (const v of views) {
          if (!v.byteLength) continue
          const uint8view = new Uint8Array(v.buffer, v.byteOffset, v.byteLength)
          buf.set(uint8view, offset)
          offset += uint8view.byteLength
      }
      return buf
  }

  const makeroom = (length) => {
    let realloc = false
    let old = bigbuffer
    while (bigbuffer_end + length > bigbuffer_cap) {
      realloc = true
      bigbuffer_cap *= 2
      if (bigbuffer_cap > maxcap) {
        return -1
      }
    }

    //copy over the old buffer
    if (realloc) {
      bigbuffer = new Uint8Array(bigbuffer_cap)
      bigbuffer.set(old.subarray(0, bigbuffer_end), 0)
    }
    return 0
  }

  const updateBuffer = (views) => {
      let length = 0
      for (const v of views)
          length += v.byteLength

      if (makeroom(length) != 0) {
        return -1
      }

      for (const v of views) {
          const uint8view = new Uint8Array(v.buffer, v.byteOffset, v.byteLength)
          bigbuffer.set(uint8view, bigbuffer_end)
          bigbuffer_end += uint8view.byteLength
      }
      return 0
  }

  const loadStream = async () => {
    if (currentReader) {
      //alert("call cancel?")
      await currentReader.cancel();
    }

    if (!refPacketDissector.current.isReady()) {
      return
    }

    //reset big buffer
    bigbuffer = new Uint8Array(bigbuffer_cap);
    bigbuffer_end = 0
    refPacketDissector.current.init()

    let me = selectedIface

    const response = await api.fetch(`/plugins/spr-wireshark/stream/${selectedIface}`);
    const reader = response.body.getReader();
    currentReader = reader;

    let buffer = new Uint8Array();
    let chunk;

    refPacketDissector.current.ingest("stream.pcap", new Uint8Array(0))

    //TBD bigbuffer needs a size limit

    console.log("stream " + me)

    let totalPackets = 0
    while (!(chunk = await reader.read()).done) {

      buffer = new Uint8Array([...buffer, ...chunk.value]);

      let offset = 0;

      let newPackets = []
      while (true) {
        const newlineIndex = buffer.indexOf(13, offset);

        if (newlineIndex === -1) {
          break;
        }

        const lengthStr = String.fromCharCode.apply(null, buffer.subarray(offset, newlineIndex));
        const length = parseInt(lengthStr, 16);

        const dataStartIndex = newlineIndex + 2;
        const dataEndIndex = dataStartIndex + length;


        if (buffer.length < dataEndIndex + 2) {
          break;
        }

        const data = buffer.subarray(dataStartIndex, dataEndIndex);
        newPackets.push(data)
        totalPackets++
        offset = dataEndIndex + 2;
      }
      buffer = buffer.slice(offset)

      let ret = updateBuffer(newPackets)
      if (ret < 0) {
        //too much data
        break
      }

    refPacketDissector.current.ingest("stream.pcap", bigbuffer.subarray(0, bigbuffer_end));

    //if (totalPackets > 1500) break


    }
    console.log("over")
  }

  const logMessage = (msg) => {
    console.log('LOG:', msg)
  }

  return (
    <View h="$full" bg="white" sx={{ _dark: { bg: '$backgroundContentDark' } }}>
      <div className="bg-slate-800 p-4 text-slate-50 font-mono">
        SPR+Wireshark
      </div>
      <div className="p-2 flex gap-4 items-center">

      <Select selectedValue={selectedIface} onValueChange={(v) => {setSelectedIface(v)}} >
        <SelectTrigger variant="outline" size="md">
          <SelectInput placeholder="Select option" value={selectedIface}/>
          <SelectIcon mr="$3">
            <Icon as={ChevronDownIcon} />
          </SelectIcon>
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent>
            <SelectDragIndicatorWrapper>
              <SelectDragIndicator />
            </SelectDragIndicatorWrapper>
            {ifaces.map((iface) => (
              <SelectItem key={iface} label={getLabel(iface)} value={iface}>
                {iface}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectPortal>
      </Select>

      <Button variant="outline" onClick={loadStream}>
        Stream {selectedIface}
      </Button>
      </div>
      <div className="p-2">
        <PacketDissector ref={refPacketDissector} logMessage={logMessage} />
      </div>
    </View>
  )
}

export default SPRWireshark
