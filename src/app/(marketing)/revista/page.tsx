"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import HTMLFlipBook from "react-pageflip"
import { fetchActiveMagazineEntrepreneurs } from "@/services/magazine.service"
import type { MagazineEntrepreneur } from "@/types"
import MagazineCover from "@/components/magazine/MagazineCover"
import { MagazinePhotoPage, MagazineTextPage } from "@/components/magazine/MagazineEntrepreneurPage"
import MagazineBackCover from "@/components/magazine/MagazineBackCover"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RevistaPage() {
  const [entrepreneurs, setEntrepreneurs] = useState<MagazineEntrepreneur[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const flipBookRef = useRef<ReturnType<typeof HTMLFlipBook> | null>(null)

  const totalPages = (entrepreneurs.length * 2) + 2 // cover + (photo + text per entrepreneur) + back cover

  useEffect(() => {
    fetchActiveMagazineEntrepreneurs()
      .then(setEntrepreneurs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const onFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data)
  }, [])

  const goNext = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(flipBookRef.current as any)?.pageFlip()?.flipNext()
  }

  const goPrev = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(flipBookRef.current as any)?.pageFlip()?.flipPrev()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  // Page dimensions (A4-ish proportions)
  const pageWidth = isMobile ? Math.min(window.innerWidth - 32, 360) : 400
  const pageHeight = Math.round(pageWidth * 1.414) // A4 ratio

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-8 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Revista Digital</h1>
        <p className="text-sm text-slate-400 mt-1">Conexao Play</p>
      </div>

      {/* FlipBook */}
      <div
        className="relative transition-transform duration-500 ease-in-out"
        style={{
          transform: !isMobile
            ? currentPage === 0
              ? `translateX(-${pageWidth / 2}px)`
              : currentPage >= totalPages - 1
                ? `translateX(${pageWidth / 2}px)`
                : 'translateX(0)'
            : 'translateX(0)',
        }}
      >
        {/* @ts-ignore react-pageflip type mismatch with ref */}
        <HTMLFlipBook
          ref={flipBookRef}
          width={pageWidth}
          height={pageHeight}
          size="fixed"
          minWidth={300}
          maxWidth={500}
          minHeight={424}
          maxHeight={707}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={onFlip}
          className="magazine-flipbook"
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          maxShadowOpacity={0.5}
          drawShadow={true}
          flippingTime={600}
          usePortrait={isMobile}
          startPage={0}
          autoSize={false}
          clickEventForward={true}
          startZIndex={0}
          style={{}}
          disableFlipByClick={false}
        >
          {/* Cover */}
          <MagazineCover />

          {/* Entrepreneur pages — foto + texto */}
          {entrepreneurs.flatMap((entrepreneur, index) => [
            <MagazinePhotoPage
              key={`photo-${entrepreneur.id}`}
              entrepreneur={entrepreneur}
              pageNumber={index * 2 + 1}
            />,
            <MagazineTextPage
              key={`text-${entrepreneur.id}`}
              entrepreneur={entrepreneur}
              pageNumber={index * 2 + 2}
            />,
          ])}

          {/* Back cover */}
          <MagazineBackCover />
        </HTMLFlipBook>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={currentPage === 0}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <span className="text-sm text-slate-400 min-w-[80px] text-center">
          {currentPage + 1} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={currentPage >= totalPages - 1}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
