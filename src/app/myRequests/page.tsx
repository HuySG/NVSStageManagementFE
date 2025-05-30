"use client";
import {
  useGetUserInfoQuery,
  useGetRequestAssetByUserQuery,
} from "@/state/api";
import Link from "next/link";

const StaffProjectListPage = () => {
  const { data: user } = useGetUserInfoQuery();
  const userId = user?.id ?? "";
  const { data: requests = [] } = useGetRequestAssetByUserQuery(userId);

  const projectMap = new Map<string, string>();
  requests.forEach((req) => {
    const p = req.projectInfo;
    if (p?.projectID && !projectMap.has(p.projectID)) {
      projectMap.set(p.projectID, p.title);
    }
  });
  const projects = Array.from(projectMap.entries());

  return (
    <div className="min-h-screen bg-gray-50 px-0 py-0 dark:bg-gray-900">
      <header className="mb-8 rounded-b-xl border-b border-gray-100 bg-white px-8 pb-4 pt-7 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          Dự án bạn đã gửi yêu cầu tài sản
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chọn dự án để xem các milestone và yêu cầu tài sản của bạn.
        </p>
      </header>
      <main className="px-10 pb-10">
        {projects.length === 0 ? (
          <div className="py-20 text-center text-lg text-gray-400">
            Bạn chưa gửi yêu cầu tài sản ở dự án nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(([projectID, title]) => (
              <Link
                href={`/myRequests/${projectID}/milestones`}
                key={projectID}
                className="group block rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/90 text-2xl font-black text-white transition group-hover:bg-indigo-500">
                    {title
                      .split(" ")
                      .map((w: string) => w.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-1 truncate text-lg font-bold text-blue-700 group-hover:text-indigo-600 dark:text-blue-300">
                      {title}
                    </h2>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-200">
                  Nhấn để xem milestone và yêu cầu tài sản đã gửi ở dự án này.
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffProjectListPage;
