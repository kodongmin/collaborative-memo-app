const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'memo_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // RDS 연결을 위한 SSL 설정
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com') 
    ? { rejectUnauthorized: false }
    : false,
  // 연결 풀 설정
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
  connectionTimeoutMillis: 2000, // 연결 타임아웃
});

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = pool; 