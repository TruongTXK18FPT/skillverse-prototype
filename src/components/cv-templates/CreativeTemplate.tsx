// Creative CV Template - Bold colors, timeline layout, infographic style
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
  Award,
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
                    {cleanCVString(skill.name)}
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
                    <div className="cv-cre-exp-desc">
                      <CVMarkdownRenderer content={exp.description} />
                    </div>
                  )}
                  {exp.achievements?.map((ach, j) => (
                    <div key={j} className="cv-cre-achievement">
                      <span className="cv-cre-achievement-bullet">▸</span>
                      {ach}
                    </div>
                  ))}
                  {exp.technologies && exp.technologies.length > 0 && (
                    <div className="cv-cre-tags cv-cre-tags--spaced">
                      {exp.technologies.map((t, k) => (
                        <span key={k} className="cv-cre-inline-tag">
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
                        className="cv-cre-project-link"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className="cv-cre-project-desc">
                    <CVMarkdownRenderer content={proj.description} />
                  </div>
                  {proj.technologies.length > 0 && (
                    <div className="cv-cre-tags cv-cre-tags--spaced-sm">
                      {proj.technologies.map((t, k) => (
                        <span key={k} className="cv-cre-inline-tag cv-cre-inline-tag--alt">
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
                <div className="cv-cre-cert-icon">
                  <Award size={18} />
                </div>
                <div>
                  <div className="cv-cre-cert-title">{cert.title}</div>
                  <div className="cv-cre-cert-org">{cert.issuingOrganization}</div>
                  {cert.issueDate && (
                    <div className="cv-cre-cert-date">{cert.issueDate}</div>
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
                <span key={i} className="cv-cre-skill-tag cv-cre-lang-tag">
                  {cleanCVString(lang.name)} — {lang.proficiency}
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
                <div className="cv-cre-endorsement-author">
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
