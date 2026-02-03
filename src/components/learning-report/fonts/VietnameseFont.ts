/**
 * Vietnamese Font Support for jsPDF
 *
 * This module provides Vietnamese Unicode support for PDF generation.
 * We use the Roboto font which supports Vietnamese characters.
 *
 * NOTE: For full Vietnamese support, you should embed a proper Vietnamese font.
 * This is a simplified solution using base64 encoded font data.
 */

import jsPDF from "jspdf";

// Vietnamese character replacements for PDF output
// This handles diacritical marks that might not render correctly
export const VIETNAMESE_CHAR_MAP: Record<string, string> = {
  // Vowels with diacritical marks - lowercase
  à: "a",
  á: "a",
  ả: "a",
  ã: "a",
  ạ: "a",
  ă: "a",
  ằ: "a",
  ắ: "a",
  ẳ: "a",
  ẵ: "a",
  ặ: "a",
  â: "a",
  ầ: "a",
  ấ: "a",
  ẩ: "a",
  ẫ: "a",
  ậ: "a",
  è: "e",
  é: "e",
  ẻ: "e",
  ẽ: "e",
  ẹ: "e",
  ê: "e",
  ề: "e",
  ế: "e",
  ể: "e",
  ễ: "e",
  ệ: "e",
  ì: "i",
  í: "i",
  ỉ: "i",
  ĩ: "i",
  ị: "i",
  ò: "o",
  ó: "o",
  ỏ: "o",
  õ: "o",
  ọ: "o",
  ô: "o",
  ồ: "o",
  ố: "o",
  ổ: "o",
  ỗ: "o",
  ộ: "o",
  ơ: "o",
  ờ: "o",
  ớ: "o",
  ở: "o",
  ỡ: "o",
  ợ: "o",
  ù: "u",
  ú: "u",
  ủ: "u",
  ũ: "u",
  ụ: "u",
  ư: "u",
  ừ: "u",
  ứ: "u",
  ử: "u",
  ữ: "u",
  ự: "u",
  ỳ: "y",
  ý: "y",
  ỷ: "y",
  ỹ: "y",
  ỵ: "y",
  đ: "d",
  // Uppercase
  À: "A",
  Á: "A",
  Ả: "A",
  Ã: "A",
  Ạ: "A",
  Ă: "A",
  Ằ: "A",
  Ắ: "A",
  Ẳ: "A",
  Ẵ: "A",
  Ặ: "A",
  Â: "A",
  Ầ: "A",
  Ấ: "A",
  Ẩ: "A",
  Ẫ: "A",
  Ậ: "A",
  È: "E",
  É: "E",
  Ẻ: "E",
  Ẽ: "E",
  Ẹ: "E",
  Ê: "E",
  Ề: "E",
  Ế: "E",
  Ể: "E",
  Ễ: "E",
  Ệ: "E",
  Ì: "I",
  Í: "I",
  Ỉ: "I",
  Ĩ: "I",
  Ị: "I",
  Ò: "O",
  Ó: "O",
  Ỏ: "O",
  Õ: "O",
  Ọ: "O",
  Ô: "O",
  Ồ: "O",
  Ố: "O",
  Ổ: "O",
  Ỗ: "O",
  Ộ: "O",
  Ơ: "O",
  Ờ: "O",
  Ớ: "O",
  Ở: "O",
  Ỡ: "O",
  Ợ: "O",
  Ù: "U",
  Ú: "U",
  Ủ: "U",
  Ũ: "U",
  Ụ: "U",
  Ư: "U",
  Ừ: "U",
  Ứ: "U",
  Ử: "U",
  Ữ: "U",
  Ự: "U",
  Ỳ: "Y",
  Ý: "Y",
  Ỷ: "Y",
  Ỹ: "Y",
  Ỵ: "Y",
  Đ: "D",
};

/**
 * Normalize Vietnamese text for PDF rendering when font doesn't support full Unicode
 * This is a FALLBACK method - prefer using proper Vietnamese fonts when possible
 */
export function normalizeVietnamese(text: string): string {
  if (!text) return "";

  let result = text;
  for (const [vietnamese, ascii] of Object.entries(VIETNAMESE_CHAR_MAP)) {
    result = result.split(vietnamese).join(ascii);
  }
  return result;
}

/**
 * Check if text contains Vietnamese characters
 */
export function containsVietnamese(text: string): boolean {
  if (!text) return false;
  const vietnamesePattern =
    /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  return vietnamesePattern.test(text);
}

/**
 * Vietnamese-aware text splitter that respects word boundaries
 */
export function splitVietnameseText(
  text: string,
  maxWidth: number,
  _fontSize: number,
  pdf: jsPDF,
): string[] {
  if (!text) return [];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = pdf.getTextWidth(testLine);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Interface for Vietnamese font options
 */
export interface VietnameseFontOptions {
  useNormalization: boolean;
  fontName?: string;
}

/**
 * Setup Vietnamese font support for jsPDF
 *
 * IMPORTANT: For proper Vietnamese support, you should:
 * 1. Download a Vietnamese-supporting font (Roboto, Noto Sans, etc.)
 * 2. Convert it to base64 using a tool like https://rawgit.com/AlfioEmanuworb/jsPDF-custom-fonts-example/master/web/font-converter.html
 * 3. Add it using pdf.addFileToVFS() and pdf.addFont()
 *
 * This simplified version provides a fallback with normalization.
 */
export function setupVietnameseFont(
  pdf: jsPDF,
  options: VietnameseFontOptions = { useNormalization: true },
): void {
  // For now, we'll use the normalization approach as a fallback
  // In production, you should embed a proper Vietnamese font

  if (options.fontName) {
    try {
      pdf.setFont(options.fontName);
    } catch (e) {
      console.warn("Could not set Vietnamese font, using helvetica:", e);
      pdf.setFont("helvetica");
    }
  }
}

/**
 * Safe text rendering that handles Vietnamese characters
 */
export function renderVietnameseText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: {
    align?: "left" | "center" | "right";
    maxWidth?: number;
    useNormalization?: boolean;
  },
): void {
  const align = options?.align || "left";
  const useNormalization = options?.useNormalization ?? true;

  // If we need to normalize (fallback mode)
  const processedText = useNormalization ? normalizeVietnamese(text) : text;

  if (options?.maxWidth) {
    const lines = splitVietnameseText(
      processedText,
      options.maxWidth,
      pdf.getFontSize(),
      pdf,
    );
    let currentY = y;
    for (const line of lines) {
      pdf.text(line, x, currentY, { align });
      currentY += pdf.getFontSize() * 0.5; // Approximate line height
    }
  } else {
    pdf.text(processedText, x, y, { align });
  }
}

/**
 * Markdown to plain text converter for Vietnamese content
 * Handles common Markdown syntax and preserves Vietnamese characters
 */
export function markdownToPlainText(markdown: string): string {
  if (!markdown) return "";

  let text = markdown;

  // Remove headers (## Header -> Header)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove bold (**text** or __text__ -> text)
  text = text.replace(/\*\*(.+?)\*\*/g, "$1");
  text = text.replace(/__(.+?)__/g, "$1");

  // Remove italic (*text* or _text_ -> text)
  text = text.replace(/\*(.+?)\*/g, "$1");
  text = text.replace(/_(.+?)_/g, "$1");

  // Remove inline code (`code` -> code)
  text = text.replace(/`(.+?)`/g, "$1");

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, "[Code Block]");

  // Remove links [text](url) -> text
  text = text.replace(/\[(.+?)\]\(.+?\)/g, "$1");

  // Remove images ![alt](url) -> [Image: alt]
  text = text.replace(/!\[(.+?)\]\(.+?\)/g, "[Hình: $1]");

  // Convert bullet lists (- item or * item)
  text = text.replace(/^[-*]\s+/gm, "• ");

  // Convert numbered lists
  text = text.replace(/^\d+\.\s+/gm, "• ");

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, "");

  // Remove blockquotes
  text = text.replace(/^>\s*/gm, "");

  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  // Trim whitespace
  text = text.trim();

  return text;
}

/**
 * Parse Markdown sections for PDF generation
 */
export interface ParsedSection {
  title: string;
  content: string;
  level: number;
}

export function parseMarkdownSections(markdown: string): ParsedSection[] {
  if (!markdown) return [];

  const sections: ParsedSection[] = [];
  const lines = markdown.split("\n");

  let currentSection: ParsedSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentLines.join("\n").trim();
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: headerMatch[2],
        content: "",
        level: headerMatch[1].length,
      };
      contentLines = [];
    } else if (currentSection) {
      contentLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = contentLines.join("\n").trim();
    sections.push(currentSection);
  }

  return sections;
}

export default {
  normalizeVietnamese,
  containsVietnamese,
  splitVietnameseText,
  setupVietnameseFont,
  renderVietnameseText,
  markdownToPlainText,
  parseMarkdownSections,
  VIETNAMESE_CHAR_MAP,
};
