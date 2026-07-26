import { useGetPodsQuery } from "@/hooks/query/projects/useGetPodsQuery";
import { ProjectCard } from "./project-card";

export default function Projects() {
  const { data: pods = [], isLoading } = useGetPodsQuery();

  return (
    <div className="min-h-screen bg-transparent p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">My Pods</h1>
          <p className="text-gray-200">Manage and view your pods</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pods.map((project, index) => (
            <ProjectCard
              key={index}
              name={project.project_name}
              description={project.description}
              createdAt={project.createdAt}
              updatedAt={project.updatedAt}
              id={project.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
