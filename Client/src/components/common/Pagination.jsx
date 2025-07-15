

import React from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

function getPageNumbers(current, total) {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex justify-center items-center gap-2 mt-6 ${className}`}>
      {/* First Page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
        aria-label="First"
      >
        <FiChevronsLeft size={15} />
      </button>
      {/* Previous */}
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        aria-label="Previous"
      >
        <FiChevronLeft size={15} />
      </button>
      {/* Page numbers with ellipsis */}
      {getPageNumbers(page, totalPages).map((pg, idx) =>
        pg === "..." ? (
          <span key={idx} className="px-2 text-gray-400 select-none">...</span>
        ) : (
          <button
            key={pg}
            onClick={() => onPageChange(pg)}
            className={`px-3 py-1 rounded-lg border transition cursor-pointer
              ${pg === page
                ? "bg-red-600 text-white border-red-600 font-bold"
                : "bg-white text-gray-700 border-gray-300 hover:bg-red-100 text-sm"}
            `}
          >
            {pg}
          </button>
        )
      )}
      {/* Next */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        aria-label="Next"
      >
        <FiChevronRight size={15} />
      </button>
      {/* Last Page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-red-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        aria-label="Last"
      >
        <FiChevronsRight size={15} />
      </button>
    </div>
  );
}
