import { Buffer } from 'buffer'
import pako from 'pako'


const { Wiregasm, vectorToArray } = require('@goodtools/wiregasm');
const loadWiregasm = require('@goodtools/wiregasm/dist/wiregasm');


//let wasmModuleCompressed = '/data/wiregasm.wasm.gz'
//let wasmDataCompressed = '/data/wiregasm.data.gz'

//const wg = new Wiregasm()
const wg = await loadWiregasm({
  locateFile: (path, prefix) => {
    if (path.endsWith(".data")) return "/wiregasm/wiregasm.data";
    if (path.endsWith(".wasm")) return "/wiregasm/wiregasm.wasm";
    return prefix + path;  },
})
let sess

/*wg.lib.FS = {
  writeFile: (path, data, opts) => {
    alert(path)
  }

}
*/
/*
const wg = await loadWiregasm({
  locateFile: (path, prefix) => {
  },
  fs: {}
});
*/

wg.init();

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
    const res = sess.getFrame(number)
    postMessage({
      type: 'selected',
      data: JSON.parse(JSON.stringify(res, replacer))
    })
  } else if (event.data.type === 'select-frames') {
    const skip = event.data.skip
    const limit = event.data.limit
    const filter = event.data.filter
    const res = sess.getFrames(filter, skip, limit)

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
      //const res = wg.load(f.name, Buffer.from(event.target.result))

      wg.FS.writeFile("/uploads/file.pcap", Buffer.from(event.target.result))
      sess = new wg.DissectSession("/uploads/file.pcap");
      const res = sess.load(); // res.code == 0

      postMessage({ type: 'processed', name: f.name, data: res })
    })
    reader.readAsArrayBuffer(f)
  } else if (event.data.type === 'process-data') {
    const name = event.data.name
    const data = event.data.data
    const res = wg.load(name, Buffer.from(data))
    postMessage({ type: 'processed', name: name, data: res })
  }
}

export {}
