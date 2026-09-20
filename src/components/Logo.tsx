interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "auth" | "invoice" | "nav" | "footer";
  className?: string;
  invert?: boolean;
  showArabic?: boolean;
}

const sizeClasses = {
  sm: "text-[18px]",
  md: "text-[21px]",
  lg: "text-[26px]",
  xl: "text-[38px]",
};

const Logo = ({
  size = "md",
  variant = "nav",
  className = "",
  invert = false,
  showArabic = false,
}: LogoProps) => {
  return (
    <span
      aria-label={`Genan - ${variant}`}
      className={`inline-flex items-baseline gap-2 leading-none ${invert ? "text-white" : "text-[#0E0E0E]"} ${className}`}
    >
      <span className={`font-serif font-medium tracking-[0.22em] ${sizeClasses[size]}`}>GENAN</span>
      {showArabic && <span className="text-[10px] font-medium tracking-normal opacity-55">جنان</span>}
    </span>
  );
};

export default Logo;
