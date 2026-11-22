import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const origin='https://www.bcs.tw';
const prev='b77e22730d729608022d0a213bc9150072b4f47f';
const pay=execFileSync('git',['show',prev+':src/lib/paymentService.js'],{encoding:'utf8'});
const secrets=['ACCOUNT','ACCOUNT_NAME'].map(f=>pay.match(new RegExp('VITE_PAYMENT_'+f+" \\|\\| '([^']+)'"))?.[1]);
if(secrets.some(v=>!v)) throw Error('Missing audit baseline');
const fingerprint=b=>createHash('sha256').update(b).digest('hex');
async function get(url) {
    const res=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000)});
    if(!res.ok) throw Error('Unexpected public status '+res.status);
    return res;
}
function safe(text) {
    const decoded=text.replace(/\\u([0-9a-f]{4})/gi,(_,s)=>String.fromCharCode(parseInt(s,16)));
    if(secrets.some(v=>decoded.includes(v))) throw Error('Identifying value found');
}
const sitemap=await (await get(origin+'/sitemap.xml')).text();
const paths=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
if(paths.length<8 || paths.some(p=>new URL(p).origin!==origin)) throw Error('Unexpected sitemap');
paths.push(origin+'/store/cart');
const js=new Set(); let forge=false;
async function batch(items,fn) {
    const queue=[...items];
    await Promise.all(Array.from({length:4},async()=>{while(queue.length)await fn(queue.shift());}));
}
await batch(paths,async url=>{
    const html=await(await get(url)).text();
    if(!html.includes('<html')) throw Error('Incomplete visitor page');
    safe(html);
    if(new URL(url).pathname==='/forge') forge=html.includes('比創空間工程團隊');
    for(const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)) js.add(m[1]);
});
if(!forge || !js.size) throw Error('Workshop did not serve release copy');
const checked=new Set();
while(js.size) {
    const chunk=js.values().next().value;js.delete(chunk);
    if(checked.has(chunk))continue;
    checked.add(chunk);
    const body=await(await get(origin+chunk)).text();
    safe(body);
    for(const m of body.matchAll(/["']((?:\.\/|assets\/|\/assets\/)[\w-]+\.js)["']/g)) {
       const next='/assets/'+m[1].split('/').pop();
       if(!checked.has(next)) js.add(next);
    }
}
const images=execFileSync('git',['diff','--name-only','-z',prev,'HEAD','--','public'],{encoding:'utf8'}).split('\0').filter(p=>/\.(png|jpeg|jpg)$/i.test(p));
if(images.length!==24) throw Error('Reviewed file set mismatch');
await batch(images,async file=>{
    const bytes=await(await get(origin+'/'+file.slice(7).split('/').map(encodeURIComponent).join('/'))).arrayBuffer();
    if(fingerprint(Buffer.from(bytes))!==fingerprint(await fs.readFile(file))) throw Error('Public file hash mismatch');
});
const denied=await fetch(origin+'/api/payment/bank-transfer',{redirect:'error',signal:AbortSignal.timeout(15000)});
if(denied.status!==405 || !denied.headers.get('cache-control')?.includes('no-store')) throw Error('Transfer instructions available without a receipt');
const invalid=await fetch(origin+'/api/payment/bank-transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});
if(invalid.status!==400 || (await invalid.text()).includes('account')) throw Error('Invalid receipt handling failed');
console.log('LIVE_PRIVACY_OK '+JSON.stringify({pages:paths.length,javascriptFiles:checked.size,staticImageHashes:images.length,transferAnonymous:denied.status,invalidReceipt:invalid.status,verifiedWorkshop:forge}));
