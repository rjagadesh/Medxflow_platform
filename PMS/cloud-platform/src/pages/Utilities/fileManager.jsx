import React, { useState, useMemo, useRef } from "react";
import {
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Box,
  VStack,
  Text,
} from "@chakra-ui/react";
import { HiUpload } from "react-icons/hi";
import { saveAs } from "file-saver";

// 🔹 Hooks
import { useFileManagerList } from "../../utils/FileManagerList";
import { useFileManagerUpload } from "../../utils/FileManagerUpload";
import { useFileManagerDelete } from "../../utils/FileManagerDelete";
import { useFileManagerDownload } from "../../utils/FileManagerDownload";
import { useFileManagerFolderCreate } from "../../utils/FileManagerFolderCreate";
import UserMenu from "@/components/user-popover/user-popover";
import { BellIcon } from "lucide-react";

// 🔹 Helper: format size
function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function FileManager() {
  const total_size = 0;
  const [currentFolder, setCurrentFolder] = useState("root");
  const [selected, setSelected] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list");
  const [folderHistory, setFolderHistory] = useState("list");
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // 🔹 Hooks
  const { data: items = [], refetch } = useFileManagerList(currentFolder);
  // const { mutateAsync: uploadFiles } = useFileManagerUpload(currentFolder);
  const { mutateAsync: uploadFiles, isPending } =
    useFileManagerUpload(currentFolder);

  const { mutateAsync: deleteFile } = useFileManagerDelete();
  const { mutateAsync: downloadFile } = useFileManagerDownload(currentFolder);
  const { mutateAsync: createFolderApi } =
    useFileManagerFolderCreate(currentFolder);

  // 🔹 Filter and sort
  const children = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter(
      (i) => String(i.parent || "root") === String(currentFolder || "root"),
    );
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q));
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [items, currentFolder, query]);

  // 🔹 Upload files/folders
  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      await uploadFiles({
        files,
        parent: currentFolder,
        onProgress: setProgress,
      });

      await refetch();
    } catch (err) {
      console.error("Upload failed:", err);
    }
    e.target.value = null;
  };

  const goBack = () => {
    setFolderHistory((prev) => {
      if (prev.length === 0) {
        setCurrentFolder("root");
        return [];
      }
      const copy = [...prev];
      const last = copy.pop();
      setCurrentFolder(last);
      return copy;
    });
  };

  // 🔹 Create folder
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolderApi({
        name: newFolderName.trim(),
        parent: currentFolder,
      });
      setNewFolderName("");

      await refetch();
    } catch (err) {
      console.error("Folder creation failed:", err);
    }
  };

  // 🔹 Delete item
  const removeItem = async (id) => {
    try {
      await deleteFile(id);

      await refetch();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // 🔹 Download file(s)
  const downloadSelected = async () => {
    if (selected.length === 0) {
      return;
    }
    try {
      if (selected.length) {
        await downloadFile(selected);
      } else {
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  // 🔹 Navigation
  const goToFolder = (id) => {
    if (id && id !== currentFolder) {
      setFolderHistory((prev) => [...prev, currentFolder]); // push current before navigating
      setCurrentFolder(id);
      setSelected([]);
    }
  };

  // 🔹 Icon renderer
  function IconFor(item) {
    if (item.type === "folder")
      return (
        <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
          📁
        </div>
      );

    const mime = item.mime || "";

    // ✅ Image
    if (mime.startsWith("image/"))
      return (
        <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
          🖼️
        </div>
      );

    // ✅ Video
    if (mime.startsWith("video/"))
      return (
        <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
          🎥
        </div>
      );

    // ✅ Audio
    if (mime.startsWith("audio/"))
      return (
        <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
          🎵
        </div>
      );

    // ✅ PDF
    if (mime === "application/pdf")
      return (
        <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
          🧾
        </div>
      );

    // ✅ Word
    if (
      mime.includes("application/msword") ||
      mime.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )
    )
      return (
        <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
          📝
        </div>
      );

    // ✅ Excel
    if (
      mime.includes("application/vnd.ms-excel") ||
      mime.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
    )
      return (
        <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
          📊
        </div>
      );

    // ✅ Zip / Rar / 7z
    if (
      mime.includes("zip") ||
      mime.includes("x-rar") ||
      mime.includes("x-7z-compressed")
    )
      return <FileArchive size={16} />;

    // ✅ Code files
    if (
      mime.includes("javascript") ||
      mime.includes("json") ||
      mime.includes("html") ||
      mime.includes("css") ||
      mime.includes("python")
    )
      return (
        <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
          💾
        </div>
      );

    // ✅ Default icon
    return (
      <div className="w-14 h-14 bg-white/5 flex items-center justify-center text-2xl">
        📄
      </div>
    );
  }

  const LIMIT = 2 * 1024 * 1024 * 1024; // 12 GB
  const usedPercent = Math.min((total_size / LIMIT) * 100, 100);

  return (
    <>
      <Box className="top-4 py-6 right-4 z-50 flex items-center justify-between w-full gap-4">
        <VStack justify={"space-between"} gap="2" align={"flex-start"}>
          <Text
            color="#fff"
            fontSize={{
              base: "lg",
              "2xl": "22px",
              "3xl": "2xl",
            }}
            letterSpacing={"widest"}
          >
            SmartDrive: DocuSpace
          </Text>
        </VStack>

        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            <UserMenu />
            <BellIcon color="#fff" size={24} />
          </div>
        </div>
      </Box>
      <div className="min-h-screen text-gray-100 text-lg">
        <Box
          bgColor="droidalBlack.300"
          className="mx-auto rounded-2xl p-6 shadow-lg w-full"
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between mb-4 w-full">
            <div className="flex items-center gap-2">
              {/* Hidden file inputs */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileInput}
              />
              <input
                type="file"
                multiple
                webkitdirectory="true"
                directory=""
                ref={folderInputRef}
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="absolute top-6 right-40 flex items-center justify-start">
                {/* ✅ STORAGE BAR */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage Used &nbsp;</span>
                    <span>
                      {formatSize(total_size)} / {formatSize(LIMIT)}
                    </span>
                  </div>

                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-indigo-500 transition-all"
                      style={{ width: `${usedPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              {currentFolder !== "root" && (
                <button
                  onClick={goBack}
                  className="border-l border-white-500 pl-5 absolute top-10 right-15 text-gray-500 hover:text-white hover:text-bold text-lg transition-colors"
                >
                  Back
                </button>
              )}

              {currentFolder === "root" && (
                <button
                  onClick={() => setFileManagerView(false)}
                  className="border-l border-white-500 pl-5 absolute top-10 right-15 text-gray-500 hover:text-white hover:text-bold text-lg transition-colors"
                >
                  Back
                </button>
              )}

              {/* ✅ Upload Popover */}
              <Popover.Root>
                <Popover.Trigger
                  asChild
                  _hover={{ bg: "transparent" }}
                  _focus={{ bg: "transparent" }}
                  _active={{ bg: "transparent" }}
                  _expanded={{ bg: "transparent" }}
                  color={"grey"} // <— FIXES the unwanted background
                >
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-gray-400 hover:text-white transition-all"
                    _hover={{ bg: "transparent" }}
                  >
                    Upload Files / Folder
                  </Button>
                </Popover.Trigger>

                <Portal>
                  <Popover.Positioner>
                    <Popover.Content
                      bg="gray.800"
                      border="none"
                      boxShadow="xl"
                      borderRadius="md"
                      p={2}
                      w="200px"
                    >
                      <Popover.Arrow />
                      <Popover.Body
                        padding="1px"
                        className="flex flex-col space-y-1"
                      >
                        <Button
                          size="lg"
                          variant="ghost"
                          className="text-gray-400 hover:text-white transition-all"
                          color={"grey"}
                          _hover={{ bg: "transparent" }}
                          onClick={() => fileInputRef.current.click()}
                        >
                          📄{" "}
                          {/* <span className="text-lg text-white hover:text-black"> */}
                          Upload Files
                          {/* </span> */}
                        </Button>

                        <Button
                          size="lg"
                          variant="ghost"
                          className="text-gray-400 hover:text-white transition-all"
                          color={"grey"}
                          _hover={{ bg: "transparent" }}
                          onClick={() => folderInputRef.current.click()}
                        >
                          📁{" "}
                          {/* <span className="text-lg text-white hover:text-black"> */}
                          Upload Folder
                          {/* </span> */}
                        </Button>
                      </Popover.Body>
                    </Popover.Content>
                  </Popover.Positioner>
                </Portal>
              </Popover.Root>
              {/* ✅ New Folder Popover */}
              <Popover.Root>
                <Popover.Trigger
                  _hover={{ bg: "transparent" }}
                  _focus={{ bg: "transparent" }}
                  _active={{ bg: "transparent" }}
                  _expanded={{ bg: "transparent" }}
                  asChild
                >
                  <Button
                    size="lg"
                    variant="ghost"
                    className="border-l border-white-500 pl-5 text-gray-400 hover:text-white transition-all"
                    color={"grey"}
                    _hover={{ bg: "transparent" }}
                  >
                    New Folder
                  </Button>
                </Popover.Trigger>

                <Portal>
                  <Popover.Positioner>
                    <Popover.Content
                      bg="gray.800"
                      border="none"
                      boxShadow="lg"
                      borderRadius="md"
                      p={4}
                      w="250px"
                    >
                      <Popover.Arrow />
                      <Popover.Body padding="1px">
                        <Input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Folder name"
                          mb={3}
                          bgColor={"droidalBlack"}
                          _hover={{
                            bgColor: "droidalBlack.200",
                          }}
                          color="white"
                          _placeholder={{ color: "gray.400" }}
                        />
                        <Button
                          size="lg"
                          variant="ghost"
                          className="text-gray-400 hover:text-white transition-all"
                          color={"grey"}
                          onClick={createFolder}
                          _hover={{ bg: "transparent" }}
                        >
                          Create
                        </Button>
                      </Popover.Body>
                    </Popover.Content>
                  </Popover.Positioner>
                </Portal>
              </Popover.Root>
            </div>

            {/* Right Toolbar */}
            <div className="flex items-center gap-2">
              <Button
                size="lg"
                variant="ghost"
                className="text-gray-400 hover:text-white transition-all"
                color={"grey"}
                _hover={{ bg: "transparent" }}
                onClick={downloadSelected}
              >
                Download
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-gray-400 hover:text-white transition-all"
                color={"grey"}
                _hover={{ bg: "transparent" }}
                onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
              >
                {view === "grid" ? "List" : "Grid"}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <Input
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            mb={4}
            bg="gray.700"
            color="white"
            _placeholder={{ color: "gray.400" }}
          />

          {/* MAIN VIEW */}
          <main>
            {children.length === 0 ? (
              <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-lg">
                This folder is empty
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-4 text-lg gap-4">
                {children.map((item) => (
                  <div
                    key={item.id}
                    className={`relative p-3 rounded-lg bg-white/3 text-lg hover:bg-white/5 cursor-pointer ${
                      selected.includes(item.id) ? "ring-2 ring-indigo-500" : ""
                    }`}
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((id) => id !== item.id)
                          : [...prev, item.id],
                      )
                    }
                    onDoubleClick={() => {
                      if (item.type === "folder") goToFolder(item.id);
                    }}
                  >
                    {/* ✅ delete button on top-right */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="absolute bottom-4 right-1 text-xs px-2 py-1 rounded-md bg-black hover:bg-gray-700 transition"
                    >
                      🗑️
                    </button>
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, item.id]
                            : prev.filter((id) => id !== item.id),
                        );
                      }}
                      className="absolute top-2 right-2 w-4 h-4 z-20 cursor-pointer accent-indigo-500 bg-white border border-gray-400 rounded"
                    />

                    {IconFor(item)}
                    <div className="mt-2 truncate text-sm">{item.name}</div>
                    <div className="text-xs opacity-70">{item.type}</div>
                    <div className="text-xs opacity-60 mt-1">
                      Size: {formatSize(item.size)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-lg text-sm">
                <div className="grid grid-cols-12 gap-2 opacity-70 border-b text-lg border-white/10 pb-2 text-gray-300">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Modified</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
                {children.map((item) => (
                  <div
                    key={item.id}
                    className={`relative group grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all ${
                      selected.includes(item.id)
                        ? "bg-white/10 shadow-inner"
                        : "hover:bg-white/5"
                    }`}
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((id) => id !== item.id)
                          : [...prev, item.id],
                      )
                    }
                    onDoubleClick={() => {
                      if (item.type === "folder") goToFolder(item.id);
                    }}
                  >
                    {/* ✅ CHECKBOX COLUMN */}

                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, item.id]
                            : prev.filter((id) => id !== item.id),
                        );
                      }}
                      className={`absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 accent-indigo-500 cursor-pointer transition
  ${selected.length > 0 ? "opacity-100" : "opacity-0 "}
`}
                    />

                    <div className="col-span-5 flex items-center gap-3 pl-6">
                      {IconFor(item)}
                      <div className="text-gray-100">{item.name}</div>
                    </div>

                    <div className="col-span-2 text-gray-300">{item.type}</div>

                    <div className="col-span-2 text-gray-300">
                      {formatSize(item.size)}
                    </div>

                    <div className="col-span-2 text-gray-400">
                      {item.modified
                        ? new Date(item.modified).toLocaleString()
                        : "-"}
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <Button
                        size="xs"
                        colorScheme="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </Box>
      </div>
    </>
  );
}
