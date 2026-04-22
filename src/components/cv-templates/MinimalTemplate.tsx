// Minimal CV Template - Ultra-clean single-column layout
import React from "react";
import { CVStructuredData } from "../../data/cvTemplateTypes";
import CVMarkdownRenderer from "./CVMarkdownRenderer";
import { cleanCVString } from "./cvUtils";

interface Props {
  data: CVStructuredData;
}

export const MinimalTemplate: React.FC<Props> = ({ data }) => {
  const {
    personalInfo: pi,
    summary,
    experience,
    education,
    skills,
    projects,
    certificates,
    languages,
    endorsements,
  } = data;

  const allSkills = skills.flatMap((c) =>
    c.skills.map((s) => cleanCVString(s.name)),
  );

  return (
    <div className="cv-tpl-minimal">
      {/* Header */}
      <h1 className="cv-min-name">{pi.fullName}</h1>
      {pi.professionalTitle && (
        <p className="cv-min-title">{pi.professionalTitle}</p>
      )}

      <div className="cv-min-contact-line">
        {pi.email && <span>{pi.email}</span>}
        {pi.phone && <span>{pi.phone}</span>}
        {pi.location && <span>{pi.location}</span>}
        {pi.linkedinUrl && <span>LinkedIn</span>}
        {pi.githubUrl && <span>GitHub</span>}
      </div>

      {/* Summary */}
      {summary && (
        <div className="cv-min-section">
          <div className="cv-min-section-title">Giới thiệu</div>
          <div className="cv-min-summary">{summary}</div>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="cv-min-section">
          <div className="cv-min-section-title">Kinh nghiệm</div>
          {experience.map((exp, i) => (
            <div key={i} className="cv-min-exp-item">
              <div className="cv-min-exp-row">
                <span className="cv-min-exp-role">{exp.title}</span>
                <span className="cv-min-exp-date">
                  {exp.startDate} — {exp.isCurrent ? "Hiện tại" : exp.endDate}
                </span>
              </div>
              <div className="cv-min-exp-company">
                {exp.company}
                {exp.location ? `, ${exp.location}` : ""}
              </div>
              {exp.description && (
                <div className="cv-min-exp-desc">
                  <CVMarkdownRenderer content={exp.description} />
                </div>
              )}
              {exp.achievements?.map((ach, j) => (
                <div
                  key={j}
                  style={{
                    fontSize: "0.85rem",
                    paddingLeft: "0.75rem",
                    color: "#374151",
                  }}
                >
                  — {ach}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="cv-min-section">
          <div className="cv-min-section-title">Học vấn</div>
          {education.map((edu, i) => (
            <div key={i} className="cv-min-edu-item">
              <div className="cv-min-exp-row">
                <span className="cv-min-exp-role">{edu.degree}</span>
                <span className="cv-min-exp-date">
                  {edu.startDate} — {edu.endDate || "Hiện tại"}
                </span>
              </div>
              <div className="cv-min-exp-company">
                {edu.institution}
                {edu.gpa ? ` — GPA: ${edu.gpa}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <div className="cv-min-section">
          <div className="cv-min-section-title">Kỹ năng</div>
          <div className="cv-min-skills-list">{allSkills.join(", ")}</div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="cv-min-section">
          <div className="cv-min-section-title">Dự án</div>
          {projects.map((proj, i) => (
            <div key={i} className="cv-min-project-item">
              <div className="cv-min-project-title">{proj.title}</div>
              <div className="cv-min-project-desc">
                <CVMarkdownRenderer content={proj.description} />
              </div>
              {proj.technologies.length > 0 && (
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "#6b7280",
                    marginTop: "0.15rem",
                  }}
                >
                  Tech: {proj.technologies.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="cv-min-section">
          <div className="cv-min-section-title">Chứng chỉ</div>
          {certificates.map((cert, i) => (
            <div key={i} className="cv-min-cert-item">
              {cert.title} — {cert.issuingOrganization}
              {cert.issueDate ? ` (${cert.issueDate})` : ""}
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <div className="cv-min-section">
          <div className="cv-min-section-title">Ngôn ngữ</div>
          <div className="cv-min-skills-list">
            {languages
              .map((l) => `${cleanCVString(l.name)} (${l.proficiency})`)
              .join(", ")}
          </div>
        </div>
      )}

      {/* Endorsements */}
      {endorsements.length > 0 && (
        <div className="cv-min-section">
          <div className="cv-min-section-title">Lời giới thiệu</div>
          {endorsements.map((end, i) => (
            <div key={i} className="cv-min-endorsement">
              "{end.quote}" — {end.authorName}
              {end.authorTitle ? `, ${end.authorTitle}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
