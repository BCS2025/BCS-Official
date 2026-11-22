import fs from 'node:fs/promises';
import path from 'node:path';

const account = (process.env.PAYMENT_ACCOUNT || process.env.VITE_PAYMENT_ACCOUNT || '').trim();
const bank = (process.env.PAYMENT_BANK_NAME || process.env.VITE_PAYMENT_BANK_NAME || '').trim();
if (!bank || account.replace(/[^0-9]/g,'').length < 7) throw Error('Production transfer configuration incomplete');
const name=(process.env.VITE_PAYMENT_ACCOUNT_NAME || '').trim();
const privateValues=[account,account.replace(/[-\s]/g,'')];
if (name.length>=2 && !name.includes('比創') && !/公司|工作室/.test(name)) privateValues.push(name);
let pages=0, chunks=0;
async function scan(dir) {
    for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
        const file=path.join(dir,entry.name);
        if(entry.isDirectory()) {await scan(file); continue;}
        if (!/\.(?:js|html|map|json)$/.test(file)) continue;
        const text=(await fs.readFile(file,'utf8')).replace(/\\u([a-f\d]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
        if (privateValues.some(v=>v && text.includes(v))) throw Error('Private transfer details in browser build: '+entry.name);
        if(entry.name.endsWith('.html')) pages++;
        if(entry.name.endsWith('.js')) chunks++;
    }
}
await scan('dist');
const forge=await fs.readFile('dist/forge/index.html','utf8');
if (!forge.includes('比創空間工程團隊') || !chunks || !pages) throw Error('Workshop update missing from prerendered HTML');
console.log('PRIVACY_BUILD_OK '+JSON.stringify({pages,chunks,transferConfiguration:'available'}));
