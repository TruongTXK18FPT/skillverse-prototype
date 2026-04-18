import React, { useState } from "react";
import { GraduationCap, UserCheck } from "lucide-react";
import AccountVerificationTabCosmic from "./AccountVerificationTabCosmic";
import StudentVerificationAdminTab from "./StudentVerificationAdminTab";
import "./AdminVerificationTabs.css";

type VerificationTabKey = "account" | "student";

const TAB_OPTIONS: Array<{
  key: VerificationTabKey;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    key: "account",
    label: "Duyệt Mentor & Doanh nghiệp",
    icon: <UserCheck size={16} />,
  },
  {
    key: "student",
    label: "Duyệt Student Verification",
    icon: <GraduationCap size={16} />,
  },
];

const AdminVerificationTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VerificationTabKey>("account");

  return (
    <section className="avt-shell">
      <nav className="avt-nav" aria-label="Admin verification tabs">
        {TAB_OPTIONS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              className={`avt-tab ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="avt-panel">
        {activeTab === "account" ? (
          <AccountVerificationTabCosmic />
        ) : (
          <StudentVerificationAdminTab />
        )}
      </div>
    </section>
  );
};

export default AdminVerificationTabs;
