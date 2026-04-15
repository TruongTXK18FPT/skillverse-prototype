import React from "react";
import { FiTrash2 } from "react-icons/fi";
import { ModuleDraft } from "../courseBuilderTypes";

interface ModuleEditorFormProps {
  module: ModuleDraft;
  isRevisionMode: boolean;
  isNewModule: boolean;
  changedFields: string[];
  onModuleUpdate: (moduleId: string, update: Partial<ModuleDraft>) => void;
  onModuleDelete: (moduleId: string) => void;
  onBackToCourseInfo: () => void;
}

const ModuleEditorForm: React.FC<ModuleEditorFormProps> = ({
  module,
  isRevisionMode,
  isNewModule,
  changedFields,
  onModuleUpdate,
  onModuleDelete,
  onBackToCourseInfo,
}) => {
  return (
    <div className="cb-main-content">
      <div className="cb-panel">
        <div className="cb-panel__header">
          <div className="cb-panel__title">
            Chỉnh sửa Module
            {isRevisionMode &&
              (isNewModule || changedFields.length > 0) && (
                <span
                  className="cb-sidebar__lesson-badge"
                  style={{
                    marginLeft: 10,
                    backgroundColor: "rgba(245, 158, 11, 0.18)",
                    color: "#f59e0b",
                    borderColor: "rgba(245, 158, 11, 0.35)",
                  }}
                  title={
                    changedFields.length > 0
                      ? `Đã thay đổi: ${changedFields.join(", ")}`
                      : "Module mới tạo"
                  }
                >
                  {isNewModule ? "Mới" : "Đã đổi"}
                </span>
              )}
          </div>
          <button
            className="cb-button cb-button--danger cb-button--sm"
            onClick={() => onModuleDelete(module.id)}
          >
            <FiTrash2 /> Xóa
          </button>
        </div>
        <div className="cb-panel__body">
          <div className="cb-form-group">
            <label className="cb-label">Tên Module</label>
            <input
              className="cb-input"
              value={module.title}
              onChange={(e) =>
                onModuleUpdate(module.id, { title: e.target.value })
              }
            />
          </div>
          <div className="cb-form-group">
            <label className="cb-label">Mô tả</label>
            <textarea
              className="cb-input cb-textarea"
              value={module.description || ""}
              onChange={(e) =>
                onModuleUpdate(module.id, { description: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleEditorForm;
