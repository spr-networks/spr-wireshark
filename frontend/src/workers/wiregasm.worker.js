import { Buffer } from 'buffer'
import pako from 'pako'


const { Wiregasm, vectorToArray } = require('@goodtools/wiregasm');
const loadWiregasm = require('@goodtools/wiregasm/dist/wiregasm');

const samplePcap = require('../dot11-sample.pcap');

const wg = new Wiregasm()
wg.init(loadWiregasm, {
  locateFile: (path, prefix) => {
    if (path.endsWith(".data")) return "/wiregasm/wiregasm.data";
    if (path.endsWith(".wasm")) return "/wiregasm/wiregasm.wasm";
    return prefix + path;  },
  }
).then(() => {
  postMessage({ type: 'init' })
})
.catch((e) => {
  postMessage({ type: 'error', error: e })
})


function replacer(key, value) {
  if (value.constructor.name.startsWith('Vector')) {
    return vectorToArray(value)
  }
  return value
}

onmessage = (event) => {
  if (event.data.type === 'columns') {
    postMessage({ type: 'columns', data: wg.columns() })
  } else if (event.data.type === 'select') {
    const number = event.data.number
    const res = wg.frame(number)
    console.log("do select", number)
    console.log(res)
    postMessage({
      type: 'selected',
      data: JSON.parse(JSON.stringify(res, replacer))
    })
  } else if (event.data.type === 'select-frames') {
    const skip = event.data.skip
    const limit = event.data.limit
    const filter = event.data.filter
    const res = wg.frames(filter, skip, limit)

    // send it to the correct port
    event.ports[0].postMessage({
      result: JSON.parse(JSON.stringify(res, replacer))
    })
  } else if (event.data.type === 'check-filter') {
    const filter = event.data.filter
    const res = wg.lib.checkFilter(filter)

    if (res.ok) {
      event.ports[0].postMessage({ result: true })
    } else {
      event.ports[0].postMessage({ error: res.error })
    }
  } else if (event.data.type === 'process') {
    const f = event.data.file
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      // XXX: this blocks the worker thread
      const res = wg.load(f.name, Buffer.from(event.target.result))
      console.log("YO")
      console.log(res)
      postMessage({ type: 'processed', name: f.name, data: res })
    })
    reader.readAsArrayBuffer(f)
  } else if (event.data.type === 'process-data') {
    const name = event.data.name
    const data = event.data.data
    const res = wg.load(name, Buffer.from(data))
    console.log("YO2")
    console.log(res)
    postMessage({ type: 'processed', name: name, data: res })
  }
}

export {}
