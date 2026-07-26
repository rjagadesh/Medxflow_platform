import { Button, FileUpload } from "@chakra-ui/react";
import { useState, useRef } from "react";
import { HiUpload } from "react-icons/hi";
import { RiEditLine } from "react-icons/ri";

const getStatusColor = (status) => {
  switch (status) {
    case "Executed":
      return "text-green-600 bg-green-50";
    case "In-Progress":
      return "text-blue-600 bg-blue-50";
    case "Failed":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "text-red-600 bg-red-50";
    case "Medium":
      return "text-yellow-600 bg-yellow-50";
    case "Low":
      return "text-green-600 bg-green-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const Row = ({
  id,
  name,
  version,
  priority,
  executionType,
  compatibility,
  entryPoint,
  description,
  labels,
  status,
}) => (
  <tr>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
      {id ? id : "N/A"}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
      {name}
    </td>
    <td className="px-6 py-4 text-sm text-white">{version}</td>
    <td className="px-6 py-4 text-sm text-white">{priority}</td>
    <td className="px-6 py-4 text-sm text-white">{executionType}</td>
    <td className="px-6 py-4 text-sm text-white">{compatibility}</td>
    <td className="px-6 py-4 text-sm text-white">{entryPoint}</td>
    <td className="px-6 py-4 text-sm text-white">{description}</td>
    <td className="px-6 py-4 text-sm text-white">{labels}</td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
          status
        )}`}
      >
        {status}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
  </tr>
);

export default function FileUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([
    {
      id: "1",
      name: "File 1",
      version: "1.0.0",
      priority: "High",
      executionType: "Executed",
      compatibility: "",
      entryPoint: "",
      description: "File Upload",
      labels: "Label 1",
      status: "Executed",
    },
    {
      id: "2",
      name: "File 2",
      version: "1.0.0",
      priority: "Low",
      executionType: "In-Progress",
      compatibility: "",
      entryPoint: "",
      description: "File Upload",
      labels: "Label 2",
      status: "In-Progress",
    },
    {
      id: "3",
      name: "File 3",
      version: "1.0.0",
      priority: "Medium",
      executionType: "Failed",
      compatibility: "",
      entryPoint: "",
      description: "File Upload",
      labels: "Label 3",
      status: "Failed",
    },
  ]);

  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const newFile = {
        id: (files.length + 1).toString(),
        name: selectedFile.name.replace(/\.[^/.]+$/, ""),
        version: "1.0.0",
        priority: "Medium",
        executionType: "In-Progress",
        compatibility: "",
        entryPoint: "",
        description: "File Upload",
        labels: `Label ${files.length + 1}`,
        status: "In-Progress",
      };

      setFiles([...files, newFile]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-droidal-black-300 rounded-2xl p-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-2">File Upload</h2>
        <p className="text-gray-600 text-md">
          Upload and manage your automation files
        </p>
      </div>
      <FileUpload.Root mb={4} accept={["image/png"]}>
        <FileUpload.HiddenInput />
        <FileUpload.Trigger asChild>
          <Button variant="subtle" size="sm">
            <HiUpload /> Upload file
          </Button>
        </FileUpload.Trigger>
        <FileUpload.List />
      </FileUpload.Root>

      <div className="overflow-x-auto">
        <div className="!bg-droidal-black-300 rounded-lg shadow-sm border border-gray-500 overflow-hidden">
          <table className="w-full">
            <thead className="bg-droidal-black-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Execution Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compatibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Labels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-droidal-black-300 divide-y text-white divide-gray-200">
              {files.map((row, idx) => (
                <Row key={idx} {...row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <div>Showing {files.length} files</div>
        <div className="flex items-center gap-2">
          <span>Files per page:</span>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm pr-8 cursor-pointer">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}
