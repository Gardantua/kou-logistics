import test from 'node:test';
import assert from 'node:assert/strict';
import { VRPSolver } from '../src/lib/vrpSolver.js';
const cargos = [{stationId:1,name:'A',count:6,weight:600},{stationId:2,name:'B',count:4,weight:400}];
const fleet = () => [{id:'V1',capacity:500,fixedCost:20,type:'owned'}];
function checkAccounting(result, solver) {
  const assigned = result.routes.flatMap(route => route.cargoDetails);
  assert.equal(assigned.length + result.dropped.length, 10);
  assert.equal([...assigned, ...result.dropped].reduce((total,item) => total+item.weight,0),1000);
  for (const route of result.routes) {
    assert.ok(route.load <= route.capacity);
    assert.equal(route.load,route.cargoDetails.reduce((total,item)=>total+item.weight,0));
    assert.equal(route.stops.at(-1),0);
    for (const item of route.cargoDetails) assert.ok(route.stops.includes(item.stationId));
    const distance = route.stops.slice(1).reduce((total,stop,index)=>total+solver.getDist(route.stops[index],stop),0);
    assert.equal(route.distance,distance);
    assert.equal(route.cost,distance*solver.config.unitCost+route.fixedCost);
  }
  assert.equal(result.totalCost,result.routes.reduce((total,route)=>total+route.cost,0));
}
test('fixed fleet accounts for cargo that does not fit',()=>{
 const solver=new VRPSolver(cargos,fleet(),false,{unitCost:2});
 const result=solver.solve();checkAccounting(result,solver);assert.equal(result.dropped.length,5);
});
test('flexible fleet assigns remaining cargo to rentals',()=>{
 const solver=new VRPSolver(cargos,fleet(),true);const result=solver.solve();
 checkAccounting(result,solver);assert.equal(result.dropped.length,0);
 assert.ok(result.routes.some(route=>route.vehicleType==='rented'));
});
test('empty requests produce no routes or charges',()=>{
 const result=new VRPSolver([],fleet()).solve();
 assert.deepEqual(result.routes,[]);assert.deepEqual(result.dropped,[]);assert.equal(result.totalCost,0);
});
