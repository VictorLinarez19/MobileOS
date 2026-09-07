export function HomeIndicator() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-1.5"
      style={{ height: 'var(--home-h)' }}
    >
      <span className="h-[5px] w-32 rounded-full bg-white/70" />
    </div>
  )
}
