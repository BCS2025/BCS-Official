// Strip identifying metadata without recompressing image data.
const ascii = new TextDecoder('latin1');
const sig = (buf, at, word) => [...word].every((c, i) => buf[at + i] === c.charCodeAt(0));
const u16 = (b, i) => b[i] * 256 + b[i + 1];
const u32 = (b, i) => b[i] * 0x1000000 + b[i + 1] * 65536 + b[i + 2] * 256 + b[i + 3];
function join(parts) {
    const output = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let pos = 0;
    for (const part of parts) { output.set(part, pos); pos += part.length; }
    return output;
}

function orientation(tiff) {
    if (tiff.length < 8) return 1;
    const le = sig(tiff, 0, 'II');
    if (!le && !sig(tiff, 0, 'MM')) return 1;
    const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
    if (view.getUint16(2, le) !== 42) return 1;
    const dir = view.getUint32(4, le);
    if (dir + 2 > tiff.length) return 1;
    const count = view.getUint16(dir, le);
    for (let i = 0; i < count; i++) {
        const p = dir + 2 + i * 12;
        if (p + 12 > tiff.length) break;
        if (view.getUint16(p, le) === 274 && view.getUint16(p + 2, le) === 3 && view.getUint32(p + 4, le) === 1) {
            const value = view.getUint16(p + 8, le);
            return value >= 1 && value <= 8 ? value : 1;
        }
    }
    return 1;
}
function orientationOnly(value) {
    return Uint8Array.of(73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,value,0,0,0,0,0,0,0);
}

function cleanJpeg(input) {
    const out = input.slice();
    let pos = 0;
    let images = 0;
    while (pos < out.length) {
        if (out[pos] === 0) { pos++; continue; }
        if (out[pos] !== 255 || out[pos + 1] !== 216) throw Error('Unsupported trailing JPEG data');
        pos += 2; images++;
        for (;;) {
            if (pos >= out.length || out[pos++] !== 255) throw Error('Invalid JPEG marker');
            while (out[pos] === 255) pos++;
            const mark = pos, type = out[pos++];
            if (type === 217) break;
            if (type === 1 || (type >= 208 && type <= 215)) continue;
            const end = pos + u16(out,pos), start = pos + 2;
            if (end < start || end > out.length) throw Error('Invalid JPEG segment');
            const data = out.subarray(start,end);
            if (type === 225 && sig(data,0,'Exif\0\0')) {
                const value = orientation(data.subarray(6));
                data.fill(0);
                if (data.length >= 32) {
                    data.set([69,120,105,102,0,0]); data.set(orientationOnly(value),6);
                } else { out[mark] = 254; }
            } else if (type === 225 && sig(data,0,'http://ns.adobe.com/xap/1.0/')) {
                // HDR gain maps use XMP to describe rendering. Retain their packet and
                // remove personal fields without moving the following MPO image.
                const xmlStart = data.indexOf(0) + 1;
                const xml = ascii.decode(data.subarray(xmlStart));
                if (/hdrgm:|GContainer:|Container:Directory|GainMap|HDRGainMap/i.test(xml)) {
                    const key = '(?:[\\w.-]+:)?(?:GPS[\\w.-]*|Author|creator|Artist|OwnerName|CameraOwnerName|BodySerialNumber|LensSerialNumber|CreatorContactInfo|Location|PersonInImage|City|Country|State|Address|History|DerivedFrom)';
                    const regex = new RegExp('<('+key+')(?=[\\s>])[^>]*>[\\s\\S]*?<\\/\\1\\s*>|<'+key+'(?=[\\s/])[^>]*/>|\\s'+key+'\\s*=\\s*(?:"[^"]*"|\'[^\']*\')','gi');
                    for (const match of xml.matchAll(regex)) data.fill(32,xmlStart+match.index,xmlStart+match.index+match[0].length);
                } else { out[mark] = 254; data.fill(0); }
            } else if (type === 225 || type === 237 || type === 254) {
                out[mark] = 254; data.fill(0);
            }
            pos=end;
            if (type === 218) {
                // Retain entropy-coded bytes, stuffed FF bytes, and restart markers.
                while (pos < out.length) {
                    if (out[pos++] !== 255) continue;
                    const at = pos-1;
                    while (out[pos]===255) pos++;
                    if (out[pos]===0 || (out[pos]>=208 && out[pos]<=215)) {pos++; continue;}
                    pos=at; break;
                }
            }
        }
    }
    if (!images) throw Error('Missing JPEG image');
    return out;
}
function pngChunk(type,data) {
    const buf = new Uint8Array(data.length+12), view = new DataView(buf.buffer);
    view.setUint32(0,data.length); buf.set([...type].map(c=>c.charCodeAt(0)),4); buf.set(data,8);
    let crc=0xffffffff;
    for (const byte of buf.subarray(4,buf.length-4)) {
        crc ^= byte;
        for (let i=0;i<8;i++) crc = (crc>>>1) ^ ((crc&1) ? 0xedb88320 : 0);
    }
    view.setUint32(buf.length-4,(crc^0xffffffff)>>>0);
    return buf;
}
function cleanPng(input) {
    const parts=[input.subarray(0,8)];
    for (let pos=8;pos+12<=input.length;) {
        const n=u32(input,pos), end=pos+12+n, type=ascii.decode(input.subarray(pos+4,pos+8));
        if (end>input.length) throw Error('Invalid PNG chunk');
        if (type==='eXIf') {
            const v=orientation(input.subarray(pos+8,end-4));
            if (v>1) parts.push(pngChunk('eXIf',orientationOnly(v)));
        } else if (!['tEXt','zTXt','iTXt','tIME'].includes(type)) parts.push(input.subarray(pos,end));
        if (type==='IEND') return join(parts);
        pos=end;
    }
    throw Error('Incomplete PNG');
}
export function cleanPublicImage(bytes) {
    if (bytes[0]===255 && bytes[1]===216) return cleanJpeg(bytes);
    if (bytes[0]===137 && sig(bytes,1,'PNG\r\n\u001a\n')) return cleanPng(bytes);
    throw Error('Expected a JPEG or PNG image');
}
export async function preparePublicImage(file) {
    if (!file) return file;
    const header=new Uint8Array(await file.slice(0,8).arrayBuffer());
    if (!(header[0]===255 && header[1]===216) && !(header[0]===137 && sig(header,1,'PNG'))) return file;
    const bytes=cleanPublicImage(new Uint8Array(await file.arrayBuffer()));
    return new File([bytes],file.name,{type:file.type,lastModified:file.lastModified});
}

