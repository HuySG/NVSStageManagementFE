"use client";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { useRouter } from "next/navigation";
import {
  useGetMilestonesByProjectQuery,
  useGetProjectsQuery,
} from "@/state/api";
import { FaFlagCheckered } from "react-icons/fa";
import { useState } from "react";
import Header from "../Header";
import ModalNewProject from "@/app/Projects/ModalNewProject";
import { PlusSquare } from "lucide-react";

type Props = { projectID: string };

export default function MilestoneTimeline({ projectID }: Props) {
  const router = useRouter();
  const {
    data: milestones,
    error,
    isLoading,
  } = useGetMilestonesByProjectQuery({ projectID });
  const [isModalNewProjectOpen, setIsModalNewProjectOpen] = useState(false);
  const { data: projects } = useGetProjectsQuery();
  const project = projects?.find((p) => p.projectID === projectID);

  if (isLoading)
    return <div className="p-5 text-center text-gray-500">Loading...</div>;
  if (error || !milestones)
    return (
      <div className="p-5 text-center text-red-500">
        Error fetching milestones
      </div>
    );

  return (
    <div className="container mx-auto px-4">
      {/* MODAL NEW PROJECT */}
      <ModalNewProject
        isOpen={isModalNewProjectOpen}
        onClose={() => setIsModalNewProjectOpen(false)}
        id={projectID}
      />

      {/* HEADER */}
      <div className="pb-6 pt-6 lg:pb-4 lg:pt-8">
        <Header
          name={project ? `${project.title} Milestones` : "Project Milestones"}
          buttonComponent={
            <button
              className="flex items-center rounded-md bg-blue-primary px-3 py-2 text-white hover:bg-blue-600"
              onClick={() => setIsModalNewProjectOpen(true)}
            >
              <PlusSquare className="mr-2 h-5 w-5" /> New Milestone
            </button>
          }
        />
      </div>

      {/* TIMELINE */}
      <VerticalTimeline>
        {milestones.map((milestone) => (
          <VerticalTimelineElement
            key={milestone.milestoneID}
            date={`${new Date(milestone.startDate).toLocaleDateString()} - ${new Date(milestone.endDate).toLocaleDateString()}`}
            iconStyle={{ background: "#007bff", color: "#fff" }}
            contentStyle={{
              background: "#f8f9fa",
              color: "#00000",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
            }}
            contentArrowStyle={{ borderRight: "7px solid #f8f9fa" }}
            onTimelineElementClick={() =>
              router.push(
                `/Projects/${projectID}/milestones/${milestone.milestoneID}`,
              )
            }
          >
            <h3 className="font-bold text-blue-700">{milestone.title}</h3>
            <p className="text-gray-600">{milestone.description}</p>
          </VerticalTimelineElement>
        ))}
      </VerticalTimeline>
    </div>
  );
}
