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
    <div className="min-h-screen bg-[#0d0d0d]">
      <Header title="My CVs" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#e8e6e3]">Your CVs</h2>
          <Link
            href="/cvs/new"
            className="px-4 py-2 bg-[#d4a853] text-[#0d0d0d] rounded-lg hover:bg-[#b8923e] transition-colors font-semibold"
          >
            + New CV
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 skeleton rounded-lg" />)}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-[#dc4444]">{error}</div>
        ) : cvs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8a8a8a] mb-4">No CVs yet. Create your first one!</p>
            <Link
              href="/cvs/new"
              className="px-4 py-2 bg-[#d4a853] text-[#0d0d0d] rounded-lg hover:bg-[#b8923e] font-semibold"
            >
              Create CV
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvs.map((cv) => (
              <div key={cv.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 card-hover">
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#e8e6e3]">{cv.fullName || "Untitled CV"}</h3>
                <p className="text-[#8a8a8a] text-sm">{cv.title || "No title"}</p>
                <p className="text-[#666] text-xs mt-2">
                  Updated: {new Date(cv.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/cvs/${cv.id}/edit`}
                    className="flex-1 px-3 py-2 bg-transparent text-[#d4a853] text-center rounded hover:bg-[#d4a85315] transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/cvs/${cv.id}/preview`}
                    className="flex-1 px-3 py-2 bg-transparent text-[#8a8a8a] text-center rounded hover:text-[#e8e6e3] transition-colors"
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => handleDelete(cv.id)}
                    className="px-3 py-2 bg-transparent text-[#dc4444] rounded hover:bg-[#dc444415] transition-colors"
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