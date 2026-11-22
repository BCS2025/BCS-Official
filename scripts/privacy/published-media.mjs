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
const stats={catalogue:paths.size,checked:0,changed:0,alreadyClean:0,needsCleaning:0,canonicalStale:0};
const queue=[...paths];
async function processOne(key) {
    const slash=key.indexOf('/'), folder=admin.storage.from(key.slice(0,slash)), file=key.slice(slash+1);
    const before=await readPublic(key,true);
    const cleaned=Buffer.from(cleanPublicImage(before));
    if(!cleaned.equals(Buffer.from(cleanPublicImage(cleaned)))) throw Error('Non-idempotent conversion');
    const dirty=!before.equals(cleaned);
    if (dirty) stats.needsCleaning++; else stats.alreadyClean++;
    if(mode==='--verify' && dirty) throw Error('Origin still serves identifying metadata');
    if (mode==='--apply' && dirty) {
        const copy=digest(before)+'/'+key;
        const type=before[0]===137?'image/png':'image/jpeg';
        const upload=await recovery.upload(copy,before,{contentType:type,upsert:false});
        if(upload.error && !/already exists|duplicate/i.test(upload.error.message)) throw Error('Private backup failed');
        const backed=await result(recovery.download(copy));
        if(digest(Buffer.from(await backed.arrayBuffer()))!==digest(before)) throw Error('Backup verification failed');
        if(!before.equals(await readPublic(key,true))) throw Error('Published image changed while preparing');
        await result(folder.update(file,cleaned,{contentType:type,cacheControl:'60'}));
        let good=false;
        for(let i=0;i<4;i++) {
            if(cleaned.equals(await readPublic(key,true))) {good=true;break;}
            await new Promise(r=>setTimeout(r,1800*(i+1)));
        }
        if(!good) throw Error('Updated image does not match on readback');
        stats.changed++;
    }
    if (mode==='--verify') {
        const canonical=await readPublic(key,false);
        if(!canonical.equals(cleaned)) stats.canonicalStale++;
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
if(errors.length) { console.error(errors.slice(0,5).map(x=>[digest(x.key).slice(0,10),x.error])); throw Error('Public media check incomplete'); }
if(mode==='--verify' && stats.canonicalStale) console.warn('Some original CDN URLs still return a prior version.');

