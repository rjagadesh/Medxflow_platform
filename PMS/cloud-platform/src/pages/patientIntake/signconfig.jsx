import React, { useEffect, useState } from "react";

export default function SignConfiguration() {
  const [files, setFiles] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [defaultSignatureId, setDefaultSignatureId] = useState(null);

  // Load stored signatures on page load
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("signatures_list") || "[]");
    const def = localStorage.getItem("default_signature_id");

    setSignatures(saved);
    setDefaultSignatureId(def);
  }, []);

  // Upload multiple signatures
  const handleUpload = () => {
    if (!files || files.length === 0)
      return alert("Please select one or more files.");

    const updatedList = [...signatures];

    let processed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64 = reader.result;

        const newSig = {
          id: "sig_" + Date.now() + "_" + Math.random().toString(36).slice(2),
          name: file.name,
          data: base64,
        };

        updatedList.push(newSig);

        processed++;

        // Save once all files are processed
        if (processed === files.length) {
          localStorage.setItem("signatures_list", JSON.stringify(updatedList));
          setSignatures(updatedList);
          alert("Signatures uploaded successfully!");
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const setAsDefault = (id) => {
    localStorage.setItem("default_signature_id", id);
    setDefaultSignatureId(id);
  };

  const deleteSignature = (id) => {
    const updatedList = signatures.filter((s) => s.id !== id);

    localStorage.setItem("signatures_list", JSON.stringify(updatedList));
    setSignatures(updatedList);

    if (defaultSignatureId === id) {
      localStorage.removeItem("default_signature_id");
      setDefaultSignatureId(null);
    }
  };

  return (
    <div className="min-h-screen w-full p-10">
      <div className="max-w-2xl text-white mx-auto mt-10 p-6 shadow-lg rounded-lg bg-[var(--chakra-colors-droidal-black-300)]">
        <h1 className="text-2xl font-light mb-4 text-white">
          Sign Configuration
        </h1>

        {/* UPLOAD SECTION */}
        <div className="border border-[var(--chakra-colors-droidal-gray-300)] p-4 rounded-lg">
          <label className="block mb-2 font-medium">Upload Signatures</label>

          {/* Allow multiple files */}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(e.target.files)}
          />

          <button
            onClick={handleUpload}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Upload Selected
          </button>
        </div>

        {/* SIGNATURE LIST */}
        <h2 className="text-xl font-semibold mt-6 mb-2">Saved Signatures</h2>

        {signatures.length === 0 && (
          <p className="text-[var(--chakra-colors-droidal-gray-400)]">
            No signatures uploaded yet.
          </p>
        )}

        {signatures.map((sig) => (
          <div
            key={sig.id}
            className="flex items-center justify-between p-3 border rounded-lg mb-3"
          >
            <div className="flex items-center gap-4">
              <img
                src={sig.data}
                alt="signature"
                className="h-16 border rounded bg-white"
              />
              <div>
                <p className="font-medium">{sig.name}</p>

                {defaultSignatureId === sig.id ? (
                  <span className="text-green-600 font-semibold text-sm">
                    Default Signature
                  </span>
                ) : (
                  <button
                    onClick={() => setAsDefault(sig.id)}
                    className="text-blue-600 text-sm underline"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>

            {/* DELETE */}
            <button
              onClick={() => deleteSignature(sig.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
