import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Key, ReactNode } from "react";

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
  milestones: Milestone[];
}

export interface Milestone {
  milestoneID: string;
  title: string;
  description: string;
  startDate: string; // ISO 8601 format (e.g., "2025-03-18T20:24:38.797Z")
  endDate: string;
  projectID: String; // Liên kết với projectID từ Project
  events?: Event[];
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
  commentID: string;
  taskID: string;
  userID: string;
  commentText: string;
  createdDate: string;
  lastModifiedDate: string;
  status: string;
  parentCommentID: string;
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
  categories: AssetCategory[]; // Một kiểu tài sản chỉ thuộc một loại tài sản
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
  categories?: CategoryRequestItem[];
  task: Task;
  status: string;
  requesterInfo: RequesterInfo | null;
  projectInfo: Project;
  approvedByAMName: string;
  approvedByAMTime: string;
  approvedByDLName: string;
  approvedByDLTime: string;
  recurrenceType: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurrenceInterval: number; // khoảng cách lặp (mỗi 1 tuần, 2 tuần...)
  recurrenceEndDate: string; // ngày kết thúc
  selectedDays?: DayOfWeek[]; // chỉ áp dụng nếu là WEEKLY
  dayOfMonth?: number; // áp dụng nếu là MONTHLY
  fallbackToLastDay?: boolean; // nếu dayOfMonth > số ngày trong tháng
  bookingType?: string; // kiểu booking, nếu bạn có phân loại thêm
  recurrenceCount?: number; // số lần đã sinh ra (dựa theo số slot)
}
export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface CategoryRequestItem {
  categoryID: string;
  name: string;
  quantity: number;
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

export type Booking = {
  id: string;
  startTime: string;
  endTime: string;
  assetID: string;
};

export interface BorrowedAsset {
  borrowedID: string;
  assetID: string;
  taskID: string;
  borrowTime: string;
  startTime: string;
  endTime: string;
  description: string;
  status: string;
  requestId: string;
}

export interface RequesterInfo {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  department: Department;
}
export interface StaffBorrowedAsset {
  borrowedID: string;
  assetId: string;
  assetName: string;
  taskId: string;
  taskTitle: string;
  borrowTime: string;
  startTime: string;
  endTime: string;
  status: "IN_USE" | "OVERDUE";
  projectId: string;
}
export interface ReturnRequestInput {
  assetId: string;
  taskId?: string;
  description: string;
  conditionNote: string;
  imageUrl?: string;
}
export interface ReturnRequest {
  requestId: string;
  assetId: string;
  taskId: string;
  staffId: string;
  description: string | null;
  conditionNote: string;
  imageUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestTime: string;
  rejectReason: string | null;
  processedTime: string | null;
}
export type NotificationType =
  | "OVERDUE"
  | "AUTO_CANCELLED"
  | "INFO"
  | "WARNING"
  | "SYSTEM"
  | "ASSET_OVERDUE"
  | "TASK_ASSIGNED"
  | "REQUEST_REJECTED"
  | "RETURN_REQUEST"
  | "RETURN_APPROVED"
  | "RETURN_REJECTED"
  | "ALLOCATION_REQUEST"
  | "ALLOCATION_APPROVED"
  | "ALLOCATION_REJECTED"
  | "ALLOCATION_CANCELLED"
  | "ALLOCATION_COMPLETED"
  | "ALLOCATION_FAILED"
  | "ALLOCATION_PREPARING"
  | "ALLOCATION_READY_TO_DELIVER";

export interface Notification {
  notificationID: string;
  userId: string;
  message: string;
  createDate: string;
  type: NotificationType;
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
    "Events",
    "BorrowedAssets",
    "Asset",
    "ReturnRequest",
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
    getUserByDepartment: build.query<User[], string>({
      query: (departmentId) => `user/department?Id=${departmentId}`,
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
    getAssetBookings: build.query({
      query: (assetID) => `request-asset/by-asset?assetId=${assetID}`,
      providesTags: ["AssetRequests"],
    }),
    // 📌 Thêm API để lấy yêu cầu tài sản theo taskId
    getRequestsByTask: build.query<any[], string>({
      query: (taskId) => `request-asset/by-task/${taskId}`,
    }),
    createAssetRequest: build.mutation<AssetRequest, Partial<AssetRequest>>({
      query: (assetRequest) => ({
        url: "request-asset",
        method: "POST",
        body: [assetRequest],
      }),
      invalidatesTags: ["AssetRequests"],
    }),
    // 📌 Tạo yêu cầu tài sản theo Booking
    createAssetRequestBooking: build.mutation<
      AssetRequest,
      Partial<AssetRequest>
    >({
      query: (assetRequest) => ({
        url: "request-asset/booking", // Đường dẫn cho yêu cầu tài sản theo Booking
        method: "POST",
        body: assetRequest,
      }),
      invalidatesTags: ["AssetRequests"], // Xóa cache để cập nhật dữ liệu mới
    }),

    // 📌 Tạo yêu cầu tài sản theo danh mục
    createAssetRequestCategory: build.mutation<
      AssetRequest,
      Partial<AssetRequest>
    >({
      query: (assetRequest) => ({
        url: "request-asset/category", // Đường dẫn cho yêu cầu tài sản theo danh mục
        method: "POST",
        body: assetRequest,
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
    getAllAsset: build.query<Asset[], void>({
      query: () => ({
        url: "asset",
        method: "GET",
      }),
      providesTags: ["Assets"],
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
        url: `request-asset/leader/department?id=${departmentId}`,
        method: "GET",
      }),
      providesTags: ["AssetRequests"],
    }),

    updateAssetStatus: build.mutation<
      void,
      { requestId: string; status: string; approverId: string }
    >({
      query: ({ requestId, status, approverId }) => ({
        url: "request-asset/status",
        method: "PUT",
        body: { requestId, status, approverId },
      }),
      invalidatesTags: ["AssetRequests"],
    }),

    getAssetRequestsForManager: build.query<AssetRequest[], void>({
      query: () => "request-asset/asset-manager",
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
      query: ({ taskID }) => {
        if (!taskID) {
          throw new Error("Task ID is required to fetch comments.");
        }
        return `comment/task?taskID=${taskID}`;
      },
      providesTags: (result) =>
        result
          ? result.map(({ commentID }) => ({
              type: "Comments" as const,
              id: commentID,
            }))
          : [{ type: "Comments" as const }],
    }),
    archiveTask: build.mutation<void, { taskId: string }>({
      query: ({ taskId }) => ({
        url: `tasks/archive/taskId?id=${taskId}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    postTaskComment: build.mutation<
      Comment,
      { taskID: string; userID: string; commentText: string }
    >({
      query: (commentData) => {
        console.log("Payload being sent to API:", commentData);
        if (!commentData.taskID) {
          throw new Error("Task ID is required to post a comment.");
        }
        return {
          url: "comment", // Endpoint chính xác từ Swagger
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: commentData, // Payload gửi lên server
        };
      },
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
    getEventsByMilestone: build.query({
      query: ({ milestoneId }) => `/events/milestone/${milestoneId}`,
    }),
    getBorrowedAssets: build.query<BorrowedAsset[], void>({
      query: () => "borrowed-assets",
      transformResponse: (response: {
        code: number;
        message: string;
        result: BorrowedAsset[];
      }) => response.result,
      providesTags: ["BorrowedAssets"],
    }),
    getAssetsBorrowed: build.query<Asset[], void>({
      query: () => ({
        url: "asset",
        method: "GET",
      }),
      providesTags: ["Assets"],
    }),
    getTaskById: build.query<Task, string>({
      query: (taskId) => `tasks/taskId?taskId=${taskId}`,
      providesTags: ["Tasks"],
    }),
    getStaffBorrowedAssets: build.query<StaffBorrowedAsset[], string>({
      query: (staffId) => `borrowed-assets/staff/${staffId}`,
      transformResponse: (response: { result: StaffBorrowedAsset[] }) =>
        response.result,
    }),
    getProjectByMilestoneId: build.query<Project, string>({
      query: (milestoneId) => `project/milestone/${milestoneId}`,
      providesTags: ["Projects"],
    }),
    getProjectDetails: build.query<Project, string>({
      query: (projectId) => `project/${projectId}/details`,
      providesTags: ["Projects"],
    }),
    getAsset: build.query<Asset, string>({
      query: (assetId) => `asset/${assetId}`,
      providesTags: ["Asset"],
    }),
    returnAsset: build.mutation<
      void,
      { staffId: string; payload: ReturnRequestInput }
    >({
      query: ({ staffId, payload }) => ({
        url: `/return-requests?staffId=${staffId}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ReturnRequest"],
    }),
    getReturnRequestsByStaffId: build.query<ReturnRequest[], string>({
      query: (staffId) => `/return-requests/staff/${staffId}`,
      transformResponse: (response: { result: ReturnRequest[] }) =>
        response.result,
      providesTags: ["ReturnRequest"],
    }),

    getAssetById: build.query<Asset, string>({
      query: (id) => `/asset/${id}`,
      providesTags: ["Assets"],
    }),
    getBorrowedAssetById: build.query({
      query: (borrowedID) =>
        `borrowed-assets/borrowedId?borrowedId=${borrowedID}`,
      providesTags: ["AssetRequests"],
    }),
    getNotificationsByUser: build.query<Notification[], string>({
      query: (userId: string) => `/notifications/user/${userId}`,
    }),
    getTasksByProjectId: build.query<Task[], string>({
      query: (projectId) => `tasks/by-project/${projectId}`,
      providesTags: ["Tasks"],
    }),
    // Thêm endpoint vào api slice
    getTasksByDepartment: build.query<Task[], string>({
      query: (departmentId) => ({
        url: `tasks/department/${departmentId}`,
        method: "GET",
      }),
      providesTags: ["Tasks"],
    }),
    getMilestoneById: build.query<Milestone, string>({
      query: (milestoneID) => `milestones/${milestoneID}`,
      providesTags: ["Milestones"],
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
  //getUserByDepartment
  useGetUserByDepartmentQuery,
  //getProjectTasks
  useGetProjectTasksQuery,
  //getRequestAssets
  useGetRequestAssetsQuery,
  //getAssetBookings
  useGetAssetBookingsQuery,
  //createAssetRequest
  useCreateAssetRequestMutation,
  //createAssetRequestBooking
  useCreateAssetRequestBookingMutation,
  //createAssetRequestCategory
  useCreateAssetRequestCategoryMutation,
  //getAssets
  useGetAssetsQuery,
  //getAllAsset
  useGetAllAssetQuery,
  //getAssetTypes
  useGetAssetTypesQuery,
  //getRequestAssetByDepartment
  useGetRequestAssetByDepartmentQuery,
  //updateAssetStatus
  useUpdateAssetStatusMutation,
  //getAssetRequestsForManager
  useGetAssetRequestsForManagerQuery,
  //getMilestonesByProject
  useGetMilestonesByProjectQuery,
  //getTaskComments
  useGetTaskCommentsQuery,
  //postTaskComment
  usePostTaskCommentMutation,
  //uploadFileMetadata
  useUploadFileMetadataMutation,
  //archiveTask
  useArchiveTaskMutation,
  //getRequestByTask
  useGetRequestsByTaskQuery,
  //getEventsByMilestone
  useLazyGetEventsByMilestoneQuery,
  //getBorrowedAssets
  useGetBorrowedAssetsQuery,
  //getAssetsBorrowed
  useGetAssetsBorrowedQuery,
  //getTaskById
  useGetTaskByIdQuery,
  //getStaffBorrowedAssets
  useGetStaffBorrowedAssetsQuery,
  //getProjectByMilestoneId
  useGetProjectByMilestoneIdQuery,
  //getProjectDetails
  useGetProjectDetailsQuery,
  //getAsset
  useGetAssetQuery,
  //submitReturnRequest
  useReturnAssetMutation,
  //getReturnRequestsByStaffId
  useGetReturnRequestsByStaffIdQuery,
  //getAssetById
  useGetAssetByIdQuery,
  //getBorrowedAssetById
  useGetBorrowedAssetByIdQuery,
  //getNotificationsByUser
  useGetNotificationsByUserQuery,
  //getTasksByProjectId
  useGetTasksByProjectIdQuery,
  //getTasksByDepartment
  useGetTasksByDepartmentQuery,
  //getMilestoneById
  useGetMilestoneByIdQuery,
} = api;
