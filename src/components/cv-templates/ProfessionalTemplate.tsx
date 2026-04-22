// Professional CV Template - Dark sidebar, clean corporate layout
// Inspired by modern executive CV designs
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

/** Map proficiency string to 1-5 dot rating */
const proficiencyToDots = (p: string): number => {
  switch (p?.toLowerCase()) {
    case "native":
      return 5;
    case "fluent":
      return 5;
    case "advanced":
      return 4;
    case "intermediate":
      return 3;
    case "basic":
      return 2;
    default:
      return 3;
  }
};

export const ProfessionalTemplate: React.FC<Props> = ({ data }) => {
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
    <div className="cv-tpl-professional">
      {/* ===== DARK SIDEBAR ===== */}
      <div className="cv-pro-sidebar">
        {/* Avatar */}
        <div className="cv-pro-avatar-wrapper">
          {pi.avatarUrl ? (
            <img
              src={pi.avatarUrl}
              alt={pi.fullName}
              className="cv-pro-avatar"
            />
          ) : (
            <div className="cv-pro-avatar-fallback">
              {pi.fullName?.[0] || "U"}
            </div>
          )}
        </div>

        {/* Name + Title in sidebar */}
        <h1 className="cv-pro-sidebar-name">{pi.fullName}</h1>
        {pi.professionalTitle && (
          <p className="cv-pro-sidebar-title">{pi.professionalTitle}</p>
        )}

        {/* Contact */}
        <div className="cv-pro-sidebar-section">
          <div className="cv-pro-sidebar-heading">Liên Hệ</div>
          {pi.phone && (
            <div className="cv-pro-contact-item">
              <Phone size={13} />
              <span>{pi.phone}</span>
            </div>
          )}
          {pi.email && (
            <div className="cv-pro-contact-item">
              <Mail size={13} />
              <span>{pi.email}</span>
            </div>
          )}
          {pi.location && (
            <div className="cv-pro-contact-item">
              <MapPin size={13} />
              <span>{pi.location}</span>
            </div>
          )}
          {pi.linkedinUrl && (
            <div className="cv-pro-contact-item">
              <Linkedin size={13} />
              <span>LinkedIn</span>
            </div>
          )}
          {pi.githubUrl && (
            <div className="cv-pro-contact-item">
              <Github size={13} />
              <span>GitHub</span>
            </div>
          )}
          {pi.portfolioUrl && (
            <div className="cv-pro-contact-item">
              <Globe size={13} />
              <span>Portfolio</span>
            </div>
          )}
        </div>

        {/* Education in sidebar */}
        {education.length > 0 && (
          <div className="cv-pro-sidebar-section">
            <div className="cv-pro-sidebar-heading">Học Vấn</div>
            {education.map((edu, i) => (
              <div key={i} className="cv-pro-sidebar-edu">
                <div className="cv-pro-sidebar-edu-degree">{edu.degree}</div>
                <div className="cv-pro-sidebar-edu-school">
                  {edu.institution}
                </div>
                <div className="cv-pro-sidebar-edu-date">
                  {edu.startDate} — {edu.endDate || "Hiện tại"}
                  {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills / Expertise with progress bars */}
        {skills.length > 0 && (
          <div className="cv-pro-sidebar-section">
            <div className="cv-pro-sidebar-heading">Chuyên Môn</div>
            {skills.map((cat, ci) => (
              <div key={ci} className="cv-pro-skill-group">
                {cat.category && (
                  <div className="cv-pro-skill-category">{cat.category}</div>
                )}
                {cat.skills.map((skill, si) => (
                  <div key={si} className="cv-pro-skill-bar">
                    <div className="cv-pro-skill-name">
                      {cleanCVString(skill.name)}
                    </div>
                    <div className="cv-pro-skill-bar-track">
                      <div
                        className="cv-pro-skill-bar-fill"
                        style={{
                          width: `${Math.min(skill.level * 20, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Languages with dot indicators */}
        {languages.length > 0 && (
          <div className="cv-pro-sidebar-section">
            <div className="cv-pro-sidebar-heading">Ngôn Ngữ</div>
            {languages.map((lang, i) => {
              const dots = proficiencyToDots(lang.proficiency);
              return (
                <div key={i} className="cv-pro-lang-item">
                  <span className="cv-pro-lang-name">
                    {cleanCVString(lang.name)}
                  </span>
                  <div className="cv-pro-lang-dots">
                    {[1, 2, 3, 4, 5].map((d) => (
                      <span
                        key={d}
                        className={`cv-pro-lang-dot ${d <= dots ? "cv-pro-lang-dot--filled" : ""}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Certificates in sidebar */}
        {certificates.length > 0 && (
          <div className="cv-pro-sidebar-section">
            <div className="cv-pro-sidebar-heading">Chứng Chỉ</div>
            {certificates.map((cert, i) => (
              <div key={i} className="cv-pro-sidebar-cert">
                <div className="cv-pro-sidebar-cert-title">{cert.title}</div>
                <div className="cv-pro-sidebar-cert-org">
                  {cert.issuingOrganization}
                  {cert.issueDate ? ` — ${cert.issueDate}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== MAIN CONTENT (white) ===== */}
      <div className="cv-pro-main">
        {/* About Me */}
        {summary && (
          <div className="cv-pro-main-section">
            <div className="cv-pro-main-heading">Giới Thiệu</div>
            <p className="cv-pro-summary">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="cv-pro-main-section">
            <div className="cv-pro-main-heading">Kinh Nghiệm</div>
            {experience.map((exp, i) => (
              <div key={i} className="cv-pro-exp-item">
                <div className="cv-pro-exp-header">
                  <div>
                    <div className="cv-pro-exp-role">{exp.title}</div>
                    <div className="cv-pro-exp-company">
                      {exp.company}
                      {exp.location ? ` — ${exp.location}` : ""}
                    </div>
                  </div>
                  <div className="cv-pro-exp-date">
                    {exp.startDate} — {exp.isCurrent ? "Hiện tại" : exp.endDate}
                  </div>
                </div>
                {exp.description && (
                  <div className="cv-pro-exp-desc">
                    <CVMarkdownRenderer content={exp.description} />
                  </div>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="cv-pro-achievements">
                    {exp.achievements.map((ach, j) => (
                      <li key={j}>{ach}</li>
                    ))}
                  </ul>
                )}
                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="cv-pro-tags">
                    {exp.technologies.map((t, k) => (
                      <span key={k} className="cv-pro-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="cv-pro-main-section">
            <div className="cv-pro-main-heading">Dự Án</div>
            {projects.map((proj, i) => (
              <div key={i} className="cv-pro-project-item">
                <div className="cv-pro-exp-header">
                  <div className="cv-pro-project-title">
                    {proj.title}
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cv-pro-project-link"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  {proj.role && (
                    <div className="cv-pro-exp-date">{proj.role}</div>
                  )}
                </div>
                <div className="cv-pro-exp-desc">
                  <CVMarkdownRenderer content={proj.description} />
                </div>
                {proj.technologies.length > 0 && (
                  <div className="cv-pro-tags">
                    {proj.technologies.map((t, k) => (
                      <span key={k} className="cv-pro-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {proj.outcomes && proj.outcomes.length > 0 && (
                  <ul className="cv-pro-achievements">
                    {proj.outcomes.map((o, j) => (
                      <li key={j}>{o}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Endorsements / References */}
        {endorsements.length > 0 && (
          <div className="cv-pro-main-section">
            <div className="cv-pro-main-heading">Lời Giới Thiệu</div>
            {endorsements.map((end, i) => (
              <div key={i} className="cv-pro-endorsement">
                <p className="cv-pro-endorsement-quote">"{end.quote}"</p>
                <div className="cv-pro-endorsement-author">
                  — {end.authorName}
                  {end.authorTitle ? `, ${end.authorTitle}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
