import ExcelJS from 'exceljs';
import {mkdir} from 'node:fs/promises';
const dir=new URL('../../docs/evidence/',import.meta.url);
await mkdir(dir,{recursive:true});
async function build(filename,row){const w=new ExcelJS.Workbook();const s=w.addWorksheet('판매입력');s.addRow(['일자','메뉴ID','판매채널','판매수량','판매단가','할인총액','결제수수료']);s.addRow(row);await w.xlsx.writeFile(new URL(filename,dir).pathname.replace(/^\/(\w:)/,'$1'));}
await build('qa-sales-normal.xlsx',['2026-09-18','M02','포장',13,4800,0,936]);
await build('qa-sales-error.xlsx',['2026-09-18','UNKNOWN','포장',13,4800,0,936]);
