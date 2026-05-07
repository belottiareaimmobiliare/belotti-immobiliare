'use client'

import { useEffect, useMemo, useState } from 'react'

type LightboxImage = {
  src: string
  alt: string
}

type Props = {
  images: LightboxImage[]
  isOpen: boolean
  initialIndex?: number
  onClose: () => void
}

const MIN_ZOOM = 1
const DOUBLE_CLICK_ZOOM = 2
const MAX_ZOOM = 4

export default function PropertyGalleryLightbox({
  images,
  isOpen,
  initialIndex = 0,
  onClose,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!isOpen) return

    setCurrentIndex(initialIndex)
    setZoom(1)
    setTranslate({ x: 0, y: 0 })
    setDragging(false)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('property-gallery-open')

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.classList.remove('property-gallery-open')
    }
  }, [isOpen, initialIndex])

  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    setZoom(1)
    setTranslate({ x: 0, y: 0 })
    setDragging(false)
  }

  const goNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    setZoom(1)
    setTranslate({ x: 0, y: 0 })
    setDragging(false)
  }

  const resetView = () => {
    setZoom(1)
    setTranslate({ x: 0, y: 0 })
    setDragging(false)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'ArrowLeft') {
        goPrev()
        return
      }

      if (event.key === 'ArrowRight') {
        goNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, onClose])

  const currentImage = useMemo(() => images[currentIndex], [images, currentIndex])

  if (!isOpen || !currentImage) return null

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, MAX_ZOOM))
  }

  const zoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.25, MIN_ZOOM)

      if (next === 1) {
        setTranslate({ x: 0, y: 0 })
      }

      return next
    })
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const delta = event.deltaY

    setZoom((prev) => {
      const next =
        delta < 0
          ? Math.min(prev + 0.2, MAX_ZOOM)
          : Math.max(prev - 0.2, MIN_ZOOM)

      if (next === 1) {
        setTranslate({ x: 0, y: 0 })
      }

      return next
    })
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLImageElement>) => {
    if (zoom <= 1) return

    event.preventDefault()
    setDragging(true)
    setDragStart({
      x: event.clientX - translate.x,
      y: event.clientY - translate.y,
    })
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || zoom <= 1) return

    event.preventDefault()
    setTranslate({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    })
  }

  const stopDragging = () => {
    setDragging(false)
  }

  const handleDoubleClick = () => {
    if (zoom === 1) {
      setZoom(DOUBLE_CLICK_ZOOM)
      return
    }

    resetView()
  }

  const imageCursor =
    zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in'

  return (
    <div className="fixed inset-0 z-[10040] bg-black">
      <div className="absolute inset-0 bg-black/95" onClick={onClose} />

      <div className="pointer-events-none fixed left-0 right-0 top-[calc(env(safe-area-inset-top)+12px)] z-[10060] flex justify-center px-3 sm:top-5 sm:px-6">
        <div className="pointer-events-auto flex max-w-[calc(100vw-24px)] items-center gap-2 rounded-full border border-white/10 bg-black/75 px-2 py-2 text-white shadow-2xl backdrop-blur-xl sm:gap-3 sm:px-3">
          <button
            type="button"
            onClick={zoomOut}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white transition hover:bg-white/15 sm:inline-flex"
            aria-label="Riduci zoom"
          >
            −
          </button>

          <button
            type="button"
            onClick={zoomIn}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white transition hover:bg-white/15 sm:inline-flex"
            aria-label="Aumenta zoom"
          >
            +
          </button>

          <div className="flex h-10 min-w-[66px] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 text-sm font-medium text-white sm:min-w-[78px]">
            {currentIndex + 1} / {images.length}
          </div>

          <button
            type="button"
            onClick={resetView}
            className="h-10 shrink-0 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-10 shrink-0 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Chiudi
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={goPrev}
        className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-4xl leading-none text-white/90 transition hover:bg-white/10 sm:left-5 sm:h-auto sm:w-auto sm:px-5 sm:py-4"
        aria-label="Immagine precedente"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={goNext}
        className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-4xl leading-none text-white/90 transition hover:bg-white/10 sm:right-5 sm:h-auto sm:w-auto sm:px-5 sm:py-4"
        aria-label="Immagine successiva"
      >
        ›
      </button>

      <div
        className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden px-3"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          draggable={false}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className="max-h-[82vh] max-w-[94vw] select-none object-contain sm:max-h-[92vh] sm:max-w-[92vw]"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
            cursor: imageCursor,
            transition: dragging ? 'none' : 'transform 0.12s ease-out',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  )
}
