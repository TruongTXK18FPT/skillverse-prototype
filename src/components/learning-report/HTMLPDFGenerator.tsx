/**
 * HTML-based PDF Generator for Vietnamese Support (High-Tech Blueprint Theme)
 * FINAL FIX: Markdown Artifacts & Pagination Slicing
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { StudentLearningReportResponse } from "../../services/learningReportService";

export interface HTMLPDFOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  userAvatar?: string;
}

const defaultOptions: HTMLPDFOptions = {
  filename: "bao-cao-hoc-tap",
  quality: 0.95, // Higher quality for better rendering
  scale: 2,
};

// --- HELPER FUNCTIONS ---

/**
 * Convert image URL to base64 via canvas to avoid CORS issues
 */
async function imageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          resolve(dataURL);
        } else {
          console.error('❌ Canvas context not available');
          resolve('https://api.dicebear.com/7.x/bottts/svg?seed=Meowl');
        }
      } catch (error) {
        console.error('❌ Failed to convert image via canvas:', error);
        resolve('https://api.dicebear.com/7.x/bottts/svg?seed=Meowl');
      }
    };
    
    img.onerror = (error) => {
      console.error('❌ Failed to load image:', url);
      console.error('   Error:', error);
      resolve('https://api.dicebear.com/7.x/bottts/svg?seed=Meowl');
    };
    
    // Set timeout fallback
    setTimeout(() => {
      console.warn('⚠️ Image load timeout (10s), using default avatar');
      resolve('https://api.dicebear.com/7.x/bottts/svg?seed=Meowl');
    }, 10000);
    
    // Start loading
    img.src = url;
  });
}

function parseTableAlignment(separatorLine: string): string[] {
  const cells = separatorLine.split("|").map((c) => c.trim()).filter((c) => c !== "");
  return cells.map((cell) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
    if (trimmed.endsWith(":")) return "right";
    return "left";
  });
}

function processCellContent(content: string): string {
  let processed = content.trim();
  processed = processed.replace(/<br\s*\/?>/gi, "<br/>");
  
  // FIX: Regex mạnh hơn cho Bảng (bắt cả xuống dòng)
  processed = processed.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  processed = processed.replace(/`(.+?)`/g, '<code class="pdf-code-inline">$1</code>');
  
  // CLEANUP: Xóa các dấu ** thừa (nếu AI viết lỗi)
  processed = processed.replace(/\*\*/g, ""); 
  
  return processed;
}

function isSpecialRow(cells: string[]): string | null {
  const firstCell = cells[0]?.toLowerCase().trim();
  if (!firstCell) return null;
  if (firstCell.includes("tổng") || firstCell.includes("total")) return "total";
  if (firstCell.includes("trung bình") || firstCell.includes("average")) return "average";
  return null;
}

function parseMarkdownTable(markdown: string): string {
  const lines = markdown.trim().split("\n");
  if (lines.length < 2) return markdown;
  if (!lines[0].includes("|")) return markdown;

  let alignments: string[] = [];
  let isHeader = true;
  let inBody = false;

  let html = `<div class="pdf-table-wrapper"><table class="pdf-table">`;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^\|?[\s\-:]+\|/.test(line) && line.includes("-")) {
      alignments = parseTableAlignment(line);
      isHeader = false;
      continue;
    }

    const cells = line.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, "|").trim()).filter((c, idx, arr) => {
      if (idx === 0 && c === "" && line.startsWith("|")) return false;
      if (idx === arr.length - 1 && c === "" && line.endsWith("|")) return false;
      return true;
    });

    if (cells.length === 0) continue;

    if (isHeader) {
      html += "<thead><tr>";
      cells.forEach((cell, idx) => {
        const align = alignments[idx] || "left";
        html += `<th style="text-align: ${align}">${processCellContent(cell)}</th>`;
      });
      html += "</tr></thead>";
    } else {
      if (!inBody) { html += "<tbody>"; inBody = true; }
      const specialType = isSpecialRow(cells);
      const rowClass = specialType ? `pdf-table-row-${specialType}` : "";
      html += `<tr ${rowClass ? `class="${rowClass}"` : ""}>`;
      cells.forEach((cell, idx) => {
        const align = alignments[idx] || "left";
        html += `<td style="text-align: ${align}">${processCellContent(cell)}</td>`;
      });
      html += "</tr>";
    }
  }
  if (inBody) html += "</tbody>";
  html += "</table></div>";
  return html;
}

export function markdownToHTML(markdown: string): string {
  if (!markdown) return "";
  const blocks = markdown.split(/\n\n+/);

  const processedBlocks = blocks.map((block) => {
    // Table handling
    if (block.includes("|") && block.split("\n").length >= 2) {
      const lines = block.split("\n");
      if (lines.some((line) => /^\|?[\s\-:]+\|/.test(line))) {
        return parseMarkdownTable(block);
      }
    }

    let processed = block;
    // Headers with Cyber styling
    processed = processed.replace(/^### (.+)$/gm, '<h3 class="pdf-h3"><span class="pdf-h3-marker">›</span> $1</h3>');
    processed = processed.replace(/^## (.+)$/gm, '<h2 class="pdf-h2"><span class="pdf-h2-decor"></span>$1</h2>');
    processed = processed.replace(/^# (.+)$/gm, '<h1 class="pdf-h1">$1</h1>');

    // Formatting - FIX: Bắt multiline và ký tự đặc biệt
    processed = processed.replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="pdf-bold">$1</strong>');
    processed = processed.replace(/\*([^*]+)\*/g, '<em class="pdf-italic">$1</em>');
    processed = processed.replace(/`(.+?)`/g, '<code class="pdf-inline-code">$1</code>');

    // Lists - Improved with proper processing
    if (/^[-*]\s/.test(processed)) {
      const items = processed.split(/\n/).filter((l) => l.trim());
      const listItems = items.map((item) => {
        const content = item.replace(/^[-*]\s+/, "");
        return `<li class="pdf-list-item">${processCellContent(content)}</li>`;
      }).join("");
      processed = `<ul class="pdf-list">${listItems}</ul>`;
    } else if (/^\d+\.\s/.test(processed)) {
      const items = processed.split(/\n/).filter((l) => l.trim());
      const listItems = items.map((item) => {
        const content = item.replace(/^\d+\.\s+/, "");
        return `<li class="pdf-list-item">${processCellContent(content)}</li>`;
      }).join("");
      processed = `<ol class="pdf-list">${listItems}</ol>`;
    } else {
      // Wrap paragraphs for better page break control
      if (!processed.includes('<h') && !processed.includes('<ul') && !processed.includes('<ol') && !processed.includes('<table')) {
        processed = `<p class="pdf-paragraph">${processed}</p>`;
      }
    }
    
    // CLEANUP FINAL: Xóa mọi dấu ** còn sót lại nếu Regex trên không bắt được (do lỗi AI gen thiếu cặp)
    processed = processed.replace(/\*\*/g, ""); 

    processed = processed.replace(/\n/g, "<br/>");
    return processed;
  });

  return processedBlocks.join('<div class="pdf-block-separator"></div>');
}

/**
 * Generate Report HTML Template (Cyber-Blueprint Style)
 */
export function generateReportHTML(
  report: StudentLearningReportResponse,
  avatarUrl?: string
): string {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric"
      });
    } catch { return dateStr; }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return "▲";
      case "stable": return "■";
      case "declining": return "▼";
      default: return "-";
    }
  };

  const sections = report.sections || {};
  const metricsData = (report.metrics || {}) as unknown as Record<string, unknown>;

  const totalStudyHours = (metricsData.totalStudyHours as number) ||
    (metricsData.totalStudyMinutesWeek ? Math.round((metricsData.totalStudyMinutesWeek as number) / 60) : 0);
  const currentStreak = (metricsData.currentStreak as number) || (metricsData.streakDays as number) || 0;
  const totalTasksCompleted = (metricsData.totalTasksCompleted as number) || (metricsData.completedTasks as number) || 0;
  const overallProgress = report.overallProgress || 0;

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        /* --- RESET & BASE --- */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          margin: 0;
          background: #ffffff;
          font-family: 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.6;
          color: #1e293b;
          -webkit-print-color-adjust: exact;
        }

        /* --- LAYOUT WRAPPER --- */
        .page-wrapper {
          width: 210mm;
          min-height: 297mm; /* Đảm bảo ít nhất 1 trang */
          padding: 15mm 20mm; /* Tăng lề để tránh bị cắt chữ khi in */
          position: relative;
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* --- TECH FRAME (Bỏ viền ngoài để tránh cắt trang xấu, chỉ giữ góc) --- */
        .tech-marker-tl { position: absolute; top: 10mm; left: 10mm; width: 20px; height: 20px; border-top: 2px solid #06b6d4; border-left: 2px solid #06b6d4; }
        .tech-marker-tr { position: absolute; top: 10mm; right: 10mm; width: 20px; height: 20px; border-top: 2px solid #06b6d4; border-right: 2px solid #06b6d4; }
        .tech-marker-bl { position: absolute; bottom: 10mm; left: 10mm; width: 20px; height: 20px; border-bottom: 2px solid #06b6d4; border-left: 2px solid #06b6d4; }
        .tech-marker-br { position: absolute; bottom: 10mm; right: 10mm; width: 20px; height: 20px; border-bottom: 2px solid #06b6d4; border-right: 2px solid #06b6d4; }

        /* --- HEADER --- */
        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 15px;
          border-bottom: 2px solid #0f172a;
          margin-bottom: 30px;
        }
        
        .header-brand {
          font-size: 24pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -1px;
          color: #0f172a;
        }
        .header-brand span { color: #06b6d4; }
        
        .header-meta {
          text-align: right;
          font-family: 'Consolas', monospace;
          font-size: 8pt;
          color: #64748b;
          border-left: 2px solid #06b6d4;
          padding-left: 10px;
        }

        /* --- PROFILE CARD --- */
        .profile-container {
          display: flex;
          gap: 20px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 15px;
          margin-bottom: 30px;
          page-break-inside: avoid;
          break-inside: avoid;
          /* Tech cut */
          clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
        }

        .profile-avatar {
          width: 70px; height: 70px;
          border: 2px solid #0f172a;
          background: #fff;
          object-fit: cover;
          border-radius: 4px;
        }

        .profile-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .profile-name { font-size: 16pt; font-weight: 700; text-transform: uppercase; color: #0f172a; }
        .profile-badges { display: flex; gap: 10px; margin-top: 5px; }
        
        .tech-badge {
          background: #0f172a; color: #fff;
          font-size: 7pt; font-weight: 700;
          padding: 2px 8px;
          text-transform: uppercase;
          font-family: 'Consolas', monospace;
        }
        .tech-badge.cyan { background: #06b6d4; color: #000; }

        /* --- METRICS GRID --- */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 35px;
        }

        .metric-card {
          border: 1px solid #cbd5e1;
          padding: 10px;
          position: relative;
          background: #fff;
          /* Avoid page break inside card */
          page-break-inside: avoid;
        }
        
        .metric-card::after {
          content: ''; position: absolute; bottom: 0; right: 0;
          width: 0; height: 0;
          border-style: solid;
          border-width: 0 0 10px 10px;
          border-color: transparent transparent #0f172a transparent;
        }

        .metric-label { font-size: 8pt; text-transform: uppercase; color: #64748b; letter-spacing: 1px; display: block; }
        .metric-value { font-size: 20pt; font-weight: 700; color: #0f172a; font-family: 'Consolas', monospace; }
        .metric-icon { position: absolute; top: 10px; right: 10px; font-size: 14pt; opacity: 0.2; }

        /* --- CONTENT TYPOGRAPHY --- */
        .content-section { 
          margin-bottom: 30px; 
          /* Quan trọng: Tránh cắt đôi đoạn văn */
          page-break-inside: avoid;
        }
        
        .pdf-h2 {
          font-size: 12pt; font-weight: 800; color: #0f172a;
          text-transform: uppercase;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 10px; padding-bottom: 5px;
          display: flex; align-items: center; gap: 8px;
          page-break-after: avoid; /* Giữ tiêu đề dính với nội dung */
        }
        .pdf-h2-decor { display: inline-block; width: 8px; height: 8px; background: #06b6d4; }

        .pdf-h3 { 
          font-size: 10pt; 
          font-weight: 700; 
          color: #334155; 
          margin-top: 10px; 
          text-transform: uppercase;
          page-break-after: avoid;
        }
        
        .pdf-content { 
          text-align: justify; 
          font-size: 10pt;
          /* Tránh để dòng đơn lẻ ở đầu/cuối trang */
          orphans: 3;
          widows: 3;
        }
        .pdf-content p, .pdf-content ul, .pdf-content ol {
          margin-bottom: 8px;
          page-break-inside: avoid;
        }
        .pdf-paragraph {
          margin-bottom: 8px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .pdf-list {
          margin: 8px 0;
          padding-left: 20px;
        }
        .pdf-list-item {
          margin-bottom: 4px;
          page-break-inside: avoid;
        }
        .pdf-block-separator {
          height: 8px;
        }
        .pdf-bold { font-weight: 700; color: #000; }
        .pdf-code-inline { font-family: 'Consolas', monospace; background: #f1f5f9; padding: 2px 4px; font-size: 9pt; border: 1px solid #e2e8f0; }

        /* --- PROGRESS BAR --- */
        .progress-container {
          height: 8px; background: #e2e8f0; width: 100%; margin-top: 8px;
          position: relative; overflow: hidden;
        }
        .progress-bar {
          height: 100%; width: ${overallProgress}%;
          background: repeating-linear-gradient(
            45deg,
            #06b6d4,
            #06b6d4 5px,
            #0891b2 5px,
            #0891b2 10px
          );
        }

        /* --- FOOTER --- */
        .pdf-footer {
          position: absolute; bottom: 15mm; left: 20mm; right: 20mm;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          display: flex; justify-content: space-between;
          font-size: 7pt; color: #94a3b8; font-family: 'Consolas', monospace;
        }

        /* --- TABLES --- */
        .pdf-table-wrapper {
          page-break-inside: avoid;
          margin: 15px 0;
        }
        .pdf-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0; 
          font-size: 9pt; 
          page-break-inside: auto; 
        }
        .pdf-table thead {
          page-break-after: avoid;
        }
        .pdf-table tr { 
          page-break-inside: avoid; 
          page-break-after: auto; 
        }
        .pdf-table th { 
          background: #0f172a; 
          color: #fff; 
          text-transform: uppercase; 
          padding: 8px; 
          font-size: 8pt; 
          text-align: left; 
        }
        .pdf-table td { 
          border: 1px solid #e2e8f0; 
          padding: 8px; 
        }
        .pdf-table tr:nth-child(even) { background: #f8fafc; }

      </style>
    </head>
    <body>
      <div class="page-wrapper">
        <div class="tech-marker-tl"></div>
        <div class="tech-marker-tr"></div>
        <div class="tech-marker-bl"></div>
        <div class="tech-marker-br"></div>

        <div class="pdf-header">
          <div class="header-brand">Skill<span>Verse</span></div>
          <div class="header-meta">
            <div>REPORT: #${report.reportId?.toString().slice(0,8).toUpperCase() || "UNK"}</div>
            <div>DATE: ${formatDate(report.generatedAt)}</div>
          </div>
        </div>

        <div class="profile-container">
          <img src="${avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Meowl'}" 
               class="profile-avatar" 
               alt="Avatar" 
               crossorigin="anonymous"
               onError="this.style.display='none'" />
          <div class="profile-info">
            <div class="profile-name">${report.studentName || "PILOT"}</div>
            <div class="profile-badges">
              <span class="tech-badge">RANK: ${getTrendIcon(report.learningTrend)}</span>
              <span class="tech-badge cyan">PROG: ${overallProgress}%</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar"></div>
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-icon">⏱</span>
            <span class="metric-label">Training Time</span>
            <span class="metric-value">${totalStudyHours}h</span>
          </div>
          <div class="metric-card">
            <span class="metric-icon">🔥</span>
            <span class="metric-label">Streak Days</span>
            <span class="metric-value">${currentStreak}</span>
          </div>
          <div class="metric-card">
            <span class="metric-icon">☑</span>
            <span class="metric-label">Missions</span>
            <span class="metric-value">${totalTasksCompleted}</span>
          </div>
        </div>

        ${sections.currentSkills ? `
        <div class="content-section">
          <div class="pdf-h2"><span class="pdf-h2-decor"></span>CURRENT SKILLSET</div>
          <div class="pdf-content">${markdownToHTML(sections.currentSkills)}</div>
        </div>` : ''}

        ${sections.progress ? `
        <div class="content-section">
          <div class="pdf-h2"><span class="pdf-h2-decor"></span>MISSION PROGRESS</div>
          <div class="pdf-content">${markdownToHTML(sections.progress)}</div>
        </div>` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; page-break-inside: avoid;">
          ${sections.strengths ? `
          <div class="content-section">
            <div class="pdf-h2"><span class="pdf-h2-decor"></span>STRENGTHS</div>
            <div class="pdf-content">${markdownToHTML(sections.strengths)}</div>
          </div>` : ''}
          
          ${sections.areasToImprove ? `
          <div class="content-section">
            <div class="pdf-h2"><span class="pdf-h2-decor"></span>WEAKNESS DETECTED</div>
            <div class="pdf-content">${markdownToHTML(sections.areasToImprove)}</div>
          </div>` : ''}
        </div>

        ${sections.recommendations ? `
        <div class="content-section">
          <div class="pdf-h2"><span class="pdf-h2-decor"></span>TACTICAL ADVICE</div>
          <div class="pdf-content">${markdownToHTML(sections.recommendations)}</div>
        </div>` : ''}

        <div class="pdf-footer">
          <div>GENERATED BY SKILLVERSE AI CORE</div>
          <div>SECURE DOCUMENT // DO NOT DISTRIBUTE</div>
          <div>PAGE 1/1</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate PDF from HTML content (Fixed Pagination)
 */
export async function generatePDFFromHTML(
  report: StudentLearningReportResponse,
  options: HTMLPDFOptions = {},
): Promise<Blob> {
  const opts = { ...defaultOptions, ...options };

  // Convert avatar to base64 if provided to avoid CORS issues
  let avatarBase64 = opts.userAvatar;
  
  if (opts.userAvatar && !opts.userAvatar.startsWith('data:')) {
    try {
      avatarBase64 = await imageUrlToBase64(opts.userAvatar);
    } catch (error) {
      console.error('❌ Failed to convert avatar:', error);
      // Use default avatar based on student name
      const seed = report.studentName || 'Student';
      avatarBase64 = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
    }
  } else if (!opts.userAvatar) {
    const seed = report.studentName || 'Student';
    avatarBase64 = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
  } else {
    console.log('Avatar is already base64, length:', opts.userAvatar.length);
  }

  // Create container
  const container = document.createElement("div");
  container.id = "pdf-render-container";
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
  `;

  // Render HTML
  const html = generateReportHTML(report, avatarBase64);
  container.innerHTML = html;
  document.body.appendChild(container);
  
  // Log the actual img src being used
  const imgElement = container.querySelector('.profile-avatar') as HTMLImageElement;
  if (imgElement) {
    console.log('Image element src:', imgElement.src.substring(0, 100));
  }

  try {
    // Wait for fonts
    await document.fonts.ready;
    
    // Wait for all images to load
    const images = container.querySelectorAll('img');
    console.log('Waiting for', images.length, 'images to load...');
    await Promise.all(
      Array.from(images).map((img: HTMLImageElement) => {
        if (img.complete) {
          console.log('Image already loaded:', img.src.substring(0, 50));
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          img.onload = () => {
            console.log('Image loaded:', img.src.substring(0, 50));
            resolve();
          };
          img.onerror = () => {
            console.error('Image failed to load:', img.src.substring(0, 50));
            resolve();
          };
          // Timeout after 5 seconds
          setTimeout(() => resolve(), 5000);
        });
      })
    );
    console.log('All images processed');

    const canvas = await html2canvas(container, {
      scale: opts.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794, // Approx 210mm @ 96 DPI
      windowWidth: 1000,
      onclone: (clonedDoc) => {
        // Ensure all images are loaded in cloned document
        const clonedImages = clonedDoc.querySelectorAll('img');
        clonedImages.forEach((img: any) => {
          if (img.style) {
            img.style.display = 'block';
          }
        });
      }
    });

    // Kích thước trang A4 (mm)
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Tính toán chiều cao ảnh tương ứng trên PDF
    const imgWidth = pageWidth; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('PDF dimensions:', imgWidth, 'x', imgHeight);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let heightLeft = imgHeight;
    let position = 0; // Vị trí Y bắt đầu vẽ ảnh
    const imgData = canvas.toDataURL("image/jpeg", opts.quality);

    // Trang 1
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Các trang tiếp theo (Loop fix)
    while (heightLeft > 0) {
      position -= pageHeight; // Dịch ảnh lên trên để hiển thị phần tiếp theo
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Download PDF Helper
 */
export async function downloadVietnamesePDF(
  report: StudentLearningReportResponse,
  options: HTMLPDFOptions = {},
): Promise<void> {
  const opts = { ...defaultOptions, ...options };
  const blob = await generatePDFFromHTML(report, opts);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${opts.filename}-${report.reportId || Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  generatePDFFromHTML,
  downloadVietnamesePDF,
  generateReportHTML,
  markdownToHTML,
};