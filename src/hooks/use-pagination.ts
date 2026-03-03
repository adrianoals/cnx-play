"use client"

import { useState, useEffect, useMemo } from "react"

export function usePagination<T>(items: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)

  // Reset to page 1 when items change (e.g. search/filter)
  useEffect(() => {
    setCurrentPage(1)
  }, [items.length])

  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [items, currentPage, itemsPerPage]
  )

  return { paginatedItems, currentPage, totalPages, setCurrentPage }
}
