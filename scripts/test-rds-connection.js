const { Pool } = require('pg');
require('dotenv').config();

const testRDSConnection = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false // 개발용 설정
    }
  });

  try {
    console.log('🔄 RDS 연결 테스트 중...');
    
    // 연결 테스트
    const client = await pool.connect();
    console.log('✅ RDS 연결 성공!');
    
    // 테이블 확인
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 데이터베이스 테이블:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
    
    console.log('✅ RDS 연결 테스트 완료!');
  } catch (error) {
    console.error('❌ RDS 연결 실패:', error.message);
    process.exit(1);
  }
};

testRDSConnection(); 