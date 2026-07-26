import App from "@/App";
import FileManager from "@/pages/Utilities/fileManager";
import { Box, Text, HStack } from "@chakra-ui/react";
import {
  Clapperboard,
  Code,
  FileArchive,
  FileImage,
  FileMusic,
  FileSpreadsheet,
  FolderClosed,
  StickyNote,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import MinutesOfMeetingIcon from "@/assets/icons/minutes-of-meeting.svg?react";
import { useGetSmartDriveList } from "@/hooks/query/smart-drive/useGetSmartDriveList";
import { useMemo } from "react";

const AppCard = ({ name, url, total = 0, types = [] }) => {
  const navigate = useNavigate();
  const isActive = (category) =>
    types.some((i) => i.lowerCase().includes(category.toLowerCase()));
  return (
    <Box
      asChild
      className={
        "relative transition-all px-[2px] pt-[2px] duration-500 ease-in-out rounded-md 2xl:rounded-[16px]"
      }
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: "inherit",
        padding: "1.5px",
        background: "linear-gradient(90deg, transparent, transparent)",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "xor",
        transition: "background 0.3s ease",
      }}
    >
      <Box
        onClick={() => {
          navigate(url);
        }}
      >
        <Box
          height={{
            base: "140px",
            "2xl": "160px",
            "3xl": "180px",
          }}
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "inherit",
            padding: "1.5px",
            background: "linear-gradient(90deg, transparent, transparent)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            transition: "background 0.3s ease",
          }}
          _hover={{
            _before: {
              background: "linear-gradient(180deg, #5A9310, #94F219)",
            },
          }}
          className="bg-[#292929] rounded-2xl p-4 py-4 2xl:py-6 shadow-sm hover:shadow-md cursor-pointer group relative overflow-hidden transition-all duration-500 ease-in-out"
        >
          <div className="relative flex">
            <Text
              as={"h3"}
              fontSize={{
                base: "2xl",
              }}
              letterSpacing={"widest"}
              className={`font-semibold text-[#575757] mb-2`}
            >
              {name}
            </Text>
            <FolderClosed
              color="white"
              size="40px"
              className="absolute right-2"
            />
            {/* <p className="text-gray-600 text-sm">{description}</p> */}
          </div>
          <HStack className="absolute w-full left-4 flex gap-3 items-center bottom-5">
            <div className="flex gap-1 text-sm mb-3">
              <StickyNote
                size={16}
                className={
                  isActive("Documents") ? "text-white" : "text-gray-500"
                }
              />
              <FileSpreadsheet
                size={16}
                className={
                  isActive("Spreadsheets") ? "text-white" : "text-gray-500"
                }
              />
              <FileImage
                size={16}
                className={isActive("Images") ? "text-white" : "text-gray-500"}
              />
              <FileMusic
                size={16}
                className={isActive("Audio") ? "text-white" : "text-gray-500"}
              />
              <Clapperboard
                size={16}
                className={isActive("Videos") ? "text-white" : "text-gray-500"}
              />
              <Code
                size={16}
                className={isActive("Code") ? "text-white" : "text-gray-500"}
              />
              <FileArchive
                size={16}
                className={
                  isActive("Archives") ? "text-white" : "text-gray-500"
                }
              />
            </div>

            <Text
              ml="5"
              mb="5"
              as="span"
              position={"absolute"}
              right={{
                base: "50px",
                "2xl": "60px",
                "3xl": "70px",
              }}
              fontSize={{
                base: "30px",
                "2xl": "35px",
                "3xl": "40px",
              }}
              color="#6A6A6A"
            >
              {total || 0}
            </Text>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
};

const NewAppCard = ({
  name,
  url,
  setAssetView,
  assetview,
  icon,
  total = 0,
}) => {
  const navigate = useNavigate();
  return (
    <Box
      asChild
      className={
        "relative transition-all px-[2px] pt-[2px] duration-500 ease-in-out rounded-md 2xl:rounded-[16px]"
      }
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: "inherit",
        padding: "1.5px",
        background: "linear-gradient(90deg, transparent, transparent)",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "xor",
        transition: "background 0.3s ease",
      }}
    >
      <Box
        onClick={() => {
          navigate(url);
        }}
      >
        <Box
          height={{
            base: "140px",
            "2xl": "160px",
            "3xl": "180px",
          }}
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "inherit",
            padding: "1.5px",
            background: "linear-gradient(90deg, transparent, transparent)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            transition: "background 0.3s ease",
          }}
          _hover={{
            _before: {
              background: "linear-gradient(180deg, #5A9310, #94F219)",
            },
          }}
          className="bg-[#292929] rounded-2xl p-4 py-4 2xl:py-6 shadow-sm hover:shadow-md cursor-pointer group relative overflow-hidden transition-all duration-500 ease-in-out"
        >
          <div className="relative flex">
            <Text
              as={"h3"}
              fontSize={{
                base: "2xl",
              }}
              letterSpacing={"widest"}
              className={`font-semibold text-[#575757] mb-2`}
            >
              {name}
            </Text>
            {icon}
            {/* <p className="text-gray-600 text-sm">{description}</p> */}
          </div>

          <Text
            className="absolute right-10 flex gap-3 items-center bottom-5"
            as="span"
            position="absolute"
            color="#6A6A6A"
            fontSize={{
              base: "40px",
            }}
          >
            {total || 0}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

const UtilsSideBar = () => {
  const cards = ["DocuSpace", "Vault", "Minutes Of Meeting"];
  const {
    data: smartDriveCount,
    isLoading,
    isPlaceholderData,
  } = useGetSmartDriveList();
  console.log("smartDriveCount", smartDriveCount);
  // const { data: items = [], refetch: refetchFiles } = useFileManagerListAll();

  // let sampleFiles = items.map((i) => ({
  //   id: i.id,
  //   name: i.name,
  //   type: i.type || "file",
  //   size: i.size || 0,
  // }));

  // let totalSize = sampleFiles.reduce((sum, file) => sum + file.size, 0);

  const isLessThan3 = cards.length < 3;
  const fileTypes = [
    {
      category: "Documents",
      extensions: ["pdf", "doc", "docx", "txt", "rtf", "odt", "md", "tex"],
    },
    {
      category: "Spreadsheets",
      extensions: ["xls", "xlsx", "csv", "ods"],
    },
    {
      category: "Images",
      extensions: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "tiff",
        "webp",
        "svg",
        "heic",
      ],
    },
    {
      category: "Videos",
      extensions: ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"],
    },
    {
      category: "Audio",
      extensions: ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
    },
    {
      category: "Archives",
      extensions: ["zip", "rar", "7z", "tar", "gz"],
    },
    {
      category: "Code / Scripts",
      extensions: [
        "js",
        "ts",
        "jsx",
        "tsx",
        "py",
        "java",
        "cpp",
        "c",
        "cs",
        "html",
        "css",
        "json",
        "xml",
        "yaml",
        "yml",
        "php",
        "sh",
      ],
    },
  ];

  const getFileCategory = (ext) => {
    for (const group of fileTypes) {
      if (group.extensions.includes(ext)) return group.category;
    }
    return "Other";
  };

  // const categories = [
  //   ...new Set(
  //     sampleFiles
  //       .filter((f) => f.type === "file")
  //       .map((f) => {
  //         const ext = f.name.split(".").pop().toLowerCase();
  //         return getFileCategory(ext);
  //       })
  //       .filter(Boolean)
  //   ),
  // ];

  const smartDriveList = useMemo(() => {
    const findDocuSpace = smartDriveCount.find(
      (item) => item.name === "DocuSpace"
    );
    const findVault = smartDriveCount.find((item) => item.name === "Assets");
    const findMinutesOfMeeting = smartDriveCount.find(
      (item) => item.name === "Minutes of Meetings"
    );

    return {
      DocuSpace: findDocuSpace || 0,
      Vault: findVault || 0,
      "Minutes Of Meeting": findMinutesOfMeeting || 0,
    };
  }, [smartDriveCount]);

  return (
    <div className="pl-2 pt-6">
      <>
        <div className="text-white text-2xl pb-5">SmartDrive</div>
        <div className="pl-10">
          <Box
            className={`grid gap-4 place-content-center ${
              isLessThan3 && "place-content-start"
            }`}
            gap={{ base: 4, "2xl": 6, "3xl": 6 }}
            gridTemplateColumns={{
              base: "repeat(auto-fit, 210px)",
              "2xl": "repeat(auto-fit, 260px)",
              "3xl": "repeat(auto-fit, 296px)",
            }}
          >
            <AppCard
              name={"DocuSpace"}
              total={smartDriveList["DocuSpace"]?.length || 0}
              types={[]}
              url="docuspace"
            />

            <NewAppCard
              name={"Vault"}
              url="vault"
              total={smartDriveList["Vault"]?.length || 0}
              icon={
                <img
                  className="w-13 h-12 absolute right-2"
                  color="white"
                  src="/attachment_145395758-removebg-preview.png"
                />
              }
            />
            <NewAppCard
              name={"Minutes Of Meetings"}
              url="minutes-of-meeting"
              total={smartDriveList["Minutes Of Meeting"]?.length || 0}
              icon={
                <MinutesOfMeetingIcon className="w-20 h-20 absolute right-2" />
              }
            />
          </Box>
        </div>
      </>
    </div>
  );
};

export default UtilsSideBar;
