import { Task } from "@/state/api";
import Image from "next/image";
import React from "react";
import { format } from "date-fns";

type Props = {
  task: Task;
};

function TaskCard({ task }: Props) {
  console.log("Task nhận vào TaskCard:", task);
  console.log("Assigned Users:", task.assignedUsers);

  task.assignedUsers.forEach((taskUser, index) => {
    console.log(`User ${index}:`, taskUser.userID);
    console.log(`Full Name: ${taskUser.fullName}`);
  });

  return (
    <div className="mb-3 rounded bg-white p-4 shadow dark:bg-dark-secondary dark:text-white">
      {task.attachments && task.attachments.length > 0 && (
        <div>
          <strong>Attachments:</strong>
          <div className="flex flex-wrap">
            {task.attachments?.map((attachment) => (
              <Image
                key={attachment.id}
                src={`/${attachment.fileURL}`}
                alt={attachment.fileName}
                width={400}
                height={200}
                className="h-auto w-full rounded-t-md"
              />
            ))}
          </div>
        </div>
      )}
      <p>
        <strong>ID:</strong> {task.taskID}
      </p>
      <p>
        <strong>Title:</strong> {task.title}
      </p>
      <p>
        <strong>Description:</strong>{" "}
        {task.description || "No description provided"}
      </p>
      <p>
        <strong>Status:</strong> {task.status}
      </p>
      <p>
        <strong>Priority:</strong> {task.priority}
      </p>
      <p>
        <strong>Tags:</strong> {task.tag || "No tags"}
      </p>
      <p>
        <strong>Start Date:</strong>{" "}
        {task.startDate ? format(new Date(task.startDate), "P") : "Not set"}
      </p>
      <p>
        <strong>End Date:</strong>{" "}
        {task.endDate ? format(new Date(task.endDate), "P") : "Not set"}
      </p>
      {/* <p>
        <strong>Author:</strong> {task.assignedUsers ? task.assignee : "Unknown"}
      </p> */}
      <p>
        <strong>Assignee:</strong>{" "}
        {task.assignedUsers.length > 0
          ? task.assignedUsers
              .map((taskUser) => taskUser.fullName || "No Name")
              .join(", ")
          : "Unassigned"}
      </p>
    </div>
  );
}

export default TaskCard;
