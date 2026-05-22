// app/cvs/new/page.tsx - New CV with Template Selector
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/ui/Header";
import TemplateSelector from "../../components/ui/TemplateSelector";
import type { TemplateId, TemplateSettings } from "../../lib/templates/templateDefinitions";

export default function NewCVPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("classic");
  const [selectedTheme, setSelectedTheme] = useState("default-blue");
  const [selectedFontPair, setSelectedFontPair] = useState("default");

  const handleCreate = async () => {
    try {
      const templateSettings: TemplateSettings = {
        template: selectedTemplate,
        theme: selectedTheme,
        fontPair: selectedFontPair,
      };

      const response = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personal: { fullName: "", title: "", phone: "", email: "", location: "", linkedin: "" },
          profile: "",
          competency: [],
          experiences: [],
          education: [],
          certificate: [],
          skill: [],
          reference: [],
          additionalInfo: [],
          templateSettings,
        }),
      });

      const data = await response.json();
      if (data.success && data.cvId) {
        router.push(`/cvs/${data.cvId}/edit`);
      } else {
        console.error("Failed to create CV:", data.message);
      }
    } catch (error) {
      console.error("Error creating CV:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Create New CV" />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Choose Your Template</h2>

          <TemplateSelector
            selectedTemplate={selectedTemplate}
            selectedTheme={selectedTheme}
            selectedFontPair={selectedFontPair}
            onTemplateChange={setSelectedTemplate}
            onThemeChange={setSelectedTheme}
            onFontPairChange={setSelectedFontPair}
          />

          <div className="mt-8 flex justify-end">
            <button type="button"
              onClick={handleCreate}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue to Editor →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}