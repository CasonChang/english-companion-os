#!/usr/bin/env node
import {createHermesSupabase} from "./ingest.js";
import {overrideReviewRating,saveReviewResult} from "./review-session.js";
const chunks:Buffer[]=[];for await(const chunk of process.stdin)chunks.push(Buffer.from(chunk));
try{const input=JSON.parse(Buffer.concat(chunks).toString("utf8"));const userId=process.env.ECOS_USER_ID;if(!userId)throw new Error();const client=createHermesSupabase();const data=input.action==="override"?await overrideReviewRating(client,userId,input.eventId,input.rating):await saveReviewResult(client,userId,input.question,input.answer,input.evaluation);console.log(JSON.stringify({ok:true,data}));}catch{console.log(JSON.stringify({ok:false,message:"I couldn't save that review safely. Please try again."}));process.exitCode=1}
