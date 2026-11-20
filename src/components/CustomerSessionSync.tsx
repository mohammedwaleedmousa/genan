import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearCustomerSession, CustomerAuthContext, setCustomerSession } from "@/lib/customerSession";
import { useStore } from "@/store/useStore";

const CustomerSessionSync = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const setCustomer = useStore((state) => state.setCustomer);
  const setRegion = useStore((state) => state.setRegion);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null | undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const nextUser = session?.user ?? null;
      const userId = nextUser?.id ?? null;
      if (userId === currentUserId) return;
      currentUserId = userId;
      setUser(nextUser);

      if (!userId) {
        clearCustomerSession();
        setCustomer(null);
        return;
      }

      // Supabase auth callbacks must return before another Supabase request starts.
      window.setTimeout(async () => {
        if (!active || currentUserId !== userId) return;
        const { data } = await supabase
          .from("customers")
          .select("id,user_id,name,phone,country,region,avatar_url")
          .eq("user_id", userId)
          .maybeSingle();
        if (!active || currentUserId !== userId || !data) return;

        const region = data.region || "عدن";
        setCustomer({ id: data.id, name: data.name, phone: data.phone, region });
        setRegion(region);
        setCustomerSession({ ...data, user_id: userId, region, country: data.country || "YE" });
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setCustomer, setRegion]);

  return <CustomerAuthContext.Provider value={user}>{children}</CustomerAuthContext.Provider>;
};

export default CustomerSessionSync;
