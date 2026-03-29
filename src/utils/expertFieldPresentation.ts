import { getDomainImage } from './domainImageMap';

export interface ExpertDomainMeta {
  value: string;
  label: string;
  description: string;
  icon: string;
  image?: string;
}

const includesAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword));

export const getExpertDomainMeta = (domain: string): ExpertDomainMeta => {
  const lower = (domain || "").toLowerCase();

  const img = getDomainImage(domain);

  if (includesAny(lower, ["information technology"])) {
    return {
      value: domain,
      label: "Công nghệ thông tin",
      description: domain,
      icon: "💻",
      image: img,
    };
  }

  if (includesAny(lower, ["thiết kế", "sáng tạo", "nội dung", "design"])) {
    return {
      value: domain,
      label: "Thiết kế",
      description: domain,
      icon: "🎨",
      image: img,
    };
  }

  if (includesAny(lower, ["kinh doanh", "marketing", "quản trị", "business"])) {
    return {
      value: domain,
      label: "Kinh doanh",
      description: domain,
      icon: "📈",
      image: img,
    };
  }

  if (
    includesAny(lower, ["kỹ thuật", "công nghiệp", "sản xuất", "engineering"])
  ) {
    return {
      value: domain,
      label: "Kỹ thuật",
      description: domain,
      icon: "⚙️",
      image: img,
    };
  }

  if (includesAny(lower, ["healthcare", "y tế", "sức khỏe"])) {
    return {
      value: domain,
      label: "Y tế & Sức khỏe",
      description: domain,
      icon: "🏥",
      image: img,
    };
  }

  if (includesAny(lower, ["education", "giáo dục", "đào tạo", "edtech"])) {
    return {
      value: domain,
      label: "Giáo dục",
      description: domain,
      icon: "📚",
      image: img,
    };
  }

  if (includesAny(lower, ["logistics"])) {
    return {
      value: domain,
      label: "Logistics",
      description: domain,
      icon: "🚚",
      image: img,
    };
  }

  if (includesAny(lower, ["legal", "pháp luật", "public administration"])) {
    return {
      value: domain,
      label: "Pháp luật",
      description: domain,
      icon: "⚖️",
      image: img,
    };
  }

  if (includesAny(lower, ["arts", "nghệ thuật", "entertainment"])) {
    return {
      value: domain,
      label: "Nghệ thuật",
      description: domain,
      icon: "🎭",
      image: img,
    };
  }

  if (includesAny(lower, ["service", "hospitality", "dịch vụ"])) {
    return { value: domain, label: "Dịch vụ", description: domain, icon: "🤝", image: img };
  }
  if (
    includesAny(lower, [
      "công tác xã hội",
      "dịch vụ cộng đồng",
      "cộng đồng",
      "social",
    ])
  ) {
    return {
      value: domain,
      label: "Cộng đồng",
      description: domain,
      icon: "🌍",
      image: img,
    };
  }

  if (
    includesAny(lower, [
      "agriculture",
      "nông nghiệp",
      "môi trường",
      "environment",
    ])
  ) {
    return {
      value: domain,
      label: "Nông nghiệp & Môi trường",
      description: domain,
      icon: "🌱",
      image: img,
    };
  }

  return { value: domain, label: domain, description: domain, icon: "🧭", image: img };
};

export const getExpertDomainLabel = (domain: string): string =>
  getExpertDomainMeta(domain).label;
