// GIF89a encoder. Fixed RGB 3-3-2 palette; reset LZW dictionary before 9-bit expansion.
export async function encodeGIF(canvas,count,draw,check){
const w=canvas.width,h=canvas.height,parts=[];const header=[];const b=x=>header.push(x&255),word=x=>{b(x);b(x>>8)},str=s=>{for(const x of s)b(x.charCodeAt(0))};
str('GIF89a');word(w);word(h);b(0xf7);b(0);b(0);
for(let i=0;i<256;i++){b(Math.round((i>>5)*255/7));b(Math.round(((i>>2)&7)*255/7));b((i&3)*85)}
str('\x21\xff\x0bNETSCAPE2.0\x03\x01\x00\x00\x00');parts.push(new Uint8Array(header));
for(let frame=0;frame<count;frame++){check();draw(frame);const rgba=canvas.getContext('2d').getImageData(0,0,w,h).data;const out=[];const put=x=>out.push(x&255),u16=x=>{put(x);put(x>>8)};
put(0x21);put(0xf9);put(4);put(4);u16(10);put(0);put(0);put(0x2c);u16(0);u16(0);u16(w);u16(h);put(0);put(8);
let bits=0,nb=0,block=[],run=0;const byte=x=>{block.push(x);if(block.length===255){put(255);out.push(...block);block=[]}};const code=x=>{bits|=x<<nb;nb+=9;while(nb>=8){byte(bits&255);bits>>>=8;nb-=8}};
code(256);for(let j=0;j<rgba.length;j+=4){if(run===250){code(256);run=0}code((rgba[j]&224)|((rgba[j+1]&224)>>3)|(rgba[j+2]>>6));run++}code(257);if(nb)byte(bits&255);if(block.length){put(block.length);out.push(...block)}put(0);parts.push(new Uint8Array(out));await new Promise(r=>setTimeout(r,0))}
parts.push(new Uint8Array([0x3b]));return new Blob(parts,{type:'image/gif'})}
