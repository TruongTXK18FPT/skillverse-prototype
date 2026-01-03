# SkillVerse Premium Chat Features 🚀

## 📋 Tổng Quan

Hệ thống chat nâng cao cho SkillVerse với đầy đủ tính năng hiện đại:
- 💬 Tin nhắn văn bản realtime
- 😀 Emoji picker với custom SkillVerse emojis
- 🎬 GIF picker (powered by GIPHY)
- 📷 Upload & share images
- 👥 Quản lý thành viên nhóm
- ⚡ WebSocket realtime messaging

## 📦 Components Đã Tạo

### 1. GroupChatWindow
Component chính tích hợp tất cả các tính năng chat.

```tsx
import { GroupChatWindow } from './components/chat';

<GroupChatWindow
  groupId="123"
  currentUserId="456"
  currentUserName="Nguyễn Văn A"
  currentUserAvatar="/avatar.jpg"
  onBack={() => navigate('/groups')}
  onGroupInfoUpdate={(info) => console.log(info)}
/>
```

**Props:**
- `groupId`: ID của nhóm chat (string)
- `currentUserId`: ID người dùng hiện tại (string)
- `currentUserName`: Tên người dùng
- `currentUserAvatar?`: URL avatar
- `onBack?`: Callback khi nhấn nút quay lại
- `onGroupInfoUpdate?`: Callback khi thông tin nhóm thay đổi

### 2. MessageBubble
Hiển thị tin nhắn với nhiều loại khác nhau.

```tsx
import { MessageBubble } from './components/chat';

<MessageBubble
  message={{
    id: "1",
    content: "Hello world",
    messageType: "TEXT",
    senderId: "123",
    senderName: "User",
    timestamp: new Date().toISOString()
  }}
  isOwnMessage={true}
  currentUserId="123"
  onReply={(msg) => console.log('Reply to:', msg)}
  onReact={(id, emoji) => console.log('React:', id, emoji)}
  onDelete={(id) => console.log('Delete:', id)}
/>
```

**Message Types:**
- `TEXT`: Tin nhắn văn bản thông thường
- `EMOJI`: Emoji lớn (custom SkillVerse emojis)
- `GIF`: GIF animations
- `IMAGE`: Hình ảnh upload

### 3. EmojiPicker
Chọn emoji với categories và custom SkillVerse emojis.

```tsx
import { EmojiPicker } from './components/chat';

<EmojiPicker
  isOpen={showPicker}
  onEmojiSelect={(emoji, isCustom, customUrl) => {
    console.log('Selected:', emoji);
  }}
  onClose={() => setShowPicker(false)}
  position="top"
/>
```

**Custom SkillVerse Emojis:**
- `:meowl:` - Meowl mascot
- `:skillverse:` - SkillVerse logo
- `:star_gold:` - Sao vàng
- `:trophy:` - Cúp thành tích
- `:level_up:` - Level up
- `:fire:` - Hot/Fire
- `:crown:` - Vương miện
- `:gem:` - Kim cương

### 4. GifPicker
Tìm kiếm và chọn GIF từ GIPHY.

```tsx
import { GifPicker } from './components/chat';

<GifPicker
  isOpen={showGifPicker}
  onGifSelect={(gifUrl, previewUrl) => {
    sendMessage({ type: 'GIF', gifUrl });
  }}
  onClose={() => setShowGifPicker(false)}
/>
```

**Features:**
- Trending GIFs
- Tìm kiếm realtime
- Quick search tags
- Infinite scroll

### 5. ImageUpload
Upload hình ảnh với preview và validation.

```tsx
import { ImageUpload } from './components/chat';

<ImageUpload
  isOpen={showUpload}
  onImageSelect={(imageUrl, file) => {
    sendMessage({ type: 'IMAGE', imageUrl });
  }}
  onClose={() => setShowUpload(false)}
  maxSizeMB={5}
/>
```

**Features:**
- Drag & drop
- Paste from clipboard
- File validation
- Preview before send
- Size limit configurable

### 6. MemberListModal
Quản lý thành viên trong nhóm.

```tsx
import { MemberListModal } from './components/chat';

<MemberListModal
  isOpen={showMembers}
  onClose={() => setShowMembers(false)}
  groupId={123}
  groupName="Web Development Group"
  mentorId={456}
  onMemberKicked={() => loadGroupData()}
/>
```

**Features:**
- Danh sách thành viên với avatar
- Tìm kiếm thành viên
- Thống kê (Total, Mentors, Students)
- **Mentor có thể kick members** (với confirmation)
- Role badges
- Online status

## 🔧 Backend Setup

### GroupChatMessage Entity
```java
@Column(name = "message_type", length = 20)
private String messageType = "TEXT"; // TEXT, EMOJI, GIF, IMAGE

@Column(name = "gif_url")
private String gifUrl;

@Column(name = "image_url")
private String imageUrl;

@Column(name = "emoji_code", length = 100)
private String emojiCode;

@Column(name = "sender_avatar_url")
private String senderAvatarUrl;
```

### API Endpoints

#### Get Group Detail
```
GET /api/group-chats/{groupId}/detail?userId={userId}
Response: GroupChatResponse (with members list)
```

#### Get Messages
```
GET /api/group-chats/{groupId}/messages?userId={userId}
Response: List<GroupChatMessage>
```

#### Send Message
```
POST /api/group-chats/{groupId}/messages
Body: {
  "senderId": 123,
  "content": "Hello",
  "messageType": "TEXT",
  "gifUrl": null,
  "imageUrl": null,
  "emojiCode": null
}
```

#### Get Members
```
GET /api/group-chats/{groupId}/members?userId={userId}
Response: List<GroupMemberDTO>
```

#### Kick Member
```
POST /api/group-chats/{groupId}/kick?mentorId={mentorId}&targetUserId={targetUserId}
```

## 🌐 WebSocket Setup

```typescript
// Backend WebSocket endpoint
ws://localhost:8080/ws

// Subscribe to group messages
client.subscribe(`/topic/group/${groupId}`, (message) => {
  const newMessage = JSON.parse(message.body);
  // Handle new message
});
```

## 🎨 Styling

Tất cả components đều có file CSS riêng với:
- Dark mode design
- Gradient backgrounds
- Smooth animations
- Responsive layout
- Premium UI/UX

## 📱 Responsive Design

Components tự động adapt cho:
- Desktop (> 768px)
- Tablet (768px - 520px)
- Mobile (< 520px)

## 🔐 Permissions

### Mentor Permissions:
- ✅ Kick members
- ✅ View all member details
- ✅ Send all message types
- ✅ Full chat management

### Student Permissions:
- ✅ Send all message types
- ✅ View member list
- ✅ React to messages
- ❌ Cannot kick members

## 🚀 Usage Example

```tsx
import React from 'react';
import { GroupChatWindow } from './components/chat';
import { useAuth } from './context/AuthContext';

const GroupChatPage = () => {
  const { user } = useAuth();
  const groupId = useParams().groupId;

  return (
    <div className="chat-page">
      <GroupChatWindow
        groupId={groupId}
        currentUserId={user.id.toString()}
        currentUserName={user.name}
        currentUserAvatar={user.avatarUrl}
        onBack={() => navigate('/groups')}
        onGroupInfoUpdate={(info) => {
          console.log('Group updated:', info);
        }}
      />
    </div>
  );
};

export default GroupChatPage;
```

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Build
npm run build

# Dev server
npm run dev
```

## 📝 Environment Variables

```env
# GIPHY API (already configured)
GIPHY_API_KEY=GlVGYHkr3WSBnllca54iNt0yFbjz7L65

# Backend API
VITE_API_URL=http://localhost:8080

# WebSocket
VITE_WS_URL=ws://localhost:8080/ws
```

## 🐛 Known Issues & Solutions

### Issue: NodeJS namespace not found
**Solution:** Changed `NodeJS.Timeout` to `number` for browser compatibility.

### Issue: GroupId/MentorId type mismatch
**Solution:** Convert between string (frontend) and number (backend) using `parseInt()`.

### Issue: Props naming mismatch
**Solution:** Standardized prop names across components.

## 📚 Dependencies

```json
{
  "@stomp/stompjs": "^7.0.0",
  "sockjs-client": "^1.6.1",
  "lucide-react": "latest",
  "react": "^18.x"
}
```

## 🎯 Future Enhancements

- [ ] Voice messages
- [ ] Video messages
- [ ] Message editing
- [ ] Message threading
- [ ] Read receipts
- [ ] Typing indicators
- [ ] File attachments (PDF, DOC, etc.)
- [ ] Message search
- [ ] Message pinning
- [ ] User mentions (@username)
- [ ] Message reactions with multiple emojis
- [ ] Dark/Light theme toggle

## 🤝 Contributing

Khi thêm tính năng mới:
1. Cập nhật interfaces trong `services/groupChatService.ts`
2. Thêm backend endpoints tương ứng
3. Cập nhật components và CSS
4. Test TypeScript compilation
5. Update README

## 📞 Support

Nếu có vấn đề, liên hệ team SkillVerse hoặc tạo issue trong repo.

---

**Created by:** SkillVerse Development Team  
**Version:** 1.0.0  
**Last Updated:** January 3, 2026
