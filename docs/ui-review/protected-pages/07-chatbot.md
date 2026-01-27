# Trang Career Chatbot (Protected)

**URL:** https://skillverse.vn/chatbot  
**File:** `src/pages/navbar/CareerChatPage.tsx` (649 lines)

---

## ✅ Điểm tốt

1. **Space theme** - "Phi Hành Gia Career Chat"
2. **Voice input** với recognition API
3. **Text-to-Speech** output (toggle)
4. **Session management** - Lưu/Load sessions
5. **Markdown rendering** cho responses
6. **Typing animation** khi AI đang trả lời
7. **Quick prompts** - Gợi ý câu hỏi phổ biến

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Mức độ | Vị trí UI | File Code | Đề xuất |
|---|--------|--------|-----------|-----------|---------|
| 31.1 | **API sessions trả về 500** | 🔴 Critical | Session list | API Backend | Fix backend |
| 31.2 | **ENABLE_TTS = false** hardcoded | 🟡 Medium | Voice toggle | `CareerChatPage.tsx:22` | Config/Feature flag |
| 31.3 | **Welcome message 2024-2025** | 🟢 Minor | First message | `CareerChatPage.tsx:67` | Dynamic year |
| 31.4 | **No rate limiting UI** | 🟡 Medium | Send button | Component | Thêm cooldown |
| 31.5 | **Session delete** không confirm | 🟡 Medium | Delete session | `CareerChatPage.tsx` | Thêm confirm modal |
| 31.6 | **Voice recognition browser support** | 🟢 Minor | Mic button | `CareerChatPage.tsx:198-227` | Show unsupported msg |
| 31.7 | **Quick prompts hardcoded** | 🟢 Minor | Sidebar | `CareerChatPage.tsx:100-112` | Fetch từ API |

---

## 💡 Code Fix

### Fix 31.3: Dynamic Year

```tsx
// src/pages/navbar/CareerChatPage.tsx:67
// Thay:
// "Tư vấn bởi AI của SkillVerse 2024-2025"
// Thành:
`Tư vấn bởi AI của SkillVerse ${new Date().getFullYear()}`
```

### Fix 31.2: Enable TTS as Feature Flag

```tsx
// src/config/features.ts (new file)
export const FEATURE_FLAGS = {
  ENABLE_TTS: import.meta.env.VITE_ENABLE_TTS === 'true',
  ENABLE_VOICE_INPUT: import.meta.env.VITE_ENABLE_VOICE === 'true',
};

// CareerChatPage.tsx
import { FEATURE_FLAGS } from '@/config/features';
const ENABLE_TTS = FEATURE_FLAGS.ENABLE_TTS;
```

### Fix 31.6: Browser Support Check

```tsx
const isVoiceSupported = 'webkitSpeechRecognition' in window 
  || 'SpeechRecognition' in window;

// Trong render:
{!isVoiceSupported && (
  <Tooltip content="Trình duyệt không hỗ trợ nhập giọng nói">
    <Mic className="text-gray-400 cursor-not-allowed" />
  </Tooltip>
)}
```

---

## API Endpoints

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/career-chat/send` | POST | ✅ Working |
| `/api/career-chat/sessions` | GET | ❌ 500 Error |
| `/api/career-chat/sessions/:id` | DELETE | Untested |

---

## 📝 Ghi chú

1. Component có 649 dòng - Nên tách thành:
   - `ChatMessageList.tsx`
   - `ChatInput.tsx`
   - `ChatSidebar.tsx`
   - `VoiceRecorder.tsx`
2. Streaming response dùng EventSource
3. Voice recognition chỉ hoạt động trên Chrome/Edge
