// app/lib/db.ts - PostgreSQL Version
import { Pool, QueryResult } from "pg";

let pool: Pool | null = null;

interface CVPhoto {
  id: number;
  cv_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: Date;
}

interface CVVersion {
  id: number;
  cv_id: number;
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
    // Create CVs table with template_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS cvs (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        location VARCHAR(255),
        linkedin VARCHAR(255),
        profile TEXT,
        template_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add template_settings column if it doesn't exist
    await client.query(`
      ALTER TABLE cvs ADD COLUMN IF NOT EXISTS template_settings JSONB DEFAULT '{}'
    `);

    // Create index if not exists
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cvs_full_name') THEN
          CREATE INDEX idx_cvs_full_name ON cvs(full_name);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cvs_email') THEN
          CREATE INDEX idx_cvs_email ON cvs(email);
        END IF;
      END $$
    `);

    // Create CV Photos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cv_photos (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
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
      CREATE TABLE IF NOT EXISTS cv_versions (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create CV versions index
    await client.query(`
      DO $$
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cv_versions_cv_id') THEN
          CREATE INDEX idx_cv_versions_cv_id ON cv_versions(cv_id);
        END IF;
      END $$
    `);

    // Create Competencies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS competencies (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
        competency VARCHAR(255) NOT NULL
      )
    `);

    // Create Experiences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS experiences (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
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
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
        institution VARCHAR(255),
        qualification VARCHAR(255),
        period VARCHAR(255)
      )
    `);

    // Create Certificates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
        name VARCHAR(255),
        date VARCHAR(255)
      )
    `);

    // Create Skills table
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
        skill VARCHAR(255) NOT NULL
      )
    `);

    // Create References table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reference_list (
        id SERIAL PRIMARY KEY,
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
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
        cv_id INTEGER NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
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
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    // Insert CV personal information
    const cvResult = await client.query(
      `INSERT INTO cvs (full_name, title, phone, email, location, linkedin, profile, template_settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        data.personal.fullName,
        data.personal.title,
        data.personal.phone,
        data.personal.email,
        data.personal.location,
        data.personal.linkedin,
        data.profile,
        data.templateSettings ? JSON.stringify(data.templateSettings) : '{}',
      ],
    );
    const cvId = cvResult.rows[0].id;

    // Insert competencies
    for (const comp of data.competency.filter(Boolean)) {
      await client.query(
        "INSERT INTO competencies (cv_id, competency) VALUES ($1, $2)",
        [cvId, comp],
      );
    }

    // Insert experiences
    for (const exp of data.experiences.filter((e) => e.company || e.role)) {
      await client.query(
        "INSERT INTO experiences (cv_id, company, role, period, details) VALUES ($1, $2, $3, $4, $5)",
        [cvId, exp.company, exp.role, exp.period, exp.details],
      );
    }

    // Insert education
    for (const edu of data.education.filter((e) => e.institution || e.qualification)) {
      await client.query(
        "INSERT INTO education (cv_id, institution, qualification, period) VALUES ($1, $2, $3, $4)",
        [cvId, edu.institution, edu.qualification, edu.period],
      );
    }

    // Insert certificates
    for (const cert of data.certificate.filter((c) => c.name || c.date)) {
      await client.query(
        "INSERT INTO certificates (cv_id, name, date) VALUES ($1, $2, $3)",
        [cvId, cert.name, cert.date],
      );
    }

    // Insert skills
    for (const skill of data.skill.filter(Boolean)) {
      await client.query("INSERT INTO skills (cv_id, skill) VALUES ($1, $2)", [
        cvId,
        skill,
      ]);
    }

    // Insert references
    for (const ref of data.reference.filter((r) => r.name || r.company)) {
      await client.query(
        "INSERT INTO reference_list (cv_id, name, company, role, email, phone) VALUES ($1, $2, $3, $4, $5, $6)",
        [cvId, ref.name, ref.company, ref.role, ref.email, ref.phone],
      );
    }

    // Insert additional info
    for (const info of data.additionalInfo.filter(Boolean)) {
      await client.query("INSERT INTO additional_info (cv_id, info) VALUES ($1, $2)", [
        cvId,
        info,
      ]);
    }

    await client.query("COMMIT");
    return { success: true, cvId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving CV:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Get all CVs
export async function getAllCVs() {
  const result = await getPool().query(
    `SELECT id, full_name as "fullName", title, phone, email, location, linkedin, profile,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM cvs ORDER BY updated_at DESC`,
  );
  return result.rows;
}

// Get single CV
export async function getCV(id: number) {
  const client = await getPool().connect();

  try {
    // Get CV basic info
    const cvResult = await client.query(
      "SELECT * FROM cvs WHERE id = $1",
      [id],
    );
    if (cvResult.rows.length === 0) {
      throw new Error("CV not found");
    }
    const cv = cvResult.rows[0];

    // Get experiences
    const expResult = await client.query(
      "SELECT * FROM experiences WHERE cv_id = $1 ORDER BY id",
      [id],
    );
    cv.experiences = expResult.rows;

    // Get education
    const eduResult = await client.query(
      "SELECT * FROM education WHERE cv_id = $1 ORDER BY id",
      [id],
    );
    cv.education = eduResult.rows;

    // Get competencies
    const compResult = await client.query(
      "SELECT competency FROM competencies WHERE cv_id = $1",
      [id],
    );
    cv.competency = compResult.rows.map((r) => r.competency);

    // Get certificates
    const certResult = await client.query(
      "SELECT name, date FROM certificates WHERE cv_id = $1",
      [id],
    );
    cv.certificate = certResult.rows;

    // Get skills
    const skillResult = await client.query(
      "SELECT skill FROM skills WHERE cv_id = $1",
      [id],
    );
    cv.skill = skillResult.rows.map((r) => r.skill);

    // Get references
    const refResult = await client.query(
      "SELECT * FROM reference_list WHERE cv_id = $1",
      [id],
    );
    cv.reference = refResult.rows;

    // Get additional info
    const infoResult = await client.query(
      "SELECT info FROM additional_info WHERE cv_id = $1",
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
  await getPool().query("DELETE FROM cvs WHERE id = $1", [id]);
  return { success: true };
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
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    // Update CV personal information
    await client.query(
      `UPDATE cvs 
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
    await client.query("DELETE FROM competencies WHERE cv_id = $1", [cvId]);
    await client.query("DELETE FROM experiences WHERE cv_id = $1", [cvId]);
    await client.query("DELETE FROM education WHERE cv_id = $1", [cvId]);
    await client.query("DELETE FROM certificates WHERE cv_id = $1", [cvId]);
    await client.query("DELETE FROM skills WHERE cv_id = $1", [cvId]);
    await client.query("DELETE FROM reference_list WHERE cv_id = $1", [cvId]);
    await client.query("DELETE FROM additional_info WHERE cv_id = $1", [cvId]);

    // Insert competencies
    for (const comp of data.competency.filter(Boolean)) {
      await client.query(
        "INSERT INTO competencies (cv_id, competency) VALUES ($1, $2)",
        [cvId, comp],
      );
    }

    // Insert experiences
    for (const exp of data.experiences.filter((e) => e.company || e.role)) {
      await client.query(
        "INSERT INTO experiences (cv_id, company, role, period, details) VALUES ($1, $2, $3, $4, $5)",
        [cvId, exp.company, exp.role, exp.period, exp.details],
      );
    }

    // Insert education
    for (const edu of data.education.filter((e) => e.institution || e.qualification)) {
      await client.query(
        "INSERT INTO education (cv_id, institution, qualification, period) VALUES ($1, $2, $3, $4)",
        [cvId, edu.institution, edu.qualification, edu.period],
      );
    }

    // Insert certificates
    for (const cert of data.certificate.filter((c) => c.name || c.date)) {
      await client.query("INSERT INTO certificates (cv_id, name, date) VALUES ($1, $2, $3)", [
        cvId,
        cert.name,
        cert.date,
      ]);
    }

    // Insert skills
    for (const skill of data.skill.filter(Boolean)) {
      await client.query("INSERT INTO skills (cv_id, skill) VALUES ($1, $2)", [cvId, skill]);
    }

    // Insert references
    for (const ref of data.reference.filter((r) => r.name || r.company)) {
      await client.query(
        "INSERT INTO reference_list (cv_id, name, company, role, email, phone) VALUES ($1, $2, $3, $4, $5, $6)",
        [cvId, ref.name, ref.company, ref.role, ref.email, ref.phone],
      );
    }

    // Insert additional info
    for (const info of data.additionalInfo.filter(Boolean)) {
      await client.query("INSERT INTO additional_info (cv_id, info) VALUES ($1, $2)", [cvId, info]);
    }

    await client.query("COMMIT");
    return { success: true, cvId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating CV:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Photo management functions
export async function saveCVPhoto(cvId: number, photoData: {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
}) {
  const client = await getPool().connect();

  try {
    // Delete existing photo for this CV
    await client.query("DELETE FROM cv_photos WHERE cv_id = $1", [cvId]);

    // Insert new photo
    const result = await client.query(
      `INSERT INTO cv_photos (cv_id, filename, original_name, mime_type, size, url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [cvId, photoData.filename, photoData.original_name, photoData.mime_type, photoData.size, photoData.url],
    );

    return { success: true, photo: result.rows[0] };
  } finally {
    client.release();
  }
}

export async function getCVPhoto(cvId: number): Promise<CVPhoto | null> {
  const result = await getPool().query(
    "SELECT * FROM cv_photos WHERE cv_id = $1 LIMIT 1",
    [cvId],
  );
  return result.rows[0] || null;
}

export async function deleteCVPhoto(cvId: number) {
  await getPool().query("DELETE FROM cv_photos WHERE cv_id = $1", [cvId]);
  return { success: true };
}

// Version management functions
export async function saveCVVersion(cvId: number, data: Record<string, unknown>) {
  const client = await getPool().connect();

  try {
    // Auto-prune: keep only 20 most recent versions
    await client.query(`
      DELETE FROM cv_versions
      WHERE cv_id = $1 AND id NOT IN (
        SELECT id FROM cv_versions
        WHERE cv_id = $1
        ORDER BY created_at DESC
        LIMIT 19
      )
    `, [cvId]);

    // Insert new version
    const result = await client.query(
      `INSERT INTO cv_versions (cv_id, data)
       VALUES ($1, $2)
       RETURNING *`,
      [cvId, JSON.stringify(data)],
    );

    return { success: true, version: result.rows[0] };
  } finally {
    client.release();
  }
}

export async function getCVVersions(cvId: number): Promise<CVVersion[]> {
  const result = await getPool().query(
    "SELECT * FROM cv_versions WHERE cv_id = $1 ORDER BY created_at DESC",
    [cvId],
  );
  return result.rows;
}

export async function getCVVersion(versionId: number): Promise<CVVersion | null> {
  const result = await getPool().query(
    "SELECT * FROM cv_versions WHERE id = $1",
    [versionId],
  );
  return result.rows[0] || null;
}

// Get CV with template settings
export async function getCVWithSettings(id: number) {
  const result = await getPool().query(
    "SELECT *, template_settings FROM cvs WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
}

// Update CV template settings
export async function updateCVTemplateSettings(cvId: number, settings: TemplateSettings) {
  await getPool().query(
    "UPDATE cvs SET template_settings = $1 WHERE id = $2",
    [JSON.stringify(settings), cvId],
  );
  return { success: true };
}