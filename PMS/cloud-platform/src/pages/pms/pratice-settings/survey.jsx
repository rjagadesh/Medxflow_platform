import React from "react";

const Survey = () => {
  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-xl p-8 h-full overflow-y-auto">

      {/* ================= Survey & Label ================= */}
      <div className="mb-12">
        <h2 className="text-white text-xl font-semibold mb-2">
          Survey & Label
        </h2>
        <p className="text-gray-400 text-sm">
          Configure where patient reviews are directed based on their survey responses
        </p>
      </div>

      {/* ================= Review Destination Cards ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="border border-[#2b2b2b] rounded-xl p-6 bg-[#1e1e1e] hover:border-[#3a3a3a] transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
              <span className="text-white text-sm font-medium">K</span>
            </div>
            <h3 className="text-white text-sm font-semibold">
              Kareo Reviews
            </h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5"></div>
              <span>Reviews go to your provider profile</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5"></div>
              <span>Increases search visibility</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5"></div>
              <span>Raises Google search result ranking</span>
            </li>
          </ul>
        </div>

        <div className="border border-[#2b2b2b] rounded-xl p-6 bg-[#1e1e1e] hover:border-[#3a3a3a] transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
              <span className="text-white text-sm font-medium">G</span>
            </div>
            <h3 className="text-white text-sm font-semibold">
              Google My Business Reviews
            </h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5"></div>
              <span>
                Sends patients with a Gmail account directly to your practice's
                Google My Business review page
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5"></div>
              <span>Provides relevant Google search results</span>
            </li>
          </ul>
        </div>

        <div className="border border-[#2b2b2b] rounded-xl p-6 bg-[#1e1e1e] hover:border-[#3a3a3a] transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <h3 className="text-white text-sm font-semibold">
              Any Site
            </h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5"></div>
              <span>Send patients to any site of your choosing</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ================= Flow Section ================= */}
      <div className="mb-8">
        <h3 className="text-white text-lg font-semibold mb-4">
          Review Flow
        </h3>
        <p className="text-gray-400 text-sm mb-10">
          When patients respond to a survey, you can direct where their review goes:
        </p>
      </div>

      {/* Timeline Label */}
      <div className="relative flex justify-center mb-12">
        <div className="px-6 py-2.5 bg-[#2a2a2a] border border-[#333333] rounded-full">
          <span className="text-sm font-medium text-gray-300">
            After the visit
          </span>
        </div>
      </div>

      {/* ================= Timeline Layout ================= */}
      <div className="relative max-w-5xl mx-auto">

        {/* Main vertical line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-[#3a3a3a] to-[#2b2b2b]" />

        {/* Timeline Node - Survey Sent */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-0">
          <div className="w-5 h-5 rounded-full border-4 border-[#1c1c1c] bg-[#3a3a3a]"></div>
        </div>

        {/* -------- LEFT CHAT (Survey sent) -------- */}
        <div className="relative flex mb-20">
          <div className="w-1/2 pr-14">
            <div className="relative">
              {/* Chat bubble */}
              <div className="bg-[#2a2a2a] border border-[#333333] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <span className="text-white text-xs">S</span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">Survey System</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Surveys are being automatically sent to patients after their visit.
                </p>
                <button className="mt-4 text-sm underline text-gray-200 hover:text-white transition-colors">
                  Edit on settings page
                </button>
              </div>
              
              {/* Chat tail */}
              <div className="absolute -right-3 top-6 w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-[#2a2a2a]" />
            </div>
          </div>

          <div className="w-1/2 flex items-start justify-center pt-2">
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full border-4 border-[#1c1c1c] bg-[#3a3a3a] mb-2"></div>
              <span className="text-xs text-gray-400">Survey Sent</span>
            </div>
          </div>
        </div>

        {/* Timeline Node - Response */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-1/3">
          <div className="w-5 h-5 rounded-full border-4 border-[#1c1c1c] bg-[#3a3a3a]"></div>
        </div>

        {/* -------- RIGHT CHAT (4+ stars) -------- */}
        <div className="relative flex mb-20">
          <div className="w-1/2 flex items-start justify-center pt-2">
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full border-4 border-[#1c1c1c] bg-[#3a3a3a] mb-2"></div>
              <span className="text-xs text-gray-400">4+ Stars</span>
            </div>
          </div>

          <div className="w-1/2 pl-14">
            <div className="relative">
              {/* Chat bubble */}
              <div className="bg-[#2a2a2a] border border-[#333333] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <span className="text-white text-xs">R</span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">Review System</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  If patients choose{" "}
                  <span className="font-medium text-white bg-[#3a3a3a] px-2 py-0.5 rounded">
                    4 stars or more
                  </span>
                  , their reviews will be automatically published to your provider profile.
                </p>
              </div>
              
              {/* Chat tail */}
              <div className="absolute -left-3 top-6 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-[#2a2a2a]" />
            </div>
          </div>
        </div>

        {/* Timeline Node - Response */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-2/3">
          <div className="w-5 h-5 rounded-full border-4 border-[#1c1c1c] bg-[#3a3a3a]"></div>
        </div>

        {/* -------- LEFT CHAT (≤3 stars) -------- */}
        <div className="relative flex">
          <div className="w-1/2 pr-14">
            <div className="relative">
              {/* Chat bubble */}
              <div className="bg-[#2a2a2a] border border-[#333333] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <span className="text-white text-xs">M</span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">Moderation</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  If patients choose{" "}
                  <span className="font-medium text-white bg-[#3a3a3a] px-2 py-0.5 rounded">
                    3 stars or less
                  </span>
                  , their reviews will be sent to your patient review activity for you to review.
                </p>
              </div>
              
              {/* Chat tail */}
              <div className="absolute -right-3 top-6 w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-[#2a2a2a]" />
            </div>
          </div>

          <div className="w-1/2 flex items-start justify-center pt-2">
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full border-4 border-[#1c1c1c] bg-[#3a3a3a] mb-2"></div>
              <span className="text-xs text-gray-400">≤3 Stars</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Survey;