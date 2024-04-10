import { Wiregasm, vectorToArray } from '@goodtools/wiregasm'
import loadWiregasm from '@goodtools/wiregasm/dist/wiregasm'
//import wasmModuleCompressed from '@goodtools/wiregasm/dist/wiregasm.wasm.gz'
//import wasmDataCompressed from '@goodtools/wiregasm/dist/wiregasm.data.gz'
import { Buffer } from 'buffer'
import pako from 'pako'
let wasmModuleCompressed = '/wiregasm/wiregasm.wasm.gz'
let wasmDataCompressed = '/wiregasm/wiregasm.data.gz'
//let wasmModuleCompressed = '/data/wiregasm.wasm.gz'
//let wasmDataCompressed = '/data/wiregasm.data.gz'

const wg = new Wiregasm()

function replacer(key, value) {
  if (value.constructor.name.startsWith('Vector')) {
    return vectorToArray(value)
  }
  return value
}

const inflateRemoteBuffer = async (url) => {
  const res = await fetch(url)
  const buf = await res.arrayBuffer()
  return pako.inflate(buf)
}

const fetchPackages = async () => {
  let [wasm, data] = await Promise.all([
    await inflateRemoteBuffer(wasmModuleCompressed),
    await inflateRemoteBuffer(wasmDataCompressed)
  ])

  return { wasm, data }
}

/*wg.init(loadWiregasm, {
  locateFile: (path, prefix) => {
    if (path.endsWith('.data')) return '/data/wiregasm.data'
    if (path.endsWith('.wasm')) return '/data/wiregasm.wasm'
    return prefix + path
  },
  handleStatus: (type, status) =>
    postMessage({ type: 'status', code: type, status: status }),
  handleError: (error) => postMessage({ type: 'error', error: error })
})
  .then(() => {
    postMessage({ type: 'init' })
  })
  .catch((e) => {
    postMessage({ type: 'error', error: e })
  })*/

fetchPackages()
  .then(({ wasm, data }) => {
    postMessage({ type: 'status', status: 'fetched...' })

    wg.init(loadWiregasm, {
      wasmBinary: wasm.buffer,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getPreloadedPackage(name, size) {
        return data.buffer
      },
      handleStatus: (type, status) =>
        postMessage({ type: 'status', code: type, status: status }),
      handleError: (error) => postMessage({ type: 'error', error: error })
    })
      .then(() => {
        postMessage({ type: 'init' })
      })
      .catch((e) => {
        postMessage({ type: 'error', error: e })
      })
  })
  .catch((e) => {
    postMessage({ type: 'error', error: e })
  })

onmessage = (event) => {
  if (event.data.type === 'columns') {
    postMessage({ type: 'columns', data: wg.columns() })
  } else if (event.data.type === 'select') {
    const number = event.data.number
    const res = wg.frame(number)
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
    const res = wg.lib?.checkFilter(filter)

    if (res?.ok) {
      event.ports[0].postMessage({ result: true })
    } else {
      event.ports[0].postMessage({ error: res?.error })
    }
  } else if (event.data.type === 'process') {
    const f = event.data.file
    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      // XXX: this blocks the worker thread
      const res = wg.load(f.name, Buffer.from(event.target.result))
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
