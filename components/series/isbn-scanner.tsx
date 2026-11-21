"use client";

// Loaded on demand (next/dynamic in library-search.tsx): zxing is ~125 KB
// gzipped and only needed once someone taps Scan. Pure JS, so there's no
// WASM to host and nothing fetched from a CDN at runtime.

import { Button } from "@/components/ui/button";
import { isbnFromBarcode } from "@/lib/isbn";
import { BrowserMultiFormatOneDReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { CameraOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type IsbnScannerProps = {
  onDetected: (isbn: string) => void;
  onClose: () => void;
};

type ScanState =
  | { status: "starting" }
  | { status: "scanning"; notIsbn: boolean }
  | { status: "error"; message: string };

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera access is blocked. Allow the camera for this site in your browser settings, or type the ISBN instead.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera found on this device. Type the ISBN from the back cover instead.";
  }
  if (name === "NotReadableError") {
    return "The camera is being used by another app. Close it and try again.";
  }
  return "Couldn't start the camera. Type the ISBN from the back cover instead.";
}

/** Camera view that reads an EAN-13 book barcode and reports its ISBN. */
export function IsbnScanner({ onDetected, onClose }: IsbnScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScanState>({ status: "starting" });
  // Latest callback without restarting the camera when the parent re-renders.
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let controls: IScannerControls | null = null;
    let stopped = false;

    const stop = () => {
      stopped = true;
      controls?.stop();
      // Always release the camera ourselves, even if zxing never started.
      stream?.getTracks().forEach((track) => track.stop());
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        if (!stopped) setState({ status: "error", message: cameraErrorMessage(err) });
        return;
      }
      // Closed while the permission prompt was up.
      if (stopped || !videoRef.current) {
        stop();
        return;
      }

      const reader = new BrowserMultiFormatOneDReader(
        new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]]]),
      );
      try {
        const started = await reader.decodeFromStream(stream, videoRef.current, (result) => {
          if (!result || stopped) return;
          const isbn = isbnFromBarcode(result.getText());
          if (!isbn) {
            setState((prev) =>
              prev.status === "scanning" && prev.notIsbn ? prev : { status: "scanning", notIsbn: true },
            );
            return;
          }
          stop();
          onDetectedRef.current(isbn);
        });
        if (stopped) started.stop();
        else controls = started;
        if (!stopped) setState({ status: "scanning", notIsbn: false });
      } catch (err) {
        stop();
        setState({ status: "error", message: cameraErrorMessage(err) });
      }
    })();

    return stop;
  }, []);

  return (
    <div className="space-y-3">
      {state.status === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border px-4 py-8 text-center">
          <CameraOff className="w-8 h-8 text-foreground-muted" />
          <p role="alert" className="text-sm text-foreground-muted">
            {state.message}
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-md bg-black aspect-4/3">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            aria-label="Camera preview"
          />
          {/* Aiming guide: book barcodes are wide and short. */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-1/3 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          />
          {state.status === "starting" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" aria-label="Starting camera" />
            </div>
          )}
        </div>
      )}

      {state.status === "scanning" && (
        <p role="status" className="text-sm text-center text-foreground-muted">
          {state.notIsbn
            ? "That barcode isn't an ISBN. Book ISBN barcodes start with 978 or 979, usually on the back cover."
            : "Point the camera at the barcode on the back cover."}
        </p>
      )}

      <Button variant="outline" type="button" onClick={onClose} className="w-full">
        {state.status === "error" ? "Back to search" : "Cancel"}
      </Button>
    </div>
  );
}
