import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { StudentLearningReportResponse } from "../../services/learningReportService";

import {
  normalizeVietnamese,
  markdownToPlainText,
  parseMarkdownSections,
} from "./fonts/VietnameseFont";

interface PDFGeneratorOptions {
  filename?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  quality?: "low" | "medium" | "high";
  useVietnameseNormalization?: boolean;
  userAvatar?: string;
  branding?: {
    logo?: string;
    companyName?: string;
    tagline?: string;
  };
}

interface PDFSection {
  title: string;
  content: string;
  icon?: string;
}

const defaultOptions: PDFGeneratorOptions = {
  filename: "learning-report",
  includeHeader: true,
  includeFooter: true,
  includePageNumbers: true,
  quality: "high",
  useVietnameseNormalization: true,
  branding: {
    companyName: "SkillVerse",
    tagline: "Your AI-Powered Learning Companion",
  },
};

// Color palette - RGB values for jsPDF
const COLORS = {
  primary: [168, 85, 247] as const, // Purple
  secondary: [6, 182, 212] as const, // Cyan
  success: [34, 197, 94] as const, // Green
  warning: [251, 191, 36] as const, // Yellow
  danger: [239, 68, 68] as const, // Red
  dark: [15, 23, 42] as const, // Dark blue
  light: [226, 232, 240] as const, // Light gray
  white: [255, 255, 255] as const,
};

type RGB = readonly [number, number, number];

// Helper to convert readonly tuple to mutable for jsPDF
const rgb = (color: RGB): [number, number, number] =>
  [...color] as [number, number, number];

class LearningReportPDFGenerator {
  private pdf: jsPDF;
  private currentY: number = 0;
  private pageWidth: number;
  private pageHeight: number;
  private marginLeft: number = 20;
  private marginRight: number = 20;
  private marginTop: number = 25;
  private marginBottom: number = 25;
  private contentWidth: number;
  private pageNumber: number = 1;
  private options: PDFGeneratorOptions;
  private report: StudentLearningReportResponse;

  constructor(
    report: StudentLearningReportResponse,
    options: PDFGeneratorOptions = {},
  ) {
    this.report = report;
    this.options = { ...defaultOptions, ...options };
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      compress: true,
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.marginLeft - this.marginRight;
    this.currentY = this.marginTop;
  }

  /**
   * Generate the complete PDF document
   */
  async generate(): Promise<Blob> {
    // Cover page
    this.createCoverPage();

    // Add new page for content
    this.addNewPage();

    // Executive Summary
    this.addExecutiveSummary();

    // Metrics Overview
    this.addMetricsSection();

    // Report Sections
    this.addReportSections();

    // Footer on each page
    if (this.options.includeFooter || this.options.includePageNumbers) {
      this.addFootersToAllPages();
    }

    return this.pdf.output("blob");
  }

  /**
   * Create professional cover page
   */
  private createCoverPage(): void {
    // Background gradient effect (simulated with rectangles)
    this.pdf.setFillColor(...rgb(COLORS.dark));
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, "F");

    // Decorative elements
    this.pdf.setFillColor(...rgb(COLORS.primary));
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 0.1 }));
    this.pdf.circle(this.pageWidth * 0.8, this.pageHeight * 0.2, 60, "F");
    this.pdf.setFillColor(...rgb(COLORS.secondary));
    this.pdf.circle(this.pageWidth * 0.2, this.pageHeight * 0.8, 80, "F");
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }));

    // Company branding
    this.currentY = 50;
    this.pdf.setTextColor(...rgb(COLORS.primary));
    this.pdf.setFontSize(28);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      this.options.branding?.companyName || "SkillVerse",
      this.pageWidth / 2,
      this.currentY,
      { align: "center" },
    );

    // Tagline
    this.currentY += 12;
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(...rgb(COLORS.secondary));
    this.pdf.setFont("helvetica", "normal");
    this.pdf.text(
      this.options.branding?.tagline || "Your AI-Powered Learning Companion",
      this.pageWidth / 2,
      this.currentY,
      { align: "center" },
    );

    // Decorative line
    this.currentY += 15;
    this.pdf.setDrawColor(...rgb(COLORS.primary));
    this.pdf.setLineWidth(0.5);
    this.pdf.line(
      this.pageWidth / 4,
      this.currentY,
      (this.pageWidth * 3) / 4,
      this.currentY,
    );

    // Main title - Use normalized Vietnamese text
    this.currentY += 35;
    this.pdf.setFontSize(32);
    this.pdf.setTextColor(...rgb(COLORS.white));
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      this.processVietnameseText("BÁO CÁO HỌC TẬP"),
      this.pageWidth / 2,
      this.currentY,
      {
        align: "center",
      },
    );

    this.currentY += 15;
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...rgb(COLORS.light));
    this.pdf.setFont("helvetica", "normal");
    this.pdf.text(
      this.processVietnameseText("CÁ NHÂN"),
      this.pageWidth / 2,
      this.currentY,
      {
        align: "center",
      },
    );

    // Student info box
    this.currentY += 40;
    const boxWidth = 120;
    const boxHeight = 60;
    const boxX = (this.pageWidth - boxWidth) / 2;

    // Box background
    this.pdf.setFillColor(30, 41, 59);
    this.pdf.roundedRect(boxX, this.currentY, boxWidth, boxHeight, 5, 5, "F");
    this.pdf.setDrawColor(...rgb(COLORS.primary));
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(boxX, this.currentY, boxWidth, boxHeight, 5, 5, "S");

    // Student name
    this.currentY += 20;
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(...rgb(COLORS.light));
    this.pdf.text(
      this.processVietnameseText("Học viên:"),
      this.pageWidth / 2,
      this.currentY,
      {
        align: "center",
      },
    );

    this.currentY += 10;
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(...rgb(COLORS.white));
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      this.processVietnameseText(this.report.studentName || "Học viên"),
      this.pageWidth / 2,
      this.currentY,
      { align: "center" },
    );

    // Report date
    this.currentY += 15;
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(...rgb(COLORS.secondary));
    this.pdf.setFont("helvetica", "normal");
    const reportDate = new Date(this.report.generatedAt).toLocaleDateString(
      "vi-VN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );
    this.pdf.text(
      this.processVietnameseText(`Ngày tạo: ${reportDate}`),
      this.pageWidth / 2,
      this.currentY,
      {
        align: "center",
      },
    );

    // Report type badge
    this.currentY += 30;
    const reportTypeName = this.getReportTypeName(this.report.reportType);
    this.pdf.setFillColor(...rgb(COLORS.primary));
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 0.2 }));
    this.pdf.roundedRect(
      (this.pageWidth - 80) / 2,
      this.currentY - 8,
      80,
      16,
      3,
      3,
      "F",
    );
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }));
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...rgb(COLORS.primary));
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      this.processVietnameseText(reportTypeName),
      this.pageWidth / 2,
      this.currentY,
      {
        align: "center",
      },
    );

    // Bottom decorative element
    this.pdf.setFillColor(...rgb(COLORS.primary));
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 0.3 }));
    this.pdf.rect(0, this.pageHeight - 5, this.pageWidth, 5, "F");
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }));
  }

  /**
   * Add executive summary section
   */
  private addExecutiveSummary(): void {
    this.addSectionTitle("TỔNG QUAN BÁO CÁO");

    const metrics = this.report.metrics;
    if (!metrics) {
      this.addParagraph("Không có dữ liệu metrics.");
      return;
    }

    // Summary cards
    const summaryData = [
      {
        label: "Tiến độ tổng thể",
        value: `${this.report.overallProgress || 0}%`,
        color: COLORS.primary,
      },
      {
        label: "Tổng giờ học",
        value: `${metrics.totalStudyHours || 0}h`,
        color: COLORS.secondary,
      },
      {
        label: "Chuỗi ngày học",
        value: `${metrics.currentStreak || 0} ngày`,
        color: COLORS.warning,
      },
      {
        label: "Tasks hoàn thành",
        value: `${metrics.totalTasksCompleted || 0}`,
        color: COLORS.success,
      },
    ];

    const cardWidth = (this.contentWidth - 15) / 4;
    const cardHeight = 25;

    summaryData.forEach((item, index) => {
      const x = this.marginLeft + index * (cardWidth + 5);
      const y = this.currentY;

      // Card background
      this.pdf.setFillColor(30, 41, 59);
      this.pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "F");

      // Accent line
      this.pdf.setFillColor(...(item.color as [number, number, number]));
      this.pdf.rect(x, y, 3, cardHeight, "F");

      // Value
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(...rgb(COLORS.white));
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(
        this.processVietnameseText(item.value),
        x + cardWidth / 2 + 2,
        y + 10,
        {
          align: "center",
        },
      );

      // Label
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(...rgb(COLORS.light));
      this.pdf.setFont("helvetica", "normal");
      this.pdf.text(
        this.processVietnameseText(item.label),
        x + cardWidth / 2 + 2,
        y + 18,
        {
          align: "center",
        },
      );
    });

    this.currentY += cardHeight + 15;

    // Learning trend
    const trend = this.report.learningTrend;
    const trendInfo = this.getTrendInfo(trend);
    this.pdf.setFillColor(...(trendInfo.bgColor as [number, number, number]));
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 0.15 }));
    this.pdf.roundedRect(
      this.marginLeft,
      this.currentY,
      this.contentWidth,
      12,
      3,
      3,
      "F",
    );
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }));

    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...(trendInfo.color as [number, number, number]));
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      this.processVietnameseText(
        `${trendInfo.icon} Xu hướng học tập: ${trendInfo.label}`,
      ),
      this.pageWidth / 2,
      this.currentY + 8,
      { align: "center" },
    );

    this.currentY += 20;

    // Recommended focus
    if (this.report.recommendedFocus) {
      this.addInfoBox(
        this.processVietnameseText("💡 Đề xuất tập trung"),
        this.report.recommendedFocus,
      );
    }
  }

  /**
   * Add metrics section with detailed stats
   */
  private addMetricsSection(): void {
    this.checkPageBreak(80);
    this.addSectionTitle("CHỈ SỐ HỌC TẬP CHI TIẾT");

    const metrics = this.report.metrics;
    if (!metrics) return;

    // Study time breakdown
    this.addSubsectionTitle("⏱️ Thời gian học tập");
    const studyTimeData = [
      [
        this.processVietnameseText("Hôm nay"),
        `${Math.floor(((metrics.totalStudyHours || 0) / 30) * 24)}h`,
      ],
      [
        this.processVietnameseText("Tuần này"),
        `${Math.floor((metrics.totalStudyHours || 0) / 4)}h`,
      ],
      [
        this.processVietnameseText("Tổng cộng"),
        `${metrics.totalStudyHours || 0}h`,
      ],
    ];
    this.addDataTable(
      [
        this.processVietnameseText("Khoảng thời gian"),
        this.processVietnameseText("Giờ học"),
      ],
      studyTimeData,
    );

    this.currentY += 10;

    // Roadmap progress
    if (metrics.roadmapProgressList && metrics.roadmapProgressList.length > 0) {
      this.checkPageBreak(60);
      this.addSubsectionTitle("📚 Tiến độ Roadmap");
      const roadmapData = metrics.roadmapProgressList
        .slice(0, 5)
        .map((r) => [
          this.processVietnameseText(this.truncateText(r.roadmapTitle, 35)),
          `${r.completedSkills}/${r.totalSkills}`,
          `${r.progressPercentage}%`,
        ]);
      this.addDataTable(
        ["Roadmap", "Skills", this.processVietnameseText("Tiến độ")],
        roadmapData,
      );
    }

    this.currentY += 10;

    // Activity stats
    this.checkPageBreak(40);
    this.addSubsectionTitle("📊 Hoạt động");
    const activityData = [
      [
        this.processVietnameseText("Phiên chat AI"),
        `${metrics.totalChatSessions || 0} ${this.processVietnameseText("phiên")}`,
      ],
      [
        this.processVietnameseText("Tasks hoàn thành"),
        `${metrics.totalTasksCompleted || 0}/${(metrics.totalTasksCompleted || 0) + (metrics.totalTasksPending || 0)}`,
      ],
      [
        this.processVietnameseText("Streak hiện tại"),
        `${metrics.currentStreak || 0} ${this.processVietnameseText("ngày")}`,
      ],
      [
        this.processVietnameseText("Streak dài nhất"),
        `${metrics.longestStreak || 0} ${this.processVietnameseText("ngày")}`,
      ],
    ];
    this.addDataTable(
      [
        this.processVietnameseText("Chỉ số"),
        this.processVietnameseText("Giá trị"),
      ],
      activityData,
    );
  }

  /**
   * Add report sections from AI-generated content
   */
  private addReportSections(): void {
    const sections = this.report.sections;
    if (!sections) return;

    const sectionConfigs: PDFSection[] = [
      { title: "KỸ NĂNG HIỆN CÓ", content: sections.currentSkills, icon: "🎯" },
      {
        title: "MỤC TIÊU HỌC TẬP",
        content: sections.learningGoals,
        icon: "🏆",
      },
      { title: "TIẾN ĐỘ HỌC TẬP", content: sections.progress, icon: "📈" },
      { title: "ĐIỂM MẠNH", content: sections.strengths, icon: "💪" },
      { title: "CẦN CẢI THIỆN", content: sections.areasToImprove, icon: "🔧" },
      { title: "KHUYẾN NGHỊ", content: sections.recommendations, icon: "💡" },
      {
        title: "KHOẢNG TRỐNG KỸ NĂNG",
        content: sections.skillGaps,
        icon: "📚",
      },
      { title: "BƯỚC TIẾP THEO", content: sections.nextSteps, icon: "🚀" },
      { title: "ĐỘNG LỰC", content: sections.motivation, icon: "✨" },
    ];

    sectionConfigs.forEach((section) => {
      if (section.content && section.content.trim()) {
        this.checkPageBreak(40);
        this.addSectionTitle(`${section.icon} ${section.title}`);
        this.addMarkdownContent(section.content);
        this.currentY += 10;
      }
    });
  }

  // ============ Helper Methods ============

  private addSectionTitle(title: string): void {
    this.checkPageBreak(20);

    // Background bar
    this.pdf.setFillColor(...rgb(COLORS.primary));
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 0.1 }));
    this.pdf.rect(this.marginLeft, this.currentY, this.contentWidth, 12, "F");
    this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }));

    // Left accent
    this.pdf.setFillColor(...rgb(COLORS.primary));
    this.pdf.rect(this.marginLeft, this.currentY, 3, 12, "F");

    // Title text - Process Vietnamese
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...rgb(COLORS.primary));
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      this.processVietnameseText(title),
      this.marginLeft + 8,
      this.currentY + 8,
    );

    this.currentY += 18;
  }

  private addSubsectionTitle(title: string): void {
    this.checkPageBreak(15);
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...rgb(COLORS.secondary));
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      this.processVietnameseText(title),
      this.marginLeft,
      this.currentY,
    );
    this.currentY += 8;
  }

  private addParagraph(text: string): void {
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...rgb(COLORS.light));
    this.pdf.setFont("helvetica", "normal");

    const processedText = this.processVietnameseText(text);
    const lines = this.pdf.splitTextToSize(processedText, this.contentWidth);
    lines.forEach((line: string) => {
      this.checkPageBreak(6);
      this.pdf.text(line, this.marginLeft, this.currentY);
      this.currentY += 5;
    });
    this.currentY += 3;
  }

  private addInfoBox(title: string, content: string): void {
    this.checkPageBreak(25);

    const boxPadding = 8;
    const processedContent = this.processVietnameseText(content);
    const lines = this.pdf.splitTextToSize(
      processedContent,
      this.contentWidth - boxPadding * 2,
    );
    const boxHeight = 15 + lines.length * 5;

    // Box background
    this.pdf.setFillColor(30, 41, 59);
    this.pdf.roundedRect(
      this.marginLeft,
      this.currentY,
      this.contentWidth,
      boxHeight,
      3,
      3,
      "F",
    );

    // Border
    this.pdf.setDrawColor(...rgb(COLORS.secondary));
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(
      this.marginLeft,
      this.currentY,
      this.contentWidth,
      boxHeight,
      3,
      3,
      "S",
    );

    // Title
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...rgb(COLORS.secondary));
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(title, this.marginLeft + boxPadding, this.currentY + 8);

    // Content
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...rgb(COLORS.light));
    this.pdf.setFont("helvetica", "normal");
    let textY = this.currentY + 15;
    lines.forEach((line: string) => {
      this.pdf.text(line, this.marginLeft + boxPadding, textY);
      textY += 5;
    });

    this.currentY += boxHeight + 8;
  }

  private addDataTable(headers: string[], data: string[][]): void {
    const colWidth = this.contentWidth / headers.length;
    const rowHeight = 8;

    // Header row
    this.pdf.setFillColor(30, 41, 59);
    this.pdf.rect(
      this.marginLeft,
      this.currentY,
      this.contentWidth,
      rowHeight,
      "F",
    );

    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...rgb(COLORS.primary));
    this.pdf.setFont("helvetica", "bold");
    headers.forEach((header, i) => {
      this.pdf.text(
        header,
        this.marginLeft + i * colWidth + 4,
        this.currentY + 5.5,
      );
    });

    this.currentY += rowHeight;

    // Data rows
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(...rgb(COLORS.light));
    data.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight);

      if (rowIndex % 2 === 0) {
        this.pdf.setFillColor(20, 30, 50);
        this.pdf.rect(
          this.marginLeft,
          this.currentY,
          this.contentWidth,
          rowHeight,
          "F",
        );
      }

      row.forEach((cell, i) => {
        this.pdf.text(
          cell,
          this.marginLeft + i * colWidth + 4,
          this.currentY + 5.5,
        );
      });

      this.currentY += rowHeight;
    });

    this.currentY += 5;
  }

  /**
   * Process text for Vietnamese support
   * Normalizes Vietnamese characters when font doesn't support Unicode
   */
  private processVietnameseText(text: string): string {
    if (!text) return "";
    if (this.options.useVietnameseNormalization) {
      return normalizeVietnamese(text);
    }
    return text;
  }

  /**
   * Add markdown content with proper Vietnamese and formatting support
   */
  private addMarkdownContent(content: string): void {
    if (!content) return;

    // Parse markdown to structured sections
    const parsedSections = parseMarkdownSections(content);

    // If no sections found, treat as plain text with basic markdown
    if (parsedSections.length === 0) {
      this.addPlainMarkdownContent(content);
      return;
    }

    // Process each section
    parsedSections.forEach((section) => {
      // Skip sections with no content
      if (!section.content?.trim()) return;

      // Add subsection title if it's a nested section (level > 1)
      if (section.level > 1 && section.title) {
        this.addSubsectionTitle(this.processVietnameseText(section.title));
      }

      // Process content
      this.addPlainMarkdownContent(section.content);
    });
  }

  /**
   * Add plain markdown content with basic formatting
   */
  private addPlainMarkdownContent(content: string): void {
    // Convert markdown to plain text with formatting
    const plainText = markdownToPlainText(content);
    const lines = plainText.split("\n").filter((line) => line.trim());

    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...rgb(COLORS.light));
    this.pdf.setFont("helvetica", "normal");

    lines.forEach((line) => {
      const isBullet = line.startsWith("• ");
      const isNumbered = /^\d+\.\s/.test(line);
      const isIndented = isBullet || isNumbered;

      // Process Vietnamese text
      const processedLine = this.processVietnameseText(line);

      const wrapWidth = isIndented ? this.contentWidth - 10 : this.contentWidth;
      const xOffset = isIndented ? this.marginLeft + 5 : this.marginLeft;

      const wrappedLines = this.pdf.splitTextToSize(processedLine, wrapWidth);
      wrappedLines.forEach((wrappedLine: string, index: number) => {
        this.checkPageBreak(6);
        // For continuation lines of bullets, add extra indent
        const lineXOffset = index > 0 && isIndented ? xOffset + 3 : xOffset;
        this.pdf.text(wrappedLine, lineXOffset, this.currentY);
        this.currentY += 5;
      });
    });
  }

  private addNewPage(): void {
    this.pdf.addPage();
    this.pageNumber++;
    this.currentY = this.marginTop;

    // Page background
    this.pdf.setFillColor(...rgb(COLORS.dark));
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, "F");

    // Header line
    if (this.options.includeHeader) {
      this.pdf.setFillColor(...rgb(COLORS.primary));
      this.pdf.rect(0, 0, this.pageWidth, 3, "F");

      this.pdf.setFontSize(8);
      this.pdf.setTextColor(...rgb(COLORS.light));
      this.pdf.setFont("helvetica", "normal");
      this.pdf.text(
        `${this.options.branding?.companyName} - Báo cáo học tập`,
        this.marginLeft,
        12,
      );
      this.pdf.text(
        this.report.studentName || "",
        this.pageWidth - this.marginRight,
        12,
        {
          align: "right",
        },
      );

      this.currentY = 20;
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.marginBottom) {
      this.addNewPage();
    }
  }

  private addFootersToAllPages(): void {
    const totalPages = this.pdf.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);

      // Footer line
      this.pdf.setDrawColor(...rgb(COLORS.primary));
      this.pdf.setLineWidth(0.3);
      this.pdf.line(
        this.marginLeft,
        this.pageHeight - 15,
        this.pageWidth - this.marginRight,
        this.pageHeight - 15,
      );

      // Footer text
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(...rgb(COLORS.light));
      this.pdf.setFont("helvetica", "normal");

      const date = new Date().toLocaleDateString("vi-VN");
      this.pdf.text(
        `© ${new Date().getFullYear()} ${this.options.branding?.companyName}`,
        this.marginLeft,
        this.pageHeight - 10,
      );

      if (this.options.includePageNumbers) {
        this.pdf.text(
          `Trang ${i} / ${totalPages}`,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: "center" },
        );
      }

      this.pdf.text(
        `Tạo ngày: ${date}`,
        this.pageWidth - this.marginRight,
        this.pageHeight - 10,
        { align: "right" },
      );
    }
  }

  private getReportTypeName(type: string): string {
    const names: Record<string, string> = {
      COMPREHENSIVE: "BÁO CÁO TOÀN DIỆN",
      WEEKLY_SUMMARY: "TÓM TẮT TUẦN",
      MONTHLY_SUMMARY: "TÓM TẮT THÁNG",
      SKILL_ASSESSMENT: "ĐÁNH GIÁ KỸ NĂNG",
      GOAL_TRACKING: "THEO DÕI MỤC TIÊU",
    };
    return names[type] || type;
  }

  private getTrendInfo(trend: string): {
    label: string;
    icon: string;
    color: [number, number, number];
    bgColor: [number, number, number];
  } {
    switch (trend) {
      case "improving":
        return {
          label: "Đang tiến bộ",
          icon: "📈",
          color: rgb(COLORS.success),
          bgColor: rgb(COLORS.success),
        };
      case "stable":
        return {
          label: "Ổn định",
          icon: "➡️",
          color: rgb(COLORS.secondary),
          bgColor: rgb(COLORS.secondary),
        };
      case "declining":
        return {
          label: "Cần cải thiện",
          icon: "📉",
          color: rgb(COLORS.danger),
          bgColor: rgb(COLORS.danger),
        };
      default:
        return {
          label: "Chưa xác định",
          icon: "📊",
          color: rgb(COLORS.light),
          bgColor: rgb(COLORS.primary),
        };
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}

/**
 * Generate PDF from a learning report
 */
export async function generateLearningReportPDF(
  report: StudentLearningReportResponse,
  options?: PDFGeneratorOptions,
): Promise<Blob> {
  const generator = new LearningReportPDFGenerator(report, options);
  return generator.generate();
}

/**
 * Download PDF directly - Uses HTML-based rendering for Vietnamese support
 */
export async function downloadLearningReportPDF(
  report: StudentLearningReportResponse,
  options?: PDFGeneratorOptions,
): Promise<void> {
  // Use HTML-based PDF generation for full Vietnamese support
  const { downloadVietnamesePDF } = await import("./HTMLPDFGenerator");

  const filename =
    options?.filename ||
    `bao-cao-hoc-tap-${report.studentName?.replace(/\s+/g, "-") || "student"}-${new Date().toISOString().split("T")[0]}`;

  await downloadVietnamesePDF(report, { 
    filename,
    userAvatar: options?.userAvatar
  });
}

/**
 * Generate PDF from HTML element (for complex layouts)
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string = "learning-report",
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#0f172a",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}

export default LearningReportPDFGenerator;
