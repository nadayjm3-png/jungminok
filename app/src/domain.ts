import Decimal from 'decimal.js';
import {type Dataset,type Draft,type Sale,validDate,saleKey} from './model';
Decimal.set({precision:40});
const packaging=new Set(['I10','I11']);
export function validateDraft(d:Dataset,x:Draft,excludeId?:string,existingKeys?:ReadonlySet<string>){
 if(!validDate(x.date))throw new Error('올바른 판매일을 입력해 주세요.');
 const day=d.calendar.find(c=>c.date===x.date);
 if(!day)throw new Error('영업달력에 없는 날짜입니다. 새 날짜의 마감 처리는 다음 단계에서 결정합니다.');
 if(!day.is_open||!day.record_complete)throw new Error('이번 EPIC에서는 마감된 영업일에만 판매를 기록합니다.');
 if(!d.menus.some(m=>m.menu_id===x.menu_id))throw new Error('등록되지 않은 메뉴입니다.');
 if(!['매장','포장'].includes(x.channel))throw new Error('판매 채널을 선택해 주세요.');
 if(!Number.isInteger(x.quantity)||x.quantity<=0)throw new Error('판매수량은 1 이상의 정수여야 합니다.');
 for(const [label,v] of [['판매단가',x.unit_price],['할인 총액',x.discount_amount],['결제 수수료',x.payment_fee]] as const)if(!Number.isSafeInteger(v)||v<0)throw new Error(label+'은 0 이상의 정수 금액(원)이어야 합니다.');
 const gross=new Decimal(x.quantity).mul(x.unit_price);if(gross.gt(Number.MAX_SAFE_INTEGER))throw new Error('판매금액이 처리 가능한 범위를 넘었습니다.');
 if(new Decimal(x.discount_amount).gt(gross))throw new Error('할인 총액이 판매금액보다 큽니다.');
 if(existingKeys?existingKeys.has(saleKey(x)):d.sales.some(s=>s.sale_id!==excludeId&&saleKey(s)===saleKey(x)))throw new Error('같은 날짜·메뉴·채널 기록이 있습니다. 기존 기록을 수정해 주세요.');
}
export function costFor(d:Dataset,menuId:string,version:string,channel:string,date:string){
 const recipes=d.recipes.filter(r=>r.menu_id===menuId&&r.recipe_version===version&&(!r.channel_only||r.channel_only===channel));
 if(!recipes.length)throw new Error('적용 레시피가 없습니다.');
 let food=new Decimal(0),pack=new Decimal(0);const usage:{name:string;material_id:string;quantity:number;unit:string}[]=[];
 for(const r of recipes){const m=d.materials.find(m=>m.material_id===r.material_id);if(!m||m.unit!==r.unit)throw new Error('레시피 재료/단위 연결 오류');
 const prices=d.price_history.filter(p=>p.material_id===r.material_id&&p.effective_date<=date).sort((a,b)=>b.effective_date.localeCompare(a.effective_date));
 const p=prices[0];if(!p||p.pack_quantity<=0)throw new Error(m.name+'의 판매일 가격 이력이 없습니다.');
 const cost=new Decimal(p.pack_price).div(p.pack_quantity).mul(r.quantity);if(packaging.has(r.material_id))pack=pack.plus(cost);else food=food.plus(cost);
 usage.push({name:m.name,material_id:m.material_id,quantity:r.quantity,unit:r.unit});}
 return {food:food.toNumber(),pack:pack.toNumber(),usage};
}
export function makeSale(d:Dataset,x:Draft,previous?:Sale,existingKeys?:ReadonlySet<string>):Sale{
 validateDraft(d,x,previous?.sale_id,existingKeys);
 const menu=d.menus.find(m=>m.menu_id===x.menu_id)!;
 const keep=previous&&previous.date===x.date&&previous.menu_id===x.menu_id&&previous.channel===x.channel;
 const version=keep?previous.recipe_version:menu.recipe_version;
 const c=keep?{food:previous.unit_food_cost_snapshot,pack:previous.unit_packaging_cost_snapshot}:costFor(d,x.menu_id,version,x.channel,x.date);
 return {...x,sale_id:previous?.sale_id??crypto.randomUUID(),net_sales:new Decimal(x.quantity).mul(x.unit_price).minus(x.discount_amount).toNumber(),recipe_version:version,unit_food_cost_snapshot:c.food,unit_packaging_cost_snapshot:c.pack};
}
export function filterSales(d:Dataset,start:string,end:string,channel='',menu='',search=''){
 if(!validDate(start)||!validDate(end)||start>end)throw new Error('조회 시작일과 종료일을 확인해 주세요.');
 const q=search.trim().toLowerCase();
 return d.sales.filter(s=>s.date>=start&&s.date<=end&&(!channel||s.channel===channel)&&(!menu||s.menu_id===menu)&&(!q||(d.menus.find(m=>m.menu_id===s.menu_id)?.name+' '+s.sale_id).toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||a.menu_id.localeCompare(b.menu_id)||a.channel.localeCompare(b.channel));
}
export function totals(sales:Sale[]){let qty=0,net=new Decimal(0),food=new Decimal(0),pack=new Decimal(0),fee=new Decimal(0),discount=new Decimal(0);
 for(const s of sales){for(const v of [s.net_sales,s.quantity,s.unit_food_cost_snapshot,s.unit_packaging_cost_snapshot,s.payment_fee])if(!Number.isFinite(v))throw new Error('원가/판매값 누락: '+s.sale_id);qty+=s.quantity;net=net.plus(s.net_sales);food=food.plus(new Decimal(s.unit_food_cost_snapshot).mul(s.quantity));pack=pack.plus(new Decimal(s.unit_packaging_cost_snapshot).mul(s.quantity));fee=fee.plus(s.payment_fee);discount=discount.plus(s.discount_amount);}
 const profit=net.minus(food).minus(pack).minus(fee);return {qty,net:net.toNumber(),food:food.toNumber(),pack:pack.toNumber(),fee:fee.toNumber(),discount:discount.toNumber(),profit:profit.toNumber(),per:qty?profit.div(qty).toNumber():null,margin:net.isZero()?null:profit.div(net).mul(100).toNumber()};
}
export function profitability(d:Dataset,start:string,end:string){const selected=filterSales(d,start,end);return d.menus.map(m=>{try{return {menu:m,...totals(selected.filter(s=>s.menu_id===m.menu_id)),error:''};}catch(e){return {menu:m,...totals([]),error:(e as Error).message};}});}
export function inventory(d:Dataset,asOf=d.meta.as_of){return d.materials.map(m=>{
 try{const openings=d.opening_inventory.filter(o=>o.material_id===m.material_id&&o.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date));if(openings.length!==1)throw new Error('초기재고가 없거나 기준이 중복됩니다.');
 const opening=openings[0];if(opening.unit!==m.unit)throw new Error('초기재고 단위가 다릅니다.');let qty=new Decimal(opening.quantity);
 const daily=new Map<string,{delta:Decimal;counted?:number}>();const day=(date:string)=>{if(!daily.has(date))daily.set(date,{delta:new Decimal(0)});return daily.get(date)!;};
 for(const s of d.sales){if(s.date<opening.date||s.date>asOf)continue;const rules=d.recipes.filter(r=>r.menu_id===s.menu_id&&r.recipe_version===s.recipe_version);if(!rules.length)throw new Error('판매 레시피 누락: '+s.sale_id);
 for(const r of rules){if(r.material_id!==m.material_id||r.channel_only&&r.channel_only!==s.channel)continue;if(r.unit!==m.unit)throw new Error('레시피 단위 오류');day(s.date).delta=day(s.date).delta.minus(new Decimal(r.quantity).mul(s.quantity));}}
 for(const e of d.inventory_events){if(e.material_id!==m.material_id||e.date<opening.date||e.date>asOf)continue;if(e.unit!==m.unit)throw new Error('재고 단위 오류');const a=day(e.date);
 if(e.event_type==='실사조정'){if(e.counted_quantity===undefined)throw new Error('실측수량 누락');if(a.counted!==undefined)throw new Error('같은 날 실사 순서 확인 필요');a.counted=e.counted_quantity;}else a.delta=a.delta.plus(e.quantity);}
 for(const date of [...daily.keys()].sort()){const a=daily.get(date)!;qty=qty.plus(a.delta);if(a.counted!==undefined)qty=new Decimal(a.counted);}
 return {material:m,quantity:qty.toNumber(),error:'',warning:qty.isNegative()?'음수 잔량 · 기록 점검 필요':''};
 }catch(e){return {material:m,quantity:null,error:(e as Error).message,warning:''};}});}
