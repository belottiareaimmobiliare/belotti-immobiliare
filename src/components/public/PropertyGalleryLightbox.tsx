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

    return () => {
      document.body.style.overflow = previousOverflow
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
  }, [isOpen, images.length])

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
    <div className="fixed inset-0 z-[120] bg-black">
      <div className="absolute inset-0 bg-black/95" onClick={onClose} />

      <div className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/80 backdrop-blur">
        <span className="hidden sm:inline">Premi ESC per uscire</span>
        <span className="hidden sm:inline text-white/30">•</span>
        <span>
          {currentIndex + 1} / {images.length}
        </span>
      </div>

      <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={zoomOut}
          className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
        >
          −
        </button>

        <button
          type="button"
          onClick={zoomIn}
          className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
        >
          +
        </button>

        <button
          type="button"
          onClick={resetView}
          className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
        >
          Chiudi
        </button>
      </div>

      <button
        type="button"
        onClick={goPrev}
        className="absolute left-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 px-5 py-4 text-3xl leading-none text-white/90 transition hover:bg-white/10"
        aria-label="Immagine precedente"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={goNext}
        className="absolute right-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 px-5 py-4 text-3xl leading-none text-white/90 transition hover:bg-white/10"
        aria-label="Immagine successiva"
      >
        ›
      </button>

      <div
        className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
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
          className="max-h-[92vh] max-w-[92vw] select-none object-contain"
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