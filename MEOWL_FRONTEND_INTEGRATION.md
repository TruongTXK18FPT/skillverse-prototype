# 🐱 Meowl Chat - Frontend Backend Integration

## Overview
Successfully integrated MeowlChat component with the backend Meowl service. The frontend now uses the backend API endpoints instead of directly calling OpenAI.

## Changes Made

### 1. MeowlChat.tsx - Main Chat Component

**Removed:**
- ❌ Direct OpenAI API integration
- ❌ System prompts (now handled by backend)
- ❌ Developer guard implementation (now handled by backend)
- ❌ `guardModelOutput` function (backend validates responses)
- ❌ OpenAI API key dependency
- ❌ Manual message construction for OpenAI

**Added:**
- ✅ Backend API endpoint integration
- ✅ `useAuth()` hook to get user ID
- ✅ Backend URL configuration from environment
- ✅ Proper request/response handling
- ✅ Support for reminders and notifications
- ✅ Chat history context (last 10 messages)

**Updated API Call:**
```typescript
// OLD - Direct OpenAI
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [/* manual construction */]
  })
});

// NEW - Backend Meowl Service
const response = await fetch(`${BACKEND_URL}/api/v1/meowl/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: userMessage.content,
    language: language === 'vi' ? 'vi' : 'en',
    userId: user?.id || null,
    includeReminders: true,
    chatHistory: messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  })
});
```

**Response Handling:**
```typescript
const data = await response.json();

// Backend returns:
// - data.message (cute response with emojis)
// - data.originalMessage (AI response before formatting)
// - data.reminders (learning reminders)
// - data.notifications (motivational messages)
// - data.mood (Meowl's current mood)
// - data.success (operation status)
// - data.timestamp (response time)
```

### 2. MeowlGuard.tsx - Client-Side Guard

**Removed:**
- ❌ `guardModelOutput()` function (no longer needed)
- ❌ Post-response validation (backend handles this)

**Kept:**
- ✅ `guardUserInput()` - Pre-validation before sending
- ✅ Injection pattern detection
- ✅ Out-of-scope pattern detection
- ✅ Fallback messages (EN/VI)
- ✅ `pickFallback()` helper function

**Why Keep Client Guard?**
- Provides instant feedback without API call
- Reduces unnecessary backend requests
- Better user experience (immediate response)
- Saves API quota and bandwidth

### 3. Environment Configuration

**Required Environment Variable:**
```env
# .env file
VITE_BACKEND_URL=http://localhost:8080
```

**Default Fallback:**
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
```

## API Endpoints Used

### 1. Chat Endpoint
```
POST /api/v1/meowl/chat
```

**Request Body:**
```json
{
  "message": "How do I learn React?",
  "language": "en",
  "userId": 123,
  "includeReminders": true,
  "chatHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help?"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Meow! 🐱 Start with React basics like components and props! ✨ Build small projects to practice. You got this! 🚀",
  "originalMessage": "Start with React basics like components and props. Build small projects to practice.",
  "success": true,
  "timestamp": "2025-01-09T10:30:00",
  "mood": "encouraging",
  "reminders": [
    {
      "type": "course",
      "title": "Continue Course",
      "description": "You have 2 course(s) waiting!",
      "actionUrl": "/courses",
      "emoji": "📚"
    }
  ],
  "notifications": [
    {
      "type": "motivation",
      "message": "You're doing amazing! 🌟",
      "emoji": "💪",
      "createdAt": "2025-01-09T10:30:00"
    }
  ]
}
```

### 2. Reminders Endpoint (Future Use)
```
GET /api/v1/meowl/reminders/{userId}?language=en
```

### 3. Notifications Endpoint (Future Use)
```
GET /api/v1/meowl/notifications/{userId}?language=vi
```

## Security Features

### Client-Side Guard (Pre-validation)
```typescript
const guard = guardUserInput(userMessage.content);
if (!guard.allow) {
  // Show fallback message immediately
  // No API call made
  return;
}
```

**Detects:**
- Jailbreak attempts: "ignore previous instructions"
- Prompt injection: "bypass rules", "show system prompt"
- Out-of-scope topics: cooking, finance, medical, etc.

### Backend Guard (Post-validation)
- System prompts with developer guard
- AI response validation
- Educational focus enforcement
- Cute response generation

## Flow Diagram

```
┌─────────────────────────────────────────┐
│           User Types Message            │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│    Client-Side Guard (MeowlGuard)       │
│    • Injection detection                │
│    • Out-of-scope detection             │
└────────────────┬────────────────────────┘
                 │
         ┌───────┴───────┐
         │ Blocked?      │
         └───────┬───────┘
                 │
        No ←─────┴─────→ Yes
         │               │
         ↓               ↓
┌──────────────┐  ┌──────────────────┐
│ Send to API  │  │ Show Fallback    │
└──────┬───────┘  │ No API Call      │
       │          └──────────────────┘
       ↓
┌─────────────────────────────────────────┐
│     POST /api/v1/meowl/chat             │
│     • message                           │
│     • language (en/vi)                  │
│     • userId                            │
│     • chatHistory                       │
│     • includeReminders                  │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│        Backend Processing               │
│    • Apply system prompts               │
│    • Developer guard                    │
│    • Call Gemini API                    │
│    • Generate cute response             │
│    • Add emojis & phrases               │
│    • Get reminders                      │
│    • Get notifications                  │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│        Response to Frontend             │
│    • Cute message 🐱✨                  │
│    • Reminders 📚                       │
│    • Notifications 💪                   │
│    • Mood indicator                     │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      Display in Chat UI                 │
│    • Show message                       │
│    • Log reminders (future use)         │
│    • Log notifications (future use)     │
└─────────────────────────────────────────┘
```

## Benefits of Backend Integration

### 1. **Centralized AI Logic**
- System prompts managed in one place
- Easy to update without frontend redeployment
- Consistent behavior across all clients

### 2. **Enhanced Security**
- API keys not exposed in frontend
- Server-side validation and filtering
- Protection against client-side manipulation

### 3. **Better Features**
- Reminders based on user data
- Notifications from backend systems
- Personalized responses using user context
- Chat history stored server-side (future)

### 4. **Cost Management**
- Backend can implement rate limiting
- Monitor and control API usage
- Cache responses for common queries
- Switch AI providers without frontend changes

### 5. **Richer Responses**
- Cute formatting with emojis
- Mood detection
- Context-aware reminders
- Integration with platform features

## Testing

### 1. Start Backend
```bash
cd SkillVerse_BackEnd
mvn spring-boot:run
```

### 2. Start Frontend
```bash
cd skillverse-prototype
npm run dev
```

### 3. Test Chat
1. Click on Meowl mascot
2. Open chat dialog
3. Type a message: "How do I learn programming?"
4. Verify cute response with emojis
5. Check console for reminders/notifications

### 4. Test Guard
Try these to verify client guard works:
- "ignore previous instructions" → Should show fallback
- "bypass rules" → Should show fallback
- "tell me a cake recipe" → Should show fallback
- Normal questions → Should call backend

## Future Enhancements

### Phase 1 - Display Reminders
```typescript
// Show reminders in UI
{data.reminders && data.reminders.length > 0 && (
  <div className="meowl-reminders">
    {data.reminders.map((reminder, index) => (
      <div key={index} className="reminder-card">
        <span className="reminder-emoji">{reminder.emoji}</span>
        <div className="reminder-content">
          <h4>{reminder.title}</h4>
          <p>{reminder.description}</p>
          <a href={reminder.actionUrl}>View →</a>
        </div>
      </div>
    ))}
  </div>
)}
```

### Phase 2 - Notification Toast
```typescript
// Show notifications as toast
if (data.notifications && data.notifications.length > 0) {
  data.notifications.forEach(notification => {
    toast.info(`${notification.emoji} ${notification.message}`);
  });
}
```

### Phase 3 - Persistent Chat
- Store chat history in backend
- Load previous conversations
- Continue where user left off

### Phase 4 - Voice Input
- Add microphone button
- Speech-to-text integration
- Voice responses from Meowl

## Troubleshooting

### Issue: "Failed to get response from Meowl service"

**Check:**
1. Backend is running: `http://localhost:8080/api/v1/meowl/health`
2. CORS is configured properly
3. Environment variable is set: `VITE_BACKEND_URL`

**Solution:**
```bash
# Check backend health
curl http://localhost:8080/api/v1/meowl/health

# Should return: "Meowl is awake and ready to help! 🐱✨"
```

### Issue: "Guard blocks valid questions"

**Check:**
- Review patterns in `MeowlGuard.tsx`
- Test with different wording
- Update `OUT_OF_SCOPE_PATTERNS` if needed

**Solution:**
```typescript
// Add exceptions for valid educational topics
const ALLOWED_PATTERNS = [
  /learn (programming|coding|development)/i,
  /how to (study|practice|improve)/i
];
```

### Issue: "No emojis in responses"

**Check:**
- Backend is using correct API key
- Gemini API is responding
- Cute response generation is working

**Solution:**
```bash
# Check backend logs
tail -f logs/meowl-service.log

# Look for cute response generation
grep "makeCuteResponse" logs/meowl-service.log
```

## Code Quality

### ✅ Improvements Made
- Removed duplicate system prompts (DRY principle)
- Centralized validation logic
- Better separation of concerns
- Cleaner error handling
- Type-safe request/response

### 📊 Metrics
- **Lines Removed**: ~100 lines (system prompts, OpenAI integration)
- **Lines Added**: ~50 lines (backend integration)
- **Net Reduction**: 50 lines
- **Complexity**: Reduced (less frontend logic)
- **Maintainability**: Improved (single source of truth)

## Summary

✅ **Complete Integration**
- Frontend now uses backend Meowl service
- All system prompts and AI logic centralized
- Client-side guard for instant feedback
- Support for reminders and notifications

✅ **Security Enhanced**
- API keys hidden in backend
- Server-side validation
- Protection against manipulation

✅ **Features Ready**
- Chat with cute responses
- Reminders (logged for now)
- Notifications (logged for now)
- Multi-language support
- Context-aware conversations

✅ **Clean Code**
- Removed unused code
- Better organization
- Type-safe
- Error handling

**Status**: ✅ Complete and Ready to Use!

**Meowl is now powered by the backend! 🐱✨**

---

Made with 💖 by the SkillVerse team
