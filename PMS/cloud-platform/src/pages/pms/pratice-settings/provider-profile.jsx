import React, { useState } from "react";
import { User, ChevronRight, ChevronLeft } from "lucide-react";

/* ---------------- SAMPLE DATA ---------------- */
const PROVIDERS = [
  "Kathy Heav, APRN",
  "Alyssa Domingos, NP",
  "Michael Thompson, MD",
  "Sophia Martinez, PA-C",
  "Daniel Wright, DO",
  "Emma Johnson, APRN",
  "James Carter, MD",
];

const ITEMS_PER_PAGE = 5;

const ProviderProfile = () => {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(PROVIDERS.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentProviders = PROVIDERS.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-6 h-full flex flex-col">

      {/* Header */}
      <h2 className="text-white text-lg font-semibold mb-5">
        Provider Profiles
      </h2>

      {/* List */}
      <div className="border border-[#2b2b2b] rounded-md overflow-hidden flex-1">
        {currentProviders.map((name, index) => (
          <div
            key={index}
            className="grid grid-cols-12 items-center px-6 py-4 border-b border-[#2b2b2b] last:border-none"
          >
            {/* Avatar */}
            <div className="col-span-1">
              <div className="w-9 h-9 rounded-full bg-[#2b2b2b] flex items-center justify-center">
                <User size={16} className="text-gray-500" />
              </div>
            </div>

            {/* Name */}
            <div className="col-span-5">
              <p className="text-sm font-medium text-gray-200">
                {name}
              </p>
            </div>

            {/* Actions */}
            <div className="col-span-6">
              <div className="flex items-center gap-6">
                <button className="text-sm text-gray-400 hover:text-gray-300">
                  View profile
                </button>

                <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-200 bg-[#2b2b2b] rounded-md hover:bg-[#333333]">
                  Manage
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-4 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-2 border border-[#2b2b2b] rounded-md text-gray-400 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm text-gray-400">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-2 border border-[#2b2b2b] rounded-md text-gray-400 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
};

export default ProviderProfile;
