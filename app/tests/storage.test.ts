import 'fake-indexeddb/auto';
import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {validateDataset} from '../src/model';
import {createLedger,initialize,load,writeSales} from '../src/storage';
import {makeSale} from '../src/domain';
const sample=()=>validateDataset(JSON.parse(readFileSync(new URL('../public/sample.json',import.meta.url),'utf8')));
async function setup(){const db=createLedger('test-'+crypto.randomUUID());const d=sample();d.sales=[];await initialize(db,d);return {db,d};}
const x={date:'2026-09-18',menu_id:'M01',channel:'포장',quantity:2,unit_price:4000,discount_amount:0,payment_fee:20};
describe('実제 원장 저장',()=>{
 it('초기화 두 번에도 샘플 안 늘어남',async()=>{const {db,d}=await setup();await initialize(db,d);expect((await load(db)).data.menus).toHaveLength(8);expect((await load(db)).revision).toBe(0);db.close();});
 it('저장·수정·삭제와 재접속 보존',async()=>{const {db,d}=await setup();const s=makeSale(d,x);const a=await writeSales(db,0,[s]);expect(a.data.sales[0].net_sales).toBe(8000);db.close();await db.open();expect((await load(db)).data.sales).toHaveLength(1);const b=await writeSales(db,1,[{...s,quantity:3,net_sales:12000}]);expect(b.revision).toBe(2);const c=await writeSales(db,2,[],[s.sale_id]);expect(c.data.sales).toHaveLength(0);db.close();});
 it('오래된 자료 버전 쓰기 거부',async()=>{const {db,d}=await setup();await writeSales(db,0,[makeSale(d,x)]);await expect(writeSales(db,0,[],[])).rejects.toThrow(/변경/);expect((await load(db)).revision).toBe(1);db.close();});
 it('동시에 두 번 저장하면 하나만 확정',async()=>{const {db,d}=await setup();const s=makeSale(d,x);const r=await Promise.allSettled([writeSales(db,0,[s]),writeSales(db,0,[s])]);expect(r.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect((await load(db)).data.sales).toHaveLength(1);db.close();});
 it('쓰기 도중 오류면 삭제·추가·revision 모두 취소',async()=>{const {db,d}=await setup();const s=makeSale(d,x);await writeSales(db,0,[s]);const fail=()=>{throw new Error('저장 실패 시험');};db.table('app_meta').hook('updating',fail);await expect(writeSales(db,1,[{...s,sale_id:'새기록'}],[s.sale_id])).rejects.toThrow('저장 실패 시험');db.table('app_meta').hook('updating').unsubscribe(fail);const a=await load(db);expect(a.data.sales).toHaveLength(1);expect(a.data.sales[0].sale_id).toBe(s.sale_id);expect(a.revision).toBe(1);db.close();});
 it('구조 오류인 판매 저장 전에 보류',async()=>{const {db,d}=await setup();const s=makeSale(d,x);await expect(writeSales(db,0,[{...s,menu_id:'UNKNOWN'}])).rejects.toThrow(/연결/);expect((await load(db)).revision).toBe(0);expect((await load(db)).data.sales).toHaveLength(0);db.close();});
 it('다른 ID로 같은 날짜·메뉴·채널 넣으면 보류',async()=>{const {db,d}=await setup();const s=makeSale(d,x);await writeSales(db,0,[s]);await expect(writeSales(db,1,[{...s,sale_id:'다른ID'}])).rejects.toThrow(/중복/);expect((await load(db)).data.sales).toHaveLength(1);db.close();});
});
