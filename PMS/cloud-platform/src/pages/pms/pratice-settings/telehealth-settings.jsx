import React, { useState } from "react";
import { Copy } from "lucide-react";

/* ---------------- SAMPLE DATA ---------------- */
const INITIAL_PROVIDERS = [
  { name: "Kathy Heav", slug: "typebox" },
  { name: "Alyssa Domingos", slug: "alyssa-domingos" },
  { name: "Michael Thompson", slug: "michael-thompson" },
  { name: "Sophia Martinez", slug: "sophia-martinez" },
  { name: "Daniel Wright", slug: "daniel-wright" },
];

const BASE_URL = "https://telehealth.kareo.com/";

const TelehealthSettings = () => {
  const [providers, setProviders] = useState(INITIAL_PROVIDERS);

  const handleChange = (index, value) => {
    const updated = [...providers];
    updated[index].slug = value
      .replace(/[^a-zA-Z0-9-]/g, "") // allow letters, numbers, hyphen
      .slice(0, 50); // max 50 chars
    setProviders(updated);
  };

  const copyUrl = (slug) => {
    navigator.clipboard.writeText(`${BASE_URL}${slug}`);
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-6 h-full overflow-y-auto">

      {/* Header */}
      <h2 className="text-white text-lg font-medium mb-3">
        Telehealth Settings
      </h2>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed mb-6">
        We've made telehealth simple and easy for you. A custom URL has been
        generated for your patients to access your personal room, but it can be
        modified. The room link will be sent to your patients via appointment
        reminders. Each URL can contain letters, numbers, or hyphens (e.g.
        <span className="text-gray-300"> dr-sample-provider-1</span>) up to a
        maximum of 50 characters.
        <br />
        <br />
        <span className="text-gray-500">
          Please note: Providers should access their telehealth room from the
          dashboard to gain host permissions.
        </span>
      </p>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-4 py-2 text-sm text-gray-400 border-b border-[#2a2a2a]">
        <div className="col-span-3">Provider Name</div>
        <div className="col-span-7">Telehealth URL</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Provider Rows */}
      <div className="border border-[#2a2a2a] rounded-md mt-2 overflow-hidden">
        {providers.map((provider, index) => (
          <div
            key={index}
            className="grid grid-cols-12 items-center px-4 py-4 border-b border-[#2a2a2a] last:border-none hover:bg-[#2a2a2a]"
          >
            {/* Provider Name */}
            <div className="col-span-3 text-sm text-gray-300">
              {provider.name}
            </div>

            {/* URL Input */}
            <div className="col-span-7 flex items-center gap-2">
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {BASE_URL}
              </span>
              <input
                value={provider.slug}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder="type here"
                maxLength={50}
                className="flex-1 bg-[#2a2a2a] text-sm text-white px-3 py-2 rounded-md outline-none"
              />
            </div>

            {/* Copy */}
            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => copyUrl(provider.slug)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
              >
                <Copy size={14} />
                Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default TelehealthSettings;
