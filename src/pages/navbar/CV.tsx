import { useEffect, useState } from 'react';
import {
  Download, Printer, Share2, Edit, Eye, EyeOff,
  ArrowLeft, Layout, Palette, Save, Linkedin, Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../styles/CV.css';
import portfolioService from '../../services/portfolioService';
import { GeneratedCVDTO, UserProfileDTO, CVGenerationRequest } from '../../data/portfolioDTOs';

const CVPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTemplate] = useState('modern');
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCV, setActiveCV] = useState<GeneratedCVDTO | null>(null);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [templateName, setTemplateName] = useState<'PROFESSIONAL' | 'CREATIVE' | 'MINIMAL' | 'MODERN'>('PROFESSIONAL');
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // CV Edit Form States
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    certificates: ''
  });
  // Show/hide toast message (auto-hide)
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2100);
  };

  // Parse CV content to extract form data
  const parseCvContent = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract basic info
    const fullName = doc.querySelector('h1')?.textContent || '';
    const professionalTitle = doc.querySelector('h2')?.textContent || '';
    
    // Extract contact info
    const emailMatch = htmlContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = htmlContent.match(/[+]?[0-9\s\-()]{10,}/);
    const locationMatch = htmlContent.match(/TP\.\s*Hồ\s*Chí\s*Minh|Hà\s*Nội|Đà\s*Nẵng|Cần\s*Thơ|Hải\s*Phòng|An\s*Giang|Bà\s*Rịa\s*-\s*Vũng\s*Tàu|Bạc\s*Liêu|Bắc\s*Giang|Bắc\s*Kạn|Bắc\s*Ninh|Bến\s*Tre|Bình\s*Định|Bình\s*Dương|Bình\s*Phước|Bình\s*Thuận|Cà\s*Mau|Cao\s*Bằng|Đắk\s*Lắk|Đắk\s*Nông|Điện\s*Biên|Đồng\s*Nai|Đồng\s*Tháp|Gia\s*Lai|Hà\s*Giang|Hà\s*Nam|Hà\s*Tĩnh|Hải\s*Dương|Hậu\s*Giang|Hòa\s*Bình|Hưng\s*Yên|Khánh\s*Hòa|Kiên\s*Giang|Kon\s*Tum|Lai\s*Châu|Lâm\s*Đồng|Lạng\s*Sơn|Lào\s*Cai|Long\s*An|Nam\s*Định|Nghệ\s*An|Ninh\s*Bình|Ninh\s*Thuận|Phú\s*Thọ|Phú\s*Yên|Quảng\s*Bình|Quảng\s*Nam|Quảng\s*Ngãi|Quảng\s*Ninh|Quảng\s*Trị|Sóc\s*Trăng|Sơn\s*La|Tây\s*Ninh|Thái\s*Bình|Thái\s*Nguyên|Thanh\s*Hóa|Thừa\s*Thiên\s*Huế|Tiền\s*Giang|Trà\s*Vinh|Tuyên\s*Quang|Vĩnh\s*Long|Vĩnh\s*Phúc|Yên\s*Bái/);
    
    // Extract LinkedIn and GitHub URLs
    const linkedinMatch = htmlContent.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/);
    const githubMatch = htmlContent.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9-]+\/?/);
    
    // Extract sections (simplified parsing)
    const summaryMatch = htmlContent.match(/<h3[^>]*>.*?Tóm\s*tắt.*?<\/h3>(.*?)<h3/s);
    const experienceMatch = htmlContent.match(/<h3[^>]*>.*?Kinh\s*nghiệm.*?<\/h3>(.*?)<h3/s);
    const educationMatch = htmlContent.match(/<h3[^>]*>.*?Học\s*vấn.*?<\/h3>(.*?)<h3/s);
    const skillsMatch = htmlContent.match(/<h3[^>]*>.*?Kỹ\s*năng.*?<\/h3>(.*?)<h3/s);
    const projectsMatch = htmlContent.match(/<h3[^>]*>.*?Dự\s*án.*?<\/h3>(.*?)<h3/s);
    const certificatesMatch = htmlContent.match(/<h3[^>]*>.*?Chứng\s*chỉ.*?<\/h3>(.*?)<h3/s);
    
    return {
      fullName: fullName.trim(),
      professionalTitle: professionalTitle.trim(),
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: locationMatch ? locationMatch[0] : '',
      linkedinUrl: linkedinMatch ? linkedinMatch[0] : '',
      githubUrl: githubMatch ? githubMatch[0] : '',
      summary: summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, '').trim() : '',
      experience: experienceMatch ? experienceMatch[1].replace(/<[^>]*>/g, '').trim() : '',
      education: educationMatch ? educationMatch[1].replace(/<[^>]*>/g, '').trim() : '',
      skills: skillsMatch ? skillsMatch[1].replace(/<[^>]*>/g, '').trim() : '',
      projects: projectsMatch ? projectsMatch[1].replace(/<[^>]*>/g, '').trim() : '',
      certificates: certificatesMatch ? certificatesMatch[1].replace(/<[^>]*>/g, '').trim() : ''
    };
  };

  // Open edit modal, preload form data
  const openEditModal = () => {
    if (activeCV?.cvContent) {
      const formData = parseCvContent(activeCV.cvContent);
      setEditFormData(formData);
      setShowEditModal(true);
    }
  };
  // Generate HTML from form data
  const generateHtmlFromForm = (formData: typeof editFormData) => {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: #333;">
        <header style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
          <h1 style="color: #1e40af; margin: 0 0 10px 0; font-size: 2.5rem;">${formData.fullName}</h1>
          <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 1.5rem; font-weight: 400;">${formData.professionalTitle}</h2>
          <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; font-size: 0.9rem; color: #666;">
            ${formData.email ? `<span>📧 ${formData.email}</span>` : ''}
            ${formData.phone ? `<span>📞 ${formData.phone}</span>` : ''}
            ${formData.location ? `<span>📍 ${formData.location}</span>` : ''}
            ${formData.linkedinUrl ? `<span><a href="${formData.linkedinUrl}" target="_blank" style="color: #0077b5; text-decoration: none;">🔗 LinkedIn</a></span>` : ''}
            ${formData.githubUrl ? `<span><a href="${formData.githubUrl}" target="_blank" style="color: #333; text-decoration: none;">🐙 GitHub</a></span>` : ''}
          </div>
        </header>
        
        ${formData.summary ? `
          <section style="margin-bottom: 25px;">
            <h3 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Tóm tắt</h3>
            <p style="line-height: 1.6; margin: 0;">${formData.summary}</p>
          </section>
        ` : ''}
        
        ${formData.experience ? `
          <section style="margin-bottom: 25px;">
            <h3 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Kinh nghiệm</h3>
            <div style="line-height: 1.6;">${formData.experience.replace(/\n/g, '<br>')}</div>
          </section>
        ` : ''}
        
        ${formData.education ? `
          <section style="margin-bottom: 25px;">
            <h3 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Học vấn</h3>
            <div style="line-height: 1.6;">${formData.education.replace(/\n/g, '<br>')}</div>
          </section>
        ` : ''}
        
        ${formData.skills ? `
          <section style="margin-bottom: 25px;">
            <h3 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Kỹ năng</h3>
            <div style="line-height: 1.6;">${formData.skills.replace(/\n/g, '<br>')}</div>
          </section>
        ` : ''}
        
        ${formData.projects ? `
          <section style="margin-bottom: 25px;">
            <h3 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Dự án</h3>
            <div style="line-height: 1.6;">${formData.projects.replace(/\n/g, '<br>')}</div>
          </section>
        ` : ''}
        
        ${formData.certificates ? `
          <section style="margin-bottom: 25px;">
            <h3 style="color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px;">Chứng chỉ</h3>
            <div style="line-height: 1.6;">${formData.certificates.replace(/\n/g, '<br>')}</div>
          </section>
        ` : ''}
      </div>
    `;
  };

  // Save edited CV
  const saveEditedCV = async () => {
    if (!activeCV?.id) return;
    try {
      setSaving(true);
      const newHtml = generateHtmlFromForm(editFormData);
      await portfolioService.updateCV(activeCV.id, newHtml);
      setShowEditModal(false);
      showToast('Lưu thành công!');
      // Reload lại CV
      setLoading(true);
      const cv = await portfolioService.getActiveCV();
      setActiveCV(cv);
      setLoading(false);
      // Clear URL parameter after successful save
      navigate('/cv', { replace: true });
    } catch (e: any) {
      showToast(e?.message || 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if edit mode is requested from URL
        const editCvId = searchParams.get('edit');
        if (editCvId) {
          // Load specific CV for editing
          const allCvs = await portfolioService.getAllCVs();
          const cvToEdit = allCvs.find(cv => cv.id === Number.parseInt(editCvId, 10));
          if (cvToEdit) {
            setActiveCV(cvToEdit);
            const formData = parseCvContent(cvToEdit.cvContent);
            setEditFormData(formData);
            setShowEditModal(true);
            setShowPreview(true); // Ensure CV is visible in edit mode
            // Load profile for editing mode
            const pf = await portfolioService.getProfile().catch(() => null);
            if (pf) setProfile(pf);
          } else {
            setError('Không tìm thấy CV để chỉnh sửa.');
          }
        } else {
          // Load active CV normally
          const [cv, pf] = await Promise.all([
            portfolioService.getActiveCV().catch(() => null),
            portfolioService.getProfile().catch(() => null)
          ]);
          if (cv) setActiveCV(cv);
          if (pf) setProfile(pf);
          if (!cv) setError('Chưa có CV. Vui lòng tạo CV.');
        }
      } catch (e: any) {
        setError(e?.message || 'Không tìm thấy CV đang active. Vui lòng tạo CV trước.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const transformCvHtml = (html: string): string => {
    let out = html.trim();
    // Remove Markdown code fences like ```html or ```
    out = out.replace(/^```html\s*/i, '').replace(/^```\s*/i, '');
    out = out.replace(/```$/m, '');
    // Replace plain LinkedIn/GitHub text links with nicer badges (basic heuristic)
    out = out.replace(/>\s*LinkedIn\s*</g, '><span style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #e5e7eb;border-radius:999px;background:#f9fafb;color:#111827;font-weight:600"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.1c.5-.9 1.7-2.1 3.5-2.1 3.7 0 4.4 2.4 4.4 5.6V24h-4v-6.9c0-1.6 0-3.6-2.2-3.6s-2.6 1.7-2.6 3.5V24h-4V8.5z"/></svg>LinkedIn</span><');
    out = out.replace(/>\s*GitHub\s*</g, '><span style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #e5e7eb;border-radius:999px;background:#f9fafb;color:#111827;font-weight:600"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.85 3.14 8.96 7.49 10.41.55.1.75-.24.75-.53 0-.26-.01-1.12-.02-2.03-3.05.66-3.7-1.3-3.7-1.3-.5-1.27-1.22-1.6-1.22-1.6-.99-.67.08-.66.08-.66 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.58 1.2 3.21.92.1-.7.38-1.2.69-1.48-2.44-.28-5-1.22-5-5.45 0-1.2.43-2.17 1.14-2.94-.11-.28-.49-1.41.11-2.94 0 0 .93-.3 3.05 1.12a10.5 10.5 0 0 1 5.56 0c2.12-1.42 3.05-1.12 3.05-1.12.6 1.53.22 2.66.11 2.94.71.77 1.14 1.74 1.14 2.94 0 4.24-2.57 5.16-5.02 5.43.39.34.73 1.01.73 2.04 0 1.47-.01 2.65-.01 3.01 0 .29.2.64.75.53 4.35-1.45 7.49-5.56 7.49-10.41C23.02 5.24 18.27.5 12 .5z"/></svg>GitHub</span><');
    return out;
  };

  // Active CV content will be rendered from backend HTML (cvContent)


  const handleDownloadPDF = async () => {
    if (!activeCV?.cvContent) {
      alert('Không có CV để tải xuống');
      return;
    }
    
    try {
      // Create a new window for printing
      const printWindow = globalThis.open('', '_blank');
      if (!printWindow) {
        alert('Không thể mở cửa sổ in. Vui lòng cho phép popup.');
        return;
      }
      
      // Get the cleaned CV content
      const cleanedContent = transformCvHtml(activeCV.cvContent);
      
      // Create print-friendly HTML
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>CV - ${profile?.fullName || 'CV'}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
              color: #1f2937;
              line-height: 1.6;
            }
            * { 
              display: block !important; 
              width: 100% !important; 
              max-width: 100% !important; 
              margin-left: 0 !important; 
              margin-right: 0 !important; 
              float: none !important; 
            }
            h1, h2, h3, h4, h5, h6 { 
              color: #1e40af !important; 
              font-weight: 700 !important; 
              margin: 1.5rem 0 1rem 0 !important; 
              padding-bottom: 0.5rem !important; 
              border-bottom: 2px solid #1e40af !important; 
              text-align: center !important; 
            }
            p, li { 
              margin: 0.5rem 0 !important; 
              padding: 0.5rem 1rem !important; 
              background: #f8fafc !important; 
              border-radius: 6px !important; 
              border-left: 3px solid #1e40af !important; 
              color: #334155 !important; 
            }
            .contact-item, .contact-info { 
              background: #f0f9ff !important; 
              border: 1px solid #0ea5e9 !important; 
              color: #0c4a6e !important; 
            }
            .email, .phone { 
              background: #fef3c7 !important; 
              border: 1px solid #f59e0b !important; 
              color: #92400e !important; 
            }
            @media print {
              body { margin: 0; padding: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${cleanedContent}
        </body>
        </html>
      `;
      
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
      showToast('Đang tạo PDF...');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Không thể tạo PDF. Vui lòng thử lại.');
    }
  };

  const handlePrint = () => {
    globalThis.print?.();
  };

  const handleShare = () => {
    const shareData = {
      title: `CV` ,
      text: `Xem CV của tôi`,
      url: globalThis.location?.href || '',
    };
    if (globalThis.navigator && (navigator as any).share) {
      (navigator as any).share(shareData);
    } else {
      globalThis.navigator?.clipboard?.writeText?.(globalThis.location?.href || '');
      alert('Đã copy link CV vào clipboard!');
    }
  };

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const composedInstructions = (
        `${additionalInstructions || ''}\nHãy tạo CV bằng ${language === 'vi' ? 'tiếng Việt' : 'tiếng Anh'}.\n` +
        `${contactEmail ? `Email: ${contactEmail}. ` : ''}` +
        `${contactPhone ? `Phone: ${contactPhone}. ` : ''}`
      ).trim();

      const req: CVGenerationRequest = {
        templateName,
        targetRole: targetRole || undefined,
        targetIndustry: targetIndustry || undefined,
        additionalInstructions: composedInstructions,
        includeProjects: true,
        includeCertificates: true,
        includeReviews: true,
      };
      const newCv = await portfolioService.generateCV(req);
      setActiveCV(newCv);
      setShowPreview(true);
      showToast('Đã tạo lại CV');
    } catch (e: any) {
      setError(e?.message || 'Không thể tạo lại CV');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`cv-container ${theme}`}>
      {/* Header with Controls */}
      <motion.div 
        className="cv-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="cv-header__left">
          <button 
            className="cv-btn cv-btn--ghost"
            onClick={() => navigate('/portfolio')}
          >
            <ArrowLeft size={20} />
            Back to Portfolio
          </button>
          <h1 className="cv-header__title">CV Builder</h1>
        </div>

        <div className="cv-header__right">
          <div className="cv-header__actions">
            {showPreview ? (
              <>
            <button 
              className="cv-btn cv-btn--outline"
                  onClick={() => setShowPreview(false)}
            >
                  <EyeOff size={18} />
                  Hide Preview
            </button>
            <button 
              className="cv-btn cv-btn--outline"
                  onClick={() => setIsFullscreen(prev=>!prev)}
            >
                  {isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
            </button>
            <button 
              className="cv-btn cv-btn--outline"
              onClick={handlePrint}
                  disabled={!activeCV}
            >
              <Printer size={18} />
              Print
            </button>
            <button 
              className="cv-btn cv-btn--outline"
              onClick={handleShare}
            >
              <Share2 size={18} />
              Share
            </button>
            <button 
              className="cv-btn cv-btn--primary"
                  disabled={!activeCV}
              onClick={handleDownloadPDF}
            >
              <Download size={18} />
              Download PDF
            </button>
              </>
            ) : (
              <>
                <button 
                  className="cv-btn cv-btn--outline"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye size={18} />
                  Show Preview
                </button>
                <button 
                  className="cv-btn cv-btn--outline"
                  onClick={openEditModal}
                  disabled={!activeCV}
                >
                  <Edit size={18} />
                  Edit CV
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Chỉnh sửa modal cho CV với form UI */}
      {showEditModal && (
        <div className="cv-edit-modal-bg" style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, zIndex:1200, background: 'rgba(64,70,110,0.28)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="cv-edit-modal-panel" style={{ background:'#fff', borderRadius:14, boxShadow:'0 8px 44px #5552a328', padding:'2.5rem 2rem', minWidth: 360, width:'97vw', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', position:'relative'}}>
            <h3 style={{marginTop:0, color:'#4247a8', fontWeight:700, fontSize:'1.45rem', marginBottom: '1.5rem'}}>Chỉnh sửa CV</h3>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Basic Info */}
              <div className="cv-form-section">
                <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Thông tin cơ bản</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label htmlFor="fullName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Họ và tên</label>
                    <input
                      id="fullName"
                      type="text"
                      value={editFormData.fullName}
                      onChange={e => setEditFormData({...editFormData, fullName: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div>
                    <label htmlFor="professionalTitle" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Chức danh</label>
                    <input
                      id="professionalTitle"
                      type="text"
                      value={editFormData.professionalTitle}
                      onChange={e => setEditFormData({...editFormData, professionalTitle: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      placeholder="Nhập chức danh"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="cv-form-section">
                <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Thông tin liên hệ</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                    <input
                      id="email"
                      type="email"
                      value={editFormData.email}
                      onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Số điện thoại</label>
                    <input
                      id="phone"
                      type="tel"
                      value={editFormData.phone}
                      onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      placeholder="+84 123 456 789"
                    />
                  </div>
                  <div>
                    <label htmlFor="location" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Địa chỉ</label>
                    <input
                      id="location"
                      type="text"
                      value={editFormData.location}
                      onChange={e => setEditFormData({...editFormData, location: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      placeholder="TP. Hồ Chí Minh"
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label htmlFor="linkedinUrl" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>LinkedIn URL</label>
                    <input
                      id="linkedinUrl"
                      type="url"
                      value={editFormData.linkedinUrl}
                      onChange={e => setEditFormData({...editFormData, linkedinUrl: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      placeholder="https://linkedin.com/in/yourname"
                    />
                  </div>
                  <div>
                    <label htmlFor="githubUrl" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>GitHub URL</label>
                    <input
                      id="githubUrl"
                      type="url"
                      value={editFormData.githubUrl}
                      onChange={e => setEditFormData({...editFormData, githubUrl: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                      placeholder="https://github.com/yourname"
                    />
                  </div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="cv-form-section">
                <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Nội dung CV</h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label htmlFor="summary" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tóm tắt</label>
                    <textarea
                      id="summary"
                      value={editFormData.summary}
                      onChange={e => setEditFormData({...editFormData, summary: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', minHeight: '80px' }}
                      placeholder="Mô tả ngắn gọn về bản thân và mục tiêu nghề nghiệp"
                    />
                  </div>
                  <div>
                    <label htmlFor="experience" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Kinh nghiệm</label>
                    <textarea
                      id="experience"
                      value={editFormData.experience}
                      onChange={e => setEditFormData({...editFormData, experience: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', minHeight: '120px' }}
                      placeholder="Mô tả kinh nghiệm làm việc của bạn"
                    />
                  </div>
                  <div>
                    <label htmlFor="education" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Học vấn</label>
                    <textarea
                      id="education"
                      value={editFormData.education}
                      onChange={e => setEditFormData({...editFormData, education: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', minHeight: '80px' }}
                      placeholder="Thông tin học vấn và bằng cấp"
                    />
                  </div>
                  <div>
                    <label htmlFor="skills" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Kỹ năng</label>
                    <textarea
                      id="skills"
                      value={editFormData.skills}
                      onChange={e => setEditFormData({...editFormData, skills: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', minHeight: '80px' }}
                      placeholder="Liệt kê các kỹ năng chuyên môn"
                    />
                  </div>
                  <div>
                    <label htmlFor="projects" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Dự án</label>
                    <textarea
                      id="projects"
                      value={editFormData.projects}
                      onChange={e => setEditFormData({...editFormData, projects: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', minHeight: '120px' }}
                      placeholder="Mô tả các dự án đã thực hiện"
                    />
                  </div>
                  <div>
                    <label htmlFor="certificates" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Chứng chỉ</label>
                    <textarea
                      id="certificates"
                      value={editFormData.certificates}
                      onChange={e => setEditFormData({...editFormData, certificates: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', minHeight: '80px' }}
                      placeholder="Liệt kê các chứng chỉ đã đạt được"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:'1.5rem'}}>
              <button className="cv-btn cv-btn--ghost" onClick={()=>setShowEditModal(false)} disabled={saving}>Huỷ</button>
              <button className="cv-btn cv-btn--primary" onClick={saveEditedCV} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast message */}
      {toastMsg && (
        <div style={{ position:'fixed', top:'60px', left:'50%', transform:'translateX(-50%)', zIndex:3000, minWidth:220, color:'#fff', background:'#3b448e', borderRadius:8, padding:'12px 28px', fontWeight:600, boxShadow:'0 2px 12px #2222' }}>{toastMsg}</div>
      )}

      <div className="cv-content">
        {/* Structured Edit Panel (hidden preview mode) + vẫn hiển thị CV bên phải */}
        <AnimatePresence>
          {!showPreview && (
            <motion.div 
              className="cv-sidebar"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="cv-sidebar__section">
                <h3 className="cv-sidebar__title"><Layout size={20} /> Ngôn ngữ & Mẫu</h3>
                <div className="cv-controls" style={{gap:'0.75rem'}}>
                  <div style={{display:'flex', gap:8}}>
                    <button className={`cv-btn ${language==='vi'?'cv-btn--primary':'cv-btn--outline'}`} onClick={()=>setLanguage('vi')}>Tiếng Việt</button>
                    <button className={`cv-btn ${language==='en'?'cv-btn--primary':'cv-btn--outline'}`} onClick={()=>setLanguage('en')}>English</button>
                  </div>
                  <div className="cv-control-group">
                    <label htmlFor="template-select">Mẫu CV</label>
                    <select id="template-select" value={templateName} onChange={e=>setTemplateName(e.target.value as any)} style={{padding:'0.6rem', borderRadius:8, border:'1px solid var(--border-color)'}}>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="CREATIVE">Creative</option>
                      <option value="MINIMAL">Minimal</option>
                      <option value="MODERN">Modern</option>
                    </select>
                      </div>
                </div>
              </div>

              <div className="cv-sidebar__section">
                <h3 className="cv-sidebar__title"><Palette size={20} /> Thông tin liên hệ</h3>
                <div className="cv-controls">
                  <div className="cv-control-group">
                    <label htmlFor="contact-email">Email</label>
                    <input 
                      id="contact-email"
                      type="email" 
                      value={contactEmail} 
                      onChange={e=>setContactEmail(e.target.value)} 
                      placeholder="your.email@example.com" 
                    />
                  </div>
                  <div className="cv-control-group">
                    <label htmlFor="contact-phone">Số điện thoại</label>
                    <input 
                      id="contact-phone"
                      type="tel" 
                      value={contactPhone} 
                      onChange={e=>setContactPhone(e.target.value)} 
                      placeholder="+84 123 456 789" 
                    />
                  </div>
                </div>
              </div>

              <div className="cv-sidebar__section">
                <h3 className="cv-sidebar__title"><Palette size={20} /> Tối ưu nội dung</h3>
                <div className="cv-controls">
                  <div className="cv-control-group">
                    <label htmlFor="target-role">Target Role</label>
                    <input id="target-role" value={targetRole} onChange={e=>setTargetRole(e.target.value)} placeholder="e.g., Frontend Developer" />
                  </div>
                  <div className="cv-control-group">
                    <label htmlFor="target-industry">Target Industry</label>
                    <input id="target-industry" value={targetIndustry} onChange={e=>setTargetIndustry(e.target.value)} placeholder="e.g., Fintech" />
                    </div>
                  <div className="cv-control-group">
                    <label htmlFor="additional-instructions">Yêu cầu bổ sung</label>
                    <textarea id="additional-instructions" value={additionalInstructions} onChange={e=>setAdditionalInstructions(e.target.value)} placeholder="Nêu tone/mục tiêu đặc biệt..." style={{minHeight: 80}} />
                  </div>
                </div>
              </div>

                <button 
                  className="cv-btn cv-btn--primary cv-save-btn"
                onClick={handleRegenerate}
                disabled={loading}
                >
                  <Save size={18} />
                Tạo lại CV bằng AI
                </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CV Preview */}
        <AnimatePresence>
            <motion.div 
            className={`cv-preview ${selectedTemplate} ${showPreview ? '' : 'with-sidebar'} ${isFullscreen ? 'cv-preview--fullscreen' : ''}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="cv-document">
                {/* Overlay Header (avatar + name) */}
                {profile && (
                  <div className="cv-overlay-header">
                    <div className="cv-overlay-avatar">
                      { (profile.portfolioAvatarUrl || profile.basicAvatarUrl) ? (
                        <img src={profile.portfolioAvatarUrl || profile.basicAvatarUrl} alt={profile.fullName||'Avatar'} />
                      ) : (
                        <div className="cv-overlay-avatar-fallback">{profile.fullName?.[0] || 'U'}</div>
                      )}
                        </div>
                    <div className="cv-overlay-meta">
                      <div className="cv-overlay-name">{profile.fullName || 'Your Name'}</div>
                      <div className="cv-overlay-title">{profile.professionalTitle || 'Your Title'}</div>
                      <div className="cv-overlay-links">
                        {profile.linkedinUrl && (
                          <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <Linkedin size={16} />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {profile.githubUrl && (
                          <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                            <Github size={16} />
                            <span>GitHub</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {loading && (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải CV...</div>
                )}
                {!loading && error && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{error}</div>
                )}
                {!loading && !error && activeCV?.cvContent && (
                  <div
                    className="cv-generated"
                    style={{ background: 'white' }}
                    dangerouslySetInnerHTML={{ __html: transformCvHtml(activeCV.cvContent) }}
                  />
                )}
                {!loading && !error && activeCV && !activeCV.cvContent && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Không có nội dung CV để hiển thị
                  </div>
                )}
                {!loading && !error && activeCV && (
                  <div style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    CV ID: {activeCV.id} | Template: {activeCV.templateName} | Version: {activeCV.version}
                  </div>
                )}
                {/* Debug info */}
                {!loading && (
                  <div style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', background: '#f0f0f0', margin: '1rem' }}>
                    Debug: loading={loading.toString()}, error={error}, activeCV={activeCV ? 'exists' : 'null'}, showPreview={showPreview.toString()}
                  </div>
                )}
              </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CVPage;
