import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Copy, RefreshCw, ShieldCheck } from "lucide-react";

type RecoveryRequest = { id:string; phone:string; status:string; created_at:string; expires_at:string|null };
const AdminPasswordRecoveryPage=()=>{
 const [items,setItems]=useState<RecoveryRequest[]>([]);
 const [loading,setLoading]=useState(false);
 const [processing,setProcessing]=useState<string|null>(null);
 const [approvedCode,setApprovedCode]=useState<{code:string;phone:string}|null>(null);
 const api=async(body:Record<string,unknown>)=>{
   const {data,error}=await supabase.functions.invoke("genan-password-recovery",{body});
   if(error||data?.error)throw new Error(data?.error||"تعذر تنفيذ الطلب");
   return data;
 };
 const refresh=async()=>{setLoading(true);try{const result=await api({action:"list"});setItems(result.requests||[]);}catch(e:any){toast({title:"تعذر تحميل الطلبات",description:e.message,variant:"destructive"});}finally{setLoading(false)}};
 useEffect(()=>{void refresh()},[]);
 const review=async(item:RecoveryRequest,action:"approve"|"reject")=>{
   if(action==="approve"&&!window.confirm("لا توافق إلا بعد التحقق من ملكية الحساب بالتواصل مع العميل. موافق؟"))return;
   setProcessing(item.id);setApprovedCode(null);
   try {const result=await api({action,id:item.id});if(action==="approve")setApprovedCode({code:result.code,phone:item.phone});toast({title:action==="approve"?"تمت الموافقة وإصدار رمز صالح لمدة 15 دقيقة":"تم رفض الطلب"});await refresh();}
   catch(e:any){toast({title:"تعذر تنفيذ الطلب",description:e.message,variant:"destructive"});}finally{setProcessing(null)}
 };
 return <main dir="rtl" className="mx-auto max-w-5xl space-y-5 p-4 sm:p-7">
   <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-[#F6F3EA] p-5">
    <div><span className="text-xs tracking-widest text-[#8C6B32]">GENAN / SECURITY</span><h1 className="mt-2 text-xl font-bold">طلبات استعادة كلمة المرور</h1><p className="mt-2 text-sm text-[#77716A]">راجع هوية صاحب الحساب قبل إصدار أي رمز. لا تطلب كلمة مروره القديمة.</p></div>
    <button onClick={()=>void refresh()} disabled={loading} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm"><RefreshCw size={15}/>{loading?"جارٍ التحديث":"تحديث"}</button>
   </header>
   {approvedCode&&<div className="rounded-2xl border border-[#D8C29A] bg-white p-5">
      <div className="flex items-center gap-2 font-bold"><ShieldCheck size={18}/> رمز جديد للعميل {approvedCode.phone}</div>
      <p className="my-2 text-sm text-[#77716A]">يظهر هنا مرة واحدة فقط، وينتهي خلال 15 دقيقة. أرسله للعميل بعد التحقق من هويته، ثم أغلقه.</p>
      <div className="flex flex-wrap items-center gap-3"><code dir="ltr" className="max-w-full break-all rounded-xl bg-[#F6F3EA] p-3 text-sm">{approvedCode.code}</code><button className="flex items-center gap-2 rounded-xl bg-[#171717] px-4 py-3 text-white" onClick={()=>void navigator.clipboard.writeText(approvedCode.code)}><Copy size={15}/> نسخ</button><button onClick={()=>setApprovedCode(null)} className="rounded-xl border px-4 py-3">إخفاء</button></div>
   </div>}
   <div className="space-y-3">{items.length===0?<div className="rounded-2xl bg-white p-8 text-center text-sm text-[#77716A]">لا توجد طلبات</div>:items.map(item=><article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ECE8DF] bg-white p-4">
      <div><p dir="ltr" className="text-right font-semibold">{item.phone}</p><p className="mt-1 text-xs text-[#77716A]">{new Date(item.created_at).toLocaleString("ar")}</p><p className="mt-1 text-xs text-[#8C6B32]">{item.status==="pending"?"بانتظار المراجعة":item.status==="approved"?"تمت الموافقة":item.status==="completed"?"مكتمل":"مرفوض"}</p></div>
      {item.status==="pending"&&<div className="flex gap-2"><button disabled={!!processing} onClick={()=>void review(item,"approve")} className="rounded-xl bg-[#171717] px-4 py-2.5 text-sm text-white">موافقة</button><button disabled={!!processing} onClick={()=>void review(item,"reject")} className="rounded-xl border px-4 py-2.5 text-sm">رفض</button></div>}
    </article>)}</div>
 </main>;
};
export default AdminPasswordRecoveryPage;
