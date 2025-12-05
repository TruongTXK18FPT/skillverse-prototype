import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { UserProfileResponse } from '../../../data/userDTOs';
import { UserSubscriptionResponse } from '../../../data/premiumDTOs';
import silverFrame from '../../../assets/premium/silver_avatar.png';
import goldenFrame from '../../../assets/premium/golden_avatar.png';
import diamondFrame from '../../../assets/premium/diamond_avatar.png';
import './pilot-styles.css';

interface PilotHeaderProps {
    user: UserProfileResponse | null;
    subscription?: UserSubscriptionResponse | null;
    onEdit?: () => void;
    onAvatarUpload?: (file: File) => void;
}

const PilotHeader: React.FC<PilotHeaderProps> = ({ user, subscription, onEdit, onAvatarUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const getAvatarFrame = () => {
        if (!subscription || !subscription.isActive) return null;

        const planType = subscription.plan.planType;
        switch (planType) {
            case 'STUDENT_PACK':
                return silverFrame;
            case 'PREMIUM_BASIC':
                return goldenFrame;
            case 'PREMIUM_PLUS':
                return diamondFrame;
            default:
                return null;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onAvatarUpload) {
            onAvatarUpload(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="pilot-header">
            <div className="pilot-avatar-container">
                {/* Vòng xoay giữ nguyên hoặc bỏ nếu thấy rối mắt khi có khung */}
                {/* <div className="pilot-avatar-ring"></div> */}

                <img
                    src={user.avatarMediaUrl || '../../assets/meowl-skin/meowl_default.png'}
                    alt="Pilot Avatar"
                    className="pilot-avatar"
                />

                {/* Phần khung avatar đã sửa */}
                {getAvatarFrame() && (
                    <img
                        src={getAvatarFrame()!}
                        alt="Premium Frame"
                        /* Sử dụng class CSS mới thay vì inline styles */
                        className="pilot-avatar-frame-overlay"
                    />
                )}

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {/* Upload Avatar Button */}
                <button className="pilot-avatar-upload-btn" onClick={handleUploadClick} title="Change Avatar">
                    <Camera size={18} />
                </button>
            </div>

            <div className="pilot-info">
                <h1 className="pilot-name">{user.fullName || 'UNKNOWN PILOT'}</h1>
                <div className="pilot-rank">
                    <span>LEVEL 0 // CADET</span>
                </div>

                <div className="pilot-stats-bar">
                    <div className="pilot-stat">
                        <span className="pilot-stat-label">CREDITS</span>
                        <span className="pilot-stat-value">0</span>
                    </div>
                    <div className="pilot-stat">
                        <span className="pilot-stat-label">XP</span>
                        <span className="pilot-stat-value">0</span>
                    </div>
                    <div className="pilot-stat">
                        <span className="pilot-stat-label">STATUS</span>
                        <span className="pilot-stat-value" style={{ color: '#22c55e' }}>ACTIVE</span>
                    </div>
                </div>
            </div>

            {onEdit && (
                <button className="pilot-btn pilot-btn-secondary" onClick={onEdit}>
                    EDIT DOSSIER
                </button>
            )}
        </div>
    );
};

export default PilotHeader;
