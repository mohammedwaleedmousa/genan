import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, ChevronDown, ImagePlus, Loader2, LogIn, Send, Star, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { User as SupaUser } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { uploadOptimizedImage } from "@/lib/prepareImageUpload";
import { useStore } from "@/store/useStore";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { optimizeImage, handleImageError } from "@/lib/imageUrl";

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

interface ProductReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  images?: string[] | null;
  country?: string;
}

type ReviewSort = "newest" | "highest" | "lowest" | "images";

const MAX_IMAGES = 5;

const SORT_OPTIONS: Array<{ value: ReviewSort; label: string }> = [
  { value: "newest", label: "الأحدث" },
  { value: "highest", label: "الأعلى تقييماً" },
  { value: "lowest", label: "الأقل تقييماً" },
  { value: "images", label: "مع صور" },
];

const ProductReviews = ({ productId, productName }: ProductReviewsProps) => {
  const { customer } = useStore();
  const queryClient = useQueryClient();

  const [authUser, setAuthUser] = useState<SupaUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  const canReview = Boolean(customer) || Boolean(authUser);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!mounted) return;
        setAuthUser(error ? null : data.user ?? null);
      } catch {
        if (mounted) setAuthUser(null);
      } finally {
        if (mounted) setAuthChecking(false);
      }
    };

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthUser(session?.user ?? null);
      setAuthChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id,customer_name,rating,comment,created_at,images,country")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProductReview[];
    },
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    if (!canReview) {
      toast({
        title: "يجب تسجيل الدخول أولاً",
        description: "سجل دخولك قبل إضافة صور للتقييم.",
        variant: "destructive",
      });
      return;
    }

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast({ title: "الحد الأقصى 5 صور", variant: "destructive" });
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/")) continue;

      try {
        const url = await uploadOptimizedImage(file, `reviews/${productId}`, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1200,
        });
        uploaded.push(url);
      } catch (error: unknown) {
        toast({
          title: "تعذر رفع إحدى الصور",
          description: error instanceof Error ? error.message : "حاول مرة أخرى.",
          variant: "destructive",
        });
      }
    }

    setImages((current) => [...current, ...uploaded].slice(0, MAX_IMAGES));
    setUploading(false);
  };

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!canReview) throw new Error("يجب تسجيل الدخول أولاً");
      if (rating === 0) throw new Error("اختر تقييمك أولاً");

      const authorName =
        customer?.name ||
        authUser?.user_metadata?.full_name ||
        authUser?.email?.split("@")[0] ||
        customer?.phone ||
        "عميل جنان";

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        customer_name: authorName,
        rating,
        comment: comment.trim() || null,
        is_approved: false,
        images,
        country: "YE",
      });

      if (error) throw error;
    },

    onSuccess: () => {
      toast({
        title: "شكرًا لتقييمك",
        description: "تم استلام تقييمك وسيظهر بعد مراجعته.",
      });
      setRating(0);
      setHoverRating(0);
      setComment("");
      setImages([]);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },

    onError: (error: Error) => {
      toast({
        title: "تعذر إرسال التقييم",
        description: error.message || "يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((total, review) => total + Number(review.rating), 0) / reviews.length;
  }, [reviews]);

  const ratingCounts = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((value) => {
        const count = reviews.filter((review) => review.rating === value).length;
        return {
          rating: value,
          count,
          percentage: reviews.length ? (count / reviews.length) * 100 : 0,
        };
      }),
    [reviews],
  );

  const allCustomerImages = useMemo(
    () => reviews.flatMap((review) => review.images || []).slice(0, 16),
    [reviews],
  );

  const sortedReviews = useMemo(() => {
    const list = [...reviews];

    if (sort === "highest") return list.sort((a, b) => b.rating - a.rating);
    if (sort === "lowest") return list.sort((a, b) => a.rating - b.rating);
    if (sort === "images") {
      return list.sort((a, b) => Number(Boolean(b.images?.length)) - Number(Boolean(a.images?.length)));
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reviews, sort]);

  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 4);
  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label || "الأحدث";

  const formatDate = (date: string) => {
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
            <span className="text-[7px] font-semibold tracking-[.24em] text-[#9A825B]">REVIEWS</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#A9D8D3]" />
          </div>

          <h2 className="mt-2 text-[18px] font-semibold tracking-[-.025em] text-[#0E0E0E] md:text-[22px]">
            تقييمات العملاء
          </h2>

          <p className="mt-1 max-w-[360px] truncate text-[8px] text-[#777] md:text-[9px]">
            {productName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className={`flex h-9 shrink-0 items-center gap-1.5 border px-3 text-[8px] font-semibold transition-colors ${
            showForm
              ? "border-[#D8C29A] bg-white text-[#0E0E0E]"
              : "border-[#0E0E0E] bg-[#0E0E0E] text-white"
          }`}
        >
          {showForm ? <X className="h-3 w-3" /> : <Star className="h-3 w-3" />}
          {showForm ? "إلغاء" : "اكتب تقييمك"}
        </button>
      </div>

      {showForm && (
        <div className="mt-5 border-y border-[#E7E2D9] bg-[#FAF9F6] px-3 py-4 md:px-4">
          {authChecking ? (
            <div className="flex min-h-[96px] items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#0E0E0E]" />
            </div>
          ) : !canReview ? (
            <div className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-[10px] font-semibold text-[#0E0E0E]">سجّل دخولك لإضافة تقييم</p>
                <p className="mt-1 text-[8px] leading-5 text-[#777]">شارك تجربتك وساعد الآخرين في اختيارهم.</p>
              </div>
              <Link to="/auth" className="flex h-9 shrink-0 items-center gap-1.5 bg-[#0E0E0E] px-4 text-[8px] font-semibold text-white">
                <LogIn className="h-3 w-3" />
                تسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-[#E7E2D9] pb-4">
                <div>
                  <p className="text-[9px] font-semibold text-[#0E0E0E]">تقييمك للمنتج</p>
                  <p className="mt-1 text-[7px] text-[#777]">
                    {rating ? `${rating} من 5` : "اختر عدد النجوم"}
                  </p>
                </div>

                <div className="flex items-center gap-0.5" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} نجوم`}
                        className="p-0.5"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            active ? "fill-[#D8C29A] text-[#D8C29A]" : "text-[#DDD8CE]"
                          }`}
                          strokeWidth={1.2}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[8px] font-semibold text-[#0E0E0E]">رأيك في المنتج</label>
                  <span className="text-[6px] text-[#999]">{comment.length}/600</span>
                </div>

                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value.slice(0, 600))}
                  rows={3}
                  placeholder="كيف كانت الجودة أو المقاس أو تجربتك مع المنتج؟"
                  className="w-full resize-none border border-[#DED8CE] bg-white px-3 py-3 text-[9px] leading-6 text-[#0E0E0E] outline-none placeholder:text-[#AAA] focus:border-[#C9B183]"
                />
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[8px] font-semibold text-[#0E0E0E]">
                    <Camera className="h-3.5 w-3.5 text-[#9A825B]" />
                    صور المنتج
                    <span className="font-normal text-[#999]">اختياري</span>
                  </span>
                  <span className="text-[6px] text-[#999]">{images.length}/{MAX_IMAGES}</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {images.map((src, index) => (
                    <div key={`${src}-${index}`} className="relative h-16 w-16 shrink-0 overflow-hidden border border-[#E7E2D9] bg-white">
                      <img src={src} alt="" className="h-full w-full object-cover" onError={handleImageError} />
                      <button
                        type="button"
                        onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                        className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center bg-black/70 text-white"
                        aria-label="حذف الصورة"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}

                  {images.length < MAX_IMAGES && (
                    <label className="flex h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center border border-dashed border-[#CFC6B8] bg-white text-[#9A825B]">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4" />
                          <span className="mt-1 text-[6px] font-semibold">إضافة</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        multiple
                        disabled={uploading}
                        className="hidden"
                        onChange={(event) => {
                          const files = event.target.files;
                          event.currentTarget.value = "";
                          void handleFiles(files);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#E7E2D9] pt-3">
                <p className="max-w-[220px] text-[6px] leading-4 text-[#999]">
                  يظهر التقييم بعد مراجعته للحفاظ على جودة التقييمات.
                </p>

                <button
                  type="button"
                  onClick={() => submitReview.mutate()}
                  disabled={rating === 0 || uploading || submitReview.isPending}
                  className="flex h-9 items-center gap-1.5 bg-[#0E0E0E] px-4 text-[8px] font-semibold text-white disabled:opacity-40"
                >
                  {submitReview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3 w-3" />}
                  {submitReview.isPending ? "جارٍ الإرسال" : "إرسال التقييم"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="mt-5 space-y-3">
          <div className="h-20 animate-pulse bg-[#F4F2EE]" />
          <div className="h-20 animate-pulse bg-[#F4F2EE]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-5 border-y border-[#E7E2D9] py-8 text-center">
          <Star className="mx-auto h-5 w-5 text-[#9A825B]" strokeWidth={1.4} />
          <p className="mt-3 text-[11px] font-semibold text-[#0E0E0E]">لا توجد تقييمات بعد</p>
          <p className="mx-auto mt-1 max-w-[300px] text-[8px] leading-5 text-[#777]">
            شارك تجربتك مع هذا المنتج بعد الشراء.
          </p>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 border-b border-[#D8C29A] pb-1 text-[8px] font-semibold text-[#0E0E0E]"
            >
              اكتب أول تقييم
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-[88px_1fr] gap-4 border-y border-[#E7E2D9] py-4 md:grid-cols-[120px_1fr]">
            <div className="flex flex-col items-center justify-center border-l border-[#E7E2D9] pl-4">
              <span className="text-[30px] font-semibold leading-none text-[#0E0E0E]">{averageRating.toFixed(1)}</span>
              <div className="mt-2 flex gap-[1px]" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(averageRating)
                        ? "fill-[#D8C29A] text-[#D8C29A]"
                        : "text-[#DDD8CE]"
                    }`}
                    strokeWidth={1.1}
                  />
                ))}
              </div>
              <span className="mt-1.5 text-[6px] text-[#888]">{reviews.length} تقييم</span>
            </div>

            <div className="flex flex-col justify-center gap-1.5">
              {ratingCounts.map(({ rating: value, count, percentage }) => (
                <div key={value} className="grid grid-cols-[18px_1fr_18px] items-center gap-2">
                  <span className="text-[7px] text-[#666]">{value}</span>
                  <div className="h-1 bg-[#EEEAE3]">
                    <div className="h-full bg-[#D8C29A]" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-left text-[6px] text-[#999]">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {allCustomerImages.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#0E0E0E]">
                  <Camera className="h-3.5 w-3.5 text-[#9A825B]" />
                  صور العملاء
                </span>
                <span className="text-[6px] text-[#999]">{allCustomerImages.length} صورة</span>
              </div>

              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {allCustomerImages.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setZoomImg(src)}
                    className="h-[72px] w-[72px] shrink-0 overflow-hidden border border-[#E7E2D9] bg-white"
                  >
                    <img
                      src={optimizeImage(src, 300, 82)}
                      alt="صورة من تقييم عميل"
                      className="h-full w-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative mt-5 flex items-center justify-between border-y border-[#E7E2D9] py-2.5">
            <span className="text-[9px] font-semibold text-[#0E0E0E]">آراء العملاء</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((current) => !current)}
                className="flex h-8 min-w-[100px] items-center justify-between gap-2 border border-[#E7E2D9] bg-white px-2.5 text-[7px] font-medium text-[#555]"
              >
                {currentSortLabel}
                <ChevronDown className={`h-3 w-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>

              {sortOpen && (
                <>
                  <button
                    type="button"
                    onClick={() => setSortOpen(false)}
                    className="fixed inset-0 z-[60]"
                    aria-label="إغلاق قائمة الترتيب"
                  />
                  <div className="absolute left-0 top-[36px] z-[70] w-[160px] border border-[#E7E2D9] bg-white p-1 shadow-[0_10px_24px_rgba(14,14,14,.08)]">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSort(option.value);
                          setSortOpen(false);
                          setShowAll(false);
                        }}
                        className={`flex h-9 w-full items-center justify-between px-2.5 text-right text-[8px] ${
                          sort === option.value ? "bg-[#FAF9F6] font-semibold text-[#0E0E0E]" : "text-[#666]"
                        }`}
                      >
                        {option.label}
                        {sort === option.value && <Check className="h-3 w-3 text-[#9A825B]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            {displayedReviews.map((review) => (
              <article key={review.id} className="border-b border-[#E7E2D9] py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-semibold text-[#0E0E0E]">{review.customer_name}</p>
                    <p className="mt-1 text-[6px] text-[#999]">{formatDate(review.created_at)}</p>
                  </div>

                  <div className="flex gap-[1px]" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= review.rating
                            ? "fill-[#D8C29A] text-[#D8C29A]"
                            : "text-[#DDD8CE]"
                        }`}
                        strokeWidth={1.1}
                      />
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p className="mt-3 text-[8px] leading-6 text-[#555] md:text-[9px]">{review.comment}</p>
                )}

                {review.images?.length ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {review.images.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => setZoomImg(src)}
                        className="h-16 w-16 shrink-0 overflow-hidden border border-[#E7E2D9]"
                      >
                        <img
                          src={optimizeImage(src, 260, 82)}
                          alt="صورة من العميل"
                          className="h-full w-full object-cover"
                          onError={handleImageError}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {sortedReviews.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 border border-[#E7E2D9] bg-white text-[8px] font-semibold text-[#0E0E0E]"
            >
              {showAll ? "عرض أقل" : `عرض كل التقييمات (${sortedReviews.length})`}
              <ChevronDown className={`h-3 w-3 transition-transform ${showAll ? "rotate-180" : ""}`} />
            </button>
          )}
        </>
      )}

      <Dialog open={Boolean(zoomImg)} onOpenChange={(open) => { if (!open) setZoomImg(null); }}>
        <DialogContent className="max-w-[calc(100vw-20px)] overflow-hidden border-0 bg-[#111] p-1 sm:max-w-3xl">
          {zoomImg && (
            <img
              src={zoomImg}
              alt="صورة تقييم العميل"
              className="max-h-[82vh] w-full object-contain"
              onError={handleImageError}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ProductReviews;
