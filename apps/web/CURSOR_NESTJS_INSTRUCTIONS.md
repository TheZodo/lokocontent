# Lokocontent NestJS Backend Requirements

This document contains all functional requirements for the NestJS server that will service the Lokocontent pan-African video streaming marketplace frontend.

## Overview

Lokocontent is a Netflix/YouTube hybrid video streaming platform focused on African content. The frontend is built with Next.js 16 and uses Clerk for authentication (to be implemented).

---

## Authentication & Authorization

### Provider

- **Clerk** - Authentication is handled by Clerk on the frontend
- Backend must validate Clerk JWT tokens
- Use Clerk's webhook for user sync

### User Roles

```typescript
enum UserRole {
  VIEWER = 'viewer', // Can browse and purchase content
  CREATOR = 'creator', // Can upload and monetize content
  ADMIN = 'admin', // Platform administration
}
```

---

## Database Schema

### Users Table

```typescript
interface User {
  id: string // Clerk user ID
  email: string
  displayName: string
  profilePicture: string | null
  bio: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date

  // Settings
  emailNotifications: boolean
  newFollowerNotifications: boolean
  contentUpdateNotifications: boolean
  earningsNotifications: boolean
  watchHistoryEnabled: boolean

  // Payment info
  payoutMethod: 'bank' | 'mobile_money' | 'paypal' | null
  payoutDetails: JSON | null // Encrypted payment details
}
```

### VideoContent Table

```typescript
interface VideoContent {
  id: string // UUID
  creatorId: string // FK to Users
  title: string
  synopsis: string
  thumbnail: string // URL to stored image
  duration: string // e.g., "1h 45m"
  rating: number // Average rating 0-5
  ratingCount: number // Number of ratings
  isPremium: boolean
  price: number | null // Price in USD if premium
  region: string // Region ID
  category: string // Category ID
  releaseYear: number
  views: number

  // MUX Video Data
  muxAssetId: string
  muxPlaybackId: string

  // Optional Trailer
  trailerMuxAssetId: string | null
  trailerMuxPlaybackId: string | null

  // Status
  status: 'draft' | 'processing' | 'published' | 'hidden'

  createdAt: Date
  updatedAt: Date
}
```

### Purchases Table

```typescript
interface Purchase {
  id: string
  userId: string // FK to Users
  contentId: string // FK to VideoContent
  amount: number // Amount paid
  platformFee: number // Platform's cut (15%)
  creatorEarnings: number // Creator's share (85%)
  paymentProvider: string // 'stripe', 'paystack', 'flutterwave'
  paymentId: string // External payment reference
  status: 'pending' | 'completed' | 'refunded'
  createdAt: Date
}
```

### WatchHistory Table

```typescript
interface WatchHistory {
  id: string
  userId: string // FK to Users
  contentId: string // FK to VideoContent
  progress: number // 0-100 percentage
  lastWatchedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### Follows Table

```typescript
interface Follow {
  id: string
  followerId: string // FK to Users (who is following)
  followingId: string // FK to Users (who is being followed)
  createdAt: Date
}
```

### Ratings Table

```typescript
interface Rating {
  id: string
  userId: string
  contentId: string
  rating: number // 1-5
  createdAt: Date
  updatedAt: Date
}
```

---

## Static Data (Can be config or DB)

### Regions

```typescript
const regions = [
  { id: 'all', name: 'All Regions', flag: '🌍' },
  { id: 'nollywood', name: 'Nollywood', flag: '🇳🇬' },
  { id: 'riverwood', name: 'Riverwood', flag: '🇰🇪' },
  { id: 'south-africa', name: 'South Africa', flag: '🇿🇦' },
  { id: 'ghana', name: 'Ghana', flag: '🇬🇭' },
  { id: 'tanzania', name: 'Tanzania', flag: '🇹🇿' },
  { id: 'uganda', name: 'Uganda', flag: '🇺🇬' },
]
```

### Categories

```typescript
const categories = [
  { id: 'all', name: 'All' },
  { id: 'short-films', name: 'Short Films' },
  { id: 'documentaries', name: 'Documentaries' },
  { id: 'drama', name: 'Drama' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'music-videos', name: 'Music Videos' },
  { id: 'animation', name: 'Animation' },
]
```

---

## API Endpoints

### Content Discovery

#### GET /api/content/featured

Returns featured content for homepage carousel.

```typescript
Response: VideoContent[] (limit: 5)
```

#### GET /api/content/trending

Returns trending content sorted by views/engagement.

```typescript
Query: { region?: string, category?: string, limit?: number, offset?: number }
Response: { data: VideoContent[], total: number }
```

#### GET /api/content/new-releases

Returns newly published content.

```typescript
Query: { region?: string, category?: string, limit?: number, offset?: number }
Response: { data: VideoContent[], total: number }
```

#### GET /api/content/search

Search content by title, creator, synopsis.

```typescript
Query: {
  q: string,              // Search query
  region?: string,
  category?: string,
  isPremium?: boolean,
  sortBy?: 'recent' | 'views' | 'rating',
  limit?: number,
  offset?: number
}
Response: { data: VideoContent[], total: number }
```

#### GET /api/content/:id

Get single content details.

```typescript
Response: VideoContent &
  {
    creator: { id: string, displayName: string, profilePicture: string },
    isOwned: boolean, // If user has purchased (when authenticated)
    userRating: number | null,
  }
```

### Content Management (Creator)

#### POST /api/content

Create new content (requires creator role).

```typescript
Body: {
  title: string;
  synopsis: string;
  region: string;
  category: string;
  isPremium: boolean;
  price?: number;
  releaseYear: number;
  muxAssetId: string;
  muxPlaybackId: string;
  trailerMuxAssetId?: string;
  trailerMuxPlaybackId?: string;
  thumbnailUrl: string;
  status: 'draft' | 'published';
}
Response: VideoContent
```

#### GET /api/content/my-uploads

Get creator's uploaded content.

```typescript
Query: { status?: string, sortBy?: string, limit?: number, offset?: number }
Response: {
  data: (VideoContent & { earnings: number })[],
  total: number,
  totalViews: number,
  totalEarnings: number
}
```

#### PATCH /api/content/:id

Update content (requires ownership).

```typescript
Body: {
  title?: string;
  synopsis?: string;
  region?: string;
  category?: string;
  thumbnailUrl?: string;
  status?: 'draft' | 'published' | 'hidden';
}
Response: VideoContent
```

#### DELETE /api/content/:id

Delete content (requires ownership, soft delete).

### Content Edit Analysis (LLM Integration)

#### POST /api/content/:id/analyze-changes

Analyze proposed changes using LLM to detect major modifications.

```typescript
Body: {
  title?: string;
  synopsis?: string;
  region?: string;
  category?: string;
}
Response: {
  warnings: Array<{
    field: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>
}
```

**Implementation Notes:**

- Use an LLM (GPT-4, Claude, etc.) to analyze:
  - Title similarity (detect misleading title changes)
  - Synopsis semantic similarity (ensure content still matches description)
  - Category appropriateness
  - Region change impact on rankings
- Return warnings for changes that might confuse viewers or affect discoverability
- High severity: Title completely changed, synopsis no longer matches content
- Medium severity: Category change, significant synopsis modification
- Low severity: Minor text edits, typo fixes

### MUX Integration

#### POST /api/mux/upload-url

Get direct upload URL for MUX.

```typescript
Response: {
  uploadUrl: string // MUX direct upload URL
  uploadId: string
}
```

#### POST /api/mux/webhook

MUX webhook endpoint for upload status updates.

```typescript
Events to handle:
- video.asset.ready
- video.asset.errored
- video.upload.asset_created
```

#### GET /api/mux/playback/:playbackId

Get signed playback URL (for premium content verification).

```typescript
Response: {
  playbackUrl: string // Signed MUX playback URL
  expiresAt: Date
}
```

### Thumbnail Storage

#### POST /api/upload/thumbnail

Upload thumbnail image.

```typescript
Body: FormData with 'file' field
Response: {
  url: string;             // Stored image URL
}
```

**Note:** Use cloud storage (S3, Cloudinary, Vercel Blob, etc.)

### Purchases & Payments

#### POST /api/purchases

Initiate content purchase.

```typescript
Body: {
  contentId: string
  paymentProvider: 'stripe' | 'paystack' | 'flutterwave'
}
Response: {
  purchaseId: string
  checkoutUrl: string // Redirect to payment provider
}
```

#### POST /api/purchases/webhook/:provider

Payment provider webhooks (Stripe, Paystack, Flutterwave).

#### GET /api/purchases/my-purchases

Get user's purchased content.

```typescript
Response: {
  data: (Purchase & { content: VideoContent })[],
  total: number
}
```

### Watch History

#### GET /api/history

Get user's watch history.

```typescript
Query: { limit?: number, offset?: number }
Response: {
  data: Array<{
    content: VideoContent,
    progress: number,
    lastWatchedAt: Date
  }>,
  total: number
}
```

#### POST /api/history/:contentId

Update watch progress.

```typescript
Body: {
  progress: number
} // 0-100
Response: {
  success: boolean
}
```

#### DELETE /api/history

Clear all watch history.

#### DELETE /api/history/:contentId

Remove single item from history.

### User Profile

#### GET /api/users/me

Get current user profile.

```typescript
Response: User
```

#### PATCH /api/users/me

Update user profile.

```typescript
Body: {
  displayName?: string;
  bio?: string;
  profilePicture?: string;
}
Response: User
```

#### PATCH /api/users/me/settings

Update user settings.

```typescript
Body: {
  emailNotifications?: boolean;
  newFollowerNotifications?: boolean;
  contentUpdateNotifications?: boolean;
  earningsNotifications?: boolean;
  watchHistoryEnabled?: boolean;
}
Response: User
```

#### PATCH /api/users/me/payout

Update payout settings.

```typescript
Body: {
  payoutMethod: 'bank' | 'mobile_money' | 'paypal';
  payoutDetails: {
    // Bank
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    // Mobile Money
    provider?: string;
    phoneNumber?: string;
    // PayPal
    paypalEmail?: string;
  }
}
Response: { success: boolean }
```

### Creator Analytics

#### GET /api/analytics/overview

Get creator's overall stats.

```typescript
Response: {
  totalViews: number
  totalEarnings: number
  totalContent: number
  averageRating: number
  followersCount: number
}
```

#### GET /api/analytics/earnings

Get detailed earnings breakdown.

```typescript
Query: { period: 'week' | 'month' | 'year' }
Response: {
  data: Array<{
    date: string;
    amount: number;
    purchases: number;
  }>,
  total: number
}
```

### Follows

#### POST /api/follows/:creatorId

Follow a creator.

#### DELETE /api/follows/:creatorId

Unfollow a creator.

#### GET /api/follows/following

Get creators user is following.

```typescript
Response: { data: User[], total: number }
```

#### GET /api/follows/followers

Get user's followers (for creators).

```typescript
Response: { data: User[], total: number }
```

### Ratings

#### POST /api/ratings/:contentId

Rate content.

```typescript
Body: { rating: number }  // 1-5
Response: { averageRating: number, ratingCount: number }
```

#### DELETE /api/ratings/:contentId

Remove user's rating.

---

## Third-Party Integrations

### MUX Video

- Direct uploads for video files
- Playback ID generation
- Signed URLs for premium content
- Webhook handling for processing status

### Payment Providers

I'll use lipila for payments https://blaze-docs.lipila.dev/

### Cloud Storage

- Thumbnail storage (S3, Cloudinary, or Vercel Blob)
- Signed URLs for private content

### LLM Integration (Content Edit Analysis)

- OpenAI GPT-4 or Anthropic Claude
- Use for analyzing content changes
- Detect potentially misleading edits

---

## Business Logic

### Platform Fee

- **Creator receives:** 85% of content price
- **Platform fee:** 15%

### Content Visibility

- **draft:** Only visible to creator
- **processing:** Video being processed by MUX
- **published:** Publicly visible and searchable
- **hidden:** Removed from public but accessible to purchasers

### Premium Content Access

- Check if user has purchased before allowing playback
- Return signed MUX URL with expiration
- Track watch progress only for authenticated users

### Trending Algorithm

Consider:

- Views in last 7 days (weighted heavily)
- Recent purchases
- Rating score
- Recency of upload
- Engagement (completion rate)

---

## Environment Variables Required

```env
# Database
DATABASE_URL=

# Clerk
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# MUX
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_WEBHOOK_SECRET=



# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
# OR
CLOUDINARY_URL=
# OR
BLOB_READ_WRITE_TOKEN=

# LLM (for content analysis)
OPENAI_API_KEY=
# OR
ANTHROPIC_API_KEY=
```

---

## Security Considerations

1. **JWT Validation:** Always validate Clerk JWT tokens
2. **Rate Limiting:** Implement on all endpoints, stricter for uploads
3. **Input Validation:** Validate all user inputs with class-validator
4. **SQL Injection:** Use parameterized queries (TypeORM/Prisma)
5. **File Upload:** Validate file types, size limits (500MB for video, 5MB for images)
6. **Payment Security:** Never store raw payment details, use provider tokens
7. **Content Access:** Verify purchase before streaming premium content
8. **Webhook Verification:** Verify signatures for all webhooks

---

## Recommended NestJS Modules

```typescript
// Suggested module structure
- auth/            // Clerk JWT validation, guards
- users/           // User management
- content/         // Video content CRUD
- mux/             // MUX integration
- purchases/       // Payment processing
- history/         // Watch history
- follows/         // Social features
- analytics/       // Creator analytics
- upload/          // File upload handling
- common/          // Shared utilities, decorators
```

---

## Response Format

All API responses should follow this format:

```typescript
// Success
{
  success: true,
  data: T,
  meta?: {
    total?: number,
    page?: number,
    limit?: number
  }
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

---

## Notes for Cursor AI

1. This frontend is built with Next.js 16 App Router
2. All data is currently mocked in `lib/lokocontent-data.ts`
3. Stub functions exist in components for MUX upload and LLM analysis
4. The frontend expects the response shapes defined above
5. Authentication is via Clerk - sync user on first API call or via webhook
6. Payment flow: Frontend redirects to checkout URL, backend handles webhook
7. MUX direct upload: Frontend gets URL from backend, uploads directly to MUX
