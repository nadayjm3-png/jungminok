import {describe,it,expect} from 'vitest';
import ExcelJS from 'exceljs';
import {readFileSync} from 'node:fs';
import {validateDataset} from '../src/model';
import {inspect,template,columns} from '../src/excel';
const sample=()=>validateDataset(JSON.parse(readFileSync(new URL('../public/sample.json',import.meta.url),'utf8')));
async function file(rows:unknown[][]){const w=new ExcelJS.Workbook();const s=w.addWorksheet('판매입력');s.addRow(columns);rows.forEach(r=>s.addRow(r));return (await w.xlsx.writeBuffer()) as unknown as ArrayBuffer;}
const row=['2026-09-18','M02','포장',10,4800,1000,700];
describe('실제 엑셀 읽기·쓰기',()=>{
 it('양식 재읽기와 실제 메뉴 안내',async()=>{const d=sample();const b=await template(d);const w=new ExcelJS.Workbook();await w.xlsx.load(b);expect(w.getWorksheet('판매입력')!.getRow(1).values).toContain('판매수량');expect(w.getWorksheet('사용안내')!.rowCount).toBe(13);});
 it('정상 행 변환과 금액',async()=>{const d=sample();d.sales=[];const r=await inspect(await file([row]),d);expect(r.sales[0].net_sales).toBe(47000);expect(r.issues).toHaveLength(0);expect(d.sales).toHaveLength(0);});
 it('파일내 중복 행 경고',async()=>{const d=sample();d.sales=[];const r=await inspect(await file([row,row]),d);expect(r.rowCount).toBe(2);expect(r.issues[0].row).toBe(3);expect(r.issues[0].reason).toContain('같은 날짜');});
 it('기존 집계 중복',async()=>{const r=await inspect(await file([row]),sample());expect(r.issues).toHaveLength(1);});
 it('잘못된 메뉴 원본 행 표시',async()=>{const d=sample();d.sales=[];const r=await inspect(await file([[...row.slice(0,1),'UNKNOWN',...row.slice(2)]]),d);expect(r.issues[0].row).toBe(2);});
 it('빈칸 수수료를 0으로 대체하지 않음',async()=>{const d=sample();d.sales=[];const r=await inspect(await file([[...row.slice(0,6),null]]),d);expect(r.issues[0].reason).toContain('빈칸');});
 it('엑셀 날짜 셀 변환',async()=>{const d=sample();d.sales=[];const r=await inspect(await file([[new Date('2026-09-18T00:00:00Z'),...row.slice(1)]]),d);expect(r.sales[0].date).toBe('2026-09-18');});
 it('수식 셀 실행/자동값 사용 금지',async()=>{const d=sample();d.sales=[];const r=await inspect(await file([[...row.slice(0,6),{formula:'1+1',result:2}]]),d);expect(r.issues[0].reason).toContain('수식');});
 it('손상 파일 오류',async()=>await expect(inspect(new ArrayBuffer(3),sample())).rejects.toThrow(/읽을 수/));
 it('빈 양식 등록 불가',async()=>await expect(inspect(await file([]),sample())).rejects.toThrow(/기록이 없습니다/));
});
