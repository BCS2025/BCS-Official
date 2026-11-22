import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { cleanPublicImage } from '../../src/lib/publicImagePrivacy.mjs';

const origin = 'https://qpdpsgmpqkxeqboyapwp.supabase.co';
const backupBucket = 'bcs-private-media-recovery';
const mode = process.argv[2];
if (!['--check','--apply','--verify'].includes(mode)) throw Error('Select --check, --apply or --verify');
if (process.env.VITE_SUPABASE_URL?.replace(/\/$/,'') !== origin) throw Error('Unexpected catalogue project');
const admin = createClient(origin, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const catalogue = createClient(origin, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function result(request) {
    const {data,error} = await request;
    if (error) throw Error(error.message);
    return data;
}
const collections = await Promise.all([
    result(catalogue.from('products').select('image_url,images,config_schema').eq('is_active',true)),
    result(catalogue.from('courses').select('cover_url,gallery_urls')),
    result(catalogue.from('forge_portfolio').select('image_url')),
    result(catalogue.from('class_locations').select('cover_url').eq('is_active',true)),
]);
const paths = new Set();
function collect(value) {
    if (Array.isArray(value)) return value.forEach(collect);
    if (value && typeof value === 'object') return Object.values(value).forEach(collect);
    if (typeof value !== 'string' || !value.startsWith(origin+'/storage/v1/object/public/')) return;
    const url = new URL(value);
    const key = decodeURIComponent(url.pathname.slice('/storage/v1/object/public/'.length));
    if (!/^(?:forge-portfolio\/portfolio|order-uploads\/uploads)\/[a-zA-Z0-9_-]+\.(?:png|jpe?g)$/i.test(key)) throw Error('Unrecognized published image type or path');
    paths.add(key);
}
collect(collections);
if (!paths.size) throw Error('No published media found');
let recovery;
if (mode === '--apply') {
    const all=await result(admin.storage.listBuckets());
    const bucket=all.find(b=>b.id===backupBucket);
    if (!bucket) await result(admin.storage.createBucket(backupBucket,{public:false}));
    const checked=await result(admin.storage.getBucket(backupBucket));
    if (checked.public!==false) throw Error('Backup must be private');
    recovery=admin.storage.from(backupBucket);
}
async function readPublic(key, fresh) {
    const url = new URL('/storage/v1/object/public/'+key,origin);
    if(fresh) url.searchParams.set('privacy-revision',crypto.randomUUID());
    const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(45000)});
    if(!response.ok) throw Error('Public image HTTP '+response.status);
    return Buffer.from(await response.arrayBuffer());
}
async function readOrigin(key) {
    const url=new URL('/storage/v1/object/authenticated/'+key,origin);
    url.searchParams.set('revision',crypto.randomUUID());
    const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response=await fetch(url,{headers:{apikey:secret,Authorization:'Bearer '+secret,'Cache-Control':'no-cache'},redirect:'error',signal:AbortSignal.timeout(45000)});
    if(!response.ok) throw Error('Origin image HTTP '+response.status);
    return Buffer.from(await response.arrayBuffer());
}
const proofs=[];
const stats={catalogue:paths.size,checked:0,changed:0,alreadyClean:0,needsCleaning:0,canonicalStale:0};
const queue=[...paths];
async function processOne(key) {
    const slash=key.indexOf('/'), folder=admin.storage.from(key.slice(0,slash)), file=key.slice(slash+1);
    const before=await readOrigin(key);
    const cleaned=Buffer.from(cleanPublicImage(before));
    if(!cleaned.equals(Buffer.from(cleanPublicImage(cleaned)))) throw Error('Non-idempotent conversion');
    const dirty=!before.equals(cleaned);
    if (dirty) stats.needsCleaning++; else stats.alreadyClean++;
    if(mode==='--verify' && dirty) throw Error('Origin still serves identifying metadata');
    if (mode==='--apply' && dirty) {
        const copy=digest(before)+'/'+key;
        const type=before[0]===137?'image/png':'image/jpeg';
        let backedUp=false;
        for (let attempt=0;attempt<3;attempt++) {
            // An interrupted upload can leave a correct object even when the API
            // reports a conflict. Only byte-for-byte readback authorizes replacement.
            const existing=await recovery.download(copy);
            if (existing.data) {
                if (digest(Buffer.from(await existing.data.arrayBuffer()))!==digest(before)) throw Error('Private backup hash mismatch');
                backedUp=true; break;
            }
            await recovery.upload(copy,before,{contentType:type,upsert:false});
            const saved=await recovery.download(copy);
            if (saved.data) {
                if (digest(Buffer.from(await saved.data.arrayBuffer()))!==digest(before)) throw Error('Private backup hash mismatch');
                backedUp=true; break;
            }
            await new Promise(r=>setTimeout(r,1500*(attempt+1)));
        }
        if(!backedUp) throw Error('Private backup could not be verified');
        if(!before.equals(await readOrigin(key))) throw Error('Published image changed while preparing');
        await result(folder.update(file,cleaned,{contentType:type,cacheControl:'60'}));
        let good=false;
        for(let i=0;i<4;i++) {
            if(cleaned.equals(await readOrigin(key))) {good=true;break;}
            await new Promise(r=>setTimeout(r,1800*(i+1)));
        }
        if(!good) throw Error('Updated image does not match on readback');
        stats.changed++;
    }
    if (mode==='--verify') {
        const [canonical,fresh]=await Promise.all([readPublic(key,false),readPublic(key,true)]);
        if(!fresh.equals(cleaned) || !canonical.equals(cleaned)) stats.canonicalStale++;
        proofs.push(digest(key)+':'+digest(cleaned));
    }
    stats.checked++;
}
const errors=[];
async function worker() {
    while(queue.length) {
        const key=queue.shift();
        try { await processOne(key); }
        catch(e){errors.push({key,error:e.message});}
    }
}
await Promise.all(Array.from({length:4},worker));
console.log('MEDIA_PRIVACY_RESULT '+JSON.stringify({...stats,errors:errors.length,mode}));
if(mode==='--verify') {
    proofs.sort();
    for(let i=0;i<proofs.length;i+=6) console.log('MEDIA_DIGEST '+proofs.slice(i,i+6).join(' '));
}
if(errors.length) { console.error(errors.slice(0,5).map(x=>[digest(x.key).slice(0,10),x.error])); throw Error('Public media check incomplete'); }
if(mode==='--verify' && stats.canonicalStale) console.warn('Some original CDN URLs still return a prior version.');

