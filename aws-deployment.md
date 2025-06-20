# AWS 배포 가이드

## 1. RDS 설정

### RDS 인스턴스 정보
- **엔드포인트**: `your-rds-endpoint.region.rds.amazonaws.com`
- **포트**: 5432
- **데이터베이스 이름**: `memo_db`
- **사용자명**: `postgres`
- **비밀번호**: `your-password`

### 환경 변수 설정 (.env)
```env
# Database
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=memo_db
DB_USER=postgres
DB_PASSWORD=your-password

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# JWT
JWT_SECRET=your-jwt-secret
```

## 2. 데이터베이스 마이그레이션

### 로컬에서 RDS로 데이터 이전
```bash
# 로컬 DB 덤프
pg_dump -h localhost -U postgres -d memo_db > local_dump.sql

# RDS로 복원
psql -h your-rds-endpoint -U postgres -d memo_db < local_dump.sql
```

## 3. 애플리케이션 연결 테스트

### 연결 확인
```bash
# PostgreSQL 클라이언트로 연결 테스트
psql -h your-rds-endpoint -U postgres -d memo_db
```

## 4. 다음 단계
- EC2 인스턴스 생성
- VPC 설정
- ELB 구성
- 애플리케이션 배포 