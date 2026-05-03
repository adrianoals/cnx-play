"use client"

import { useState } from "react"

export function usePagination<T>(items: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  const [prevLength, setPrevLength] = useState(items.length)

  // Reset to page 1 when items change (e.g. search/filter)
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (items.length !== prevLength) {
    setPrevLength(items.length)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return { paginatedItems, currentPage, totalPages, setCurrentPage }
}
