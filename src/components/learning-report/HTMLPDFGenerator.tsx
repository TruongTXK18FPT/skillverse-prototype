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
  filename: "learning-report",
  quality: 0.95,
  scale: 2,
};

async function imageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(url);
          return;
        }
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png", 0.92));
      } catch {
        resolve(url);
      }
    };
    image.onerror = () => resolve(url);
    image.src = url;
  });
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderTimelineBars = (report: StudentLearningReportResponse) => {
  const timeline = report.timeline || [];
  if (timeline.length === 0) {
    return `<div class="pdf-empty">Chưa có timeline cho khoảng này.</div>`;
  }

  const maxStudy = Math.max(
    1,
    ...timeline.map((point) => point.studyMinutes || 0),
  );

  return `
    <div class="pdf-chart">
      ${timeline
        .map((point) => {
          const height = Math.max(
            12,
            Math.round(((point.studyMinutes || 0) / maxStudy) * 130),
          );

          return `
            <div class="pdf-chart__item">
              <div class="pdf-chart__meta">${point.missionsCompleted || 0} mission</div>
              <div class="pdf-chart__bar-wrap">
                <div class="pdf-chart__bar" style="height:${height}px"></div>
              </div>
              <div class="pdf-chart__value">${point.studyMinutes || 0}m</div>
              <div class="pdf-chart__label">${escapeHtml(point.bucketLabel || "")}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
};

const renderRoadmapTable = (report: StudentLearningReportResponse) => {
  if (!report.roadmapBreakdown.length) {
    return `<div class="pdf-empty">Chưa có roadmap để hiển thị.</div>`;
  }

  return `
    <table class="pdf-table">
      <thead>
        <tr>
          <th>Roadmap</th>
          <th>Progress</th>
          <th>Missions</th>
          <th>Next Mission</th>
        </tr>
      </thead>
      <tbody>
        ${report.roadmapBreakdown
          .map(
            (item) => `
          <tr>
            <td>
              <strong>${escapeHtml(item.title)}</strong>
              <div class="pdf-subtle">${escapeHtml(item.goal || "Chưa có goal")}</div>
            </td>
            <td>${item.progressPercent}%</td>
            <td>${item.completedMissions}/${item.totalMissions}</td>
            <td>${escapeHtml(item.nextMissionTitle || "Đã hoàn thành")}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
};

const renderCourseTable = (report: StudentLearningReportResponse) => {
  if (!report.courseBreakdown.length) {
    return `<div class="pdf-empty">Chưa có course để hiển thị.</div>`;
  }

  return `
    <table class="pdf-table">
      <thead>
        <tr>
          <th>Course</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Completed At</th>
        </tr>
      </thead>
      <tbody>
        ${report.courseBreakdown
          .map(
            (item) => `
          <tr>
            <td>${escapeHtml(item.courseTitle)}</td>
            <td>${escapeHtml(item.status)}</td>
            <td>${item.progressPercent}%</td>
            <td>${escapeHtml(item.completedAt ? formatDate(item.completedAt) : "—")}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
};

export function generateReportHTML(
  report: StudentLearningReportResponse,
  avatarUrl?: string,
): string {
  const recommendations =
    report.overview?.recommendations?.length > 0
      ? report.overview.recommendations
      : ["Chưa có khuyến nghị."];

  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #123041;
            font-family: "Segoe UI", Arial, sans-serif;
          }
          .pdf-page {
            width: 210mm;
            min-height: 297mm;
            padding: 16mm;
            background:
              radial-gradient(circle at top left, rgba(20, 184, 166, 0.14), transparent 28%),
              linear-gradient(180deg, #ffffff 0%, #f4fafb 100%);
          }
          .pdf-hero {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: center;
            padding: 18px 20px;
            border-radius: 22px;
            border: 1px solid rgba(18, 48, 65, 0.08);
            background: rgba(255, 255, 255, 0.92);
          }
          .pdf-brand {
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 11px;
            color: #0f766e;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .pdf-title {
            margin: 0 0 8px;
            font-size: 30px;
            font-weight: 800;
            line-height: 1;
          }
          .pdf-meta {
            color: #5d7485;
            font-size: 13px;
          }
          .pdf-avatar {
            width: 72px;
            height: 72px;
            border-radius: 20px;
            object-fit: cover;
            border: 4px solid #edf6f7;
          }
          .pdf-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 14px;
          }
          .pdf-card {
            border-radius: 18px;
            border: 1px solid rgba(18, 48, 65, 0.08);
            background: #ffffff;
            padding: 14px;
            page-break-inside: avoid;
          }
          .pdf-card small {
            display: block;
            color: #6a8192;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 10px;
            margin-bottom: 8px;
          }
          .pdf-card strong {
            font-size: 26px;
          }
          .pdf-card span {
            display: block;
            color: #567083;
            margin-top: 6px;
            font-size: 12px;
          }
          .pdf-section {
            margin-top: 18px;
            border-radius: 22px;
            border: 1px solid rgba(18, 48, 65, 0.08);
            background: rgba(255, 255, 255, 0.92);
            padding: 18px;
            page-break-inside: avoid;
          }
          .pdf-section h2 {
            margin: 0 0 12px;
            font-size: 18px;
            line-height: 1.1;
          }
          .pdf-section p {
            margin: 0;
            color: #567083;
          }
          .pdf-tips {
            display: grid;
            gap: 10px;
          }
          .pdf-tip {
            display: grid;
            grid-template-columns: 28px 1fr;
            gap: 10px;
            align-items: start;
            padding: 12px;
            border-radius: 16px;
            background: linear-gradient(135deg, #f6fdfc, #fff7ed);
          }
          .pdf-tip__index {
            width: 28px;
            height: 28px;
            border-radius: 10px;
            background: #123041;
            color: #ffffff;
            display: grid;
            place-items: center;
            font-weight: 700;
            font-size: 12px;
          }
          .pdf-chart {
            display: grid;
            grid-template-columns: repeat(${Math.max(report.timeline.length, 1)}, minmax(0, 1fr));
            gap: 10px;
            align-items: end;
            min-height: 190px;
          }
          .pdf-chart__item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
          .pdf-chart__meta,
          .pdf-chart__value,
          .pdf-chart__label {
            font-size: 10px;
            color: #5d7485;
            text-align: center;
          }
          .pdf-chart__bar-wrap {
            width: 100%;
            min-height: 140px;
            display: flex;
            align-items: end;
            justify-content: center;
            border-radius: 16px;
            background: #eef5f6;
            padding: 8px;
          }
          .pdf-chart__bar {
            width: 100%;
            border-radius: 12px 12px 0 0;
            background: linear-gradient(180deg, #14b8a6 0%, #0f766e 100%);
          }
          .pdf-table {
            width: 100%;
            border-collapse: collapse;
          }
          .pdf-table th,
          .pdf-table td {
            padding: 10px 8px;
            text-align: left;
            border-bottom: 1px solid rgba(18, 48, 65, 0.08);
            font-size: 12px;
            vertical-align: top;
          }
          .pdf-table th {
            color: #6a8192;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 10px;
          }
          .pdf-subtle {
            color: #6a8192;
            font-size: 11px;
            margin-top: 4px;
          }
          .pdf-empty {
            border-radius: 16px;
            background: #f5fafb;
            padding: 14px;
            color: #567083;
          }
          .pdf-footer {
            margin-top: 16px;
            display: flex;
            justify-content: space-between;
            color: #6a8192;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="pdf-page">
          <section class="pdf-hero">
            <div>
              <div class="pdf-brand">${report.snapshot ? "Saved Snapshot" : "Live Analytics"}</div>
              <h1 class="pdf-title">${escapeHtml(report.reportName || "Learning Report")}</h1>
              <div class="pdf-meta">
                ${escapeHtml(report.studentName)}<br />
                ${escapeHtml(formatDate(report.generatedAt))}
              </div>
            </div>
            ${
              avatarUrl
                ? `<img src="${avatarUrl}" class="pdf-avatar" alt="Avatar" crossorigin="anonymous" />`
                : ""
            }
          </section>

          <section class="pdf-grid">
            <div class="pdf-card">
              <small>Overall Progress</small>
              <strong>${report.overallProgress}%</strong>
              <span>Trend: ${escapeHtml(report.learningTrend)}</span>
            </div>
            <div class="pdf-card">
              <small>Study Hours</small>
              <strong>${report.studyStats.totalStudyHours}h</strong>
              <span>${report.studyStats.studyMinutesWeek} phút / tuần</span>
            </div>
            <div class="pdf-card">
              <small>Streak</small>
              <strong>${report.studyStats.currentStreak}</strong>
              <span>ngày liên tiếp</span>
            </div>
            <div class="pdf-card">
              <small>Tasks</small>
              <strong>${report.taskStats.completedTasks}/${report.taskStats.totalTasks}</strong>
              <span>${report.taskStats.pendingTasks} chờ, ${report.taskStats.overdueTasks} quá hạn</span>
            </div>
            <div class="pdf-card">
              <small>Missions</small>
              <strong>${report.roadmapStats.completedMissions}/${report.roadmapStats.totalMissions}</strong>
              <span>${report.roadmapStats.pendingMissions} mission còn lại</span>
            </div>
            <div class="pdf-card">
              <small>Courses</small>
              <strong>${report.courseStats.averageActiveCourseProgress}%</strong>
              <span>${report.courseStats.activeCourses} khóa đang học</span>
            </div>
          </section>

          <section class="pdf-section">
            <h2>Khuyến nghị ngắn</h2>
            <div class="pdf-tips">
              ${recommendations
                .map(
                  (item, index) => `
                <div class="pdf-tip">
                  <div class="pdf-tip__index">${index + 1}</div>
                  <div>${escapeHtml(item)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </section>

          <section class="pdf-section">
            <h2>Timeline ${escapeHtml(report.range)}</h2>
            ${renderTimelineBars(report)}
          </section>

          <section class="pdf-section">
            <h2>Roadmap Breakdown</h2>
            ${renderRoadmapTable(report)}
          </section>

          <section class="pdf-section">
            <h2>Course Breakdown</h2>
            ${renderCourseTable(report)}
          </section>

          <footer class="pdf-footer">
            <span>SkillVerse Learning Report</span>
            <span>${report.snapshot ? "Snapshot" : "Live"} / ${escapeHtml(report.range)}</span>
          </footer>
        </div>
      </body>
    </html>
  `;
}

export async function generatePDFFromHTML(
  report: StudentLearningReportResponse,
  options: HTMLPDFOptions = {},
): Promise<Blob> {
  const opts = { ...defaultOptions, ...options };
  let avatar = opts.userAvatar;

  if (avatar && !avatar.startsWith("data:")) {
    avatar = await imageUrlToBase64(avatar);
  }

  const container = document.createElement("div");
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
  `;
  container.innerHTML = generateReportHTML(report, avatar);
  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    const canvas = await html2canvas(container, {
      scale: opts.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", opts.quality);

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadVietnamesePDF(
  report: StudentLearningReportResponse,
  options: HTMLPDFOptions = {},
): Promise<void> {
  const opts = { ...defaultOptions, ...options };
  const blob = await generatePDFFromHTML(report, opts);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${opts.filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  generatePDFFromHTML,
  downloadVietnamesePDF,
  generateReportHTML,
};
