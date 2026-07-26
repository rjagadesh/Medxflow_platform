import { Badge, Card, CardBody } from "@chakra-ui/react";
import {
  FileText,
  Video,
  Music,
  Archive,
  Code,
  FileSpreadsheet,
  FileImage,
  File,
  Clock,
  MoreVertical,
} from "lucide-react";

export function FileCard({ name, size, type, createdAt, modifiedAt }) {
  const getFileIconAndBackground = (fileType) => {
    const lowerType = fileType.toLowerCase();

    if (
      lowerType.includes("image") ||
      ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(lowerType)
    ) {
      return {
        icon: <FileImage className="w-10 h-10 text-white" />,
        background: "bg-gradient-to-br from-blue-500 to-blue-600",
        accent: "border-blue-200",
      };
    }
    if (
      lowerType.includes("video") ||
      ["mp4", "avi", "mov", "mkv"].includes(lowerType)
    ) {
      return {
        icon: <Video className="w-10 h-10 text-white" />,
        background: "bg-gradient-to-br from-red-500 to-red-600",
        accent: "border-red-200",
      };
    }
    if (
      lowerType.includes("audio") ||
      ["mp3", "wav", "flac", "m4a"].includes(lowerType)
    ) {
      return {
        icon: <Music className="w-10 h-10 text-white" />,
        background: "bg-gradient-to-br from-green-500 to-green-600",
        accent: "border-green-200",
      };
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(lowerType)) {
      return {
        icon: <Archive className="w-10 h-10 text-white" />,
        background: "bg-gradient-to-br from-orange-500 to-orange-600",
        accent: "border-orange-200",
      };
    }
    if (
      ["js", "ts", "jsx", "tsx", "css", "html", "py", "java", "cpp"].includes(
        lowerType
      )
    ) {
      return {
        icon: <Code className="w-10 h-10 text-white" />,
        background: "bg-gradient-to-br from-purple-500 to-purple-600",
        accent: "border-purple-200",
      };
    }
    if (["xlsx", "xls", "csv"].includes(lowerType)) {
      return {
        icon: <FileSpreadsheet className="w-10 h-10 text-white" />,
        background: "bg-gradient-to-br from-emerald-500 to-emerald-600",
        accent: "border-emerald-200",
      };
    }
    if (["txt", "md", "doc", "docx", "pdf"].includes(lowerType)) {
      return {
        icon: <FileText className="w-10 h-10 text-white" />,
        background: "bg-gradient-to-br from-gray-500 to-gray-600",
        accent: "border-gray-200",
      };
    }

    return {
      icon: <File className="w-10 h-10 text-white" />,
      background: "bg-gradient-to-br from-slate-500 to-slate-600",
      accent: "border-slate-200",
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return formatDate(dateString);
  };

  const { icon, background, accent } = getFileIconAndBackground(type);

  return (
    <Card.Root
      className={`group relative overflow-hidden border-2 ${accent} hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white`}
    >
      <Card.Body className="p-0">
        {/* Header with icon */}
        <div className="relative">
          <div
            className={`${background} p-6 flex items-center justify-between`}
          >
            <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl backdrop-blur-sm">
              {icon}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                <MoreVertical className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* File type badge */}
          <div className="absolute -bottom-3 left-6">
            <Badge className="bg-white border border-gray-200 text-gray-700 shadow-sm px-3 py-1">
              {type.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-8">
          <div className="space-y-3">
            <div>
              <h3
                className="font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors"
                title={name}
              >
                {name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{size}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{getRelativeTime(modifiedAt)}</span>
              </div>
              <span>Modified</span>
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
      </Card.Body>
    </Card.Root>
  );
}
