import React from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useVirtual } from '@tanstack/react-virtual'
import clsx from 'clsx'

const fetchSize = 200

function PacketVirtualTable({
  columns,
  fileName,
  filter,
  fetchPackets,
  total,
  selectedFrame,
  setSelectedFrame
}) {
  const tableContainerRef = useRef(null)
  const preparedColumns = useMemo(
    () =>
      columns.map((c, i) => {
        return {
          header: c,
          accessorFn: (row) => row.columns[i]
        }
      }),
    [columns]
  )

  const { data, fetchNextPage, isFetching } = useInfiniteQuery(
    ['packet-data', fileName, filter],
    async ({ pageParam = 0 }) => {
      const start = pageParam * fetchSize
      // console.log("fetchPackets", filter, start, fetchSize);
      const fetchedData = await fetchPackets(filter, start, fetchSize)
      return fetchedData
    },
    {
      getNextPageParam: (_lastGroup, groups) => groups.length,
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )

  const flatData = useMemo(() => data?.pages?.flatMap((i) => i) ?? [], [data])

  // console.log(flatData)
  const totalDBRowCount = total ?? 0
  const totalFetched = flatData.length

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement
        //once the user has scrolled within 300px of the bottom of the table, fetch more data if there is any
        if (
          scrollHeight - scrollTop - clientHeight < 300 &&
          !isFetching &&
          totalFetched < totalDBRowCount
        ) {
          fetchNextPage()
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount]
  )

  //a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current)
  }, [fetchMoreOnBottomReached])

  const table = useReactTable({
    data: flatData,
    columns: preparedColumns,
    getCoreRowModel: getCoreRowModel()
  })

  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 10
  })

  const { virtualItems: virtualRows, totalSize } = rowVirtualizer

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0

  return (
    <div className="flex flex-col font-mono h-full">
      <div
        ref={tableContainerRef}
        onScroll={(e) => fetchMoreOnBottomReached(e.target)}
        className="overflow-x-hidden"
      >
        <div className="inline-block min-w-full align-middle">
          <div className="dark:bg-zinc-800 shadow dark:shadow-zinc-900 ring-1 ring-black dark:ring-zinc-900 ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-zinc-700">
              <thead className="bg-zinc-800 text-zinc-400 sticky top-0">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          className="px-2 py-1 text-left text-sm font-semibold whitespace-nowrap"
                        >
                          {header.isPlaceholder ? null : (
                            <div>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-800 dark:divide-gray-600 whitespace-nowrap">
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  const p = flatData[virtualRow.index]
                  const selected = p.number === selectedFrame
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedFrame(p.number)}
                      className="cursor-pointer leading-0"
                      style={{
                        backgroundColor: selected
                          ? `#4c1d95`
                          : p.bg
                          ? `#${p.bg.toString(16).padStart(6, '0')}`
                          : '',
                        color: selected
                          ? `white`
                          : p.fg
                          ? `#${p.fg.toString(16).padStart(6, '0')}`
                          : '#666'
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <td key={cell.id} className="px-2 text-sm">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
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

export default PacketVirtualTable
