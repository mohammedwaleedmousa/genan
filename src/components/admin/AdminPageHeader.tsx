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
  <header dir="rtl" data-genan-page-heading className="genan-studio-heading relative mb-7 overflow-hidden border-b border-[#D7D0C4] pb-6 pt-3 sm:mb-8 sm:pb-7">
    <div className="flex min-w-0 flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="min-w-0 max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <span aria-hidden="true" className="h-[2px] w-8 bg-[#9C7A48]" />
          <span className="text-[11px] font-bold tracking-[.09em] text-[#725A38]">{category || "إدارة المتجر"}</span>
          <span className="text-[10px] font-medium tracking-[.17em] text-[#959082]" dir="ltr">GENAN / STUDIO</span>
        </div>
        <h1 className="text-[29px] font-semibold leading-[1.25] tracking-tight text-[#202820] sm:text-[36px] lg:text-[40px]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-[13px] leading-7 text-[#5E665D] sm:text-[14px]">{description}</p>}
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
    "group inline-flex min-h-[44px] min-w-[124px] items-center justify-center gap-2.5 border px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#806137]",
    primary && "border-[#24332B] bg-[#24332B] text-white hover:bg-[#39493D]",
    danger && "border-[#E6C4BF] bg-[#FFF6F4] text-[#963D34] hover:bg-[#FBEAE7]",
    !primary && !danger && "border-[#D3C8B7] bg-transparent text-[#3F493F] hover:border-[#A9906A] hover:bg-[#EEE8DD]",
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
