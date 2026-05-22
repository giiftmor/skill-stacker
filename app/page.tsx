// app/page.tsx - Landing page / redirect to CVs
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Skill Stacker</h1>
          <p className="text-lg text-gray-600">Professional CV Builder</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <p className="text-gray-600">
            Create beautiful, professional CVs with our easy-to-use builder. 
            Choose from 7 professional templates, customize colors and fonts, 
            and export to PDF or Word.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">7 Templates</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">PDF Export</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Word Export</span>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">Auto-Save</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">Version History</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cvs/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Create New CV
          </Link>
          <Link
            href="/cvs"
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            View My CVs
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          <p>Your CVs are automatically saved as you work.</p>
        </div>
      </div>
    </div>
  );
}