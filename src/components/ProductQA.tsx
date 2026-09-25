import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Clock3, LogIn, MessageCircleQuestion, Search, Send, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/store/useStore";
import { getSiteText, useSiteContent } from "@/hooks/useSiteContent";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: string;
  content: string;
  content_ar: string;
  answer?: string | null;
  answer_ar?: string | null;
  author: string;
  helpful_count: number;
  created_at: string;
}

const ProductQA = ({ productId }: { productId: string }) => {
  const { data: content } = useSiteContent("product_qa_");
  const { customer } = useStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAskForm, setShowAskForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supabaseAuthed, setSupabaseAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!mounted) return;
        setSupabaseAuthed(!error && Boolean(data.user));
      } catch {
        if (mounted) setSupabaseAuthed(false);
      } finally {
        if (mounted) setAuthChecking(false);
      }
    };

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSupabaseAuthed(Boolean(session?.user));
      setAuthChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const {
    data: questions = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["product-questions", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_questions")
        .select("id,content,content_ar,answer,answer_ar,author,helpful_count,created_at")
        .eq("product_id", productId)
        .order("helpful_count", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Question[];
    },
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return questions;

    return questions.filter((question) => {
      const questionText = `${question.content_ar || ""} ${question.content || ""}`.toLowerCase();
      const answerText = `${question.answer_ar || ""} ${question.answer || ""}`.toLowerCase();
      return questionText.includes(query) || answerText.includes(query);
    });
  }, [questions, searchQuery]);

  const displayedQuestions = showAll ? filteredQuestions : filteredQuestions.slice(0, 4);

  const handleAskQuestion = useCallback(async () => {
    if (authChecking) return;

    if (!supabaseAuthed) {
      toast({
        title: getSiteText(content, "qa_login_required", "يجب تسجيل الدخول أولاً"),
        description: getSiteText(content, "qa_login_description", "سجل دخولك حتى تتمكن من طرح سؤال عن المنتج"),
        variant: "destructive",
      });
      return;
    }

    const trimmedQuestion = newQuestion.trim();
    if (trimmedQuestion.length < 5) {
      toast({
        title: "اكتب سؤالك بشكل أوضح",
        description: "يجب أن يحتوي السؤال على 5 أحرف على الأقل.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("product_questions").insert({
        product_id: productId,
        content: trimmedQuestion,
        content_ar: trimmedQuestion,
        author: customer?.name || customer?.phone || "عميل جنان",
        helpful_count: 0,
      });

      if (error) throw error;

      toast({
        title: "تم إرسال سؤالك",
        description: "سيراجعه فريق جنان ويجيبك في أقرب وقت.",
      });

      setNewQuestion("");
      setShowAskForm(false);
      await refetch();
    } catch (error: any) {
      const permissionError =
        error?.code === "42501" ||
        String(error?.message || "").toLowerCase().includes("row-level security");

      toast({
        title: permissionError ? "يجب تسجيل الدخول أولاً" : "تعذر إرسال السؤال",
        description: permissionError ? "سجل دخولك ثم حاول مرة أخرى." : "يرجى المحاولة مرة أخرى لاحقاً.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [authChecking, content, customer, newQuestion, productId, refetch, supabaseAuthed]);

  const formatDate = (date?: string) => {
    if (!date) return "";
    try {
      return new Intl.DateTimeFormat("ar-YE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(date));
    } catch {
      return "";
    }
  };

  return (
    <section className="w-full" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-px w-7 bg-[#D8C29A]" />
            <span className="text-[7px] font-semibold tracking-[.24em] text-[#9A825B]">QUESTIONS</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#A9D8D3]" />
          </div>

          <h2 className="mt-2 text-[18px] font-semibold tracking-[-.025em] text-[#0E0E0E] md:text-[22px]">
            {getSiteText(content, "qa_heading", "الأسئلة والأجوبة")}
          </h2>

          <p className="mt-1 max-w-[360px] text-[8px] leading-5 text-[#777] md:text-[9px]">
            {getSiteText(content, "qa_subtitle", "اسأل عن المقاس أو الخامة أو أي تفصيل قبل الطلب.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAskForm((current) => !current)}
          className={`flex h-9 shrink-0 items-center gap-1.5 border px-3 text-[8px] font-semibold transition-colors ${
            showAskForm
              ? "border-[#D8C29A] bg-white text-[#0E0E0E]"
              : "border-[#0E0E0E] bg-[#0E0E0E] text-white"
          }`}
        >
          {showAskForm ? <X className="h-3 w-3" /> : <MessageCircleQuestion className="h-3 w-3" />}
          {showAskForm ? "إلغاء" : "اسأل عن المنتج"}
        </button>
      </div>

      {showAskForm && (
        <div className="mt-5 border-y border-[#E7E2D9] bg-[#FAF9F6] px-3 py-4 md:px-4">
          {authChecking ? (
            <div className="flex min-h-[96px] items-center justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#E7E2D9] border-t-[#0E0E0E]" />
            </div>
          ) : !supabaseAuthed ? (
            <div className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-[10px] font-semibold text-[#0E0E0E]">سجّل دخولك لطرح سؤال</p>
                <p className="mt-1 text-[8px] leading-5 text-[#777]">يمكنك بعدها متابعة سؤالك والعودة إليه بسهولة.</p>
              </div>

              <Link to="/auth" className="flex h-9 shrink-0 items-center gap-1.5 bg-[#0E0E0E] px-4 text-[8px] font-semibold text-white">
                <LogIn className="h-3 w-3" />
                تسجيل الدخول
              </Link>
            </div>
          ) : (
            <div>
              <label className="text-[9px] font-semibold text-[#0E0E0E]">سؤالك</label>
              <div className="relative mt-2">
                <textarea
                  value={newQuestion}
                  onChange={(event) => setNewQuestion(event.target.value.slice(0, 350))}
                  rows={3}
                  disabled={loading}
                  placeholder="مثال: هل المقاس يطابق المقاسات المعتادة؟"
                  className="w-full resize-none border border-[#DED8CE] bg-white px-3 py-3 pb-7 text-[9px] leading-6 text-[#0E0E0E] outline-none placeholder:text-[#AAA] focus:border-[#C9B183]"
                />
                <span className="absolute bottom-2 left-2 text-[6px] text-[#999]">{newQuestion.length}/350</span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[6px] leading-4 text-[#999]">لا تكتب رقم الهاتف أو أي بيانات شخصية داخل السؤال.</p>
                <button
                  type="button"
                  onClick={handleAskQuestion}
                  disabled={loading || newQuestion.trim().length < 5}
                  className="flex h-9 shrink-0 items-center gap-1.5 bg-[#0E0E0E] px-4 text-[8px] font-semibold text-white disabled:opacity-40"
                >
                  {loading ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  {loading ? "جارٍ الإرسال" : "إرسال السؤال"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {questions.length >= 4 && (
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث في الأسئلة"
            className="h-10 w-full border border-[#E7E2D9] bg-white pr-9 pl-9 text-[8px] text-[#0E0E0E] outline-none focus:border-[#C9B183]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-[#777]"
              aria-label="مسح البحث"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse bg-[#F4F2EE]" />
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="mt-5 border-y border-[#E7E2D9] py-8 text-center">
          <MessageCircleQuestion className="mx-auto h-5 w-5 text-[#9A825B]" strokeWidth={1.4} />
          <p className="mt-3 text-[11px] font-semibold text-[#0E0E0E]">
            {searchQuery ? "لا توجد نتائج" : getSiteText(content, "qa_empty", "لا توجد أسئلة حتى الآن")}
          </p>
          <p className="mx-auto mt-1 max-w-[300px] text-[8px] leading-5 text-[#777]">
            {searchQuery ? "جرّب كلمة بحث مختلفة." : "لديك استفسار عن هذا المنتج؟ كن أول من يسأل."}
          </p>

          {!searchQuery && !showAskForm && (
            <button
              type="button"
              onClick={() => setShowAskForm(true)}
              className="mt-4 border-b border-[#D8C29A] pb-1 text-[8px] font-semibold text-[#0E0E0E]"
            >
              اطرح أول سؤال
            </button>
          )}
        </div>
      ) : (
        <div className="mt-5 border-t border-[#E7E2D9]">
          {displayedQuestions.map((question) => {
            const expanded = expandedId === question.id;
            const questionText = question.content_ar || question.content;
            const answerText = question.answer_ar || question.answer;
            const answered = Boolean(answerText);

            return (
              <article key={question.id} className="border-b border-[#E7E2D9]">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : question.id)}
                  className="flex w-full items-start gap-3 py-4 text-right"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-[#D8C29A] text-[8px] font-semibold text-[#9A825B]">
                    س
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold leading-5 text-[#0E0E0E] md:text-[10px]">{questionText}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[6px] text-[#888]">
                      <span>{question.author}</span>
                      <span className="h-1 w-1 rounded-full bg-[#A9D8D3]" />
                      <span className="flex items-center gap-1"><Clock3 className="h-2.5 w-2.5" />{formatDate(question.created_at)}</span>
                      <span className={answered ? "text-[#527258]" : "text-[#9A825B]"}>
                        {answered ? "تمت الإجابة" : "بانتظار الرد"}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className={`mt-1 h-3.5 w-3.5 shrink-0 text-[#777] transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>

                {expanded && (
                  <div className="pb-4 pr-9">
                    {answered ? (
                      <div className="border-r-2 border-[#D8C29A] bg-[#FAF9F6] px-3 py-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center bg-[#0E0E0E] text-white">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                          <span className="text-[8px] font-semibold text-[#0E0E0E]">Genan</span>
                          <span className="flex items-center gap-1 text-[6px] text-[#777]">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            رد المتجر
                          </span>
                        </div>
                        <p className="whitespace-pre-line text-[8px] leading-6 text-[#555] md:text-[9px]">{answerText}</p>
                      </div>
                    ) : (
                      <p className="text-[7px] text-[#777]">بانتظار رد فريق جنان.</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {filteredQuestions.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 border border-[#E7E2D9] bg-white text-[8px] font-semibold text-[#0E0E0E]"
        >
          {showAll ? "عرض أقل" : `عرض كل الأسئلة (${filteredQuestions.length})`}
          <ChevronDown className={`h-3 w-3 transition-transform ${showAll ? "rotate-180" : ""}`} />
        </button>
      )}
    </section>
  );
};

export default ProductQA;
