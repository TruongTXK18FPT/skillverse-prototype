# Portfolio Service Integration Guide

## 🎯 Tổng Quan

Đã tạo xong Portfolio Service Integration với các files sau:

### ✅ Files Đã Tạo:

1. **`src/data/portfolioDTOs.ts`** - TypeScript interfaces mapping từ backend Java DTOs
2. **`src/services/portfolioService.ts`** - Service layer gọi API backend
3. **`src/components/portfolio/ProfileModal.tsx`** - Modal tạo/sửa Extended Profile
4. **`src/components/portfolio/ProjectModal.tsx`** - Modal thêm/sửa Project
5. **`src/components/portfolio/CertificateModal.tsx`** - Modal thêm Certificate
6. **`src/components/portfolio/CVGenerationModal.tsx`** - Modal tạo CV với AI
7. **`src/styles/PortfolioModals.css`** - CSS cho modals (prefix `pf-`)

---

## 🔄 Cần Cập Nhật:

### 1. **PortfolioPage.tsx** - Replace mock data với real data

**Changes cần thực hiện:**

#### A. Import các dependencies mới:
```typescript
import { useState, useEffect } from 'react';
import portfolioService from '../../services/portfolioService';
import {
  UserProfileDTO,
  PortfolioProjectDTO,
  ExternalCertificateDTO,
  MentorReviewDTO,
  GeneratedCVDTO,
} from '../../data/portfolioDTOs';
import ProfileModal from '../../components/portfolio/ProfileModal';
import ProjectModal from '../../components/portfolio/ProjectModal';
import CertificateModal from '../../components/portfolio/CertificateModal';
import CVGenerationModal from '../../components/portfolio/CVGenerationModal';
import { Loader, AlertCircle } from 'lucide-react';
```

#### B. Replace state management:
```typescript
const PortfolioPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // State cho data từ backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [hasExtendedProfile, setHasExtendedProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [projects, setProjects] = useState<PortfolioProjectDTO[]>([]);
  const [certificates, setCertificates] = useState<ExternalCertificateDTO[]>([]);
  const [reviews, setReviews] = useState<MentorReviewDTO[]>([]);
  const [cvs, setCvs] = useState<GeneratedCVDTO[]>([]);
  
  // Modal states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState<'create' | 'edit'>('create');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<PortfolioProjectDTO | undefined>();
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  
  const [activeSection, setActiveSection] = useState('overview');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedProjectType, setSelectedProjectType] = useState('Tất cả');
  
  // Load data on mount
  useEffect(() => {
    loadPortfolioData();
  }, []);
  
  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if has extended profile
      const checkResult = await portfolioService.checkExtendedProfile();
      setHasExtendedProfile(checkResult.hasExtendedProfile);
      
      if (checkResult.hasExtendedProfile) {
        // Load all data in parallel
        const [profileData, projectsData, certsData, reviewsData, cvsData] = await Promise.all([
          portfolioService.getProfile(),
          portfolioService.getUserProjects(),
          portfolioService.getUserCertificates(),
          portfolioService.getUserReviews(),
          portfolioService.getAllCVs(),
        ]);
        
        setProfile(profileData);
        setProjects(projectsData);
        setCertificates(certsData);
        setReviews(reviewsData);
        setCvs(cvsData);
      }
    } catch (err: any) {
      console.error('Error loading portfolio data:', err);
      setError(err.message || 'Không thể tải dữ liệu portfolio');
    } finally {
      setLoading(false);
    }
  };
  
  // Handler functions
  const handleCreateProfile = async (
    profileData: Partial<UserProfileDTO>,
    avatar?: File,
    video?: File,
    coverImage?: File
  ) => {
    await portfolioService.createExtendedProfile(profileData, avatar, video, coverImage);
    await loadPortfolioData();
  };
  
  const handleUpdateProfile = async (
    profileData: Partial<UserProfileDTO>,
    avatar?: File,
    video?: File,
    coverImage?: File
  ) => {
    await portfolioService.updateExtendedProfile(profileData, avatar, video, coverImage);
    await loadPortfolioData();
  };
  
  const handleCreateProject = async (project: PortfolioProjectDTO, thumbnail?: File) => {
    await portfolioService.createProject(project, thumbnail);
    await loadPortfolioData();
  };
  
  const handleUpdateProject = async (project: PortfolioProjectDTO, thumbnail?: File) => {
    if (project.id) {
      await portfolioService.updateProject(project.id, project, thumbnail);
      await loadPortfolioData();
    }
  };
  
  const handleDeleteProject = async (projectId: number) => {
    if (confirm('Bạn có chắc muốn xóa dự án này?')) {
      await portfolioService.deleteProject(projectId);
      await loadPortfolioData();
    }
  };
  
  const handleCreateCertificate = async (certificate: ExternalCertificateDTO, image?: File) => {
    await portfolioService.createCertificate(certificate, image);
    await loadPortfolioData();
  };
  
  const handleDeleteCertificate = async (certId: number) => {
    if (confirm('Bạn có chắc muốn xóa chứng chỉ này?')) {
      await portfolioService.deleteCertificate(certId);
      await loadPortfolioData();
    }
  };
  
  const handleGenerateCV = async (request: CVGenerationRequest) => {
    await portfolioService.generateCV(request);
    await loadPortfolioData();
  };
  
  const handleExportCV = async () => {
    try {
      const activeCV = await portfolioService.getActiveCV();
      // Export CV logic here (download PDF, copy to clipboard, etc.)
      console.log('Active CV:', activeCV);
    } catch (err) {
      alert('Chưa có CV active. Vui lòng tạo CV trước.');
    }
  };
  
  const handleSharePortfolio = () => {
    if (profile?.customUrlSlug) {
      const url = `${window.location.origin}/portfolio/${profile.customUrlSlug}`;
      navigator.clipboard.writeText(url);
      alert('Đã copy link portfolio vào clipboard!');
    }
  };
  
  // Parse skills from JSON string
  const getSkills = () => {
    if (!profile?.topSkills) return [];
    try {
      return JSON.parse(profile.topSkills);
    } catch {
      return [];
    }
  };
  
  // Parse languages from JSON string
  const getLanguages = () => {
    if (!profile?.languagesSpoken) return [];
    try {
      return JSON.parse(profile.languagesSpoken);
    } catch {
      return [];
    }
  };
  
  // Filter data
  const filteredCertificates = selectedCategory === 'Tất cả'
    ? certificates
    : certificates.filter(cert => cert.category === selectedCategory);
  
  const filteredProjects = selectedProjectType === 'Tất cả'
    ? projects
    : projects.filter(proj => proj.projectType === selectedProjectType);
```

#### C. Loading & Error States:
```typescript
  if (loading) {
    return (
      <div className="pf-loading-container">
        <Loader size={48} className="pf-spinner" />
        <p>Đang tải portfolio...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="pf-error-container">
        <AlertCircle size={48} color="#ef4444" />
        <h2>Không thể tải portfolio</h2>
        <p>{error}</p>
        <button onClick={loadPortfolioData} className="pf-btn pf-btn-primary">
          Thử lại
        </button>
      </div>
    );
  }
  
  // Show create profile prompt if no extended profile
  if (!hasExtendedProfile) {
    return (
      <div className="pf-no-profile-container">
        <div className="pf-no-profile-card">
          <h2>Chưa có Portfolio Mở Rộng</h2>
          <p>Tạo portfolio mở rộng để showcase kỹ năng và dự án của bạn</p>
          <button
            onClick={() => {
              setProfileModalMode('create');
              setProfileModalOpen(true);
            }}
            className="pf-btn pf-btn-primary"
          >
            Tạo Portfolio Ngay
          </button>
        </div>
        
        {/* Profile Modal */}
        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onSubmit={handleCreateProfile}
          mode="create"
        />
      </div>
    );
  }
```

#### D. Replace mock data với real data trong JSX:
```typescript
// Profile Overview Section - use {profile?.field}
{profile?.portfolioAvatarUrl || profile?.basicAvatarUrl ? (
  <img src={profile.portfolioAvatarUrl || profile.basicAvatarUrl} alt={profile.fullName} />
) : (
  <div className="pf-avatar-placeholder">{profile?.fullName?.[0] || 'U'}</div>
)}

<h2>{profile?.fullName || 'User'}</h2>
<p>{profile?.professionalTitle}</p>
<p>{profile?.location}</p>

// Stats
<p>{profile?.portfolioViews || 0}</p>
<p>{profile?.totalProjects || 0}</p>
<p>{profile?.totalCertificates || 0}</p>

// Skills from parsed JSON
{getSkills().map((skill, idx) => (
  <div key={idx} className="pf-skill-item">
    <span>{skill}</span>
  </div>
))}

// Projects - use {projects.map()}
{filteredProjects.map((project) => (
  <div key={project.id} className="pf-project-card">
    <img src={project.thumbnailUrl} alt={project.title} />
    <h3>{project.title}</h3>
    <p>{project.description}</p>
    <div className="pf-project-actions">
      <button onClick={() => {
        setSelectedProject(project);
        setProjectModalMode('edit');
        setProjectModalOpen(true);
      }}>
        Edit
      </button>
      <button onClick={() => handleDeleteProject(project.id!)}>
        Delete
      </button>
    </div>
  </div>
))}

// Certificates - use {certificates.map()}
{filteredCertificates.map((cert) => (
  <div key={cert.id} className="pf-cert-card">
    <img src={cert.certificateImageUrl} alt={cert.title} />
    <h3>{cert.title}</h3>
    <p>{cert.issuingOrganization}</p>
    <button onClick={() => handleDeleteCertificate(cert.id!)}>Delete</button>
  </div>
))}

// Reviews - use {reviews.map()}
{reviews.map((review) => (
  <div key={review.id} className="pf-review-card">
    <img src={review.mentorAvatarUrl} alt={review.mentorName} />
    <h4>{review.mentorName}</h4>
    <p>{review.mentorTitle}</p>
    <p>{review.feedback}</p>
  </div>
))}
```

#### E. Add Modal Components at bottom:
```typescript
  return (
    <div className="pf-portfolio-container">
      {/* All your existing JSX */}
      
      {/* Modals */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSubmit={profileModalMode === 'create' ? handleCreateProfile : handleUpdateProfile}
        initialData={profile || undefined}
        mode={profileModalMode}
      />
      
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setSelectedProject(undefined);
        }}
        onSubmit={projectModalMode === 'create' ? handleCreateProject : handleUpdateProject}
        initialData={selectedProject}
        mode={projectModalMode}
      />
      
      <CertificateModal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        onSubmit={handleCreateCertificate}
      />
      
      <CVGenerationModal
        isOpen={cvModalOpen}
        onClose={() => setCvModalOpen(false)}
        onSubmit={handleGenerateCV}
      />
    </div>
  );
};
```

---

### 2. **PortfolioPage.css** - Đổi tên classes `sv-*` → `pf-*`

**Cần thực hiện:**

1. **Find & Replace toàn bộ file:**
   - `.sv-portfolio` → `.pf-portfolio`
   - `.sv-profile` → `.pf-profile`
   - `.sv-project` → `.pf-project`
   - `.sv-certificate` → `.pf-certificate`
   - `.sv-skill` → `.pf-skill`
   - `.sv-stat` → `.pf-stat`
   - `.sv-btn` → `.pf-btn`
   - `.sv-modal` → `.pf-modal`
   - `.sv-form` → `.pf-form`
   - `.sv-tag` → `.pf-tag`
   - `.sv-card` → `.pf-card`
   - `.sv-section` → `.pf-section`
   - `.sv-header` → `.pf-header`
   - `.sv-nav` → `.pf-nav`
   - `.sv-content` → `.pf-content`
   - Và tất cả các class khác có prefix `sv-`

2. **Add Loading & Error styles:**
```css
/* Loading State */
.pf-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
}

.pf-loading-container .pf-spinner {
  animation: pf-spin 1s linear infinite;
}

@keyframes pf-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Error State */
.pf-error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  text-align: center;
}

.pf-error-container h2 {
  color: #ef4444;
  margin: 0;
}

/* No Profile State */
.pf-no-profile-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.pf-no-profile-card {
  max-width: 500px;
  text-align: center;
  padding: 3rem;
  background: var(--bg-secondary);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
}

.pf-no-profile-card h2 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.pf-no-profile-card p {
  margin: 0 0 2rem 0;
  color: var(--text-secondary);
}

/* Avatar Placeholder */
.pf-avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
}
```

3. **Update responsive breakpoints** nếu cần.

---

## 🎨 CSS Prefix Summary:

- **Old:** `sv-*` (SkillVerse generic prefix)
- **New:** `pf-*` (Portfolio specific prefix)

**Why?** Tránh conflict với các components khác trong hệ thống.

---

## 🚀 Testing Checklist:

### 1. Profile Management:
- [ ] Check extended profile exists
- [ ] Create extended profile with avatar, video, cover
- [ ] Update extended profile
- [ ] Display combined profile (basic + extended)
- [ ] Share portfolio by custom URL

### 2. Projects Management:
- [ ] Create new project with thumbnail
- [ ] Update existing project
- [ ] Delete project
- [ ] Filter by project type
- [ ] Display project details

### 3. Certificates Management:
- [ ] Add external certificate with image
- [ ] Delete certificate
- [ ] Filter by category
- [ ] Display verification status

### 4. Reviews:
- [ ] Display mentor reviews
- [ ] Show rating and verification

### 5. CV Generation:
- [ ] Select template
- [ ] Customize target role/industry
- [ ] Generate CV with AI
- [ ] Export active CV
- [ ] View all CV versions

---

## 📦 Additional Improvements:

### 1. Toast Notifications:
```typescript
import { useToast } from '../../hooks/useToast';

const { showToast } = useToast();

// In handlers:
try {
  await portfolioService.createProject(project, thumbnail);
  showToast('Dự án đã được tạo thành công!', 'success');
  await loadPortfolioData();
} catch (err) {
  showToast('Không thể tạo dự án', 'error');
}
```

### 2. Optimistic Updates:
```typescript
// Update UI immediately, revert if API fails
const handleDeleteProject = async (projectId: number) => {
  const previousProjects = [...projects];
  setProjects(projects.filter(p => p.id !== projectId));
  
  try {
    await portfolioService.deleteProject(projectId);
  } catch (err) {
    setProjects(previousProjects);
    showToast('Không thể xóa dự án', 'error');
  }
};
```

### 3. Lazy Loading:
```typescript
// Load projects only when "projects" section is active
useEffect(() => {
  if (activeSection === 'projects' && projects.length === 0) {
    loadProjects();
  }
}, [activeSection]);
```

---

## ⚠️ Important Notes:

1. **Environment Variable:** Đảm bảo `VITE_API_BASE_URL` được set trong `.env`
2. **Authentication:** Token phải được lưu trong `localStorage.getItem('token')`
3. **CORS:** Backend phải enable CORS cho frontend origin
4. **File Upload:** Đảm bảo backend accept `multipart/form-data`
5. **Error Handling:** Tất cả API calls đều có try-catch

---

## 📝 Next Steps:

1. Apply changes theo guide này vào `PortfolioPage.tsx`
2. Find & Replace classes trong `PortfolioPage.css`
3. Test từng chức năng một
4. Add loading skeletons nếu muốn (optional)
5. Add animation transitions giữa các sections
6. Implement pagination cho projects/certificates nếu có nhiều data

---

**Status:** Ready for implementation ✅

**Files Created:** 7/7 ✅

**Integration Required:** 2 files (PortfolioPage.tsx, PortfolioPage.css) 🔄
