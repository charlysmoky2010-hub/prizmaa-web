// Deterministic test of PRIZMAA Gay Intelligence v0.1. No personal data used.
import assert from "node:assert/strict";
import { rankDiscovery } from "../lib/prizmaa/intelligence.ts";

const samples = [
  {id:"1",nickname:"A",intent:"Dating",city:"Berlin",tags:"Art, Travel"},
  {id:"2",nickname:"B",intent:"Flirting",city:"Cologne",tags:"Fitness"},
  {id:"3",nickname:"C",intent:"Dating",city:"Hamburg",tags:"Art, Cinema"},
  {id:"4",nickname:"D",intent:"Hookup",city:"Berlin",tags:"Music"},
];
const p={intent:"Dating",interests:"Art, Travel",city:"Berlin"};
const ranked=rankDiscovery(samples,p);
assert.deepEqual(ranked.map(x=>x.person.id),["1","3","4","2"]);
assert.deepEqual(ranked[0].reasons,["Same connection intention","Shared interests: art, travel","Same chosen city"]);
assert.equal(ranked[0].priority,10);
assert.equal(ranked[1].priority,6);
assert.equal(ranked[2].priority,2);
assert.equal(ranked[3].priority,0);
assert.match(ranked[3].reasons[0],/Explore this person's public profile/);
assert.deepEqual(rankDiscovery(samples,{intent:"Any",interests:"",city:""}).map(x=>x.person.id),["1","2","3","4"],"Empty preferences keep discovery order");
assert.deepEqual(rankDiscovery([samples[0],samples[0]],p).map(x=>x.person.id),["1"],"No duplicate profiles");
assert.deepEqual(rankDiscovery([] ,p),[]);
assert.equal(rankDiscovery(samples,{intent:"Dating",interests:" ART ,ART,Travel,art",city:"berlin"})[0].priority,10,"Duplicate tag normalization cannot increase priority");
console.log("PRIZMAA INTELLIGENCE: all explainable ranking tests passed");
