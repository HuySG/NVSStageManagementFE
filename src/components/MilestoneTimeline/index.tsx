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
    <div className="container mx-auto max-w-4xl px-4">
      {/* MODAL NEW PROJECT */}
      <ModalNewProject
        isOpen={isModalNewProjectOpen}
        onClose={() => setIsModalNewProjectOpen(false)}
        id={projectID}
      />

      {/* HEADER */}
      <div className="pb-6 pt-6 text-center lg:pb-4 lg:pt-8">
        <Header
          name={project ? `${project.title} Milestones` : "Project Milestones"}
          buttonComponent={
            <button
              className="flex items-center rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-white transition-all hover:from-indigo-600 hover:to-blue-600"
              onClick={() => setIsModalNewProjectOpen(true)}
            >
              <PlusSquare className="mr-2 h-5 w-5" /> New Milestone
            </button>
          }
        />
      </div>

      {/* TIMELINE */}
      <VerticalTimeline>
        {milestones
          .slice()
          .sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          )
          .map((milestone) => (
            <VerticalTimelineElement
              key={milestone.milestoneID}
              date={`${new Date(milestone.startDate).toLocaleDateString()} - ${new Date(milestone.endDate).toLocaleDateString()}`}
              iconStyle={{
                background: "linear-gradient(to right, #4f46e5, #9333ea)",
                color: "#fff",
                boxShadow: "0px 0px 10px rgba(79, 70, 229, 0.6)",
              }}
              icon={<FaFlagCheckered />}
              contentStyle={{
                background: "#ffffff",
                color: "#333",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                borderRadius: "12px",
                padding: "20px",
                transition: "transform 0.3s ease-in-out",
              }}
              contentArrowStyle={{ borderRight: "7px solid #ffffff" }}
              onTimelineElementClick={() =>
                router.push(
                  `/Projects/${projectID}/milestones/${milestone.milestoneID}`,
                )
              }
            >
              <h3 className="text-lg font-semibold text-indigo-700">
                {milestone.title}
              </h3>
              <p className="text-sm text-gray-500">{milestone.description}</p>
            </VerticalTimelineElement>
          ))}
      </VerticalTimeline>
    </div>
  );
}
