import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {validateDataset} from '../src/model';
import {filterSales,inventory,profitability} from '../src/domain';
it('제공 샘플의 계산 시간 측정과 결과 확인',()=>{const d=validateDataset(JSON.parse(readFileSync(new URL('../public/sample.json',import.meta.url),'utf8')));const start=performance.now();const sales=filterSales(d,'2026-09-01','2026-09-18');const profit=profitability(d,'2026-09-01','2026-09-18');const stock=inventory(d);console.info('샘플 계산 시간(ms):',Math.round(performance.now()-start));expect(sales.length).toBe(256);expect(profit.length).toBe(8);expect(stock.every(s=>s.quantity!==null)).toBe(true);});
