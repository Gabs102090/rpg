import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const files=['index.html','index-1.html','v17.js','v17-ui.js','v17-cooldown.js','v17-skilltree.js','v17-launcher.js','v17-qol-mechanics.js','sw.js','version.json'];
for(const f of files)assert.ok(fs.existsSync(f),`Missing required file: ${f}`);

const tree=read('v17-skilltree.js');
const branchIds=[...tree.matchAll(/\{id:'([^']+)',icon:/g)].map(m=>m[1]);
assert.equal(branchIds.length,9,'Skill Tree must have exactly 9 branches');
assert.equal(new Set(branchIds).size,9,'Skill Tree branch ids must be unique');
const itemCount=(tree.match(/\['[^']+','[^']+'\]/g)||[]).length;
assert.equal(itemCount,108,'Skill Tree must have exactly 108 nodes');
assert.match(tree,/function buy\(b,i\)/);
assert.match(tree,/window\.openV17SkillTree=render/);
assert.match(tree,/function respec\(\)/);
assert.match(tree,/pointsTotal\(\)/);
assert.match(tree,/repeat\(9,190px\)/);
assert.match(tree,/repeat\(9,175px\)/);

const cooldown=read('v17-cooldown.js');
assert.match(cooldown,/V17_BUTTON_COOLDOWN_MS=500/,'Button debounce must be 0.5 seconds');
const classLogic=read('v17.js');
assert.match(classLogic,/combatState\.cooldown=0\.5/,'Elementalist Special cooldown must be 0.5 seconds');
const qol=read('v17-qol-mechanics.js');
for(const feature of ['Ctrl/Cmd+S','silent autosave','searchable inventory','compact layout','daily bounty','exploration streak','rare extra gem','bonus fish','crafting mastery'])assert.ok(qol.toLowerCase().includes(feature.toLowerCase()),`Missing QoL/mechanic: ${feature}`);

const launcher=read('v17-launcher.js');
assert.match(launcher,/v17-tree-launcher/);
assert.match(launcher,/openV17SkillTree/);

const sw=read('sw.js');
for(const f of ['v17.js','v17-ui.js','v17-cooldown.js','v17-skilltree.js','v17-launcher.js','v17-qol-mechanics.js'])assert.ok(sw.includes(`./${f}`),`Service Worker must load ${f}`);
assert.match(sw,/valedouro-v17\.2\.0/);

const index=read('index.html');
assert.match(index,/index-1\.html/,'Launcher must point to the V17 game');
assert.doesNotMatch(index,/v15/i,'Main launcher must not reference V15');

const version=JSON.parse(read('version.json'));
assert.equal(version.version,'17.2.0');
assert.equal(version.name,'Crónicas de Valedouro');

console.log('V17 smoke tests: PASS');
console.log(`Branches: ${branchIds.join(', ')}`);
console.log(`Skill nodes: ${itemCount}`);
console.log(`Version: ${version.version}`);
