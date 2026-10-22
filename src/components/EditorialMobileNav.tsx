import { NavLink } from "react-router-dom";
import { Grid2X2, Heart, Home, Search, UserRound } from "lucide-react";
import { useStore } from "@/store/useStore";

const EditorialMobileNav = () => {
  const customer = useStore((state) => state.customer);
  const links = [
    { to: "/home", label: "الرئيسية", icon: Home },
    { to: "/categories", label: "الأقسام", icon: Grid2X2 },
    { to: "/products", label: "اكتشف", icon: Search },
    { to: "/favorites", label: "المفضلة", icon: Heart },
    { to: customer ? "/account" : "/auth", label: "حسابي", icon: UserRound },
  ];
  return (
    <nav
      dir="rtl"
      className="genan-mobile-editorial-nav fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[570px] items-center justify-around gap-1 rounded-[22px] border border-white/20 bg-[#101A16]/95 p-2 shadow-[0_18px_46px_rgba(0,0,0,.44)] backdrop-blur-xl md:hidden"
      aria-label="التنقل السريع"
    >
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          end={to === "/home"}
          className={({ isActive }) =>
            `flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[16px] px-1 text-[10px] transition-colors ${isActive ? "bg-[#234536] text-[#F9FAF3]" : "text-[#CFD8CF] hover:bg-white/10"}`
          }
          aria-label={label}
        >
          <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} aria-hidden="true" />
          <span className="truncate text-[9px]">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default EditorialMobileNav;
