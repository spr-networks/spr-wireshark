import React, { useRef, useState } from 'react'
import { View } from '@gluestack-ui/themed'
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

  //read file, currently fetch from /public/ in dev mode
  //TODO have api code (either this plugin or for spr) that index dir of .pcap's, fetch this as .json
  const loadFile = async () => {
    let data = await downloadFile(filename)
    refPacketDissector.current.process(filename, data)
  }

  const loadStream = async () => {
    const response = await api.fetch('/plugins/spr-wireshark/chunktest/spr-tailscale');
    const reader = response.body.getReader();
    //const decoder = new TextDecoder('utf-8');

    let bigbuffer = new Uint8Array();
    let buffer = new Uint8Array();
    let chunk;

    while (!(chunk = await reader.read()).done) {
      buffer = new Uint8Array([...buffer, ...chunk.value]);
      while (true) {
        const newlineIndex = buffer.indexOf(13);

        if (newlineIndex === -1) {
          break;
        }

        const lengthStr = String.fromCharCode.apply(null, buffer.slice(0, newlineIndex));
        const length = parseInt(lengthStr, 16);

        const dataStartIndex = newlineIndex + 2;
        const dataEndIndex = dataStartIndex + length;

        if (buffer.length < dataEndIndex + 2) {
          break;
        }

        const data = buffer.slice(dataStartIndex, dataEndIndex);
        //console.log(data)
        bigbuffer = new Uint8Array([...bigbuffer, ...data]);
        console.log(bigbuffer.length)
        refPacketDissector.current.process("chunktest.pcap", bigbuffer);
        //return

        buffer = buffer.slice(dataEndIndex + 2);
      }
    }

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
        <Button variant="outline" onClick={loadStream}>
          Stream dot11-sample.pcap
        </Button>
      </div>
      <div className="p-2">
        <PacketDissector ref={refPacketDissector} logMessage={logMessage} />
      </div>
    </View>
  )
}

export default SPRWireshark
