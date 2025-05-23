import { AssetRequest, BorrowedAsset } from "@/state/api";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function groupAssetsByProjectAndDepartment(
  borrowedAssets: BorrowedAsset[] = [],
  assetRequests: AssetRequest[] = [],
) {
  const grouped: {
    [projectId: string]: {
      title: string;
      departments: {
        [departmentId: string]: {
          name: string;
          assets: BorrowedAsset[];
        };
      };
    };
  } = {};

  const taskIdToRequestMap = new Map(
    assetRequests.filter((r) => r.task?.taskID).map((r) => [r.task!.taskID, r]),
  );

  for (const asset of borrowedAssets) {
    const request = taskIdToRequestMap.get(asset.taskID);

    const projectId = request?.projectInfo?.projectID ?? "unknown_project";
    const projectTitle = request?.projectInfo?.title ?? "Unknown Project";
    const departmentId =
      request?.requesterInfo?.department?.id ?? "unknown_department";
    const departmentName =
      request?.requesterInfo?.department?.name ?? "Unknown Department";

    if (!grouped[projectId]) {
      grouped[projectId] = {
        title: projectTitle,
        departments: {},
      };
    }

    if (!grouped[projectId].departments[departmentId]) {
      grouped[projectId].departments[departmentId] = {
        name: departmentName,
        assets: [],
      };
    }

    grouped[projectId].departments[departmentId].assets.push(asset);
  }

  return grouped;
}
