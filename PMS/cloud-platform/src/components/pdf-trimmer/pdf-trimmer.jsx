// PdfTrimmer.jsx
import React, { startTransition, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FiSave, FiX } from "react-icons/fi"; // optional nice icons
import { Box, Center, Field, HStack, Text } from "@chakra-ui/react";
import CustomButton from "../button/button";
import CustomInput from "../input/input";
import { toaster } from "../ui/toaster";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";

export default function PdfTrimmer({ initialPdfUrl, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [fromPage, setFromPage] = useState("1");
  const [originalPages, setOriginalPages] = useState({
    from: 1,
    to: 1,
  });
  const [toPage, setToPage] = useState("");
  const [totalPages, setTotalPages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const currentBlobUrlRef = useRef(null); // to revoke old blob URLs

  useEffect(() => {
    // when pdfUrl changes, try to read total pages (non-intrusively)
    let cancelled = false;
    async function loadPageCount() {
      if (!pdfUrl) return;
      try {
        const arrayBuffer = await fetchPdfAsArrayBuffer(pdfUrl);
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        if (!cancelled) {
          const totalPages = pdfDoc.getPageCount();
          setTotalPages(totalPages);
          setOriginalPages((prev) => ({ ...prev, to: totalPages }));
          setToPage(totalPages);
        }
      } catch (e) {
        console.error("Failed to load PDF for page count:", e);
        if (!cancelled) setTotalPages(null);
      }
    }
    loadPageCount();
    return () => (cancelled = true);
  }, [pdfUrl]);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
    };
  }, []);

  // helper to fetch ArrayBuffer from a URL (supports blob URLs and remote URLs)
  async function fetchPdfAsArrayBuffer(urlOrBlob) {
    // if it's a blob URL from this page (starts with blob:) fetch still works
    const resp = await fetch(urlOrBlob);
    if (!resp.ok) throw new Error("Failed to fetch PDF: " + resp.status);
    return await resp.arrayBuffer();
  }

  function closeEditor() {
    onClose();
  }

  const updatePdf = async (blob) => {
    try {
      setSaveLoading(true);
      startTransition(async () => {
        const url = initialPdfUrl.split("/media")[1];
        const mediaUrl = `media${url}`;
        const fileName = url.split("/").filter(Boolean).pop();
        // After creating blob
        const formData = new FormData();
        formData.append("file", blob, fileName);
        formData.append("file_path", mediaUrl); // 👈 the file location to overwrite

        try {
          await apiRequest(apiRoutes.agentsRequest.updatePdf, {
            payload: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          toaster.success({
            title: "Success",
            description: "PDF successfully updated on the server.",
          });
          onClose();
        } catch (err) {
          console.error("Upload error:", err);
          toaster.error({
            title: "Error",
            description: "Failed to upload trimmed PDF: " + err.message,
          });
        }
      });
    } catch (error) {
      console.log("error", error);
    } finally {
      setSaveLoading(false);
    }
  };

  // main trimming function (client-side using pdf-lib)
  async function trimPdf() {
    // Validate inputs
    const from = parseInt(fromPage, 10);
    const to = parseInt(toPage, 10);

    if (Number.isNaN(from) || Number.isNaN(to)) {
      toaster.error({
        title: "Error",
        description: "From and To must be numbers.",
      });
      return;
    }
    if (from < 1) {
      toaster.error({ title: "Error", description: "From page must be >= 1." });
      return;
    }
    if (to < from) {
      toaster.error({
        title: "Error",
        description: "'To' must be greater than or equal to 'From'.",
      });
      return;
    }
    if (totalPages && to > totalPages) {
      toaster.error({
        title: "Error",
        description: `PDF only has ${totalPages} pages. Set To <= ${totalPages}.`,
      });

      return;
    }

    setLoading(true);
    try {
      const arrayBuffer = await fetchPdfAsArrayBuffer(pdfUrl);
      const srcDoc = await PDFDocument.load(arrayBuffer);

      const newDoc = await PDFDocument.create();
      // pdf-lib uses zero-based indices for copyPages
      const indices = [];
      for (let p = from - 1; p <= to - 1; p++) indices.push(p);

      // safety: ensure indices within range
      const pageCount = srcDoc.getPageCount();
      const validIdx = indices.filter((i) => i >= 0 && i < pageCount);
      if (validIdx.length === 0) {
        toaster.error({
          title: "Error",
          description: "No valid pages selected.",
        });
        setLoading(false);
        return;
      }

      const copiedPages = await newDoc.copyPages(srcDoc, validIdx);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const newPdfBytes = await newDoc.save();
      const blob = new Blob([newPdfBytes], { type: "application/pdf" });
      updatePdf(blob);
      const newBlobUrl = URL.createObjectURL(blob);

      // revoke previous blob url if we created one earlier
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      currentBlobUrlRef.current = newBlobUrl;

      setPdfUrl(newBlobUrl);
      // update total pages
      setTotalPages(validIdx.length);
    } catch (err) {
      console.error("Trim error:", err);
      toaster.error({
        title: "Error",
        description: "Failed to trim PDF: " + (err.message || err),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 8,
        height: "100%",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}></div>

        {loading && <Text style={{ marginLeft: 8 }}>Trimming PDF…</Text>}
      </div>
      <HStack
        style={{
          padding: 10,
          border: "1px solid #e2e2e2",
          borderRadius: 8,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
        justifyContent={"space-between"}
      >
        <HStack justifyContent={"space-between"}>
          <HStack>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Field.Root
                display={"flex"}
                flexDirection={"row"}
                gap={2}
                alignItems={"center"}
              >
                <Field.Label
                  top="2px"
                  position={"relative"}
                  letterSpacing={"wider"}
                >
                  From
                </Field.Label>

                <CustomInput
                  type="number"
                  min={1}
                  max={originalPages.to}
                  value={fromPage}
                  onChange={(e) => setFromPage(e.target.value)}
                  w="80px"
                  size="2xs"
                />
              </Field.Root>
            </label>

            <HStack style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Field.Root
                display={"flex"}
                flexDirection={"row"}
                gap={2}
                alignItems={"center"}
              >
                <Field.Label
                  top="2px"
                  position={"relative"}
                  letterSpacing={"wider"}
                >
                  To
                </Field.Label>
                <CustomInput
                  type="number"
                  min={1}
                  max={originalPages.to}
                  value={toPage}
                  onChange={(e) => setToPage(e.target.value)}
                  w="80px"
                  size="2xs"
                />
              </Field.Root>
            </HStack>
          </HStack>

          {totalPages !== null && (
            <Text position={"relative"} top={"2px"}>
              Pages: {totalPages}
            </Text>
          )}
        </HStack>

        <Center gap={4}>
          <CustomButton
            onClick={trimPdf}
            disabled={loading || saveLoading}
            loading={loading || saveLoading}
            title="Save trimmed PDF"
            leftIcon={<FiSave />}
          >
            Save
          </CustomButton>

          <CustomButton
            onClick={closeEditor}
            variant="outline"
            leftIcon={<FiX />}
          >
            Cancel
          </CustomButton>
        </Center>
      </HStack>

      <div style={{ height: "calc(100vh - 120px)", border: "1px solid #ddd" }}>
        {pdfUrl ? (
          <iframe
            title="PDF viewer"
            src={pdfUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <div style={{ padding: 16 }}>No PDF URL provided.</div>
        )}
      </div>
    </div>
  );
}
