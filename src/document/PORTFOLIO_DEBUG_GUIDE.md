# 🐛 Hướng Dẫn Debug Lỗi 500 Portfolio Service

## ❌ Lỗi Hiện Tại
```
GET http://localhost:8080/api/portfolio/profile/check 500 (Internal Server Error)
AxiosError {message: 'Request failed with status code 500'...}
```

## 🔍 Các Bước Debug

### 1. **Kiểm Tra Backend Có Chạy Không**
```powershell
# Check backend port
netstat -ano | findstr :8080

# Hoặc test với curl
curl http://localhost:8080/actuator/health
```

### 2. **Sử Dụng Trang Debug**
Truy cập: **http://localhost:5173/portfolio-debug**

Trang này sẽ giúp bạn:
- ✅ Kiểm tra JWT token có present không
- 🧪 Test từng endpoint riêng lẻ
- 📊 Xem response chi tiết (status, data, error message)
- 🔍 Log toàn bộ request/response ra console

### 3. **Kiểm Tra Authentication**
```javascript
// Mở Console (F12) và check:
console.log('Token:', localStorage.getItem('token'));
console.log('User ID:', localStorage.getItem('userId'));

// Token phải:
// - Tồn tại (không null)
// - Chưa expired
// - Có format: Bearer eyJ...
```

### 4. **Kiểm Tra Backend Logs**
```powershell
cd C:\WorkSpace\EXE201\SkillVerse_BackEnd

# Xem logs từ terminal backend đang chạy
# Tìm dòng:
# - "Error checking extended profile"
# - SQLException
# - NullPointerException
# - "Table not found"
```

### 5. **Kiểm Tra Database**
Lỗi 500 thường do:
```sql
-- Check table tồn tại
SHOW TABLES LIKE 'portfolio_extended_profile';

-- Check user có data không
SELECT * FROM users WHERE id = YOUR_USER_ID;

-- Check extended profile
SELECT * FROM portfolio_extended_profile WHERE user_id = YOUR_USER_ID;
```

### 6. **Test Endpoint Trực Tiếp**
```powershell
# Lấy token từ localStorage (F12 -> Application -> Local Storage)
$token = "eyJ..."

# Test endpoint
curl -X GET "http://localhost:8080/api/portfolio/profile/check" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -v
```

## 🛠️ Code Updates Đã Thực Hiện

### 1. **Enhanced Error Handling trong portfolioService.ts**
```typescript
export const checkExtendedProfile = async (): Promise<CheckExtendedProfileResponse> => {
  try {
    const response = await api.get<CheckExtendedProfileResponse>('/profile/check');
    return response.data;
  } catch (error: any) {
    console.error('Error checking extended profile:', error.response?.data || error.message);
    // If error, assume no extended profile (graceful fallback)
    return { success: false, hasExtendedProfile: false };
  }
};
```

### 2. **Enhanced Logging trong PortfolioPage.tsx**
```typescript
const loadPortfolioData = async () => {
  // ...
  console.log('🔍 Starting portfolio data load...');
  console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
  console.log('✅ Check result:', checkResult);
  console.log('❌ Error:', err.response?.data);
  // ...
};
```

### 3. **Created PortfolioDebug.tsx**
- Trang debug riêng tại `/portfolio-debug`
- Test từng endpoint độc lập
- Hiển thị full request/response details

## 🎯 Nguyên Nhân Có Thể

### **Lỗi 500 thường do:**

1. **Database Issues** (80%)
   - Table `portfolio_extended_profile` chưa được tạo
   - Migration chưa chạy
   - Connection pool hết
   - Foreign key constraint fail

2. **Authentication Issues** (15%)
   - JWT token invalid/expired
   - User không tồn tại trong DB
   - SecurityContext null

3. **Backend Code Issues** (5%)
   - NullPointerException
   - Service method bug
   - Missing @Transactional

## ✅ Giải Pháp

### **Option 1: Check & Run Migrations**
```powershell
cd C:\WorkSpace\EXE201\SkillVerse_BackEnd

# Check migration files
ls src/main/resources/db/migration

# Hoặc check init scripts
ls init-scripts

# Re-run migrations nếu cần
mvn flyway:migrate
# hoặc
docker-compose down -v
docker-compose up -d
```

### **Option 2: Check Backend Console**
Nhìn vào terminal backend đang chạy:
```
[ERROR] ... SQLException: Table 'portfolio_extended_profile' doesn't exist
[ERROR] ... NullPointerException at PortfolioService.hasExtendedProfile
```

### **Option 3: Recreate Tables**
```sql
-- File: init-scripts/portfolio_tables.sql
CREATE TABLE IF NOT EXISTS portfolio_extended_profile (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    custom_url_slug VARCHAR(100) UNIQUE,
    professional_title VARCHAR(200),
    location VARCHAR(200),
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    top_skills JSON,
    languages_spoken JSON,
    portfolio_avatar_url VARCHAR(500),
    portfolio_video_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    linkedin_url VARCHAR(300),
    github_url VARCHAR(300),
    behance_url VARCHAR(300),
    dribbble_url VARCHAR(300),
    personal_website VARCHAR(300),
    is_public BOOLEAN DEFAULT true,
    show_contact_info BOOLEAN DEFAULT true,
    allow_job_offers BOOLEAN DEFAULT true,
    portfolio_views INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    meta_description TEXT,
    total_projects INT DEFAULT 0,
    total_certificates INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **Option 4: Fallback Handling (Already Implemented)**
Code bây giờ sẽ không crash nếu backend lỗi:
- Gracefully return `hasExtendedProfile: false`
- Show "Create Portfolio" screen
- User có thể thử lại

## 📝 Next Steps

1. **Truy cập http://localhost:5173/portfolio-debug**
2. **Click "Test /profile/check"**
3. **Xem response details**
4. **Check backend logs cho error message cụ thể**
5. **Fix database/backend issue dựa trên logs**
6. **Retry**

## 🆘 Common Fixes

### Fix 1: Backend Not Running
```powershell
cd C:\WorkSpace\EXE201\SkillVerse_BackEnd
mvn spring-boot:run
```

### Fix 2: Database Not Initialized
```powershell
docker-compose down -v
docker-compose up -d
# Wait 30 seconds
mvn spring-boot:run
```

### Fix 3: Token Expired
```javascript
// F12 Console
localStorage.removeItem('token');
// Re-login
```

### Fix 4: CORS Issues
Check backend `application.yml`:
```yaml
spring:
  web:
    cors:
      allowed-origins: "http://localhost:5173"
      allowed-methods: "*"
```

---

## 📊 Debug Workflow

```
1. Open /portfolio-debug
      ↓
2. Check token present? 
      ↓ NO → Login first
      ↓ YES
3. Test /profile/check
      ↓
4. Response 500?
      ↓ YES
5. Check backend logs
      ↓
6. Find error message:
      - "Table not found" → Run migrations
      - "User not found" → Check user exists
      - "NullPointer" → Check backend code
      ↓
7. Fix issue
      ↓
8. Test again
      ↓
9. Success! → Use /portfolio
```

---

**Hãy bắt đầu với `/portfolio-debug` và báo lại response bạn thấy!** 🚀
