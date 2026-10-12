import Dexie,{type Table} from 'dexie';
import {type Dataset,type Snapshot,type Sale,type Expense,type Event,validateDataset,recipeKey,priceKey} from './model';
const stores={suppliers:'supplier_id',materials:'material_id,supplier_id',menus:'menu_id,category',recipes:'_key,[menu_id+recipe_version],material_id',price_history:'_key,[material_id+effective_date]',calendar:'date',sales:'sale_id,date,menu_id,[date+menu_id+channel]',opening_inventory:'_key,[material_id+date]',inventory_events:'event_id,date,[material_id+date]',expenses:'expense_id,date,[date+category]',monthly_expense_plan:'_key,[month+category]',app_meta:'key'};
export function createLedger(name='prep-cafe-ledger'):Dexie {const db=new Dexie(name);db.version(1).stores(stores);return db;}
const names=Object.keys(stores).filter(n=>n!=='app_meta');
function rows(d:Dataset,name:string):Record<string,unknown>[] {const values=d[name as keyof Dataset] as unknown as Record<string,unknown>[];return values.map((v,i)=>{let key:string|undefined;if(name==='recipes')key=recipeKey(v as unknown as Dataset['recipes'][number]);if(name==='price_history')key=priceKey(v as unknown as Dataset['price_history'][number]);if(name==='opening_inventory')key=v.material_id+'|'+v.date;if(name==='monthly_expense_plan')key=v.month+'|'+v.category;return key?{...v,_key:key}:{...v};});}
export async function initialize(db:Dexie,sample:Dataset){validateDataset(sample);await db.transaction<void>('rw',Object.keys(stores),async()=>{const table=db.table('app_meta');if(await table.get('state'))return;for(const n of names)await db.table(n).bulkAdd(rows(sample,n));await table.add({key:'state',schemaVersion:1,revision:0,metaJson:JSON.stringify(sample.meta),settingsJson:JSON.stringify(sample.settings)});});}
export async function load(db:Dexie):Promise<Snapshot>{return db.transaction<Snapshot>('r',Object.keys(stores),async()=>{const state=await db.table('app_meta').get('state');if(!state)throw new Error('저장된 자료가 없습니다.');if(state.schemaVersion!==1)throw new Error('지원하지 않는 저장 형식입니다.');const data:Record<string,unknown>={meta:JSON.parse(state.metaJson),settings:JSON.parse(state.settingsJson)};for(const n of names)data[n]=(await db.table(n).toArray()).map(({_key,...v})=>v);return {data:validateDataset(data),revision:state.revision};});}
export async function writeSales(db:Dexie,revision:number,upserts:Sale[]=[],deleteIds:string[]=[]){
 const before=await load(db);
 if(before.revision!==revision)throw new Error('다른 작업에서 자료가 변경됐습니다. 새로 조회한 뒤 다시 시도해 주세요.');
 const removed=new Set(deleteIds),changes=new Map(upserts.map(s=>[s.sale_id,s]));
 if(changes.size!==upserts.length)throw new Error('판매 ID가 중복됩니다.');
 for(const id of removed)if(!before.data.sales.some(s=>s.sale_id===id))throw new Error('삭제할 판매 기록이 없습니다.');
 const kept=before.data.sales.filter(s=>!removed.has(s.sale_id)&&!changes.has(s.sale_id));
 validateDataset({...before.data,sales:[...kept,...upserts]});
 await db.transaction<void>('rw',['sales','app_meta'],async()=>{const meta:Table=db.table('app_meta');const state=await meta.get('state');if(state.revision!==revision)throw new Error('다른 작업에서 자료가 변경됐습니다. 새로 조회한 뒤 다시 시도해 주세요.');
 const ids=new Set(upserts.map(s=>s.sale_id));if(ids.size!==upserts.length)throw new Error('판매 ID가 중복됩니다.');
 await db.table('sales').bulkDelete(deleteIds);await db.table('sales').bulkPut(upserts);await meta.put({...state,revision:state.revision+1});});
 try{return await load(db);}catch(e){throw new Error('저장은 완료했지만 결과를 다시 읽지 못했습니다. 중복 저장하지 말고 새로고침해 주세요. '+(e as Error).message);}
}

async function writeRecords(db:Dexie,revision:number,name:'expenses'|'inventory_events',upserts:(Expense|Event)[],deleteIds:string[]=[]){
 const before=await load(db);if(before.revision!==revision)throw new Error('다른 작업에서 자료가 변경됐습니다. 다시 조회해 주세요.');
 const key=name==='expenses'?'expense_id':'event_id';const id=(r:Expense|Event)=>(r as unknown as Record<string,string>)[key];const changed=new Set(upserts.map(id)),deleted=new Set(deleteIds);
 if(changed.size!==upserts.length)throw new Error('기록 ID 중복입니다.');
 const original=before.data[name] as (Expense|Event)[];
 for(const value of deleted)if(!original.some(r=>id(r)===value))throw new Error('삭제할 기록이 없습니다.');
 if(name==='inventory_events'&&upserts.some(r=>original.some(o=>id(o)===id(r))))throw new Error('이미 저장한 재고 기록입니다.');
 validateDataset({...before.data,[name]:[...original.filter(r=>!changed.has(id(r))&&!deleted.has(id(r))),...upserts]});
 await db.transaction<void>('rw',[name,'app_meta'],async()=>{const state=await db.table('app_meta').get('state');if(state.revision!==revision)throw new Error('다른 작업에서 자료가 변경됐습니다. 다시 조회해 주세요.');await db.table(name).bulkDelete(deleteIds);await db.table(name).bulkPut(upserts);await db.table('app_meta').put({...state,revision:revision+1});});
 try{return await load(db);}catch(e){throw new Error('저장은 완료했지만 결과를 다시 읽지 못했습니다. 새로고침해 주세요. '+(e as Error).message);}
}
export const writeExpenses=(db:Dexie,revision:number,upserts:Expense[]=[],deleteIds:string[]=[])=>writeRecords(db,revision,'expenses',upserts,deleteIds);
export const appendInventory=(db:Dexie,revision:number,event:Event)=>writeRecords(db,revision,'inventory_events',[event]);
export async function replaceAll(db:Dexie,revision:number,value:Dataset){
 const data=validateDataset(value);
 await db.transaction<void>('rw',Object.keys(stores),async()=>{const table=db.table('app_meta'),state=await table.get('state');if(!state||state.revision!==revision)throw new Error('검사 후 자료가 변경됐습니다. 다시 파일을 검사해 주세요.');for(const name of names){await db.table(name).clear();await db.table(name).bulkAdd(rows(data,name));}await table.put({...state,revision:revision+1,metaJson:JSON.stringify(data.meta),settingsJson:JSON.stringify(data.settings)});});
 try{return await load(db);}catch(e){throw new Error('복원은 완료했지만 결과 표시를 읽지 못했습니다. 다시 복원하지 말고 새로고침해 주세요. '+(e as Error).message);}
}
