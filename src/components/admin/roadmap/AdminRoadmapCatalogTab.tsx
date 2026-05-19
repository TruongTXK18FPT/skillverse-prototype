import React, { useEffect, useMemo, useState } from "react";
import {
  ListChecks,
  LucideIcon,
  Map,
  Route,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import SkillRegistryTab from "./SkillRegistryTab";
import SkillSuggestionReviewTab from "./SkillSuggestionReviewTab";
import CareerTaxonomyTab from "./CareerTaxonomyTab";
import JobPositionTrackSkillTab from "./JobPositionTrackSkillTab";
import "./AdminRoadmapCatalogTab.css";

export type RoadmapCatalogTabKey =
  | "skill-registry"
  | "skill-suggestions"
  | "career-taxonomy"
  | "track-skills";

interface AdminRoadmapCatalogTabProps {
  initialSubTab?: string | null;
}

const ROADMAP_CATALOG_TABS: Array<{
  key: RoadmapCatalogTabKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "skill-registry",
    label: "Kho kỹ năng",
    description: "Danh sách kỹ năng chuẩn",
    icon: ShieldCheck,
  },
  {
    key: "skill-suggestions",
    label: "Kiểm duyệt kỹ năng",
    description: "Xác thực mentor & đề xuất skill",
    icon: UserCheck,
  },
  {
    key: "career-taxonomy",
    label: "Phân loại nghề nghiệp",
    description: "Domain và vị trí công việc",
    icon: Route,
  },
  {
    key: "track-skills",
    label: "Mapping track",
    description: "Track và kỹ năng liên quan",
    icon: ListChecks,
  },
];

const isRoadmapCatalogTab = (
  value?: string | null,
): value is RoadmapCatalogTabKey =>
  ROADMAP_CATALOG_TABS.some((tab) => tab.key === value);

const AdminRoadmapCatalogTab: React.FC<AdminRoadmapCatalogTabProps> = ({
  initialSubTab,
}) => {
  const resolvedInitialTab = isRoadmapCatalogTab(initialSubTab)
    ? initialSubTab
    : "skill-registry";
  const [activeSubTab, setActiveSubTab] =
    useState<RoadmapCatalogTabKey>(resolvedInitialTab);

  useEffect(() => {
    if (isRoadmapCatalogTab(initialSubTab)) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const activeTabMeta = useMemo(
    () =>
      ROADMAP_CATALOG_TABS.find((tab) => tab.key === activeSubTab) ??
      ROADMAP_CATALOG_TABS[0],
    [activeSubTab],
  );

  return (
    <section className="admin-roadmap-catalog">
      <header className="admin-roadmap-catalog__hero">
        <div className="admin-roadmap-catalog__hero-main">
          <span className="admin-roadmap-catalog__eyebrow">
            <Map size={15} />
            Nghề nghiệp & kỹ năng
          </span>
          <h2>Quản trị dữ liệu nền cho nghề nghiệp và kỹ năng trên nền tảng</h2>
          <p>
            Kho kỹ năng, kiểm duyệt năng lực mentor, đề xuất skill mới,
            phân loại nghề nghiệp và mapping track.
          </p>
        </div>
      </header>

      <nav
        className="admin-roadmap-catalog__tabbar"
        aria-label="Nghề nghiệp & kỹ năng"
      >
        {ROADMAP_CATALOG_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === activeSubTab;

          return (
            <button
              key={tab.key}
              type="button"
              className={`admin-roadmap-catalog__tab ${
                isActive ? "admin-roadmap-catalog__tab--active" : ""
              }`}
              aria-selected={isActive}
              onClick={() => setActiveSubTab(tab.key)}
            >
              <Icon size={18} className="admin-roadmap-catalog__tab-icon" />
              <span className="admin-roadmap-catalog__tab-copy">
                <strong>{tab.label}</strong>
                <small>{tab.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <div
        className="admin-roadmap-catalog__panel"
        aria-label={activeTabMeta.label}
      >
        {activeSubTab === "skill-registry" && <SkillRegistryTab />}
        {activeSubTab === "skill-suggestions" && <SkillSuggestionReviewTab />}
        {activeSubTab === "career-taxonomy" && <CareerTaxonomyTab />}
        {activeSubTab === "track-skills" && <JobPositionTrackSkillTab />}
      </div>
    </section>
  );
};

export default AdminRoadmapCatalogTab;
