import {z} from 'zod';
export interface Supplier {supplier_id:string;name:string;data_class?:string}
export interface Material {material_id:string;name:string;unit:string;pack_quantity:number;base_pack_price:number;lead_days:number;safety_days:number;supplier_id:string}
export interface Menu {menu_id:string;name:string;price:number;category:string;recipe_version:string}
export interface Recipe {recipe_version:string;menu_id:string;material_id:string;quantity:number;unit:string;channel_only?:string}
export interface Price {material_id:string;effective_date:string;pack_price:number;pack_quantity:number}
export interface Calendar {date:string;is_open:boolean;record_complete:boolean;weather?:string;note?:string}
export interface Sale {sale_id:string;date:string;menu_id:string;channel:string;quantity:number;unit_price:number;discount_amount:number;net_sales:number;payment_fee:number;recipe_version:string;unit_food_cost_snapshot:number;unit_packaging_cost_snapshot:number}
export interface Opening {material_id:string;date:string;quantity:number;unit:string}
export interface Event {event_id:string;date:string;material_id:string;event_type:string;quantity:number;unit:string;reason?:string;counted_quantity?:number;unit_cost?:number;supplier_id?:string}
export interface Expense {expense_id:string;date:string;category:string;amount:number;recognition?:string}
export interface Plan {month:string;category:string;amount:number}
export interface Dataset {meta:{as_of:string;start_date:string;store_name:string;[key:string]:unknown};suppliers:Supplier[];materials:Material[];menus:Menu[];recipes:Recipe[];price_history:Price[];calendar:Calendar[];sales:Sale[];opening_inventory:Opening[];inventory_events:Event[];expenses:Expense[];monthly_expense_plan:Plan[];settings:Record<string,unknown>}
export interface Snapshot {data:Dataset;revision:number}
export interface Draft {date:string;menu_id:string;channel:string;quantity:number;unit_price:number;discount_amount:number;payment_fee:number}
export function validDate(v:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const t=new Date(v+'T12:00:00Z');return !isNaN(+t)&&t.toISOString().slice(0,10)===v;}
const num=z.number().finite(); const pos=num.positive(); const text=z.string().min(1);
const date=text.refine(validDate,'날짜 형식이 올바르지 않습니다.');
const schema=z.object({
 meta:z.object({as_of:date,start_date:date,store_name:text}).passthrough(),settings:z.record(z.string(),z.unknown()),
 suppliers:z.array(z.object({supplier_id:text,name:text}).passthrough()),
 materials:z.array(z.object({material_id:text,name:text,unit:z.enum(['g','ml','개']),pack_quantity:pos,base_pack_price:num.nonnegative(),lead_days:num.int().nonnegative(),safety_days:num.int().nonnegative(),supplier_id:text}).passthrough()),
 menus:z.array(z.object({menu_id:text,name:text,price:num.nonnegative(),category:text,recipe_version:text})),
 recipes:z.array(z.object({recipe_version:text,menu_id:text,material_id:text,quantity:pos,unit:text,channel_only:z.string().optional()})),
 price_history:z.array(z.object({material_id:text,effective_date:date,pack_price:num.nonnegative(),pack_quantity:pos})),
 calendar:z.array(z.object({date,is_open:z.boolean(),record_complete:z.boolean()}).passthrough()),
 sales:z.array(z.object({sale_id:text,date,menu_id:text,channel:z.enum(['매장','포장']),quantity:num.int().nonnegative(),unit_price:num.nonnegative(),discount_amount:num.nonnegative(),net_sales:num.nonnegative(),payment_fee:num.nonnegative(),recipe_version:text,unit_food_cost_snapshot:num.nonnegative(),unit_packaging_cost_snapshot:num.nonnegative()})),
 opening_inventory:z.array(z.object({material_id:text,date,quantity:num.nonnegative(),unit:text})),
 inventory_events:z.array(z.object({event_id:text,date,material_id:text,event_type:z.enum(['입고','폐기','실사조정']),quantity:num,unit:text,counted_quantity:num.nonnegative().optional(),unit_cost:num.nonnegative().optional(),supplier_id:z.string().optional()}).passthrough()),
 expenses:z.array(z.object({expense_id:text,date,category:z.enum(['임차료','인건비','사업주 부담 보험료','관리비','수도광열비','통신·소프트웨어','광고비','소모품·청소비']),amount:num.nonnegative()}).passthrough()),
 monthly_expense_plan:z.array(z.object({month:text.regex(/^\d{4}-(0[1-9]|1[0-2])$/),category:z.enum(['임차료','인건비','사업주 부담 보험료','관리비','수도광열비','통신·소프트웨어','광고비','소모품·청소비']),amount:num.nonnegative()})),
});
function unique(values:string[],label:string){if(new Set(values).size!==values.length)throw new Error(label+'에 중복된 ID 또는 연결 키가 있습니다.');}
export const recipeKey=(r:Recipe)=>JSON.stringify([r.recipe_version,r.menu_id,r.material_id,r.channel_only||'']);
export const priceKey=(r:Price)=>r.material_id+'|'+r.effective_date;
export const saleKey=(s:Draft)=>s.date+'|'+s.menu_id+'|'+s.channel;
export function validateDataset(value:unknown):Dataset {
 const parsed=schema.safeParse(value);if(!parsed.success){const e=parsed.error.issues[0];throw new Error('자료 오류: '+e.path.join('.')+' '+e.message);}
 const d=parsed.data as Dataset; const menus=new Map(d.menus.map(m=>[m.menu_id,m]));const mats=new Map(d.materials.map(m=>[m.material_id,m]));const sups=new Set(d.suppliers.map(s=>s.supplier_id));const days=new Set(d.calendar.map(c=>c.date));
 unique(d.suppliers.map(s=>s.supplier_id),'공급사'); unique(d.materials.map(s=>s.material_id),'재료');unique(d.menus.map(s=>s.menu_id),'메뉴');unique(d.recipes.map(recipeKey),'레시피');unique(d.price_history.map(priceKey),'가격 이력');unique(d.calendar.map(s=>s.date),'영업달력');unique(d.sales.map(s=>s.sale_id),'판매');unique(d.sales.map(saleKey),'판매 집계');unique(d.opening_inventory.map(s=>s.material_id+'|'+s.date),'초기재고');unique(d.inventory_events.map(s=>s.event_id),'재고');unique(d.expenses.map(s=>s.expense_id),'비용');unique(d.monthly_expense_plan.map(s=>s.month+'|'+s.category),'월계획');
 if(!days.has(d.meta.as_of))throw new Error('기준일의 영업달력이 없습니다.');
 for(const m of d.materials)if(!sups.has(m.supplier_id))throw new Error('재료 공급사 연결 오류: '+m.material_id);
 for(const r of d.recipes)if(!menus.has(r.menu_id)||!mats.has(r.material_id)||mats.get(r.material_id)!.unit!==r.unit)throw new Error('레시피 연결/단위 오류: '+r.menu_id);
 for(const p of d.price_history)if(!mats.has(p.material_id))throw new Error('가격 재료 연결 오류');
 for(const s of d.sales)if(!menus.has(s.menu_id)||!days.has(s.date)||!d.recipes.some(r=>r.menu_id===s.menu_id&&r.recipe_version===s.recipe_version))throw new Error('판매 레시피/날짜 연결 오류: '+s.sale_id);
 for(const r of [...d.opening_inventory,...d.inventory_events])if(!mats.has(r.material_id)||mats.get(r.material_id)!.unit!==r.unit)throw new Error('재고 연결/단위 오류: '+r.material_id);
 for(const e of d.inventory_events){if(e.event_type==='입고'&&e.quantity<=0||e.event_type==='폐기'&&e.quantity>=0)throw new Error('재고 증감 방향 오류: '+e.event_id);if(e.event_type==='실사조정'&&e.counted_quantity===undefined)throw new Error('실측수량 누락: '+e.event_id);}
 unique(d.inventory_events.filter(e=>e.event_type==='실사조정').map(e=>e.date+'|'+e.material_id),'같은 날 실사');
 unique(d.expenses.map(e=>e.date+'|'+e.category),'비용 날짜·항목');
 if(d.meta.start_date>d.meta.as_of||!days.has(d.meta.start_date))throw new Error('자료 시작일과 기준일을 확인해 주세요.');
 for(const e of d.expenses)if(!days.has(e.date))throw new Error('비용 날짜의 영업달력이 없습니다.');
 for(const e of d.inventory_events)if(!days.has(e.date)||e.supplier_id&&!sups.has(e.supplier_id))throw new Error('재고 날짜/공급사 연결 오류');
 for(const r of d.recipes)if(r.channel_only&&!['매장','포장'].includes(r.channel_only))throw new Error('레시피 채널 오류');
 return d;
}
