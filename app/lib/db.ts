// app/lib/db.ts - PostgreSQL Version
import { Pool, QueryResult } from "pg";
import { logger } from "./log";
import {
  hasFlagsToSections, readinessFromSections,
  type SectionKey,
} from "./readiness";
import { slugFromId } from "./slug";

let pool: Pool | null = null;

interface CVPhoto {
  id: number;
  resume_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: Date;
}

interface CVVersion {
  id: number;
  resume_id: number;
  data: string;
  created_at: Date;
}

interface TemplateSettings {
  template: string;
  theme: string;
  fontPair: string;
  colorScheme: string;
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "cvbuilder",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Initialize database connection pool
export function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
    console.log("PostgreSQL pool created");
  }
  return pool;
}

// Initialize database tables
export async function initDb() {
  const client = await getPool().connect();

  try {
    // 1. Table renames (only from legacy names when the new name is absent)
    await client.query(`
      DO $$ BEGIN
        IF to_regclass('public.cvs') IS NOT NULL AND to_regclass('public.resumes') IS NULL THEN
          ALTER TABLE cvs RENAME TO resumes;
        END IF;
        IF to_regclass('public.cv_photos') IS NOT NULL AND to_regclass('public.resume_photos') IS NULL THEN
          ALTER TABLE cv_photos RENAME TO resume_photos;
        END IF;
        IF to_regclass('public.cv_versions') IS NOT NULL AND to_regclass('public.resume_versions') IS NULL THEN
          ALTER TABLE cv_versions RENAME TO resume_versions;
        END IF;
        IF to_regclass('public.resumes') IS NOT NULL THEN
          ALTER TABLE resumes ADD COLUMN IF NOT EXISTS slug TEXT;
        END IF;
      END $$;
    `);

    // 2. Key column renames cv_id -> resume_id in every child table
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competencies' AND column_name='cv_id') THEN
          ALTER TABLE competencies RENAME COLUMN cv_id TO resume_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='experiences' AND column_name='cv_id') THEN
          ALTER TABLE experiences RENAME COLUMN cv_id TO resume_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='education' AND column_name='cv_id') THEN
          ALTER TABLE education RENAME COLUMN cv_id TO resume_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='certificates' AND column_name='cv_id') THEN
          ALTER TABLE certificates RENAME COLUMN cv_id TO resume_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skills' AND column_name='cv_id') THEN
          ALTER TABLE skills RENAME COLUMN cv_id TO resume_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reference_list' AND column_name='cv_id') THEN
          ALTER TABLE reference_list RENAME COLUMN cv_id TO resume_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='additional_info' AND column_name='cv_id') THEN
          ALTER TABLE additional_info RENAME COLUMN cv_id TO resume_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resume_photos' AND column_name='cv_id') THEN
          ALTER TABLE resume_photos RENAME COLUMN cv_id TO resume_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resume_versions' AND column_name='cv_id') THEN
          ALTER TABLE resume_versions RENAME COLUMN cv_id TO resume_id;
        END IF;
      END $$;
    `);

    // 3. Backfill slug on rows migrated from the legacy schema
    const tableCheck = await client.query(
      "SELECT to_regclass('public.resumes') AS t",
    );
    if (tableCheck.rows[0]?.t) {
      const pending = await client.query(
        "SELECT id, full_name FROM resumes WHERE slug IS NULL OR slug = ''",
      );
      for (const row of pending.rows as Array<{
        id: number;
        full_name: string;
      }>) {
        await client.query("UPDATE resumes SET slug = $1 WHERE id = $2", [
          slugFromId(row.full_name, row.id),
          row.id,
        ]);
      }

      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resumes_slug_key') THEN
            ALTER TABLE resumes ADD CONSTRAINT resumes_slug_key UNIQUE (slug);
          END IF;
        END $$;
      `);
      await client.query(
        "ALTER TABLE resumes ALTER COLUMN slug SET NOT NULL",
      );
    }

    // Create resumes table with template_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        location VARCHAR(255),
        linkedin VARCHAR(255),
        profile TEXT,
        template_settings JSONB DEFAULT '{}',
        ready_override BOOLEAN DEFAULT false,
        slug TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add template_settings column if it doesn't exist
    await client.query(`
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS template_settings JSONB DEFAULT '{}'
    `);

    // Add ready_override column if it doesn't exist
    await client.query(`
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS ready_override BOOLEAN DEFAULT false
    `);

    // Create index if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resumes_full_name') THEN
          CREATE INDEX idx_resumes_full_name ON resumes(full_name);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resumes_email') THEN
          CREATE INDEX idx_resumes_email ON resumes(email);
        END IF;
      END $$
    `);

    // Create CV Photos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resume_photos (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        mime_type VARCHAR(100),
        size INTEGER,
        url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create CV Versions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resume_versions (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create CV versions index
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resume_versions_resume_id') THEN
          CREATE INDEX idx_resume_versions_resume_id ON resume_versions(resume_id);
        END IF;
      END $$
    `);

    // Create Competencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS competencies (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        competency VARCHAR(255) NOT NULL
      )
    `);

    // Create Experiences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS experiences (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        company VARCHAR(255),
        role VARCHAR(255),
        period VARCHAR(255),
        details TEXT
      )
    `);

    // Create Education table
    await client.query(`
      CREATE TABLE IF NOT EXISTS education (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        institution VARCHAR(255),
        qualification VARCHAR(255),
        period VARCHAR(255)
      )
    `);

    // Create Certificates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        name VARCHAR(255),
        date VARCHAR(255)
      )
    `);

    // Create Skills table
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        skill VARCHAR(255) NOT NULL
      )
    `);

    // Create References table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reference_list (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        name VARCHAR(255),
        company VARCHAR(255),
        role VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(255)
      )
    `);

    // Create Additional Info table
    await client.query(`
      CREATE TABLE IF NOT EXISTS additional_info (
        id SERIAL PRIMARY KEY,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        info TEXT NOT NULL
      )
    `);

    console.log("PostgreSQL tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Save CV data
export async function saveCV(data: {
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
  certificate: Array<{
    name: string;
    date: string;
  }>;
  skill: string[];
  reference: Array<{
    name: string;
    company: string;
    role: string;
    email: string;
    phone: string;
  }>;
  additionalInfo: string[];
  templateSettings?: TemplateSettings;
}) {
  const t0 = Date.now();
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    // Insert CV personal information
    const idSeq = await client.query(
      "SELECT nextval(pg_get_serial_sequence('resumes', 'id'))::int AS id",
    );
    const cvId = idSeq.rows[0].id as number;
    const slug = slugFromId(data.personal.fullName, cvId);

    const cvResult = await client.query(
      `INSERT INTO resumes (id, full_name, title, phone, email, location, linkedin, profile, template_settings, slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        cvId,
        data.personal.fullName,
        data.personal.title,
        data.personal.phone,
        data.personal.email,
        data.personal.location,
        data.personal.linkedin,
        data.profile,
        data.templateSettings ? JSON.stringify(data.templateSettings) : "{}",
        slug,
      ],
    );
    if (cvResult.rowCount !== 1) {
      throw new Error("Resume insert failed");
    }

    // Insert competencies
    for (const comp of data.competency.filter(Boolean)) {
      await client.query(
        "INSERT INTO competencies (resume_id, competency) VALUES ($1, $2)",
        [cvId, comp],
      );
    }

    // Insert experiences
    for (const exp of data.experiences.filter((e) => e.company || e.role)) {
      await client.query(
        "INSERT INTO experiences (resume_id, company, role, period, details) VALUES ($1, $2, $3, $4, $5)",
        [cvId, exp.company, exp.role, exp.period, exp.details],
      );
    }

    // Insert education
    for (const edu of data.education.filter(
      (e) => e.institution || e.qualification,
    )) {
      await client.query(
        "INSERT INTO education (resume_id, institution, qualification, period) VALUES ($1, $2, $3, $4)",
        [cvId, edu.institution, edu.qualification, edu.period],
      );
    }

    // Insert certificates
    for (const cert of data.certificate.filter((c) => c.name || c.date)) {
      await client.query(
        "INSERT INTO certificates (resume_id, name, date) VALUES ($1, $2, $3)",
        [cvId, cert.name, cert.date],
      );
    }

    // Insert skills
    for (const skill of data.skill.filter(Boolean)) {
      await client.query("INSERT INTO skills (resume_id, skill) VALUES ($1, $2)", [
        cvId,
        skill,
      ]);
    }

    // Insert references
    for (const ref of data.reference.filter((r) => r.name || r.company)) {
      await client.query(
        "INSERT INTO reference_list (resume_id, name, company, role, email, phone) VALUES ($1, $2, $3, $4, $5, $6)",
        [cvId, ref.name, ref.company, ref.role, ref.email, ref.phone],
      );
    }

    // Insert additional info
    for (const info of data.additionalInfo.filter(Boolean)) {
      await client.query(
        "INSERT INTO additional_info (resume_id, info) VALUES ($1, $2)",
        [cvId, info],
      );
    }

    await client.query("COMMIT");
    logger.info("db.write", "done", {
      fn: "saveCV",
      cvId,
      ms: Date.now() - t0,
    });
    return { success: true, cvId, slug };
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(
      "db.write",
      "save failed",
      { fn: "saveCV", cvId: undefined, ms: Date.now() - t0 },
      error as Error,
    );
    throw error;
  } finally {
    client.release();
  }
}

// Get all CVs
export async function getAllCVs() {
  const result = await getPool().query(`
    SELECT
      resumes.id,
      resumes.slug,
      resumes.full_name as "fullName",
      resumes.title,
      resumes.phone,
      resumes.email,
      resumes.location,
      resumes.linkedin,
      resumes.profile,
      resumes.created_at as "createdAt",
      resumes.updated_at as "updatedAt",
      resumes.ready_override as "readyOverride",
      (resumes.full_name IS NOT NULL AND resumes.full_name <> '') AS "hasPersonal",
      (resumes.profile IS NOT NULL AND resumes.profile <> '') AS "hasProfile",
      EXISTS (SELECT 1 FROM competencies c WHERE c.resume_id = resumes.id AND c.competency <> '') AS "hasCompetency",
      EXISTS (SELECT 1 FROM experiences e WHERE e.resume_id = resumes.id AND (e.company <> '' OR e.details <> '')) AS "hasExperiences",
      EXISTS (SELECT 1 FROM education ed WHERE ed.resume_id = resumes.id AND ed.institution <> '') AS "hasEducation",
      EXISTS (SELECT 1 FROM certificates ce WHERE ce.resume_id = resumes.id AND ce.name <> '') AS "hasCertificate",
      EXISTS (SELECT 1 FROM skills s WHERE s.resume_id = resumes.id AND s.skill <> '') AS "hasSkill",
      EXISTS (SELECT 1 FROM reference_list r WHERE r.resume_id = resumes.id AND r.name <> '') AS "hasReference",
      EXISTS (SELECT 1 FROM additional_info a WHERE a.resume_id = resumes.id AND a.info <> '') AS "hasAdditionalInfo"
    FROM resumes
    ORDER BY resumes.updated_at DESC
  `);

  return result.rows.map((row) => {
    const flags: Partial<Record<SectionKey, boolean>> = {
      personal: row.hasPersonal,
      profile: row.hasProfile,
      competency: row.hasCompetency,
      experiences: row.hasExperiences,
      education: row.hasEducation,
      certificate: row.hasCertificate,
      skill: row.hasSkill,
      reference: row.hasReference,
      additionalInfo: row.hasAdditionalInfo,
    };
    const sections = hasFlagsToSections(flags);
    return {
      id: row.id,
      slug: row.slug,
      fullName: row.fullName,
      title: row.title,
      phone: row.phone,
      email: row.email,
      location: row.location,
      linkedin: row.linkedin,
      profile: row.profile,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      readyOverride: row.readyOverride,
      sections,
      readinessPercent: readinessFromSections(sections),
    };
  });
}

// Get single CV
export async function getCV(id: number) {
  const client = await getPool().connect();

  try {
    // Get CV basic info
    const cvResult = await client.query("SELECT * FROM resumes WHERE id = $1", [
      id,
    ]);
    if (cvResult.rows.length === 0) {
      throw new Error("CV not found");
    }
    const cv = cvResult.rows[0];

    // Get experiences
    const expResult = await client.query(
      "SELECT * FROM experiences WHERE resume_id = $1 ORDER BY id",
      [id],
    );
    cv.experiences = expResult.rows;

    // Get education
    const eduResult = await client.query(
      "SELECT * FROM education WHERE resume_id = $1 ORDER BY id",
      [id],
    );
    cv.education = eduResult.rows;

    // Get competencies
    const compResult = await client.query(
      "SELECT competency FROM competencies WHERE resume_id = $1",
      [id],
    );
    cv.competency = compResult.rows.map((r) => r.competency);

    // Get certificates
    const certResult = await client.query(
      "SELECT name, date FROM certificates WHERE resume_id = $1",
      [id],
    );
    cv.certificate = certResult.rows;

    // Get skills
    const skillResult = await client.query(
      "SELECT skill FROM skills WHERE resume_id = $1",
      [id],
    );
    cv.skill = skillResult.rows.map((r) => r.skill);

    // Get references
    const refResult = await client.query(
      "SELECT * FROM reference_list WHERE resume_id = $1",
      [id],
    );
    cv.reference = refResult.rows;

    // Get additional info
    const infoResult = await client.query(
      "SELECT info FROM additional_info WHERE resume_id = $1",
      [id],
    );
    cv.additionalInfo = infoResult.rows.map((r) => r.info);

    return cv;
  } finally {
    client.release();
  }
}

// Delete CV
export async function deleteCV(id: number) {
  const t0 = Date.now();
  try {
    const result = await getPool().query("DELETE FROM resumes WHERE id = $1", [id]);
    logger.info("db.write", "done", {
      fn: "deleteCV",
      cvId: id,
      deleted: result.rowCount ?? 0,
      ms: Date.now() - t0,
    });
    return { success: true };
  } catch (error) {
    logger.error(
      "db.write",
      "delete failed",
      { fn: "deleteCV", cvId: id, ms: Date.now() - t0 },
      error as Error,
    );
    throw error;
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await getPool().query("SELECT 1");
    console.log("PostgreSQL connection successful");
    return true;
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    return false;
  }
}

// Update existing CV
export async function updateCV(
  cvId: number,
  data: {
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
    certificate: Array<{
      name: string;
      date: string;
    }>;
    skill: string[];
    reference: Array<{
      name: string;
      company: string;
      role: string;
      email: string;
      phone: string;
    }>;
    additionalInfo: string[];
  },
) {
  const t0 = Date.now();
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    // Update CV personal information
    await client.query(
      `UPDATE resumes
       SET full_name = $1, title = $2, phone = $3, email = $4, 
           location = $5, linkedin = $6, profile = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        data.personal.fullName,
        data.personal.title,
        data.personal.phone,
        data.personal.email,
        data.personal.location,
        data.personal.linkedin,
        data.profile,
        cvId,
      ],
    );

    // Delete and re-insert related records
    await client.query("DELETE FROM competencies WHERE resume_id = $1", [cvId]);
    await client.query("DELETE FROM experiences WHERE resume_id = $1", [cvId]);
    await client.query("DELETE FROM education WHERE resume_id = $1", [cvId]);
    await client.query("DELETE FROM certificates WHERE resume_id = $1", [cvId]);
    await client.query("DELETE FROM skills WHERE resume_id = $1", [cvId]);
    await client.query("DELETE FROM reference_list WHERE resume_id = $1", [cvId]);
    await client.query("DELETE FROM additional_info WHERE resume_id = $1", [cvId]);

    // Insert competencies
    for (const comp of data.competency.filter(Boolean)) {
      await client.query(
        "INSERT INTO competencies (resume_id, competency) VALUES ($1, $2)",
        [cvId, comp],
      );
    }

    // Insert experiences
    for (const exp of data.experiences.filter((e) => e.company || e.role)) {
      await client.query(
        "INSERT INTO experiences (resume_id, company, role, period, details) VALUES ($1, $2, $3, $4, $5)",
        [cvId, exp.company, exp.role, exp.period, exp.details],
      );
    }

    // Insert education
    for (const edu of data.education.filter(
      (e) => e.institution || e.qualification,
    )) {
      await client.query(
        "INSERT INTO education (resume_id, institution, qualification, period) VALUES ($1, $2, $3, $4)",
        [cvId, edu.institution, edu.qualification, edu.period],
      );
    }

    // Insert certificates
    for (const cert of data.certificate.filter((c) => c.name || c.date)) {
      await client.query(
        "INSERT INTO certificates (resume_id, name, date) VALUES ($1, $2, $3)",
        [cvId, cert.name, cert.date],
      );
    }

    // Insert skills
    for (const skill of data.skill.filter(Boolean)) {
      await client.query("INSERT INTO skills (resume_id, skill) VALUES ($1, $2)", [
        cvId,
        skill,
      ]);
    }

    // Insert references
    for (const ref of data.reference.filter((r) => r.name || r.company)) {
      await client.query(
        "INSERT INTO reference_list (resume_id, name, company, role, email, phone) VALUES ($1, $2, $3, $4, $5, $6)",
        [cvId, ref.name, ref.company, ref.role, ref.email, ref.phone],
      );
    }

    // Insert additional info
    for (const info of data.additionalInfo.filter(Boolean)) {
      await client.query(
        "INSERT INTO additional_info (resume_id, info) VALUES ($1, $2)",
        [cvId, info],
      );
    }

    await client.query("COMMIT");
    logger.info("db.write", "done", {
      fn: "updateCV",
      cvId,
      ms: Date.now() - t0,
    });
    return { success: true, cvId };
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(
      "db.write",
      "update failed",
      { fn: "updateCV", cvId, ms: Date.now() - t0 },
      error as Error,
    );
    throw error;
  } finally {
    client.release();
  }
}

// Photo management functions
export async function saveCVPhoto(
  cvId: number,
  photoData: {
    filename: string;
    original_name: string;
    mime_type: string;
    size: number;
    url: string;
  },
) {
  const client = await getPool().connect();

  try {
    // Delete existing photo for this CV
    await client.query("DELETE FROM resume_photos WHERE resume_id = $1", [cvId]);

    // Insert new photo
    const result = await client.query(
      `INSERT INTO resume_photos (resume_id, filename, original_name, mime_type, size, url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        cvId,
        photoData.filename,
        photoData.original_name,
        photoData.mime_type,
        photoData.size,
        photoData.url,
      ],
    );

    return { success: true, photo: result.rows[0] };
  } finally {
    client.release();
  }
}

export async function getCVPhoto(cvId: number): Promise<CVPhoto | null> {
  const result = await getPool().query(
    "SELECT * FROM resume_photos WHERE resume_id = $1 LIMIT 1",
    [cvId],
  );
  return result.rows[0] || null;
}

export async function deleteCVPhoto(cvId: number) {
  await getPool().query("DELETE FROM resume_photos WHERE resume_id = $1", [cvId]);
  return { success: true };
}

// Version management functions
export async function saveCVVersion(
  cvId: number,
  data: Record<string, unknown>,
) {
  const t0 = Date.now();
  const client = await getPool().connect();

  try {
    // Auto-prune: keep only 20 most recent versions
    await client.query(
      `
      DELETE FROM resume_versions
      WHERE resume_id = $1 AND id NOT IN (
        SELECT id FROM resume_versions
        WHERE resume_id = $1
        ORDER BY created_at DESC
        LIMIT 19
      )
    `,
      [cvId],
    );

    // Insert new version
    const result = await client.query(
      `INSERT INTO resume_versions (resume_id, data)
       VALUES ($1, $2)
       RETURNING *`,
      [cvId, JSON.stringify(data)],
    );

    logger.info("db.write", "done", {
      fn: "saveCVVersion",
      cvId,
      versionId: result.rows[0]?.id,
      ms: Date.now() - t0,
    });

    return { success: true, version: result.rows[0] };
  } finally {
    client.release();
  }
}

export async function getCVVersions(cvId: number): Promise<CVVersion[]> {
  const result = await getPool().query(
    "SELECT * FROM resume_versions WHERE resume_id = $1 ORDER BY created_at DESC",
    [cvId],
  );
  return result.rows;
}

export async function getCVVersion(
  versionId: number,
): Promise<CVVersion | null> {
  const result = await getPool().query(
    "SELECT * FROM resume_versions WHERE id = $1",
    [versionId],
  );
  return result.rows[0] || null;
}

// Get CV with template settings
export async function getCVWithSettings(id: number) {
  const result = await getPool().query(
    "SELECT *, template_settings FROM resumes WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
}

// Update CV template settings
export async function updateCVTemplateSettings(
  cvId: number,
  settings: TemplateSettings,
) {
  await getPool().query("UPDATE resumes SET template_settings = $1 WHERE id = $2", [
    JSON.stringify(settings),
    cvId,
  ]);
  return { success: true };
}

export async function setCVReady(
  cvId: number,
  ready: boolean,
): Promise<{ success: true; cvId: number }> {
  await getPool().query(
    "UPDATE resumes SET ready_override = $1 WHERE id = $2",
    [ready, cvId],
  );
  return { success: true, cvId };
}

// Resolve a public slug back to its numeric id
export async function resolveSlug(slug: string): Promise<number | null> {
  const result = await getPool().query(
    "SELECT id FROM resumes WHERE slug = $1",
    [slug],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0].id as number;
}
