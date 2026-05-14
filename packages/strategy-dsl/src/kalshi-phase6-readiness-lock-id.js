import {createHash} from "node:crypto";
const SCHEMA_VERSION="kalshi_phase6_readiness_lock.v1";
export function kalshiPhase6ReadinessLockId({phase,lockStatus,phase6Ready}){
  if(!phase||!lockStatus||phase6Ready==null) throw new Error("kalshiPhase6ReadinessLockId: all inputs required");
  const digest=createHash("sha256").update([phase,SCHEMA_VERSION,lockStatus,String(phase6Ready)].join("|")).digest("hex").slice(0,32);
  return `kp6rl_${digest}`;
}
