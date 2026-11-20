import { Copy } from "lucide-react";

import { toast } from "@/hooks/use-toast";

export type CheckoutBankAccount = { bank: string; account: string; name: string };

type CheckoutTransferDetailsProps = {
  accounts: CheckoutBankAccount[];
  remittance?: { name: string; providers: string[] };
};

const copyDetails = async (value: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast({ title: successMessage });
  } catch {
    toast({ title: "تعذر النسخ", description: "يمكنك تحديد البيانات ونسخها يدويًا." });
  }
};

const CheckoutTransferDetails = ({ accounts, remittance }: CheckoutTransferDetailsProps) => {
  if (accounts.length === 0 && !remittance) return null;

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-[#E7E2D9] bg-[#FAF9F7] p-3 sm:p-4">
      {accounts.length > 0 && (
        <section aria-labelledby="checkout-bank-accounts">
          <h3 id="checkout-bank-accounts" className="text-sm font-semibold text-[#171717]">الحسابات البنكية</h3>
          <p className="mb-3 mt-1 text-xs leading-5 text-[#62594D]">
            إجمالي الطلب بالريال السعودي. تواصلي مع جنان لتأكيد المبلغ عند التحويل بعملة أخرى.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {accounts.map(({ bank, account, name }, index) => (
              <li key={`${account}-${index}`} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[#E7E2D9] bg-white p-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-5 text-[#171717]">{bank}</p>
                  {name && <p className="text-xs leading-5 text-[#62594D]">{name}</p>}
                  <bdi dir="ltr" className="inline-block font-mono text-sm font-semibold text-[#171717]">{account}</bdi>
                </div>
                <button
                  type="button"
                  onClick={() => void copyDetails(account, "تم نسخ رقم الحساب")}
                  aria-label={`نسخ رقم حساب ${bank}`}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#E7E2D9] text-burgundy transition-colors hover:bg-burgundy-soft"
                >
                  <Copy aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {remittance && (
        <section aria-labelledby="checkout-remittance" className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E2D9] bg-white p-3">
          <div className="min-w-0">
            <h3 id="checkout-remittance" className="text-sm font-semibold text-[#171717]">الحوالة عبر {remittance.providers.join(" أو ")}</h3>
            <p className="mt-1 text-xs leading-5 text-[#62594D]">المستفيد <span className="font-semibold text-[#171717]">{remittance.name}</span></p>
          </div>
          <button
            type="button"
            onClick={() => void copyDetails(remittance.name, "تم نسخ اسم المستفيد")}
            aria-label="نسخ اسم مستفيد الحوالة"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#E7E2D9] text-burgundy transition-colors hover:bg-burgundy-soft"
          >
            <Copy aria-hidden="true" className="size-4" />
          </button>
        </section>
      )}
    </div>
  );
};

export default CheckoutTransferDetails;
