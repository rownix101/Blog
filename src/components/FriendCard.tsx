import type { Friend } from '@/types/friend'

interface FriendCardProps {
  friend: Friend
}

function resolveAvatarSrc(avatar?: string): string | undefined {
  if (!avatar) return undefined
  if (
    avatar.startsWith('/') ||
    avatar.startsWith('data:') ||
    avatar.startsWith('blob:')
  ) {
    return avatar
  }

  try {
    const avatarUrl = new URL(avatar)
    if (avatarUrl.protocol === 'http:' || avatarUrl.protocol === 'https:') {
      return `/api/image-proxy?url=${encodeURIComponent(avatar)}`
    }
  } catch {
    return avatar
  }

  return avatar
}

export default function FriendCard({ friend }: FriendCardProps) {
  const avatarSrc = resolveAvatarSrc(friend.avatar)

  return (
    <a
      href={friend.url}
      target="_blank"
      rel={`noopener noreferrer ${friend.rel || 'friend'}`}
      className="group bg-card border-border hover:border-primary/50 block rounded-lg border p-6 transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={friend.name}
              loading="lazy"
              decoding="async"
              width={48}
              height={48}
              className="bg-muted h-12 w-12 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div
            className={`bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-lg text-lg font-semibold ${friend.avatar ? 'hidden' : ''}`}
          >
            {friend.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
              {friend.name}
            </h3>
            {friend.category && (
              <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs">
                {friend.category}
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
            {friend.description}
          </p>

          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              {new URL(friend.url).hostname}
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {new Date(friend.addedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <svg
            className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>
      </div>
    </a>
  )
}
