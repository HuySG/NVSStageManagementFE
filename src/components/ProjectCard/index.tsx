import { Project } from "@/state/api";
import React from "react";

type Props = {
  project: Project;
};

const ProjectCard = ({ project }: Props) => {
  return (
    <div className="rounded border p-4 shadow">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <p>Start Date: {project.startTime}</p>
      <p>End Date: {project.endTime}</p>
    </div>
  );
};

export default ProjectCard;
