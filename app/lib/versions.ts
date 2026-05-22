// app/lib/versions.ts - Version Management
import { getCVVersions, getCVVersion, saveCVVersion, getCV } from "./db";

export interface CVVersionInfo {
  id: number;
  cvId: number;
  createdAt: Date;
  preview: {
    fullName: string;
    title: string;
  };
}

export async function listVersions(cvId: number): Promise<CVVersionInfo[]> {
  const versions = await getCVVersions(cvId);
  return versions.map((v) => {
    const data = typeof v.data === "string" ? JSON.parse(v.data) : v.data;
    return {
      id: v.id,
      cvId: v.cv_id,
      createdAt: v.created_at,
      preview: {
        fullName: data.personal?.fullName || "",
        title: data.personal?.title || "",
      },
    };
  });
}

export async function getVersion(versionId: number) {
  const version = await getCVVersion(versionId);
  if (!version) return null;

  return {
    id: version.id,
    cvId: version.cv_id,
    createdAt: version.created_at,
    data: typeof version.data === "string" ? JSON.parse(version.data) : version.data,
  };
}

export async function createVersion(cvId: number, cvData: Record<string, unknown>) {
  const result = await saveCVVersion(cvId, cvData);
  return result;
}

export async function restoreVersion(versionId: number) {
  const version = await getVersion(versionId);
  if (!version) throw new Error("Version not found");

  const cvData = version.data;
  return cvData;
}