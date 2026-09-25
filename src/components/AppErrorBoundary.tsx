import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

const isRecoverableChunkError = (error: unknown) => {
  const message = String((error as { message?: unknown })?.message || error || "");
  return /dynamic(?:ally)? imported module|module script|chunkloaderror|loading chunk|failed to fetch|load failed|error loading/i.test(message);
};

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("APP_RENDER_ERROR", error, info);

    if (typeof window === "undefined" || !isRecoverableChunkError(error)) return;

    const retryKey = `genan-error-recovery:${window.location.pathname}`;
    if (window.sessionStorage.getItem(retryKey)) return;

    window.sessionStorage.setItem(retryKey, "1");
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-[#FAF9F6] px-5" dir="rtl">
        <div className="w-full max-w-[370px] border border-[#E7E0D5] bg-white px-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-28 items-center justify-center border-y border-[#D8C29A]/50">
            <span className="text-[20px] font-medium tracking-[.22em] text-[#0E0E0E]">GENAN</span>
          </div>

          <div className="mx-auto mt-5 h-1.5 w-1.5 rounded-full bg-[#A9D8D3]" />

          <h1 className="mt-4 text-[20px] font-semibold text-[#0E0E0E]">تعذر فتح الصفحة</h1>
          <p className="mx-auto mt-2 max-w-[290px] text-[10px] leading-6 text-[#777]">
            حدث انقطاع مؤقت أثناء الانتقال. أعد المحاولة ولن تفقد سلتك أو حسابك.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 h-11 w-full bg-[#0E0E0E] text-[10px] font-semibold text-white"
          >
            إعادة المحاولة
          </button>

          <button
            type="button"
            onClick={() => window.location.assign("/home")}
            className="mt-2 h-10 w-full border border-[#E4DED4] bg-white text-[9px] font-medium text-[#5F5A53]"
          >
            العودة للرئيسية
          </button>
        </div>
      </main>
    );
  }
}

export default AppErrorBoundary;
