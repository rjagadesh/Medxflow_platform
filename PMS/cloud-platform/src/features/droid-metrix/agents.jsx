import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/store/providers/auth-provider";
import { Button, Switch } from "@chakra-ui/react";
import { useEffect } from "react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

const AIAgents = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const { user } = useAuth();

  const agentForm = useForm({
    defaultValues: {
      label_name: "",
      lqueue_task_id: "",
      ownerMail: "owner1@example.com",
      display_on_dashboard: true,
      frequency: "Daily",
      departmentId: "",
    },
  });

  const getAiAgentsDetails = async () => {
    try {
      const response = await fetch(
        `https://dev-cloud.droidal.com/roi/admin_agent_details/?client_email=${user?.mail}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Basic cXYwZmptNThmOTpibmQ4cmthbnNt",
          },
        }
      );
      const data = await response.json();
      setAgents(data.logs);
      setDepartments(data.departments);
      console.log(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("agents", agents);

  const handleExpandClick = (agent) => {
    if (expandedAgent === agent.label_id) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agent.label_id);
      agentForm.reset({
        label_name: agent.label_name,
        lqueue_task_id: agent.lqueue_task_id,
        display_on_dashboard: agent.display_on_dashboard,
        frequency: agent.frequency,
        departmentId: agent.departmentId,
      });
    }
  };

  const saveLabel = async (payload) => {
    try {
      const response = await fetch(
        "https://dev-cloud.droidal.com/roi/save-queue-label/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Basic cXYwZmptNThmOTpibmQ4cmthbnNt",
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        toaster.success({
          title: "Success",
          description: "Label saved successfully",
        });
      } else if (data.status === "error") {
        toaster.error({
          title: "Error",
          description: data.message,
        });
      }
      console.log(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toaster.error({
        title: "Error",
        description: error.message || "Error saving label",
      });
    } finally {
      setLoading(false);
    }
  };

  const onAgentSubmit = (data, queue_name, label_id) => {
    console.log("Updating AI Agent:", data);
    saveLabel({ ...data, label_id, queue_name });
  };

  useEffect(() => {
    getAiAgentsDetails();
  }, []);

  return (
    <div>
      <div className="space-y-6">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 pb-4 border-b font-medium text-gray-700">
          <div className="col-span-1">S.No</div>
          <div className="col-span-11">AI Agent Settings</div>
        </div>

        {/* Expandable Row */}
        <div className="border rounded-lg">
          <>
            {loading && (
              <div className="w-full h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                </div>
              </div>
            )}
            {!loading &&
              agents.map((agent, index) => {
                return (
                  <div
                    className={`overflow-hidden transition-[max-height] duration-500 ${
                      expandedAgent === agent.label_id
                        ? "max-h-[1000px]"
                        : "max-h-auto"
                    }`}
                  >
                    <div
                      className="grid grid-cols-12 gap-4 p-4 cursor-pointer hover:bg-droidal-black-200 bg-droidal-black-300"
                      onClick={() => handleExpandClick(agent)}
                    >
                      <div className="col-span-1 text-white font-medium">
                        {index + 1}
                      </div>
                      <div className="col-span-10 text-white font-medium">
                        {agent.label_name}{" "}
                        <span>
                          {" "}
                          {agent.department_name &&
                            `(${agent.department_name})`}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <svg
                          className={`w-5 h-5 transition-transform ${
                            expandedAgent === 1 ? "rotate-180" : ""
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    {expandedAgent === agent.label_id && (
                      <div className="border-t bg-white p-6">
                        <form
                          onSubmit={agentForm.handleSubmit((data) =>
                            onAgentSubmit(
                              data,
                              agent.queuetrans_queue_name,
                              agent.label_id
                            )
                          )}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                AI Agent Name
                              </label>
                              <Controller
                                name="label_name"
                                control={agentForm.control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="text"
                                    className="w-full bg-gray-100 border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                AI Agent Task ID
                              </label>
                              <Controller
                                name="lqueue_task_id"
                                control={agentForm.control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="text"
                                    className="w-full bg-gray-100 border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                AI Agent Owner Mail
                              </label>
                              <Controller
                                name="ownerMail"
                                control={agentForm.control}
                                render={() => (
                                  <input
                                    defaultValue={"owner1@example.com"}
                                    type="email"
                                    className="w-full bg-gray-100 border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Department
                              </label>
                              <Controller
                                name="departmentId"
                                control={agentForm.control}
                                render={({ field }) => (
                                  <select
                                    {...field}
                                    className="w-full bg-gray-100 border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                  >
                                    <option value="">
                                      ---Select The Department---
                                    </option>
                                    {departments.map((department) => (
                                      <option
                                        key={department.department_id}
                                        value={department.department_id}
                                      >
                                        {department.department_name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              />
                            </div>

                            {/* <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Automation Process
                          </label>
                          <Controller
                            name="automationProcess"
                            control={agentForm.control}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="w-full bg-gray-100 border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                              >
                                <option value="">
                                  ---Select The Process---
                                </option>
                                <option value="letter-automation">
                                  Letter Automation
                                </option>
                                <option value="invoice-processing">
                                  Invoice Processing
                                </option>
                                <option value="data-entry">Data Entry</option>
                              </select>
                            )}
                          />
                        </div> */}

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Frequency
                              </label>
                              <Controller
                                name="frequency"
                                control={agentForm.control}
                                render={({ field }) => (
                                  <select
                                    {...field}
                                    className="w-full bg-gray-100 border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                                  >
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                  </select>
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <label className="text-sm font-medium mr-4 text-gray-700">
                                Display On Dashboard
                              </label>
                              <Controller
                                name="display_on_dashboard"
                                control={agentForm.control}
                                render={({ field }) => (
                                  <Switch.Root
                                    checked={field.value}
                                    onCheckedChange={({ checked }) => {
                                      field.onChange(checked);
                                    }}
                                  >
                                    <Switch.HiddenInput />
                                    <Switch.Control />
                                    <Switch.Label />
                                  </Switch.Root>
                                )}
                              />
                            </div>

                            <button
                              type="submit"
                              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                            >
                              Update
                            </button>
                          </div>
                          <Button type="submit">Save</Button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
          </>
        </div>
      </div>
    </div>
  );
};

export default AIAgents;
