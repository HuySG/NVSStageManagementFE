import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

// export interface Project {
//   id: number;
//   name: string;
//   description?: string;
//   startDate?: string;
//   endDate?: string;
// }
export interface Show {
  showID: string;
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
  TaskId: TaskUser[];
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
  attachments: Attachment[];
  assignedUsers: TaskUser[];
  showId: string;
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
// 📌 Định nghĩa loại tài sản
export interface AssetCategory {
  categoryID: string;
  name: string;
}

// 📌 Định nghĩa kiểu tài sản
export interface AssetType {
  id: string;
  name: string;
}

// 📌 Định nghĩa tài sản
export interface Asset {
  assetID: string;
  assetName: string;
  model: string;
  code: string;
  description: string;
  price: number;
  buyDate: string;
  status: string;
  location: string;
  createdBy: string;
  image: string;
  category: AssetCategory[];
  assetType: AssetType[];
}

// 📌 Định nghĩa yêu cầu tài sản
export interface AssetRequest {
  requestId: string;
  quantity: number;
  description: string;
  startTime: string;
  endTime: string;
  asset: Asset[];
  task: Task[];
  status: string;
}
export interface Attachment {
  id: number;
  fileURL: string;
  fileName: string;
  taskId: Task[];
  uploadedById: number;
}
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
  tagTypes: ["Shows", "Tasks", "Users", "ProjectTasks", "AssetRequests"],
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
    getProjects: build.query<Show[], void>({
      query: () => "shows",
      providesTags: ["Shows"],
    }),
    createProject: build.mutation<Show, Partial<Show>>({
      query: (project) => ({
        url: "shows",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Shows"],
    }),
    getTasks: build.query<Task[], { showId: String }>({
      query: ({ showId }) => `tasks/showId?showId=${showId}`,
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
    updateTask: build.mutation<Task, Partial<Task>>({
      query: (taskData) => ({
        url: "tasks",
        method: "PUT",
        body: taskData, // Gửi toàn bộ dữ liệu cập nhật
      }),
      invalidatesTags: (result, error, { taskID }) => [
        { type: "Tasks", id: taskID },
      ],
    }),
    loginUser: build.mutation<
      { token: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: "auth/login", // Điều chỉnh endpoint nếu cần
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Users"], // Cập nhật dữ liệu user sau khi đăng nhập
    }),

    getUsers: build.query<User[], void>({
      query: () => "user/get-all",
      transformResponse: (response: { result: User[] }) => response.result, // Chỉ lấy result
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
    createAssetRequest: build.mutation<AssetRequest, Partial<AssetRequest>>({
      query: (assetRequest) => ({
        url: "asset-requests/batch",
        method: "POST",
        body: assetRequest,
      }),
      invalidatesTags: ["AssetRequests"], // Xóa cache để cập nhật dữ liệu mới
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useUpdateTaskMutation,
  useLoginUserMutation,
  // useSearchQuery,
  useGetUsersQuery,
  // useGetTeamsQuery,
  useGetTasksByUserQuery,
  useGetProjectTasksQuery,
  // useGetAuthUserQuery,
  useCreateAssetRequestMutation,
} = api;
