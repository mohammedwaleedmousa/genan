import json, uuid, sys
from pathlib import Path
ids={k:str(uuid.uuid4()) for k in ['parent','child','brand','page','section','product','home','filter','delivery','payment','coupon','campaign','notification','rule']}
steps=[]
def step(name,sql): steps.append({'name':name,'sql':sql})
def create(name,table,payload,read=True):
 cols=','.join('"'+k+'"' for k in payload)
 data=json.dumps(payload,ensure_ascii=False).replace("'","''")
 step(name+' create',f'insert into public.{table} ({cols}) select {cols} from jsonb_populate_record(null::public.{table},\'{data}\'::jsonb)')
 pk='id' if 'id' in payload else 'code' if 'code' in payload else 'key'
 val=str(payload[pk]);pred=f'"{pk}"=\'{val}\''
 if read: step(name+' read',f'select {cols} from public.{table} where {pred}')
 field='is_active' if 'is_active' in payload else next(k for k in payload if k not in ['id','code','key'])
 step(name+' update',f'update public.{table} set "{field}"="{field}" where {pred}')
base={'countries':['GLOBAL'],'is_active':False,'sort_order':0}
create('parent category','categories',dict(id=ids['parent'],name='QA parent',name_ar='اختبار مؤقت',slug='qa-'+ids['parent'],image_url=None,description_ar=None,parent_id=None,**base))
create('child category','categories',dict(id=ids['child'],name='QA child',name_ar='اختبار فرعي',slug='qa-'+ids['child'],image_url=None,description_ar=None,parent_id=ids['parent'],**base))
create('brand','brands',dict(id=ids['brand'],name='QA brand',slug='qa-'+ids['brand'],logo_url=None,hero_image=None,description=None,**base))
create('brand category link','brand_categories',dict(id=str(uuid.uuid4()),brand_id=ids['brand'],category_id=ids['child']))
create('homepage section','homepage_sections',dict(id=ids['home'],title='QA section',title_ar='اختبار مؤقت',section_type='products',filter_type='featured',max_products=8,show_view_all=True,view_all_link='/products',**base))
create('brand page','brand_pages',dict(id=ids['page'],brand_id=ids['brand'],title='QA brand page',description=None,hero_image=None,is_active=False))
create('brand section','brand_sections',dict(id=ids['section'],brand_id=ids['brand'],brand_page_id=ids['page'],name='QA brand section',slug='qa-'+ids['section'],image_url=None,description=None,sort_order=0,is_active=False))
create('brand filter','brand_filters',dict(id=ids['filter'],brand_id=ids['brand'],section_id=ids['section'],name='QA filter',slug='qa-'+ids['filter'],filter_type='multi',options=['M','L'],sort_order=0,is_active=False))
p=dict(id=ids['product'],name='QA product',name_ar='اختبار منتج مؤقت',slug='qa-'+ids['product'],price=10,original_price=None,discount=0,description='',description_ar='',category='qa-'+ids['child'],brand='QA brand',category_id=ids['child'],brand_id=ids['brand'],audience=None,in_stock=True,stock_quantity=5,is_featured=False,is_best_seller=False,is_active=False,countries=['GLOBAL'],section_ids=[ids['home']],home_collections=[],has_sizes=False,sizes=[],accessories=[{'name':'QA','name_ar':'اختبار','price':1}],features=[{'icon':'truck','title':'QA','desc':'QA'}],color_variants=[],return_policy='QA',specs=[{'label':'QA','value':'QA'}],has_quality_variants=True,quality_variants=[{'name':'QA','price':12,'description':'QA','images':[],'in_stock':True}])
create('full product form','products',p)
step('product cost upsert',f"insert into public.product_costs(product_id,cost_price,updated_at) values('{ids['product']}',3,now()) on conflict(product_id) do update set cost_price=excluded.cost_price,updated_at=excluded.updated_at")
step('product default inventory',f"select public.replace_product_inventory_skus('{ids['product']}','[{{\"variant_key\":\"default\",\"label\":\"QA\",\"stock_quantity\":5,\"is_default\":true}}]'::jsonb)")
create('brand product assignment','brand_section_products',dict(id=str(uuid.uuid4()),section_id=ids['section'],product_id=ids['product']))
create('size price rule','size_price_rules',dict(id=ids['rule'],name='QA rule',adjustments={'M':2},is_active=False))
create('banner','banners',dict(id=str(uuid.uuid4()),title='QA',title_ar='اختبار',subtitle=None,subtitle_ar=None,image_url='/placeholder.svg',cta_text=None,cta_text_ar=None,cta_link='/products',image_zoom=1,image_position_x=50,image_position_y=50,page_slug='qa-'+str(uuid.uuid4()),page_title_ar=None,page_content_ar=None,**base))
create('offer','offers',dict(id=str(uuid.uuid4()),title='QA',title_ar='اختبار',subtitle=None,subtitle_ar=None,description=None,description_ar=None,image_url=None,mobile_image_url=None,badge_text=None,cta_label=None,cta_url=None,discount_code=None,discount_percentage=10,offer_type='standard',apply_to_all=False,start_date=None,end_date=None,is_featured=False,product_ids=[ids['product']],**base))
create('coupon','coupons',dict(id=ids['coupon'],code='QA'+uuid.uuid4().hex[:12].upper(),type='percentage',value=10,is_active=False,countries=['GLOBAL']))
create('campaign','campaign_pages',dict(id=ids['campaign'],slug='qa-'+ids['campaign'],title='QA',title_ar='اختبار',description=None,description_ar=None,image_url=None,mobile_image_url=None,badge_text=None,cta_label=None,cta_url=None,page_type='campaign',product_ids=[ids['product']],is_active=False,sort_order=0,starts_at=None,ends_at=None,seo_title=None,seo_description=None))
create('delivery company','delivery_companies',dict(id=ids['delivery'],name='QA delivery',country='YE',base_fee=5,delivery_days='1-2',service_scope='all',is_active=False))
create('cod region','cod_regions',dict(id=str(uuid.uuid4()),country='YE',region_name='QA '+str(uuid.uuid4()),region_name_ar='اختبار',is_active=False))
create('country','countries',dict(code='QA'+uuid.uuid4().hex[:5],name_ar='اختبار',name_en='QA country',flag_emoji='',phone_code='',default_currency='SAR',is_featured=False,is_active=False,sort_order=999))
create('currency','currencies',dict(code='Q'+uuid.uuid4().hex[:4].upper(),name_ar='اختبار',name_en='QA currency',symbol='QA',rate_to_base=1,is_base=False,is_active=False,sort_order=999))
# Supported checkout codes are intentionally limited; verify existing methods without changing them.
step('payment methods read','select id,code,name,name_ar,type,account_id,details,is_active,sort_order from public.payment_methods')
step('payment methods update','update public.payment_methods set name=name where id=(select id from public.payment_methods limit 1)')
create('payment settlement','payment_settlements',dict(id=str(uuid.uuid4()),payment_method_id=None,settlement_date='2026-11-16',expected_amount=0,actual_amount=0,status='pending',notes='QA rollback',created_by=None))
create('expense','expenses',dict(id=str(uuid.uuid4()),expense_date='2026-11-16',amount=1,description='QA rollback',vendor=None,category_id=None,payment_method_id=None,receipt_url=None,notes=None,currency_mode='SAR',currency_code='SAR',amount_base=1,created_by=None))
create('sales agent','sales_agents',dict(id=str(uuid.uuid4()),name='QA agent',code='QA'+uuid.uuid4().hex[:12].upper(),platform=None,is_active=False))
create('admin product review','product_reviews',dict(id=str(uuid.uuid4()),product_id=ids['product'],customer_name='QA',rating=5,comment='QA rollback',country='YE',is_approved=False,images=[]))
create('site setting','site_settings',dict(id=str(uuid.uuid4()),key='qa-'+str(uuid.uuid4()),value={'qa':True}))
create('site content','site_content',dict(id=str(uuid.uuid4()),key='qa-'+str(uuid.uuid4()),title='QA content',content='QA',content_ar='اختبار',description=None))
create('certification image','certification_images',dict(id=str(uuid.uuid4()),image_url='/placeholder.svg',sort_order=999,is_active=False))
# In-app draft only; nothing is sent and the whole transaction is rolled back.
create('in-app notification','customer_notifications',dict(id=ids['notification'],customer_id=None,user_id=None,customer_phone=None,country='YE',title='QA rollback',body='QA rollback',type='general',link=None,is_read=False,broadcast=False,message='QA rollback',related_order_id=None))
create('notification delivery draft','notification_deliveries',dict(id=str(uuid.uuid4()),notification_id=ids['notification'],customer_id=None,customer_phone=None,channel='inapp',status='pending',attempts=0,payload={}))
step('inventory summary','select * from public.get_inventory_summary()')
step('coupon usage summary','select * from public.coupon_usage_summary()')
step('currency usage summary','select * from public.currency_usage_summary()')
# Atomic create, retry and edit tests use the same payload as the actual form.
aid=str(uuid.uuid4()); ap=dict(p); ap.pop('id'); ap['slug']='qa-'+aid
aj=json.dumps(ap,ensure_ascii=False).replace("'","''")
inv='[{"variant_key":"default","label":"QA","stock_quantity":5,"is_default":true}]'
step('atomic product create',f"select public.admin_save_product('{aid}','{aj}'::jsonb,3,'{inv}'::jsonb,true)")
step('atomic product retry same ID',f"select public.admin_save_product('{aid}','{aj}'::jsonb,3,'{inv}'::jsonb,true)")
step('atomic product edit',f"select public.admin_save_product('{aid}','{aj}'::jsonb,4,'{inv}'::jsonb,false)")
badid=str(uuid.uuid4()); badp=dict(ap); badp['slug']='qa-'+badid
bj=json.dumps(badp,ensure_ascii=False).replace("'","''")
step('atomic failed create leaves no partial product',f"""do $verify$ begin
 begin
  perform public.admin_save_product('{badid}','{bj}'::jsonb,3,'[{{"variant_key":"default","stock_quantity":-1}}]'::jsonb,true);
  raise exception 'Invalid stock accepted';
 exception when raise_exception then
  if sqlerrm not like '%سالب%' then raise; end if;
 end;
 assert not exists(select 1 from public.products where id='{badid}'), 'Partial product survived';
 assert not exists(select 1 from public.product_costs where product_id='{badid}'), 'Partial cost survived';
end; $verify$;""")
cp=dict(ap); cp['price']=999
cj=json.dumps(cp,ensure_ascii=False).replace("'","''")
step('atomic failed edit preserves previous product and cost',f"""do $verify$ begin
 begin
  perform public.admin_save_product('{aid}','{cj}'::jsonb,999,'[{{"variant_key":"default","stock_quantity":-1}}]'::jsonb,false);
  raise exception 'Invalid stock accepted';
 exception when raise_exception then
  if sqlerrm not like '%سالب%' then raise; end if;
 end;
 assert (select price=10 and stock_quantity=5 from public.products where id='{aid}'), 'Failed edit changed product';
 assert (select cost_price=4 from public.product_costs where product_id='{aid}'), 'Failed edit changed cost';
end; $verify$;""")
# Ledger entries and reversals remain inside the rollback-only audit transaction.
accounts=[str(uuid.uuid4()),str(uuid.uuid4())]
for i,account in enumerate(accounts):
 create('ledger account '+str(i),'chart_of_accounts',dict(id=account,code='QA'+uuid.uuid4().hex[:12],name='QA account',name_ar='اختبار',type='asset' if i==0 else 'equity',is_active=True))
ref='qa-'+str(uuid.uuid4())
lines=json.dumps([dict(account_id=accounts[0],debit=1,credit=0),dict(account_id=accounts[1],debit=0,credit=1)])
step('manual journal create',f"select public.create_manual_journal_entry(current_date,'{ref}','QA rollback','SAR','{lines}'::jsonb)")
step('manual journal balance',f"do $verify$ begin assert (select sum(l.debit)=sum(l.credit) and count(*)=2 from public.transaction_lines l join public.financial_transactions t on t.id=l.transaction_id where t.reference='{ref}'), 'Unbalanced journal'; end; $verify$;")
step('manual journal reversal',f"select public.reverse_journal_entry((select id from public.financial_transactions where reference='{ref}'),current_date,'QA rollback reversal')")
# Reproduce invoice and refund submissions with their actual UI payloads.
oid=str(uuid.uuid4())
op=dict(id=oid,order_number='INV-QA-'+uuid.uuid4().hex[:8],customer_name='QA rollback',customer_phone='+967700000000',customer_address='QA rollback',customer_notes=None,customer_city='عدن',customer_region='عدن',country='GLOBAL',items=[dict(product_id=ids['product'],product_name='QA',product_image='',quantity=1,price=10)],subtotal=10,delivery_fee=0,discount_amount=0,coupon_code=None,total=10,total_base=10,delivery_company_id=None,payment_method='cod',status='pending',currency_mode='SAR',currency_code='SAR',exchange_rate_snapshot=1,invoice_review_status='unreviewed',invoice_reviewed_at=None,invoice_reviewed_by=None,invoice_review_note=None)
create('catalog invoice','orders',op)
mp=dict(op);mp['id']=str(uuid.uuid4());mp['order_number']='INV-QA-'+uuid.uuid4().hex[:8];mp['items']=[dict(product_id='manual-123-0',product_name='QA manual',quantity=1,price=10)]
create('manual invoice','orders',mp)
ritems=json.dumps([dict(product_id=ids['product'],product_name='QA',refund_quantity=1,price=10)])
step('order refund create',f"select public.create_refund_request('{oid}',null,null,'QA',null,1,'QA refund','cash',null,'{ritems}'::jsonb,'SAR','partial')")

# Stock transitions cover both catalog products and stockless manual lines.
step('catalog invoice confirmation',f"update public.orders set status='confirmed' where id='{oid}'")
step('manual invoice confirmation',f"update public.orders set status='confirmed' where id='{mp['id']}'")
step('manual invoice cancellation',f"update public.orders set status='cancelled' where id='{mp['id']}'")
refid=f"(select id from public.refunds where order_id='{oid}' limit 1)"
for status in ['approved','processing','completed']:
 step('catalog refund '+status,f"select public.update_refund_status({refid},'{status}','QA rollback')")

# All stock adjustment modes calculate total_cost in the database.
for kind,qty in [('increase',2),('decrease',1),('damage',1),('recount',5)]:
 step('inventory adjustment '+kind,f"select public.apply_inventory_adjustment('{ids['product']}','{kind}',{qty},'QA rollback',null,null,null)")
step('inventory generated cost assertion',f"do $verify$ begin assert not exists(select 1 from public.inventory_adjustments where product_id='{ids['product']}' and total_cost <> abs(quantity_change)*coalesce(unit_cost,0)), 'Generated inventory cost is incorrect'; end; $verify$;")

# Protected helpers and writes must continue to reject non-admin callers.
step('anonymous helper privileges',"do $verify$ begin assert not has_function_privilege('anon','public.admin_save_product(uuid,jsonb,numeric,jsonb,boolean)','EXECUTE'); assert not has_function_privilege('anon','public.coupon_usage_summary()','EXECUTE'); assert not has_function_privilege('anon','public.create_manual_journal_entry(date,text,text,text,jsonb)','EXECUTE'); end; $verify$;")
step('nonadmin product and coupon writes denied',f"""do $verify$
declare v_claims text := current_setting('request.jwt.claims',true); v_sub text := current_setting('request.jwt.claim.sub',true);
begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
 perform set_config('request.jwt.claim.sub',(current_setting('request.jwt.claims',true)::jsonb->>'sub'),true);
 begin
  perform public.admin_save_product(gen_random_uuid(),'{{}}'::jsonb,0,'[]'::jsonb,true);
  raise exception 'Nonadmin product save succeeded';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.coupons(code,type,value) values('QA-DENIED-'||gen_random_uuid(),'percentage',1);
  raise exception 'Nonadmin coupon insert succeeded';
 exception when insufficient_privilege then null;
 end;
 perform set_config('request.jwt.claims',v_claims,true);
 perform set_config('request.jwt.claim.sub',v_sub,true);
end; $verify$;""")

# Safe deletion APIs are tested only against fixtures created above.
step('safe coupon deletion',f"select public.delete_coupon_safe('{ids['coupon']}')")
step('safe product deletion',f"select public.delete_product_from_inventory('{aid}')")

# Every operation executes as authenticated admin, including RLS and column privileges.
blob=json.dumps(steps,ensure_ascii=False).replace("'","''")
sql="""create or replace function pg_temp.audit_admin_additions() returns jsonb language plpgsql security invoker as $audit$
declare
  v_actor uuid;
  v_step jsonb;
  v_results jsonb := '[]';
  v_rows bigint;
begin
  select user_id into v_actor from public.user_roles where role='admin'::public.app_role limit 1;
  if v_actor is null then raise exception 'Admin fixture required'; end if;
  begin
    perform set_config('request.jwt.claims',jsonb_build_object('sub',v_actor,'role','authenticated','aal','aal1')::text,true);
    perform set_config('request.jwt.claim.sub',v_actor::text,true);
    perform set_config('role','authenticated',true);
    for v_step in select value from jsonb_array_elements('STEPS'::jsonb)
    loop
      begin
        execute v_step->>'sql';
        get diagnostics v_rows = row_count;
        if v_rows=0 and v_step->>'name' not like '%summary' and v_step->>'sql' not like 'do %' then raise exception 'Operation affected no rows'; end if;
        v_results := v_results || jsonb_build_array(jsonb_build_object('name',v_step->>'name','status','PASS','rows',v_rows));
      exception when others then
        v_results := v_results || jsonb_build_array(jsonb_build_object('name',v_step->>'name','status','FAIL','code',sqlstate,'error',sqlerrm));
      end;
    end loop;
    raise exception using errcode='PZ001',message='Rollback audit fixtures';
  exception when sqlstate 'PZ001' then null;
  end;
  return v_results;
end;
$audit$;
select pg_temp.audit_admin_additions() as results;
""".replace('STEPS',blob)
Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/genan-admin-additions-audit.sql').write_text(sql)
print(len(steps),'operations; fixtures rolled back inside subtransaction')
