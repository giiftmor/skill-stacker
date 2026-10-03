import { NextResponse } from "next/server";
import {
  getCV,
  initDb,
  resolveSlugParam,
  saveCVVersion,
  updateCV,
} from "../../../../../../lib/db";
import { logger } from "../../../../../../lib/log";
import { getVersion } from "../../../../../../lib/versions";

interface CVData {
  personal: {
    fullName: string;
    title: string;
    phone: string;
    email: string;
    location: string;
    linkedin: string;
  };
  profile: string;
  competency: string[];
  experiences: Array<{
    company: string;
    role: string;
    period: string;
    details: string;
  }>;
  education: Array<{
    institution: string;
    qualification: string;
    period: string;
  }>;
  certificate: Array<{ name: string; date: string }>;
  skill: string[];
  reference: Array<{
    name: string;
    company: string;
    role: string;
    email: string;
    phone: string;
  }>;
  additionalInfo: string[];
}

interface CVRow {
  full_name?: string | null;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  linkedin?: string | null;
  profile?: string | null;
  competency?: string[];
  experiences?: Array<{
    company?: string | null;
    role?: string | null;
    period?: string | null;
    details?: string | null;
  }>;
  education?: Array<{
    institution?: string | null;
    qualification?: string | null;
    period?: string | null;
  }>;
  certificate?: Array<{ name?: string | null; date?: string | null }>;
  skill?: string[];
  reference?: Array<{
    name?: string | null;
    company?: string | null;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
  }>;
  additionalInfo?: string[];
}

function toVersionId(raw: string): number {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? -1 : n;
}

function cvRowToData(cv: CVRow): CVData {
  return {
    personal: {
      fullName: cv.full_name || "",
      title: cv.title || "",
      phone: cv.phone || "",
      email: cv.email || "",
      location: cv.location || "",
      linkedin: cv.linkedin || "",
    },
    profile: cv.profile || "",
    competency: cv.competency || [],
    experiences: (cv.experiences || []).map((e) => ({
      company: e.company || "",
      role: e.role || "",
      period: e.period || "",
      details: e.details || "",
    })),
    education: (cv.education || []).map((e) => ({
      institution: e.institution || "",
      qualification: e.qualification || "",
      period: e.period || "",
    })),
    certificate: (cv.certificate || []).map((c) => ({
      name: c.name || "",
      date: c.date || "",
    })),
    skill: cv.skill || [],
    reference: (cv.reference || []).map((r) => ({
      name: r.name || "",
      company: r.company || "",
      role: r.role || "",
      email: r.email || "",
      phone: r.phone || "",
    })),
    additionalInfo: cv.additionalInfo || [],
  };
}

// POST /api/resume/jane-doe-2a/versions/45/restore - Restore resume jane-doe-2a to version 45
export async function POST(
  _: unknown,
  { params }: { params: Promise<{ slug: string; versionId: string }> },
) {
  const { slug, versionId } = await params;
  const vid = toVersionId(versionId);
  const t0 = Date.now();

  try {
    await initDb();
    const resolved = await resolveSlugParam(slug);
    if (resolved.status !== "ok") {
      const notFound = resolved.status === "not_found";
      logger.warn(
        "api.resume.restore",
        notFound ? "resume not found" : "invalid resume identifier",
        { slug },
      );
      return NextResponse.json(
        {
          success: false,
          message: notFound ? "Resume not found" : "Invalid resume identifier",
        },
        { status: notFound ? 404 : 400 },
      );
    }
    const cvId = resolved.cvId;

    if (vid === -1) {
      logger.warn("api.resume.restore", "invalid version id", { versionId });
      return NextResponse.json(
        { success: false, message: "Invalid version ID" },
        { status: 400 },
      );
    }

    logger.info("api.resume.restore", "restore requested", {
      cvId,
      versionId: vid,
    });

    const version = await getVersion(vid);
    if (!version || version.cvId !== cvId) {
      logger.warn("api.resume.restore", "version not found", {
        cvId,
        versionId: vid,
      });
      return NextResponse.json(
        { success: false, message: "Version not found" },
        { status: 404 },
      );
    }

    const current = (await getCV(cvId)) as CVRow;
    await saveCVVersion(
      cvId,
      cvRowToData(current) as unknown as Record<string, unknown>,
    );

    const data = version.data as CVData;
    await updateCV(cvId, data);

    logger.info("api.resume.restore", "restore returned", {
      cvId,
      versionId: vid,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      { success: true, message: "Version restored", data },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.resume.restore",
      "restore failed",
      { slug, versionId: vid, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to restore version",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
