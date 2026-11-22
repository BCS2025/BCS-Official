import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cleanPublicImage } from '../../src/lib/publicImagePrivacy.mjs';
const targets=JSON.parse(await fs.readFile(new URL('./release-static.json',import.meta.url),'utf8'));
for (const {file,sha1} of targets) {
    if(!file.startsWith('public/') || file.includes('..')) throw Error('Invalid asset path');
    const clean=cleanPublicImage(await fs.readFile(file));
    if(createHash('sha1').update(clean).digest('hex')!==sha1) throw Error('Image version differs from approved source');
    await fs.writeFile(file,clean);
}

