import {describe,expect,it,vi} from "vitest";
import {evaluationPrompt,isSkip,isStop,ratingOverride,saveReviewResult,type GeneratedQuestion} from "../src/review-session.js";
const q:GeneratedQuestion={candidateKey:"item:1",questionType:"how_would_you_say",question:"Say it",expectedAnswer:"Natural answer",rubric:"Natural English",oneHint:"Try again",learningItemId:"item",mistakeCategory:null};
describe("review conversation",()=>{
 it("recognizes skip, stop, and rating override commands",()=>{expect(isSkip("跳過")).toBe(true);expect(isStop("stop")).toBe(true);expect(ratingOverride("mark it hard")).toBe("hard");expect(ratingOverride("normal answer")).toBeNull()});
 it("builds a bounded evaluation prompt",()=>{const prompt=evaluationPrompt(q,"my answer");expect(prompt).toContain("Natural answer");expect(prompt).toContain("my answer");expect(prompt).toContain("again|hard|good|easy")});
 it("persists one answered question atomically",async()=>{const rpc=vi.fn().mockResolvedValue({data:{event_id:"event",rating:"good",srs_updated:true},error:null});const result=await saveReviewResult({rpc} as never,"user",q,"answer",{rating:"good",feedback:"Nice"});expect(result.event_id).toBe("event");expect(rpc).toHaveBeenCalledWith("save_telegram_review_result",expect.objectContaining({p_rating:"good",p_learning_item_id:"item"}))});
});
