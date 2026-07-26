import React, { useEffect, useState } from "react";
import ProgressChart from "./progress-chart";
import { Link } from "react-router-dom";

export default function DashboardCard({ data = [] }) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      id="apiresponse"
    >
      {data.map((data, index) => {
        const total =
          parseInt(data.queuetrans_success) +
          parseInt(data.queuetrans_needsattention);

        return (
          <div key={index} className="p-2">
            <Link
              to={`/droid-metrix/queue/${data.queuetrans_client_name}`}
              className="no-underline"
            >
              <div className="bg-droidal-black-300 shadow rounded-md p-6 !h-[272.22px]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold">{data.labelname}</p>
                    <p className="text-sm text-gray-400">
                      Last Run On:{" "}
                      {data.bot_status === "Yet to start"
                        ? data.last_date
                        : data.bot_status}
                    </p>
                  </div>
                  <div className="h-12 w-12">
                    <div style={{ height: 50 }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="68"
                        height="68"
                        viewBox="0 0 68 68"
                        fill="none"
                      >
                        {data["bot_status"] == "Running" ? (
                          <g class="spin-path">
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M24.006 65.765L25.746 63.566L27.306 61.5921L59.133 21.3421L60.75 19.2972L62.587 16.9742C56.788 7.19321 46.12 0.639008 33.923 0.639008C15.525 0.639008 0.609985 15.554 0.609985 33.9542C0.609985 48.9 10.452 61.5472 24.006 65.765H24.006Z"
                              fill="url(#paint0_linear_19_8)"
                            />
                          </g>
                        ) : (
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M24.006 65.765L25.746 63.566L27.306 61.5921L59.133 21.3421L60.75 19.2972L62.587 16.9742C56.788 7.19321 46.12 0.639008 33.923 0.639008C15.525 0.639008 0.609985 15.554 0.609985 33.9542C0.609985 48.9 10.452 61.5472 24.006 65.765H24.006Z"
                            fill="url(#paint0_linear_19_8)"
                          />
                        )}
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M39.8521 61.896C55.1841 58.8264 65.1247 43.9089 62.055 28.5769C58.9854 13.2449 44.0679 3.30427 28.7359 6.37392C13.4039 9.44357 3.46326 24.3611 6.53291 39.6931C9.60256 55.0251 24.52 64.9657 39.8521 61.896Z"
                          fill="url(#paint1_linear_19_8)"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M34.2937 60.7856C49.0128 60.7856 60.945 48.8535 60.945 34.1344C60.945 19.4153 49.0128 7.48315 34.2937 7.48315C19.5747 7.48315 7.64252 19.4153 7.64252 34.1344C7.64252 48.8535 19.5747 60.7856 34.2937 60.7856Z"
                          fill="#001C2D"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M47.4892 32.1157C46.6532 25.4897 41.0732 20.4858 34.3962 20.3747L35.3162 19.4616C35.5951 19.1886 35.6002 18.7416 35.3282 18.4626C35.0552 18.1838 34.6081 18.1786 34.3292 18.4506L34.3222 18.4577L32.0842 20.6777C31.8072 20.9526 31.8052 21.3996 32.0792 21.6767H32.0802L34.3172 23.9328C34.5902 24.2116 35.0372 24.2167 35.3162 23.9438C35.5951 23.6718 35.6002 23.2238 35.3282 22.9448L35.3212 22.9377L34.1792 21.7878C40.8132 21.7917 46.1861 27.1728 46.1822 33.8066C46.1792 37.4506 44.5221 40.8967 41.6772 43.1747C41.3732 43.4186 41.3241 43.8627 41.5682 44.1677C41.8122 44.4716 42.2562 44.5207 42.5611 44.2768V44.2768C46.2362 41.3307 48.0782 36.7836 47.4892 32.1157H47.4892Z"
                          fill="url(#paint2_linear_19_8)"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M34.0282 43.6592C33.7562 43.3801 33.3082 43.3753 33.0292 43.6482C32.7502 43.9212 32.7452 44.3682 33.0182 44.6472L33.0252 44.6543L34.1662 45.8042C27.5332 45.8003 22.1602 40.4192 22.1642 33.7861C22.1662 30.1433 23.8222 26.6973 26.6662 24.4202C26.9712 24.1753 27.0202 23.7312 26.7752 23.4263C26.5312 23.1223 26.0862 23.0732 25.7822 23.3171V23.3171C22.1092 26.2642 20.2682 30.8103 20.8572 35.4763C21.6922 42.1023 27.2722 47.1062 33.9502 47.2173L33.0292 48.1313C32.7502 48.4043 32.7452 48.8513 33.0182 49.1301C33.2912 49.4092 33.7382 49.4143 34.0172 49.1414L34.0242 49.1343L36.2622 46.9143C36.5392 46.6401 36.5412 46.1921 36.2662 45.9153V45.9153L34.0282 43.6592Z"
                          fill="url(#paint3_linear_19_8)"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M34.734 33.2372C34.633 33.1991 34.539 33.1642 34.458 33.128C34.369 33.088 34.263 33.0482 34.145 33.003C33.476 32.7491 33.113 32.5482 33.113 32.2162C33.113 32.0692 33.27 31.8412 33.569 31.69C33.781 31.5831 34.546 31.2892 35.521 32.0062C35.834 32.2391 36.276 32.1742 36.509 31.8612C36.742 31.5482 36.678 31.106 36.365 30.8731L36.358 30.867C35.919 30.5401 35.415 30.3111 34.879 30.1971V29.557C34.876 29.1671 34.556 28.8541 34.166 28.858C33.781 28.8612 33.47 29.1722 33.466 29.557V30.2301C33.282 30.2782 33.102 30.3451 32.931 30.429C32.172 30.8131 31.7 31.4981 31.7 32.2162C31.7 33.586 33.013 34.0841 33.643 34.3241C33.735 34.358 33.818 34.39 33.888 34.421C33.989 34.4652 34.105 34.5101 34.23 34.5582C34.923 34.8221 35.233 34.9972 35.233 35.3321C35.233 35.4791 35.076 35.7071 34.777 35.858C34.565 35.9652 33.8 36.2591 32.825 35.5421C32.511 35.3111 32.069 35.379 31.838 35.6932C31.606 36.0072 31.674 36.45 31.988 36.681C32.427 37.0091 32.931 37.2391 33.467 37.356V38.035C33.47 38.4251 33.79 38.7391 34.18 38.7352C34.565 38.7311 34.876 38.42 34.88 38.035V37.3211C35.064 37.2721 35.244 37.2042 35.415 37.119C36.174 36.7352 36.646 36.0501 36.646 35.3331C36.646 33.9681 35.402 33.493 34.734 33.2371V33.2372Z"
                          fill="url(#paint4_linear_19_8)"
                        />
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M34.173 26.025C29.881 26.025 26.402 29.504 26.402 33.796C26.402 38.088 29.881 41.567 34.173 41.567C38.4651 41.567 41.944 38.088 41.944 33.796V33.796C41.9391 29.5062 38.4631 26.0302 34.173 26.025ZM34.173 40.1552C30.6611 40.1552 27.8141 37.3082 27.8141 33.796C27.8141 30.285 30.6611 27.4381 34.173 27.4381C37.6841 27.4381 40.5311 30.285 40.5311 33.796C40.527 37.306 37.683 40.15 34.173 40.1552Z"
                          fill="url(#paint5_linear_19_8)"
                        />
                        <defs>
                          <linearGradient
                            id="paint0_linear_19_8"
                            x1="-1.8669"
                            y1="4.83869"
                            x2="53.3798"
                            y2="49.7815"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop offset="0.207929" stop-color="#1a5dad" />
                            <stop offset="0.825238" />
                          </linearGradient>
                          <linearGradient
                            id="paint1_linear_19_8"
                            x1="-121.595"
                            y1="84.7134"
                            x2="-165.202"
                            y2="57.7772"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stop-color="white" />
                            <stop offset="0.505004" stop-color="#F4F4F4" />
                            <stop offset="1" stop-color="#E6E6E6" />
                          </linearGradient>
                          <linearGradient
                            id="paint2_linear_19_8"
                            x1="22.8371"
                            y1="15.5068"
                            x2="51.1416"
                            y2="42.3112"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop offset="0.207929" stop-color="#1a5dad" />
                            <stop offset="0.825238" />
                          </linearGradient>
                          <linearGradient
                            id="paint3_linear_19_8"
                            x1="15.2932"
                            y1="23.4733"
                            x2="43.5976"
                            y2="50.2778"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop offset="0.207929" stop-color="#1a5dad" />
                            <stop offset="0.825238" />
                          </linearGradient>
                          <linearGradient
                            id="paint4_linear_19_8"
                            x1="19.0656"
                            y1="19.4894"
                            x2="47.37"
                            y2="46.294"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop offset="0.207929" stop-color="#1a5dad" />
                            <stop offset="0.825238" />
                          </linearGradient>
                          <linearGradient
                            id="paint5_linear_19_8"
                            x1="19.0644"
                            y1="19.4909"
                            x2="47.3687"
                            y2="46.2953"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop offset="0.207929" stop-color="#1a5dad" />
                            <stop offset="0.825238" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Total Count */}
                <div className="flex items-end px-2 my-6">
                  <p className="text-6xl font-bold text-white">{total}</p>
                  <p className="font-normal text-xl text-white">Total</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 relative">
                  <div className="mt-6 flex justify-between gap-6 items-end text-center col-span-2">
                    <div>
                      <p className="text-green-600 text-lg font-normal">
                        {data.queuetrans_success || 0}
                      </p>
                      <p className="text-gray-300">Success</p>
                    </div>
                    <div>
                      <p className="text-red-500 text-lg font-normal">
                        {data.queuetrans_needsattention || 0}
                      </p>
                      <p className="text-gray-300">Exception</p>
                    </div>
                    <div>
                      <p className="text-blue-400 capitalize">
                        {data.frequency}
                      </p>
                      <p className="text-gray-300">Frequency</p>
                    </div>
                  </div>
                  <div className="mt-4 col-span-1 absolute right-0 bottom-0">
                    <ProgressChart
                      chartId={index}
                      success={data.queuetrans_success}
                      fail={data.queuetrans_needsattention}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
