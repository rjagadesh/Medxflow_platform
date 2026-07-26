import { useGetTasksByProjectId } from "@/hooks/query/task/useTasks";
import { Card } from "@chakra-ui/react";
import { CalendarDaysIcon } from "lucide-react";
import { Clock10Icon } from "lucide-react";
import { Link } from "react-router-dom";

export function ProjectCard({ name, description, createdAt, updatedAt, id }) {
  console.log("id999", id);
  const { data: tasks } = useGetTasksByProjectId(id);
  console.log("tasks", tasks);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  console.log("tasks1212", tasks);

  const taskId = tasks?.[0]?.id;
  console.log("taskId", taskId);
  return (
    <Link to={taskId ? `/aba/${id}/task/${taskId}` : `/aba/${id}/task/none`}>
      <Card.Root className="w-full max-w-md !bg-droidal-black-300 hover:shadow-lg transition-shadow duration-200">
        <Card.Header className="pb-3">
          <Card.Title className="text-xl !text-gray-50">{name}</Card.Title>
          <Card.Description className="text-sm text-muted-foreground !text-gray-300 leading-relaxed">
            {description}
          </Card.Description>
        </Card.Header>
        <Card.Body className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDaysIcon color="white" />
            <span className="text-gray-200">
              Created: {formatDate(createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock10Icon color="white" />
            <span className="text-gray-200">
              Updated: {formatDate(updatedAt)}
            </span>
            {/* <Tag className="ml-auto text-xs">{getTimeSince(updatedAt)}</Tag> */}
          </div>
        </Card.Body>
      </Card.Root>
    </Link>
  );
}
