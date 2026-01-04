import type { Friend } from '@/types/friend'

interface FriendCardProps {
  friend: Friend
}

function resolveAvatarSrc(avatar?: string): string | undefined {
  if (!avatar) return undefined
  if (avatar.startsWith('/') || avatar.startsWith('data:') || avatar.startsWith('blob:')) {
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
      className="group block p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={friend.name}
              loading="lazy"
              decoding="async"
              className="w-12 h-12 rounded-lg object-cover bg-muted"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-lg font-semibold ${friend.avatar ? 'hidden' : ''}`}>
            {friend.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {friend.name}
            </h3>
            {friend.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground">
                {friend.category}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {friend.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {new URL(friend.url).hostname}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(friend.addedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
    </a>
  )
}
