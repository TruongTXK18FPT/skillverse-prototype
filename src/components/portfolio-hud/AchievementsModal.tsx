// ACHIEVEMENTS MODAL - Neon Tech Cyan/Blue Design
import React, { useEffect, useState } from "react";
import { X, Plus, Trash2, Award, Sparkles } from "lucide-react";
import { useScrollLock } from "./useScrollLock";
import "./dossier-portfolio-styles.css";

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: string[];
  onSave: (achievements: string[]) => Promise<void>;
}

const PRESET_ACHIEVEMENTS = [
  "Top Rated Mentor",
  "Best Mentor 2024",
  "100+ Sessions Completed",
  "5-Star Mentor",
  "Expert in Leadership",
  "Community Leader",
  "Verified Professional",
  "Certified Expert",
];

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
  onSave,
}) => {
  useScrollLock(isOpen);

  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItems([...achievements]);
      setNewItem("");
    }
  }, [isOpen, achievements]);

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems((prev) => [...prev, trimmed]);
      setNewItem("");
    }
  };

  const handleRemove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPreset = (preset: string) => {
    if (!items.includes(preset)) {
      setItems((prev) => [...prev, preset]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(items);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="dossier-modal-overlay dossier-modal-overlay--achievements"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dossier-achievements-modal">
        {/* Header */}
        <div className="dossier-modal-header">
          <div className="dossier-modal-header-left">
            <div className="dossier-modal-icon">
              <Award size={20} />
            </div>
            <div>
              <h2 className="dossier-modal-title">Quản Lý Thành Tựu</h2>
              <p className="dossier-modal-subtitle">
                Thành tựu và giải thưởng của bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            className="dossier-modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Divider */}
        <div className="dossier-modal-divider" />

        {/* Body */}
        <div className="dossier-modal-body">
          {/* Add new achievement */}
          <div className="dossier-achievements-input-section">
            <label className="dossier-input-label">Thêm Thành Tựu Mới</label>
            <div className="dossier-achievements-input-row">
              <input
                type="text"
                className="dossier-input"
                placeholder="Nhập thành tựu mới..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                maxLength={100}
              />
              <button
                type="button"
                className="dossier-btn-neon"
                onClick={handleAdd}
                disabled={!newItem.trim() || items.includes(newItem.trim())}
              >
                <Plus size={18} />
                Thêm
              </button>
            </div>
          </div>

          {/* Preset suggestions */}
          <div className="dossier-achievements-presets">
            <label className="dossier-input-label">
              <Sparkles size={14} />
              Gợi Ý Nhanh
            </label>
            <div className="dossier-achievements-preset-chips">
              {PRESET_ACHIEVEMENTS.filter((p) => !items.includes(p)).map(
                (preset) => (
                  <button
                    type="button"
                    key={preset}
                    className="dossier-preset-chip"
                    onClick={() => handleAddPreset(preset)}
                  >
                    <Plus size={12} />
                    {preset}
                  </button>
                ),
              )}
              {PRESET_ACHIEVEMENTS.every((p) => items.includes(p)) && (
                <span className="dossier-preset-empty">
                  Tất cả gợi ý đã được thêm
                </span>
              )}
            </div>
          </div>

          {/* Current achievements list */}
          <div className="dossier-achievements-list-section">
            <label className="dossier-input-label">
              Thành Tựu Hiện Có
              <span className="dossier-count-badge">{items.length}</span>
            </label>

            {items.length > 0 ? (
              <div className="dossier-achievements-list">
                {items.map((item, index) => (
                  <div key={index} className="dossier-achievement-item">
                    <div className="dossier-achievement-item-icon">
                      <Award size={16} />
                    </div>
                    <span className="dossier-achievement-item-text">
                      {item}
                    </span>
                    <button
                      type="button"
                      className="dossier-achievement-item-delete"
                      onClick={() => handleRemove(index)}
                      title="Xóa thành tựu"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dossier-achievements-empty">
                <Award size={32} />
                <p>
                  Chưa có thành tựu nào. Thêm thành tựu để tăng uy tín của bạn.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="dossier-modal-footer">
          <button
            type="button"
            className="dossier-btn-secondary"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="dossier-btn-neon"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="dossier-spinner" />
                Đang lưu...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Lưu Thay Đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
