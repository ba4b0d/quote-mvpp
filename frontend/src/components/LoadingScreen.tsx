export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-[var(--text-secondary)]">در حال بارگذاری...</p>
      </div>
    </div>
  )
}
