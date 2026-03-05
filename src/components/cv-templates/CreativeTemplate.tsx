// Creative CV Template - Bold colors, timeline layout, infographic style
import React from "react";
import { CVStructuredData } from "../../data/cvTemplateTypes";
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

export const CreativeTemplate: React.FC<Props> = ({ data }) => {
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
    <div className="cv-tpl-creative">
      {/* ===== HERO HEADER ===== */}
      <div className="cv-cre-hero">
        <div className="cv-cre-hero-content">
          {pi.avatarUrl ? (
            <img
              src={pi.avatarUrl}
              alt={pi.fullName}
              className="cv-cre-avatar"
            />
          ) : (
            <div className="cv-cre-avatar-fallback">
              {pi.fullName?.[0] || "U"}
            </div>
          )}
          <div>
            <h1 className="cv-cre-name">{pi.fullName}</h1>
            {pi.professionalTitle && (
              <p className="cv-cre-title">{pi.professionalTitle}</p>
            )}
            <div className="cv-cre-contact-row">
              {pi.email && (
                <span className="cv-cre-contact-pill">
                  <Mail size={12} />
                  {pi.email}
                </span>
              )}
              {pi.phone && (
                <span className="cv-cre-contact-pill">
                  <Phone size={12} />
                  {pi.phone}
                </span>
              )}
              {pi.location && (
                <span className="cv-cre-contact-pill">
                  <MapPin size={12} />
                  {pi.location}
                </span>
              )}
              {pi.linkedinUrl && (
                <span className="cv-cre-contact-pill">
                  <Linkedin size={12} />
                  LinkedIn
                </span>
              )}
              {pi.githubUrl && (
                <span className="cv-cre-contact-pill">
                  <Github size={12} />
                  GitHub
                </span>
              )}
              {pi.portfolioUrl && (
                <span className="cv-cre-contact-pill">
                  <Globe size={12} />
                  Portfolio
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div className="cv-cre-body">
        {/* Summary */}
        {summary && (
          <>
            <div className="cv-cre-section-title">Giới Thiệu</div>
            <div className="cv-cre-summary">{summary}</div>
          </>
        )}

        {/* Skills - Colorful tags */}
        {skills.length > 0 && (
          <>
            <div className="cv-cre-section-title">Kỹ Năng</div>
            <div className="cv-cre-skill-tags">
              {skills
                .flatMap((cat) => cat.skills)
                .map((skill, i) => (
                  <span key={i} className="cv-cre-skill-tag">
                    {skill.name}
                  </span>
                ))}
            </div>
          </>
        )}

        {/* Experience - Timeline */}
        {experience.length > 0 && (
          <>
            <div className="cv-cre-section-title">Kinh Nghiệm</div>
            <div className="cv-cre-timeline">
              {experience.map((exp, i) => (
                <div key={i} className="cv-cre-timeline-item">
                  <div className="cv-cre-exp-role">{exp.title}</div>
                  <div className="cv-cre-exp-company">{exp.company}</div>
                  <div className="cv-cre-exp-date">
                    {exp.startDate} — {exp.isCurrent ? "Hiện tại" : exp.endDate}
                  </div>
                  {exp.description && (
                    <div
                      style={{
                        fontSize: "0.88rem",
                        marginTop: "0.5rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {exp.description}
                    </div>
                  )}
                  {exp.achievements?.map((ach, j) => (
                    <div
                      key={j}
                      style={{
                        fontSize: "0.85rem",
                        paddingLeft: "0.75rem",
                        position: "relative",
                        marginTop: "0.2rem",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#ec4899",
                        }}
                      >
                        ▸
                      </span>
                      {ach}
                    </div>
                  ))}
                  {exp.technologies && exp.technologies.length > 0 && (
                    <div
                      className="cv-cre-tags"
                      style={{ marginTop: "0.5rem" }}
                    >
                      {exp.technologies.map((t, k) => (
                        <span
                          key={k}
                          style={{
                            fontSize: "0.72rem",
                            padding: "0.15rem 0.5rem",
                            background: "rgba(139,92,246,0.1)",
                            borderRadius: "10px",
                            color: "#7c3aed",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Education - Timeline */}
        {education.length > 0 && (
          <>
            <div className="cv-cre-section-title">Học Vấn</div>
            <div className="cv-cre-timeline">
              {education.map((edu, i) => (
                <div key={i} className="cv-cre-timeline-item">
                  <div className="cv-cre-exp-role">{edu.degree}</div>
                  <div className="cv-cre-exp-company">{edu.institution}</div>
                  <div className="cv-cre-exp-date">
                    {edu.startDate} — {edu.endDate || "Hiện tại"}
                    {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Projects - Grid Cards */}
        {projects.length > 0 && (
          <>
            <div className="cv-cre-section-title">Dự Án</div>
            <div className="cv-cre-project-grid">
              {projects.map((proj, i) => (
                <div key={i} className="cv-cre-project-card">
                  <div className="cv-cre-project-title">
                    {proj.title}
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginLeft: "0.4rem", color: "#ec4899" }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className="cv-cre-project-desc">{proj.description}</div>
                  {proj.technologies.length > 0 && (
                    <div
                      className="cv-cre-tags"
                      style={{ marginTop: "0.4rem" }}
                    >
                      {proj.technologies.map((t, k) => (
                        <span
                          key={k}
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.1rem 0.4rem",
                            background: "rgba(236,72,153,0.1)",
                            borderRadius: "8px",
                            color: "#be185d",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <>
            <div className="cv-cre-section-title">Chứng Chỉ</div>
            {certificates.map((cert, i) => (
              <div key={i} className="cv-cre-cert-item">
                <div className="cv-cre-cert-icon">🏆</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {cert.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#7c3aed" }}>
                    {cert.issuingOrganization}
                  </div>
                  {cert.issueDate && (
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      {cert.issueDate}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <>
            <div className="cv-cre-section-title">Ngôn Ngữ</div>
            <div className="cv-cre-skill-tags">
              {languages.map((lang, i) => (
                <span
                  key={i}
                  className="cv-cre-skill-tag"
                  style={{ background: "#3b82f6" }}
                >
                  {lang.name} — {lang.proficiency}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Endorsements */}
        {endorsements.length > 0 && (
          <>
            <div className="cv-cre-section-title">Lời Giới Thiệu</div>
            {endorsements.map((end, i) => (
              <div key={i} className="cv-cre-endorsement">
                "{end.quote}"
                <div
                  style={{
                    fontStyle: "normal",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    color: "#7c3aed",
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
    </div>
  );
};
