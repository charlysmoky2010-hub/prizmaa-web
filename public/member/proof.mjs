import {learnFromSyntheticRatings,decideQuality} from "./quality-learning.mjs";
const el=id=>document.getElementById(id),topic=()=>el("topic").value;
const sampleUsers=Array.from({length:10},(_,i)=>"synthetic-"+String(i+1));
let previous=[];
function update(records,label){
  const result=learnFromSyntheticRatings(topic(),records);
  el("events").textContent=String(result.evidence_count);
  el("members").textContent=String(result.distinct_members);
  el("smoothed").textContent=result.smoothed_mean.toFixed(2);
  el("decision-tag").textContent=result.decision.replaceAll("_"," ").toUpperCase();
  el("priority").textContent=String(result.priority);
  el("suggestion").textContent=result.proposed_change?.replaceAll("_"," ")||"No change proposed";
  const descriptions={
    insufficient_evidence:"Evidence gate remains CLOSED. At least 10 real independent members and 10 ratings are required.",
    human_review:"Observed quality is low: a targeted improvement is recommended for HUMAN REVIEW, not automatic deployment.",
    watch:"An improvement should be investigated. Only approved, tested changes can be shipped.",
    healthy:"More positive ratings changed the estimate; no change is now proposed."
  };
  el("explanation").textContent=label+". "+descriptions[result.decision];
  el("safety").textContent="Automatic production code changes: "+(result.automatic_code_changes?"ENABLED":"DISABLED")+" · User profiling: "+(result.automatic_member_profiling?"ENABLED":"DISABLED");
  previous=records;
}
el("empty").addEventListener("click",()=>update([],"No participants"));
el("flood").addEventListener("click",()=>update(Array.from({length:1000},()=>({actor:"only-one-actor",rating:1})),"One account floods 1,000 ratings"));
el("negative").addEventListener("click",()=>update(sampleUsers.map(actor=>({actor,rating:1})),"10 independent sample users report poor quality"));
el("recovery").addEventListener("click",()=>{
  const base=sampleUsers.map(actor=>({actor,rating:1}));
  const better=sampleUsers.flatMap(actor=>Array.from({length:10},()=>({actor,rating:5})));
  update([...base,...better],"After additional positive synthetic evidence");
});
function verify(){
  const scenarios=[
    [0,0,3,"insufficient_evidence"],[100,1,1,"insufficient_evidence"],
    [9,9,1,"insufficient_evidence"],[10,10,2.7,"human_review"],
    [12,12,3.1,"watch"],[15,15,4.2,"healthy"]
  ];
  let passed=0;
  for(const [events,members,mean,expected] of scenarios){
    const v=decideQuality("privacy",events,members,mean);
    if(v.decision===expected&&!v.automatic_code_changes&&!v.automatic_member_profiling)passed++;
  }
  el("validation").textContent=passed+"/"+scenarios.length+
    " deterministic checks passed in this browser. Test data is hypothetical; production results remain separate.";
}
verify();update([],"No participants");
