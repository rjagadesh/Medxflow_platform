import { usePodsById } from "@/hooks/query/projects/usePodsById";
import { useGetTasksByProjectId } from "@/hooks/query/task/useTasks";
import { Button } from "@chakra-ui/react";
import { PlusIcon } from "lucide-react";
// import { FileCard } from "./FileCard";
import { ArrowLeft, FolderOpen, Search, Filter } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewPods() {
  const { id } = useParams();
  const { data: podsDetails = {} } = usePodsById(id);
  const { data: tasks = [] } = useGetTasksByProjectId(id);
  console.log("podsDetails", podsDetails);
  // Sample file data
  const sampleFiles = [
    {
      id: "1",
      name: "dashboard-design.figma",
      size: "2.4 MB",
      type: "figma",
      createdAt: "2024-12-01T10:30:00Z",
      modifiedAt: "2024-12-15T14:22:00Z",
    },
    {
      id: "2",
      name: "user-interface.tsx",
      size: "45 KB",
      type: "tsx",
      createdAt: "2024-12-02T09:15:00Z",
      modifiedAt: "2024-12-20T16:45:00Z",
    },
    {
      id: "3",
      name: "hero-banner.jpg",
      size: "1.2 MB",
      type: "jpg",
      createdAt: "2024-11-28T15:30:00Z",
      modifiedAt: "2024-12-18T12:10:00Z",
    },
    {
      id: "4",
      name: "api-documentation.pdf",
      size: "890 KB",
      type: "pdf",
      createdAt: "2024-11-25T11:20:00Z",
      modifiedAt: "2024-12-10T08:45:00Z",
    },
    {
      id: "5",
      name: "styles.css",
      size: "23 KB",
      type: "css",
      createdAt: "2024-12-03T14:10:00Z",
      modifiedAt: "2024-12-19T10:30:00Z",
    },
    {
      id: "6",
      name: "demo-video.mp4",
      size: "15.7 MB",
      type: "mp4",
      createdAt: "2024-11-30T16:45:00Z",
      modifiedAt: "2024-12-12T13:20:00Z",
    },
    {
      id: "7",
      name: "data-export.xlsx",
      size: "234 KB",
      type: "xlsx",
      createdAt: "2024-12-05T09:30:00Z",
      modifiedAt: "2024-12-17T15:15:00Z",
    },
    {
      id: "8",
      name: "project-archive.zip",
      size: "5.8 MB",
      type: "zip",
      createdAt: "2024-11-20T12:00:00Z",
      modifiedAt: "2024-11-20T12:00:00Z",
    },
  ];

  console.log("tasks121", tasks);

  const navigate = useNavigate();

  const onBackToProjects = () => {
    navigate("-1");
  };

  const totalFiles = sampleFiles.length;
  const totalSize = "26.2 MB"; // This would be calculated from actual file sizes

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="w-full mx-auto">
        {/* Header with breadcrumb */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {podsDetails.project_name}
            </h1>

            <Button
              bg="secondary.400"
              color="white"
              _hover={{ bg: "secondary.500" }}
              onClick={() => navigate(`/aba/pods/${id}/create-task`)}
            >
              <PlusIcon /> Create Task
            </Button>
          </div>
          {tasks.map((task) => {
            return (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{task.task_name}</span>
                <span>•</span>
                <span>{task.task_description}</span>
              </div>
            );
          })}

          {/* <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{totalFiles} files</span>
            <span>•</span>
            <span>{totalSize} total</span>
          </div> */}
        </div>

        {/* Search and filter bar */}
        {/* <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search files..." 
              className="pl-10"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div> */}

        {/* File type badges */}
        {/* <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
            All Files
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 hover:border-blue-200">
            Images
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-purple-50 hover:border-purple-200">
            Code
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
            Documents
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-red-50 hover:border-red-200">
            Media
          </Badge>
        </div> */}

        {/* Files grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {sampleFiles.map((file) => (
            <FileCard
              key={file.id}
              name={file.name}
              size={file.size}
              type={file.type}
              createdAt={file.createdAt}
              modifiedAt={file.modifiedAt}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
}
