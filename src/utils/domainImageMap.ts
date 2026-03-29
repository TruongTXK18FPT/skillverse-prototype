import Technology from "../assets/domain/Technology.png";
import Design from "../assets/domain/Design.png";
import Finance_Marketing from "../assets/domain/Finance_Marketing.png";
import Ky_thuat from "../assets/domain/Ky_thuat.png";
import Healthcare from "../assets/domain/Healthcare.png";
import Education from "../assets/domain/Education.png";
import Logistics from "../assets/domain/Logistics.png";
import Legal_Public_Administration from "../assets/domain/Legal_Public Administration.png";
import Arts_Entertainment from "../assets/domain/Arts&Entertainment.png";
import Service_Hospitality from "../assets/domain/Service_Hospitality.png";
import Community from "../assets/domain/Community.png";
import Nongnghiep from "../assets/domain/Nongnghiep.png";

export const DOMAIN_IMAGES: Record<string, string> = {
	IT: Technology,
	"Information Technology": Technology,
	Technology: Technology,

	DESIGN: Design,
	"Thiết kế": Design,
	"Thiết kế – Sáng tạo – Nội dung": Design,
	Design: Design,

	BUSINESS: Finance_Marketing,
	"Kinh doanh": Finance_Marketing,
	"Kinh doanh – Marketing – Quản trị": Finance_Marketing,
	Business: Finance_Marketing,
	Finance_Marketing: Finance_Marketing,

	ENGINEERING: Ky_thuat,
	"Kỹ thuật": Ky_thuat,
	"Kỹ thuật – Công nghiệp – Sản xuất": Ky_thuat,
	Engineering: Ky_thuat,

	HEALTHCARE: Healthcare,
	"Y tế & Sức khỏe": Healthcare,
	Healthcare: Healthcare,

	EDUCATION: Education,
	"Giáo dục": Education,
	"Education – Đào tạo – EdTech": Education,
	Education: Education,

	LOGISTICS: Logistics,
	"Logistics – Chuỗi cung ứng – Xuất nhập khẩu": Logistics,
	Logistics: Logistics,

	LEGAL: Legal_Public_Administration,
	"Pháp luật": Legal_Public_Administration,
	"Legal & Public Administration": Legal_Public_Administration,
	Legal: Legal_Public_Administration,

	ARTS: Arts_Entertainment,
	"Nghệ thuật": Arts_Entertainment,
	"Arts & Entertainment": Arts_Entertainment,
	Arts: Arts_Entertainment,

	SERVICE: Service_Hospitality,
	"Dịch vụ giải trí": Service_Hospitality,
	Service: Service_Hospitality,
	"Service & Hospitality": Service_Hospitality,

	SOCIALCOMMUNITY: Community,
	"Cộng đồng": Community,
	"Công tác xã hội – Dịch vụ cộng đồng – Tổ chức phi lợi nhuận": Community,
	Community: Community,
	"Social Community": Community,

	ENVIRONMENT: Nongnghiep,
	"Nông nghiệp": Nongnghiep,
	Environment: Nongnghiep,
	"Agriculture&Environment": Nongnghiep,
	"Agriculture – Environment": Nongnghiep,
};

export const getDomainImage = (domain: string): string | undefined => {
	if (!domain) return undefined;
	const lower = domain.toLowerCase();

	// Direct match first
	if (DOMAIN_IMAGES[domain]) return DOMAIN_IMAGES[domain];

	// Try exact key match (case-insensitive)
	const found = Object.entries(DOMAIN_IMAGES).find(
		([key]) => key.toLowerCase() === lower,
	);
	if (found) return found[1];

	// Try partial match
	const partial = Object.entries(DOMAIN_IMAGES).find(
		([key]) =>
			lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower),
	);
	if (partial) return partial[1];

	return undefined;
};
