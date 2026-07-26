import { Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const TriggerForm = () => {
  const navigate = useNavigate();
  return (
    <div class="bg-gray-50 min-h-screen">
      <main class="flex-1 p-6">
        <div class="max-w-2xl mx-auto">
          <div class="mb-8">
            <h1 class="text-2xl font-semibold text-gray-900 mb-2">
              Create Trigger
            </h1>
            <p class="text-sm text-gray-600">
              Configure a new trigger for your data pipeline automation
            </p>
          </div>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form id="createTriggerForm">
              <div class="mb-6">
                <label
                  for="triggerName"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Trigger Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="triggerName"
                  name="triggerName"
                  class="w-full px-4 py-3 border border-gray-300 !rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter trigger name"
                  required
                />
                <div
                  class="text-red-500 text-xs mt-1 hidden"
                  id="triggerNameError"
                >
                  Trigger name is required
                </div>
              </div>
              <div class="mb-6">
                <label
                  for="description"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  class="w-full px-4 py-3 border border-gray-300 !rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Enter trigger description"
                ></textarea>
              </div>
              <div class="mb-6">
                <label
                  for="machine"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Machine <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <button
                    type="button"
                    class="w-full px-4 py-3 bg-white border border-gray-300 !rounded-button text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between"
                    id="machineDropdown"
                  >
                    <span class="text-gray-500" id="machineSelected">
                      Select a machine
                    </span>
                    <div class="w-4 h-4 flex items-center justify-center">
                      <i class="ri-arrow-down-s-line text-sm text-gray-400"></i>
                    </div>
                  </button>
                  <div
                    class="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 hidden"
                    id="machineMenu"
                  >
                    <button
                      type="button"
                      class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                      data-value="prod-server-01"
                    >
                      prod-server-01
                    </button>
                    <button
                      type="button"
                      class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                      data-value="prod-server-02"
                    >
                      prod-server-02
                    </button>
                    <button
                      type="button"
                      class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                      data-value="backup-server-01"
                    >
                      backup-server-01
                    </button>
                    <button
                      type="button"
                      class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                      data-value="mail-server-01"
                    >
                      mail-server-01
                    </button>
                    <button
                      type="button"
                      class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                      data-value="analytics-server-01"
                    >
                      analytics-server-01
                    </button>
                  </div>
                </div>
                <input
                  type="hidden"
                  id="machineValue"
                  name="machine"
                  required
                />
                <div class="text-red-500 text-xs mt-1 hidden" id="machineError">
                  Please select a machine
                </div>
              </div>
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Scaling Mode <span class="text-red-500">*</span>
                </label>
                <div class="flex space-x-6">
                  <label class="flex items-center cursor-pointer">
                    <div class="relative">
                      <input
                        type="radio"
                        name="scalingMode"
                        value="auto"
                        class="sr-only"
                        checked
                      />
                      <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center radio-custom">
                        <div class="w-2.5 h-2.5 bg-primary rounded-full hidden radio-dot"></div>
                      </div>
                    </div>
                    <span class="mx-3 text-sm text-gray-700">Auto</span>
                  </label>
                  <label class="flex items-center cursor-pointer">
                    <div class="relative">
                      <input
                        type="radio"
                        name="scalingMode"
                        value="manual"
                        class="sr-only"
                      />
                      <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center radio-custom">
                        <div class="w-2.5 h-2.5 bg-primary rounded-full hidden radio-dot"></div>
                      </div>
                    </div>
                    <span class="ml-3 text-sm text-gray-700">Manual</span>
                  </label>
                </div>
              </div>
              <div class="mb-6">
                <label
                  for="cronExpression"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Cron Expression <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="cronExpression"
                    name="cronExpression"
                    class="w-full px-4 py-3 pr-10 border border-gray-300 !rounded-button text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                    placeholder="0 2 * * *"
                    readonly
                    required
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <div class="w-4 h-4 flex items-center justify-center">
                      <i class="ri-calendar-line"></i>
                    </div>
                  </button>
                </div>

                <div
                  id="cronDialog"
                  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50"
                >
                  <div class="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
                    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                          Timezone1
                        </label>
                        <select
                          class="w-full px-4 py-3 border border-gray-300 !rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          id="timezone"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">
                            America/New_York
                          </option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="Asia/Tokyo">Asia/Tokyo</option>
                        </select>
                      </div>

                      <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                          Schedule Type
                        </label>
                        <div class="space-y-4">
                          <label class="flex items-center">
                            <input
                              type="radio"
                              name="scheduleType"
                              value="daily"
                              class="sr-only"
                              checked
                            />
                            <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center schedule-radio">
                              <div class="w-2.5 h-2.5 bg-primary rounded-full hidden schedule-dot"></div>
                            </div>
                            <span class="ml-3 text-sm text-gray-700">
                              Daily
                            </span>
                          </label>

                          <label class="flex items-center">
                            <input
                              type="radio"
                              name="scheduleType"
                              value="weekly"
                              class="sr-only"
                            />
                            <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center schedule-radio">
                              <div class="w-2.5 h-2.5 bg-primary rounded-full hidden schedule-dot"></div>
                            </div>
                            <span class="ml-3 text-sm text-gray-700">
                              Weekly
                            </span>
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
                            <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center daily-radio">
                              <div class="w-2.5 h-2.5 bg-primary rounded-full hidden daily-dot"></div>
                            </div>
                            <span class="ml-3 text-sm text-gray-700">
                              Run once at this time:
                            </span>
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
                            <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center daily-radio">
                              <div class="w-2.5 h-2.5 bg-primary rounded-full hidden daily-dot"></div>
                            </div>
                            <span class="ml-3 text-sm text-gray-700">
                              Run at intervals
                            </span>
                          </label>
                        </div>
                      </div>

                      <div id="weeklyOptions" class="mb-6 hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                          Select Days
                        </label>
                        <div class="flex flex-wrap gap-2">
                          <label class="flex items-center">
                            <input
                              type="checkbox"
                              name="weekday"
                              value="0"
                              class="sr-only"
                            />
                            <div class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn">
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
                            <div class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn">
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
                            <div class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn">
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
                            <div class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn">
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
                            <div class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn">
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
                            <div class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn">
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
                            <div class="px-4 py-2 border border-gray-300 !rounded-button text-sm cursor-pointer weekday-btn">
                              Sat
                            </div>
                          </label>
                        </div>
                        <div class="mt-4">
                          <label class="block text-sm font-medium text-gray-700 mb-2">
                            Time
                          </label>
                          <input
                            type="time"
                            class="px-4 py-2 border border-gray-300 !rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            id="weeklyTime"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-4 rounded-b-lg">
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
                <div class="text-xs text-gray-500 mt-1">
                  Format: minute hour day month weekday (e.g., 0 2 * * * runs
                  daily at 2:00 AM)
                </div>
                <div class="text-red-500 text-xs mt-1 hidden" id="cronError">
                  Please enter a valid cron expression
                </div>
              </div>
              <div class="mb-8">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Status
                </label>
                <div class="flex items-center">
                  <button
                    type="button"
                    class="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    id="statusToggle"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"
                      id="statusSlider"
                    ></span>
                  </button>
                  <span class="ml-3 text-sm text-gray-700" id="statusLabel">
                    Active
                  </span>
                  <input
                    type="hidden"
                    id="statusValue"
                    name="status"
                    value="active"
                  />
                </div>
              </div>
              <div class="flex items-center justify-end gap-4">
                <Button
                  onClick={() => navigate("/aba/hub/trigger")}
                  variant="outline"
                  colorScheme="gray"
                >
                  Cancel
                </Button>
                <Button
                  bg="secondary.400"
                  color="white"
                  _hover={{
                    bg: "secondary.300",
                  }}
                  type="submit"
                >
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TriggerForm;
