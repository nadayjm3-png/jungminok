import {z} from 'zod';
import {type Snapshot,validateDataset} from './model';
export const policyVersion='cafe-mvp-1';
export const appVersion='0.2.0';
const envelope=z.object({formatId:z.literal('prep-cafe-backup'),schemaVersion:z.literal(1),appVersion:z.string().min(1),policyVersion:z.literal(policyVersion),exportedAt:z.string().datetime(),dataRevision:z.number().int().nonnegative(),data:z.unknown()});
export function serializeBackup(snapshot:Snapshot){return JSON.stringify({formatId:'prep-cafe-backup',schemaVersion:1,appVersion,policyVersion,exportedAt:new Date().toISOString(),dataRevision:snapshot.revision,data:validateDataset(snapshot.data)},null,2);}
export function inspectBackup(text:string){let parsed:unknown;try{parsed=JSON.parse(text);}catch{throw new Error('JSON을 읽을 수 없습니다. 파일 손상·형식을 확인해 주세요.');}const result=envelope.safeParse(parsed);if(!result.success)throw new Error('지원하는 전체 백업 형식·버전·계산 정책과 다릅니다. 원본 샘플 JSON은 복원용 백업이 아닙니다.');return {...result.data,data:validateDataset(result.data.data)};}
export function backupFilename(now=new Date()){return 'prep_cafe_backup_'+now.toISOString().replace(/[-:]/g,'').replace('T','_').slice(0,15)+'.json';}
