import React, { useState, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useUpdateRequest } from "@/hooks/mutation/agentsapp/useUpdateRequest";
import { toaster } from "@/components/ui/toaster";

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

// import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
/* ----------------------------------------------------------
   LOAD DEFAULT SIGNATURE FROM LOCALSTORAGE
-----------------------------------------------------------*/
function getDefaultSignature() {
  const list = JSON.parse(localStorage.getItem("signatures_list") || "[]");
  const defaultId = localStorage.getItem("default_signature_id");

  if (!defaultId) return null;

  const sig = list.find((s) => s.id === defaultId);
  return sig ? sig.data : null; // return base64 image string
}

export default function PdfSignPage({ api_key, initialValues = {} }) {
  const [pdfUrl] = useState("/sample.pdf");

  const [scale, setScale] = useState(1.2);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { mutate: updateRequest, isPending: updateRequestPending } =
    useUpdateRequest(api_key, initialValues?.id);

  // LOAD DEFAULT SIGNATURE
  const defaultSignature = getDefaultSignature();

  const [placedSignatures, setPlacedSignatures] = useState([]);

  const pageRef = useRef(null);
  const memoizedFile = useMemo(
    () => ({ url: `${window.location.origin}/sample.pdf` }),
    [pdfUrl]
  );

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  /* ----------------------------------------------------------
      CLICK HANDLER → PLACE DEFAULT SIGNATURE
  -----------------------------------------------------------*/
  function handlePdfClick(e) {
    if (!pageRef.current) return;

    if (!defaultSignature) {
      alert("No default signature found. Please set one first.");
      return;
    }

    const rect = pageRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Always maintain only ONE signature
    setPlacedSignatures([
      {
        id: 1,
        url: defaultSignature,
        page: currentPage,
        x: x - 75, // center horizontally
        y: y - 30, // slight offset
        width: 150,
      },
    ]);
  }

  function deleteSignature(id) {
    setPlacedSignatures([]);
  }

  /* ----------------------------------------------------------
      MAP SIGNATURE POSITION TO PDF COORDINATES
  -----------------------------------------------------------*/
  function mapToPdfCoordinates(sig, pdfPage) {
    const { width: pdfW, height: pdfH } = pdfPage.getSize();
    const rect = pageRef.current.getBoundingClientRect();

    const scaleX = pdfW / rect.width;
    const scaleY = pdfH / rect.height;

    const offset = 80 * scaleY;

    const pdfX = sig.x * scaleX;
    const pdfY = pdfH - sig.y * scaleY - sig.width * scaleY + offset;

    return { x: pdfX, y: pdfY, width: sig.width * scaleX };
  }

  /* ----------------------------------------------------------
      SAVE SIGNED PDF
  -----------------------------------------------------------*/
  async function handleSignPdf() {
    if (placedSignatures.length === 0) {
      alert("No signature placed!");
      return;
    }

    const existingPdfBytes = await fetch(pdfUrl).then((res) =>
      res.arrayBuffer()
    );
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();

    for (const sig of placedSignatures) {
      const page = pages[sig.page - 1];

      // Convert base64 → Uint8Array
      const base64 = sig.url.split(",")[1];
      const sigBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const sigImage = await pdfDoc.embedPng(sigBytes);

      const mapped = mapToPdfCoordinates(sig, page);
      const aspect = sigImage.height / sigImage.width;
      const pdfHeight = mapped.width * aspect;

      page.drawImage(sigImage, {
        x: mapped.x,
        y: mapped.y,
        width: mapped.width,
        height: pdfHeight,
      });

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Place name ABOVE the signature
      page.drawText(`Place: Coimbatore`, {
        x: mapped.x,
        y: mapped.y + pdfHeight + 1, // Adjust upward above image
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });

      // Date BELOW the signature (existing)
      page.drawText(`Signed: ${new Date().toLocaleString()}`, {
        x: mapped.x,
        y: mapped.y - 1,
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "signed.pdf";
    link.click();

    updateRequest(
      {
        ...initialValues,
        status: "SUCCESS",
      },
      {
        onSuccess: () => {
          toaster.success({
            title: "Success",
            description: "Request updated successfully",
          });
        },
        onError: (error) => {
          toaster.error({
            title: "Error",
            description: error.message || "Error updating request",
          });
        },
      }
    );
  }

  /* ----------------------------------------------------------
      RENDER UI
  -----------------------------------------------------------*/
  return (
    <div className="p-6">
      <div className="max-w-[1200px] mx-auto flex justify-center">
        {/* LEFT COLUMN - PDF */}
        <div className="relative bg-[#101212] rounded-2xl shadow-2xl p-6 w-fit">
          {/* Navigation */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center text-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setScale((s) => Math.max(0.4, +(s - 0.1).toFixed(2)))
                  }
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
                >
                  −
                </button>

                <span className="text-sm opacity-70 text-white">
                  {(scale * 100).toFixed(0)}%
                </span>

                <button
                  onClick={() => setScale((s) => +(s + 0.1).toFixed(2))}
                  className="bg-gradient-to-r from-[#00aeea] to-[#007fbf] hover:opacity-90 px-3 py-1 rounded-md text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="bg-gray-800 disabled:opacity-40 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
            >
              First
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="bg-gray-800 disabled:opacity-40 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Previous
            </button>

            <span className="text-sm opacity-80 text-white">
              Page {currentPage} / {numPages ?? "-"}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="bg-gradient-to-r from-[#00aeea] to-[#007fbf] text-white disabled:opacity-40 px-3 py-1 rounded-md text-sm"
            >
              Next
            </button>

            <button
              onClick={() => setCurrentPage(numPages)}
              disabled={currentPage === numPages}
              className="bg-gray-800 disabled:opacity-40 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Last
            </button>

            <button
              onClick={handleSignPdf}
              className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-semibold w-[100px] ml-auto"
            >
              Submit
            </button>
          </div>

          {/* PDF VIEW */}
          <div className="relative w-fit" onClick={handlePdfClick}>
            <Document
              file={memoizedFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err) => console.error("PDF load error:", err)}
            >
              <Page pageNumber={currentPage} scale={scale} inputRef={pageRef} />
            </Document>

            {/* SIGNATURE OVERLAY */}
            {placedSignatures
              .filter((sig) => sig.page === currentPage)
              .map((sig) => (
                <Rnd
                  key={sig.id}
                  size={{ width: sig.width, height: "auto" }}
                  position={{ x: sig.x, y: sig.y }}
                  enableUserSelectHack={false} // <-- FIX
                  onDragStop={(e, d) =>
                    setPlacedSignatures([{ ...sig, x: d.x, y: d.y }])
                  }
                  onResizeStop={(e, direction, ref, delta, position) =>
                    setPlacedSignatures([
                      {
                        ...sig,
                        width: parseFloat(ref.style.width),
                        x: position.x,
                        y: position.y,
                      },
                    ])
                  }
                  enableResizing={{
                    right: true,
                    bottom: true,
                    topRight: true,
                    bottomRight: true,
                    bottomLeft: true,
                    topLeft: true,
                  }}
                  style={{ position: "absolute", zIndex: 40 }}
                >
                  <div className="relative">
                    <img
                      src={sig.url}
                      alt="signature"
                      className="w-full rounded-md cursor-grab"
                    />

                    <button
                      onClick={(e) => {
                        deleteSignature(sig.id);
                        e.stopPropagation();
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                </Rnd>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
