import { copyFile } from 'node:fs/promises';
// One editable source, published for the scheduler on every Pages build.
await copyFile(new URL('../src/data/agenda.json', import.meta.url), new URL('../public/data/agenda.json', import.meta.url));
