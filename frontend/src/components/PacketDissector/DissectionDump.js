import React from 'react';
import { useEffect, useState } from "react";

function HighlightedText({ text, start, size, onOffsetClicked }) {
  const before = text.substring(0, start);
  const hl = text.substring(start, start + size);
  const end = text.substring(start + size);

  const handleClickWithOffset = (e, offset) => {
    const s = window.getSelection();
    onOffsetClicked(s.anchorOffset + offset);
  }

  return (
    <>
      <span onClick={(e) => handleClickWithOffset(e, 0)}>{before}</span>
      <span onClick={(e) => handleClickWithOffset(e, before.length)} className="bg-gray-600 text-white">{hl}</span>
      <span onClick={(e) => handleClickWithOffset(e, before.length + hl.length)}>{end}</span>
    </>
  )
}

function DissectionDump({ buffer, selected, select }) {
  const [ addrLines, setAddrLines ] = useState([]);
  const [ hexLines, setHexLines ] = useState([]);
  const [ asciiLines, setAsciiLines ] = useState([]);

  const [ asciiHighlight, setAsciiHighlight ] = useState([0, 0]);
  const [ hexHighlight, setHexHighlight ] = useState([0, 0]);

  useEffect(() => {
    const start = selected[0];
    const size = selected[1];

    const hexSize = size * 2 + size - 1;
    const hexPos = start * 2 + start;
    const asciiPos = start + Math.floor(start / 16);
    const asciiSize = (start + size + Math.floor((start + size) / 16)) - asciiPos;

    setAsciiHighlight([ asciiPos, size > 0 ? asciiSize : 0 ])
    setHexHighlight([ hexPos, size > 0 ? hexSize : 0 ])
  }, [ selected ])

  useEffect(() => {
    let addr_lines = [];
    let hex_lines = [];
    let ascii_lines = [];

    for (let i = 0; i < buffer.length; i += 16) {
      let address = i.toString(16).padStart(8, '0') // address
      let block = buffer.slice(i, i + 16) // cut buffer into blocks of 16
      let hexArray = []
      let asciiArray = []

      for (let value of block) {
        hexArray.push(value.toString(16).padStart(2, '0'))
        asciiArray.push(value >= 0x20 && value < 0x7f ? String.fromCharCode(value) : '.')
      }

      let hexString =
        hexArray.length > 8
          ? hexArray.slice(0, 8).join(' ') + '　' + hexArray.slice(8).join(' ')
          : hexArray.join(' ')

      let asciiString = asciiArray.join('')

      addr_lines.push(address);
      hex_lines.push(hexString);

      ascii_lines.push(asciiString);
    }

    setAddrLines(addr_lines);
    setAsciiLines(ascii_lines);
    setHexLines(hex_lines);
  }, [ buffer ])

  const onHexClick = (offset) => {
    select(Math.floor(offset / 3))
  }

  const onAsciiClick = (offset) => {
    select(offset - Math.floor(offset / 17))
  }

  return (
    <div className="flex font-mono text-xs whitespace-pre break-all">
      <div className="tbd-offset select-none text-gray-500">
        {addrLines.join("\n")}
      </div>
      <div className="ml-4 cursor-pointer">
        <HighlightedText onOffsetClicked={onHexClick} text={hexLines.join("\n")} start={hexHighlight[0]} size={hexHighlight[1]} />
      </div>
      <div className="ml-4 cursor-pointer">
        <HighlightedText onOffsetClicked={onAsciiClick} text={asciiLines.join("\n")} start={asciiHighlight[0]} size={asciiHighlight[1]} />
      </div>
    </div>
  )
}

export default DissectionDump;
