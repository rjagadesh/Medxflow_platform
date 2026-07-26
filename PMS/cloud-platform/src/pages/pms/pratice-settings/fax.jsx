import React, { useState } from "react";
import { Mail, Printer, FileText, Send, Clock, CheckCircle, Upload, Search, Filter, MoreVertical, Download, Eye, Trash2 } from "lucide-react";

const Fax = () => {
  const [activeTab, setActiveTab] = useState("send");

  const recentFaxes = [
    { id: 1, recipient: "John Anderson", number: "+1 (555) 123-4567", subject: "Contract Agreement", pages: 3, status: "Delivered", time: "10:30 AM", date: "Today" },
    { id: 2, recipient: "Sarah Williams", number: "+1 (555) 987-6543", subject: "Invoice #2024-001", pages: 2, status: "Delivered", time: "09:15 AM", date: "Today" },
    { id: 3, recipient: "Michael Chen", number: "+1 (555) 456-7890", subject: "Project Proposal", pages: 5, status: "Pending", time: "Yesterday", date: "Jan 8" },
    { id: 4, recipient: "Emma Davis", number: "+1 (555) 321-0987", subject: "Legal Documents", pages: 8, status: "Delivered", time: "2 days ago", date: "Jan 7" },
    { id: 5, recipient: "Robert Taylor", number: "+1 (555) 654-3210", subject: "Medical Report", pages: 4, status: "Failed", time: "3 days ago", date: "Jan 6" },
  ];

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Compact Header */}
      <div className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8  rounded-lg flex items-center justify-center">
                <Printer size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-semibold text-white">Fax Manager</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-sm text-gray-400 hover:bg-neutral-700 rounded-lg transition-colors">
                Settings
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center">
                <Send size={16} className="mr-2" />
                Send Fax
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Sent</p>
                <p className="text-2xl font-semibold text-white mt-1">1,247</p>
              </div>
              <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center">
                <Send size={20} className="text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#1f2332] rounded-lg border border-[#2a2f3f] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Delivered</p>
                <p className="text-2xl font-semibold text-white mt-1">1,189</p>
              </div>
              <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#1f2332] rounded-lg border border-[#2a2f3f] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-semibold text-white mt-1">34</p>
              </div>
              <div className="w-10 h-10 bg-amber-600/10 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-[#1f2332] rounded-lg border border-[#2a2f3f] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">This Month</p>
                <p className="text-2xl font-semibold text-white mt-1">156</p>
              </div>
              <div className="w-10 h-10 bg-purple-600/10 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Send Fax Form */}
          <div className="col-span-1 bg-neutral-800 rounded-lg border border-neutral-700 p-5">
            <h2 className="text-base font-semibold text-white mb-4">Send New Fax</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="Enter name"
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Fax Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-sm bg-[#1a1d29] border border-[#2a2f3f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Document subject"
                  className="w-full px-3 py-2 text-sm bg-[#1a1d29] border border-[#2a2f3f] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Document
                </label>
                <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-neutral-600 transition-colors cursor-pointer">
                  <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                  <p className="text-xs text-gray-300 mb-0.5">Upload document</p>
                  <p className="text-xs text-gray-500">PDF, DOC up to 10MB</p>
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center">
                <Send className="mr-2" size={16} />
                Send Fax
              </button>
            </div>
          </div>

          {/* Fax History Table */}
          <div className="col-span-2 bg-neutral-800 rounded-lg border border-neutral-700">
            <div className="px-5 py-4 border-b border-neutral-700">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Recent Faxes</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-9 pr-3 py-1.5 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                    />
                  </div>
                  <button className="p-1.5 hover:bg-neutral-700 rounded-lg transition-colors">
                    <Filter size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Pages
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700">
                  {recentFaxes.map((fax) => (
                    <tr key={fax.id} className="hover:bg-neutral-750 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{fax.recipient}</p>
                          <p className="text-xs text-gray-400">{fax.number}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-300">{fax.subject}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-300">{fax.pages}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          fax.status === 'Delivered' ? 'bg-green-600/20 text-green-400' :
                          fax.status === 'Pending' ? 'bg-amber-600/20 text-amber-400' :
                          'bg-red-600/20 text-red-400'
                        }`}>
                          {fax.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm text-white">{fax.date}</p>
                          <p className="text-xs text-gray-400">{fax.time}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end space-x-1">
                          <button className="p-1.5 hover:bg-neutral-700 rounded transition-colors" title="View">
                            <Eye size={16} className="text-gray-400" />
                          </button>
                          <button className="p-1.5 hover:bg-[#2a2f3f] rounded transition-colors" title="Download">
                            <Download size={16} className="text-gray-400" />
                          </button>
                          <button className="p-1.5 hover:bg-[#2a2f3f] rounded transition-colors" title="Delete">
                            <Trash2 size={16} className="text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-neutral-700 flex items-center justify-between">
              <p className="text-sm text-gray-400">Showing 5 of 1,247 faxes</p>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 text-sm text-gray-300 bg-neutral-900 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors">
                  Previous
                </button>
                <button className="px-3 py-1.5 text-sm text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fax;