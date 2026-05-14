import {createHash} from "node:crypto";
const SCHEMA_VERSION="kalshi_operator_signoff_contract.v1";
export function kalshiOperatorSignoffContractId({phase,signoffStatus,operatorSignoffComplete}){
  if(!phase||!signoffStatus||operatorSignoffComplete==null) throw new Error("kalshiOperatorSignoffContractId: all inputs required");
  const digest=createHash("sha256").update([phase,SCHEMA_VERSION,signoffStatus,String(operatorSignoffComplete)].join("|")).digest("hex").slice(0,32);
  return `kosc_${digest}`;
}
