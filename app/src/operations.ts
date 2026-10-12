import Decimal from 'decimal.js';
import {type Dataset,type Expense,type Event,validDate} from './model';
import {inventory,totals} from './domain';

export const expenseCategories=['임차료','인건비','사업주 부담 보험료','관리비','수도광열비','통신·소프트웨어','광고비','소모품·청소비'];
export type Period='일'|'주'|'월'|'분기'|'반기'|'연간';
const iso=(d:Date)=>d.toISOString().slice(0,10);
export function periodRange(date:string,period:Period){
 if(!validDate(date))throw new Error('조회 기준 날짜를 확인해 주세요.');
 const t=new Date(date+'T12:00:00Z'),y=t.getUTCFullYear(),m=t.getUTCMonth();let start=date,end=date;
 if(period==='주'){t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7);start=iso(t);t.setUTCDate(t.getUTCDate()+6);end=iso(t);}
 if(period!=='일'&&period!=='주'){const months=period==='월'?1:period==='분기'?3:period==='반기'?6:12;const first=Math.floor(m/months)*months;start=iso(new Date(Date.UTC(y,first,1,12)));end=iso(new Date(Date.UTC(y,first+months,0,12)));}
 return {start,end};
}
export function datesBetween(start:string,end:string){if(!validDate(start)||!validDate(end)||start>end)throw new Error('조회 날짜를 확인해 주세요.');const out:string[]=[];const t=new Date(start+'T12:00:00Z');while(iso(t)<=end){out.push(iso(t));t.setUTCDate(t.getUTCDate()+1);}return out;}
export function recordDate(d:Dataset,date:string){if(!validDate(date)||date<d.meta.start_date||date>d.meta.as_of||!d.calendar.some(c=>c.date===date))throw new Error('기록일은 자료 시작일~마감 기준일의 달력 날짜여야 합니다.');}
export interface ExpenseDraft {date:string;category:string;amount:number}
export function makeExpense(d:Dataset,x:ExpenseDraft,previous?:Expense):Expense{
 recordDate(d,x.date);if(!expenseCategories.includes(x.category))throw new Error('제공 자료의 비용 항목을 선택해 주세요.');
 if(!Number.isSafeInteger(x.amount)||x.amount<0)throw new Error('비용은 0 이상의 정수 금액(원)으로 입력해 주세요.');
 if(d.expenses.some(e=>e.expense_id!==previous?.expense_id&&e.date===x.date&&e.category===x.category))throw new Error('같은 날짜·항목 비용이 있습니다. 기존 기록을 수정해 주세요.');
 return {...previous,...x,expense_id:previous?.expense_id??crypto.randomUUID(),recognition:previous?.recognition??'직접 입력'};
}
export interface EventDraft {date:string;material_id:string;event_type:'입고'|'폐기'|'실사조정';quantity:number;supplier_id?:string;unit_cost?:number;reason?:string}
export function makeEvent(d:Dataset,x:EventDraft){
 recordDate(d,x.date);const m=d.materials.find(m=>m.material_id===x.material_id);if(!m)throw new Error('재료를 선택해 주세요.');
 if(!['입고','폐기','실사조정'].includes(x.event_type))throw new Error('재고 기록 유형을 확인해 주세요.');
 if(!Number.isFinite(x.quantity)||Math.abs(x.quantity)>Number.MAX_SAFE_INTEGER||x.quantity<0||x.event_type!=='실사조정'&&x.quantity===0||m.unit==='개'&&!Number.isSafeInteger(x.quantity))throw new Error('입고·폐기는 양수, 실제 재고는 0 이상으로 입력해 주세요. 개 단위는 정수입니다.');
 if(x.supplier_id&&!d.suppliers.some(s=>s.supplier_id===x.supplier_id))throw new Error('등록되지 않은 공급사입니다.');
 if(x.unit_cost!==undefined&&(!Number.isFinite(x.unit_cost)||x.unit_cost<0))throw new Error('단위원가는 0 이상의 숫자여야 합니다.');
 if(x.event_type==='실사조정'&&d.inventory_events.some(e=>e.date===x.date&&e.material_id===x.material_id&&e.event_type==='실사조정'))throw new Error('같은 재료·날짜의 실측 기록이 이미 있습니다. 하루에 한 번만 기록합니다.');
 const before=inventory(d,x.date).find(r=>r.material.material_id===x.material_id)!;if(before.quantity===null)throw new Error(before.error);
 const quantity=x.event_type==='폐기'?-x.quantity:x.event_type==='실사조정'?new Decimal(x.quantity).minus(before.quantity).toNumber():x.quantity;
 const event:Event={event_id:crypto.randomUUID(),date:x.date,material_id:x.material_id,event_type:x.event_type,quantity,unit:m.unit};
 if(x.event_type==='실사조정')event.counted_quantity=x.quantity;
 if(x.event_type==='입고'){if(x.supplier_id)event.supplier_id=x.supplier_id;if(x.unit_cost!==undefined)event.unit_cost=x.unit_cost;}
 if(x.event_type==='폐기'&&x.reason?.trim())event.reason=x.reason.trim();
 return {event,warning:x.event_type==='폐기'&&x.quantity>before.quantity?'폐기 수량이 장부 잔량보다 큽니다. 음수 잔량을 유지하며 기록 점검이 필요합니다.':''};
}
export function periodResult(d:Dataset,start:string,end:string){
 const days=datesBetween(start,end);const calendar=new Map(d.calendar.map(c=>[c.date,c]));
 const closed=days.filter(date=>date<=d.meta.as_of&&calendar.get(date)?.is_open&&calendar.get(date)?.record_complete);
 const closedSet=new Set(closed);const actualEnd=end<d.meta.as_of?end:d.meta.as_of;
 const sales=d.sales.filter(s=>closedSet.has(s.date));const summary=totals(sales);
 const expenses=d.expenses.filter(e=>e.date>=start&&e.date<=actualEnd);
 const common=expenses.reduce((sum,e)=>sum.plus(e.amount),new Decimal(0));
 const categories=expenseCategories.map(category=>({category,amount:expenses.filter(e=>e.category===category).reduce((sum,e)=>sum.plus(e.amount),new Decimal(0)).toNumber()}));
 const saleDates=new Set(d.sales.map(s=>s.date)),costKeys=new Set(expenses.map(e=>e.date+'|'+e.category));
 const missingSales=closed.filter(date=>!saleDates.has(date));
 const missingCostDays=days.filter(date=>date>=d.meta.start_date&&date<=actualEnd&&calendar.has(date)&&expenseCategories.some(category=>!costKeys.has(date+'|'+category)));
 return {...summary,common:common.toNumber(),profit:new Decimal(summary.profit).minus(common).toNumber(),categories,closedDays:closed.length,unclosedDays:days.filter(date=>calendar.get(date)?.is_open&&(!calendar.get(date)?.record_complete||date>d.meta.as_of)).length,holidays:days.filter(date=>calendar.has(date)&&!calendar.get(date)?.is_open).length,missingCalendar:days.filter(date=>!calendar.has(date)).length,missingSales,missingCostDays,partial:start<d.meta.start_date||end>d.meta.as_of,actualStart:start<d.meta.start_date?d.meta.start_date:start,actualEnd,hasActual:closed.length>0||expenses.length>0};
}

export function forecast(d:Dataset){
 const {start,end}=periodRange(d.meta.as_of,'월'),days=datesBetween(start,end),calendar=new Map(d.calendar.map(c=>[c.date,c]));
 if(days.some(date=>!calendar.has(date)))throw new Error('월말까지의 영업달력이 부족해 예상 손익을 계산할 수 없습니다.');
 const closed=days.filter(date=>date<=d.meta.as_of&&calendar.get(date)!.is_open&&calendar.get(date)!.record_complete),remaining=days.filter(date=>calendar.get(date)!.is_open&&(date>d.meta.as_of||!calendar.get(date)!.record_complete));
 if(!closed.length)throw new Error('마감된 영업일이 없어 월말 예상을 계산할 수 없습니다.');
 if(closed.some(date=>!d.sales.some(s=>s.date===date)))throw new Error('마감 영업일의 판매 기록 누락 가능성이 있어 월말 예상을 보류합니다.');
 const plans=d.monthly_expense_plan.filter(p=>p.month===start.slice(0,7));if(expenseCategories.some(category=>!plans.some(p=>p.category===category)))throw new Error('월 비용 계획이 없어 월말 예상 손익을 계산할 수 없습니다.');
 const actual=periodResult(d,start,d.meta.as_of),direct=new Decimal(actual.food).plus(actual.pack).plus(actual.fee);
 const net=new Decimal(actual.net).plus(new Decimal(actual.net).div(closed.length).mul(remaining.length));
 const estimatedDirect=direct.plus(direct.div(closed.length).mul(remaining.length)),common=plans.reduce((v,p)=>v.plus(p.amount),new Decimal(0));
 return {month:start.slice(0,7),asOf:d.meta.as_of,closed:closed.length,remaining:remaining.length,net:net.toNumber(),direct:estimatedDirect.toNumber(),common:common.toNumber(),profit:net.minus(estimatedDirect).minus(common).toNumber(),actual};
}
export function reorder(d:Dataset){
 const days=d.calendar.filter(c=>c.date<=d.meta.as_of&&c.is_open&&c.record_complete).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map(c=>c.date);const selected=new Set(days);
 const usage=new Map<string,Decimal>();let sampleError=days.length?'':'마감된 영업일 표본이 없습니다.';
 if(days.some(date=>!d.sales.some(s=>s.date===date)))sampleError='표본 영업일의 판매 기록 누락 가능성이 있습니다.';
 for(const s of d.sales.filter(s=>selected.has(s.date))){const rules=d.recipes.filter(r=>r.menu_id===s.menu_id&&r.recipe_version===s.recipe_version&&(!r.channel_only||r.channel_only===s.channel));if(!rules.length)sampleError='표본 판매의 레시피가 없습니다.';for(const r of rules)usage.set(r.material_id,(usage.get(r.material_id)??new Decimal(0)).plus(new Decimal(r.quantity).mul(s.quantity)));}
 return inventory(d).map(stock=>{const m=stock.material;try{if(sampleError||stock.error||stock.quantity===null)throw new Error(sampleError||stock.error);if(!Number.isFinite(m.pack_quantity)||m.pack_quantity<=0||!Number.isInteger(m.lead_days)||m.lead_days<0||!Number.isInteger(m.safety_days)||m.safety_days<0)throw new Error('구매용량·납기·안전재고를 확인해 주세요.');
 const avg=(usage.get(m.material_id)??new Decimal(0)).div(days.length),target=avg.mul(m.lead_days+m.safety_days),lead=avg.mul(m.lead_days),quantity=new Decimal(stock.quantity),needed=Decimal.max(0,target.minus(quantity)),packs=needed.div(m.pack_quantity).ceil();
 return {...stock,sampleDays:days.length,average:avg.toNumber(),target:target.toNumber(),needed:needed.toNumber(),packs:packs.toNumber(),orderQuantity:packs.mul(m.pack_quantity).toNumber(),depletion:avg.isZero()?null:quantity.div(avg).toNumber(),status:quantity.isNegative()?'음수 잔량 · 기록 점검':avg.isZero()?'최근 사용 없음':quantity.lt(lead)?'납기 전 부족 위험':quantity.lt(target)?'안전재고 부족 가능':'목표량 충족'};
 }catch(e){return {...stock,error:(e as Error).message,sampleDays:days.length,average:null,target:null,needed:null,packs:null,orderQuantity:null,depletion:null,status:'계산 불가'};}});
}
