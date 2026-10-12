import ExcelJS from 'exceljs';
import {type Dataset,type Draft,type Sale,saleKey} from './model';
import {makeSale} from './domain';
export const columns=['일자','메뉴ID','판매채널','판매수량','판매단가','할인총액','결제수수료'];
export interface ImportIssue {row:number;reason:string}
export interface Inspection {sales:Sale[];issues:ImportIssue[];rowCount:number}
export async function template(d:Dataset){const w=new ExcelJS.Workbook();const sheet=w.addWorksheet('판매입력');sheet.addRow(columns);sheet.getRow(1).font={bold:true};sheet.columns.forEach(c=>c.width=20);sheet.views=[{state:'frozen',ySplit:1}];const info=w.addWorksheet('사용안내');info.addRow(['정해진 양식: 판매입력 시트의 2행부터 입력하세요. 모든 금액은 원·부가세 제외입니다.']);info.addRow(['필수: 일자(YYYY-MM-DD), 메뉴ID, 매장/포장, 양의 정수 수량, 단가, 할인총액, 수수료. 실제 0은 0으로 입력하세요.']);info.addRow(['오류/중복이 있으면 전체 등록을 보류합니다. 합계 행·수식·숨긴 행을 넣지 마세요.']);info.addRow(['마감된 영업일만 입력 가능합니다. 신규 날짜 마감 처리는 이 EPIC에 포함되지 않습니다.']);info.addRow(['메뉴ID','메뉴명','기준가']);for(const m of d.menus)info.addRow([m.menu_id,m.name,m.price]);info.columns=[{width:45},{width:30},{width:20}];return w.xlsx.writeBuffer();}
function dateCell(value:ExcelJS.CellValue):string{
 if(value instanceof Date){return value.toISOString().slice(0,10);}
 if(typeof value==='string')return value.trim();
 throw new Error('일자는 YYYY-MM-DD 문자 또는 엑셀 날짜 셀로 입력해 주세요.');
}
function numeric(value:ExcelJS.CellValue,label:string){if(typeof value!=='number'||!Number.isFinite(value))throw new Error(label+'은 숫자로 입력해 주세요. 빈칸은 0과 다릅니다.');return value;}
export async function inspect(buffer:ArrayBuffer,d:Dataset):Promise<Inspection>{
 const w=new ExcelJS.Workbook();try{await w.xlsx.load(buffer);}catch{throw new Error('엑셀을 읽을 수 없습니다. 손상·암호·지원 형식을 확인해 주세요.');}
 const sheet=w.getWorksheet('판매입력');if(!sheet)throw new Error('판매입력 시트가 없습니다. 양식을 내려받아 사용해 주세요.');
 if(columns.some((h,i)=>sheet.getRow(1).getCell(i+1).value!==h)||sheet.getRow(1).actualCellCount!==7)throw new Error('양식의 열 이름과 순서가 다릅니다.');
 const result:Inspection={sales:[],issues:[],rowCount:0};const existingKeys=new Set(d.sales.map(saleKey));
 sheet.eachRow((row,index)=>{if(index===1)return;result.rowCount++;try{if(row.hidden)throw new Error('숨긴 행은 가져올 수 없습니다. 표시 후 다시 검사해 주세요.');if(row.actualCellCount>7)throw new Error('양식 밖 열에 입력값이 있습니다.');
 const values=columns.map((_,i)=>row.getCell(i+1).value);if(values.some(v=>v&&typeof v==='object'&&!(v instanceof Date)))throw new Error('수식/링크/복합 셀은 허용하지 않습니다. 값으로 입력해 주세요.');
 const x:Draft={date:dateCell(values[0]),menu_id:String(values[1]??'').trim(),channel:String(values[2]??'').trim(),quantity:numeric(values[3],'판매수량'),unit_price:numeric(values[4],'판매단가'),discount_amount:numeric(values[5],'할인총액'),payment_fee:numeric(values[6],'결제수수료')};
 const s=makeSale(d,x,undefined,existingKeys);existingKeys.add(saleKey(s));result.sales.push(s);
 }catch(e){result.issues.push({row:index,reason:(e as Error).message});}});
 if(!result.rowCount)throw new Error('판매입력 시트에 기록이 없습니다.');return result;
}
