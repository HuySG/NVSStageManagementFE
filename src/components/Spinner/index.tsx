import React from "react";

const Spinner = () => (
  <div className="flex items-center justify-center">
    <div
      className="spinner-border inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-blue-600"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

export default Spinner;
