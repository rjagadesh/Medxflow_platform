// Install: npm i docx-preview

import React, { useRef, useState, useEffect } from "react";
// import { renderAsync } from "docx-preview";

export default function DocxViewer({ url }) {
  const containerRef = useRef(null);
  const [inputUrl, setInputUrl] = useState(url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDocument = async (docUrl) => {
    if (!docUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Clear previous content
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      // Fetch the DOCX file from URL
      const response = await fetch(docUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Render the DOCX file
      await renderAsync(blob, containerRef.current, null, {
        className: "docx-preview",
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: false,
        trimXmlDeclaration: true,
        useBase64URL: false,
        useMathMLPolyfill: false,
        renderChanges: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      });
    } catch (err) {
      setError("Error loading document: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if URL prop is provided
  useEffect(() => {
    if (url) {
      loadDocument(url);
    }
  }, [url]);

  const handleLoadDocument = () => {
    loadDocument(inputUrl);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLoadDocument();
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {error && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#fee",
            color: "#c00",
            borderRadius: "4px",
            fontSize: "14px",
            border: "1px solid #fcc",
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#999",
            fontSize: "16px",
          }}
        >
          Loading document...
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          backgroundColor: "#fff",
          minHeight: "400px",
          maxHeight: "65vh",
          overflow: "auto",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}

// Usage examples:
//
// 1. With auto-load from prop:
// <DocxViewer url="https://example.com/document.docx" />
//
// 2. Without initial URL (manual input):
// <DocxViewer />
//
// 3. In your main App:
// function App() {
//   return <DocxViewer url="https://your-server.com/file.docx" />;
// }
