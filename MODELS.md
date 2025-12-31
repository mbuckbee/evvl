# Models Cache

Evvl uses **Next.js Data Cache** with a 5-minute revalidation to keep model lists fresh while avoiding excessive API calls.

## How It Works

### Next.js Data Cache (Primary)
- Uses Next.js's built-in `fetch` cache
- **Shared across ALL serverless instances** (unlike in-memory)
- Persists on Vercel's infrastructure
- Automatically revalidates every 5 minutes
- Works on CDN edge locations

### Static Fallback
- `lib/models-cache.json` serves as a fallback if the API is unreachable
- Contains 353 models from OpenRouter's catalog
- Used when the API route fails

## Cache Architecture

```
User Request → Next.js Data Cache → [HIT] Return instantly
                                  → [MISS] Fetch from OpenRouter → Cache → Return
```

**Key Features:**
- ✅ Shared across all serverless instances (no duplication)
- ✅ Survives cold starts and deployments
- ✅ Works globally on Vercel's edge network
- ✅ ISR (Incremental Static Regeneration) under the hood

## Cache Behavior

**First request after deployment:**
- Fetches from OpenRouter API (~500ms)
- Stores in Next.js Data Cache
- Returns data

**Subsequent requests (within 5 minutes):**
- Returns from Next.js Data Cache (< 10ms)
- No API call to OpenRouter
- Same response for all users globally

**After 5 minutes (revalidation):**
- Next request triggers background revalidation
- Users still get cached data immediately (stale-while-revalidate)
- Cache updates in background
- Fresh data ready for next request

## API Endpoint

`GET /api/models`

Returns:
```json
{
  "models": [...],
  "totalModels": 353,
  "cached": true
}
```

## Route Configuration

```typescript
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-static'; // Enable ISR
```

## Updating the Static Fallback

To update the fallback cache (optional):

```bash
npm run fetch-models
```

This updates `lib/models-cache.json` which is only used if:
- The API is down
- Network is unavailable
- OpenRouter is having issues

## Deployment on Vercel

### How It Works
- **Next.js Data Cache** is stored on Vercel's infrastructure
- Shared across all instances and regions
- No custom cache service (Redis) needed
- Persists across deployments (with revalidation)

### Advantages Over In-Memory Cache

| Feature | In-Memory Cache | Next.js Data Cache |
|---------|----------------|-------------------|
| Shared across instances | ❌ No | ✅ Yes |
| Survives cold starts | ❌ No | ✅ Yes |
| Works in multiple regions | ⚠️ Separate caches | ✅ CDN-level |
| Duplicate API calls | ⚠️ Possible | ✅ Prevented |
| Setup required | None | None |

### Edge Cases Handled
- **Cold starts**: Cache persists, no refetch needed
- **Multiple regions**: CDN-level cache serves all regions
- **Serverless restarts**: Cache independent of function lifecycle
- **Traffic spikes**: Single fetch serves all instances
- **Deployments**: Cache can persist with revalidation

## Benefits

✅ **Globally shared**: Single cache for all users worldwide
✅ **Super fast**: Responses in < 10ms from cache
✅ **Reliable**: Falls back to static cache if API fails
✅ **Efficient**: Only one API call every 5 minutes max
✅ **No infrastructure**: No Redis or external cache needed
✅ **ISR built-in**: Stale-while-revalidate for zero downtime
✅ **Production-ready**: Battle-tested Next.js feature
