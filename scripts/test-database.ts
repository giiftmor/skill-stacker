// scripts/test-database.ts
// Run with: npx ts-node scripts/test-database.ts
// Or create an API route at: app/api/test-db/route.ts

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env file 
async function testDatabaseSetup() {
  console.log('🔍 Testing Database Setup...\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'skill_stacker',
  };

  console.log('📋 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.password ? '***' : '(empty)'}`);
  console.log(`   Database: ${config.database}\n`);

  try {
    // Step 1: Test MySQL connection (without database)
    console.log('1️⃣ Testing MySQL server connection...');
    const initConn = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
    });
    console.log('   ✅ MySQL server is reachable\n');

    // Step 2: Check if database exists
    console.log('2️⃣ Checking if database exists...');
    const [databases] = await initConn.query(
      `SHOW DATABASES LIKE '${config.database}'`
    );

    if ((databases as any[]).length === 0) {
      console.log(`   ⚠️  Database '${config.database}' does not exist`);
      console.log(`   📝 Creating database...`);

      await initConn.query(`CREATE DATABASE ${config.database}`);
      console.log(`   ✅ Database '${config.database}' created\n`);
      
    } else {
      console.log(`   ✅ Database '${config.database}' exists\n`);
    }

    await initConn.end();

    // Step 3: Connect to database and check tables
    console.log('3️⃣ Connecting to database...');
    const dbConn = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    console.log('   ✅ Connected to database\n');

    // Step 4: Check tables
    console.log('4️⃣ Checking tables...');
    const [tables] = await dbConn.query('SHOW TABLES');

    const tableNames = (tables as any[]).map(
      (row) => row[`Tables_in_${config.database}`]
    );

    const requiredTables = ['cvs', 'skills', 'experiences', 'education', 'reference_list'];
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log(`   💡 Tables will be created when you run the app`);
    } else {
      console.log(`   ✅ All required tables exist:`);
      requiredTables.forEach((table) => {
        console.log(`      - ${table}`);
      });
    }
    console.log('');

    // Step 5: Check table structures
    if (tableNames.includes('cvs')) {
      console.log('5️⃣ Checking CVs table structure...');
      const [columns] = await dbConn.query('DESCRIBE cvs');
      console.log(`   ✅ CVs table has ${(columns as any[]).length} columns`);
      (columns as any[]).forEach((col: any) => {
        console.log(`      - ${col.Field} (${col.Type})`);
      });
      console.log('');
    }

    // Step 6: Count records
    if (tableNames.includes('cvs')) {
      console.log('6️⃣ Counting records...');
      const [countResult] = await dbConn.query('SELECT COUNT(*) as count FROM cvs');
      const count = (countResult as any[])[0].count;
      console.log(`   📊 Database contains ${count} CV(s)\n`);
    }

    await dbConn.end();

    // Final summary
    console.log('✅ DATABASE TEST COMPLETE!\n');
    console.log('Summary:');
    console.log('  ✓ MySQL server is running');
    console.log(`  ✓ Database '${config.database}' exists`);
    console.log(`  ✓ Connection successful`);

    if (missingTables.length === 0) {
      console.log('  ✓ All tables are present');
      console.log('\n🎉 Your database is ready to use!');
    } else {
      console.log('  ⚠️  Some tables missing (will auto-create)');
      console.log('\n💡 Start your app with: npm run dev');
    }

  } catch (error: any) {
    console.error('\n❌ TEST FAILED!\n');

    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 Cannot connect to MySQL server');
      console.error('\nPossible solutions:');
      console.error('  1. Make sure MySQL is running');
      console.error('  2. Check if port 3306 is correct');
      console.error('  3. Verify host is "localhost"');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔴 Access denied');
      console.error('\nPossible solutions:');
      console.error('  1. Check username and password in .env.local');
      console.error('  2. Try empty password for XAMPP: DB_PASSWORD=');
      console.error('  3. Verify user has permissions');
    } else {
      console.error('Error details:', error.message);
      console.error('\nFull error:', error);
    }

    process.exit(1);
  }
}

// Run the test
testDatabaseSetup()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });