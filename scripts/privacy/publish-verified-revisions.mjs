import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {cleanPublicImage} from '../../src/lib/publicImagePrivacy.mjs';
const origin = 'https://qpdpsgmpqkxeqboyapwp.supabase.co';
if(process.env.VITE_SUPABASE_URL?.replace(/\/$/,'')!==origin) throw Error('Incorrect production catalogue');
const token=process.env.SUPABASE_SERVICE_ROLE_KEY;
const paths=JSON.parse(process.env.BCS_PUBLISHED_MEDIA_REVISION_LIST ?? '[]');
const checked=new Set(paths);
if(!token||paths.length!==168||checked.size!==168||paths.some(k=>! /^(order-uploads\/uploads|forge-portfolio\/portfolio)\/[\w-]+\.(png|jpe?g)$/i.test(k))) throw Error('Incomplete approved catalogue');
const supabase=createClient(origin,token,{auth:{persistSession:false}});
const sha=b=>createHash('sha256').update(b).digest('hex');
async function read(key,publicUrl) {
    const url=new URL('/storage/v1/object/'+(publicUrl?'public/':'authenticated/')+key,origin);
    if(!publicUrl)url.searchParams.set('r',randomUUID());
    for(let attempt=0;attempt<4;attempt++) {
        try {
            const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(75000),headers:publicUrl?{}:{apikey:token,Authorization:'Bearer '+token}});
            if(!r.ok)throw Error('Storage returned '+r.status);
            return Buffer.from(await r.arrayBuffer());
        } catch(error) {
            if(attempt===3)throw error;
            await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
        }
    }
}
async function batch(items,fn) {
    const queue=[...items];
    await Promise.all(Array.from({length:4},async()=>{while(queue.length){const k=queue.shift();await fn(k);}}));
}
const work=await mkdtemp(join(tmpdir(),'bcs-reviewed-images-'));
const digests=new Map();
await batch(paths,async k=>{
    const bytes=await read(k,false);
    if(!bytes.equals(Buffer.from(cleanPublicImage(bytes))))throw Error('Origin metadata changed');
    await writeFile(join(work,sha(k)),bytes,{mode:0o600});
    digests.set(k,sha(bytes));
});
const report=[...digests].map(([k,h])=>sha(k)+':'+h).sort().join('\n');
if(sha(report)!=='11bd89f066d34434f4dba39a9558db7e5927657dd0daef68c7f1f75ee93cc8d0')throw Error('Reviewed snapshot changed');
if(process.argv.includes('--refresh-legacy')) {
    const originallyStale=[];
    let changedSources=0; let refreshedCount=0;
    await batch(paths,async key=>{
        const expected=digests.get(key);
        if(sha(await read(key,true))===expected)return;
        originallyStale.push(key);
        const revised=key.replace(/(\.[^.]+)$/,'--clean-20261122$1');
        const data=await read(revised,true);
        if(sha(data)!==expected)throw Error('New public URL must match before cache refresh');
        const bound=key.indexOf('/');
        let authorized=false;
        for(let i=0;i<3;i++) {
            const bytes=await read(key,false);
            if(sha(bytes)===expected || sha(Buffer.from(cleanPublicImage(bytes)))===expected){authorized=true;break;}
            await new Promise(resolve=>setTimeout(resolve,1500*(i+1)));
        }
        if(!authorized){changedSources++;return;}
        const bucket=supabase.storage.from(key.slice(0,bound));
        const {error}=await bucket.update(key.slice(bound+1),data,{contentType:data[0]===137?'image/png':'image/jpeg',cacheControl:'0'});
        if(error)throw Error('Legacy expiry update failed');
        refreshedCount++;
    });
    console.log('LEGACY_CACHE_REFRESH '+JSON.stringify({audited:paths.length,staleBefore:originallyStale.length,refreshed:refreshedCount,changedSources}));
    if(originallyStale.length)await new Promise(r=>setTimeout(r,65000));
    let current=0;
    await batch(paths,async key=>{if(sha(await read(key,true))===digests.get(key))current++;});
    console.log('LEGACY_PUBLIC_READBACK '+JSON.stringify({total:paths.length,clean:current,stale:paths.length-current}));
    process.exit(0);
}
let success=0;
await batch(paths,async key=>{
    const bound=key.indexOf('/'),bucket=supabase.storage.from(key.slice(0,bound));
    const revised=key.replace(/(\.[^.]+)$/,'--clean-20261122$1');
    const file=revised.slice(bound+1);
    const bytes=await readFile(join(work,sha(key)));
    if(sha(bytes)!==digests.get(key))throw Error('Snapshot readback mismatch');
    const contentType=bytes[0]===137?'image/png':'image/jpeg';
    const {error}=await bucket.upload(file,bytes,{contentType,cacheControl:'3600',upsert:false});
    if(error&&!/already exists|duplicate|resource exists/i.test(error.message))throw Error('Versioned image write failed');
    if(sha(await read(revised,false))!==digests.get(key))throw Error('Versioned origin mismatch');
    let matched=false;
    for(let i=0;i<3;i++){
        if(sha(await read(revised,true))===digests.get(key)){matched=true;break;}
        await new Promise(r=>setTimeout(r,2000));
    }
    if(!matched)throw Error('Revised public URL did not match');
    success++;
});
console.log('VERIFIED_MEDIA_REVISIONS '+JSON.stringify({originals:digests.size,publicCopies:success,snapshot:sha(report)}));
