import test from "node:test";
import assert from "node:assert/strict";
import { decideQuality, learnFromSyntheticRatings, QUALITY_AREAS, QUALITY_ACTIONS } from "../lib/prizmaa/quality-learning.mjs";

const scenarios=[
 ["no data",["privacy",0,0,3],"insufficient_evidence"],
 ["one account floods 100 events",["privacy",100,1,1],"insufficient_evidence"],
 ["nine distinct people",["onboarding",9,9,1],"insufficient_evidence"],
 ["ten poor ratings",["accessibility",10,10,2.70],"human_review"],
 ["ten moderately poor ratings",["reliability",12,12,3.10],"watch"],
 ["ten high ratings",["profile",15,15,4.2],"healthy"],
 ["urgent privacy problem",["privacy",50,24,1.7],"human_review"],
 ["positive navigation",["navigation",30,18,4],"healthy"]
];
for(const [name,input,expected] of scenarios) {
 test(name,()=>{
   const actual=decideQuality(...input);
   assert.equal(actual.decision,expected);
   assert.equal(actual.automatic_code_changes,false);
   assert.equal(actual.automatic_member_profiling,false);
   assert.equal(actual.review_required,expected==="human_review"||expected==="watch");
   if(actual.review_required)assert.ok(Object.values(QUALITY_ACTIONS).includes(actual.proposed_change));
   else assert.equal(actual.proposed_change,null);
 });
}
test("adaptive posterior improves when distinct evidence improves",()=>{
 const actors=Array.from({length:10},(_,i)=>"synthetic-"+i);
 const early=actors.map(actor=>({actor,rating:1}));
 const bad=learnFromSyntheticRatings("reliability",early);
 assert.equal(bad.decision,"human_review");
 const more=actors.flatMap(actor=>Array.from({length:10},(_,day)=>({actor,rating:5,day})));
 const improved=learnFromSyntheticRatings("reliability",[...early,...more]);
 assert.equal(improved.decision,"healthy");
 assert.ok(improved.smoothed_mean>bad.smoothed_mean);
 assert.equal(improved.review_required,false);
});
test("fabricated volume from one account never clears evidence gate",()=>{
 const spam=Array.from({length:1000},()=>({actor:"synthetic-one",rating:1}));
 assert.equal(learnFromSyntheticRatings("privacy",spam).decision,"insufficient_evidence");
});
test("reject malformed evidence and injection attempt",()=>{
 for(const bad of [
   ["sexual_orientation",20,20,2],["privacy",-1,0,2],["privacy",10,11,2],
   ["privacy",10,10,NaN],["privacy",10,10,0]
 ])assert.throws(()=>decideQuality(...bad),/INVALID_QUALITY_EVIDENCE/);
 assert.throws(()=>learnFromSyntheticRatings("privacy",[{actor:"A",rating:10}]));
});
test("safety priorities are non-identifying and review-gated",()=>{
 const risk=decideQuality("privacy",12,12,2);
 const navigation=decideQuality("navigation",12,12,2);
 assert.ok(risk.priority>navigation.priority);
 for(const area of QUALITY_AREAS){
   const decision=decideQuality(area,15,15,2);
   assert.equal(decision.review_required,true);
   assert.equal(decision.automatic_code_changes,false);
   assert.ok(!JSON.stringify(decision).includes("synthetic-one"));
 }
});
