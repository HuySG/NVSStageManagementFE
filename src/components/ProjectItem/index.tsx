import { useGetProjectDetailsQuery } from "@/state/api";

interface Props {
  projectId: string;
  assetCount: number;
  onClick: () => void;
}

export default function ProjectItem({ projectId, assetCount, onClick }: Props) {
  const { data, isLoading, isError } = useGetProjectDetailsQuery(projectId);

  let title = "Đang tải...";
  if (isError) title = "Lỗi khi tải tên Project";
  else if (data) title = data.title;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border bg-white p-6 shadow-md transition-shadow hover:bg-blue-50 hover:shadow-lg"
    >
      <h2 className="mb-2 text-xl font-semibold text-gray-800">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{assetCount} Assets Borrowed</p>
    </div>
  );
}
