import { cp, mkdir } from 'node:fs/promises';
await mkdir(new URL('../lib/', import.meta.url), { recursive: true });
await cp(new URL('../src/', import.meta.url), new URL('../lib/', import.meta.url), { recursive: true });
// Ship our own complementary footer, never a copy/override of upstream navigation.
await cp(new URL('../src/client-aliases.js', import.meta.url), new URL('../lib/client.js', import.meta.url));
console.log('Built rc.4 plugin with complementary display-alias footer');
