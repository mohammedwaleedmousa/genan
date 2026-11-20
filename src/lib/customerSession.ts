import { createContext } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const CustomerAuthContext = createContext<User | null | undefined>(undefined);

export type CustomerProfile = Pick<Tables<"customers">, "id" | "user_id" | "name" | "phone" | "country" | "region" | "avatar_url" | "created_at">;

export async function loadCustomerProfile(userId: string): Promise<CustomerProfile> {
  const { data } = await supabase
    .from("customers")
    .select("id,user_id,name,phone,country,region,avatar_url,created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data;

  const { data: result, error } = await supabase.functions.invoke("genan-password-register", { body: { action: "profile" } });
  if (error || result?.customer?.user_id !== userId) {
    throw new Error("تعذر تحميل بيانات حسابك. حاول تسجيل الدخول مجددًا.");
  }
  return result.customer;
}

export const customerSignInPath = (returnTo: string) => `/auth?returnTo=${encodeURIComponent(returnTo)}`;

export function customerSignInDestination(value: string | null) {
  const pathname = value?.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  return value && (pathname === "/account" || pathname === "/checkout") ? value : "/home";
}

export type CustomerSession = {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  region?: string;
  country?: string;
  avatar_url?: string | null;
};

export const getCustomerSession = (): CustomerSession | null => {
  try {
    const raw = localStorage.getItem("customer");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id || parsed.id === "guest") return null;
    return parsed as CustomerSession;
  } catch {
    return null;
  }
};

export const setCustomerSession = (customer: CustomerSession) => {
  localStorage.setItem("customer", JSON.stringify(customer));
  if (customer.phone) localStorage.setItem("customer_phone", customer.phone);
};

export const clearCustomerSession = () => {
  localStorage.removeItem("customer");
  localStorage.removeItem("customer_phone");
};
