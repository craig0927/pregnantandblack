Navigation Structure
Two distinct role-based flows sharing some stacks:

Auth Stack → Welcome, CreateAccount, SignIn, UserRegistration, ResetPassword

User Tabs (5 tabs):

Tab Key Screens
Resources ResourceList → ResourceDetail
Schedule Appointments → HCAList → HCADetail → SessionRequested
Community ForumHome → ForumPostDetail → ForumCreatePost
Messages MessagesHome (Sessions/Activity tabs) → UserChat
Profile User profile/settings
HCA Tabs (5 tabs):

Tab Key Screens
Dashboard HCADashboard
Schedule HcaSchedule
Messages MessagesHome → UserChat
Community ForumStack (shared with users)
Profile HCA profile/settings
Global modals accessible from anywhere: Emergency, SessionRequested, SessionConfirmed

Navigation files: AppNavigator.tsx, AppDrawer.tsx, TabsNavigator.tsx, HcaTabsNavigator.tsx

Supabase Tables
Table Purpose
profiles Users & HCAs — role, username, avatar_url, contact_preferences, hca bio/languages
hca_availability HCA availability slots
appointments Session bookings — user_id, hca_id, date, start_time, meet_link, status
conversations Chat thread metadata — links user, hca, appointment
conversation_messages Individual messages — sender_id, body, created_at
forum_posts Community posts
forum_comments Post comments
forum_likes Post likes
forum_comment_likes Comment likes
notifications Activity & session state change notifications
hca_approvals Whitelist controlling who can register as HCA
Schema ref: reset-dev.sql, migrations in supabase/migrations/

Chat System
Architecture: Supabase real-time subscriptions on conversation_messages

Key files:

ChatThread.tsx — core component; optimistic inserts, auto-scroll, realtime channel
Messages.tsx — conversation list with "Sessions" + "Activity" tabs
messageReadStore.ts — AsyncStorage read-receipt tracking per conversation
useNotifications.ts — realtime notification subscription
Unread badge: TabsNavigator.tsx polls + subscribes to notifications, conversation_messages, and conversations tables, refreshing every 10s

Session scope: Chat is disabled after session ends. Video/phone call buttons in header are gated by computeSessionPermissions() in sessionPermissions.ts — requires mutual opt-in and session not yet over.

Scheduling System
Appointment flow: User browses HCA list → views HCADetail → requests session → appointment created with status: 'pending' → HCA confirms → status: 'confirmed' → Google Meet link generated via generate-meet Edge Function

Key files:

Appointments.tsx — user's confirmed sessions, filtered to exclude those >7 days expired
HcaSchedule.tsx — HCA's session view
Availability.tsx — HCA sets availability slots
sessionWindow.ts — isSessionOver(), isSessionExpiredAfterDays() utilities
Session states: pending → confirmed → (expired after N days)

Contact modes: chat (always on), video and phone only if both user and HCA opted in and session is active
