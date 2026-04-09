import React from "react";
import { ContractType, Contract } from "../../types/contract";
import ContractMarkdownViewer from "./ContractMarkdownViewer";
import "./ContractClauses.css";

interface ContractClausesProps {
  contractType: ContractType;
  contract?: Partial<Contract>;
  compact?: boolean;
}

function fmtVND(n?: number): string {
  return typeof n === "number" ? `${n.toLocaleString("vi-VN")} VND` : "";
}

function fmtDate(d?: string): string {
  return d ? new Date(d).toLocaleDateString("vi-VN") : "";
}

function fmtBool(v?: boolean): string {
  return v === true ? "Có" : v === false ? "Không" : "";
}

function fmtPaymentMethod(value?: string): string {
  switch (value) {
    case "bank_transfer":
      return "Chuyển khoản ngân hàng";
    case "cash":
      return "Tiền mặt";
    case "e_wallet":
      return "Ví điện tử";
    default:
      return value || "Chuyển khoản";
  }
}

function hasContent(value?: string): boolean {
  return Boolean(value?.trim());
}

interface ClauseItemProps {
  label: string;
  value?: string | number | boolean;
}

function ClauseItem({ label, value }: ClauseItemProps): React.ReactNode {
  if (value === undefined || value === null || value === "") return null;
  const displayValue =
    typeof value === "boolean" ? fmtBool(value) : String(value);

  return (
    <li>
      <strong>{label}:</strong> {displayValue}
    </li>
  );
}

function MarkdownBlock({
  content,
}: {
  content?: string;
}): React.ReactNode {
  if (!hasContent(content)) return null;

  return (
    <div className="contract-clauses__markdown">
      <ContractMarkdownViewer content={content} />
    </div>
  );
}

const ContractClauses: React.FC<ContractClausesProps> = ({
  contractType,
  contract = {},
  compact = false,
}) => {
  const c = contract;

  if (contractType === ContractType.PROBATION) {
    return (
      <div
        className={`contract-clauses ${compact ? "contract-clauses--compact" : ""}`}
      >
        <h3 className="clauses-header">
          Điều khoản Hợp đồng Thử việc
          <span className="clauses-ref">
            {" "}
            (tham chiếu Bộ luật Lao động 2019, Điều 24-27)
          </span>
        </h3>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 1 - Công việc và mục tiêu thử việc
          </h4>
          <p>
            Bên B đảm nhận vị trí <strong>{c.candidatePosition || "-"}</strong>
            {c.workingLocation ? ` tại ${c.workingLocation}` : ""}, bắt đầu thử
            việc từ ngày <strong>{fmtDate(c.startDate) || "-"}</strong>.
          </p>
          {hasContent(c.jobDescription) && (
            <>
              <p>
                <strong>Mô tả công việc:</strong>
              </p>
              <MarkdownBlock content={c.jobDescription} />
            </>
          )}
          {hasContent(c.probationObjectives) && (
            <>
              <p>
                <strong>Mục tiêu thử việc:</strong>
              </p>
              <MarkdownBlock content={c.probationObjectives} />
            </>
          )}
          {hasContent(c.probationEvaluationCriteria) && (
            <>
              <p>
                <strong>Tiêu chí đánh giá thử việc:</strong>
              </p>
              <MarkdownBlock content={c.probationEvaluationCriteria} />
            </>
          )}
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 2 - Thời hạn và thời gian làm việc
          </h4>
          <p>
            Thời gian thử việc là <strong>{c.probationMonths || "-" } tháng</strong>,
            không vượt quá <strong>60 ngày</strong> theo quy định pháp luật.
          </p>
          <p>
            Áp dụng từ ngày <strong>{fmtDate(c.startDate) || "-"}</strong>
            {c.endDate ? ` đến ngày ${fmtDate(c.endDate)}` : ""}.
          </p>
          <p>
            Thời giờ làm việc dự kiến:{" "}
            <strong>{c.workingHoursPerDay || 8} giờ/ngày</strong>,{" "}
            <strong>{c.workingHoursPerWeek || 40} giờ/tuần</strong>.
          </p>
          {c.workingSchedule && (
            <p>
              Ca làm việc: <strong>{c.workingSchedule}</strong>.
            </p>
          )}
          {hasContent(c.remoteWorkPolicy) && (
            <>
              <p>
                <strong>Chính sách làm việc từ xa:</strong>
              </p>
              <MarkdownBlock content={c.remoteWorkPolicy} />
            </>
          )}
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 3 - Tiền lương và phương thức thanh toán
          </h4>
          <p>
            Lương thử việc: <strong>{fmtVND(c.probationSalary)}</strong>
            {c.probationSalaryText ? ` (${c.probationSalaryText})` : ""}.
          </p>
          <p>
            Lương chính thức sau thử việc: <strong>{fmtVND(c.salary)}</strong>
            {c.salaryText ? ` (${c.salaryText})` : ""}.
          </p>
          <p>
            Tiền lương thử việc không thấp hơn <strong>85%</strong> mức lương
            chính thức theo thỏa thuận.
          </p>
          <p>
            Phương thức thanh toán:{" "}
            <strong>{fmtPaymentMethod(c.paymentMethod)}</strong>.
          </p>
          <p>
            Ngày thanh toán dự kiến: ngày{" "}
            <strong>{c.salaryPaymentDate || 10}</strong> hằng tháng.
          </p>
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 4 - Phụ cấp và quyền lợi trong thời gian thử việc
          </h4>
          <ul className="clause-list">
            <ClauseItem
              label="Phụ cấp ăn"
              value={c.mealAllowance ? fmtVND(c.mealAllowance) : "Không có"}
            />
            <ClauseItem
              label="Phụ cấp đi lại"
              value={
                c.transportAllowance
                  ? fmtVND(c.transportAllowance)
                  : "Không có"
              }
            />
            <ClauseItem
              label="Phụ cấp nhà ở"
              value={
                c.housingAllowance ? fmtVND(c.housingAllowance) : "Không có"
              }
            />
          </ul>
          {hasContent(c.otherAllowances) && (
            <>
              <p>
                <strong>Các khoản phụ cấp khác:</strong>
              </p>
              <MarkdownBlock content={c.otherAllowances} />
            </>
          )}
          {hasContent(c.bonusPolicy) && (
            <>
              <p>
                <strong>Chính sách thưởng:</strong>
              </p>
              <MarkdownBlock content={c.bonusPolicy} />
            </>
          )}
          {hasContent(c.leavePolicy) && (
            <>
              <p>
                <strong>Chính sách nghỉ phép:</strong>
              </p>
              <MarkdownBlock content={c.leavePolicy} />
            </>
          )}
          {hasContent(c.insurancePolicy) && (
            <>
              <p>
                <strong>Chính sách bảo hiểm:</strong>
              </p>
              <MarkdownBlock content={c.insurancePolicy} />
            </>
          )}
          {hasContent(c.trainingPolicy) && (
            <>
              <p>
                <strong>Chính sách đào tạo:</strong>
              </p>
              <MarkdownBlock content={c.trainingPolicy} />
            </>
          )}
          {hasContent(c.otherBenefits) && (
            <>
              <p>
                <strong>Phúc lợi khác:</strong>
              </p>
              <MarkdownBlock content={c.otherBenefits} />
            </>
          )}
          <p>
            Chế độ nghỉ phép tham chiếu hiện tại:{" "}
            <strong>{c.annualLeaveDays || 0} ngày</strong>.
          </p>
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 5 - Bảo mật, sở hữu trí tuệ và chấm dứt thử việc
          </h4>
          {hasContent(c.confidentialityClause) ? (
            <>
              <p>
                <strong>Điều khoản bảo mật:</strong>
              </p>
              <MarkdownBlock content={c.confidentialityClause} />
            </>
          ) : (
            <p>
              Bên B có trách nhiệm bảo mật thông tin nội bộ, dữ liệu khách hàng
              và các tài liệu nghiệp vụ trong suốt quá trình thử việc.
            </p>
          )}
          {hasContent(c.ipClause) ? (
            <>
              <p>
                <strong>Điều khoản sở hữu trí tuệ:</strong>
              </p>
              <MarkdownBlock content={c.ipClause} />
            </>
          ) : (
            <p>
              Các sáng kiến, sản phẩm hoặc tài liệu được tạo ra trong phạm vi
              công việc thử việc thuộc quyền quản lý và sử dụng của Bên A theo
              thỏa thuận.
            </p>
          )}
          {hasContent(c.terminationClause) && (
            <>
              <p>
                <strong>Điều khoản chấm dứt chi tiết:</strong>
              </p>
              <MarkdownBlock content={c.terminationClause} />
            </>
          )}
          <p>
            Mỗi bên có quyền chấm dứt thỏa thuận thử việc với thời hạn báo trước{" "}
            <strong>{c.terminationNoticeDays || 3} ngày làm việc</strong>.
          </p>
        </article>

        {c.nonCompeteClause && (
          <article className="clause-article">
            <h4 className="clause-article-title">
              Điều 6 - Hạn chế cạnh tranh
            </h4>
            <p>
              Hợp đồng có áp dụng điều khoản hạn chế cạnh tranh sau khi nghỉ
              việc.
            </p>
            {c.nonCompeteDurationMonths && (
              <p>
                Thời hạn áp dụng:{" "}
                <strong>{c.nonCompeteDurationMonths} tháng</strong>.
              </p>
            )}
          </article>
        )}

        {hasContent(c.legalText) && (
          <article className="clause-article">
            <h4 className="clause-article-title">
              Điều {c.nonCompeteClause ? 7 : 6} - Điều khoản bổ sung
            </h4>
            <MarkdownBlock content={c.legalText} />
          </article>
        )}
      </div>
    );
  }

  if (contractType === ContractType.FULL_TIME) {
    return (
      <div
        className={`contract-clauses ${compact ? "contract-clauses--compact" : ""}`}
      >
        <h3 className="clauses-header">
          Điều khoản Hợp đồng Lao động
          <span className="clauses-ref">
            {" "}
            (tham chiếu Bộ luật Lao động 2019)
          </span>
        </h3>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 1 - Công việc và trách nhiệm của Người lao động
          </h4>
          <p>
            Vị trí đảm nhiệm: <strong>{c.candidatePosition || "-"}</strong>
            {c.workingLocation ? `, địa điểm làm việc: ${c.workingLocation}` : ""}.
          </p>
          {hasContent(c.jobDescription) && (
            <>
              <p>
                <strong>Nội dung công việc:</strong>
              </p>
              <MarkdownBlock content={c.jobDescription} />
            </>
          )}
          <ul className="clause-list">
            <li>
              Thực hiện công việc đúng vị trí, chức danh và phạm vi trách nhiệm
              đã được giao.
            </li>
            <li>
              Tuân thủ nội quy lao động, quy chế vận hành và quy định bảo mật
              của Bên A.
            </li>
            <li>
              Hoàn thành công việc đúng tiến độ, bảo đảm chất lượng và tiêu
              chuẩn nghề nghiệp.
            </li>
            <li>
              Bảo vệ tài sản, thông tin và uy tín của Bên A trong quá trình làm
              việc.
            </li>
          </ul>
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 2 - Nghĩa vụ của Người sử dụng lao động
          </h4>
          <ul className="clause-list">
            <li>Cung cấp công việc, công cụ và điều kiện làm việc phù hợp.</li>
            <li>Thanh toán lương, phụ cấp và chế độ đúng hạn theo thỏa thuận.</li>
            <li>Đóng BHXH, BHYT, BHTN theo quy định hiện hành.</li>
            <li>
              Tổ chức khám sức khỏe định kỳ cho Người lao động:{" "}
              <strong>{fmtBool(c.healthCheckupAnnual) || "Theo chính sách công ty"}</strong>.
            </li>
            <li>Bảo đảm an toàn, vệ sinh lao động tại nơi làm việc.</li>
          </ul>
          {hasContent(c.insurancePolicy) && (
            <>
              <p>
                <strong>Chi tiết chính sách bảo hiểm:</strong>
              </p>
              <MarkdownBlock content={c.insurancePolicy} />
            </>
          )}
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 3 - Thời giờ làm việc và nghỉ ngơi
          </h4>
          <ul className="clause-list">
            <li>
              Thời giờ làm việc: <strong>{c.workingHoursPerDay || 8} giờ/ngày</strong>,{" "}
              <strong>{c.workingHoursPerWeek || 40} giờ/tuần</strong>.
            </li>
            {c.workingSchedule && (
              <li>
                Ca làm việc: <strong>{c.workingSchedule}</strong>.
              </li>
            )}
            <li>
              Nghỉ hằng tuần tối thiểu <strong>01 ngày</strong> theo lịch làm
              việc của doanh nghiệp.
            </li>
            <li>
              Nghỉ phép năm: <strong>{c.annualLeaveDays || 12} ngày</strong>.
            </li>
          </ul>
          {hasContent(c.remoteWorkPolicy) && (
            <>
              <p>
                <strong>Chính sách làm việc từ xa:</strong>
              </p>
              <MarkdownBlock content={c.remoteWorkPolicy} />
            </>
          )}
          {hasContent(c.leavePolicy) && (
            <>
              <p>
                <strong>Chính sách nghỉ phép chi tiết:</strong>
              </p>
              <MarkdownBlock content={c.leavePolicy} />
            </>
          )}
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 4 - Tiền lương, phụ cấp và thưởng
          </h4>
          <p>
            Mức lương: <strong>{fmtVND(c.salary)}</strong>
            {c.salaryText ? ` (${c.salaryText})` : ""}.
          </p>
          <p>
            Ngày thanh toán: ngày <strong>{c.salaryPaymentDate || 10}</strong>{" "}
            hằng tháng.
          </p>
          <p>
            Phương thức thanh toán:{" "}
            <strong>{fmtPaymentMethod(c.paymentMethod)}</strong>.
          </p>
          <ul className="clause-list">
            <ClauseItem
              label="Phụ cấp ăn"
              value={c.mealAllowance ? fmtVND(c.mealAllowance) : "Không có"}
            />
            <ClauseItem
              label="Phụ cấp đi lại"
              value={
                c.transportAllowance
                  ? fmtVND(c.transportAllowance)
                  : "Không có"
              }
            />
            <ClauseItem
              label="Phụ cấp nhà ở"
              value={
                c.housingAllowance ? fmtVND(c.housingAllowance) : "Không có"
              }
            />
          </ul>
          {hasContent(c.otherAllowances) && (
            <>
              <p>
                <strong>Các khoản phụ cấp khác:</strong>
              </p>
              <MarkdownBlock content={c.otherAllowances} />
            </>
          )}
          {hasContent(c.bonusPolicy) && (
            <>
              <p>
                <strong>Chính sách thưởng:</strong>
              </p>
              <MarkdownBlock content={c.bonusPolicy} />
            </>
          )}
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 5 - Đào tạo và phúc lợi
          </h4>
          {hasContent(c.trainingPolicy) && (
            <>
              <p>
                <strong>Chính sách đào tạo:</strong>
              </p>
              <MarkdownBlock content={c.trainingPolicy} />
            </>
          )}
          {hasContent(c.otherBenefits) && (
            <>
              <p>
                <strong>Phúc lợi khác:</strong>
              </p>
              <MarkdownBlock content={c.otherBenefits} />
            </>
          )}
          {!hasContent(c.trainingPolicy) && !hasContent(c.otherBenefits) && (
            <p>
              Người lao động được hưởng các chương trình đào tạo, phúc lợi và
              hỗ trợ nội bộ theo chính sách của doanh nghiệp trong từng thời
              kỳ.
            </p>
          )}
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 6 - Bảo mật thông tin và sở hữu trí tuệ
          </h4>
          {hasContent(c.confidentialityClause) ? (
            <>
              <p>
                <strong>Điều khoản bảo mật:</strong>
              </p>
              <MarkdownBlock content={c.confidentialityClause} />
            </>
          ) : (
            <p>
              Người lao động cam kết bảo mật thông tin nội bộ, dữ liệu khách
              hàng, bí quyết công nghệ và tài liệu nghiệp vụ của Bên A.
            </p>
          )}
          {hasContent(c.ipClause) ? (
            <>
              <p>
                <strong>Điều khoản sở hữu trí tuệ:</strong>
              </p>
              <MarkdownBlock content={c.ipClause} />
            </>
          ) : (
            <p>
              Các sản phẩm, tài liệu, sáng kiến hoặc kết quả công việc được tạo
              ra trong phạm vi nhiệm vụ thuộc quyền quản lý và sử dụng của Bên
              A theo thỏa thuận.
            </p>
          )}
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 7 - Hạn chế cạnh tranh
          </h4>
          {c.nonCompeteClause ? (
            <>
              <p>
                Hợp đồng có áp dụng điều khoản hạn chế cạnh tranh sau khi nghỉ
                việc.
              </p>
              {c.nonCompeteDurationMonths && (
                <p>
                  Thời hạn áp dụng:{" "}
                  <strong>{c.nonCompeteDurationMonths} tháng</strong>.
                </p>
              )}
            </>
          ) : (
            <p>
              Không áp dụng điều khoản hạn chế cạnh tranh bổ sung ngoài các nghĩa
              vụ bảo mật và bảo vệ quyền lợi hợp pháp của Bên A.
            </p>
          )}
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 8 - Chấm dứt hợp đồng lao động
          </h4>
          <p>
            Thời hạn báo trước:{" "}
            <strong>{c.terminationNoticeDays || 30} ngày</strong>.
          </p>
          {hasContent(c.terminationClause) && (
            <>
              <p>
                <strong>Điều khoản chấm dứt chi tiết:</strong>
              </p>
              <MarkdownBlock content={c.terminationClause} />
            </>
          )}
          <ul className="clause-list">
            <li>Hai bên thỏa thuận chấm dứt hợp đồng.</li>
            <li>Đơn phương chấm dứt theo quy định của pháp luật.</li>
            <li>Hợp đồng hết hạn hoặc phát sinh căn cứ chấm dứt khác.</li>
            <li>
              Người lao động vi phạm kỷ luật hoặc nghĩa vụ ở mức phải xử lý theo
              quy định.
            </li>
          </ul>
        </article>

        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 9 - Giải quyết tranh chấp lao động
          </h4>
          <p>
            Tranh chấp phát sinh từ hợp đồng này được ưu tiên giải quyết thông
            qua thương lượng, hòa giải; nếu không đạt kết quả, các bên có quyền
            yêu cầu cơ quan có thẩm quyền giải quyết theo quy định pháp luật.
          </p>
        </article>

        {hasContent(c.legalText) && (
          <article className="clause-article">
            <h4 className="clause-article-title">
              Điều 10 - Điều khoản bổ sung
            </h4>
            <MarkdownBlock content={c.legalText} />
          </article>
        )}
      </div>
    );
  }

  const partTimeHoursPerWeek = c.workingHoursPerWeek
    ? Math.round(c.workingHoursPerWeek / 2)
    : 20;

  return (
    <div
      className={`contract-clauses ${compact ? "contract-clauses--compact" : ""}`}
    >
      <h3 className="clauses-header">
        Điều khoản Hợp đồng Lao động Thời vụ
        <span className="clauses-ref"> (tham chiếu Bộ luật Lao động 2019)</span>
      </h3>

      <article className="clause-article">
        <h4 className="clause-article-title">
          Điều 1 - Công việc và thời hạn hợp đồng
        </h4>
        <p>
          Vị trí công việc: <strong>{c.candidatePosition || "-"}</strong>
          {c.workingLocation ? `, địa điểm làm việc: ${c.workingLocation}` : ""}.
        </p>
        <p>
          Thời hạn thực hiện: <strong>{fmtDate(c.startDate) || "-"}</strong>
          {c.endDate ? ` đến ${fmtDate(c.endDate)}` : ""}.
        </p>
        {hasContent(c.jobDescription) && (
          <>
            <p>
              <strong>Nội dung công việc:</strong>
            </p>
            <MarkdownBlock content={c.jobDescription} />
          </>
        )}
      </article>

      <article className="clause-article">
        <h4 className="clause-article-title">
          Điều 2 - Thời giờ làm việc
        </h4>
        <p>
          Thời lượng làm việc không vượt quá{" "}
          <strong>{partTimeHoursPerWeek} giờ/tuần</strong>.
        </p>
        {c.workingSchedule && (
          <p>
            Ca làm việc: <strong>{c.workingSchedule}</strong>.
          </p>
        )}
        {c.workingHoursPerDay && (
          <p>
            Giới hạn theo ngày: <strong>{c.workingHoursPerDay} giờ</strong>.
          </p>
        )}
        {hasContent(c.remoteWorkPolicy) && (
          <>
            <p>
              <strong>Chính sách làm việc từ xa:</strong>
            </p>
            <MarkdownBlock content={c.remoteWorkPolicy} />
          </>
        )}
      </article>

      <article className="clause-article">
        <h4 className="clause-article-title">
          Điều 3 - Tiền lương và phụ cấp
        </h4>
        <p>
          Mức lương: <strong>{fmtVND(c.salary)}</strong>
          {c.salaryText ? ` (${c.salaryText})` : ""}.
        </p>
        <p>
          Ngày thanh toán: ngày <strong>{c.salaryPaymentDate || 10}</strong>{" "}
          hằng tháng.
        </p>
        <p>
          Phương thức thanh toán:{" "}
          <strong>{fmtPaymentMethod(c.paymentMethod)}</strong>.
        </p>
        <ul className="clause-list">
          <ClauseItem
            label="Phụ cấp ăn"
            value={c.mealAllowance ? fmtVND(c.mealAllowance) : "Không có"}
          />
          <ClauseItem
            label="Phụ cấp đi lại"
            value={
              c.transportAllowance ? fmtVND(c.transportAllowance) : "Không có"
            }
          />
          <ClauseItem
            label="Phụ cấp nhà ở"
            value={c.housingAllowance ? fmtVND(c.housingAllowance) : "Không có"}
          />
        </ul>
        {hasContent(c.otherAllowances) && (
          <>
            <p>
              <strong>Các khoản phụ cấp khác:</strong>
            </p>
            <MarkdownBlock content={c.otherAllowances} />
          </>
        )}
        {hasContent(c.bonusPolicy) && (
          <>
            <p>
              <strong>Chính sách thưởng:</strong>
            </p>
            <MarkdownBlock content={c.bonusPolicy} />
          </>
        )}
      </article>

      <article className="clause-article">
        <h4 className="clause-article-title">
          Điều 4 - Quyền lợi và chính sách áp dụng
        </h4>
        <ul className="clause-list">
          <ClauseItem
            label="Nghỉ phép năm"
            value={
              c.annualLeaveDays
                ? `${c.annualLeaveDays} ngày/năm`
                : "Theo tỷ lệ thời gian làm việc"
            }
          />
          <ClauseItem
            label="Khám sức khỏe định kỳ"
            value={c.healthCheckupAnnual}
          />
        </ul>
        {hasContent(c.leavePolicy) && (
          <>
            <p>
              <strong>Chính sách nghỉ phép:</strong>
            </p>
            <MarkdownBlock content={c.leavePolicy} />
          </>
        )}
        {hasContent(c.insurancePolicy) && (
          <>
            <p>
              <strong>Chính sách bảo hiểm:</strong>
            </p>
            <MarkdownBlock content={c.insurancePolicy} />
          </>
        )}
        {hasContent(c.trainingPolicy) && (
          <>
            <p>
              <strong>Chính sách đào tạo:</strong>
            </p>
            <MarkdownBlock content={c.trainingPolicy} />
          </>
        )}
        {hasContent(c.otherBenefits) && (
          <>
            <p>
              <strong>Phúc lợi khác:</strong>
            </p>
            <MarkdownBlock content={c.otherBenefits} />
          </>
        )}
      </article>

      <article className="clause-article">
        <h4 className="clause-article-title">
          Điều 5 - Bảo mật và sở hữu trí tuệ
        </h4>
        {hasContent(c.confidentialityClause) ? (
          <>
            <p>
              <strong>Điều khoản bảo mật:</strong>
            </p>
            <MarkdownBlock content={c.confidentialityClause} />
          </>
        ) : (
          <p>
            Bên B cam kết bảo mật thông tin, tài liệu và dữ liệu liên quan đến
            công việc trong suốt thời gian hợp đồng.
          </p>
        )}
        {hasContent(c.ipClause) && (
          <>
            <p>
              <strong>Điều khoản sở hữu trí tuệ:</strong>
            </p>
            <MarkdownBlock content={c.ipClause} />
          </>
        )}
      </article>

      <article className="clause-article">
        <h4 className="clause-article-title">
          Điều 6 - Chấm dứt hợp đồng
        </h4>
        <p>
          Thời hạn báo trước:{" "}
          <strong>{c.terminationNoticeDays || 15} ngày</strong>.
        </p>
        {hasContent(c.terminationClause) && (
          <>
            <p>
              <strong>Điều khoản chấm dứt chi tiết:</strong>
            </p>
            <MarkdownBlock content={c.terminationClause} />
          </>
        )}
        {c.nonCompeteClause && c.nonCompeteDurationMonths && (
          <p>
            Điều khoản hạn chế cạnh tranh được áp dụng trong{" "}
            <strong>{c.nonCompeteDurationMonths} tháng</strong> sau khi chấm dứt
            hợp đồng.
          </p>
        )}
      </article>

      {hasContent(c.legalText) && (
        <article className="clause-article">
          <h4 className="clause-article-title">
            Điều 7 - Điều khoản bổ sung
          </h4>
          <MarkdownBlock content={c.legalText} />
        </article>
      )}
    </div>
  );
};

export default ContractClauses;
