import React, { useState } from "react";

const Widget = () => {
  const [directLink, setDirectLink] = useState(
    "https://practice.kareo.com/sample-practice-1"
  );

  const [embedCode, setEmbedCode] = useState(
`<script src="https://practice.kareo.com/widget.js"></script>
<div id="kareo-scheduling-widget"
     data-practice="sample-practice-1">
</div>`
  );

  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-6 h-full overflow-y-auto">

      {/* ================= Header ================= */}
      <h2 className="text-white text-lg font-semibold mb-8">
        Scheduling Widget
      </h2>

      {/* ================= Direct Link ================= */}
      <div className="mb-10">
        <p className="text-sm text-gray-400 mb-3">
          Copy this code to incorporate the direct link in your website
        </p>

        <p className="text-xs text-gray-500 mb-2">
          Direct link
        </p>

        <input
          value={directLink}
          onChange={(e) => setDirectLink(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-3 text-sm text-gray-300 outline-none mb-4"
        />

        <button className="px-6 py-2 rounded-full bg-[#2d2d2d] text-sm text-gray-200 hover:bg-[#3a3a3a]">
          Copy direct link
        </button>
      </div>

      {/* ================= Embed Widget ================= */}
      <div>
        <p className="text-sm text-gray-400 mb-3">
          Copy this code to embed in the &lt;body&gt; section of your website.
        </p>

        <p className="text-xs text-gray-500 mb-2">
          Widget
        </p>

        <textarea
          rows={6}
          value={embedCode}
          onChange={(e) => setEmbedCode(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-3 text-sm text-gray-300 outline-none mb-4 resize-none"
        />

        <button className="px-6 py-2 rounded-full bg-[#2d2d2d] text-sm text-gray-200 hover:bg-[#3a3a3a]">
          Copy embed link
        </button>
      </div>

    </div>
  );
};

export default Widget;
