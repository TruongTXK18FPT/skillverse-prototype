import React from "react";
import { FiUpload, FiPlay } from "react-icons/fi";
import { LessonDraft } from "../courseBuilderTypes";
import redYoutubeLogo from "../../../../assets/meeting/Red-YouTube-logo.png";

interface LessonEditorVideoProps {
  lesson: LessonDraft;
  moduleId: string;
  onUpdateLessonField: (moduleId: string, lessonId: string, update: Partial<LessonDraft>) => void;
  onVideoUpload: (file: File) => void;
  videoInputRef: React.RefObject<HTMLInputElement>;
}

const LessonEditorVideo: React.FC<LessonEditorVideoProps> = ({
  lesson,
  moduleId,
  onUpdateLessonField,
  onVideoUpload,
  videoInputRef,
}) => {
  const handleTabSwitch = () => {
    if (lesson.videoMediaId === undefined) {
      onUpdateLessonField(moduleId, lesson.id, {
        videoMediaId: 0,
        youtubeUrl: undefined, // Clear YouTube URL when switching to upload
      });
    }
  };

  const isYoutubeMode = !lesson.videoMediaId && lesson.videoMediaId !== 0;

  return (
    <div className="cb-form-group">
      <label className="cb-label">Nguồn Video</label>
      <div className="cb-tabs cb-video-source-tabs">
        <button
          className={`cb-tab cb-video-source-tab ${isYoutubeMode ? "cb-tab--active" : ""}`}
          onClick={() =>
            onUpdateLessonField(moduleId, lesson.id, {
              videoMediaId: undefined,
              youtubeUrl: lesson.youtubeUrl || "", // Preserve or init empty
            })
          }
        >
          <img
            src={redYoutubeLogo}
            alt="YouTube"
            className="cb-video-source-tab__logo"
          />
          <span>YouTube URL</span>
        </button>
        <button
          className={`cb-tab cb-video-source-tab ${!isYoutubeMode ? "cb-tab--active" : ""}`}
          onClick={handleTabSwitch}
        >
          <FiUpload />
          <span>Upload Video</span>
        </button>
      </div>

      {isYoutubeMode ? (
        <div className="cb-video-youtube-link">
          <div className="cb-video-youtube-link__header">
            <img
              src={redYoutubeLogo}
              alt="YouTube"
              className="cb-video-youtube-link__logo"
            />
            <span>Nhúng video từ YouTube</span>
          </div>
          <input
            className="cb-input cb-video-youtube-link__input"
            value={lesson.youtubeUrl || ""}
            onChange={(e) =>
              onUpdateLessonField(moduleId, lesson.id, {
                youtubeUrl: e.target.value,
              })
            }
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      ) : (
        <div className="cb-course-upload cb-video-upload-zone">
          {lesson.videoMediaId ? (
            <div className="cb-video-upload-zone__state">
              <FiPlay
                size={32}
                className="cb-video-upload-zone__icon"
              />
              <p className="cb-video-upload-zone__title">
                Video đã được tải lên
              </p>
              <p className="cb-video-upload-zone__meta">
                ID: {lesson.videoMediaId}
              </p>
              <button
                className="cb-button cb-button--secondary cb-button--sm"
                onClick={() => videoInputRef.current?.click()}
              >
                Thay đổi Video
              </button>
            </div>
          ) : (
            <div className="cb-video-upload-zone__state">
              <FiPlay
                size={32}
                className="cb-video-upload-zone__icon"
              />
              <p className="cb-video-upload-zone__title">
                Kéo thả video vào đây hoặc click để upload
              </p>
              <button
                className="cb-button cb-button--secondary cb-button--sm"
                onClick={() => videoInputRef.current?.click()}
              >
                Chọn Video
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonEditorVideo;
