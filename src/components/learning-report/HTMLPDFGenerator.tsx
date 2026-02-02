/**
 * HTML-based PDF Generator for Vietnamese Support
 *
 * This module generates PDFs by rendering HTML content and converting to PDF.
 * This approach fully supports Vietnamese characters with diacritical marks.
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { StudentLearningReportResponse } from "../../services/learningReportService";

export interface HTMLPDFOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

const defaultOptions: HTMLPDFOptions = {
  filename: "bao-cao-hoc-tap",
  quality: 1,
  scale: 2,
};

/**
 * Parse markdown table alignment from separator line
 * Examples: |:---|:---:|---:|
 * :--- = left, :---: = center, ---: = right
 */
function parseTableAlignment(separatorLine: string): string[] {
  const cells = separatorLine
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c !== "");

  return cells.map((cell) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
    if (trimmed.endsWith(":")) return "right";
    return "left";
  });
}

/**
 * Process cell content with markdown formatting
 */
function processCellContent(content: string): string {
  let processed = content.trim();

  // Handle line breaks
  processed = processed.replace(/<br\s*\/?>/gi, "<br/>");

  // Bold text
  processed = processed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic text
  processed = processed.replace(/\*(.+?)\*/g, "<em>$1</em>");
  processed = processed.replace(/_(.+?)_/g, "<em>$1</em>");

  // Inline code
  processed = processed.replace(
    /`(.+?)`/g,
    '<code class="pdf-code-inline">$1</code>',
  );

  // Links
  processed = processed.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" class="pdf-link">$1</a>',
  );

  return processed;
}

/**
 * Detect if row contains special keywords for styling
 */
function isSpecialRow(cells: string[]): string | null {
  const firstCell = cells[0]?.toLowerCase().trim();
  if (!firstCell) return null;

  if (firstCell.includes("tổng") || firstCell.includes("total")) return "total";
  if (firstCell.includes("trung bình") || firstCell.includes("average"))
    return "average";
  if (firstCell.includes("kết quả") || firstCell.includes("result"))
    return "result";

  return null;
}

/**
 * Detect table size variant based on column count
 */
function getTableSizeClass(columnCount: number): string {
  if (columnCount <= 2) return "pdf-table-compact";
  if (columnCount >= 5) return "pdf-table-wide";
  return "";
}

/**
 * Parse markdown tables to HTML with advanced features
 */
function parseMarkdownTable(markdown: string): string {
  const lines = markdown.trim().split("\n");
  if (lines.length < 2) return markdown;

  // Check if it looks like a table (has | characters)
  if (!lines[0].includes("|")) return markdown;

  let alignments: string[] = [];
  let isHeader = true;
  let inBody = false;
  let columnCount = 0;

  // First pass: determine column count
  for (const line of lines) {
    if (line.includes("|")) {
      const cells = line
        .split(/(?<!\\)\|/)
        .map((c) => c.replace(/\\\|/g, "|").trim())
        .filter((c, idx, arr) => {
          if (idx === 0 && c === "" && line.startsWith("|")) return false;
          if (idx === arr.length - 1 && c === "" && line.endsWith("|"))
            return false;
          return true;
        });
      columnCount = Math.max(columnCount, cells.length);
    }
  }

  const sizeClass = getTableSizeClass(columnCount);
  let html = `<table class="pdf-table ${sizeClass}">`;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse separator line (|---|:---:|---:|) for alignment
    if (/^\|?[\s\-:]+\|/.test(line) && line.includes("-")) {
      alignments = parseTableAlignment(line);
      isHeader = false;
      continue;
    }

    // Parse cells - handle escaped pipes \|
    const cells = line
      .split(/(?<!\\)\|/)
      .map((c) => c.replace(/\\\|/g, "|").trim())
      .filter((c, idx, arr) => {
        // Filter empty first/last cells if line starts/ends with |
        if (idx === 0 && c === "" && line.startsWith("|")) return false;
        if (idx === arr.length - 1 && c === "" && line.endsWith("|"))
          return false;
        return true;
      });

    if (cells.length === 0) continue;

    if (isHeader) {
      html += "<thead><tr>";
      cells.forEach((cell, idx) => {
        const align = alignments[idx] || "left";
        const processed = processCellContent(cell);
        html += `<th style="text-align: ${align}">${processed}</th>`;
      });
      html += "</tr></thead>";
    } else {
      if (!inBody) {
        html += "<tbody>";
        inBody = true;
      }

      // Check if this is a special row (total, average, etc.)
      const specialType = isSpecialRow(cells);
      const rowClass = specialType ? `pdf-table-row-${specialType}` : "";

      html += `<tr ${rowClass ? `class="${rowClass}"` : ""}>`;
      cells.forEach((cell, idx) => {
        const align = alignments[idx] || "left";
        const processed = processCellContent(cell);
        html += `<td style="text-align: ${align}">${processed}</td>`;
      });
      html += "</tr>";
    }
  }

  if (inBody) {
    html += "</tbody>";
  }
  html += "</table>";

  return html;
}

/**
 * Convert markdown to HTML with Vietnamese support
 */
export function markdownToHTML(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Split into blocks to handle tables separately
  const blocks = html.split(/\n\n+/);
  const processedBlocks = blocks.map((block) => {
    // Check if block is a table
    if (block.includes("|") && block.split("\n").length >= 2) {
      const lines = block.split("\n");
      // Check for table separator (|---|---|)
      const hasTableSeparator = lines.some((line) =>
        /^\|?[\s\-:]+\|/.test(line),
      );
      if (hasTableSeparator) {
        return parseMarkdownTable(block);
      }
    }

    // Process normal markdown
    let processed = block;

    // Headers
    processed = processed.replace(/^### (.+)$/gm, '<h3 class="pdf-h3">$1</h3>');
    processed = processed.replace(/^## (.+)$/gm, '<h2 class="pdf-h2">$1</h2>');
    processed = processed.replace(/^# (.+)$/gm, '<h1 class="pdf-h1">$1</h1>');

    // Bold
    processed = processed.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="pdf-bold">$1</strong>',
    );

    // Italic
    processed = processed.replace(
      /\*(.+?)\*/g,
      '<em class="pdf-italic">$1</em>',
    );

    // Inline code
    processed = processed.replace(
      /`(.+?)`/g,
      '<code class="pdf-inline-code">$1</code>',
    );

    // Bullet lists
    if (/^[-*]\s/.test(processed)) {
      const items = processed.split(/\n/).filter((l) => l.trim());
      const listItems = items
        .map((item) => {
          const text = item.replace(/^[-*]\s+/, "");
          return `<li class="pdf-list-item">${text}</li>`;
        })
        .join("");
      processed = `<ul class="pdf-list">${listItems}</ul>`;
    }

    // Numbered lists
    else if (/^\d+\.\s/.test(processed)) {
      const items = processed.split(/\n/).filter((l) => l.trim());
      const listItems = items
        .map((item) => {
          const text = item.replace(/^\d+\.\s+/, "");
          return `<li class="pdf-list-item">${text}</li>`;
        })
        .join("");
      processed = `<ol class="pdf-list">${listItems}</ol>`;
    }

    // Line breaks
    processed = processed.replace(/\n/g, "<br/>");

    return processed;
  });

  return processedBlocks.join('<div class="pdf-block-separator"></div>');
}

/**
 * Generate PDF report HTML template
 */
export function generateReportHTML(
  report: StudentLearningReportResponse,
): string {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getTrendVietnamese = (trend: string) => {
    switch (trend) {
      case "improving":
        return "📈 Đang tiến bộ";
      case "stable":
        return "➡️ Ổn định";
      case "declining":
        return "📉 Cần cải thiện";
      default:
        return "📊 Chưa xác định";
    }
  };

  const getReportTypeVietnamese = (type: string) => {
    const types: Record<string, string> = {
      COMPREHENSIVE: "Báo cáo Toàn diện",
      WEEKLY_SUMMARY: "Tóm tắt Tuần",
      MONTHLY_SUMMARY: "Tóm tắt Tháng",
      SKILL_ASSESSMENT: "Đánh giá Kỹ năng",
      GOAL_TRACKING: "Theo dõi Mục tiêu",
    };
    return types[type] || type;
  };

  const sections = report.sections || {};

  // Build section HTML
  const sectionConfigs = [
    { title: "🎯 Kỹ năng Hiện có", content: sections.currentSkills },
    { title: "🏆 Mục tiêu Học tập", content: sections.learningGoals },
    {
      title: "📈 Tiến độ Học tập",
      content: sections.progress || sections.progressSummary,
    },
    { title: "💪 Điểm mạnh", content: sections.strengths },
    { title: "🔧 Cần Cải thiện", content: sections.areasToImprove },
    { title: "💡 Khuyến nghị", content: sections.recommendations },
    { title: "📚 Khoảng trống Kỹ năng", content: sections.skillGaps },
    { title: "🚀 Bước Tiếp theo", content: sections.nextSteps },
    { title: "✨ Động lực", content: sections.motivation },
  ];

  const sectionsHTML = sectionConfigs
    .filter((s) => s.content && s.content.trim())
    .map(
      (section) => `
      <div class="pdf-section">
        <h2 class="pdf-section-title">${section.title}</h2>
        <div class="pdf-section-content">
          ${markdownToHTML(section.content || "")}
        </div>
      </div>
    `,
    )
    .join("");

  // Metrics - cast to any to handle both backend and frontend field names
  const metricsData = (report.metrics || {}) as unknown as Record<
    string,
    unknown
  >;
  const totalStudyHours =
    (metricsData.totalStudyHours as number) ||
    (metricsData.totalStudyMinutesWeek
      ? Math.round((metricsData.totalStudyMinutesWeek as number) / 60)
      : 0);
  const currentStreak =
    (metricsData.currentStreak as number) ||
    (metricsData.streakDays as number) ||
    0;
  const totalTasksCompleted =
    (metricsData.totalTasksCompleted as number) ||
    (metricsData.completedTasks as number) ||
    0;

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', 'Arial Unicode MS', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1e293b;
          background: #ffffff;
          padding: 20mm;
          max-width: 210mm;
        }
        
        .pdf-header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #8b5cf6;
          margin-bottom: 30px;
        }
        
        .pdf-logo {
          font-size: 28pt;
          font-weight: bold;
          color: #8b5cf6;
          margin-bottom: 5px;
        }
        
        .pdf-tagline {
          font-size: 10pt;
          color: #64748b;
        }
        
        .pdf-title {
          font-size: 24pt;
          font-weight: bold;
          color: #1e293b;
          margin: 30px 0 10px;
          text-align: center;
        }
        
        .pdf-subtitle {
          font-size: 14pt;
          color: #64748b;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .pdf-info-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .pdf-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .pdf-info-label {
          color: #64748b;
          font-weight: 500;
        }
        
        .pdf-info-value {
          color: #1e293b;
          font-weight: 600;
        }
        
        .pdf-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .pdf-metric-card {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        
        .pdf-metric-card.secondary {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        }
        
        .pdf-metric-card.success {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }
        
        .pdf-metric-value {
          font-size: 24pt;
          font-weight: bold;
          display: block;
        }
        
        .pdf-metric-label {
          font-size: 9pt;
          opacity: 0.9;
        }
        
        .pdf-section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .pdf-section-title {
          font-size: 14pt;
          font-weight: bold;
          color: #8b5cf6;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .pdf-section-content {
          color: #334155;
          font-size: 10.5pt;
        }
        
        .pdf-h1 { font-size: 16pt; color: #1e293b; margin: 15px 0 10px; }
        .pdf-h2 { font-size: 13pt; color: #334155; margin: 12px 0 8px; }
        .pdf-h3 { font-size: 11pt; color: #475569; margin: 10px 0 6px; }
        
        .pdf-bold { font-weight: 600; }
        .pdf-italic { font-style: italic; }
        
        .pdf-inline-code {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Consolas', monospace;
          font-size: 9pt;
        }
        
        .pdf-list {
          margin: 10px 0 10px 20px;
        }
        
        .pdf-list-item {
          margin-bottom: 6px;
        }
        
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 9.5pt;
          table-layout: auto;
          word-wrap: break-word;
        }

        /* Compact table (2 columns or less) */
        .pdf-table-compact {
          width: 60%;
          margin-left: auto;
          margin-right: auto;
        }

        .pdf-table-compact th,
        .pdf-table-compact td {
          padding: 12px 20px;
          font-size: 10pt;
        }

        /* Wide table (5+ columns) */
        .pdf-table-wide {
          font-size: 8.5pt;
        }

        .pdf-table-wide th,
        .pdf-table-wide td {
          padding: 8px 10px;
        }
        
        .pdf-table th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 1px solid #5a67d8;
          padding: 12px 14px;
          text-align: left;
          font-weight: 600;
          color: #ffffff;
          font-size: 10pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .pdf-table td {
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          vertical-align: top;
          line-height: 1.6;
          word-break: break-word;
          max-width: 300px;
        }
        
        .pdf-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .pdf-table tr:hover {
          background: #f1f5f9;
        }

        /* Special row styling */
        .pdf-table-row-total {
          background: #fef3c7 !important;
          font-weight: 600;
          border-top: 2px solid #f59e0b;
        }

        .pdf-table-row-total td {
          color: #92400e;
          font-weight: 700;
        }

        .pdf-table-row-average {
          background: #dbeafe !important;
          font-weight: 500;
        }

        .pdf-table-row-result {
          background: #d1fae5 !important;
          font-weight: 600;
        }

        /* Inline elements in table cells */
        .pdf-table strong {
          color: #1e293b;
          font-weight: 700;
        }

        .pdf-table em {
          color: #64748b;
          font-style: italic;
        }

        .pdf-table .pdf-code-inline {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 3px;
          padding: 2px 6px;
          font-family: 'Courier New', monospace;
          font-size: 8.5pt;
          color: #e11d48;
        }

        .pdf-table .pdf-link {
          color: #3b82f6;
          text-decoration: underline;
        }

        /* Responsive column widths */
        .pdf-table th:first-child,
        .pdf-table td:first-child {
          min-width: 80px;
        }

        .pdf-table tbody tr:last-child {
          border-bottom: 2px solid #cbd5e1;
        }

        /* Zebra striping for better readability */
        .pdf-table tbody tr:nth-child(odd) {
          background: #ffffff;
        }

        .pdf-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .pdf-block-separator {
          height: 10px;
        }
        
        .pdf-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 9pt;
          color: #64748b;
        }
        
        @media print {
          body { padding: 15mm; }
          .pdf-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="pdf-header">
        <div class="pdf-logo">SkillVerse</div>
        <div class="pdf-tagline">Your AI-Powered Learning Companion</div>
      </div>
      
      <h1 class="pdf-title">BÁO CÁO HỌC TẬP CÁ NHÂN</h1>
      <p class="pdf-subtitle">${getReportTypeVietnamese(report.reportType || "COMPREHENSIVE")}</p>
      
      <div class="pdf-info-box">
        <div class="pdf-info-row">
          <span class="pdf-info-label">Học viên:</span>
          <span class="pdf-info-value">${report.studentName || "N/A"}</span>
        </div>
        <div class="pdf-info-row">
          <span class="pdf-info-label">Ngày tạo:</span>
          <span class="pdf-info-value">${formatDate(report.generatedAt)}</span>
        </div>
        <div class="pdf-info-row">
          <span class="pdf-info-label">Xu hướng học tập:</span>
          <span class="pdf-info-value">${getTrendVietnamese(report.learningTrend)}</span>
        </div>
        <div class="pdf-info-row">
          <span class="pdf-info-label">Tiến độ tổng thể:</span>
          <span class="pdf-info-value">${report.overallProgress || 0}%</span>
        </div>
      </div>
      
      <div class="pdf-metrics-grid">
        <div class="pdf-metric-card">
          <span class="pdf-metric-value">${totalStudyHours}h</span>
          <span class="pdf-metric-label">Giờ học tuần này</span>
        </div>
        <div class="pdf-metric-card secondary">
          <span class="pdf-metric-value">${currentStreak}</span>
          <span class="pdf-metric-label">Ngày streak</span>
        </div>
        <div class="pdf-metric-card success">
          <span class="pdf-metric-value">${totalTasksCompleted}</span>
          <span class="pdf-metric-label">Tasks hoàn thành</span>
        </div>
      </div>
      
      ${sectionsHTML}
      
      <div class="pdf-footer">
        <p>© ${new Date().getFullYear()} SkillVerse - Báo cáo được tạo tự động bởi AI</p>
        <p>Mã báo cáo: #${report.reportId || "N/A"}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate PDF from HTML content with full Vietnamese support
 */
export async function generatePDFFromHTML(
  report: StudentLearningReportResponse,
  options: HTMLPDFOptions = {},
): Promise<Blob> {
  const opts = { ...defaultOptions, ...options };

  // Create a hidden container for rendering
  const container = document.createElement("div");
  container.id = "pdf-render-container";
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
  `;

  // Generate and set HTML content
  const html = generateReportHTML(report);
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // Wait for fonts to load
    await document.fonts.ready;

    // Use html2canvas to capture the rendered content
    const canvas = await html2canvas(container, {
      scale: opts.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL("image/jpeg", opts.quality);

    // Add first page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output("blob");
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

/**
 * Download PDF with Vietnamese support
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
