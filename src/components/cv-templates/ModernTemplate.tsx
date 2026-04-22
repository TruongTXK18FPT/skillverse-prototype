// Modern CV Template - Gradient header, card-based layout
import React from "react";
import { CVStructuredData } from "../../data/cvTemplateTypes";
import CVMarkdownRenderer from "./CVMarkdownRenderer";
import { cleanCVString } from "./cvUtils";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
} from "lucide-react";

interface Props {
  data: CVStructuredData;
}

export const ModernTemplate: React.FC<Props> = ({ data }) => {
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

  return (
    <div className="cv-tpl-modern">
      {/* ===== GRADIENT HEADER ===== */}
      <div className="cv-mod-header">
        {pi.avatarUrl ? (
          <img src={pi.avatarUrl} alt={pi.fullName} className="cv-mod-avatar" />
        ) : (
          <div className="cv-mod-avatar-fallback">
            {pi.fullName?.[0] || "U"}
          </div>
        )}
        <div>
          <h1 className="cv-mod-name">{pi.fullName}</h1>
          {pi.professionalTitle && (
            <p className="cv-mod-title">{pi.professionalTitle}</p>
          )}
          <div className="cv-mod-contact-bar">
            {pi.email && (
              <span className="cv-mod-contact-chip">
                <Mail size={12} />
                {pi.email}
              </span>
            )}
            {pi.phone && (
              <span className="cv-mod-contact-chip">
                <Phone size={12} />
                {pi.phone}
              </span>
            )}
            {pi.location && (
              <span className="cv-mod-contact-chip">
                <MapPin size={12} />
                {pi.location}
              </span>
            )}
            {pi.linkedinUrl && (
              <span className="cv-mod-contact-chip">
                <Linkedin size={12} />
                LinkedIn
              </span>
            )}
            {pi.githubUrl && (
              <span className="cv-mod-contact-chip">
                <Github size={12} />
                GitHub
              </span>
            )}
            {pi.portfolioUrl && (
              <span className="cv-mod-contact-chip">
                <Globe size={12} />
                Portfolio
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div className="cv-mod-body">
        {/* Main Content */}
        <div className="cv-mod-main">
          {/* Summary */}
          {summary && (
            <>
              <div className="cv-mod-section-title">Giới Thiệu</div>
              <div className="cv-mod-summary">{summary}</div>
            </>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <>
              <div className="cv-mod-section-title">Kinh Nghiệm</div>
              {experience.map((exp, i) => (
                <div key={i} className="cv-mod-card">
                  <div className="cv-mod-exp-role">{exp.title}</div>
                  <div className="cv-mod-exp-company">{exp.company}</div>
                  <div className="cv-mod-exp-date">
                    {exp.startDate} — {exp.isCurrent ? "Hiện tại" : exp.endDate}
                    {exp.location ? ` | ${exp.location}` : ""}
                  </div>
                  {exp.description && (
                    <div className="cv-mod-exp-desc">
                      <CVMarkdownRenderer content={exp.description} />
                    </div>
                  )}
                  {exp.achievements?.map((ach, j) => (
                    <div key={j} className="cv-mod-achievement">
                      {ach}
                    </div>
                  ))}
                  {exp.technologies && exp.technologies.length > 0 && (
                    <div
                      className="cv-mod-tags"
                      style={{ marginTop: "0.5rem" }}
                    >
                      {exp.technologies.map((t, k) => (
                        <span key={k} className="cv-mod-badge">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Education */}
          {education.length > 0 && (
            <>
              <div className="cv-mod-section-title">Học Vấn</div>
              {education.map((edu, i) => (
                <div key={i} className="cv-mod-card">
                  <div className="cv-mod-exp-role">{edu.degree}</div>
                  <div className="cv-mod-exp-company">{edu.institution}</div>
                  <div className="cv-mod-exp-date">
                    {edu.startDate} — {edu.endDate || "Hiện tại"}
                    {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <>
              <div className="cv-mod-section-title">Dự Án</div>
              {projects.map((proj, i) => (
                <div key={i} className="cv-mod-project-card">
                  <div className="cv-mod-exp-role">
                    {proj.title}
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginLeft: "0.5rem", color: "#8b5cf6" }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className="cv-mod-exp-desc">
                    <CVMarkdownRenderer content={proj.description} />
                  </div>
                  {proj.technologies.length > 0 && (
                    <div
                      className="cv-mod-tags"
                      style={{ marginTop: "0.4rem" }}
                    >
                      {proj.technologies.map((t, k) => (
                        <span key={k} className="cv-mod-badge">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {proj.outcomes?.map((o, j) => (
                    <div key={j} className="cv-mod-achievement">
                      {o}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* Endorsements */}
          {endorsements.length > 0 && (
            <>
              <div className="cv-mod-section-title">Lời Giới Thiệu</div>
              {endorsements.map((end, i) => (
                <div key={i} className="cv-mod-endorsement-card">
                  "{end.quote}"
                  <div
                    style={{
                      fontStyle: "normal",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      color: "#64748b",
                      marginTop: "0.35rem",
                    }}
                  >
                    — {end.authorName}
                    {end.authorTitle ? `, ${end.authorTitle}` : ""}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="cv-mod-side">
          {/* Skills */}
          {skills.length > 0 && (
            <>
              <div className="cv-mod-section-title">Kỹ Năng</div>
              {skills.map((cat, ci) => (
                <div key={ci}>
                  {cat.category && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#7c3aed",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {cat.category}
                    </div>
                  )}
                  <div className="cv-mod-skill-grid">
                    {cat.skills.map((skill, si) => {
                      const pct = Math.min(skill.level * 20, 100);
                      return (
                        <div key={si} className="cv-mod-skill-circular">
                          <div
                            className="cv-mod-skill-circle"
                            style={
                              { "--percent": `${pct}%` } as React.CSSProperties
                            }
                          >
                            <span>{pct}%</span>
                          </div>
                          <div className="cv-mod-skill-label">
                            {cleanCVString(skill.name)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <>
              <div className="cv-mod-section-title">Ngôn Ngữ</div>
              {languages.map((lang, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  <span>{cleanCVString(lang.name)}</span>
                  <span className="cv-mod-badge">{lang.proficiency}</span>
                </div>
              ))}
            </>
          )}

          {/* Certificates */}
          {certificates.length > 0 && (
            <>
              <div
                className="cv-mod-section-title"
                style={{ marginTop: "1.5rem" }}
              >
                Chứng Chỉ
              </div>
              {certificates.map((cert, i) => (
                <div key={i} className="cv-mod-cert-item">
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                    {cert.title}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {cert.issuingOrganization}
                  </div>
                  {cert.issueDate && (
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      {cert.issueDate}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
