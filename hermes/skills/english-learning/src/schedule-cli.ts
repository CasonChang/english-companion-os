#!/usr/bin/env node
import {createHermesSupabase} from "./ingest.js";import {claimReviewSchedule,updateReviewSettings} from "./schedule.js";
const chunks:Buffer[]=[];for await(const c of process.stdin)chunks.push(Buffer.from(c));
try{const input=chunks.length?JSON.parse(Buffer.concat(chunks).toString("utf8")):{};const userId=process.env.ECOS_USER_ID;if(!userId)throw new Error();const client=createHermesSupabase();const data=input.action==="settings"?await updateReviewSettings(client,userId,input):await claimReviewSchedule(client,userId);console.log(JSON.stringify({ok:true,data}));}catch{console.log(JSON.stringify({ok:false,message:"I couldn't update the review schedule safely."}));process.exitCode=1}
