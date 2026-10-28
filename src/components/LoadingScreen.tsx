// A route chunk can still be downloading on a cold visit. Keep the fallback
// lightweight and nonblocking: never lock the entire document or force reload
// while the customer is navigating (especially on a slow mobile connection).
const LoadingScreen = () => (
  <main className="flex min-h-[60dvh] items-center justify-center bg-white px-4" dir="rtl" role="status" aria-live="polite" aria-label="جاري فتح الصفحة">
    <div className="flex items-center gap-3 text-sm text-[#686868]">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#E7E2D9] border-t-[#0E0E0E]" />
      <span>جاري فتح الصفحة...</span>
    </div>
  </main>
);

export default LoadingScreen;
