// app/components/CVListManager.tsx
"use client";

import { useState, useEffect } from "react";

interface CVSummary {
  id: number;
  fullName: string;
  title: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface CVListManagerProps {
  onLoadCV: (id: number) => void;
  currentCvId: number | null;
}

export default function CVListManager({
  onLoadCV,
  currentCvId,
}: CVListManagerProps) {
  const [cvs, setCvs] = useState<CVSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );

  // Fetch all CVs
  const fetchCVs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cv");
      const data = await response.json();

      if (data.success) {
        setCvs(data.cvs);
      }
    } catch (error) {
      console.error("Error fetching CVs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCVs();
  }, []);

  // Delete CV
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/cv/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setCvs(cvs.filter((cv) => cv.id !== id));
        setShowDeleteConfirm(null);
        alert("CV deleted successfully");
      } else {
        alert("Failed to delete CV");
      }
    } catch (error) {
      console.error("Error deleting CV:", error);
      alert("Error deleting CV");
    }
  };

  // Filter and sort CVs
  const filteredCVs = cvs
    .filter(
      (cv) =>
        cv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cv.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.fullName.localeCompare(b.fullName);
      } else {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Saved CVs</h2>
        <button
          onClick={fetchCVs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Search and Sort */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "date")}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* CV List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading CVs...</p>
        </div>
      ) : filteredCVs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm
              ? "No CVs found matching your search"
              : "No CVs saved yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCVs.map((cv) => (
            <div
              key={cv.id}
              className={`border rounded-lg p-4 transition-all ${
                currentCvId === cv.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cv.fullName}
                    </h3>
                    {currentCvId === cv.id && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                        Currently Editing
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{cv.title}</p>
                  <p className="text-sm text-gray-500 mt-1">📧 {cv.email}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Created: {formatDate(cv.createdAt)}</span>
                    <span>Updated: {formatDate(cv.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onLoadCV(cv.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    disabled={currentCvId === cv.id}
                  >
                    {currentCvId === cv.id ? "Loaded" : "Load"}
                  </button>

                  {showDeleteConfirm === cv.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(cv.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(cv.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {!loading && cvs.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-3xl font-bold text-blue-600">{cvs.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total CVs</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-3xl font-bold text-green-600">
                {filteredCVs.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Matching Search</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-3xl font-bold text-purple-600">
                {currentCvId ? "1" : "0"}
              </p>
              <p className="text-sm text-gray-600 mt-1">Currently Editing</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
