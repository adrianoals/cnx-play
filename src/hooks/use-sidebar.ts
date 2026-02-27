"use client"

import { useState, useEffect } from "react"

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsOpen(window.innerWidth >= 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const toggle = () => setIsOpen(prev => !prev)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return { isOpen, toggle, open, close }
}
