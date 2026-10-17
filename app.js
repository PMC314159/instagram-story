const $=id=>document.getElementById(id), canvas=$('canvas'),ctx=canvas.getContext('2d');
let stories=[],index=0,selected=-1,playing=false,start=0,time=0,busy=false,canceled=false,previewAudio=null;
const val=id=>$(id).value,num=id=>Number(val(id)),current=()=>stories[index];
const duration=()=>Math.max(2,Math.min(30,num('duration')||5));
const accountFields=['username','posted','music'];
function groupStart(i){while(i>0&&stories[i]?.samePrevious)i--;return i}
function owner(i=index){return stories[groupStart(i)]}
function audioSegment(i,t=0){const root=groupStart(i),s=stories[root];return {root,url:s?.audioURL,offset:Math.max(0,Number(s?.audioStart)||0)+(i-root)*duration()+t}}
function musicPlan(ids){const out=[];ids.forEach((i,k)=>{const a=audioSegment(i);if(!a.url)return;const last=out.at(-1);if(last&&last.root===a.root&&last.lastIndex+1===i){last.length+=duration();last.lastIndex=i}else out.push({...a,at:k*duration(),length:duration(),lastIndex:i})});return out}
function groupControls(){const o=owner();$('samePrevious').disabled=index===0;$('samePrevious').value=index>0&&current()?.samePrevious?'same':'different';$('groupHint').textContent=index===0?'첫 번째 사람의 스토리예요.':current()?.samePrevious?'이전 스토리와 프로필·음악을 공유해요. 아래에서 바꾸면 같은 사람의 스토리에 함께 적용돼요.':'여기서 새로운 사람의 스토리가 시작돼요. 이전 음악은 이어지지 않아요.';for(const k of accountFields)$(k).value=o?.[k]||'';$('audioStart').value=o?.audioStart||0;$('audioName').textContent=o?.audioName||'선택한 음악 없음';$('audio').value=''}
$('samePrevious').onchange=()=>{if(!current()||index===0)return;const same=val('samePrevious')==='same';stop();current().samePrevious=same;sync()};
$('audioStart').oninput=()=>{const offset=Math.max(0,num('audioStart'));stop();if(owner())owner().audioStart=offset;groupControls();draw()};
$('clearAudio').onclick=()=>{stop();const o=owner();if(o){if(o.audioURL)URL.revokeObjectURL(o.audioURL);o.audioURL=null;o.audioName='';groupControls()}};
function status(s){$('status').textContent=s}
async function loadImage(file){const url=URL.createObjectURL(file);try{const im=new Image();im.src=url;await im.decode();return im}finally{URL.revokeObjectURL(url)}}
$('photos').onchange=async e=>{try{for(const f of e.target.files){stories.push({image:await loadImage(f),samePrevious:stories.length>0,audioURL:null,audioName:'',audioStart:0,avatar:null,username:'your.archive',posted:'2시간',music:'',credit:'',creditPosition:'right',creditColor:'#ffffff',creditSize:14,fit:'cover',gradientOpacity:60,gradientHeight:160,bg:'#18151e',layers:[],liked:false,animateLike:true,send:false,typingSpeed:8,message:'오늘도 좋아해 ♡',actionAt:1})}index=Math.max(0,stories.length-e.target.files.length);sync()}catch(e){status('사진을 열지 못했어요. JPG 또는 PNG를 사용해 주세요.')}e.target.value=''};
$('avatar').onchange=async e=>{const s=owner();if(!s){e.target.value='';return status('먼저 스토리 사진을 추가해 주세요.')}if(e.target.files[0]){try{s.avatar=await loadImage(e.target.files[0]);draw()}catch{status('프로필 사진을 열지 못했어요.')}}e.target.value=''};
$('clearAvatar').onclick=()=>{if(owner()){owner().avatar=null;draw()}};

$('audio').onchange=e=>{const f=e.target.files[0];stop();const o=owner();if(!o)return status('먼저 사진을 추가해 주세요.');if(f){if(o.audioURL)URL.revokeObjectURL(o.audioURL);o.audioURL=URL.createObjectURL(f);o.audioName=f.name}groupControls()};
function thumbs(){$('thumbs').replaceChildren();stories.forEach((s,i)=>{const b=document.createElement('button');b.className=i===index?'active':'';b.title=`스토리 ${i+1}`;const im=document.createElement('img');im.src=s.image.src;b.append(im);b.onclick=()=>go(i);$('thumbs').append(b)})}
// Decoded images keep their pixels after revoking their temporary URL; thumbnails use a small canvas.
function thumbsSafe(){thumbs();[...$('thumbs').children].forEach((b,i)=>{const c=document.createElement('canvas');c.width=60;c.height=80;c.getContext('2d').drawImage(stories[i].image,0,0,60,80);b.firstChild.src=c.toDataURL()})}
function sync(){stop();time=0;selected=-1;const s=current();if(s){for(const k of ['username','posted','music','fit','bg','gradientOpacity','gradientHeight','message','typingSpeed','actionAt','credit','creditPosition','creditColor','creditSize'])$(k).value=s[k];for(const k of ['liked','animateLike','send'])$(k).checked=s[k]}groupControls();thumbsSafe();layers();draw()}
function layers(){const box=$('layers');box.replaceChildren();current()?.layers.forEach((l,i)=>{const o=new Option(l.text.slice(0,25)||'빈 텍스트',i);box.add(o)});box.selectedIndex=selected;const l=current()?.layers[selected];$('text').value=l?.text||'';if(l){$('color').value=l.color;$('size').value=l.size;$('textStyle').value=l.style}$('rotation').value=l?.rotation||0;$('rotationValue').textContent=($('rotation').value)+'°'}
function go(i){if(busy)return;index=Math.max(0,Math.min(stories.length-1,i));sync()}
$('prev').onclick=()=>go(index-1);$('next').onclick=()=>go(index+1);$('reset').onclick=()=>{stop();time=0;draw()};
for(const [id,delta]of [['left',-1],['right',1]])$(id).onclick=()=>{const j=index+delta;if(j<0||j>=stories.length)return;[stories[index],stories[j]]=[stories[j],stories[index]];index=j;sync()};
$('remove').onclick=()=>{if(current()){stories.splice(index,1);index=Math.max(0,Math.min(index,stories.length-1));sync()}};
for(const id of ['username','posted','music','fit','bg','gradientOpacity','gradientHeight','message','typingSpeed','actionAt','liked','animateLike','send','credit','creditPosition','creditColor','creditSize'])$(id).oninput=()=>{if(current())(accountFields.includes(id)?owner():current())[id]=$(id).type==='checkbox'?$(id).checked: ['actionAt','creditSize','typingSpeed','gradientOpacity','gradientHeight'].includes(id)?num(id):val(id);draw()};
for(const id of ['transition'])$(id).oninput=()=>draw();
function add(mention){if(!current())return status('먼저 사진을 추가해 주세요.');current().layers.push({text:mention?'@username':'여기에 텍스트',x:270,y:480,size:32,color:'#ffffff',rotation:0,style:mention?'mentionBlack':'plain'});selected=current().layers.length-1;layers();draw()}
$('addText').onclick=()=>add(false);$('addMention').onclick=()=>add(true);$('layers').onchange=()=>{selected=Number(val('layers'));layers();draw()};
for(const id of ['text','color','size','textStyle','rotation'])$(id).oninput=()=>{const l=current()?.layers[selected];if(!l)return;l[{text:'text',color:'color',size:'size',textStyle:'style',rotation:'rotation'}[id]]=['size','rotation'].includes(id)?num(id):val(id);$('rotationValue').textContent=(l.rotation||0)+'°';draw()};
$('deleteText').onclick=()=>{if(selected>=0){current().layers.splice(selected,1);selected=-1;layers();draw()}};
function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke()}}
function text(c,t,x,y,size=20,color='#fff',align='left'){c.font=`${size}px system-ui, sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(t,x,y)}
function image(c,im,x,y,w,h,fit='cover'){const k=fit==='cover'?Math.max(w/im.width,h/im.height):Math.min(w/im.width,h/im.height);c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(im,x+(w-im.width*k)/2,y+(h-im.height*k)/2,im.width*k,im.height*k);c.restore()}
function heart(c,x,y,active,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.beginPath();c.moveTo(0,12);c.bezierCurveTo(-35,-7,-18,-29,0,-12);c.bezierCurveTo(18,-29,35,-7,0,12);c.lineWidth=2.4;c.strokeStyle=active?'#ff375f':'white';c.fillStyle='#ff375f';active?c.fill():c.stroke();c.restore()}
function layer(c,l){
 c.save();c.translate(l.x,l.y);c.rotate((l.rotation||0)*Math.PI/180);
 const mention=l.style.startsWith('mention');
 const lines=(mention?'@'+l.text.replace(/^@+/,'').replace(/\n/g,' '):l.text).split('\n');
 c.font=`${l.size}px system-ui, sans-serif`;
 const w=Math.max(...lines.map(t=>c.measureText(t).width)),h=lines.length*l.size*1.3;
 if(l.style==='label')rr(c,-w/2-12,-h/2-8,w+24,h+16,8,'#fff');
 if(l.style==='mentionBlack')rr(c,-w/2-14,-h/2-9,w+28,h+18,10,'#080808');
 if(l.style==='mentionGlass')rr(c,-w/2-14,-h/2-9,w+28,h+18,10,'#ffffff18','#ffffff35');
 if(l.style==='mentionGradient'){
  const line=lines[0],at=c.measureText('@').width;
  const g=c.createLinearGradient(-w/2,-h/2,-w/2+at,h/2);g.addColorStop(0,'#ffce54');g.addColorStop(.3,'#ff6849');g.addColorStop(.6,'#e4389b');g.addColorStop(1,'#7754e9');
  text(c,'@',-w/2,0,l.size,g);text(c,line.slice(1),-w/2+at,0,l.size,'#080808');
 }else{
  c.shadowColor=l.style==='plain'?'#0009':'transparent';c.shadowBlur=5;
  const color=['mentionBlack','mentionGlass'].includes(l.style)?'#fff':l.style==='label'?'#18131d':l.color;
  lines.forEach((t,i)=>text(c,t,0,-h/2+l.size*.65+i*l.size*1.3,l.size,color,'center'));
 }c.restore();
}

function renderStory(c,s,i,t){const account=owner(i)||s;c.fillStyle=s?.bg||'#18151e';c.fillRect(0,0,540,960);if(s)image(c,s.image,0,0,540,872,s.fit);else{text(c,'나의 작은 순간들',270,420,30,'#d6c5e5','center');text(c,'사진을 추가해 이야기를 시작하세요',270,465,18,'#ab96bb','center')}
const gradientHeight=Math.max(40,Math.min(600,s?.gradientHeight??160)),gradientOpacity=Math.max(0,Math.min(100,s?.gradientOpacity??60))/100;const gradient=c.createLinearGradient(0,0,0,gradientHeight);gradient.addColorStop(0,`rgba(0,0,0,${gradientOpacity})`);gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;c.fillRect(0,0,540,gradientHeight);
const n=Math.max(1,stories.length),gap=n>40?1:4,w=(516-(n-1)*gap)/n;for(let j=0;j<n;j++){rr(c,12+j*(w+gap),14,w,3,1,'#ffffff55');let f=j<i?1:j===i?Math.min(1,t/duration()):0;if(f)rr(c,12+j*(w+gap),14,w*f,3,1,'#fff')}
c.save();c.beginPath();c.arc(35,52,19,0,Math.PI*2);c.clip();if(account?.avatar)image(c,account.avatar,16,33,38,38);else{c.fillStyle='#ab8bbd';c.fillRect(16,33,38,38);text(c,'S',35,53,19,'white','center')}c.restore();
text(c,(account?.username||'your.archive'),65,(account?.music||'')?43:52,18);c.font='18px system-ui';const uw=Math.min(270,c.measureText((account?.username||'your.archive')).width);text(c,(account?.posted||''),75+uw,(account?.music||'')?43:52,16,'#ffffffaa');if((account?.music||''))text(c,'♫ '+(account?.music||''),65,68,14);text(c,'···',470,50,26);text(c,'×',511,50,32);
s?.layers.forEach(l=>layer(c,l));if(s?.credit?.trim()){c.save();c.shadowColor='#000b';c.shadowBlur=4;const left=s.creditPosition==='left';text(c,s.credit,left?16:524,852,s.creditSize||14,s.creditColor||'#ffffff',left?'left':'right');c.restore()}c.fillStyle='#080808';c.fillRect(0,872,540,88);
const a=Math.max(0,t-(s?.actionAt||0)),send=Boolean(s?.send&&s.message?.trim());
const chars=Array.from(s?.message||''),speed=Math.max(1,Math.min(60,Number(s?.typingSpeed)||8));
const typingDuration=chars.length/speed,sendAt=typingDuration+.3,flightDuration=.5;
const typed=send&&a>0&&a<sendAt?chars.slice(0,Math.min(chars.length,Math.floor(a*speed))).join(''):'';
const sending=send&&a>=sendAt&&a<sendAt+flightDuration;

rr(c,18,887,389,48,25,null,'#ffffff88');c.save();c.beginPath();c.rect(31,890,358,43);c.clip();text(c,typed||'메시지 보내기…',37,911,18,typed?'#fff':'#ffffffbb');c.restore();if(typed)text(c,'↑',382,911,25);else text(c,'☺',369,910,26);
const liked=s?.liked||(s?.animateLike&&a>.35);heart(c,442,912,liked,1+(s?.animateLike&&a>.35&&a<.65?.2:0));c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(481,902);c.lineTo(516,893);c.lineTo(504,925);c.lineTo(497,911);c.closePath();c.stroke();c.beginPath();c.moveTo(497,911);c.lineTo(516,893);c.stroke();
if(sending){const p=Math.max(0,Math.min(1,(a-sendAt)/flightDuration));c.save();c.globalAlpha=Math.max(0,Math.min(1,1-p));rr(c,120,820-p*90,375,48,22,'#6354d8');c.beginPath();c.rect(132,820-p*90,351,48);c.clip();text(c,s.message.replace(/\n/g,' '),308,844-p*90,18,'#fff','center');c.restore()}

}
function paint(c,i,t,allowTransition=true){c.save();c.scale(c.canvas.width/540,c.canvas.height/960);const d=duration(),s=stories[i];if(allowTransition&&val('transition')==='slide'&&i<stories.length-1&&t>d-.32){const p=(t-d+.32)/.32;const e=p*p*(3-2*p);c.save();c.translate(-540*e,0);renderStory(c,s,i,t);c.restore();c.save();c.translate(540*(1-e),0);renderStory(c,stories[i+1],i+1,0);c.restore()}else renderStory(c,s,i,t);c.restore()}
function draw(){paint(ctx,index,time)}
function stop(){playing=false;$('play').textContent='▶ 재생';previewAudio?.pause();const s=current();if(s){for(const k of ['username','posted','music','fit','bg','gradientOpacity','gradientHeight','message','typingSpeed','actionAt','credit','creditPosition','creditColor','creditSize'])$(k).value=s[k];for(const k of ['liked','animateLike','send'])$(k).checked=s[k]}selected=-1;groupControls();layers()}
let previewRoot=-1,previewToken=0;
function playMusic(i,t){const a=audioSegment(i,t);if(a.root===previewRoot)return;previewRoot=a.root;const token=++previewToken;previewAudio?.pause();previewAudio=null;if(!a.url)return;const audio=new Audio(a.url);previewAudio=audio;audio.onloadedmetadata=()=>{if(token!==previewToken||!playing)return;if(a.offset>=audio.duration)return;audio.currentTime=a.offset;audio.play().catch(()=>{if(token===previewToken)status('음악 재생을 시작하지 못했어요.')})};audio.load()}
$('play').onclick=()=>{if(busy||!stories.length)return;if(playing){stop();return}time=0;start=performance.now()-index*duration()*1000;playing=true;previewRoot=-1;$('play').textContent='Ⅱ 일시정지';playMusic(index,0);requestAnimationFrame(tick)};
function tick(now){if(!playing)return;const total=(now-start)/1000;if(total>=stories.length*duration()){index=stories.length-1;time=duration();stop();draw();return}index=Math.floor(total/duration());time=total%duration();playMusic(index,time);paint(ctx,index,time);requestAnimationFrame(tick)}

let drag=null;canvas.onpointerdown=e=>{if(busy||playing)return;const b=canvas.getBoundingClientRect(),x=(e.clientX-b.left)*540/b.width,y=(e.clientY-b.top)*960/b.height;const ls=current()?.layers||[];let hit=-1;for(let i=ls.length-1;i>=0;i--){const l=ls[i];ctx.font=`${l.size}px system-ui`;const lines=(l.style.startsWith('mention')?'@'+l.text.replace(/^@+/,'').replace(/\n/g,' '):l.text).split('\n'),w=Math.max(...lines.map(x=>ctx.measureText(x).width))+30;const angle=-(l.rotation||0)*Math.PI/180,dx=x-l.x,dy=y-l.y,rx=dx*Math.cos(angle)-dy*Math.sin(angle),ry=dx*Math.sin(angle)+dy*Math.cos(angle);if(Math.abs(rx)<w/2&&Math.abs(ry)<lines.length*l.size*.7+12){hit=i;break}}drag={x,y,hit,lx:hit>=0?ls[hit].x:0,ly:hit>=0?ls[hit].y:0,moved:false};if(hit>=0){selected=hit;layers()}canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!drag)return;const b=canvas.getBoundingClientRect(),x=(e.clientX-b.left)*540/b.width,y=(e.clientY-b.top)*960/b.height;drag.dx=x-drag.x;drag.dy=y-drag.y;if(Math.hypot(drag.dx,drag.dy)>5)drag.moved=true;if(drag.hit>=0){const l=current().layers[drag.hit];l.x=Math.max(10,Math.min(530,drag.lx+drag.dx));l.y=Math.max(100,Math.min(840,drag.ly+drag.dy));draw()}};
canvas.onpointerup=()=>{if(!drag)return;const d=drag;drag=null;if(d.hit>=0)return;if(d.moved){if(Math.abs(d.dx)>40)go(index+(d.dx<0?1:-1))}else if(d.y>880&&d.x>418&&d.x<468&&current()){current().liked=!current().liked;$('liked').checked=current().liked;draw()}else if(d.y<870)go(index+(d.x<270?-1:1))};canvas.onpointercancel=()=>drag=null;
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.textContent=name+' 다시 다운로드';a.style.display='block';$('downloads').append(a);a.click()}
$('png').onclick=()=>{const c=document.createElement('canvas');c.width=1080;c.height=1920;paint(c.getContext('2d'),index,time);c.toBlob(b=>{if(b)download(b,'story.png')})};
function range(){return val('scope')==='current'?[index]:stories.map((_,i)=>i)}
function exportFrame(c,ids,t){const k=Math.min(ids.length-1,Math.floor(t/duration()));paint(c,ids[k],t-k*duration(),k<ids.length-1)}
async function runExport(fn){if(!stories.length)return status('먼저 사진을 추가해 주세요.');stop();busy=true;canceled=false;document.querySelector('aside').inert=true;document.querySelectorAll('.toolbar button,#png,#gif,#mp4').forEach(b=>b.disabled=true);$('cancel').hidden=false;$('progress').hidden=false;$('progress').value=0;try{await document.fonts.ready;await fn();if(!canceled)status('저장이 완료됐어요. 아래 링크로 다시 받을 수 있어요.')}catch(e){status(canceled?'저장을 취소했어요.':'저장 실패: '+e.message)}finally{busy=false;document.querySelector('aside').inert=false;document.querySelectorAll('.toolbar button,#png,#gif,#mp4').forEach(b=>b.disabled=false);$('cancel').hidden=true;$('progress').hidden=true;draw()}}
$('cancel').onclick=()=>{canceled=true};function check(){if(canceled)throw Error('취소')}
$('gif').onclick=()=>runExport(async()=>{const {encodeGIF}=await import('./gif-encoder.js');const ids=range(),c=document.createElement('canvas');c.width=360;c.height=640;const count=Math.ceil(ids.length*duration()*10);const blob=await encodeGIF(c,count,(k)=>{check();exportFrame(c.getContext('2d',{willReadFrequently:true}),ids,k/10);$('progress').value=(k+1)/count;status(`GIF 만드는 중 ${Math.round((k+1)/count*100)}%`)},check);check();download(blob,'stories.gif')});
$('mp4').onclick=()=>runExport(async()=>{
 if(!window.VideoEncoder||!window.VideoFrame)throw Error('정확한 MP4 저장에는 최신 PC Chrome 또는 Edge가 필요해요.');
 const ids=range(),fps=30,seconds=ids.length*duration(),count=Math.round(seconds*fps),c=document.createElement('canvas');c.width=num('quality');c.height=c.width*16/9;
 const config={codec:'avc1.640033',width:c.width,height:c.height,bitrate:c.width===1080?14000000:8000000,framerate:fps,avc:{format:'avc'}};
 if(!(await VideoEncoder.isConfigSupported(config)).supported)throw Error('이 기기에서 해당 MP4 해상도를 지원하지 않아요. 720 해상도를 선택해 주세요.');
 const plan=musicPlan(ids),decoded=new Map();let ac,ve,ae,encodingError;
 try{
  if(plan.length){
   if(!window.AudioEncoder||!window.AudioData)throw Error('음악을 포함한 MP4는 최신 PC Chrome·Edge에서 열어주세요.');
   ac=new AudioContext();for(const segment of plan){check();if(!decoded.has(segment.url))decoded.set(segment.url,await ac.decodeAudioData(await(await fetch(segment.url)).arrayBuffer()));if(segment.offset>=decoded.get(segment.url).duration)status('음악 끝을 지난 구간은 무음으로 저장돼요.')}
  }
  const channels=plan.length?2:0,sampleRate=48000;
  const audioConfig={codec:'mp4a.40.2',sampleRate,numberOfChannels:channels,bitrate:192000};
  if(plan.length&&!(await AudioEncoder.isConfigSupported(audioConfig)).supported)throw Error('이 브라우저는 AAC 오디오 저장을 지원하지 않아요.');
  const {Muxer,ArrayBufferTarget}=storyMP4,target=new ArrayBufferTarget();
  const muxer=new Muxer({target,video:{codec:'avc',width:c.width,height:c.height},...(plan.length?{audio:{codec:'aac',sampleRate,numberOfChannels:channels}}:{}),fastStart:'in-memory',firstTimestampBehavior:'strict'});
  ve=new VideoEncoder({output:(chunk,meta)=>muxer.addVideoChunk(chunk,meta),error:e=>encodingError=e});ve.configure(config);
  const context=c.getContext('2d');
  for(let k=0;k<count;k++){
   check();if(encodingError)throw encodingError;
   exportFrame(context,ids,k/fps);
   const timestamp=Math.round(k*1000000/fps),end=Math.round((k+1)*1000000/fps);
   const frame=new VideoFrame(c,{timestamp,duration:end-timestamp});try{ve.encode(frame,{keyFrame:k%(fps*2)===0})}finally{frame.close()}
   if(ve.encodeQueueSize>8)await ve.flush();
   if(k%3===0){$('progress').value=.85*(k+1)/count;status(`MP4 프레임 만드는 중 ${Math.round((k+1)/count*100)}% · 예상 길이 ${seconds}초`);await new Promise(r=>setTimeout(r,0))}
  }
  await ve.flush();if(encodingError)throw encodingError;
  if(plan.length){
   const offline=new OfflineAudioContext(channels,Math.round(seconds*sampleRate),sampleRate);
   for(const segment of plan){const buffer=decoded.get(segment.url),remaining=buffer.duration-segment.offset;if(remaining<=0)continue;const src=offline.createBufferSource();src.buffer=buffer;src.connect(offline.destination);src.start(segment.at,segment.offset,Math.min(segment.length,remaining))}
   const audio=await offline.startRendering();
   ae=new AudioEncoder({output:(chunk,meta)=>muxer.addAudioChunk(chunk,meta),error:e=>encodingError=e});ae.configure(audioConfig);
   for(let pos=0;pos<audio.length;pos+=1024){
    check();if(encodingError)throw encodingError;const n=Math.min(1024,audio.length-pos),data=new Float32Array(n*channels);for(let ch=0;ch<channels;ch++)data.set(audio.getChannelData(ch).subarray(pos,pos+n),ch*n);
    const frame=new AudioData({format:'f32-planar',sampleRate,numberOfFrames:n,numberOfChannels:channels,timestamp:Math.round(pos*1000000/sampleRate),data});try{ae.encode(frame)}finally{frame.close()}
    if(ae.encodeQueueSize>32)await ae.flush();
    if(pos%16384===0){$('progress').value=.85+.15*pos/audio.length;status('MP4 음악 합치는 중…');await new Promise(r=>setTimeout(r,0))}
   }await ae.flush();
  }
  check();if(encodingError)throw encodingError;muxer.finalize();download(new Blob([target.buffer],{type:'video/mp4'}),'stories.mp4');$('progress').value=1;
 }finally{if(ve&&ve.state!=='closed')ve.close();if(ae&&ae.state!=='closed')ae.close();if(ac)await ac.close()}
});

draw();

// mp4-muxer 5.2.2 (MIT license, bundled to avoid external runtime dependencies).
const storyMP4=(()=>{
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/misc.ts
var bytes = new Uint8Array(8);
var view = new DataView(bytes.buffer);
var u8 = (value) => {
  return [(value % 256 + 256) % 256];
};
var u16 = (value) => {
  view.setUint16(0, value, false);
  return [bytes[0], bytes[1]];
};
var i16 = (value) => {
  view.setInt16(0, value, false);
  return [bytes[0], bytes[1]];
};
var u24 = (value) => {
  view.setUint32(0, value, false);
  return [bytes[1], bytes[2], bytes[3]];
};
var u32 = (value) => {
  view.setUint32(0, value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3]];
};
var i32 = (value) => {
  view.setInt32(0, value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3]];
};
var u64 = (value) => {
  view.setUint32(0, Math.floor(value / 2 ** 32), false);
  view.setUint32(4, value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7]];
};
var fixed_8_8 = (value) => {
  view.setInt16(0, 2 ** 8 * value, false);
  return [bytes[0], bytes[1]];
};
var fixed_16_16 = (value) => {
  view.setInt32(0, 2 ** 16 * value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3]];
};
var fixed_2_30 = (value) => {
  view.setInt32(0, 2 ** 30 * value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3]];
};
var ascii = (text, nullTerminated = false) => {
  let bytes2 = Array(text.length).fill(null).map((_, i) => text.charCodeAt(i));
  if (nullTerminated)
    bytes2.push(0);
  return bytes2;
};
var last = (arr) => {
  return arr && arr[arr.length - 1];
};
var lastPresentedSample = (samples) => {
  let result = void 0;
  for (let sample of samples) {
    if (!result || sample.presentationTimestamp > result.presentationTimestamp) {
      result = sample;
    }
  }
  return result;
};
var intoTimescale = (timeInSeconds, timescale, round = true) => {
  let value = timeInSeconds * timescale;
  return round ? Math.round(value) : value;
};
var rotationMatrix = (rotationInDegrees) => {
  let theta = rotationInDegrees * (Math.PI / 180);
  let cosTheta = Math.cos(theta);
  let sinTheta = Math.sin(theta);
  return [
    cosTheta,
    sinTheta,
    0,
    -sinTheta,
    cosTheta,
    0,
    0,
    0,
    1
  ];
};
var IDENTITY_MATRIX = rotationMatrix(0);
var matrixToBytes = (matrix) => {
  return [
    fixed_16_16(matrix[0]),
    fixed_16_16(matrix[1]),
    fixed_2_30(matrix[2]),
    fixed_16_16(matrix[3]),
    fixed_16_16(matrix[4]),
    fixed_2_30(matrix[5]),
    fixed_16_16(matrix[6]),
    fixed_16_16(matrix[7]),
    fixed_2_30(matrix[8])
  ];
};
var deepClone = (x) => {
  if (!x)
    return x;
  if (typeof x !== "object")
    return x;
  if (Array.isArray(x))
    return x.map(deepClone);
  return Object.fromEntries(Object.entries(x).map(([key, value]) => [key, deepClone(value)]));
};
var isU32 = (value) => {
  return value >= 0 && value < 2 ** 32;
};

// src/box.ts
var box = (type, contents, children) => ({
  type,
  contents: contents && new Uint8Array(contents.flat(10)),
  children
});
var fullBox = (type, version, flags, contents, children) => box(
  type,
  [u8(version), u24(flags), contents ?? []],
  children
);
var ftyp = (details) => {
  let minorVersion = 512;
  if (details.fragmented)
    return box("ftyp", [
      ascii("iso5"),
      // Major brand
      u32(minorVersion),
      // Minor version
      // Compatible brands
      ascii("iso5"),
      ascii("iso6"),
      ascii("mp41")
    ]);
  return box("ftyp", [
    ascii("isom"),
    // Major brand
    u32(minorVersion),
    // Minor version
    // Compatible brands
    ascii("isom"),
    details.holdsAvc ? ascii("avc1") : [],
    ascii("mp41")
  ]);
};
var mdat = (reserveLargeSize) => ({ type: "mdat", largeSize: reserveLargeSize });
var free = (size) => ({ type: "free", size });
var moov = (tracks, creationTime, fragmented = false) => box("moov", null, [
  mvhd(creationTime, tracks),
  ...tracks.map((x) => trak(x, creationTime)),
  fragmented ? mvex(tracks) : null
]);
var mvhd = (creationTime, tracks) => {
  let duration = intoTimescale(Math.max(
    0,
    ...tracks.filter((x) => x.samples.length > 0).map((x) => {
      const lastSample = lastPresentedSample(x.samples);
      return lastSample.presentationTimestamp + lastSample.duration;
    })
  ), GLOBAL_TIMESCALE);
  let nextTrackId = Math.max(...tracks.map((x) => x.id)) + 1;
  let needsU64 = !isU32(creationTime) || !isU32(duration);
  let u32OrU64 = needsU64 ? u64 : u32;
  return fullBox("mvhd", +needsU64, 0, [
    u32OrU64(creationTime),
    // Creation time
    u32OrU64(creationTime),
    // Modification time
    u32(GLOBAL_TIMESCALE),
    // Timescale
    u32OrU64(duration),
    // Duration
    fixed_16_16(1),
    // Preferred rate
    fixed_8_8(1),
    // Preferred volume
    Array(10).fill(0),
    // Reserved
    matrixToBytes(IDENTITY_MATRIX),
    // Matrix
    Array(24).fill(0),
    // Pre-defined
    u32(nextTrackId)
    // Next track ID
  ]);
};
var trak = (track, creationTime) => box("trak", null, [
  tkhd(track, creationTime),
  mdia(track, creationTime)
]);
var tkhd = (track, creationTime) => {
  let lastSample = lastPresentedSample(track.samples);
  let durationInGlobalTimescale = intoTimescale(
    lastSample ? lastSample.presentationTimestamp + lastSample.duration : 0,
    GLOBAL_TIMESCALE
  );
  let needsU64 = !isU32(creationTime) || !isU32(durationInGlobalTimescale);
  let u32OrU64 = needsU64 ? u64 : u32;
  let matrix;
  if (track.info.type === "video") {
    matrix = typeof track.info.rotation === "number" ? rotationMatrix(track.info.rotation) : track.info.rotation;
  } else {
    matrix = IDENTITY_MATRIX;
  }
  return fullBox("tkhd", +needsU64, 3, [
    u32OrU64(creationTime),
    // Creation time
    u32OrU64(creationTime),
    // Modification time
    u32(track.id),
    // Track ID
    u32(0),
    // Reserved
    u32OrU64(durationInGlobalTimescale),
    // Duration
    Array(8).fill(0),
    // Reserved
    u16(0),
    // Layer
    u16(0),
    // Alternate group
    fixed_8_8(track.info.type === "audio" ? 1 : 0),
    // Volume
    u16(0),
    // Reserved
    matrixToBytes(matrix),
    // Matrix
    fixed_16_16(track.info.type === "video" ? track.info.width : 0),
    // Track width
    fixed_16_16(track.info.type === "video" ? track.info.height : 0)
    // Track height
  ]);
};
var mdia = (track, creationTime) => box("mdia", null, [
  mdhd(track, creationTime),
  hdlr(track.info.type === "video" ? "vide" : "soun"),
  minf(track)
]);
var mdhd = (track, creationTime) => {
  let lastSample = lastPresentedSample(track.samples);
  let localDuration = intoTimescale(
    lastSample ? lastSample.presentationTimestamp + lastSample.duration : 0,
    track.timescale
  );
  let needsU64 = !isU32(creationTime) || !isU32(localDuration);
  let u32OrU64 = needsU64 ? u64 : u32;
  return fullBox("mdhd", +needsU64, 0, [
    u32OrU64(creationTime),
    // Creation time
    u32OrU64(creationTime),
    // Modification time
    u32(track.timescale),
    // Timescale
    u32OrU64(localDuration),
    // Duration
    u16(21956),
    // Language ("und", undetermined)
    u16(0)
    // Quality
  ]);
};
var hdlr = (componentSubtype) => fullBox("hdlr", 0, 0, [
  ascii("mhlr"),
  // Component type
  ascii(componentSubtype),
  // Component subtype
  u32(0),
  // Component manufacturer
  u32(0),
  // Component flags
  u32(0),
  // Component flags mask
  ascii("mp4-muxer-hdlr", true)
  // Component name
]);
var minf = (track) => box("minf", null, [
  track.info.type === "video" ? vmhd() : smhd(),
  dinf(),
  stbl(track)
]);
var vmhd = () => fullBox("vmhd", 0, 1, [
  u16(0),
  // Graphics mode
  u16(0),
  // Opcolor R
  u16(0),
  // Opcolor G
  u16(0)
  // Opcolor B
]);
var smhd = () => fullBox("smhd", 0, 0, [
  u16(0),
  // Balance
  u16(0)
  // Reserved
]);
var dinf = () => box("dinf", null, [
  dref()
]);
var dref = () => fullBox("dref", 0, 0, [
  u32(1)
  // Entry count
], [
  url()
]);
var url = () => fullBox("url ", 0, 1);
var stbl = (track) => {
  const needsCtts = track.compositionTimeOffsetTable.length > 1 || track.compositionTimeOffsetTable.some((x) => x.sampleCompositionTimeOffset !== 0);
  return box("stbl", null, [
    stsd(track),
    stts(track),
    stss(track),
    stsc(track),
    stsz(track),
    stco(track),
    needsCtts ? ctts(track) : null
  ]);
};
var stsd = (track) => fullBox("stsd", 0, 0, [
  u32(1)
  // Entry count
], [
  track.info.type === "video" ? videoSampleDescription(
    VIDEO_CODEC_TO_BOX_NAME[track.info.codec],
    track
  ) : soundSampleDescription(
    AUDIO_CODEC_TO_BOX_NAME[track.info.codec],
    track
  )
]);
var videoSampleDescription = (compressionType, track) => box(compressionType, [
  Array(6).fill(0),
  // Reserved
  u16(1),
  // Data reference index
  u16(0),
  // Pre-defined
  u16(0),
  // Reserved
  Array(12).fill(0),
  // Pre-defined
  u16(track.info.width),
  // Width
  u16(track.info.height),
  // Height
  u32(4718592),
  // Horizontal resolution
  u32(4718592),
  // Vertical resolution
  u32(0),
  // Reserved
  u16(1),
  // Frame count
  Array(32).fill(0),
  // Compressor name
  u16(24),
  // Depth
  i16(65535)
  // Pre-defined
], [
  VIDEO_CODEC_TO_CONFIGURATION_BOX[track.info.codec](track),
  track.info.decoderConfig.colorSpace ? colr(track) : null
]);
var COLOR_PRIMARIES_MAP = {
  "bt709": 1,
  // ITU-R BT.709
  "bt470bg": 5,
  // ITU-R BT.470BG
  "smpte170m": 6
  // ITU-R BT.601 525 - SMPTE 170M
};
var TRANSFER_CHARACTERISTICS_MAP = {
  "bt709": 1,
  // ITU-R BT.709
  "smpte170m": 6,
  // SMPTE 170M
  "iec61966-2-1": 13
  // IEC 61966-2-1
};
var MATRIX_COEFFICIENTS_MAP = {
  "rgb": 0,
  // Identity
  "bt709": 1,
  // ITU-R BT.709
  "bt470bg": 5,
  // ITU-R BT.470BG
  "smpte170m": 6
  // SMPTE 170M
};
var colr = (track) => box("colr", [
  ascii("nclx"),
  // Colour type
  u16(COLOR_PRIMARIES_MAP[track.info.decoderConfig.colorSpace.primaries]),
  // Colour primaries
  u16(TRANSFER_CHARACTERISTICS_MAP[track.info.decoderConfig.colorSpace.transfer]),
  // Transfer characteristics
  u16(MATRIX_COEFFICIENTS_MAP[track.info.decoderConfig.colorSpace.matrix]),
  // Matrix coefficients
  u8((track.info.decoderConfig.colorSpace.fullRange ? 1 : 0) << 7)
  // Full range flag
]);
var avcC = (track) => track.info.decoderConfig && box("avcC", [
  // For AVC, description is an AVCDecoderConfigurationRecord, so nothing else to do here
  ...new Uint8Array(track.info.decoderConfig.description)
]);
var hvcC = (track) => track.info.decoderConfig && box("hvcC", [
  // For HEVC, description is a HEVCDecoderConfigurationRecord, so nothing else to do here
  ...new Uint8Array(track.info.decoderConfig.description)
]);
var vpcC = (track) => {
  if (!track.info.decoderConfig) {
    return null;
  }
  let decoderConfig = track.info.decoderConfig;
  if (!decoderConfig.colorSpace) {
    throw new Error(`'colorSpace' is required in the decoder config for VP9.`);
  }
  let parts = decoderConfig.codec.split(".");
  let profile = Number(parts[1]);
  let level = Number(parts[2]);
  let bitDepth = Number(parts[3]);
  let chromaSubsampling = 0;
  let thirdByte = (bitDepth << 4) + (chromaSubsampling << 1) + Number(decoderConfig.colorSpace.fullRange);
  let colourPrimaries = 2;
  let transferCharacteristics = 2;
  let matrixCoefficients = 2;
  return fullBox("vpcC", 1, 0, [
    u8(profile),
    // Profile
    u8(level),
    // Level
    u8(thirdByte),
    // Bit depth, chroma subsampling, full range
    u8(colourPrimaries),
    // Colour primaries
    u8(transferCharacteristics),
    // Transfer characteristics
    u8(matrixCoefficients),
    // Matrix coefficients
    u16(0)
    // Codec initialization data size
  ]);
};
var av1C = () => {
  let marker = 1;
  let version = 1;
  let firstByte = (marker << 7) + version;
  return box("av1C", [
    firstByte,
    0,
    0,
    0
  ]);
};
var soundSampleDescription = (compressionType, track) => box(compressionType, [
  Array(6).fill(0),
  // Reserved
  u16(1),
  // Data reference index
  u16(0),
  // Version
  u16(0),
  // Revision level
  u32(0),
  // Vendor
  u16(track.info.numberOfChannels),
  // Number of channels
  u16(16),
  // Sample size (bits)
  u16(0),
  // Compression ID
  u16(0),
  // Packet size
  fixed_16_16(track.info.sampleRate)
  // Sample rate
], [
  AUDIO_CODEC_TO_CONFIGURATION_BOX[track.info.codec](track)
]);
var esds = (track) => {
  let description = new Uint8Array(track.info.decoderConfig.description);
  return fullBox("esds", 0, 0, [
    // https://stackoverflow.com/a/54803118
    u32(58753152),
    // TAG(3) = Object Descriptor ([2])
    u8(32 + description.byteLength),
    // length of this OD (which includes the next 2 tags)
    u16(1),
    // ES_ID = 1
    u8(0),
    // flags etc = 0
    u32(75530368),
    // TAG(4) = ES Descriptor ([2]) embedded in above OD
    u8(18 + description.byteLength),
    // length of this ESD
    u8(64),
    // MPEG-4 Audio
    u8(21),
    // stream type(6bits)=5 audio, flags(2bits)=1
    u24(0),
    // 24bit buffer size
    u32(130071),
    // max bitrate
    u32(130071),
    // avg bitrate
    u32(92307584),
    // TAG(5) = ASC ([2],[3]) embedded in above OD
    u8(description.byteLength),
    // length
    ...description,
    u32(109084800),
    // TAG(6)
    u8(1),
    // length
    u8(2)
    // data
  ]);
};
var dOps = (track) => {
  let preskip = 3840;
  let gain = 0;
  const description = track.info.decoderConfig?.description;
  if (description) {
    if (description.byteLength < 18) {
      throw new TypeError("Invalid decoder description provided for Opus; must be at least 18 bytes long.");
    }
    const view2 = ArrayBuffer.isView(description) ? new DataView(description.buffer, description.byteOffset, description.byteLength) : new DataView(description);
    preskip = view2.getUint16(10, true);
    gain = view2.getInt16(14, true);
  }
  return box("dOps", [
    u8(0),
    // Version
    u8(track.info.numberOfChannels),
    // OutputChannelCount
    u16(preskip),
    u32(track.info.sampleRate),
    // InputSampleRate
    fixed_8_8(gain),
    // OutputGain
    u8(0)
    // ChannelMappingFamily
  ]);
};
var stts = (track) => {
  return fullBox("stts", 0, 0, [
    u32(track.timeToSampleTable.length),
    // Number of entries
    track.timeToSampleTable.map((x) => [
      // Time-to-sample table
      u32(x.sampleCount),
      // Sample count
      u32(x.sampleDelta)
      // Sample duration
    ])
  ]);
};
var stss = (track) => {
  if (track.samples.every((x) => x.type === "key"))
    return null;
  let keySamples = [...track.samples.entries()].filter(([, sample]) => sample.type === "key");
  return fullBox("stss", 0, 0, [
    u32(keySamples.length),
    // Number of entries
    keySamples.map(([index]) => u32(index + 1))
    // Sync sample table
  ]);
};
var stsc = (track) => {
  return fullBox("stsc", 0, 0, [
    u32(track.compactlyCodedChunkTable.length),
    // Number of entries
    track.compactlyCodedChunkTable.map((x) => [
      // Sample-to-chunk table
      u32(x.firstChunk),
      // First chunk
      u32(x.samplesPerChunk),
      // Samples per chunk
      u32(1)
      // Sample description index
    ])
  ]);
};
var stsz = (track) => fullBox("stsz", 0, 0, [
  u32(0),
  // Sample size (0 means non-constant size)
  u32(track.samples.length),
  // Number of entries
  track.samples.map((x) => u32(x.size))
  // Sample size table
]);
var stco = (track) => {
  if (track.finalizedChunks.length > 0 && last(track.finalizedChunks).offset >= 2 ** 32) {
    return fullBox("co64", 0, 0, [
      u32(track.finalizedChunks.length),
      // Number of entries
      track.finalizedChunks.map((x) => u64(x.offset))
      // Chunk offset table
    ]);
  }
  return fullBox("stco", 0, 0, [
    u32(track.finalizedChunks.length),
    // Number of entries
    track.finalizedChunks.map((x) => u32(x.offset))
    // Chunk offset table
  ]);
};
var ctts = (track) => {
  return fullBox("ctts", 0, 0, [
    u32(track.compositionTimeOffsetTable.length),
    // Number of entries
    track.compositionTimeOffsetTable.map((x) => [
      // Time-to-sample table
      u32(x.sampleCount),
      // Sample count
      u32(x.sampleCompositionTimeOffset)
      // Sample offset
    ])
  ]);
};
var mvex = (tracks) => {
  return box("mvex", null, tracks.map(trex));
};
var trex = (track) => {
  return fullBox("trex", 0, 0, [
    u32(track.id),
    // Track ID
    u32(1),
    // Default sample description index
    u32(0),
    // Default sample duration
    u32(0),
    // Default sample size
    u32(0)
    // Default sample flags
  ]);
};
var moof = (sequenceNumber, tracks) => {
  return box("moof", null, [
    mfhd(sequenceNumber),
    ...tracks.map(traf)
  ]);
};
var mfhd = (sequenceNumber) => {
  return fullBox("mfhd", 0, 0, [
    u32(sequenceNumber)
    // Sequence number
  ]);
};
var fragmentSampleFlags = (sample) => {
  let byte1 = 0;
  let byte2 = 0;
  let byte3 = 0;
  let byte4 = 0;
  let sampleIsDifferenceSample = sample.type === "delta";
  byte2 |= +sampleIsDifferenceSample;
  if (sampleIsDifferenceSample) {
    byte1 |= 1;
  } else {
    byte1 |= 2;
  }
  return byte1 << 24 | byte2 << 16 | byte3 << 8 | byte4;
};
var traf = (track) => {
  return box("traf", null, [
    tfhd(track),
    tfdt(track),
    trun(track)
  ]);
};
var tfhd = (track) => {
  let tfFlags = 0;
  tfFlags |= 8;
  tfFlags |= 16;
  tfFlags |= 32;
  tfFlags |= 131072;
  let referenceSample = track.currentChunk.samples[1] ?? track.currentChunk.samples[0];
  let referenceSampleInfo = {
    duration: referenceSample.timescaleUnitsToNextSample,
    size: referenceSample.size,
    flags: fragmentSampleFlags(referenceSample)
  };
  return fullBox("tfhd", 0, tfFlags, [
    u32(track.id),
    // Track ID
    u32(referenceSampleInfo.duration),
    // Default sample duration
    u32(referenceSampleInfo.size),
    // Default sample size
    u32(referenceSampleInfo.flags)
    // Default sample flags
  ]);
};
var tfdt = (track) => {
  return fullBox("tfdt", 1, 0, [
    u64(intoTimescale(track.currentChunk.startTimestamp, track.timescale))
    // Base Media Decode Time
  ]);
};
var trun = (track) => {
  let allSampleDurations = track.currentChunk.samples.map((x) => x.timescaleUnitsToNextSample);
  let allSampleSizes = track.currentChunk.samples.map((x) => x.size);
  let allSampleFlags = track.currentChunk.samples.map(fragmentSampleFlags);
  let allSampleCompositionTimeOffsets = track.currentChunk.samples.map((x) => intoTimescale(x.presentationTimestamp - x.decodeTimestamp, track.timescale));
  let uniqueSampleDurations = new Set(allSampleDurations);
  let uniqueSampleSizes = new Set(allSampleSizes);
  let uniqueSampleFlags = new Set(allSampleFlags);
  let uniqueSampleCompositionTimeOffsets = new Set(allSampleCompositionTimeOffsets);
  let firstSampleFlagsPresent = uniqueSampleFlags.size === 2 && allSampleFlags[0] !== allSampleFlags[1];
  let sampleDurationPresent = uniqueSampleDurations.size > 1;
  let sampleSizePresent = uniqueSampleSizes.size > 1;
  let sampleFlagsPresent = !firstSampleFlagsPresent && uniqueSampleFlags.size > 1;
  let sampleCompositionTimeOffsetsPresent = uniqueSampleCompositionTimeOffsets.size > 1 || [...uniqueSampleCompositionTimeOffsets].some((x) => x !== 0);
  let flags = 0;
  flags |= 1;
  flags |= 4 * +firstSampleFlagsPresent;
  flags |= 256 * +sampleDurationPresent;
  flags |= 512 * +sampleSizePresent;
  flags |= 1024 * +sampleFlagsPresent;
  flags |= 2048 * +sampleCompositionTimeOffsetsPresent;
  return fullBox("trun", 1, flags, [
    u32(track.currentChunk.samples.length),
    // Sample count
    u32(track.currentChunk.offset - track.currentChunk.moofOffset || 0),
    // Data offset
    firstSampleFlagsPresent ? u32(allSampleFlags[0]) : [],
    track.currentChunk.samples.map((_, i) => [
      sampleDurationPresent ? u32(allSampleDurations[i]) : [],
      // Sample duration
      sampleSizePresent ? u32(allSampleSizes[i]) : [],
      // Sample size
      sampleFlagsPresent ? u32(allSampleFlags[i]) : [],
      // Sample flags
      // Sample composition time offsets
      sampleCompositionTimeOffsetsPresent ? i32(allSampleCompositionTimeOffsets[i]) : []
    ])
  ]);
};
var mfra = (tracks) => {
  return box("mfra", null, [
    ...tracks.map(tfra),
    mfro()
  ]);
};
var tfra = (track, trackIndex) => {
  let version = 1;
  return fullBox("tfra", version, 0, [
    u32(track.id),
    // Track ID
    u32(63),
    // This specifies that traf number, trun number and sample number are 32-bit ints
    u32(track.finalizedChunks.length),
    // Number of entries
    track.finalizedChunks.map((chunk) => [
      u64(intoTimescale(chunk.startTimestamp, track.timescale)),
      // Time
      u64(chunk.moofOffset),
      // moof offset
      u32(trackIndex + 1),
      // traf number
      u32(1),
      // trun number
      u32(1)
      // Sample number
    ])
  ]);
};
var mfro = () => {
  return fullBox("mfro", 0, 0, [
    // This value needs to be overwritten manually from the outside, where the actual size of the enclosing mfra box
    // is known
    u32(0)
    // Size
  ]);
};
var VIDEO_CODEC_TO_BOX_NAME = {
  "avc": "avc1",
  "hevc": "hvc1",
  "vp9": "vp09",
  "av1": "av01"
};
var VIDEO_CODEC_TO_CONFIGURATION_BOX = {
  "avc": avcC,
  "hevc": hvcC,
  "vp9": vpcC,
  "av1": av1C
};
var AUDIO_CODEC_TO_BOX_NAME = {
  "aac": "mp4a",
  "opus": "Opus"
};
var AUDIO_CODEC_TO_CONFIGURATION_BOX = {
  "aac": esds,
  "opus": dOps
};

// src/target.ts
var isTarget = Symbol("isTarget");
var Target = class {
};
isTarget;
var ArrayBufferTarget = class extends Target {
  constructor() {
    super(...arguments);
    this.buffer = null;
  }
};
var StreamTarget = class extends Target {
  constructor(options) {
    super();
    this.options = options;
    if (typeof options !== "object") {
      throw new TypeError("StreamTarget requires an options object to be passed to its constructor.");
    }
    if (options.onData) {
      if (typeof options.onData !== "function") {
        throw new TypeError("options.onData, when provided, must be a function.");
      }
      if (options.onData.length < 2) {
        throw new TypeError(
          "options.onData, when provided, must be a function that takes in at least two arguments (data and position). Ignoring the position argument, which specifies the byte offset at which the data is to be written, can lead to broken outputs."
        );
      }
    }
    if (options.chunked !== void 0 && typeof options.chunked !== "boolean") {
      throw new TypeError("options.chunked, when provided, must be a boolean.");
    }
    if (options.chunkSize !== void 0 && (!Number.isInteger(options.chunkSize) || options.chunkSize < 1024)) {
      throw new TypeError("options.chunkSize, when provided, must be an integer and not smaller than 1024.");
    }
  }
};
var FileSystemWritableFileStreamTarget = class extends Target {
  constructor(stream, options) {
    super();
    this.stream = stream;
    this.options = options;
    if (!(stream instanceof FileSystemWritableFileStream)) {
      throw new TypeError("FileSystemWritableFileStreamTarget requires a FileSystemWritableFileStream instance.");
    }
    if (options !== void 0 && typeof options !== "object") {
      throw new TypeError("FileSystemWritableFileStreamTarget's options, when provided, must be an object.");
    }
    if (options) {
      if (options.chunkSize !== void 0 && (!Number.isInteger(options.chunkSize) || options.chunkSize <= 0)) {
        throw new TypeError("options.chunkSize, when provided, must be a positive integer");
      }
    }
  }
};

// src/writer.ts
var _helper, _helperView;
var Writer = class {
  constructor() {
    this.pos = 0;
    __privateAdd(this, _helper, new Uint8Array(8));
    __privateAdd(this, _helperView, new DataView(__privateGet(this, _helper).buffer));
    /**
     * Stores the position from the start of the file to where boxes elements have been written. This is used to
     * rewrite/edit elements that were already added before, and to measure sizes of things.
     */
    this.offsets = /* @__PURE__ */ new WeakMap();
  }
  /** Sets the current position for future writes to a new one. */
  seek(newPos) {
    this.pos = newPos;
  }
  writeU32(value) {
    __privateGet(this, _helperView).setUint32(0, value, false);
    this.write(__privateGet(this, _helper).subarray(0, 4));
  }
  writeU64(value) {
    __privateGet(this, _helperView).setUint32(0, Math.floor(value / 2 ** 32), false);
    __privateGet(this, _helperView).setUint32(4, value, false);
    this.write(__privateGet(this, _helper).subarray(0, 8));
  }
  writeAscii(text) {
    for (let i = 0; i < text.length; i++) {
      __privateGet(this, _helperView).setUint8(i % 8, text.charCodeAt(i));
      if (i % 8 === 7)
        this.write(__privateGet(this, _helper));
    }
    if (text.length % 8 !== 0) {
      this.write(__privateGet(this, _helper).subarray(0, text.length % 8));
    }
  }
  writeBox(box2) {
    this.offsets.set(box2, this.pos);
    if (box2.contents && !box2.children) {
      this.writeBoxHeader(box2, box2.size ?? box2.contents.byteLength + 8);
      this.write(box2.contents);
    } else {
      let startPos = this.pos;
      this.writeBoxHeader(box2, 0);
      if (box2.contents)
        this.write(box2.contents);
      if (box2.children) {
        for (let child of box2.children)
          if (child)
            this.writeBox(child);
      }
      let endPos = this.pos;
      let size = box2.size ?? endPos - startPos;
      this.seek(startPos);
      this.writeBoxHeader(box2, size);
      this.seek(endPos);
    }
  }
  writeBoxHeader(box2, size) {
    this.writeU32(box2.largeSize ? 1 : size);
    this.writeAscii(box2.type);
    if (box2.largeSize)
      this.writeU64(size);
  }
  measureBoxHeader(box2) {
    return 8 + (box2.largeSize ? 8 : 0);
  }
  patchBox(box2) {
    let endPos = this.pos;
    this.seek(this.offsets.get(box2));
    this.writeBox(box2);
    this.seek(endPos);
  }
  measureBox(box2) {
    if (box2.contents && !box2.children) {
      let headerSize = this.measureBoxHeader(box2);
      return headerSize + box2.contents.byteLength;
    } else {
      let result = this.measureBoxHeader(box2);
      if (box2.contents)
        result += box2.contents.byteLength;
      if (box2.children) {
        for (let child of box2.children)
          if (child)
            result += this.measureBox(child);
      }
      return result;
    }
  }
};
_helper = new WeakMap();
_helperView = new WeakMap();
var _target, _buffer, _bytes, _maxPos, _ensureSize, ensureSize_fn;
var ArrayBufferTargetWriter = class extends Writer {
  constructor(target) {
    super();
    __privateAdd(this, _ensureSize);
    __privateAdd(this, _target, void 0);
    __privateAdd(this, _buffer, new ArrayBuffer(2 ** 16));
    __privateAdd(this, _bytes, new Uint8Array(__privateGet(this, _buffer)));
    __privateAdd(this, _maxPos, 0);
    __privateSet(this, _target, target);
  }
  write(data) {
    __privateMethod(this, _ensureSize, ensureSize_fn).call(this, this.pos + data.byteLength);
    __privateGet(this, _bytes).set(data, this.pos);
    this.pos += data.byteLength;
    __privateSet(this, _maxPos, Math.max(__privateGet(this, _maxPos), this.pos));
  }
  finalize() {
    __privateMethod(this, _ensureSize, ensureSize_fn).call(this, this.pos);
    __privateGet(this, _target).buffer = __privateGet(this, _buffer).slice(0, Math.max(__privateGet(this, _maxPos), this.pos));
  }
};
_target = new WeakMap();
_buffer = new WeakMap();
_bytes = new WeakMap();
_maxPos = new WeakMap();
_ensureSize = new WeakSet();
ensureSize_fn = function(size) {
  let newLength = __privateGet(this, _buffer).byteLength;
  while (newLength < size)
    newLength *= 2;
  if (newLength === __privateGet(this, _buffer).byteLength)
    return;
  let newBuffer = new ArrayBuffer(newLength);
  let newBytes = new Uint8Array(newBuffer);
  newBytes.set(__privateGet(this, _bytes), 0);
  __privateSet(this, _buffer, newBuffer);
  __privateSet(this, _bytes, newBytes);
};
var DEFAULT_CHUNK_SIZE = 2 ** 24;
var MAX_CHUNKS_AT_ONCE = 2;
var _target2, _sections, _chunked, _chunkSize, _chunks, _writeDataIntoChunks, writeDataIntoChunks_fn, _insertSectionIntoChunk, insertSectionIntoChunk_fn, _createChunk, createChunk_fn, _flushChunks, flushChunks_fn;
var StreamTargetWriter = class extends Writer {
  constructor(target) {
    super();
    __privateAdd(this, _writeDataIntoChunks);
    __privateAdd(this, _insertSectionIntoChunk);
    __privateAdd(this, _createChunk);
    __privateAdd(this, _flushChunks);
    __privateAdd(this, _target2, void 0);
    __privateAdd(this, _sections, []);
    __privateAdd(this, _chunked, void 0);
    __privateAdd(this, _chunkSize, void 0);
    /**
     * The data is divided up into fixed-size chunks, whose contents are first filled in RAM and then flushed out.
     * A chunk is flushed if all of its contents have been written.
     */
    __privateAdd(this, _chunks, []);
    __privateSet(this, _target2, target);
    __privateSet(this, _chunked, target.options?.chunked ?? false);
    __privateSet(this, _chunkSize, target.options?.chunkSize ?? DEFAULT_CHUNK_SIZE);
  }
  write(data) {
    __privateGet(this, _sections).push({
      data: data.slice(),
      start: this.pos
    });
    this.pos += data.byteLength;
  }
  flush() {
    if (__privateGet(this, _sections).length === 0)
      return;
    let chunks = [];
    let sorted = [...__privateGet(this, _sections)].sort((a, b) => a.start - b.start);
    chunks.push({
      start: sorted[0].start,
      size: sorted[0].data.byteLength
    });
    for (let i = 1; i < sorted.length; i++) {
      let lastChunk = chunks[chunks.length - 1];
      let section = sorted[i];
      if (section.start <= lastChunk.start + lastChunk.size) {
        lastChunk.size = Math.max(lastChunk.size, section.start + section.data.byteLength - lastChunk.start);
      } else {
        chunks.push({
          start: section.start,
          size: section.data.byteLength
        });
      }
    }
    for (let chunk of chunks) {
      chunk.data = new Uint8Array(chunk.size);
      for (let section of __privateGet(this, _sections)) {
        if (chunk.start <= section.start && section.start < chunk.start + chunk.size) {
          chunk.data.set(section.data, section.start - chunk.start);
        }
      }
      if (__privateGet(this, _chunked)) {
        __privateMethod(this, _writeDataIntoChunks, writeDataIntoChunks_fn).call(this, chunk.data, chunk.start);
        __privateMethod(this, _flushChunks, flushChunks_fn).call(this);
      } else {
        __privateGet(this, _target2).options.onData?.(chunk.data, chunk.start);
      }
    }
    __privateGet(this, _sections).length = 0;
  }
  finalize() {
    if (__privateGet(this, _chunked)) {
      __privateMethod(this, _flushChunks, flushChunks_fn).call(this, true);
    }
  }
};
_target2 = new WeakMap();
_sections = new WeakMap();
_chunked = new WeakMap();
_chunkSize = new WeakMap();
_chunks = new WeakMap();
_writeDataIntoChunks = new WeakSet();
writeDataIntoChunks_fn = function(data, position) {
  let chunkIndex = __privateGet(this, _chunks).findIndex((x) => x.start <= position && position < x.start + __privateGet(this, _chunkSize));
  if (chunkIndex === -1)
    chunkIndex = __privateMethod(this, _createChunk, createChunk_fn).call(this, position);
  let chunk = __privateGet(this, _chunks)[chunkIndex];
  let relativePosition = position - chunk.start;
  let toWrite = data.subarray(0, Math.min(__privateGet(this, _chunkSize) - relativePosition, data.byteLength));
  chunk.data.set(toWrite, relativePosition);
  let section = {
    start: relativePosition,
    end: relativePosition + toWrite.byteLength
  };
  __privateMethod(this, _insertSectionIntoChunk, insertSectionIntoChunk_fn).call(this, chunk, section);
  if (chunk.written[0].start === 0 && chunk.written[0].end === __privateGet(this, _chunkSize)) {
    chunk.shouldFlush = true;
  }
  if (__privateGet(this, _chunks).length > MAX_CHUNKS_AT_ONCE) {
    for (let i = 0; i < __privateGet(this, _chunks).length - 1; i++) {
      __privateGet(this, _chunks)[i].shouldFlush = true;
    }
    __privateMethod(this, _flushChunks, flushChunks_fn).call(this);
  }
  if (toWrite.byteLength < data.byteLength) {
    __privateMethod(this, _writeDataIntoChunks, writeDataIntoChunks_fn).call(this, data.subarray(toWrite.byteLength), position + toWrite.byteLength);
  }
};
_insertSectionIntoChunk = new WeakSet();
insertSectionIntoChunk_fn = function(chunk, section) {
  let low = 0;
  let high = chunk.written.length - 1;
  let index = -1;
  while (low <= high) {
    let mid = Math.floor(low + (high - low + 1) / 2);
    if (chunk.written[mid].start <= section.start) {
      low = mid + 1;
      index = mid;
    } else {
      high = mid - 1;
    }
  }
  chunk.written.splice(index + 1, 0, section);
  if (index === -1 || chunk.written[index].end < section.start)
    index++;
  while (index < chunk.written.length - 1 && chunk.written[index].end >= chunk.written[index + 1].start) {
    chunk.written[index].end = Math.max(chunk.written[index].end, chunk.written[index + 1].end);
    chunk.written.splice(index + 1, 1);
  }
};
_createChunk = new WeakSet();
createChunk_fn = function(includesPosition) {
  let start = Math.floor(includesPosition / __privateGet(this, _chunkSize)) * __privateGet(this, _chunkSize);
  let chunk = {
    start,
    data: new Uint8Array(__privateGet(this, _chunkSize)),
    written: [],
    shouldFlush: false
  };
  __privateGet(this, _chunks).push(chunk);
  __privateGet(this, _chunks).sort((a, b) => a.start - b.start);
  return __privateGet(this, _chunks).indexOf(chunk);
};
_flushChunks = new WeakSet();
flushChunks_fn = function(force = false) {
  for (let i = 0; i < __privateGet(this, _chunks).length; i++) {
    let chunk = __privateGet(this, _chunks)[i];
    if (!chunk.shouldFlush && !force)
      continue;
    for (let section of chunk.written) {
      __privateGet(this, _target2).options.onData?.(
        chunk.data.subarray(section.start, section.end),
        chunk.start + section.start
      );
    }
    __privateGet(this, _chunks).splice(i--, 1);
  }
};
var FileSystemWritableFileStreamTargetWriter = class extends StreamTargetWriter {
  constructor(target) {
    super(new StreamTarget({
      onData: (data, position) => target.stream.write({
        type: "write",
        data,
        position
      }),
      chunked: true,
      chunkSize: target.options?.chunkSize
    }));
  }
};

// src/muxer.ts
var GLOBAL_TIMESCALE = 1e3;
var SUPPORTED_VIDEO_CODECS = ["avc", "hevc", "vp9", "av1"];
var SUPPORTED_AUDIO_CODECS = ["aac", "opus"];
var TIMESTAMP_OFFSET = 2082844800;
var FIRST_TIMESTAMP_BEHAVIORS = ["strict", "offset", "cross-track-offset"];
var _options, _writer, _ftypSize, _mdat, _videoTrack, _audioTrack, _creationTime, _finalizedChunks, _nextFragmentNumber, _videoSampleQueue, _audioSampleQueue, _finalized, _validateOptions, validateOptions_fn, _writeHeader, writeHeader_fn, _computeMoovSizeUpperBound, computeMoovSizeUpperBound_fn, _prepareTracks, prepareTracks_fn, _generateMpeg4AudioSpecificConfig, generateMpeg4AudioSpecificConfig_fn, _createSampleForTrack, createSampleForTrack_fn, _addSampleToTrack, addSampleToTrack_fn, _validateTimestamp, validateTimestamp_fn, _finalizeCurrentChunk, finalizeCurrentChunk_fn, _finalizeFragment, finalizeFragment_fn, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn, _ensureNotFinalized, ensureNotFinalized_fn;
var Muxer = class {
  constructor(options) {
    __privateAdd(this, _validateOptions);
    __privateAdd(this, _writeHeader);
    __privateAdd(this, _computeMoovSizeUpperBound);
    __privateAdd(this, _prepareTracks);
    // https://wiki.multimedia.cx/index.php/MPEG-4_Audio
    __privateAdd(this, _generateMpeg4AudioSpecificConfig);
    __privateAdd(this, _createSampleForTrack);
    __privateAdd(this, _addSampleToTrack);
    __privateAdd(this, _validateTimestamp);
    __privateAdd(this, _finalizeCurrentChunk);
    __privateAdd(this, _finalizeFragment);
    __privateAdd(this, _maybeFlushStreamingTargetWriter);
    __privateAdd(this, _ensureNotFinalized);
    __privateAdd(this, _options, void 0);
    __privateAdd(this, _writer, void 0);
    __privateAdd(this, _ftypSize, void 0);
    __privateAdd(this, _mdat, void 0);
    __privateAdd(this, _videoTrack, null);
    __privateAdd(this, _audioTrack, null);
    __privateAdd(this, _creationTime, Math.floor(Date.now() / 1e3) + TIMESTAMP_OFFSET);
    __privateAdd(this, _finalizedChunks, []);
    // Fields for fragmented MP4:
    __privateAdd(this, _nextFragmentNumber, 1);
    __privateAdd(this, _videoSampleQueue, []);
    __privateAdd(this, _audioSampleQueue, []);
    __privateAdd(this, _finalized, false);
    __privateMethod(this, _validateOptions, validateOptions_fn).call(this, options);
    options.video = deepClone(options.video);
    options.audio = deepClone(options.audio);
    options.fastStart = deepClone(options.fastStart);
    this.target = options.target;
    __privateSet(this, _options, {
      firstTimestampBehavior: "strict",
      ...options
    });
    if (options.target instanceof ArrayBufferTarget) {
      __privateSet(this, _writer, new ArrayBufferTargetWriter(options.target));
    } else if (options.target instanceof StreamTarget) {
      __privateSet(this, _writer, new StreamTargetWriter(options.target));
    } else if (options.target instanceof FileSystemWritableFileStreamTarget) {
      __privateSet(this, _writer, new FileSystemWritableFileStreamTargetWriter(options.target));
    } else {
      throw new Error(`Invalid target: ${options.target}`);
    }
    __privateMethod(this, _prepareTracks, prepareTracks_fn).call(this);
    __privateMethod(this, _writeHeader, writeHeader_fn).call(this);
  }
  addVideoChunk(sample, meta, timestamp, compositionTimeOffset) {
    if (!(sample instanceof EncodedVideoChunk)) {
      throw new TypeError("addVideoChunk's first argument (sample) must be of type EncodedVideoChunk.");
    }
    if (meta && typeof meta !== "object") {
      throw new TypeError("addVideoChunk's second argument (meta), when provided, must be an object.");
    }
    if (timestamp !== void 0 && (!Number.isFinite(timestamp) || timestamp < 0)) {
      throw new TypeError(
        "addVideoChunk's third argument (timestamp), when provided, must be a non-negative real number."
      );
    }
    if (compositionTimeOffset !== void 0 && !Number.isFinite(compositionTimeOffset)) {
      throw new TypeError(
        "addVideoChunk's fourth argument (compositionTimeOffset), when provided, must be a real number."
      );
    }
    let data = new Uint8Array(sample.byteLength);
    sample.copyTo(data);
    this.addVideoChunkRaw(
      data,
      sample.type,
      timestamp ?? sample.timestamp,
      sample.duration,
      meta,
      compositionTimeOffset
    );
  }
  addVideoChunkRaw(data, type, timestamp, duration, meta, compositionTimeOffset) {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError("addVideoChunkRaw's first argument (data) must be an instance of Uint8Array.");
    }
    if (type !== "key" && type !== "delta") {
      throw new TypeError("addVideoChunkRaw's second argument (type) must be either 'key' or 'delta'.");
    }
    if (!Number.isFinite(timestamp) || timestamp < 0) {
      throw new TypeError("addVideoChunkRaw's third argument (timestamp) must be a non-negative real number.");
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError("addVideoChunkRaw's fourth argument (duration) must be a non-negative real number.");
    }
    if (meta && typeof meta !== "object") {
      throw new TypeError("addVideoChunkRaw's fifth argument (meta), when provided, must be an object.");
    }
    if (compositionTimeOffset !== void 0 && !Number.isFinite(compositionTimeOffset)) {
      throw new TypeError(
        "addVideoChunkRaw's sixth argument (compositionTimeOffset), when provided, must be a real number."
      );
    }
    __privateMethod(this, _ensureNotFinalized, ensureNotFinalized_fn).call(this);
    if (!__privateGet(this, _options).video)
      throw new Error("No video track declared.");
    if (typeof __privateGet(this, _options).fastStart === "object" && __privateGet(this, _videoTrack).samples.length === __privateGet(this, _options).fastStart.expectedVideoChunks) {
      throw new Error(`Cannot add more video chunks than specified in 'fastStart' (${__privateGet(this, _options).fastStart.expectedVideoChunks}).`);
    }
    let videoSample = __privateMethod(this, _createSampleForTrack, createSampleForTrack_fn).call(this, __privateGet(this, _videoTrack), data, type, timestamp, duration, meta, compositionTimeOffset);
    if (__privateGet(this, _options).fastStart === "fragmented" && __privateGet(this, _audioTrack)) {
      while (__privateGet(this, _audioSampleQueue).length > 0 && __privateGet(this, _audioSampleQueue)[0].decodeTimestamp <= videoSample.decodeTimestamp) {
        let audioSample = __privateGet(this, _audioSampleQueue).shift();
        __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _audioTrack), audioSample);
      }
      if (videoSample.decodeTimestamp <= __privateGet(this, _audioTrack).lastDecodeTimestamp) {
        __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _videoTrack), videoSample);
      } else {
        __privateGet(this, _videoSampleQueue).push(videoSample);
      }
    } else {
      __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _videoTrack), videoSample);
    }
  }
  addAudioChunk(sample, meta, timestamp) {
    if (!(sample instanceof EncodedAudioChunk)) {
      throw new TypeError("addAudioChunk's first argument (sample) must be of type EncodedAudioChunk.");
    }
    if (meta && typeof meta !== "object") {
      throw new TypeError("addAudioChunk's second argument (meta), when provided, must be an object.");
    }
    if (timestamp !== void 0 && (!Number.isFinite(timestamp) || timestamp < 0)) {
      throw new TypeError(
        "addAudioChunk's third argument (timestamp), when provided, must be a non-negative real number."
      );
    }
    let data = new Uint8Array(sample.byteLength);
    sample.copyTo(data);
    this.addAudioChunkRaw(data, sample.type, timestamp ?? sample.timestamp, sample.duration, meta);
  }
  addAudioChunkRaw(data, type, timestamp, duration, meta) {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError("addAudioChunkRaw's first argument (data) must be an instance of Uint8Array.");
    }
    if (type !== "key" && type !== "delta") {
      throw new TypeError("addAudioChunkRaw's second argument (type) must be either 'key' or 'delta'.");
    }
    if (!Number.isFinite(timestamp) || timestamp < 0) {
      throw new TypeError("addAudioChunkRaw's third argument (timestamp) must be a non-negative real number.");
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError("addAudioChunkRaw's fourth argument (duration) must be a non-negative real number.");
    }
    if (meta && typeof meta !== "object") {
      throw new TypeError("addAudioChunkRaw's fifth argument (meta), when provided, must be an object.");
    }
    __privateMethod(this, _ensureNotFinalized, ensureNotFinalized_fn).call(this);
    if (!__privateGet(this, _options).audio)
      throw new Error("No audio track declared.");
    if (typeof __privateGet(this, _options).fastStart === "object" && __privateGet(this, _audioTrack).samples.length === __privateGet(this, _options).fastStart.expectedAudioChunks) {
      throw new Error(`Cannot add more audio chunks than specified in 'fastStart' (${__privateGet(this, _options).fastStart.expectedAudioChunks}).`);
    }
    let audioSample = __privateMethod(this, _createSampleForTrack, createSampleForTrack_fn).call(this, __privateGet(this, _audioTrack), data, type, timestamp, duration, meta);
    if (__privateGet(this, _options).fastStart === "fragmented" && __privateGet(this, _videoTrack)) {
      while (__privateGet(this, _videoSampleQueue).length > 0 && __privateGet(this, _videoSampleQueue)[0].decodeTimestamp <= audioSample.decodeTimestamp) {
        let videoSample = __privateGet(this, _videoSampleQueue).shift();
        __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _videoTrack), videoSample);
      }
      if (audioSample.decodeTimestamp <= __privateGet(this, _videoTrack).lastDecodeTimestamp) {
        __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _audioTrack), audioSample);
      } else {
        __privateGet(this, _audioSampleQueue).push(audioSample);
      }
    } else {
      __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _audioTrack), audioSample);
    }
  }
  /** Finalizes the file, making it ready for use. Must be called after all video and audio chunks have been added. */
  finalize() {
    if (__privateGet(this, _finalized)) {
      throw new Error("Cannot finalize a muxer more than once.");
    }
    if (__privateGet(this, _options).fastStart === "fragmented") {
      for (let videoSample of __privateGet(this, _videoSampleQueue))
        __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _videoTrack), videoSample);
      for (let audioSample of __privateGet(this, _audioSampleQueue))
        __privateMethod(this, _addSampleToTrack, addSampleToTrack_fn).call(this, __privateGet(this, _audioTrack), audioSample);
      __privateMethod(this, _finalizeFragment, finalizeFragment_fn).call(this, false);
    } else {
      if (__privateGet(this, _videoTrack))
        __privateMethod(this, _finalizeCurrentChunk, finalizeCurrentChunk_fn).call(this, __privateGet(this, _videoTrack));
      if (__privateGet(this, _audioTrack))
        __privateMethod(this, _finalizeCurrentChunk, finalizeCurrentChunk_fn).call(this, __privateGet(this, _audioTrack));
    }
    let tracks = [__privateGet(this, _videoTrack), __privateGet(this, _audioTrack)].filter(Boolean);
    if (__privateGet(this, _options).fastStart === "in-memory") {
      let mdatSize;
      for (let i = 0; i < 2; i++) {
        let movieBox2 = moov(tracks, __privateGet(this, _creationTime));
        let movieBoxSize = __privateGet(this, _writer).measureBox(movieBox2);
        mdatSize = __privateGet(this, _writer).measureBox(__privateGet(this, _mdat));
        let currentChunkPos = __privateGet(this, _writer).pos + movieBoxSize + mdatSize;
        for (let chunk of __privateGet(this, _finalizedChunks)) {
          chunk.offset = currentChunkPos;
          for (let { data } of chunk.samples) {
            currentChunkPos += data.byteLength;
            mdatSize += data.byteLength;
          }
        }
        if (currentChunkPos < 2 ** 32)
          break;
        if (mdatSize >= 2 ** 32)
          __privateGet(this, _mdat).largeSize = true;
      }
      let movieBox = moov(tracks, __privateGet(this, _creationTime));
      __privateGet(this, _writer).writeBox(movieBox);
      __privateGet(this, _mdat).size = mdatSize;
      __privateGet(this, _writer).writeBox(__privateGet(this, _mdat));
      for (let chunk of __privateGet(this, _finalizedChunks)) {
        for (let sample of chunk.samples) {
          __privateGet(this, _writer).write(sample.data);
          sample.data = null;
        }
      }
    } else if (__privateGet(this, _options).fastStart === "fragmented") {
      let startPos = __privateGet(this, _writer).pos;
      let mfraBox = mfra(tracks);
      __privateGet(this, _writer).writeBox(mfraBox);
      let mfraBoxSize = __privateGet(this, _writer).pos - startPos;
      __privateGet(this, _writer).seek(__privateGet(this, _writer).pos - 4);
      __privateGet(this, _writer).writeU32(mfraBoxSize);
    } else {
      let mdatPos = __privateGet(this, _writer).offsets.get(__privateGet(this, _mdat));
      let mdatSize = __privateGet(this, _writer).pos - mdatPos;
      __privateGet(this, _mdat).size = mdatSize;
      __privateGet(this, _mdat).largeSize = mdatSize >= 2 ** 32;
      __privateGet(this, _writer).patchBox(__privateGet(this, _mdat));
      let movieBox = moov(tracks, __privateGet(this, _creationTime));
      if (typeof __privateGet(this, _options).fastStart === "object") {
        __privateGet(this, _writer).seek(__privateGet(this, _ftypSize));
        __privateGet(this, _writer).writeBox(movieBox);
        let remainingBytes = mdatPos - __privateGet(this, _writer).pos;
        __privateGet(this, _writer).writeBox(free(remainingBytes));
      } else {
        __privateGet(this, _writer).writeBox(movieBox);
      }
    }
    __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
    __privateGet(this, _writer).finalize();
    __privateSet(this, _finalized, true);
  }
};
_options = new WeakMap();
_writer = new WeakMap();
_ftypSize = new WeakMap();
_mdat = new WeakMap();
_videoTrack = new WeakMap();
_audioTrack = new WeakMap();
_creationTime = new WeakMap();
_finalizedChunks = new WeakMap();
_nextFragmentNumber = new WeakMap();
_videoSampleQueue = new WeakMap();
_audioSampleQueue = new WeakMap();
_finalized = new WeakMap();
_validateOptions = new WeakSet();
validateOptions_fn = function(options) {
  if (typeof options !== "object") {
    throw new TypeError("The muxer requires an options object to be passed to its constructor.");
  }
  if (!(options.target instanceof Target)) {
    throw new TypeError("The target must be provided and an instance of Target.");
  }
  if (options.video) {
    if (!SUPPORTED_VIDEO_CODECS.includes(options.video.codec)) {
      throw new TypeError(`Unsupported video codec: ${options.video.codec}`);
    }
    if (!Number.isInteger(options.video.width) || options.video.width <= 0) {
      throw new TypeError(`Invalid video width: ${options.video.width}. Must be a positive integer.`);
    }
    if (!Number.isInteger(options.video.height) || options.video.height <= 0) {
      throw new TypeError(`Invalid video height: ${options.video.height}. Must be a positive integer.`);
    }
    const videoRotation = options.video.rotation;
    if (typeof videoRotation === "number" && ![0, 90, 180, 270].includes(videoRotation)) {
      throw new TypeError(`Invalid video rotation: ${videoRotation}. Has to be 0, 90, 180 or 270.`);
    } else if (Array.isArray(videoRotation) && (videoRotation.length !== 9 || videoRotation.some((value) => typeof value !== "number"))) {
      throw new TypeError(`Invalid video transformation matrix: ${videoRotation.join()}`);
    }
    if (options.video.frameRate !== void 0 && (!Number.isInteger(options.video.frameRate) || options.video.frameRate <= 0)) {
      throw new TypeError(
        `Invalid video frame rate: ${options.video.frameRate}. Must be a positive integer.`
      );
    }
  }
  if (options.audio) {
    if (!SUPPORTED_AUDIO_CODECS.includes(options.audio.codec)) {
      throw new TypeError(`Unsupported audio codec: ${options.audio.codec}`);
    }
    if (!Number.isInteger(options.audio.numberOfChannels) || options.audio.numberOfChannels <= 0) {
      throw new TypeError(
        `Invalid number of audio channels: ${options.audio.numberOfChannels}. Must be a positive integer.`
      );
    }
    if (!Number.isInteger(options.audio.sampleRate) || options.audio.sampleRate <= 0) {
      throw new TypeError(
        `Invalid audio sample rate: ${options.audio.sampleRate}. Must be a positive integer.`
      );
    }
  }
  if (options.firstTimestampBehavior && !FIRST_TIMESTAMP_BEHAVIORS.includes(options.firstTimestampBehavior)) {
    throw new TypeError(`Invalid first timestamp behavior: ${options.firstTimestampBehavior}`);
  }
  if (typeof options.fastStart === "object") {
    if (options.video) {
      if (options.fastStart.expectedVideoChunks === void 0) {
        throw new TypeError(`'fastStart' is an object but is missing property 'expectedVideoChunks'.`);
      } else if (!Number.isInteger(options.fastStart.expectedVideoChunks) || options.fastStart.expectedVideoChunks < 0) {
        throw new TypeError(`'expectedVideoChunks' must be a non-negative integer.`);
      }
    }
    if (options.audio) {
      if (options.fastStart.expectedAudioChunks === void 0) {
        throw new TypeError(`'fastStart' is an object but is missing property 'expectedAudioChunks'.`);
      } else if (!Number.isInteger(options.fastStart.expectedAudioChunks) || options.fastStart.expectedAudioChunks < 0) {
        throw new TypeError(`'expectedAudioChunks' must be a non-negative integer.`);
      }
    }
  } else if (![false, "in-memory", "fragmented"].includes(options.fastStart)) {
    throw new TypeError(`'fastStart' option must be false, 'in-memory', 'fragmented' or an object.`);
  }
  if (options.minFragmentDuration !== void 0 && (!Number.isFinite(options.minFragmentDuration) || options.minFragmentDuration < 0)) {
    throw new TypeError(`'minFragmentDuration' must be a non-negative number.`);
  }
};
_writeHeader = new WeakSet();
writeHeader_fn = function() {
  __privateGet(this, _writer).writeBox(ftyp({
    holdsAvc: __privateGet(this, _options).video?.codec === "avc",
    fragmented: __privateGet(this, _options).fastStart === "fragmented"
  }));
  __privateSet(this, _ftypSize, __privateGet(this, _writer).pos);
  if (__privateGet(this, _options).fastStart === "in-memory") {
    __privateSet(this, _mdat, mdat(false));
  } else if (__privateGet(this, _options).fastStart === "fragmented") {
  } else {
    if (typeof __privateGet(this, _options).fastStart === "object") {
      let moovSizeUpperBound = __privateMethod(this, _computeMoovSizeUpperBound, computeMoovSizeUpperBound_fn).call(this);
      __privateGet(this, _writer).seek(__privateGet(this, _writer).pos + moovSizeUpperBound);
    }
    __privateSet(this, _mdat, mdat(true));
    __privateGet(this, _writer).writeBox(__privateGet(this, _mdat));
  }
  __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
};
_computeMoovSizeUpperBound = new WeakSet();
computeMoovSizeUpperBound_fn = function() {
  if (typeof __privateGet(this, _options).fastStart !== "object")
    return;
  let upperBound = 0;
  let sampleCounts = [
    __privateGet(this, _options).fastStart.expectedVideoChunks,
    __privateGet(this, _options).fastStart.expectedAudioChunks
  ];
  for (let n of sampleCounts) {
    if (!n)
      continue;
    upperBound += (4 + 4) * Math.ceil(2 / 3 * n);
    upperBound += 4 * n;
    upperBound += (4 + 4 + 4) * Math.ceil(2 / 3 * n);
    upperBound += 4 * n;
    upperBound += 8 * n;
  }
  upperBound += 4096;
  return upperBound;
};
_prepareTracks = new WeakSet();
prepareTracks_fn = function() {
  if (__privateGet(this, _options).video) {
    __privateSet(this, _videoTrack, {
      id: 1,
      info: {
        type: "video",
        codec: __privateGet(this, _options).video.codec,
        width: __privateGet(this, _options).video.width,
        height: __privateGet(this, _options).video.height,
        rotation: __privateGet(this, _options).video.rotation ?? 0,
        decoderConfig: null
      },
      // The fallback contains many common frame rates as factors
      timescale: __privateGet(this, _options).video.frameRate ?? 57600,
      samples: [],
      finalizedChunks: [],
      currentChunk: null,
      firstDecodeTimestamp: void 0,
      lastDecodeTimestamp: -1,
      timeToSampleTable: [],
      compositionTimeOffsetTable: [],
      lastTimescaleUnits: null,
      lastSample: null,
      compactlyCodedChunkTable: []
    });
  }
  if (__privateGet(this, _options).audio) {
    __privateSet(this, _audioTrack, {
      id: __privateGet(this, _options).video ? 2 : 1,
      info: {
        type: "audio",
        codec: __privateGet(this, _options).audio.codec,
        numberOfChannels: __privateGet(this, _options).audio.numberOfChannels,
        sampleRate: __privateGet(this, _options).audio.sampleRate,
        decoderConfig: null
      },
      timescale: __privateGet(this, _options).audio.sampleRate,
      samples: [],
      finalizedChunks: [],
      currentChunk: null,
      firstDecodeTimestamp: void 0,
      lastDecodeTimestamp: -1,
      timeToSampleTable: [],
      compositionTimeOffsetTable: [],
      lastTimescaleUnits: null,
      lastSample: null,
      compactlyCodedChunkTable: []
    });
    if (__privateGet(this, _options).audio.codec === "aac") {
      let guessedCodecPrivate = __privateMethod(this, _generateMpeg4AudioSpecificConfig, generateMpeg4AudioSpecificConfig_fn).call(
        this,
        2,
        // Object type for AAC-LC, since it's the most common
        __privateGet(this, _options).audio.sampleRate,
        __privateGet(this, _options).audio.numberOfChannels
      );
      __privateGet(this, _audioTrack).info.decoderConfig = {
        codec: __privateGet(this, _options).audio.codec,
        description: guessedCodecPrivate,
        numberOfChannels: __privateGet(this, _options).audio.numberOfChannels,
        sampleRate: __privateGet(this, _options).audio.sampleRate
      };
    }
  }
};
_generateMpeg4AudioSpecificConfig = new WeakSet();
generateMpeg4AudioSpecificConfig_fn = function(objectType, sampleRate, numberOfChannels) {
  let frequencyIndices = [96e3, 88200, 64e3, 48e3, 44100, 32e3, 24e3, 22050, 16e3, 12e3, 11025, 8e3, 7350];
  let frequencyIndex = frequencyIndices.indexOf(sampleRate);
  let channelConfig = numberOfChannels;
  let configBits = "";
  configBits += objectType.toString(2).padStart(5, "0");
  configBits += frequencyIndex.toString(2).padStart(4, "0");
  if (frequencyIndex === 15)
    configBits += sampleRate.toString(2).padStart(24, "0");
  configBits += channelConfig.toString(2).padStart(4, "0");
  let paddingLength = Math.ceil(configBits.length / 8) * 8;
  configBits = configBits.padEnd(paddingLength, "0");
  let configBytes = new Uint8Array(configBits.length / 8);
  for (let i = 0; i < configBits.length; i += 8) {
    configBytes[i / 8] = parseInt(configBits.slice(i, i + 8), 2);
  }
  return configBytes;
};
_createSampleForTrack = new WeakSet();
createSampleForTrack_fn = function(track, data, type, timestamp, duration, meta, compositionTimeOffset) {
  let presentationTimestampInSeconds = timestamp / 1e6;
  let decodeTimestampInSeconds = (timestamp - (compositionTimeOffset ?? 0)) / 1e6;
  let durationInSeconds = duration / 1e6;
  let adjusted = __privateMethod(this, _validateTimestamp, validateTimestamp_fn).call(this, presentationTimestampInSeconds, decodeTimestampInSeconds, track);
  presentationTimestampInSeconds = adjusted.presentationTimestamp;
  decodeTimestampInSeconds = adjusted.decodeTimestamp;
  if (meta?.decoderConfig) {
    if (track.info.decoderConfig === null) {
      track.info.decoderConfig = meta.decoderConfig;
    } else {
      Object.assign(track.info.decoderConfig, meta.decoderConfig);
    }
  }
  let sample = {
    presentationTimestamp: presentationTimestampInSeconds,
    decodeTimestamp: decodeTimestampInSeconds,
    duration: durationInSeconds,
    data,
    size: data.byteLength,
    type,
    // Will be refined once the next sample comes in
    timescaleUnitsToNextSample: intoTimescale(durationInSeconds, track.timescale)
  };
  return sample;
};
_addSampleToTrack = new WeakSet();
addSampleToTrack_fn = function(track, sample) {
  if (__privateGet(this, _options).fastStart !== "fragmented") {
    track.samples.push(sample);
  }
  const sampleCompositionTimeOffset = intoTimescale(sample.presentationTimestamp - sample.decodeTimestamp, track.timescale);
  if (track.lastTimescaleUnits !== null) {
    let timescaleUnits = intoTimescale(sample.decodeTimestamp, track.timescale, false);
    let delta = Math.round(timescaleUnits - track.lastTimescaleUnits);
    track.lastTimescaleUnits += delta;
    track.lastSample.timescaleUnitsToNextSample = delta;
    if (__privateGet(this, _options).fastStart !== "fragmented") {
      let lastTableEntry = last(track.timeToSampleTable);
      if (lastTableEntry.sampleCount === 1) {
        lastTableEntry.sampleDelta = delta;
        lastTableEntry.sampleCount++;
      } else if (lastTableEntry.sampleDelta === delta) {
        lastTableEntry.sampleCount++;
      } else {
        lastTableEntry.sampleCount--;
        track.timeToSampleTable.push({
          sampleCount: 2,
          sampleDelta: delta
        });
      }
      const lastCompositionTimeOffsetTableEntry = last(track.compositionTimeOffsetTable);
      if (lastCompositionTimeOffsetTableEntry.sampleCompositionTimeOffset === sampleCompositionTimeOffset) {
        lastCompositionTimeOffsetTableEntry.sampleCount++;
      } else {
        track.compositionTimeOffsetTable.push({
          sampleCount: 1,
          sampleCompositionTimeOffset
        });
      }
    }
  } else {
    track.lastTimescaleUnits = 0;
    if (__privateGet(this, _options).fastStart !== "fragmented") {
      track.timeToSampleTable.push({
        sampleCount: 1,
        sampleDelta: intoTimescale(sample.duration, track.timescale)
      });
      track.compositionTimeOffsetTable.push({
        sampleCount: 1,
        sampleCompositionTimeOffset
      });
    }
  }
  track.lastSample = sample;
  let beginNewChunk = false;
  if (!track.currentChunk) {
    beginNewChunk = true;
  } else {
    let currentChunkDuration = sample.presentationTimestamp - track.currentChunk.startTimestamp;
    if (__privateGet(this, _options).fastStart === "fragmented") {
      let mostImportantTrack = __privateGet(this, _videoTrack) ?? __privateGet(this, _audioTrack);
      const chunkDuration = __privateGet(this, _options).minFragmentDuration ?? 1;
      if (track === mostImportantTrack && sample.type === "key" && currentChunkDuration >= chunkDuration) {
        beginNewChunk = true;
        __privateMethod(this, _finalizeFragment, finalizeFragment_fn).call(this);
      }
    } else {
      beginNewChunk = currentChunkDuration >= 0.5;
    }
  }
  if (beginNewChunk) {
    if (track.currentChunk) {
      __privateMethod(this, _finalizeCurrentChunk, finalizeCurrentChunk_fn).call(this, track);
    }
    track.currentChunk = {
      startTimestamp: sample.presentationTimestamp,
      samples: []
    };
  }
  track.currentChunk.samples.push(sample);
};
_validateTimestamp = new WeakSet();
validateTimestamp_fn = function(presentationTimestamp, decodeTimestamp, track) {
  const strictTimestampBehavior = __privateGet(this, _options).firstTimestampBehavior === "strict";
  const noLastDecodeTimestamp = track.lastDecodeTimestamp === -1;
  const timestampNonZero = decodeTimestamp !== 0;
  if (strictTimestampBehavior && noLastDecodeTimestamp && timestampNonZero) {
    throw new Error(
      `The first chunk for your media track must have a timestamp of 0 (received DTS=${decodeTimestamp}).Non-zero first timestamps are often caused by directly piping frames or audio data from a MediaStreamTrack into the encoder. Their timestamps are typically relative to the age of thedocument, which is probably what you want.

If you want to offset all timestamps of a track such that the first one is zero, set firstTimestampBehavior: 'offset' in the options.
`
    );
  } else if (__privateGet(this, _options).firstTimestampBehavior === "offset" || __privateGet(this, _options).firstTimestampBehavior === "cross-track-offset") {
    if (track.firstDecodeTimestamp === void 0) {
      track.firstDecodeTimestamp = decodeTimestamp;
    }
    let baseDecodeTimestamp;
    if (__privateGet(this, _options).firstTimestampBehavior === "offset") {
      baseDecodeTimestamp = track.firstDecodeTimestamp;
    } else {
      baseDecodeTimestamp = Math.min(
        __privateGet(this, _videoTrack)?.firstDecodeTimestamp ?? Infinity,
        __privateGet(this, _audioTrack)?.firstDecodeTimestamp ?? Infinity
      );
    }
    decodeTimestamp -= baseDecodeTimestamp;
    presentationTimestamp -= baseDecodeTimestamp;
  }
  if (decodeTimestamp < track.lastDecodeTimestamp) {
    throw new Error(
      `Timestamps must be monotonically increasing (DTS went from ${track.lastDecodeTimestamp * 1e6} to ${decodeTimestamp * 1e6}).`
    );
  }
  track.lastDecodeTimestamp = decodeTimestamp;
  return { presentationTimestamp, decodeTimestamp };
};
_finalizeCurrentChunk = new WeakSet();
finalizeCurrentChunk_fn = function(track) {
  if (__privateGet(this, _options).fastStart === "fragmented") {
    throw new Error("Can't finalize individual chunks if 'fastStart' is set to 'fragmented'.");
  }
  if (!track.currentChunk)
    return;
  track.finalizedChunks.push(track.currentChunk);
  __privateGet(this, _finalizedChunks).push(track.currentChunk);
  if (track.compactlyCodedChunkTable.length === 0 || last(track.compactlyCodedChunkTable).samplesPerChunk !== track.currentChunk.samples.length) {
    track.compactlyCodedChunkTable.push({
      firstChunk: track.finalizedChunks.length,
      // 1-indexed
      samplesPerChunk: track.currentChunk.samples.length
    });
  }
  if (__privateGet(this, _options).fastStart === "in-memory") {
    track.currentChunk.offset = 0;
    return;
  }
  track.currentChunk.offset = __privateGet(this, _writer).pos;
  for (let sample of track.currentChunk.samples) {
    __privateGet(this, _writer).write(sample.data);
    sample.data = null;
  }
  __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
};
_finalizeFragment = new WeakSet();
finalizeFragment_fn = function(flushStreamingWriter = true) {
  if (__privateGet(this, _options).fastStart !== "fragmented") {
    throw new Error("Can't finalize a fragment unless 'fastStart' is set to 'fragmented'.");
  }
  let tracks = [__privateGet(this, _videoTrack), __privateGet(this, _audioTrack)].filter((track) => track && track.currentChunk);
  if (tracks.length === 0)
    return;
  let fragmentNumber = __privateWrapper(this, _nextFragmentNumber)._++;
  if (fragmentNumber === 1) {
    let movieBox = moov(tracks, __privateGet(this, _creationTime), true);
    __privateGet(this, _writer).writeBox(movieBox);
  }
  let moofOffset = __privateGet(this, _writer).pos;
  let moofBox = moof(fragmentNumber, tracks);
  __privateGet(this, _writer).writeBox(moofBox);
  {
    let mdatBox = mdat(false);
    let totalTrackSampleSize = 0;
    for (let track of tracks) {
      for (let sample of track.currentChunk.samples) {
        totalTrackSampleSize += sample.size;
      }
    }
    let mdatSize = __privateGet(this, _writer).measureBox(mdatBox) + totalTrackSampleSize;
    if (mdatSize >= 2 ** 32) {
      mdatBox.largeSize = true;
      mdatSize = __privateGet(this, _writer).measureBox(mdatBox) + totalTrackSampleSize;
    }
    mdatBox.size = mdatSize;
    __privateGet(this, _writer).writeBox(mdatBox);
  }
  for (let track of tracks) {
    track.currentChunk.offset = __privateGet(this, _writer).pos;
    track.currentChunk.moofOffset = moofOffset;
    for (let sample of track.currentChunk.samples) {
      __privateGet(this, _writer).write(sample.data);
      sample.data = null;
    }
  }
  let endPos = __privateGet(this, _writer).pos;
  __privateGet(this, _writer).seek(__privateGet(this, _writer).offsets.get(moofBox));
  let newMoofBox = moof(fragmentNumber, tracks);
  __privateGet(this, _writer).writeBox(newMoofBox);
  __privateGet(this, _writer).seek(endPos);
  for (let track of tracks) {
    track.finalizedChunks.push(track.currentChunk);
    __privateGet(this, _finalizedChunks).push(track.currentChunk);
    track.currentChunk = null;
  }
  if (flushStreamingWriter) {
    __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
  }
};
_maybeFlushStreamingTargetWriter = new WeakSet();
maybeFlushStreamingTargetWriter_fn = function() {
  if (__privateGet(this, _writer) instanceof StreamTargetWriter) {
    __privateGet(this, _writer).flush();
  }
};
_ensureNotFinalized = new WeakSet();
ensureNotFinalized_fn = function() {
  if (__privateGet(this, _finalized)) {
    throw new Error("Cannot add new video or audio chunks after the file has been finalized.");
  }
};

return {Muxer,ArrayBufferTarget};
})();

/* MIT License

Copyright (c) 2023 Vanilagy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
