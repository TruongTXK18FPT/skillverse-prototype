import React, { useState } from "react";
import {
  Shield,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Banknote,
  FileText,
  Zap,
  Users,
  Scale,
  ScrollText,
} from "lucide-react";
import "./job-hub.css";

/* ======================================================================
   REGULATIONS TAB
   Prefix: reg-
   Tone: formal business/legal — no code references
   ====================================================================== */

type RegulationSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  colorRgb: string;
  articles: RegulationArticle[];
};

type RegulationArticle = {
  number: string;
  title: string;
  type: "warning" | "info" | "danger" | "success";
  paragraphs: string[];
};

const regulationSections: RegulationSection[] = [
  {
    id: "fees",
    title: "I. Phí Đăng Tin và Ưu Đãi",
    subtitle: "Các loại phí liên quan đến đăng tin, mở lại tin và quyền lợi ưu đãi dành cho Nhà tuyển dụng",
    icon: <Banknote size={18} />,
    color: "#f59e0b",
    colorRgb: "245, 158, 11",
    articles: [
      {
        number: "Điều 1",
        title: "Phí đăng tin tuyển dụng dài hạn",
        type: "warning",
        paragraphs: [
          "Mỗi lần đăng tin tuyển dụng dài hạn, Nhà tuyển dụng phải thanh toán phí đăng tin là 50.000 VND (năm mươi nghìn đồng).",
          "Phí được khấu trừ từ tài khoản ví tại thời điểm xác nhận nộp tin lên hệ thống. Việc tạo bản nháp không phát sinh phí.",
          "Nhà tuyển dụng sở hữu gói Premium còn hiệu lực được miễn phí đăng tin theo số lượng quota được cấp phát hàng tháng.",
        ],
      },
      {
        number: "Điều 2",
        title: "Phí đăng tin việc ngắn hạn / gig",
        type: "warning",
        paragraphs: [
          "Mỗi lần đăng tin việc ngắn hạn hoặc gig, Nhà tuyển dụng phải thanh toán phí đăng tin là 30.000 VND (ba mươi nghìn đồng).",
          "Cơ chế thanh toán: ưu tiên trừ quota Premium nếu còn; nếu không có quota, phí sẽ được khấu trừ trực tiếp từ ví tại thời điểm nộp duyệt.",
          "Hệ thống yêu cầu số dư khả dụng trong ví tối thiểu bằng mức phí quy định. Nếu số dư không đủ, tin đăng sẽ không được chấp nhận.",
        ],
      },
      {
        number: "Điều 3",
        title: "Phí mở lại tin tuyển dụng dài hạn",
        type: "warning",
        paragraphs: [
          "Khi mở lại tin đã đóng, Nhà tuyển dụng phải thanh toán phí mở lại là 20.000 VND (hai mươi nghìn đồng).",
          "Miễn phí mở lại trong trường hợp tin được đóng lại trong vòng 5 phút kể từ thời điểm đóng (cơ chế grace period).",
          "Hạn nộp (deadline) của tin sẽ được tự động gia hạn thêm 30 ngày nếu deadline cũ đã hết hạn tại thời điểm mở lại.",
        ],
      },
      {
        number: "Điều 4",
        title: "Phí dịch vụ nền tảng đối với việc ngắn hạn",
        type: "danger",
        paragraphs: [
          "Khi việc ngắn hạn hoàn tất và số tiền ký quỹ được giải phóng, nền tảng thu phí dịch vụ bằng 10% tổng giá trị công việc.",
          "Công thức phân chia: Nền tảng nhận = Giá trị công việc nhân 10%. Người thực hiện nhận = Giá trị công việc nhân 90%.",
          "Phí dịch vụ được khấu trừ tự động tại thời điểm giải phóng ký quỹ — không yêu cầu thao tác bổ sung từ Nhà tuyển dụng.",
        ],
      },
      {
        number: "Điều 5",
        title: "Quyền lợi qua gói Premium",
        type: "info",
        paragraphs: [
          "Hệ thống không triển khai chương trình coupon, voucher hay khuyến mãi giảm phí riêng biệt. Toàn bộ quyền lợi ưu đãi được tích hợp trong các gói Premium.",
          "Các quyền lợi Premium liên quan đến tuyển dụng bao gồm: quota đăng tin miễn phí hàng tháng, đánh dấu tin nổi bật, AI gợi ý ứng viên phù hợp, và đẩy tin lên vị trí ưu tiên.",
          "Quota Premium được làm mới theo chu kỳ hàng tháng. Nhà tuyển dụng theo dõi quota còn lại tại mục Quản lý gói dịch vụ.",
        ],
      },
    ],
  },

  {
    id: "fulltime",
    title: "II. Tuyển Dụng Dài Hạn",
    subtitle: "Quy định toàn diện về đăng tin, quy trình phê duyệt, ứng tuyển và gửi lời mời làm việc",
    icon: <FileText size={18} />,
    color: "#3b82f6",
    colorRgb: "59, 130, 246",
    articles: [
      {
        number: "Điều 6",
        title: "Quy tắc tạo và chỉnh sửa tin tuyển dụng",
        type: "info",
        paragraphs: [
          "Thời hạn đăng tin (deadline) tối đa là 90 ngày kể từ ngày tạo. Không cho phép thiết lập deadline vượt quá giới hạn này.",
          "Mức ngân sách tối đa phải lớn hơn hoặc bằng mức ngân sách tối thiểu. Hệ thống từ chối tin không đáp ứng yêu cầu này.",
          "Trường địa điểm là bắt buộc đối với việc không phải làm việc từ xa. Tin làm việc từ xa không yêu cầu nhập địa điểm.",
          "Danh sách kỹ năng yêu cầu được chuẩn hóa tự động: chuyển chữ thường, loại bỏ khoảng trắng thừa và loại bỏ trùng lặp.",
          "Tin chỉ được phép chỉnh sửa khi đang ở trạng thái bản nháp hoặc đã đóng. Không thể sửa khi tin đang trong quá trình tuyển dụng.",
        ],
      },
      {
        number: "Điều 7",
        title: "Quy trình phê duyệt tin tuyển dụng",
        type: "info",
        paragraphs: [
          "Giai đoạn 1 — Nhà tuyển dụng tạo bản nháp: tin ở trạng thái chờ xử lý, chưa phát sinh phí, chưa hiển thị trên thị trường.",
          "Giai đoạn 2 — Nhà tuyển dụng nộp duyệt: hệ thống kiểm tra quota Premium; nếu có quota thì sử dụng quota, nếu không thì khấu trừ phí từ ví. Trạng thái tin chuyển sang chờ phê duyệt.",
          "Giai đoạn 3 — Phê duyệt: bộ phận quản trị xem xét và duyệt tin (chuyển sang trạng thái đang tuyển) hoặc từ chối (trả về trạng thái bị từ chối).",
          "Tin Premium chờ duyệt quá 7 ngày sẽ được hệ thống tự động duyệt. Tin thường chờ duyệt quá 30 ngày sẽ bị từ chối tự động kèm thông báo cho Nhà tuyển dụng.",
        ],
      },
      {
        number: "Điều 8",
        title: "Quy trình mở lại tin đã đóng",
        type: "warning",
        paragraphs: [
          "Chỉ tin ở trạng thái đã đóng mới được phép mở lại. Tin đang trong quá trình tuyển dụng hoặc đang xử lý không thể mở lại.",
          "Nhà tuyển dụng được lựa chọn giữa hai phương án: (a) giữ lại toàn bộ đơn ứng tuyển hiện có, hoặc (b) xóa toàn bộ đơn ứng tuyển trước khi mở lại.",
          "Hạn nộp mới được xử lý như sau: nếu hạn cũ đã hết, hệ thống tự động gia hạn thêm 30 ngày; nếu hạn cũ còn hiệu lực, hạn được giữ nguyên trừ khi Nhà tuyển dụng chỉ định hạn mới.",
        ],
      },
      {
        number: "Điều 9",
        title: "Quy tắc gửi lời mời làm việc và giới hạn vòng lời mời",
        type: "warning",
        paragraphs: [
          "Sau khi ứng viên xác nhận chấp nhận tiến vào quy trình, Nhà tuyển dụng gửi lời mời làm việc chính thức kèm chi tiết hợp đồng lao động.",
          "Mỗi ứng viên chỉ được nhận tối đa 2 vòng lời mời. Vòng đầu bị từ chối, Nhà tuyển dụng có quyền gửi lại vòng thứ hai với điều chỉnh nếu cần.",
          "Khi ứng viên từ chối vòng lời mời thứ hai, hồ sơ ứng tuyển chuyển sang trạng thái kết thúc vĩnh viễn — không còn cơ hội nhận thêm lời mời nào cho vị trí này.",
          "Mỗi vòng lời mời được ghi nhận rõ ràng trong hồ sơ ứng tuyển để đảm bảo tính minh bạch cho cả hai bên.",
        ],
      },
      {
        number: "Điều 10",
        title: "Vòng đời trạng thái tin tuyển dụng dài hạn",
        type: "info",
        paragraphs: [
          "Trạng thái tin tuyển dụng dài hạn tuân theo chu trình: Bản nháp → Chờ phê duyệt → Đang tuyển → Đã đóng.",
          "Tin tự động chuyển sang trạng thái đã đóng khi: đạt đủ số lượng tuyển theo yêu cầu, hết hạn đăng tin, hoặc Nhà tuyển dụng chủ động đóng tin.",
          "Sau khi đóng, tin có thể được mở lại theo quy định tại Điều 8 để tiếp tục tuyển dụng.",
        ],
      },
    ],
  },

  {
    id: "shortterm",
    title: "III. Việc Ngắn Hạn / Gig",
    subtitle: "Quy định chặt chẽ về đăng tin, thực hiện công việc, sửa đổi, hủy và hoàn tất",
    icon: <Zap size={18} />,
    color: "#f59e0b",
    colorRgb: "245, 158, 11",
    articles: [
      {
        number: "Điều 11",
        title: "Quy tắc bắt buộc khi đăng tin ngắn hạn",
        type: "danger",
        paragraphs: [
          "Hình thức thanh toán: chỉ chấp nhận thanh toán cố định một lần (FIXED) khi hoàn tất công việc. Không hỗ trợ thanh toán theo giờ, theo mốc hay theo thương lượng.",
          "Tính năng thương lượng giá bị khóa bắt buộc ở trạng thái không cho phép — không chấp nhận đề xuất giá khác với giá trị đã công bố.",
          "Hình thức làm việc: chỉ cho phép làm việc từ xa. Không cho phép đăng tin ngắn hạn với hình thức onsite hay hybrid.",
          "Ứng viên bắt buộc phải hoàn thiện hồ sơ năng lực (Portfolio) trước khi được phép nộp đơn ứng tuyển. Hệ thống tự động từ chối đơn từ ứng viên chưa có Portfolio.",
        ],
      },
      {
        number: "Điều 12",
        title: "Quy tắc tuyển chọn ứng viên",
        type: "warning",
        paragraphs: [
          "Mỗi công việc ngắn hạn chỉ được tuyển tối đa một (01) ứng viên duy nhất. Không cho phép tuyển nhiều người cho cùng một công việc.",
          "Khi tuyển chọn một ứng viên, toàn bộ đơn ứng tuyển đang ở trạng thái chờ xử lý sẽ tự động chuyển sang trạng thái bị từ chối kèm thông báo qua email cho từng ứng viên.",
          "Việc tuyển chọn ứng viên chỉ được thực hiện sau khi Nhà tuyển dụng đã hoàn tất ký quỹ. Nếu chưa ký quỹ, hệ thống sẽ từ chối thao tác tuyển chọn.",
          "Ngay sau khi tuyển chọn thành công, công việc chuyển sang trạng thái đang thực hiện.",
        ],
      },
      {
        number: "Điều 13",
        title: "Quy tắc yêu cầu sửa đổi sản phẩm",
        type: "danger",
        paragraphs: [
          "Nhà tuyển dụng được quyền yêu cầu sửa đổi tối đa 5 lần cho mỗi đơn ứng tuyển. Mỗi lần yêu cầu sửa đổi phải kèm ghi chú chi tiết mô tả rõ vấn đề cần khắc phục.",
          "Người thực hiện có thời hạn 72 giờ để phản hồi yêu cầu sửa đổi bằng cách nộp lại sản phẩm. Quá thời hạn này, trạng thái sẽ tự động chuyển sang quá hạn phản hồi.",
          "Sau lần yêu cầu sửa đổi thứ 5: (a) người thực hiện được mở quyền khiếu nại tranh chấp, (b) Nhà tuyển dụng không còn quyền tự ý hủy công việc — phải gửi yêu cầu xem xét từ ban quản trị.",
          "Mỗi lần yêu cầu sửa đổi đều được ghi nhận kèm ghi chú để phục vụ quá trình xem xét nếu có tranh chấp sau này.",
        ],
      },
      {
        number: "Điều 14",
        title: "Quy tắc hủy công việc",
        type: "danger",
        paragraphs: [
          "Tổng số lần yêu cầu hủy cho một công việc tối đa là 3 lần, được tính trên từng đơn ứng tuyển cụ thể.",
          "Sau lần yêu cầu hủy thứ 3, công việc tự động chuyển sang trạng thái tranh chấp để ban quản trị xem xét và quyết định.",
          "Nếu hủy trước khi số tiền ký quỹ được giải phóng, hệ thống tự động hoàn toàn bộ số tiền ký quỹ vào tài khoản ví của Nhà tuyển dụng.",
          "Việc hủy sau khi số tiền ký quỹ đã được giải phóng không được hoàn tiền.",
        ],
      },
      {
        number: "Điều 15",
        title: "Thời hạn nghiệm thu sản phẩm và SLA xử lý",
        type: "info",
        paragraphs: [
          "Khi người thực hiện nộp sản phẩm, hệ thống tạo cửa sổ nghiệm thu với thời hạn 72 giờ. Trong khoảng thời gian này, Nhà tuyển dụng phải duyệt sản phẩm hoặc gửi yêu cầu sửa đổi.",
          "Quá 72 giờ mà Nhà tuyển dụng không thao tác, hệ thống tự động duyệt sản phẩm và tiến hành giải phóng ký quỹ cho người thực hiện.",
          "SLA xử lý đơn ứng tuyển: Nhà tuyển dụng có 48 giờ để xem xét đơn ứng tuyển mới. Quá thời hạn này, hệ thống tự động duyệt đơn.",
          "Khi sản phẩm được duyệt, người thực hiện được quyền mở khiếu nại tranh chấp nếu phát sinh bất đồng sau đó.",
        ],
      },
      {
        number: "Điều 16",
        title: "Hoàn tất công việc và thanh toán",
        type: "info",
        paragraphs: [
          "Công việc chỉ được chuyển sang trạng thái hoàn tất khi sản phẩm đã được duyệt nghiệm thu.",
          "Khi hoàn tất, hệ thống tự động thực hiện giải phóng ký quỹ: khấu trừ toàn bộ từ ví Nhà tuyển dụng, chuyển 90% vào ví người thực hiện, giữ lại 10% cho nền tảng.",
          "Sau khi hoàn tất, Nhà tuyển dụng xác nhận đã thanh toán để đóng hồ sơ. Điểm tin cậy (Trust Score) của cả hai bên được cập nhật lại dựa trên kết quả công việc.",
        ],
      },
    ],
  },

  {
    id: "escrow",
    title: "IV. Ký Quỹ (Escrow)",
    subtitle: "Cơ chế bảo vệ tài chính cho cả Nhà tuyển dụng và người thực hiện trong công việc ngắn hạn",
    icon: <Shield size={18} />,
    color: "#06b6d4",
    colorRgb: "6, 182, 212",
    articles: [
      {
        number: "Điều 17",
        title: "Nguyên tắc ký quỹ bắt buộc",
        type: "danger",
        paragraphs: [
          "Nhà tuyển dụng bắt buộc phải hoàn tất ký quỹ trước khi tuyển chọn người thực hiện cho công việc ngắn hạn. Nếu chưa ký quỹ, hệ thống từ chối thao tác tuyển chọn.",
          "Số tiền ký quỹ bằng đúng giá trị công việc đã công bố. Không được ký quỹ ít hơn hoặc nhiều hơn giá trị công việc.",
          "Tại thời điểm ký quỹ, số tiền được phong tỏa từ ví của Nhà tuyển dụng. Số dư khả dụng phải lớn hơn hoặc bằng giá trị ký quỹ; nếu không đủ, ký quỹ thất bại.",
          "Tiền được phong tỏa nhưng chưa bị trừ thật sự khỏi tài khoản. Việc trừ thật chỉ xảy ra khi số tiền được giải phóng.",
        ],
      },
      {
        number: "Điều 18",
        title: "Giải phóng ký quỹ",
        type: "warning",
        paragraphs: [
          "Khi công việc hoàn tất, Nhà tuyển dụng chủ động giải phóng ký quỹ. Quy trình diễn ra như sau:",
          "Bước 1 — Hệ thống trừ thật toàn bộ giá trị ký quỹ từ ví Nhà tuyển dụng.",
          "Bước 2 — Tính phí dịch vụ nền tảng: giá trị công việc nhân 10%.",
          "Bước 3 — Chuyển phần còn lại (giá trị trừ phí) vào ví người thực hiện ngay lập tức.",
          "Bước 4 — Ghi nhận ba bản ghi giao dịch: ghi có cho người thực hiện, ghi nợ phí dịch vụ cho nền tảng, và xác nhận giải ngân.",
          "Sau khi giải phóng, trạng thái ký quỹ chuyển sang hoàn tất. Không thể hoàn tiền sau bước này.",
        ],
      },
      {
        number: "Điều 19",
        title: "Hoàn tiền ký quỹ",
        type: "info",
        paragraphs: [
          "Khi công việc bị hủy trước khi ký quỹ được giải phóng, Nhà tuyển dụng gửi yêu cầu hoàn tiền để nhận lại toàn bộ số tiền đã ký quỹ.",
          "Hệ thống giải phóng phong tỏa số tiền trong ví của Nhà tuyển dụng. Không có khoản khấu trừ nào trong trường hợp này.",
          "Việc hoàn tiền chỉ áp dụng khi ký quỹ chưa từng được giải phóng. Trường hợp ký quỹ đang ở trạng thái tranh chấp, ban quản trị có quyền quyết định hoàn toàn hoặc chia phần tùy tình huống.",
          "Khi hủy công việc có người thực hiện đã được tuyển, hệ thống tự động kiểm tra và hoàn tiền ký quỹ nếu chưa giải phóng.",
        ],
      },
      {
        number: "Điều 20",
        title: "Các trạng thái ký quỹ và phạm vi xử lý",
        type: "info",
        paragraphs: [
          "Đã ký quỹ (FUNDED): tiền đã phong tỏa, chưa giải phóng — có thể hoàn tiền hoặc giải phóng tùy diễn biến công việc.",
          "Giải phóng một phần (PARTIALLY_RELEASED): áp dụng cho thanh toán theo mốc — phần còn lại tiếp tục xử lý.",
          "Đã giải phóng hoàn toàn (FULLY_RELEASED): toàn bộ đã chuyển cho người thực hiện — đóng, không thể thay đổi.",
          "Đã hoàn tiền (REFUNDED): toàn bộ đã hoàn cho Nhà tuyển dụng — đóng, không thể thay đổi.",
          "Đang tranh chấp (DISPUTED): có khiếu nại chưa được giải quyết — ban quản trị có quyền xử lý bất kể trạng thái nào.",
        ],
      },
    ],
  },

  {
    id: "interview",
    title: "V. Quy Tắc Phỏng Vấn",
    subtitle: "Quy trình, nền tảng họp và các quy tắc liên quan đến phỏng vấn trong tuyển dụng dài hạn",
    icon: <Users size={18} />,
    color: "#a78bfa",
    colorRgb: "167, 139, 250",
    articles: [
      {
        number: "Điều 21",
        title: "Quy trình phỏng vấn đối với việc làm từ xa",
        type: "info",
        paragraphs: [
          "Bước 1 — Ứng viên xác nhận chấp nhận tiến vào quy trình tuyển dụng.",
          "Bước 2 — Nhà tuyển dụng tạo lịch phỏng vấn: hệ thống tạo bản ghi lịch phỏng vấn ở trạng thái chờ xác nhận.",
          "Bước 3 — Ứng viên xác nhận tham gia: lịch phỏng vấn được xác nhận, thông tin chi tiết được gửi đến hai bên.",
          "Bước 4 — Phỏng vấn hoàn tất: Nhà tuyển dụng đánh giá kết quả và quyết định tiếp theo.",
          "Bước 5 — Nhà tuyển dụng gửi lời mời làm việc cho ứng viên.",
        ],
      },
      {
        number: "Điều 22",
        title: "Quy trình tuyển dụng đối với việc làm tại chỗ (Onsite)",
        type: "info",
        paragraphs: [
          "Việc tuyển dụng onsite bỏ qua hoàn toàn bước phỏng vấn trên nền tảng.",
          "Sau khi ứng viên xác nhận chấp nhận, trạng thái chuyển tiếp trực tiếp sang gửi lời mời làm việc.",
          "Quy định này phản ánh thực tế tuyển dụng onsite: nhà tuyển dụng thường đã đánh giá ứng viên qua các kênh riêng (điện thoại, email, hồ sơ) trước khi mời ứng viên đến làm việc trực tiếp.",
        ],
      },
      {
        number: "Điều 23",
        title: "Nền tảng và hình thức tổ chức phỏng vấn",
        type: "warning",
        paragraphs: [
          "Nền tảng hỗ trợ 4 hình thức phỏng vấn từ xa: Google Meet, Zoom, SkillVerse Room và Jitsi.",
          "Đối với việc làm từ xa: khi Nhà tuyển dụng tạo lịch phỏng vấn, hệ thống tự động tạo liên kết họp (Google Meet) và gửi đến ứng viên qua email và thông báo trên nền tảng.",
          "Trạng thái lịch phỏng vấn gồm: Chờ xác nhận → Đã xác nhận → Hoàn tất. Trường hợp đặc biệt: Hủy hoặc Không đến.",
          "Cả Nhà tuyển dụng và ứng viên đều có quyền hủy lịch phỏng vấn với lý do chính đáng và thông báo trước cho bên còn lại.",
        ],
      },
    ],
  },

  {
    id: "contract",
    title: "VI. Quy Tắc Hợp Đồng Lao Động",
    subtitle: "Quy trình ký, thời hạn, từ chối ký và ghi nhận thông tin hợp đồng",
    icon: <Scale size={18} />,
    color: "#22c55e",
    colorRgb: "34, 197, 94",
    articles: [
      {
        number: "Điều 24",
        title: "Điều kiện tiên quyết để tạo hợp đồng",
        type: "info",
        paragraphs: [
          "Hợp đồng lao động chỉ được tạo khi ứng viên đã xác nhận chấp nhận lời mời làm việc. Đây là điều kiện tiên quyết duy nhất và bắt buộc.",
          "Hợp đồng ghi nhận các nội dung: loại hợp đồng, số ngày thử việc, mức lương, phụ cấp, giờ làm việc, ngày nghỉ phép, quyền lợi bổ sung và các điều khoản đặc biệt.",
          "Mỗi hồ sơ ứng tuyển chỉ được tạo một hợp đồng. Không cho phép tạo hợp đồng mới khi đã có hợp đồng đang trong quá trình ký.",
        ],
      },
      {
        number: "Điều 25",
        title: "Quy trình ký hợp đồng lao động",
        type: "info",
        paragraphs: [
          "Giai đoạn 1 — Nhà tuyển dụng tạo và gửi hợp đồng: trạng thái Chờ bên ký, ứng viên cần ký trước.",
          "Giai đoạn 2 — Ứng viên ký: hệ thống ghi nhận thời điểm ký, địa chỉ IP và thông tin thiết bị của ứng viên. Trạng thái chuyển sang Chờ nhà tuyển dụng ký.",
          "Giai đoạn 3 — Nhà tuyển dụng ký: hệ thống ghi nhận thời điểm ký, địa chỉ IP và thông tin thiết bị của nhà tuyển dụng. Trạng thái chuyển sang Đã ký. Hồ sơ ứng tuyển được cập nhật hợp đồng đã ký.",
          "Bất kỳ bên nào từ chối ký: trạng thái chuyển sang Bị từ chối, hồ sơ ứng tuyển quay lại trạng thái trước khi gửi hợp đồng.",
        ],
      },
      {
        number: "Điều 26",
        title: "Thời hạn ký hợp đồng",
        type: "danger",
        paragraphs: [
          "Thời hạn ký hợp đồng là 72 giờ kể từ thời điểm hợp đồng được tạo và gửi đến các bên.",
          "Hệ thống tự động kiểm tra hợp đồng quá hạn mỗi 5 phút. Hợp đồng quá 72 giờ không được ký sẽ tự động bị hủy.",
          "Khi hợp đồng bị hủy tự động, hồ sơ ứng tuyển của ứng viên vẫn giữ nguyên trạng thái chấp nhận lời mời — cả hai bên có thể tạo hợp đồng mới để tiếp tục.",
        ],
      },
      {
        number: "Điều 27",
        title: "Ghi nhận thông tin ký hợp đồng",
        type: "warning",
        paragraphs: [
          "Hệ thống ghi nhận địa chỉ IP của từng lần ký từ cả ứng viên và Nhà tuyển dụng vào hồ sơ hợp đồng.",
          "Thông tin thiết bị (User-Agent) ghi nhận trình duyệt và hệ điều hành của người ký tại thời điểm ký.",
          "Dấu thời gian của từng lần ký được ghi nhận rõ ràng cho cả hai bên.",
          "Toàn bộ thông tin này phục vụ mục đích kiểm toán và pháp lý khi cần xác minh ai đã ký và thời điểm ký.",
        ],
      },
    ],
  },

  {
    id: "dispute",
    title: "VII. Tranh Chấp và Xử Lý từ Ban Quản Trị",
    subtitle: "Điều kiện mở tranh chấp, SLA xử lý và các phương án giải quyết",
    icon: <AlertTriangle size={18} />,
    color: "#ef4444",
    colorRgb: "239, 68, 68",
    articles: [
      {
        number: "Điều 28",
        title: "Điều kiện mở tranh chấp",
        type: "danger",
        paragraphs: [
          "Người thực hiện chỉ được quyền mở tranh chấp khi đã đáp ứng điều kiện mở tranh chấp trên đơn ứng tuyển.",
          "Điều kiện mở tranh chấp được tự động bật khi Nhà tuyển dụng yêu cầu sửa đổi lần thứ 5 đối với sản phẩm của người thực hiện.",
          "Trước lần sửa đổi thứ 5, người thực hiện không có quyền mở tranh chấp — chỉ có thể phản hồi yêu cầu sửa đổi hoặc bỏ qua.",
          "Mỗi tranh chấp được tạo gắn với một công việc và đơn ứng tuyển cụ thể.",
        ],
      },
      {
        number: "Điều 29",
        title: "Thời hạn xử lý tranh chấp từ ban quản trị",
        type: "warning",
        paragraphs: [
          "Ban quản trị có thời hạn 5 ngày kể từ khi tranh chấp được mở để xem xét và đưa ra phương án giải quyết.",
          "Tranh chấp không được xử lý trong 5 ngày sẽ tự động được chuyển sang trạng thái ưu tiên cao (Escalated) để đẩy nhanh quá trình xử lý.",
          "Mọi thay đổi trạng thái tranh chấp đều được ghi nhận trong hệ thống để phục vụ kiểm toán.",
        ],
      },
      {
        number: "Điều 30",
        title: "Các phương án giải quyết tranh chấp",
        type: "info",
        paragraphs: [
          "Hoàn tiền toàn phần: hoàn 100% số tiền ký quỹ cho Nhà tuyển dụng. Áp dụng khi người thực hiện không hoàn thành hoặc vi phạm nghiêm trọng thỏa thuận.",
          "Giải phóng toàn phần: trả 100% số tiền cho người thực hiện. Áp dụng khi công việc hoàn thành đúng yêu cầu nhưng Nhà tuyển dụng cố tình không thanh toán.",
          "Hoàn tiền một phần: chia một phần hoàn cho Nhà tuyển dụng, phần còn lại trả cho người thực hiện. Ban quản trị đặt tỷ lệ tùy tình huống cụ thể.",
          "Giải phóng một phần: chia một phần cho người thực hiện, phần còn lại hoàn cho Nhà tuyển dụng. Áp dụng khi có tranh chấp về chất lượng nhưng công việc đã hoàn thành phần lớn.",
          "Yêu cầu nộp lại: yêu cầu người thực hiện nộp lại sản phẩm trong thời hạn mới. Không thay đổi về tài chính.",
          "Không hành động: đóng tranh chấp mà không thay đổi gì. Áp dụng khi tranh chấp không có cơ sở hợp lý.",
          "Hủy công việc: hủy toàn bộ công việc và hoàn tiền đầy đủ cho Nhà tuyển dụng.",
          "Cảnh cáo Nhà tuyển dụng: cảnh cáo bằng văn bản, người thực hiện nhận đủ 100% tiền. Áp dụng khi Nhà tuyển dụng có hành vi vi phạm nhưng chưa đến mức nghiêm trọng.",
        ],
      },
      {
        number: "Điều 31",
        title: "Bằng chứng tranh chấp",
        type: "info",
        paragraphs: [
          "Khi mở tranh chấp, cả người thực hiện và Nhà tuyển dụng đều có quyền nộp bằng chứng hỗ trợ cho lập trường của mình thông qua hệ thống.",
          "Các loại bằng chứng được chấp nhận gồm: văn bản, file đính kèm, đường dẫn tham chiếu, ảnh chụp màn hình, bản ghi cuộc trò chuyện, và bản chụp sản phẩm đã nộp.",
          "Ban quản trị xem xét toàn bộ bằng chứng từ cả hai bên trước khi ra quyết định.",
          "Quyết định xử lý của ban quản trị được ghi nhận kèm ghi chú và thời điểm xử lý trong hồ sơ tranh chấp.",
        ],
      },
    ],
  },

  {
    id: "auto",
    title: "VIII. Quy Trình Tự Động Hóa",
    subtitle: "Danh mục các tác vụ tự động và tần suất thực hiện để vận hành hệ thống",
    icon: <Clock size={18} />,
    color: "#64748b",
    colorRgb: "100, 116, 139",
    articles: [
      {
        number: "8.1",
        title: "Tác vụ chạy hàng ngày",
        type: "info",
        paragraphs: [
          "00:00 giờ — Duyệt toàn bộ tin đang tuyển, đóng các tin đã hết hạn nộp hồ sơ.",
          "01:00 giờ — Tự động duyệt các tin Premium đang chờ phê duyệt mà không có phản hồi từ ban quản trị trong 7 ngày.",
          "02:00 giờ — Tự động từ chối các tin thường đang chờ phê duyệt mà không có phản hồi từ ban quản trị trong 30 ngày. Nhà tuyển dụng được thông báo kèm lý do.",
        ],
      },
      {
        number: "8.2",
        title: "Tác vụ chạy mỗi 15 phút",
        type: "info",
        paragraphs: [
          "Tự động duyệt các đơn ứng tuyển đang chờ xem xét mà Nhà tuyển dụng không phản hồi trong 48 giờ (SLA xử lý).",
          "Kiểm tra tranh chấp chưa được xử lý quá 5 ngày và tự động chuyển sang trạng thái ưu tiên cao.",
          "Hủy tự động các phản hồi sửa đổi quá hạn 72 giờ mà người thực hiện không phản hồi.",
          "Hủy tự động các phản hồi yêu cầu hủy công việc quá hạn phản hồi.",
          "Kiểm tra và đánh dấu hết hạn các chương trình đẩy tin đã hết thời hạn.",
        ],
      },
      {
        number: "8.3",
        title: "Tác vụ chạy mỗi 5 phút",
        type: "info",
        paragraphs: [
          "Kiểm tra cửa sổ nghiệm thu hết hạn 72 giờ, tự động duyệt sản phẩm và giải phóng ký quỹ cho người thực hiện.",
          "Kích hoạt các chương trình đẩy tin đã được hẹn giờ khi đến thời điểm bắt đầu.",
          "Kiểm tra hợp đồng đang trong quá trình ký quá hạn 72 giờ và tự động hủy hợp đồng.",
        ],
      },
      {
        number: "8.4",
        title: "Tác vụ chạy mỗi 30 phút và mỗi giờ",
        type: "info",
        paragraphs: [
          "Mỗi 30 phút: gửi thông báo nhắc nhở Nhà tuyển dụng chưa nghiệm thu sản phẩm trong cửa sổ nghiệm thu.",
          "Mỗi giờ: thực hiện giải ngân cho người thực hiện trong trường hợp lần giải ngân trước đó không thành công (cơ chế an toàn đảm bảo người thực hiện luôn nhận được tiền).",
        ],
      },
      {
        number: "8.5",
        title: "Tác vụ định kỳ khác",
        type: "info",
        paragraphs: [
          "Làm mới quota Premium hàng tháng: kiểm tra và reset quota đã hết chu kỳ cho tất cả người dùng sở hữu gói Premium.",
          "Ghi nhận kiểm toán: toàn bộ thay đổi trạng thái trong hệ thống tuyển dụng đều được ghi nhận kèm thông tin người thực hiện, vai trò, trạng thái trước và sau, thời điểm, lý do. Dữ liệu này phục vụ quản trị, kiểm toán và pháp lý.",
        ],
      },
    ],
  },
];

const typeConfig = {
  warning: {
    icon: <AlertTriangle size={14} />,
    bg: "rgba(245, 158, 11, 0.07)",
    border: "rgba(245, 158, 11, 0.22)",
    color: "#fbbf24",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeColor: "#fbbf24",
  },
  info: {
    icon: <CheckCircle2 size={14} />,
    bg: "rgba(59, 130, 246, 0.05)",
    border: "rgba(59, 130, 246, 0.15)",
    color: "#60a5fa",
    badgeBg: "rgba(59, 130, 246, 0.1)",
    badgeColor: "#60a5fa",
  },
  danger: {
    icon: <AlertTriangle size={14} />,
    bg: "rgba(239, 68, 68, 0.06)",
    border: "rgba(239, 68, 68, 0.15)",
    color: "#f87171",
    badgeBg: "rgba(239, 68, 68, 0.1)",
    badgeColor: "#f87171",
  },
  success: {
    icon: <CheckCircle2 size={14} />,
    bg: "rgba(34, 197, 94, 0.06)",
    border: "rgba(34, 197, 94, 0.15)",
    color: "#34d399",
    badgeBg: "rgba(34, 197, 94, 0.1)",
    badgeColor: "#34d399",
  },
};

type ItemType = keyof typeof typeConfig;

const RegulationsTab: React.FC = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["fees", "fulltime", "shortterm"]),
  );
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredSections = regulationSections
    .map((section) => {
      if (!searchTerm.trim()) return section;
      const term = searchTerm.toLowerCase();
      const matching = section.articles.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.paragraphs.some((p) => p.toLowerCase().includes(term)),
      );
      if (matching.length === 0) return null;
      return { ...section, articles: matching };
    })
    .filter(Boolean) as RegulationSection[];

  const totalArticles = regulationSections.reduce(
    (s, sec) => s + sec.articles.length,
    0,
  );

  const totalParagraphs = regulationSections.reduce(
    (s, sec) =>
      s + sec.articles.reduce((a, art) => a + art.paragraphs.length, 0),
    0,
  );

  return (
    <div className="reg-container">
      <div className="reg-header">
        <div className="reg-header__title-row">
          <div className="reg-header__shield">
            <ScrollText size={20} />
          </div>
          <div className="reg-header__text">
            <div className="reg-header__doc-label">
              <span className="reg-header__doc-badge">VĂN BẢN NỘI BỘ</span>
            </div>
            <h1 className="reg-header__title">Quy Định Nghiệp Vụ</h1>
            <p className="reg-header__subtitle">
              Hệ thống quy tắc, quy trình và giới hạn nghiệp vụ dành cho Nhà tuyển dụng trên nền tảng SkillVerse
            </p>
          </div>
        </div>

        <div className="reg-stats">
          <div className="reg-stat">
            <span className="reg-stat__value">{regulationSections.length}</span>
            <span className="reg-stat__label">Phần</span>
          </div>
          <div className="reg-stat__divider" />
          <div className="reg-stat">
            <span className="reg-stat__value">{totalArticles}</span>
            <span className="reg-stat__label">Điều Khoản</span>
          </div>
          <div className="reg-stat__divider" />
          <div className="reg-stat">
            <span className="reg-stat__value">{totalParagraphs}</span>
            <span className="reg-stat__label">Khoản</span>
          </div>
          <div className="reg-stat__divider" />
          <div className="reg-stat">
            <span className="reg-stat__value">5 ngày</span>
            <span className="reg-stat__label">SLA Tranh chấp</span>
          </div>
          <div className="reg-stat__divider" />
          <div className="reg-stat">
            <span className="reg-stat__value">72h</span>
            <span className="reg-stat__label">Nghiệm Thu</span>
          </div>
        </div>

        <div className="reg-search">
          <div className="reg-search__input-wrap">
            <svg className="reg-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="reg-search__input"
              placeholder="Tìm kiếm theo từ khóa trong điều khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="reg-search__hint">
            {searchTerm
              ? `Tìm thấy ${filteredSections.reduce(
                  (s, sec) => s + sec.articles.length,
                  0,
                )} điều khoản cho "${searchTerm}"`
              : "Tìm kiếm theo tiêu đề hoặc nội dung điều khoản"}
          </span>
        </div>
      </div>

      <div className="reg-sections">
        {filteredSections.length === 0 ? (
          <div className="reg-empty">
            <AlertTriangle size={28} />
            <p>Không tìm thấy điều khoản phù hợp với "{searchTerm}"</p>
            <button className="reg-empty__clear" onClick={() => setSearchTerm("")}>
              Xóa tìm kiếm
            </button>
          </div>
        ) : (
          filteredSections.map((section) => {
            const isOpen = openSections.has(section.id);
            return (
              <div
                key={section.id}
                className="reg-chapter"
                style={
                  {
                    "--chapter-color": section.color,
                    "--chapter-color-rgb": section.colorRgb,
                  } as React.CSSProperties
                }
              >
                <button
                  className={`reg-chapter__header ${isOpen ? "reg-chapter__header--open" : ""}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="reg-chapter__header-left">
                    <span className="reg-chapter__icon" style={{ color: section.color }}>
                      {section.icon}
                    </span>
                    <div className="reg-chapter__meta">
                      <span className="reg-chapter__title">{section.title}</span>
                      <span className="reg-chapter__subtitle">{section.subtitle}</span>
                    </div>
                  </div>
                  <div className="reg-chapter__header-right">
                    <span className="reg-chapter__count">
                      {section.articles.length} điều
                    </span>
                    <span className="reg-chapter__toggle">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="reg-chapter__body">
                    {section.articles.map((article, idx) => {
                      const t = article.type as ItemType;
                      const c = typeConfig[t];
                      return (
                        <div
                          key={idx}
                          className="reg-article"
                          style={{ background: c.bg, borderColor: c.border }}
                        >
                          <div className="reg-article__header">
                            <span className="reg-article__number">{article.number}</span>
                            <span className="reg-article__title">{article.title}</span>
                            <span
                              className="reg-article__badge"
                              style={{ background: c.badgeBg, color: c.badgeColor }}
                            >
                              {c.icon}
                              <span className="reg-article__badge-text">
                                {article.type === "danger"
                                  ? "Bắt buộc"
                                  : article.type === "warning"
                                  ? "Lưu ý"
                                  : article.type === "success"
                                  ? "Quyền lợi"
                                  : "Thông tin"}
                              </span>
                            </span>
                          </div>
                          <div className="reg-article__paragraphs">
                            {article.paragraphs.map((para, pIdx) => (
                              <p key={pIdx} className="reg-article__para">
                                <span className="reg-article__para-num">
                                  {pIdx + 1}.
                                </span>
                                {para}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="reg-footer">
        <ScrollText size={14} />
        <span>
          Quy định nghiệp vụ SkillVerse — Phiên bản 2026.04 — Áp dụng cho tất cả Nhà tuyển dụng trên nền tảng
        </span>
      </div>
    </div>
  );
};

export default RegulationsTab;
