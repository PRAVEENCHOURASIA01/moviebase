// ─────────────────────────────────────────
// LoadingSkeleton
// Shimmer placeholders for MovieGrid + Profile
// ─────────────────────────────────────────

/** Single poster-shaped skeleton card */
const SkeletonCard = () => (
  <div className="flex flex-col gap-3">
    {/* Poster */}
    <div className="skeleton w-full aspect-poster rounded-xl" />
    {/* Title */}
    <div className="skeleton h-3.5 w-3/4 rounded-md" />
    {/* Meta */}
    <div className="skeleton h-3 w-1/2 rounded-md" />
  </div>
)

/**
 * @param {number} count   - number of skeleton cards to render
 * @param {'grid'|'row'}   layout
 */
export const LoadingSkeleton = ({ count = 8, layout = 'grid' }) => {
  const items = Array.from({ length: count }, (_, i) => i)

  if (layout === 'row') {
    return (
      <div className="flex gap-4 overflow-hidden">
        {items.map((i) => (
          <div key={i} className="shrink-0 w-36">
            <SkeletonCard />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {items.map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default LoadingSkeleton