// app/cvs/page.tsx - CV List Page
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../components/ui/Header";

interface CVItem {
  id: number;
  fullName: string;
  title: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export default function CVListPage() {
  const [cvs, setCVs] = useState<CVItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCVs();
  }, []);

  const loadCVs = async () => {
    try {
      const response = await fetch("/api/cv");
      const data = await response.json();
      if (data.success) {
        setCVs(data.cvs);
      } else {
        setError(data.message || "Failed to load CVs");
      }
    } catch (err) {
      setError("Failed to load CVs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cvId: number) => {
    if (!confirm("Are you sure you want to delete this CV?")) return;

    try {
      const response = await fetch(`/api/cv/${cvId}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setCVs((prev) => prev.filter((cv) => cv.id !== cvId));
      }
    } catch (err) {
      console.error("Failed to delete CV:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="My CVs" />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your CVs</h2>
          <Link
            href="/cvs/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + New CV
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : cvs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No CVs yet. Create your first one!</p>
            <Link
              href="/cvs/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create CV
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvs.map((cv) => (
              <div key={cv.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold">{cv.fullName || "Untitled CV"}</h3>
                <p className="text-gray-600">{cv.title || "No title"}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Updated: {new Date(cv.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/cvs/${cv.id}/edit`}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/cvs/${cv.id}/preview`}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-center rounded hover:bg-gray-200"
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => handleDelete(cv.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}