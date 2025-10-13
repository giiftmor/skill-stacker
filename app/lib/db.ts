// app/lib/db.ts - MySQL Version 2.0
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cvbuilder',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Initialize database connection pool
export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Track if database has been initialized
let isInitialized = false;

// Initialize database tables
export async function initDb() {
   console.log('🔴 initDb() STARTED');
  console.log('🔴 Current isInitialized:', isInitialized);
  // If already initialized, skip
  if (isInitialized) {
     console.log('🔴 Already initialized, returning early');
    return;
  }
  console.log('🔴 Creating initPromise...');
  // Create a special connection without specifying database (for creation)
  const initConnection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  
  let connection: mysql.PoolConnection | null = null;
  try {
    // Create database if it doesn't exist
    await initConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`✅ Database '${dbConfig.database}' ready`);

    // Now get regular connection with database selected
    connection = await getPool().getConnection();
    
    await connection.query(`USE ${dbConfig.database}`);

    // Create CVs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cvs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        location VARCHAR(255),
        profile TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_full_name (full_name),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create Skills table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cv_id INT NOT NULL,
        skill VARCHAR(255) NOT NULL,
        FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE,
        INDEX idx_cv_id (cv_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create Experiences table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS experiences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cv_id INT NOT NULL,
        company VARCHAR(255),
        role VARCHAR(255),
        period VARCHAR(255),
        details TEXT,
        FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE,
        INDEX idx_cv_id (cv_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create Education table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS education (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cv_id INT NOT NULL,
        institution VARCHAR(255),
        qualification VARCHAR(255),
        period VARCHAR(255),
        FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE,
        INDEX idx_cv_id (cv_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create References table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reference_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cv_id INT NOT NULL,
        reference TEXT NOT NULL,
        FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE,
        INDEX idx_cv_id (cv_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        
    // Close init connection
    await initConnection.end();

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
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
  };
  profile: string;
  skills: string[];
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
  references: string[];
}) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    // Insert CV personal information
    const [result] = await connection.query(
      `INSERT INTO cvs (full_name, title, phone, email, location, profile)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.personal.fullName,
        data.personal.title,
        data.personal.phone,
        data.personal.email,
        data.personal.location,
        data.profile
      ]
    );

    const cvId = (result as mysql.ResultSetHeader).insertId;

    // Insert skills
    if (data.skills.filter(Boolean).length > 0) {
      const skillValues = data.skills
        .filter(Boolean)
        .map(skill => [cvId, skill]);
      
      await connection.query(
        'INSERT INTO skills (cv_id, skill) VALUES ?',
        [skillValues]
      );
    }

    // Insert experiences
    const validExperiences = data.experiences.filter(e => e.company || e.role);
    if (validExperiences.length > 0) {
      const expValues = validExperiences.map(exp => [
        cvId,
        exp.company,
        exp.role,
        exp.period,
        exp.details
      ]);
      
      await connection.query(
        `INSERT INTO experiences (cv_id, company, role, period, details)
         VALUES ?`,
        [expValues]
      );
    }

    // Insert education
    const validEducation = data.education.filter(e => e.institution || e.qualification);
    if (validEducation.length > 0) {
      const eduValues = validEducation.map(edu => [
        cvId,
        edu.institution,
        edu.qualification,
        edu.period
      ]);
      
      await connection.query(
        `INSERT INTO education (cv_id, institution, qualification, period)
         VALUES ?`,
        [eduValues]
      );
    }

    // Insert references
    if (data.references.filter(Boolean).length > 0) {
      const refValues = data.references
        .filter(Boolean)
        .map(ref => [cvId, ref]);
      
      await connection.query(
        'INSERT INTO reference_list (cv_id, reference) VALUES ?',
        [refValues]
      );
    }

    await connection.commit();
    return { success: true, cvId };
  } catch (error) {
    await connection.rollback();
    console.error('Error saving CV:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Update existing CV
export async function updateCV(cvId: number, data: any) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();

    // Update CV personal information
    await connection.query(
      `UPDATE cvs 
       SET full_name = ?, title = ?, phone = ?, email = ?, location = ?, 
           profile = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.personal.fullName,
        data.personal.title,
        data.personal.phone,
        data.personal.email,
        data.personal.location,
        data.profile,
        cvId
      ]
    );

    // Delete existing related records
    await connection.query('DELETE FROM skills WHERE cv_id = ?', [cvId]);
    await connection.query('DELETE FROM experiences WHERE cv_id = ?', [cvId]);
    await connection.query('DELETE FROM education WHERE cv_id = ?', [cvId]);
    await connection.query('DELETE FROM reference_list WHERE cv_id = ?', [cvId]);

    // Re-insert new data
    if (data.skills.filter(Boolean).length > 0) {
      const skillValues = data.skills
        .filter(Boolean)
        .map((skill: string) => [cvId, skill]);
      
      await connection.query(
        'INSERT INTO skills (cv_id, skill) VALUES ?',
        [skillValues]
      );
    }

    const validExperiences = data.experiences.filter((e: any) => e.company || e.role);
    if (validExperiences.length > 0) {
      const expValues = validExperiences.map((exp: any) => [
        cvId,
        exp.company,
        exp.role,
        exp.period,
        exp.details
      ]);
      
      await connection.query(
        `INSERT INTO experiences (cv_id, company, role, period, details)
         VALUES ?`,
        [expValues]
      );
    }

    const validEducation = data.education.filter((e: any) => e.institution || e.qualification);
    if (validEducation.length > 0) {
      const eduValues = validEducation.map((edu: any) => [
        cvId,
        edu.institution,
        edu.qualification,
        edu.period
      ]);
      
      await connection.query(
        `INSERT INTO education (cv_id, institution, qualification, period)
         VALUES ?`,
        [eduValues]
      );
    }

    if (data.references.filter(Boolean).length > 0) {
      const refValues = data.references
        .filter(Boolean)
        .map((ref: string) => [cvId, ref]);
      
      await connection.query(
        'INSERT INTO reference_list (cv_id, reference) VALUES ?',
        [refValues]
      );
    }

    await connection.commit();
    return { success: true, cvId };
  } catch (error) {
    await connection.rollback();
    console.error('Error updating CV:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Get CV by ID
export async function getCV(cvId: number) {
  const connection = await getPool().getConnection();

  try {
    const [cvRows] = await connection.query(
      'SELECT * FROM cvs WHERE id = ?',
      [cvId]
    );
    
    const cvArray = cvRows as mysql.RowDataPacket[];
    if (cvArray.length === 0) return null;
    
    const cv = cvArray[0];

    const [skillRows] = await connection.query(
      'SELECT skill FROM skills WHERE cv_id = ? ORDER BY id',
      [cvId]
    );

    const [experienceRows] = await connection.query(
      'SELECT company, role, period, details FROM experiences WHERE cv_id = ? ORDER BY id',
      [cvId]
    );

    const [educationRows] = await connection.query(
      'SELECT institution, qualification, period FROM education WHERE cv_id = ? ORDER BY id',
      [cvId]
    );

    const [referenceRows] = await connection.query(
      'SELECT reference FROM reference_list WHERE cv_id = ? ORDER BY id',
      [cvId]
    );

    return {
      personal: {
        fullName: cv.full_name,
        title: cv.title,
        phone: cv.phone,
        email: cv.email,
        location: cv.location
      },
      profile: cv.profile,
      skills: (skillRows as mysql.RowDataPacket[]).map(s => s.skill),
      experiences: experienceRows as mysql.RowDataPacket[],
      education: educationRows as mysql.RowDataPacket[],
      references: (referenceRows as mysql.RowDataPacket[]).map(r => r.reference),
      createdAt: cv.created_at,
      updatedAt: cv.updated_at
    };
  } finally {
    connection.release();
  }
}

// Get all CVs (summary list)
export async function getAllCVs() {
  const connection = await getPool().getConnection();

  try {
    const [rows] = await connection.query(
      'SELECT id, full_name, title, email, created_at, updated_at FROM cvs ORDER BY updated_at DESC'
    );

    return (rows as mysql.RowDataPacket[]).map(cv => ({
      id: cv.id,
      fullName: cv.full_name,
      title: cv.title,
      email: cv.email,
      createdAt: cv.created_at,
      updatedAt: cv.updated_at
    }));
  } finally {
    connection.release();
  }
}

// Delete CV
export async function deleteCV(cvId: number) {
  const connection = await getPool().getConnection();

  try {
    await connection.query('DELETE FROM cvs WHERE id = ?', [cvId]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting CV:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Test database connection
export async function testConnection() {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}