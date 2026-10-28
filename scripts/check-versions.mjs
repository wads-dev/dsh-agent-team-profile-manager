import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const sections = ['dependencies', 'optionalDependencies', 'peerDependencies', 'devDependencies'];
const mismatches = [];
for (const section of sections) {
  for (const [name, version] of Object.entries(pkg[section] ?? {})) {
    if (name.startsWith('@deepseek-ai/dsh-') && version !== pkg.version) {
      mismatches.push({ section, name, version });
    }
  }
}
const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) {
  mismatches.push({ section: 'package-lock root', name: pkg.name, version: lock.version });
}
for (const section of sections) {
  for (const [name, version] of Object.entries(pkg[section] ?? {})) {
    if (!name.startsWith('@deepseek-ai/dsh-')) continue;
    const locked = lock.packages?.['']?.[section]?.[name];
    if (locked !== version) mismatches.push({ section: 'package-lock ' + section, name, version: locked });
  }
}
if (mismatches.length) {
  console.error('Plugin version must exactly match every declared DSH package version and the lockfile root.');
  for (const item of mismatches) console.error(item.section + ': ' + item.name + ' is ' + item.version + '; expected ' + pkg.version);
  process.exitCode = 1;
} else {
  console.log(pkg.name + '@' + pkg.version + ': all declared DSH versions and lockfile root match.');
}
