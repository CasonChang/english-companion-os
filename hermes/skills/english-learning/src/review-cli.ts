#!/usr/bin/env node
import { createHermesSupabase } from "./ingest.js";
import { loadReviewPlan, questionGenerationPrompt } from "./review.js";
const userId=process.env.ECOS_USER_ID;
if(!userId){ console.log(JSON.stringify({ok:false,message:"Hermes is missing ECOS_USER_ID."})); process.exitCode=1; }
else { try { const plan=await loadReviewPlan(createHermesSupabase(),userId); console.log(JSON.stringify({ok:true,plan,prompt:questionGenerationPrompt(plan)})); } catch { console.log(JSON.stringify({ok:false,message:"I couldn't prepare a review safely. Please try again later."})); process.exitCode=1; } }
