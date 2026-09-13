import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const files=['index.html','index-1.html','v17.js','v17-ui.js','v17-cooldown.js','v17-skilltree.js','v17-launcher.js','sw.js','version.json'];
for(const f of files)assert.ok(fs.existsSync(f),`Missing required file: ${f}`);

const tree=read('v17-skilltree.js');
const branchIds=[...tree.matchAll(/\{id:'([^']+)',icon:/g)].map(m=>m[1]);
assert.equal(branchIds.length,8,'Skill Tree must have exactly 8 branches');
assert.equal(new Set(branchIds).size,8,'Skill Tree branch ids must be unique');
const itemCount=(tree.match(/\['[^']+','[^']+'\]/g)||[]).length;
assert.equal(itemCount,96,'Skill Tree must have exactly 96 nodes');
assert.match(tree,/function buy\(b,i\)/);
assert.match(tree,/window\.openV17SkillTree=render/);
assert.match(tree,/function respec\(\)/);
assert.match(tree,/pointsTotal\(\)/);

const cooldown=read('v17-cooldown.js');
assert.match(cooldown,/INTERACTION_COOLDOWN=1000/,'General interaction cooldown must be 1 second');
assert.match(cooldown,/combatState\.cooldown=2/,'Elementalist Special cooldown must remain 2 seconds');

const launcher=read('v17-launcher.js');
assert.match(launcher,/v17-tree-launcher/);
assert.match(launcher,/openV17SkillTree/);

const sw=read('sw.js');
for(const f of ['v17.js','v17-ui.js','v17-cooldown.js','v17-skilltree.js','v17-launcher.js'])assert.ok(sw.includes(`./${f}`),`Service Worker must load ${f}`);
assert.match(sw,/valedouro-v17\.1\.1/);

const index=read('index.html');
assert.match(index,/index-1\.html/,'Launcher must point to the V17 game');
assert.doesNotMatch(index,/v15/i,'Main launcher must not reference V15');

const version=JSON.parse(read('version.json'));
assert.equal(version.version,'17.1.1');
assert.equal(version.name,'Crónicas de Valedouro');

console.log('V17 smoke tests: PASS');
console.log(`Branches: ${branchIds.join(', ')}`);
console.log(`Skill nodes: ${itemCount}`);
console.log(`Version: ${version.version}`);
