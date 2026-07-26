import React, { useRef, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,

  PopoverBody,
} from "@chakra-ui/react";

const CreateNewFolder = () => {
  const fileInputRef = useRef(null);
  const [newFolderName, setNewFolderName] = useState("");

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    console.log("Uploaded files:", files);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return alert("Enter folder name");
    console.log("Creating folder:", newFolderName);
    setNewFolderName("");
  };

  return (
    <div className="mt-5">
      <div className="flex gap-2">
        {/* File Upload */}
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileInput}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500"
        >
          Upload
        </button>

        {/* New Folder Popover */}
        <Popover>
          <PopoverTrigger>
            <button className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10">
              New Folder
            </button>
          </PopoverTrigger>

          <PopoverContent bg="black" borderColor="gray.700" p={3}>
            <PopoverArrow />
            <PopoverBody>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full p-2 rounded-md bg-white/10 text-white placeholder-gray-400"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={createFolder}
                  className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default CreateNewFolder;
