import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

// export interface Project {
//   id: number;
//   name: string;
//   description?: string;
//   startDate?: string;
//   endDate?: string;
// }
export interface Project {
  projectID: string;
  title: string;
  description: string;
  content: string;
  startTime: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
  endTime: string;
  department: string;
  createdBy: string;
  tasks: Task[];
  taskID: string;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
  Backlog = "Backlog",
}

export enum Status {
  ToDo = "ToDo",
  WorkInProgress = "WorkInProgress",
  UnderReview = "UnderReview",
  Completed = "Completed",
}

export interface User {
  id: string;
  fullName?: string;
  dayOfBirth?: string;
  email: string;
  password: string;
  department: Department;
  pictureProfile?: string;
  createDate: string;
  roleID: string;
  status: string;
}
export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface TaskUser {
  userID: string; // Phải khớp với API trả về
  fullName?: string;
  dayOfBirth?: string;
  email?: string;
  pictureProfile?: string;
}

export interface Task {
  taskID: string;
  title: string;
  description: string;
  priority: string;
  tag: string;
  content: string;
  startDate: string;
  endDate: string;
  status: string;
  attachments: string;
  assignedUsers: TaskUser[];
  projectID: string;
}
interface ProjectTask {
  projectId: string;
  title: string;
  description: string;
  content: string;
  startTime: string;
  endTime: string;
  department: string;
  createdBy: string;
  status: string;
  taskID?: string;
  tasks: Task[];
}
// export interface SearchResults {
//   tasks?: Task[];
//   projects?: Project[];
//   users?: User[];
// }

// export interface Team {
//   teamId: number;
//   teamName: string;
//   productOwnerUserId?: number;
//   projectManagerUserId?: number;
// }
// console.log("Base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,

    // prepareHeaders: async (headers) => {
    //   const session = await fetchAuthSession();
    //   const { accessToken } = session.tokens ?? {};
    //   if (accessToken) {
    //     headers.set("Authorization", `Bearer ${accessToken}`);
    //   }
    //   return headers;
    // },
  }),
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "ProjectTasks"],
  endpoints: (build) => ({
    // getAuthUser: build.query({
    //   queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
    //     try {
    //       const user = await getCurrentUser();
    //       const session = await fetchAuthSession();
    //       if (!session) throw new Error("No session found");
    //       const { userSub } = session;
    //       const { accessToken } = session.tokens ?? {};

    //       const userDetailsResponse = await fetchWithBQ(`users/${userSub}`);
    //       const userDetails = userDetailsResponse.data as User;

    //       return { data: { user, userSub, userDetails } };
    //     } catch (error: any) {
    //       return { error: error.message || "Could not fetch user data" };
    //     }
    //   },
    // }),
    getProjects: build.query<Project[], void>({
      query: () => "projects",
      providesTags: ["Projects"],
    }),
    createProject: build.mutation<Project, Partial<Project>>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    getTasks: build.query<Task[], { projectId: String }>({
      query: ({ projectId }) => `tasks/projectId?projectId=${projectId}`,
      providesTags: (result) =>
        result
          ? result.map(({ taskID }) => ({ type: "Tasks" as const, taskID }))
          : [{ type: "Tasks" as const }],
    }),
    getTasksByUser: build.query<Task[], number>({
      query: (userId) => `tasks/user/${userId}`,
      providesTags: (result, error, userId) =>
        result
          ? result.map(({ taskID }) => ({ type: "Tasks", taskID }))
          : [{ type: "Tasks", id: userId }],
    }),
    createTask: build.mutation<Task, Partial<Task>>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),
    updateTaskStatus: build.mutation<Task, { taskId: string; status: string }>({
      query: ({ taskId, status }) => ({
        url: `tasks/${taskId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    getUsers: build.query<User[], void>({
      query: () => "user",
      providesTags: ["Users"],
    }),
    // getTeams: build.query<Team[], void>({
    //   query: () => "teams",
    //   providesTags: ["Teams"],
    // }),
    // search: build.query<SearchResults, string>({
    //   query: (query) => `search?query=${query}`,
    // }),
    getProjectTasks: build.query<ProjectTask[], void>({
      query: () => "projects/project-task",
      providesTags: ["ProjectTasks"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  // useSearchQuery,
  useGetUsersQuery,
  // useGetTeamsQuery,
  useGetTasksByUserQuery,
  useGetProjectTasksQuery,
  // useGetAuthUserQuery,
} = api;
