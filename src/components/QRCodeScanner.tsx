'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'

interface QRCodeScannerProps {
  onResult?: (result: string) => void
  onError?: (error: string) => void
}

export default function QRCodeScanner({ onResult, onError }: QRCodeScannerProps) {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch (err) {
        console.error('Erro ao parar scanner:', err)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const handleResult = useCallback((decodedText: string) => {
    setLastResult(decodedText)
    
    if (onResult) {
      onResult(decodedText)
      return
    }

    try {
      const url = new URL(decodedText)
      const currentOrigin = window.location.origin
      
      if (url.origin === currentOrigin) {
        router.push(url.pathname + url.search)
      } else {
        window.location.href = decodedText
      }
    } catch {
      window.location.href = decodedText
    }
  }, [onResult, router])

  const startScanner = useCallback(async () => {
    if (!containerRef.current || isScanning) return

    try {
      setError(null)
      
      const devices = await Html5Qrcode.getCameras()
      if (!devices || devices.length === 0) {
        setHasCamera(false)
        setError('Nenhuma câmera encontrada')
        return
      }

      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 350, height: 350 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleResult(decodedText)
          stopScanner()
        },
        () => {}
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err)
      const message = err instanceof Error ? err.message : 'Erro ao acessar câmera'
      setError(message)
      onError?.(message)
    }
  }, [isScanning, handleResult, stopScanner, onError])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        ref={containerRef}
        id="qr-reader"
        className="w-full rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', minHeight: '300px' }}
      />

      {error && (
        <div className="text-center p-4 rounded-lg w-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {lastResult && (
        <div className="text-center p-4 rounded-lg w-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Último resultado:</p>
          <p className="text-sm font-mono break-all" style={{ color: 'var(--text-primary)' }}>{lastResult}</p>
        </div>
      )}

      <div className="flex gap-3 w-full">
        {!isScanning ? (
          <button
            onClick={startScanner}
            disabled={!hasCamera}
            className="flex-1 rounded-lg px-6 py-3 text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: hasCamera ? 'var(--btn-primary-bg)' : 'var(--btn-secondary-bg)', 
              color: hasCamera ? 'var(--btn-primary-text)' : 'var(--text-secondary)' 
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Iniciar Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex-1 rounded-lg px-6 py-3 text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--text-primary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
            Parar Scanner
          </button>
        )}
      </div>

      {isScanning && (
        <p className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          Aponte a câmera para o QR Code
        </p>
      )}
    </div>
  )
}
