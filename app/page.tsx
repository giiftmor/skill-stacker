// app/page.tsx - Landing page / redirect to CVs
"use client";
import { FileText, Sparkles, Palette, Cloud, History } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl lg:text-6xl font-bold text-[#e8e6e3] leading-tight mb-4">
            Skill Stacker
          </h1>
          <p className="text-[#8a8a8a] text-lg md:text-xl">
            Professional CV Builder
          </p>
        </div>

        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <p className="text-[#8a8a8a] text-base leading-relaxed mb-6">
            Create beautiful, professional CVs with our easy-to-use builder.
            Choose from 7 professional templates, customize colors and fonts,
            and export to PDF or Word.
          </p>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 bg-[#d4a85315] text-[#d4a853] rounded-full">7 Templates</span>
            <span className="px-3 py-1 bg-[#d4a85315] text-[#d4a853] rounded-full">PDF Export</span>
            <span className="px-3 py-1 bg-[#d4a85315] text-[#d4a853] rounded-full">Word Export</span>
            <span className="px-3 py-1 bg-[#d4a85315] text-[#d4a853] rounded-full">Auto-Save</span>
            <span className="px-3 py-1 bg-[#d4a85315] text-[#d4a853] rounded-full">Version History</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <Link
            href="/cvs/new"
            className="bg-[#d4a853] text-[#0d0d0d] hover:bg-[#b8923e] font-semibold px-8 py-3 rounded-lg transition-all duration-200 text-center"
          >
            <FileText className="inline w-5 h-5 mr-2 -mt-0.5" />
            Create New CV
          </Link>
          <Link
            href="/cvs"
            className="border border-[#333] text-[#e8e6e3] hover:border-[#d4a853] px-8 py-3 rounded-lg transition-all duration-200 text-center"
          >
            View My CVs
          </Link>
        </div>

        <div className="pt-6 border-t border-[#333] animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 text-[#8a8a8a] text-sm">
              <Sparkles className="w-4 h-4 text-[#d4a853]" />
              <span>7 Templates</span>
            </div>
            <div className="flex items-center gap-3 text-[#8a8a8a] text-sm">
              <Palette className="w-4 h-4 text-[#d4a853]" />
              <span>Custom Themes</span>
            </div>
            <div className="flex items-center gap-3 text-[#8a8a8a] text-sm">
              <Cloud className="w-4 h-4 text-[#d4a853]" />
              <span>Auto-Save</span>
            </div>
            <div className="flex items-center gap-3 text-[#8a8a8a] text-sm">
              <History className="w-4 h-4 text-[#d4a853]" />
              <span>Version History</span>
            </div>
          </div>
          <p className="mt-6 text-[#666] text-xs">Your CVs are automatically saved as you work.</p>
        </div>
      </div>
    </div>
  );
}
