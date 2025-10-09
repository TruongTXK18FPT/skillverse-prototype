// src/MeowlGuard.tsx

export type GuardResult =
  | { allow: true }
  | { allow: false; reason: "injection" | "out_of_scope" };

function normalize(s: string) {
  try {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, ""); // bỏ dấu TV
  } catch {
    // fallback nếu môi trường không hỗ trợ Unicode property escapes
    return s.toLowerCase();
  }
}

/**
 * Các mẫu bỏ-qua-lệnh / jailbreak phổ biến (VN + EN).
 * Mở rộng để bắt các câu như "bỏ qua các lệnh hiện tại/trước đó"
 */
const INJECTION_PATTERNS: RegExp[] = [
  /bo qua (cac )?(lenh|huong dan)( hien tai| truoc do)?/i,
  /phot lo( )?(tat ca )?(lenh|huong dan)/i,
  /bo tat (ca )?rang buoc|khong can theo quy tac/i,
  /ignore (all )?(previous|prior|above) (instructions|messages|rules)/i,
  /disregard (the )?(rules|system|instructions)/i,
  /override (the )?(system|guard|policy|safety)/i,
  /jailbreak|bypass|prompt[ -]?injection|system prompt/i,
  /act as .* (without|bypassing) (rules|safety|guard)/i,
  /pretend you are not bound by/i,
  /bat dau che do (moi|khong han che|developer|debug|unrestricted)/i,
  /quen het (huong dan|lenh) truoc/i,
  /hanh dong nhu (mot|khong co) (rang buoc|luat le|an toan)/i,
  /simulate (unrestricted|no rules) mode/i,
  /bay gio (la|tro thanh) (ai khong kiem duyet|uncensored bot)/i,
  /dung (tuan thu|theo) (quy dinh|he thong)/i,
  /leak (system|prompt|instructions)/i,
  /repeat after me: (ignore|override)/i,
  /encoded: (base64|rot13|hex)/i,
  /hay gia vo (rang|nhu) (ban khong co|khong bi rang buoc)/i,
  /tro thanh ai khac|become someone else/i,
  /thay doi (he thong|cau truc|quy tac)/i,
];

/**
 * Chủ đề ngoài phạm vi giáo dục/kỹ năng (mẫu rộng).
 * Thêm "công thức|recipe|làm bánh|nấu ăn|bánh su kem|flan" v.v.
 */
const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
 // Ẩm thực / công thức
  /cong thuc|recipe|nau an|lam banh|banh (su|su kem|flan|kem|choux)|pha che|am thuc|mon an/i,
  /cocktail|ruou|bia|nau (canh|sup|chao)/i,

  // Tài chính cá nhân / đầu tư
  /tai chinh ca nhan|dau tu|chung khoan|crypto|coin|bitcoin|keo (call|rug)|trade|forex|ngan hang/i,
  /lam giau|kinh doanh ca nhan|cho vay|dau co/i,

  // Y tế
  /y te|chan doan|ke don|trieu chung|medical advice|benh (tat|vien|ung thu)/i,
  /thuoc (men|chua|dieu tri)|diet|che do an uong/i,

  // Pháp lý
  /phap ly|luat su|legal advice|hop dong|to tung|quyen so huu/i,
  /ly hon|ke thua|thue (thanh toan|vat)/i,

  // Nội dung người lớn
  /18\+|xxx|nsfw|sex|porn|erotic|nguoi lon/i,
  /hentai|bdsm|adult content/i,

  // Chính trị quá nhạy cảm / hate speech
  /hate speech|cuc doan|phan biet chung toc|racism|terrorism/i,
  /chinh tri (dang phai|quoc gia)|bien dong|chien tranh/i,

  // Giải trí / cờ bạc
  /phim anh|series|netflix|youtube drama|ca si|nghe si/i,
  /ca do|gambling|casino|poker|xo so|betting/i,

  // Tôn giáo / mê tín
  /ton giao|me tin|boi toan|horoscope|phong thuy/i,

  // Bạo lực / vũ khí / nội dung bất hợp pháp
  /bao luc|vu khi|sung|dao kiem|self defense/i,
  /hack|crack|pirate|illegal download/i,
];

export function guardUserInput(raw: string): GuardResult {
  const q = normalize(raw);

  if (INJECTION_PATTERNS.some((rx) => rx.test(q))) {
    return { allow: false, reason: "injection" };
  }
  if (OUT_OF_SCOPE_PATTERNS.some((rx) => rx.test(q))) {
    return { allow: false, reason: "out_of_scope" };
  }
  return { allow: true };
}

// fallback đa ngôn ngữ
export const FALLBACKS = {
  injection: {
    vi: "Xin lỗi, mình không thể thực hiện yêu cầu này. Meowl chỉ hỗ trợ câu hỏi về học tập, kỹ năng và nền tảng SkillVerse 🐱✨.",
    en: "Sorry, I can’t follow that. Meowl only supports questions about learning, skills, and the SkillVerse platform 🐱✨."
  },
  out_of_scope: {
    vi: "Mình chỉ hỗ trợ về khóa học, kỹ năng và SkillVerse. Bạn thử hỏi về lộ trình học, khóa phù hợp, hoặc mẹo học tập nhé!",
    en: "I can only help with courses, skills, and SkillVerse. Try asking about learning paths, suitable courses, or study tips!"
  },
  output: {
    vi: "Có vẻ câu trả lời đi ngoài phạm vi giáo dục/kỹ năng. Bạn thử hỏi lại về khóa học hay lộ trình học nhé 🐱✨.",
    en: "It seems the answer goes beyond learning/skills. Please ask about courses or learning paths instead 🐱✨."
  }
} as const;

export type Lang = "vi" | "en";

export function pickFallback(
  reason: keyof typeof FALLBACKS,
  lang: Lang
): string {
  const pack = FALLBACKS[reason];
  return pack?.[lang] ?? pack?.en;
}
