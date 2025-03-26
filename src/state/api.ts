import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Project {
  projectID: string;
  title: string;
  description: string;
  startTime: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
  endTime: string;
  department: string;
  createdBy: string;
  tasks: Task[];
  taskID: string;
}

export interface Milestone {
  milestoneID: string;
  title: string;
  description: string;
  startDate: string; // ISO 8601 format (e.g., "2025-03-18T20:24:38.797Z")
  endDate: string;
  projectID: String; // Liên kết với projectID từ Project
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
  role: Role;
  status: string;
  TaskUser: TaskUser[];
}
export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    pictureProfile: string;
  };
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
  startDate: string | null;
  endDate: string | null;
  status: string;
  assigneeID: string;
  createBy: string;
  createDate: string;
  updateBy: string;
  updateDate: string;
  attachments?: Attachment[]; // Giữ nguyên
  assigneeInfo?: AssigneeInfo; // Sửa thành một object thay vì array
  watchers?: Watcher[]; // Giữ nguyên
  projectID?: string; // Giữ nguyên
  milestoneId: string;
  comments?: Comment[]; // Giữ nguyên
  TaskUser?: TaskUser[]; // Giữ nguyên
}
export interface Role {
  id: number;
  roleName: string;
}

export interface AssigneeInfo {
  id: string;
  fullName: string;
  dayOfBirth: string;
  email: string;
  pictureProfile: string;
  createDate: string;
  password: string;
  department: Department;
  role: Role;
  status: string;
  taskUsers: TaskUser[];
}

export interface Watcher {
  userID: string;
  fullName: string;
  dayOfBirth: string;
  email: string;
  pictureProfile: string;
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
  categories: AssetCategory; // Một kiểu tài sản chỉ thuộc một loại tài sản
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
  categoryId: string;
  category: AssetCategory; // Một tài sản chỉ thuộc một loại tài sản
  assetType: AssetType; // Một tài sản chỉ thuộc một kiểu tài sản
}

// 📌 Định nghĩa yêu cầu tài sản
export interface AssetRequest {
  requestId: string;
  quantity: number;
  description: string;
  startTime: string;
  endTime: string;
  asset: Asset | null; // Một yêu cầu chỉ liên quan đến một tài sản
  task: Task;
  status: string;
  requesterInfo: RequesterInfo | null;
}
// 📌 Định nghĩa người yêu cầu
export interface RequesterInfo {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface Attachment {
  attachmentId: string; // Chỉnh từ id: String thành attachmentId: string
  fileUrl: string; // Chỉnh từ fileURL thành fileUrl để khớp với JSON
  fileName: string;
  taskId: string;
  uploadedById: string; // Chỉnh từ String thành string
}
export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    "Projects",
    "Tasks",
    "Users",
    "ProjectTasks",
    "AssetRequests",
    "Milestones",
    "Comments",
    "AssetTypes",
    "Assets",
    "Attachments",
  ],
  endpoints: (build) => ({
    getProjects: build.query<Project[], void>({
      query: () => "project",
      providesTags: ["Projects"],
    }),
    getProjectsDepartment: build.query<Project[], string>({
      query: (departmentId) => `project/department?Id=${departmentId}`,
      providesTags: ["Projects"],
    }),
    getProjectsByUserId: build.query<Project[], string>({
      query: (userId) => `project/userId?userId=${userId}`,
      providesTags: ["Projects"],
    }),
    createMilestone: build.mutation<Milestone, Partial<Milestone>>({
      query: (milestone) => ({
        url: "milestones",
        method: "POST",
        body: milestone,
      }),
      invalidatesTags: ["Milestones"],
    }),
    getTaskMilestone: build.query<Task[], { projectID: string }>({
      query: ({ projectID }) => `tasks/milestoneId?milestoneId=${projectID}`,
      providesTags: (result) =>
        result
          ? result.map(({ taskID }) => ({ type: "Tasks" as const, id: taskID }))
          : [{ type: "Tasks" as const }],
    }),

    getTasksByUser: build.query<Task[], string>({
      query: (userId) => `tasks/by-user/${userId}`,
      providesTags: (result, error, userId) =>
        result
          ? result.map(({ taskID }) => ({ type: "Tasks", id: taskID }))
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
      { result: { token: string; authenticated: boolean } }, // Sửa kiểu dữ liệu
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: "auth/token",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Users"],
    }),

    getUserInfo: build.query<User, void>({
      query: () => "user/my-info",
      transformResponse: (response: { code: number; result: User }) =>
        response.result,
    }),

    getUsers: build.query<User[], void>({
      query: () => "user/get-all",
      transformResponse: (response: { result: User[] }) => response.result, // Chỉ lấy result
      providesTags: ["Users"],
    }),
    getProjectTasks: build.query<ProjectTask[], void>({
      query: () => "projects/project-task",
      providesTags: ["ProjectTasks"],
    }),

    // 📌 Thêm API để tạo yêu cầu tài sản
    getRequestAssets: build.query<AssetRequest[], void>({
      query: () => "request-asset",
      providesTags: ["AssetRequests"],
    }),

    createAssetRequest: build.mutation<AssetRequest, Partial<AssetRequest>>({
      query: (assetRequest) => ({
        url: "request-asset",
        method: "POST",
        body: [assetRequest],
      }),
      invalidatesTags: ["AssetRequests"], // Xóa cache để cập nhật dữ liệu mới
    }),
    getAssets: build.query<Asset[], { categoryId: string }>({
      query: ({ categoryId }) => ({
        url: `asset?categoryId=${categoryId}`,
        method: "GET",
      }),
      providesTags: (result, error, { categoryId }) =>
        result ? [{ type: "Assets", id: categoryId }] : [{ type: "Assets" }],
    }),

    getAssetTypes: build.query<AssetType[], void>({
      query: () => ({
        url: "asset-types",
        method: "GET",
      }),
      providesTags: ["AssetTypes"],
    }),
    getRequestAssetByDepartment: build.query<AssetRequest[], string>({
      query: (departmentId) => ({
        url: `request-asset/leader/department?Id=${departmentId}`,
        method: "GET",
      }),
      providesTags: ["AssetRequests"],
    }),
    // 📌 Thêm API để lấy danh sách milestone theo project
    getMilestonesByProject: build.query<Milestone[], { projectID: string }>({
      query: ({ projectID }) => `milestones/project/${projectID}`,
      providesTags: (result, error, { projectID }) =>
        result
          ? [{ type: "Milestones", id: projectID }]
          : [{ type: "Milestones" }],
    }),
    getTaskComments: build.query<Comment[], { taskID: string }>({
      query: ({ taskID }) => `/api/v1/comment/task?taskID=${taskID}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({
              type: "Comments" as const,
              id: id,
            }))
          : [{ type: "Comments" as const }],
    }),
    postTaskComment: build.mutation<Comment, Partial<Comment>>({
      query: (commentData) => ({
        url: "comment",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: commentData,
      }),
      invalidatesTags: [{ type: "Comments" }],
    }),
    uploadFileMetadata: build.mutation<
      Attachment, // Kiểu trả về từ API
      Omit<Attachment, "attachmentId"> // Loại bỏ attachmentId vì nó có thể được sinh ra từ server
    >({
      query: (data) => ({
        url: "attachments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Attachments"],
    }),
  }),
});

export const {
  //getProjects
  useGetProjectsQuery,
  //getProjectsDepartment
  useGetProjectsDepartmentQuery,
  //getProjectsByUserId
  useGetProjectsByUserIdQuery,
  //createMilestone
  useCreateMilestoneMutation,
  //getTaskMilestone
  useGetTaskMilestoneQuery,
  //getTasksByUser
  useGetTasksByUserQuery,
  //createTask
  useCreateTaskMutation,
  //updateTaskStatus
  useUpdateTaskStatusMutation,
  //updateTask
  useUpdateTaskMutation,
  //loginUser
  useLoginUserMutation,
  //getUserInfo
  useGetUserInfoQuery,
  //getUsers
  useGetUsersQuery,
  //getProjectTasks
  useGetProjectTasksQuery,
  //getRequestAssets
  useGetRequestAssetsQuery,
  //createAssetRequest
  useCreateAssetRequestMutation,
  //getAssets
  useGetAssetsQuery,
  //getAssetTypes
  useGetAssetTypesQuery,
  //getRequestAssetByDepartment
  useGetRequestAssetByDepartmentQuery,
  //getMilestonesByProject
  useGetMilestonesByProjectQuery,
  //getTaskComments
  useGetTaskCommentsQuery,
  //postTaskComment
  usePostTaskCommentMutation,
  //uploadFileMetadata
  useUploadFileMetadataMutation,
} = api;
