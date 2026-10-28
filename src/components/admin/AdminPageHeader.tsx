import type { FC } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowUpLeft } from "lucide-react";
import { legacyAdminPathToCurrent } from "@/lib/adminRoutes";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  category?: string;
  actions?: Array<{
    label: string;
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "outline" | "destructive";
  }>;
}

/** Genan Studio title treatment. No shared Flamingo dashboard card shell. */
const AdminPageHeader: FC<AdminPageHeaderProps> = ({ title, description, category, actions = [] }) => (
  <header dir="rtl" data-genan-page-heading className="genan-studio-heading relative mb-7 overflow-hidden border border-[#E8E1D8] bg-[#FFFEFB] px-5 py-6 sm:px-7 sm:py-7">
    <div className="flex min-w-0 flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="min-w-0 max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#B49A70]" />
          <span className="rounded-full bg-[#F6F0E5] px-3 py-1.5 text-[11px] font-semibold text-[#735A34]">{category || "إدارة المتجر"}</span>
          <span className="text-[10px] font-medium tracking-[.11em] text-[#7E8279]" dir="ltr">GENAN / STUDIO</span>
        </div>
        <h1 className="text-[28px] font-bold leading-[1.3] tracking-tight text-[#202D24] sm:text-[35px]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[13px] leading-7 text-[#59665A] sm:text-[14px]">{description}</p>}
      </div>
      {actions.length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-2 lg:max-w-[55%] lg:justify-end">
          {actions.map((action, index) => (
            <HeaderAction key={action.label + index} action={action} />
          ))}
        </div>
      )}
    </div>
  </header>
);

const HeaderAction = ({ action }: { action: NonNullable<AdminPageHeaderProps["actions"]>[number] }) => {
  const Icon = action.icon;
  const primary = action.variant === "primary";
  const danger = action.variant === "destructive";
  const cls = cn(
    "group inline-flex min-h-[44px] min-w-[124px] items-center justify-center gap-2.5 rounded-xl border px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#806137]",
    primary && "border-[#26382D] bg-[#26382D] text-white shadow-[0_4px_14px_rgba(35,56,43,.1)] hover:bg-[#405343]",
    danger && "border-[#E6C4BF] bg-[#FFF6F4] text-[#963D34] hover:bg-[#FBEAE7]",
    !primary && !danger && "border-[#E2D9CC] bg-[#F9F7F2] text-[#3F493F] hover:border-[#CEBB9D] hover:bg-[#F1EADF]",
  );
  const children = (
    <>
      <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.8} />
      <span>{action.label}</span>
      {action.href && <ArrowUpLeft className="h-[13px] w-[13px] shrink-0 opacity-60 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />}
    </>
  );
  if (action.href) return <Link to={legacyAdminPathToCurrent(action.href)} className={cls}>{children}</Link>;
  return <button type="button" onClick={action.onClick} className={cls}>{children}</button>;
};

export default AdminPageHeader;
