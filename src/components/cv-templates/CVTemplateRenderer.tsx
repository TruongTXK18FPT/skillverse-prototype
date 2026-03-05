// CV Template Renderer - Renders structured CV data using selected template
import React from "react";
import { CVStructuredData, CVTemplateName } from "../../data/cvTemplateTypes";
import { ProfessionalTemplate } from "./ProfessionalTemplate";
import { ModernTemplate } from "./ModernTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { CreativeTemplate } from "./CreativeTemplate";
import "../../styles/cv-templates.css";

interface CVTemplateRendererProps {
  data: CVStructuredData;
  template: CVTemplateName;
}

/**
 * Renders structured CV data using the appropriate template component.
 * No AI-generated HTML, no dangerouslySetInnerHTML.
 */
const CVTemplateRenderer: React.FC<CVTemplateRendererProps> = ({
  data,
  template,
}) => {
  switch (template) {
    case "PROFESSIONAL":
      return <ProfessionalTemplate data={data} />;
    case "MODERN":
      return <ModernTemplate data={data} />;
    case "MINIMAL":
      return <MinimalTemplate data={data} />;
    case "CREATIVE":
      return <CreativeTemplate data={data} />;
    default:
      return <ProfessionalTemplate data={data} />;
  }
};

export default CVTemplateRenderer;
