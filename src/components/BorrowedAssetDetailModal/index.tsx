import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  BorrowedAsset,
  useGetAssetsBorrowedQuery,
  useGetTaskByIdQuery,
} from "@/state/api";
import { CircularProgress } from "@mui/material";

interface BorrowedAssetDetailModalProps {
  open: boolean;
  onClose: () => void;
  borrowedAsset: BorrowedAsset | null;
}

export default function BorrowedAssetDetailModal({
  open,
  onClose,
  borrowedAsset,
}: BorrowedAssetDetailModalProps) {
  const { data: assets, isLoading: isLoadingAssets } =
    useGetAssetsBorrowedQuery();
  const { data: task, isLoading: isLoadingTask } = useGetTaskByIdQuery(
    borrowedAsset?.taskID ?? "",
    {
      skip: !borrowedAsset?.taskID,
    },
  );
  const asset = assets?.find((a) => a.assetID === borrowedAsset?.assetID);
  const isLoading = isLoadingAssets || isLoadingTask;
  const satusName: Record<string, string> = {
    IN_USE: "In Use",
  };
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="mb-4 text-lg font-bold text-gray-900">
                  Borrowed Asset Details
                </Dialog.Title>

                {isLoading || !borrowedAsset ? (
                  <div className="flex justify-center py-6">
                    <CircularProgress />
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="font-medium text-gray-700">
                          Asset ID:
                        </span>
                        <div>{borrowedAsset.assetID}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <div>{satusName[borrowedAsset.status]}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Borrow Time:
                        </span>
                        <div>
                          {new Date(borrowedAsset.borrowTime).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          End Time:
                        </span>
                        <div>
                          {new Date(borrowedAsset.endTime).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">
                          Description:
                        </span>
                        <div>{borrowedAsset.description}</div>
                      </div>
                    </div>

                    <hr />

                    <div>
                      <h3 className="mb-1 font-semibold text-gray-800">
                        Asset Info
                      </h3>
                      {asset ? (
                        <ul className="ml-5 list-disc text-gray-700">
                          <li>
                            <strong>Name:</strong> {asset.assetName}
                          </li>
                          <li>
                            <strong>Location:</strong> {asset.location}
                          </li>
                          <li>
                            <strong>Category:</strong> {asset.category.name}
                          </li>
                          <li>
                            <strong>Type:</strong> {asset.assetType.name}
                          </li>
                        </ul>
                      ) : (
                        <div className="text-red-500">Asset not found.</div>
                      )}
                    </div>

                    <div>
                      <h3 className="mb-1 font-semibold text-gray-800">
                        Task Info
                      </h3>
                      {task ? (
                        <ul className="ml-5 list-disc text-gray-700">
                          <li>
                            <strong>Task:</strong> {task.title}
                          </li>
                        </ul>
                      ) : (
                        <div className="text-red-500">Task not found.</div>
                      )}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
