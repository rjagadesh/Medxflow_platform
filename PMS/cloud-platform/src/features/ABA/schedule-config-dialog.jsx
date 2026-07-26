const ScheduleConfigDialog = () => {
    return (  );
}

export default ScheduleConfigDialog;

 <div
                    id="cronDialog"
                    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50"
                  >
                    <div
                      class="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-y-auto"
                    >
                      <div
                        class="flex items-center justify-between px-6 py-4 border-b border-gray-200"
                      >
                        <h3 class="text-lg font-medium text-gray-900">
                          Schedule Configuration
                        </h3>
                        <button
                          type="button"
                          class="text-gray-400 hover:text-gray-500"
                          id="closeCronDialog"
                        >
                          <div class="w-5 h-5 flex items-center justify-center">
                            <i class="ri-close-line"></i>
                          </div>
                        </button>
                      </div>

                      <div class="p-6">
                        <div class="mb-6">
                          <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                            >Timezone</label
                          >
                          <select
                            id="timezone"
                            className="w-full px-4 py-3 bg-droidal-black-200 border border-gray-700 text-sm text-white !rounded-button focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="UTC" className="bg-droidal-black-200 text-white">
                              UTC
                            </option>
                            <option value="America/New_York" className="bg-droidal-black-200 text-white">
                              America/New_York
                            </option>
                            <option value="Europe/London" className="bg-droidal-black-200 text-white">
                              Europe/London
                            </option>
                            <option value="Asia/Tokyo" className="bg-droidal-black-200 text-white">
                              Asia/Tokyo
                            </option>
                          </select>
                        </div>

                        <div class="mb-6">
                          <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                            >Schedule Type</label
                          >
                          <div class="space-y-4">
                            <label class="flex items-center">
                              <input
                                type="radio"
                                name="scheduleType"
                                value="daily"
                                class="sr-only"
                                checked
                              />
                              <div
                                class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center schedule-radio"
                              >
                                <div
                                  class="w-2.5 h-2.5 bg-primary rounded-full hidden schedule-dot"
                                ></div>
                              </div>
                              <span class="ml-3 text-sm text-gray-700"
                                >Daily</span
                              >
                            </label>

                            <label class="flex items-center">
                              <input
                                type="radio"
                                name="scheduleType"
                                value="weekly"
                                class="sr-only"
                              />
                              <div
                                class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center schedule-radio"
                              >
                                <div
                                  class="w-2.5 h-2.5 bg-primary rounded-full hidden schedule-dot"
                                ></div>
                              </div>
                              <span class="ml-3 text-sm text-gray-700"
                                >Weekly</span
                              >
                            </label>
                          </div>
                        </div>

                        <div id="dailyOptions" class="mb-6">
                          <div class="space-y-4">
                            <label class="flex items-center">
                              <input
                                type="radio"
                                name="dailyType"
                                value="once"
                                class="sr-only"
                                checked
                              />
                              <div
                                class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center daily-radio"
                              >
                                <div
                                  class="w-2.5 h-2.5 bg-primary rounded-full hidden daily-dot"
                                ></div>
                              </div>
                              <span class="ml-3 text-sm text-gray-700"
                                >Run once at this time:</span
                              >
                            </label>

                            <div class="ml-8">
                              <input
                                type="time"
                                class="px-4 py-2 border border-gray-300 !rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                id="dailyTime"
                              />
                            </div>

                            <label class="flex items-center">
                              <input
                                type="radio"
                                name="dailyType"
                                value="interval"
                                class="sr-only"
                              />
                              <div
                                class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center daily-radio"
                              >
                                <div
                                  class="w-2.5 h-2.5 bg-primary rounded-full hidden daily-dot"
                                ></div>
                              </div>
                              <span class="ml-3 text-sm text-gray-700"
                                >Run at intervals</span
                              >
                            </label>
                          </div>
                        </div>

                        <div id="weeklyOptions" class="mb-6 hidden">
                          <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                            >Select Days</label
                          >
                          <div class="flex flex-wrap gap-2">
                            <label class="flex items-center">
                              <input
                                type="checkbox"
                                name="weekday"
                                value="0"
                                class="sr-only"
                              />
                              <div
                                class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn"
                              >
                                Sun
                              </div>
                            </label>
                            <label class="flex items-center">
                              <input
                                type="checkbox"
                                name="weekday"
                                value="1"
                                class="sr-only"
                              />
                              <div
                                class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn"
                              >
                                Mon
                              </div>
                            </label>
                            <label class="flex items-center">
                              <input
                                type="checkbox"
                                name="weekday"
                                value="2"
                                class="sr-only"
                              />
                              <div
                                class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn"
                              >
                                Tue
                              </div>
                            </label>
                            <label class="flex items-center">
                              <input
                                type="checkbox"
                                name="weekday"
                                value="3"
                                class="sr-only"
                              />
                              <div
                                class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn"
                              >
                                Wed
                              </div>
                            </label>
                            <label class="flex items-center">
                              <input
                                type="checkbox"
                                name="weekday"
                                value="4"
                                class="sr-only"
                              />
                              <div
                                class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn"
                              >
                                Thu
                              </div>
                            </label>
                            <label class="flex items-center">
                              <input
                                type="checkbox"
                                name="weekday"
                                value="5"
                                class="sr-only"
                              />
                              <div
                                class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn"
                              >
                                Fri
                              </div>
                            </label>
                            <label class="flex items-center">
                              <input
                                type="checkbox"
                                name="weekday"
                                value="6"
                                class="sr-only"
                              />
                              <div
                                class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn"
                              >
                                Sat
                              </div>
                            </label>
                          </div>
                          <div class="mt-4">
                            <label
                              class="block text-sm font-medium text-gray-700 mb-2"
                              >Time</label
                            >
                            <input
                              type="time"
                              class="px-4 py-2 border border-gray-300 !rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              id="weeklyTime"
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        class="px-6 py-4 bg-gray-50 flex justify-end space-x-4 rounded-b-lg"
                      >
                        <button
                          type="button"
                          class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium !rounded-button hover:bg-gray-50 whitespace-nowrap"
                          id="cancelCron"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          class="px-4 py-2 bg-primary text-white text-sm font-medium !rounded-button hover:bg-blue-600 whitespace-nowrap"
                          id="applyCron"
                        >
                          Apply Schedule
                        </button>
                      </div>
                    </div>
                  </div>
 