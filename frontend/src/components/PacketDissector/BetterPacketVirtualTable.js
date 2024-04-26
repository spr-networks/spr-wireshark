/*
Goals: reduced memory usage. Do not populate, keep around ALL packets
sinc we might have hunderds of thousands

*/
import React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function BetterPacketVirtualTable({
  columns,
  fileName,
  filter,
  fetchPackets,
  total,
  totalFrames,
  selectedFrame,
  setSelectedFrame
}) {
  const tableContainerRef = useRef(null)

  const doFetchPackets = (pageParam, fetchSize) => {
      const start = pageParam * fetchSize
      //console.log("fetchPackets", filter, start, fetchSize);
      const fetchedData = fetchPackets(filter, start, fetchSize)
      return fetchedData
  }

  const paddingTop = 0
  const paddingBottom = 0

  const [visibleRows, setVisibleRows] = useState([])
  const [queryPage, setQueryPage] = useState(0)
  /*
  const [debugPage, setDebugPage] = useState(0)
  const [prevPage, setPrevPage] = useState(0)
  */
  const fetchSize = 200

  useEffect(() => {
    if (visibleRows.length == 0) {
      doFetchPackets(queryPage, fetchSize).then(result => {
        setVisibleRows(result)
      }).catch((e) => {
        alert("error"  + e)
      })
    }
  }, [fileName, filter, totalFrames])

  useEffect(() => {
    setQueryPage(0)
    setVisibleRows([])
    doFetchPackets(0, fetchSize).then(result => {
      setVisibleRows(result)
    }).catch((e) => {
      alert("error"  + e)
    })
  }, [fileName, filter])

  const [isFetching, setIsFetching] = useState(false);

  const fetchNextPage = () => {
    if (isFetching) {
      return; // If a request is already in progress, return early
    }

    setIsFetching(true); // Set the flag to indicate that a request is in progress

    doFetchPackets(queryPage, fetchSize).then(result => {
      if (result.length > 0) {
        setVisibleRows((prevRows) => {
          //setPrevPage(queryPage)
          const startIndex = queryPage * fetchSize;
          const updatedRows = [
            ...prevRows.slice(0, startIndex),
            ...result,
          ];
          const newPage = Math.ceil(updatedRows.length / fetchSize);
          setQueryPage(newPage < 0 ? 0 : newPage);
          //setDebugPage(updatedRows.length);
          return updatedRows;
        });
        //setQueryPage((prevPage) => prevPage+1)

      }
    }).catch((e) => {
      alert("error fnp "  + e)
    }).finally(() => {
      setIsFetching(false);
    });

  }

  const fetchPrevPage = () => {
    /*
    if (queryPage > 0) {
      console.log("go previous")
      doFetchPackets(queryPage-1, fetchSize).then(result => {
        if (result.length > 0) {
          setVisibleRows((prevRows) =>  [...result, ...prevRows.slice(0, fetchSize)])
          setQueryPage((prevPage) => prevPage-1)
        }
      }).catch((e) => {
        alert("error fpp "  + e)
      })
    }
    */
  }

  const fetchMoreOnScroll =  (containerRefElement) => {
    if (containerRefElement) {
      const { scrollHeight, scrollTop, clientHeight } = containerRefElement
      //once the user has scrolled within 300px of the bottom of the table, fetch more data if there is any
      const scrollThreshold = 300

      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        fetchNextPage()
      } else if (scrollTop < scrollThreshold && queryPage > 0) {
        fetchPrevPage()
      }

    }
  }

  const genRowKey = (row) => {
    return fileName + "-" + filter + ":" + row.number
  }

  return (
    <div className="flex flex-col flex-grow font-mono h-full">
    {/*
      <div>Page: {queryPage}</div>
      <div>debug: {debugPage}</div>
      <div>prevPage: {prevPage}</div>
    */}
      <div
        ref={tableContainerRef}
        onScroll={(e) => {
          fetchMoreOnScroll(e.target)
        }}
        style={{ height: '500px', overflowY: 'auto' }}  // Set a fixed height and enable vertical scrolling
        className="overflow-x-auto relative"
      >
        <div className="inline-block min-w-full align-middle">
          <div
          >
            <table className="min-w-full divide-y divide-zinc-700"
            >
              <thead className="flex bg-zinc-800 text-zinc-400 sticky top-0">
                {columns.map((column, idx) => (
                  <tr key={column}>
                        <th
                          scope="col"
                          className="px-2 py-1 text-center text-sm font-semibold whitespace-nowrap"
                        >
                          <div>
                            {column}
                          </div>
                        </th>
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-800 dark:divide-gray-600 whitespace-nowrap">
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}

                {visibleRows.map((row, ridx) => {
                  const selected = row.number === selectedFrame
                  return (
                    <tr
                      key={genRowKey(row)}
                      onClick={() => setSelectedFrame(row.number)}
                      className="flex cursor-pointer leading-0"
                      style={{
                        backgroundColor: selected
                          ? `#4c1d95`
                          : row.bg
                          ? `#${row.bg.toString(16).padStart(6, '0')}`
                          : '',
                        color: selected
                          ? `white`
                          : row.fg
                          ? `#${row.fg.toString(16).padStart(6, '0')}`
                          : '#666'
                      }}
                    >
                      {row.columns.map((cell, idx) => {
                        return (
                          <td key={genRowKey(row) + ":" + idx} className="px-2 text-sm">
                            { cell }
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}

                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BetterPacketVirtualTable
