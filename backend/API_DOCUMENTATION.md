# API Documentation - LMS E-Learning Platform

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-api-domain.com/api`

---

## Public Routes (No Authentication Required)

### 1. Get Available Tiers
Get list of subscription tiers for tenant registration.

**Endpoint**: `GET /api/public/tiers`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tier_id",
      "nama": "free",
      "label": "Free",
      "harga": 0,
      "maxSiswa": 50,
      "maxGuru": 5,
      "maxKelas": 5,
      "maxMapel": 10,
      "maxUjian": 10,
      "maxStorage": 500,
      "fitur": { "aiChatbot": false, "exportPdf": true },
      "isActive": true,
      "urutan": 0
    }
  ]
}
```

---

### 2. Register New School (Tenant)
Register a new school/tenant with admin account.

**Endpoint**: `POST /api/public/register`

**Request Body**:
```json
{
  "namaSekolah": "SMA Negeri 1 Jakarta",
  "email": "admin@sman1jakarta.sch.id",
  "password": "securePassword123",
  "namaAdmin": "John Doe",
  "alamat": "Jl. Pendidikan No. 1, Jakarta",
  "noTelp": "021-1234567"
}
```

**Required Fields**:
| Field | Type | Description |
|-------|------|-------------|
| namaSekolah | string | School name (min 1 char) |
| email | string | Admin email (valid email format) |
| password | string | Admin password (min 6 chars) |
| namaAdmin | string | Admin name (min 1 char) |

**Optional Fields**:
| Field | Type | Description |
|-------|------|-------------|
| alamat | string | School address |
| noTelp | string | Phone number |

**Success Response** (201):
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "schoolId": "school_id",
    "email": "admin@sman1jakarta.sch.id"
  }
}
```

**Error Responses**:
- `400`: Email sudah terdaftar
- `500`: Free tier not found / Server error

---

### 3. Get Landing Media
Get media for landing page.

**Endpoint**: `GET /api/public/landing-media`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "media_id",
      "type": "image",
      "url": "https://...",
      "title": "Feature 1",
      "description": "...",
      "order": 1,
      "isActive": true
    }
  ]
}
```

---

## Authentication Routes

### 1. Login
Authenticate user and get JWT token.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@school.com",
  "password": "password123"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@school.com",
      "role": "ADMIN",
      "schoolId": "school_id"
    }
  }
}
```

**Note**: JWT token is set as HTTP-only cookie.

---

### 2. Logout
Clear authentication cookie.

**Endpoint**: `POST /api/auth/logout`

**Response**:
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

### 3. Get Current User
Get authenticated user info.

**Endpoint**: `GET /api/auth/me`

**Headers**: Cookie with JWT token

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@school.com",
    "role": "ADMIN",
    "schoolId": "school_id"
  }
}
```

---

## Tier Structure

| Tier | Max Siswa | Max Guru | Max Kelas | Max Mapel | Max Ujian | Max Storage |
|------|-----------|----------|-----------|-----------|-----------|-------------|
| Free | 50 | 5 | 5 | 10 | 10 | 500 MB |
| Starter | 100 | 10 | 10 | 20 | 50 | 1 GB |
| Basic | 300 | 20 | 20 | 50 | 100 | 5 GB |
| Professional | 1000 | 50 | 50 | 100 | 500 | 20 GB |
| Enterprise | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited | 100 GB |

---

## Multi-Tenant Architecture

This API uses multi-tenant architecture where:
- Each school is a separate tenant
- All data is isolated by `schoolId`
- Users can only access data from their own school
- Tier limits are enforced per school

### Security Features:
1. **JWT Authentication**: HTTP-only cookies
2. **Role-based Access**: ADMIN, GURU, SISWA
3. **Tenant Isolation**: All queries filtered by schoolId
4. **Timezone**: Asia/Jakarta (UTC+7)

---

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (no permission / tier limit)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

- **Public routes**: 100 requests/minute
- **Authenticated routes**: 1000 requests/minute

---

## CORS Configuration

Allowed origins (configurable via `CORS_ORIGINS` env):
- `http://localhost:3000`
- `http://localhost:3001`
- Production frontend URL

Credentials (cookies) are included in cross-origin requests.

---

## File Upload (Cloudflare R2)

All file uploads are stored in Cloudflare R2 with the following structure:
```
{schoolId}/{folder}/{filename}_{timestamp}_{random}.{ext}
```

### 1. Upload Base64 Image
**Endpoint**: `POST /api/upload/r2`

**Request Body**:
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
  "fileName": "my-image",
  "folder": "uploads"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://storage.nilai.online/schoolId/uploads/my-image_123456_abc123.png",
    "key": "schoolId/uploads/my-image_123456_abc123.png"
  }
}
```

### 2. Upload Soal Image (Guru)
**Endpoint**: `POST /api/upload/soal`

**Request Body**:
```json
{
  "imageBase64": "data:image/png;base64,...",
  "ujianId": "ujian_123",
  "soalIndex": 1
}
```

### 3. Upload Jawaban Image (Siswa)
**Endpoint**: `POST /api/upload/jawaban`

**Request Body**:
```json
{
  "imageBase64": "data:image/png;base64,...",
  "ujianId": "ujian_123",
  "soalId": "soal_456"
}
```

### 4. Upload Profile Image
**Endpoint**: `POST /api/upload/profile`

**Request Body**:
```json
{
  "imageBase64": "data:image/png;base64,..."
}
```

### 5. Upload File (Multipart Form)
**Endpoint**: `POST /api/upload/file`

**Request**: `multipart/form-data`
- `file`: File to upload
- `folder`: Target folder (optional, default: "files")

### 6. Delete File
**Endpoint**: `DELETE /api/upload`

**Request Body**:
```json
{
  "url": "https://storage.nilai.online/schoolId/uploads/file.png"
}
```
or
```json
{
  "key": "schoolId/uploads/file.png"
}
```

### R2 Configuration
Environment variables required:
```
R2_ACCESS_KEY_ID=your_access_key
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=e-learning
R2_PUBLIC_URL=https://storage.nilai.online
R2_SECRET_ACCESS_KEY=your_secret_key
```
