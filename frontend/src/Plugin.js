import React, { useRef, useState } from 'react'
import { View } from '@gluestack-ui/themed'
import { Button } from './components/PacketDissector/Button.js'

import PacketDissector from './components/PacketDissector.js'

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

  //read file, currently fetch from /public/ in dev mode
  //TODO have api code (either this plugin or for spr) that index dir of .pcap's, fetch this as .json
  const loadFile = async () => {
    let data = await downloadFile(filename)
    refPacketDissector.current.process(filename, data)
  }

  const logMessage = (msg) => {
    console.log('LOG:', msg)
  }

  return (
    <View h="$full" bg="white" sx={{ _dark: { bg: '$backgroundContentDark' } }}>
      <div className="bg-slate-800 p-4 text-slate-50 font-mono">
        SPR+Wireshark
      </div>
      <div className="p-2">
        <Button variant="outline" onClick={loadFile}>
          Load dot11-sample.pcap
        </Button>
      </div>
      <div className="p-2">
        <PacketDissector ref={refPacketDissector} logMessage={logMessage} />
      </div>
    </View>
  )
}

export default SPRWireshark
