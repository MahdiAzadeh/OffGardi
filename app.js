'use strict';
let CATS=['خوراکی و مواد غذایی','پوشاک و کفش','خانه و زندگی','زیبایی و سلامت','خدمات','ورزش و تفریح','سایر'],CITIES=[],REGIONS=[],NBHS=[],SET={};
const SN={pending:'در انتظار تأیید',approved:'تأیید شده',rejected:'رد شده',blocked:'مسدود شده'};
const MN=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const $=s=>document.querySelector(s);
const fa=s=>String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const P=n=>fa(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'٬'))+' تومان';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
// ---- Jalali (via Intl)
const JF=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'});
function jp(d){const o={};JF.formatToParts(d).forEach(p=>o[p.type]=p.value);return{y:+o.year,m:+o.month,d:+o.day}}
const cmpJ=(a,b)=>(a.y-b.y)||(a.m-b.m)||(a.d-b.d);
function j2g(y,m,d){const t={y,m,d},x=new Date(Date.UTC(y+621,2,21));x.setUTCDate(x.getUTCDate()+(m<=6?(m-1)*31:186+(m-7)*30)+d-1);
  while(cmpJ(jp(x),t)<0)x.setUTCDate(x.getUTCDate()+1);while(cmpJ(jp(x),t)>0)x.setUTCDate(x.getUTCDate()-1);return x}
const isoOf=x=>x.toISOString().slice(0,10);
function monthLen(y,m){const n=m===12?j2g(y+1,1,1):j2g(y,m+1,1);return Math.round((n-j2g(y,m,1))/864e5)}
function D(x){if(!x)return'-';if(/^\d{4}-\d\d-\d\d$/.test(x)){const p=jp(new Date(x+'T00:00:00Z'));return fa(p.y+'/'+String(p.m).padStart(2,'0')+'/'+String(p.d).padStart(2,'0'))}return new Date(x).toLocaleDateString('fa-IR')}
let CAL={y:0,m:0,s:null,e:null};
function calInit(s,e){const t=jp(new Date(today()+'T00:00:00Z'));if(s&&e){CAL.s=s;CAL.e=e;const p=jp(new Date(s+'T00:00:00Z'));CAL.y=p.y;CAL.m=p.m}else{CAL.y=t.y;CAL.m=t.m;CAL.s=today();CAL.e=isoOf(j2g(t.y,t.m,monthLen(t.y,t.m)))}}
function calHtml(){const first=j2g(CAL.y,CAL.m,1),len=monthLen(CAL.y,CAL.m),off=(first.getUTCDay()+1)%7;let c='';for(let i=0;i<off;i++)c+='<span></span>';
  for(let d=1;d<=len;d++){const iso=isoOf(j2g(CAL.y,CAL.m,d)),inr=CAL.s&&CAL.e&&iso>=CAL.s&&iso<=CAL.e,ed=iso===CAL.s||iso===CAL.e;c+=`<button type="button" class="cd ${inr?'in':''} ${ed?'ed':''}" onclick="calPick('${iso}')">${fa(d)}</button>`}
  return`<div class="cal"><div class="row" style="margin-bottom:6px"><button type="button" class="btn s o nf" onclick="calNav(1)">▶</button><b style="text-align:center">${MN[CAL.m-1]} ${fa(CAL.y)}</b><button type="button" class="btn s o nf" onclick="calNav(-1)">◀</button></div><div class="cw">${['ش','ی','د','س','چ','پ','ج'].map(x=>`<span>${x}</span>`).join('')}</div><div class="cg">${c}</div></div>`}
function calUp(){$('#cal').innerHTML=calHtml();$('#calsum').textContent='از '+D(CAL.s)+' تا '+D(CAL.e||CAL.s)}
function calNav(k){CAL.m+=k;if(CAL.m>12){CAL.m=1;CAL.y++}if(CAL.m<1){CAL.m=12;CAL.y--}calUp()}
function calPick(iso){if(!CAL.s||CAL.e){CAL.s=iso;CAL.e=null}else if(iso<CAL.s){CAL.s=iso}else CAL.e=iso;calUp()}
// ---- state
let sb,U=null,PR=null,DS=[],FV=new Set(),V='home',Q='',NBF='',CTF='',CF='',AM='in',STORE=null,MYDS=[],tok=0,deferred=null,UNR=0,chan=null,DT='active',AA='customer',SS='menu',AF={st:'',nb:'',ct:''},MT='in',MC={},FORM={},PEND={},GC=0,GR=0;
const live=d=>d.is_active&&d.stores&&d.stores.status==='approved'&&d.start_date<=today()&&d.end_date>=today();
const SM=[['s_dash','📊','داشبورد'],['s_store','🏪','فروشگاه من'],['s_disc','🏷️','تخفیف‌های من'],['s_acct','👤','حساب من'],['s_msg','✉️','پیام‌ها']];
const AMN=[['a_dash','📊','داشبورد'],['a_req','📥','درخواست‌ها'],['a_set','⚙️','تنظیمات'],['a_acc','👥','حساب‌ها'],['a_msg','✉️','پیام‌ها']];
const menu=()=>PR&&PR.role==='seller'?SM:PR&&PR.role==='admin'?AMN:null;
const panel=()=>!PR?'auth':PR.role==='admin'?'a_dash':PR.role==='seller'?'s_dash':'acc';
function T(m){const t=$('#tb');t.textContent=m;t.style.display='block';clearTimeout(T.h);T.h=setTimeout(()=>t.style.display='none',2800)}
const fail=e=>T('❌ '+(e&&e.message?e.message:e));
function go(v,t){V=v;if(t)SS=t;R();scrollTo(0,0)}

async function boot(){
  addEventListener('online',()=>$('#off').hidden=true);addEventListener('offline',()=>$('#off').hidden=false);$('#off').hidden=navigator.onLine;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;head()});addEventListener('appinstalled',()=>{deferred=null;askNotif();head()});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  const c=window.OFFGARDI||{};
  if(!c.url||c.url.startsWith('YOUR_')){$('#app').innerHTML='<div class="box emp">⚙️ اتصال به سوپابیس تنظیم نشده است (config.js).</div>';return}
  sb=supabase.createClient(c.url,c.key);
  const {data:{session}}=await sb.auth.getSession();await setUser(session&&session.user);
  sb.auth.onAuthStateChange((_e,s)=>{const id=s&&s.user?s.user.id:null;if(id!==(U?U.id:null))setTimeout(()=>setUser(s&&s.user),0)});
}
async function setUser(u){
  U=u||null;PR=null;FV=new Set();UNR=0;if(chan){sb.removeChannel(chan);chan=null}
  if(U){const {data}=await sb.from('profiles').select('*').eq('id',U.id).maybeSingle();PR=data;
    const f=await sb.from('favorites').select('discount_id').eq('user_id',U.id);FV=new Set((f.data||[]).map(x=>x.discount_id));
    if(PR&&PR.role!=='customer'){await unread();subMsgs()}}
  await Promise.all([loadDS(),loadCats(),loadGeo()]);
  if(U&&PR&&PR.role!=='customer'&&(V==='home'||V==='auth'))V=panel();R();
}
async function loadDS(){const {data,error}=await sb.from('discounts').select('*,stores(id,name,address,neighborhood,city,phone,status,logo_url,lat,lng)').order('created_at',{ascending:false});if(error)fail(error);DS=data||[]}
async function loadCats(){const {data}=await sb.from('categories').select('name').order('sort');if(data&&data.length)CATS=data.map(x=>x.name)}
async function loadGeo(){const [c,r,n,s]=await Promise.all([sb.from('cities').select('*').order('id'),sb.from('regions').select('*').order('id'),sb.from('neighborhoods').select('*').order('id'),sb.from('app_settings').select('*')]);
  CITIES=c.data||[];REGIONS=r.data||[];NBHS=n.data||[];SET={};(s.data||[]).forEach(x=>SET[x.key]=x.value)}
async function unread(){let q=sb.from('messages').select('*',{count:'exact',head:true}).is('read_at',null);q=PR.role==='admin'?q.or(`recipient_id.is.null,recipient_id.eq.${U.id}`):q.eq('recipient_id',U.id);const {count}=await q;UNR=count||0}
function subMsgs(){chan=sb.channel('msgs-'+U.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},p=>{const m=p.new;if(m.recipient_id===U.id||(m.recipient_id==null&&PR.role==='admin')){UNR++;head();notify(m.subject||'پیام جدید',(m.body||'').slice(0,100));if(V.endsWith('_msg'))R()}}).subscribe()}
function notify(t,b){if(!('Notification' in window)||Notification.permission!=='granted')return;const o={body:b,icon:'icons/icon-192.png',dir:'rtl',lang:'fa'};navigator.serviceWorker&&navigator.serviceWorker.getRegistration().then(r=>r?r.showNotification(t,o):new Notification(t,o)).catch(()=>{})}
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
async function askNotif(){if(!('Notification' in window))return T('مرورگر شما از اعلان پشتیبانی نمی‌کند');if(Notification.permission==='granted')return T('اعلان‌ها فعال است 🔔');if(Notification.permission==='denied')return T('اعلان‌ها در تنظیمات مرورگر مسدود شده است');const p=await Notification.requestPermission();T(p==='granted'?'اعلان‌ها فعال شد 🔔':'اجازه اعلان داده نشد');if(p==='granted')notify('OffGardi','اعلان‌ها با موفقیت فعال شد ✅')}
async function inst(){
  if(deferred){deferred.prompt();const c=await deferred.userChoice;deferred=null;head();if(c.outcome==='accepted')askNotif();return}
  if(standalone())return askNotif();
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  $('#mo').innerHTML=`<div class="md" onclick="if(event.target===this)cl()"><div class="mb"><h3>نصب OffGardi</h3><p>${ios?'در سافاری دکمه <b>Share</b> را بزنید و <b>Add to Home Screen</b> را انتخاب کنید. بعد از باز کردن برنامه از صفحه اصلی، اعلان‌ها را فعال کنید.':'از منوی مرورگر گزینه <b>Install app</b> یا <b>افزودن به صفحه اصلی</b> را بزنید.'}</p><button class="btn w" onclick="cl();askNotif()">🔔 فعال‌سازی اعلان‌ها</button></div></div>`}

async function R(){const my=++tok;head();
  const VW={home,cats:()=>home(true),fav,auth,acc,s_dash,s_store,s_disc,s_new,s_acct,s_msg:msgs,a_dash,a_req,a_set,a_acc,a_msg:msgs};let h;
  try{h=await (VW[V]||home)()}catch(e){h=`<div class="emp">⚠️ ${esc(e.message)}</div>`}
  if(my===tok)$('#app').innerHTML=h}
function head(){const m=menu(),logo=SET.logo_url?`<img src="${esc(SET.logo_url)}" alt="">`:'🌿';
  $('.logo').innerHTML=`${logo} OffGardi`;
  const act=id=>V===id||(V==='s_new'&&id==='s_disc');
  const badge=id=>id.endsWith('_msg')&&UNR?`<b class="bg">${fa(UNR)}</b>`:'';
  if(m){$('#nav').innerHTML=m.map(x=>`<button class="lk ${act(x[0])?'on':''}" onclick="go('${x[0]}')">${x[2]}${badge(x[0])}</button>`).join('')+`<button class="lk ${V==='home'?'on':''}" onclick="go('home')">🌐 تخفیف‌ها</button>`;
    $('#bot').innerHTML=m.map(x=>`<button class="${act(x[0])?'on':''}" onclick="go('${x[0]}')"><span>${x[1]}</span><br>${x[2]}${badge(x[0])}</button>`).join('')}
  else{$('#nav').innerHTML=[['home','تخفیف‌ها'],['cats','دسته‌بندی‌ها'],['reg','ثبت فروشگاه']].map(x=>`<button class="lk ${V===x[0]?'on':''}" onclick="${x[0]==='reg'?'goReg()':`go('${x[0]}')`}">${x[1]}</button>`).join('');
    $('#bot').innerHTML=[['home','🏠','خانه'],['cats','🗂️','دسته‌بندی‌ها'],['fav','❤️','علاقه‌مندی‌ها'],[panel(),'👤','حساب من']].map(x=>`<button class="${V===x[0]?'on':''}" onclick="go('${x[0]}')"><span>${x[1]}</span><br>${x[2]}</button>`).join('')}
  $('#usr').innerHTML=(standalone()?'':'<button class="btn s o" onclick="inst()">⬇️ نصب برنامه</button> ')+(U?`<button class="lk" onclick="logout()">خروج</button>`:`<button class="btn s" onclick="go('auth')">ورود / ثبت‌نام</button>`)}
function goReg(){if(PR&&PR.role==='seller')return go('s_store');T('برای ثبت فروشگاه با حساب «فروشنده» ثبت‌نام کنید');AM='up';go('auth')}

// ---------- customer
const im=(src,e)=>src?`<img src="${esc(src)}" alt="" loading="lazy">`:esc(e||'🛍️');
function card(d){const s=d.stores,f=FV.has(d.id);return`<div class="card" onclick="det('${d.id}')"><span class="bd">٪${fa(d.discount_percent)}</span><button class="heart" onclick="event.stopPropagation();fv('${d.id}')">${f?'❤️':'🤍'}</button><div class="img">${im(d.image_url,d.emoji)}</div><div class="cb"><h3>${esc(d.title)}</h3><div class="mu">${esc(s.name)}${s.neighborhood?' · '+esc(s.neighborhood):''}</div><div><span class="old">${P(d.original_price)}</span><br><span class="nw">${P(d.discounted_price)}</span></div><button class="btn s w" style="margin-top:8px">مشاهده جزئیات</button></div></div>`}
function list(){let l=DS.filter(live);if(CTF)l=l.filter(d=>d.stores.city===CTF);if(NBF)l=l.filter(d=>d.stores.neighborhood===NBF);if(CF)l=l.filter(d=>d.category===CF);
  if(Q){const q=Q.trim();l=l.filter(d=>(d.title+d.stores.name+(d.description||'')).includes(q))}
  return l.length?`<div class="grid">${l.map(card).join('')}</div>`:'<div class="emp">😕 تخفیفی با این فیلتر پیدا نشد.</div>'}
function chips(){return`<div class="chips">${['',...CATS].map(c=>`<span class="chip ${CF===c?'on':''}" onclick="CF=this.dataset.c;R()" data-c="${esc(c)}">${esc(c)||'همه'}</span>`).join('')}</div>`}
function home(c){const nbs=[...new Set(NBHS.filter(n=>!CTF||(CITIES.find(x=>x.id===n.city_id)||{}).name===CTF).map(n=>n.name))];
  return`${c?'':`<div class="hero"><h1>تخفیف‌های خوب، همین دور و بر تو</h1><p>پیشنهادهای ویژه فروشگاه‌های اطراف را پیدا کن و هوشمندانه‌تر خرید کن.</p><input class="in" style="margin:0" placeholder="🔍 جست‌وجوی کالا، خدمات و فروشگاه" value="${esc(Q)}" oninput="Q=this.value;sr()"></div>`}<div class="row">${CITIES.length>1?`<select class="in" onchange="CTF=this.value;NBF='';R()"><option value="">همه شهرها</option>${CITIES.map(n=>`<option ${CTF===n.name?'selected':''}>${esc(n.name)}</option>`).join('')}</select>`:''}${nbs.length?`<select class="in" onchange="NBF=this.value;R()"><option value="">همه محله‌ها</option>${nbs.map(n=>`<option ${NBF===n?'selected':''}>${esc(n)}</option>`).join('')}</select>`:''}</div>${chips()}<div id="ls">${list()}</div>`}
function sr(){$('#ls').innerHTML=list()}
async function fv(id){if(!U||!PR||PR.role!=='customer'){T('برای ذخیره، به‌عنوان مشتری وارد شوید');return go('auth')}
  const had=FV.has(id);const {error}=had?await sb.from('favorites').delete().eq('user_id',U.id).eq('discount_id',id):await sb.from('favorites').insert({user_id:U.id,discount_id:id});
  if(error)return fail(error);had?FV.delete(id):FV.add(id);R();if($('#mo').innerHTML)det(id,true)}
async function fav(){if(!U)return auth();const l=DS.filter(d=>live(d)&&FV.has(d.id));return`<h2>❤️ علاقه‌مندی‌ها</h2>${l.length?`<div class="grid">${l.map(card).join('')}</div>`:'<div class="emp">هنوز تخفیفی ذخیره نکرده‌اید.</div>'}`}
function det(id,quiet){const d=DS.find(x=>x.id===id);if(!d)return;const s=d.stores;if(!quiet)sb.rpc('increment_store_view',{p_store:s.id}).then(()=>{});
  const map=s.lat&&s.lng?` · <a href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=17/${s.lat}/${s.lng}" target="_blank" rel="noopener">نقشه</a>`:'';
  $('#mo').innerHTML=`<div class="md" onclick="if(event.target===this)cl()"><div class="mb"><div class="img" style="border-radius:18px;height:170px;font-size:72px">${im(d.image_url,d.emoji)}</div><h2>${esc(d.title)} <span class="bd" style="position:static;display:inline-block">٪${fa(d.discount_percent)}</span></h2><p class="mu">${esc(s.name)} · ${esc(d.category)}${s.neighborhood?' · '+esc(s.neighborhood):''}<br>📍 ${esc(s.address)}${map}${s.phone?'<br>📞 '+esc(fa(s.phone)):''}</p><div><span class="old">${P(d.original_price)}</span> <span class="nw" style="font-size:20px">${P(d.discounted_price)}</span></div><p>${esc(d.description)}</p><div class="box"><b>شرایط استفاده:</b><br>${esc(d.terms)}<br><b>⚠️ استفاده از تخفیف فقط حضوری است؛ باید به فروشگاه مراجعه کنید.</b></div><p class="mu">اعتبار تا ${D(d.end_date)} · موجودی: ${d.stock===null?'نامحدود':d.stock>0?fa(d.stock)+' عدد':'ناموجود'}${d.per_customer_limit?' · سقف هر مشتری: '+fa(d.per_customer_limit):''}</p><div class="row"><button class="btn" ${d.stock===null||d.stock>0?'':'disabled'} onclick="use('${d.id}')">استفاده از تخفیف</button><button class="btn o" onclick="fv('${d.id}')">${FV.has(d.id)?'حذف از علاقه‌مندی‌ها':'ذخیره در علاقه‌مندی‌ها'}</button></div></div></div>`}
function cl(){$('#mo').innerHTML=''}
async function use(id){if(!U||!PR||PR.role!=='customer'){cl();T('ابتدا به‌عنوان مشتری وارد شوید');return go('auth')}
  const {data,error}=await sb.rpc('create_redemption',{p_discount:id});if(error)return fail(error);
  $('#mo').innerHTML=`<div class="md" onclick="if(event.target===this)cl()"><div class="mb"><h3>کد تخفیف شما</h3><div class="code">${esc(data.code)}</div><p class="mu">این کد را به فروشنده نشان دهید. تا ${fa(new Date(data.expires_at).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}))} معتبر است و فقط یک‌بار قابل استفاده است.</p><button class="btn w" onclick="cl();go('acc')">مشاهده کدهای من</button></div></div>`}

// ---------- auth & account
function auth(){if(U&&PR){V=panel();R();return''}if(U)return'<div class="emp">در حال بارگذاری…</div>';
  const up=AM==='up';return`<div class="box"><div class="chips"><span class="chip ${up?'':'on'}" onclick="AM='in';R()">ورود</span><span class="chip ${up?'on':''}" onclick="AM='up';R()">ثبت‌نام</span></div>${up?'<input class="in" id="an" placeholder="نام و نام خانوادگی"><input class="in" id="ap" type="tel" placeholder="شماره تماس"><select class="in" id="ar"><option value="customer">مشتری هستم</option><option value="seller">فروشنده هستم</option></select>':''}<input class="in" id="ae" type="email" placeholder="ایمیل" dir="ltr"><input class="in" id="aw" type="password" placeholder="رمز عبور (حداقل ۶ نویسه)" dir="ltr"><button class="btn w" id="ab" onclick="${up?'signup()':'login()'}">${up?'ثبت‌نام':'ورود'}</button></div>`}
async function login(){const b=$('#ab');b.disabled=true;const {error}=await sb.auth.signInWithPassword({email:$('#ae').value.trim(),password:$('#aw').value});b.disabled=false;if(error)return fail('ایمیل یا رمز عبور اشتباه است');T('خوش آمدید 👋')}
async function signup(){const g=i=>$(i).value.trim(),e=g('#ae'),w=$('#aw').value;if(!g('#an'))return T('نام الزامی است');if(!/^\S+@\S+\.\S+$/.test(e))return T('ایمیل نامعتبر است');if(w.length<6)return T('رمز عبور حداقل ۶ نویسه باشد');
  const b=$('#ab');b.disabled=true;const {data,error}=await sb.auth.signUp({email:e,password:w,options:{data:{name:g('#an'),phone:g('#ap'),role:g('#ar')}}});b.disabled=false;if(error)return fail(error);
  if(!data.session){AM='in';R();return T('ثبت‌نام انجام شد. ایمیل خود را برای تأیید بررسی کنید و سپس وارد شوید.')}T('ثبت‌نام موفق بود 🎉')}
async function logout(){await sb.auth.signOut();V='home';await setUser(null)}
function acctHtml(){const seller=PR.role==='seller';return`<div class="box"><h3>اطلاعات حساب</h3><label class="lb">نام کاربری (انگلیسی، ۳ تا ۲۰ نویسه)</label><input class="in" id="pu" dir="ltr" value="${esc(PR.username||'')}" placeholder="username"><label class="lb">نام</label><input class="in" id="pn" value="${esc(PR.name)}"><label class="lb">شماره تماس</label><input class="in" id="pp" value="${esc(PR.phone||'')}"><label class="lb">ایمیل (برای ورود)</label><input class="in" value="${esc(PR.email)}" dir="ltr" disabled><button class="btn" onclick="pf()">ذخیره</button></div>
<div class="box"><h3>تغییر رمز عبور</h3><input class="in" id="po" type="password" placeholder="رمز فعلی" dir="ltr"><input class="in" id="pw1" type="password" placeholder="رمز جدید (حداقل ۶ نویسه)" dir="ltr"><input class="in" id="pw2" type="password" placeholder="تکرار رمز جدید" dir="ltr"><button class="btn" onclick="chPass()">تغییر رمز عبور</button></div>
<div class="box"><h3>برنامه و اعلان‌ها</h3><div class="row"><button class="btn o" onclick="inst()">⬇️ نصب برنامه</button><button class="btn l" onclick="askNotif()">🔔 فعال‌سازی اعلان‌ها</button></div></div>${seller?'<div id="bill"></div>':''}`}
async function pf(){const u=$('#pu').value.trim().toLowerCase();if(u&&!/^[a-z0-9_]{3,20}$/.test(u))return T('نام کاربری نامعتبر است');
  const {error}=await sb.from('profiles').update({name:$('#pn').value.trim(),phone:$('#pp').value.trim(),username:u||null}).eq('id',U.id);if(error)return fail(error.code==='23505'?'این نام کاربری قبلاً گرفته شده است':error);
  const {data}=await sb.from('profiles').select('*').eq('id',U.id).maybeSingle();PR=data;R();T('ذخیره شد ✓')}
async function chPass(){const o=$('#po').value,a=$('#pw1').value,b=$('#pw2').value;if(a.length<6)return T('رمز جدید حداقل ۶ نویسه باشد');if(a!==b)return T('تکرار رمز یکسان نیست');
  const v=await sb.auth.signInWithPassword({email:PR.email,password:o});if(v.error)return T('رمز فعلی اشتباه است');const {error}=await sb.auth.updateUser({password:a});if(error)return fail(error);['#po','#pw1','#pw2'].forEach(i=>$(i).value='');T('رمز عبور تغییر کرد ✓')}
async function acc(){if(!U)return auth();if(!PR)return'<div class="emp">در حال بارگذاری…</div>';if(PR.role!=='customer'){V=panel();R();return''}
  const {data,error}=await sb.from('redemptions').select('*,discounts(title,emoji),stores(name)').eq('user_id',U.id).order('created_at',{ascending:false});if(error)throw error;
  const st=r=>r.status==='used'?['استفاده‌شده','g']:new Date(r.expires_at)<new Date()?['منقضی','x']:['فعال','p'];
  return`<h2>حساب من</h2>${PR.blocked?'<div class="note">حساب شما مسدود شده است.</div>':''}${acctHtml()}<h3>کدها و سوابق</h3>${(data||[]).length?data.map(r=>{const s=st(r);return`<div class="box row"><div><b>${esc(r.discounts.emoji)} ${esc(r.discounts.title)}</b><div class="mu">${esc(r.stores.name)}</div></div><div class="code" style="font-size:18px;margin:0">${esc(r.code)}</div><span class="tag ${s[1]}">${s[0]}</span></div>`}).join(''):'<div class="emp">هنوز کدی دریافت نکرده‌اید.</div>'}`}

// ---------- images
async function prepImg(file,size,kb,png){const img=await createImageBitmap(file),s=Math.min(img.width,img.height),c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');if(!png){x.fillStyle='#fff';x.fillRect(0,0,size,size)}x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,size,size);
  const tb=(t,q)=>new Promise(r=>c.toBlob(r,t,q));let b;if(png){b=await tb('image/png');if(b.size<=kb*1024)return b}let q=.9;do{b=await tb('image/jpeg',q);q-=.1}while(b.size>kb*1024&&q>.2);return b}
async function pickImg(inp,key,size,kb,prev,png){const f=inp.files[0];if(!f)return;if(!/^image\//.test(f.type))return T('فقط فایل تصویری مجاز است');try{const b=await prepImg(f,size,kb,png);PEND[key]=b;$('#'+prev).innerHTML=`<img src="${URL.createObjectURL(b)}" alt="">`;T('تصویر بهینه شد ('+fa(Math.round(b.size/1024))+' کیلوبایت)')}catch(e){fail('خواندن تصویر ممکن نشد')}}
async function upImg(key,folder){const b=PEND[key];if(!b)return null;const path=`${folder}/${Date.now()}.${b.type==='image/png'?'png':'jpg'}`;const {error}=await sb.storage.from('media').upload(path,b,{contentType:b.type});if(error)throw error;delete PEND[key];return sb.storage.from('media').getPublicUrl(path).data.publicUrl}
const imgHint=(w,kb)=>`<div class="mu">مربع ${fa(w)}×${fa(w)} پیکسل، حداکثر ${fa(kb)} کیلوبایت (JPG/PNG/WebP؛ به‌طور خودکار برش و بهینه می‌شود)</div>`;

// ---------- seller
async function needStore(){if(!U||!PR||PR.role!=='seller')return null;const {data}=await sb.from('stores').select('*').eq('owner_id',U.id).maybeSingle();STORE=data;return data}
const noStore=()=>`<div class="box emp">هنوز فروشگاهی ثبت نکرده‌اید.<br><br><button class="btn" onclick="go('s_store')">ثبت فروشگاه</button></div>`;
const guardS=()=>!U||!PR||PR.role!=='seller';
async function s_dash(){if(guardS())return auth();const s=await needStore();if(!s)return noStore();
  const [pd,rd]=await Promise.all([sb.from('discounts').select('*').eq('store_id',s.id),sb.from('redemptions').select('*,discounts(original_price,discounted_price)').eq('store_id',s.id)]);
  const ds=pd.data||[],rs=rd.data||[],t=today(),used=rs.filter(r=>r.status==='used');
  const act=ds.filter(d=>d.is_active&&d.start_date<=t&&d.end_date>=t),sch=ds.filter(d=>d.is_active&&d.start_date>t),past=ds.filter(d=>!d.is_active||d.end_date<t);
  const save=used.reduce((a,r)=>a+(r.discounts.original_price-r.discounts.discounted_price),0);
  const x=[[ds.length,'تخفیف منتشرشده'],[act.length,'تخفیف فعال'],[sch.length,'تخفیف رزروشده'],[past.length,'تخفیف گذشته'],[s.views,'بازدید فروشگاه'],[rs.length,'کد صادرشده'],[used.length,'کد استفاده‌شده']];
  return`<h2>داشبورد</h2><div class="box"><b>${esc(s.name)}</b> <span class="tag ${s.status==='approved'?'':s.status==='pending'?'p':'x'}">${SN[s.status]}</span>${s.status==='approved'?'':'<p class="mu">تا تأیید مدیر، تخفیف‌های شما عمومی نمی‌شود.</p>'}</div><div class="stats">${x.map(v=>`<div class="st"><b>${fa(v[0])}</b><span>${v[1]}</span></div>`).join('')}<div class="st"><b>${P(save)}</b><span>صرفه‌جویی مشتریان</span></div></div>
<div class="box"><h3>تأیید کد مشتری</h3><div class="row"><input class="in" id="vc" dir="ltr" maxlength="6" style="text-transform:uppercase;margin:0" placeholder="کد ۶ حرفی"><button class="btn nf" ${s.status==='approved'?'':'disabled'} onclick="ver()">تأیید کد</button></div></div>`}
async function ver(){const c=$('#vc').value.trim();if(!c)return T('کد را وارد کنید');const {data,error}=await sb.rpc('verify_redemption',{p_code:c});if(error)return fail(error);$('#vc').value='';T('✅ کد تأیید شد: '+data.title);R()}
// store form
function geoInner(city,reg,nb){const c=CITIES.find(x=>x.name===city);let h='';
  if(CITIES.length>1)h+=`<label class="lb">شهر</label><select class="in" id="sci" onchange="geoChg()"><option value="">انتخاب شهر</option>${CITIES.map(x=>`<option ${x.name===city?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`;
  else if(CITIES.length===1)h+=`<input type="hidden" id="sci" value="${esc(CITIES[0].name)}">`;
  const rg=c?REGIONS.filter(r=>r.city_id===c.id):[],rid=(rg.find(r=>r.name===reg)||{}).id;
  if(rg.length)h+=`<label class="lb">منطقه</label><select class="in" id="srg" onchange="geoChg()"><option value="">انتخاب منطقه</option>${rg.map(r=>`<option ${r.name===reg?'selected':''}>${esc(r.name)}</option>`).join('')}</select>`;
  const nl=c?NBHS.filter(n=>n.city_id===c.id&&(!n.region_id||n.region_id===rid)):[];
  if(nl.length)h+=`<label class="lb">محله</label><select class="in" id="snb"><option value="">انتخاب محله</option>${nl.map(n=>`<option ${n.name===nb?'selected':''}>${esc(n.name)}</option>`).join('')}</select>`;return h}
function geoChg(){$('#geo').innerHTML=geoInner($('#sci').value,$('#srg')?$('#srg').value:'','')}
function getLoc(){if(!navigator.geolocation)return T('مرورگر موقعیت‌یابی ندارد');navigator.geolocation.getCurrentPosition(p=>{$('#lat').value=p.coords.latitude.toFixed(6);$('#lng').value=p.coords.longitude.toFixed(6);T('موقعیت ثبت شد 📍')},()=>T('دسترسی به موقعیت داده نشد'),{enableHighAccuracy:true,timeout:10000})}
async function s_store(){if(guardS())return auth();const s=await needStore()||{};PEND={};
  return`<h2>فروشگاه من</h2>${s.id?`<div class="box">وضعیت: <span class="tag ${s.status==='approved'?'':s.status==='pending'?'p':'x'}">${SN[s.status]}</span></div>`:'<div class="note">پس از ثبت، فروشگاه «در انتظار تأیید» مدیر می‌ماند و تا آن زمان عمومی نمی‌شود.</div>'}
<div class="box"><div class="row" style="margin-bottom:8px"><div class="ph nf" id="lgp">${s.logo_url?im(s.logo_url):'🏪'}</div><div><label class="lb">لوگو</label><input type="file" accept="image/*" onchange="pickImg(this,'logo',256,80,'lgp',true)">${imgHint(256,80)}</div></div>
<label class="lb">نام فروشگاه</label><input class="in" id="sn" value="${esc(s.name)}"><label class="lb">حوزه فعالیت</label><select class="in" id="sc">${CATS.map(c=>`<option ${c===s.category?'selected':''}>${esc(c)}</option>`).join('')}</select><label class="lb">نام صاحب فروشگاه</label><input class="in" id="so" value="${esc(s.owner_name||PR.name)}"><div id="geo">${geoInner(s.city||(CITIES.length===1?CITIES[0].name:''),s.region,s.neighborhood)}</div><label class="lb">نشانی</label><input class="in" id="sa" value="${esc(s.address)}"><label class="lb">لوکیشن (عرض و طول جغرافیایی)</label><div class="row"><input class="in" id="lat" dir="ltr" placeholder="lat" value="${s.lat??''}"><input class="in" id="lng" dir="ltr" placeholder="lng" value="${s.lng??''}"><button class="btn l nf" style="margin-bottom:8px" onclick="getLoc()">📍 موقعیت من</button></div><label class="lb">شماره تماس</label><input class="in" id="sp" type="tel" value="${esc(s.phone)}"><label class="lb">توضیحات</label><textarea class="in" id="sd">${esc(s.description)}</textarea><button class="btn w" onclick="saveStore('${s.id||''}')">${s.id?'ذخیره تغییرات':'ثبت فروشگاه'}</button></div>`}
async function saveStore(id){const g=i=>$(i)?$(i).value.trim():'';if(g('#sn').length<2||!g('#sa')||!g('#sp'))return T('نام، نشانی و شماره تماس الزامی است');if(CITIES.length&&!g('#sci'))return T('شهر را انتخاب کنید');
  const lat=g('#lat'),lng=g('#lng');if((lat&&isNaN(+lat))||(lng&&isNaN(+lng)))return T('لوکیشن نامعتبر است');
  try{const o={name:g('#sn'),category:g('#sc'),owner_name:g('#so'),city:g('#sci')||null,region:g('#srg')||null,neighborhood:g('#snb')||null,address:g('#sa'),phone:g('#sp'),description:g('#sd'),lat:lat?+lat:null,lng:lng?+lng:null};
    const lg=await upImg('logo',U.id+'/logo');if(lg)o.logo_url=lg;
    const {error}=id?await sb.from('stores').update(o).eq('id',id):await sb.from('stores').insert({...o,owner_id:U.id});if(error)throw error;T(id?'ذخیره شد ✓':'ثبت شد؛ در انتظار تأیید مدیر');if(!id)go('s_dash');else R()}catch(e){fail(e)}}
// discounts
function dTab(d){const t=today();return d.is_active&&d.start_date>t?'sched':(d.is_active&&d.end_date>=t)?'active':'past'}
async function s_disc(){if(guardS())return auth();const s=await needStore();if(!s)return noStore();
  const {data}=await sb.from('discounts').select('*').eq('store_id',s.id).order('created_at',{ascending:false});MYDS=data||[];
  const l=MYDS.filter(d=>dTab(d)===DT),tabs=[['active','تخفیف‌های فعال'],['past','تخفیف‌های گذشته'],['sched','تخفیف‌های رزرو']];
  return`<h2>تخفیف‌های من</h2><div class="chips">${tabs.map(t=>`<span class="chip ${DT===t[0]?'on':''}" onclick="DT='${t[0]}';R()">${t[1]}</span>`).join('')}<button class="btn pe nf" onclick="pform()" ${s.status==='approved'?'':'disabled'}>+ ایجاد تخفیف</button></div>${s.status==='approved'?'':'<div class="note">ایجاد تخفیف پس از تأیید فروشگاه توسط مدیر ممکن می‌شود.</div>'}
${l.length?l.map(d=>`<div class="box"><div class="row"><div class="ph nf">${im(d.image_url,d.emoji)}</div><div><b>${esc(d.title)}</b> <span class="bd" style="position:static;display:inline-block">٪${fa(d.discount_percent)}</span><div class="mu">${P(d.original_price)} ← <b>${P(d.discounted_price)}</b></div><div class="mu">${D(d.start_date)} تا ${D(d.end_date)} · موجودی: ${d.stock===null?'نامحدود':fa(d.stock)} · استفاده: ${fa(d.uses)}${d.is_active?'':' · <span class="tag x">غیرفعال</span>'}</div></div></div><div class="row" style="margin-top:8px"><button class="btn s l" onclick="pform('${d.id}')">ویرایش</button><button class="btn s o" onclick="tg('${d.id}',${!d.is_active})">${d.is_active?'غیرفعال‌سازی':'فعال‌سازی'}</button><button class="btn s r" onclick="dl('${d.id}')">حذف</button></div></div>`).join(''):'<div class="emp">موردی وجود ندارد.</div>'}`}
function pform(id){const d=id?MYDS.find(x=>x.id===id):null;PEND={};
  FORM=d?{id:d.id,title:d.title,desc:d.description||'',cat:d.category,op:d.original_price,pct:d.discount_percent,terms:d.terms||'',stock:d.stock,lim:d.per_customer_limit,img:d.image_url,emoji:d.emoji}:{id:'',title:'',desc:'',cat:(STORE&&STORE.category)||CATS[0],op:'',pct:'',terms:'مراجعه حضوری الزامی است.',stock:10,lim:null,img:null,emoji:'🛍️'};
  d?calInit(d.start_date,d.end_date):calInit();go('s_new')}
function calcDp(){const op=+$('#f7').value,p=+$('#f8').value;let v=0;if(op>0&&p>0&&p<100){const raw=op*(1-p/100);v=Math.round(raw/1000)*1000;if(v<=0||v>=op)v=Math.round(raw)}$('#dp').textContent=v?P(v):'—';return v}
function unl(k){$('#'+k).disabled=$('#'+k+'u').checked;if($('#'+k+'u').checked)$('#'+k).value=''}
async function s_new(){if(guardS())return auth();if(!STORE)await needStore();const f=FORM;
  return`<h2>${f.id?'ویرایش':'ایجاد'} تخفیف</h2><div class="box"><label class="lb">عنوان</label><input class="in" id="f1" value="${esc(f.title)}"><label class="lb">دسته‌بندی</label><select class="in" id="f3">${CATS.map(c=>`<option ${c===f.cat?'selected':''}>${esc(c)}</option>`).join('')}</select>
<div class="row" style="margin-bottom:8px"><div class="ph nf" id="dph">${im(f.img,f.emoji)}</div><div><label class="lb">تصویر</label><input type="file" accept="image/*" onchange="pickImg(this,'disc',800,200,'dph')">${imgHint(800,200)}</div></div>
<div class="row"><div><label class="lb">قیمت عادی (تومان)</label><input class="in" id="f7" type="number" min="1" inputmode="numeric" value="${f.op}" oninput="calcDp()"></div><div><label class="lb">درصد تخفیف</label><input class="in" id="f8" type="number" min="1" max="99" inputmode="numeric" value="${f.pct}" oninput="calcDp()"></div></div>
<div class="box" style="background:var(--lav)">قیمت تخفیفی (خودکار، گرد‌شده): <b id="dp">—</b></div>
<label class="lb">توضیحات</label><textarea class="in" id="f5">${esc(f.desc)}</textarea><label class="lb">شرایط استفاده</label><textarea class="in" id="f6">${esc(f.terms)}</textarea>
<label class="lb">بازه فعال (تقویم شمسی): <b id="calsum"></b></label><div id="cal"></div>
<div class="row"><div><label class="lb">موجودی</label><input class="in" id="f9" type="number" min="0" value="${f.stock??''}" ${f.stock===null?'disabled':''}><label><input type="checkbox" id="f9u" ${f.stock===null?'checked':''} onchange="unl('f9')"> نامحدود</label></div><div><label class="lb">تعداد خرید مجاز هر مشتری</label><input class="in" id="fa" type="number" min="1" value="${f.lim??''}" ${f.lim===null?'disabled':''}><label><input type="checkbox" id="fau" ${f.lim===null?'checked':''} onchange="unl('fa')"> نامحدود</label></div></div>
<div class="row"><button class="btn o" onclick="go('s_disc')">انصراف</button><button class="btn" id="psb" onclick="ps()">ذخیره</button></div></div>`}
async function ps(){const f=FORM,g=i=>$(i).value.trim(),op=+g('#f7'),p=+g('#f8'),dp=calcDp();
  if(!g('#f1')||!g('#f5'))return T('عنوان و توضیحات الزامی است');if(!(op>0))return T('قیمت عادی باید مثبت باشد');if(!(p>=1&&p<=99))return T('درصد تخفیف بین ۱ تا ۹۹ باشد');if(!(dp>0&&dp<op))return T('با این مقادیر قیمت تخفیفی معتبر نمی‌شود');
  if(!CAL.s)return T('بازه فعال را انتخاب کنید');const e=CAL.e||CAL.s;const un=$('#f9u').checked,ul=$('#fau').checked;if(!un&&!(+g('#f9')>=0&&g('#f9')!==''))return T('موجودی نامعتبر است');if(!ul&&!(+g('#fa')>=1))return T('سقف خرید هر مشتری نامعتبر است');
  const b=$('#psb');b.disabled=true;try{const o={title:g('#f1'),description:g('#f5'),category:g('#f3'),original_price:op,discounted_price:dp,terms:g('#f6'),start_date:CAL.s,end_date:e,stock:un?null:+g('#f9'),per_customer_limit:ul?null:+g('#fa')};
    const im_=await upImg('disc',U.id+'/discounts');if(im_)o.image_url=im_;
    const {error}=f.id?await sb.from('discounts').update(o).eq('id',f.id):await sb.from('discounts').insert({...o,store_id:STORE.id,is_active:true});if(error)throw error;await loadDS();T('ذخیره شد ✓');go('s_disc')}catch(x){fail(x);b.disabled=false}}
async function tg(id,v){const {error}=await sb.from('discounts').update({is_active:v}).eq('id',id);if(error)return fail(error);await loadDS();R()}
async function dl(id){if(!confirm('حذف شود؟'))return;const {error}=await sb.from('discounts').delete().eq('id',id);if(error)return fail(error);await loadDS();R()}
async function s_acct(){if(guardS())return auth();const s=await needStore();
  let bill='';if(s){const {data}=await sb.from('redemptions').select('status,created_at').eq('store_id',s.id);const rs=data||[],t=jp(new Date(today()+'T00:00:00Z')),rows=[];
    for(let i=0;i<3;i++){let m=t.m-i,y=t.y;if(m<1){m+=12;y--}const a=isoOf(j2g(y,m,1)),b=isoOf(j2g(m===12?y+1:y,m===12?1:m+1,1));const inn=rs.filter(r=>r.created_at.slice(0,10)>=a&&r.created_at.slice(0,10)<b);rows.push(`<tr><td>${MN[m-1]} ${fa(y)}</td><td>${fa(inn.length)}</td><td>${fa(inn.filter(r=>r.status==='used').length)}</td><td>رایگان</td></tr>`)}
    bill=`<div class="box"><h3>صورتحساب</h3><p class="mu">پلن فعلی: <b>رایگان</b>. هنوز درگاه پرداخت فعال نیست و هزینه‌ای از شما دریافت نمی‌شود.</p><div class="tw"><table><tr><th>ماه</th><th>کد صادرشده</th><th>استفاده‌شده</th><th>مبلغ</th></tr>${rows.join('')}</table></div></div>`}
  return`<h2>حساب من</h2>${acctHtml().replace('<div id="bill"></div>',bill)}`}

// ---------- messages
async function msgs(){if(!U||!PR||PR.role==='customer')return auth();const isA=PR.role==='admin';
  const tabs=`<div class="chips">${[['in','پیام‌های دریافتی'],['out','پیام‌های ارسالی']].map(t=>`<span class="chip ${MT===t[0]?'on':''}" onclick="MT='${t[0]}';R()">${t[1]}</span>`).join('')}<button class="btn pe nf" onclick="MT='new';R()">✏️ پیام جدید</button></div>`;
  if(MT==='new'){let to='';if(isA){const {data}=await sb.from('profiles').select('id,name,role,email').neq('role','admin').order('name');to=`<label class="lb">گیرنده</label><select class="in" id="mt">${(data||[]).map(u=>`<option value="${u.id}" ${MC.to===u.id?'selected':''}>${esc(u.name||u.email)} (${u.role==='seller'?'فروشنده':'مشتری'})</option>`).join('')}</select>`}else to='<div class="mu" style="margin-bottom:8px">گیرنده: مدیریت OffGardi</div>';
    return`<h2>پیام‌ها</h2>${tabs}<div class="box">${to}<input class="in" id="ms" placeholder="موضوع" maxlength="100" value="${esc(MC.sub||'')}"><textarea class="in" id="mbd" rows="5" maxlength="2000" placeholder="متن پیام"></textarea><button class="btn w" onclick="sendMsg()">ارسال</button></div>`}
  const sel='*,sender:profiles!sender_id(name,role),recipient:profiles!recipient_id(name)';let q=sb.from('messages').select(sel).order('created_at',{ascending:false}).limit(100);
  q=MT==='out'?q.eq('sender_id',U.id):isA?q.or(`recipient_id.is.null,recipient_id.eq.${U.id}`):q.eq('recipient_id',U.id);const {data,error}=await q;if(error)throw error;
  (data||[]).forEach(m=>MC[m.id]=m);
  return`<h2>پیام‌ها</h2>${tabs}${(data||[]).length?(data||[]).map(m=>`<div class="box msg ${MT==='in'&&!m.read_at?'un':''}" onclick="openMsg('${m.id}')"><div><b>${esc(m.subject||'(بدون موضوع)')}</b><div class="mu">${MT==='out'?'به: '+esc(m.recipient?m.recipient.name:'مدیریت'):'از: '+esc(m.sender?m.sender.name:'سیستم')} — ${esc((m.body||'').slice(0,60))}</div></div><span class="mu">${D(m.created_at)}</span></div>`).join(''):'<div class="emp">پیامی وجود ندارد.</div>'}`}
async function openMsg(id){const m=MC[id];if(!m)return;const canReply=MT==='in'&&m.sender_id;
  $('#mo').innerHTML=`<div class="md" onclick="if(event.target===this)cl()"><div class="mb"><h3>${esc(m.subject||'(بدون موضوع)')}</h3><p class="mu">${MT==='out'?'به: '+esc(m.recipient?m.recipient.name:'مدیریت'):'از: '+esc(m.sender?m.sender.name:'سیستم')} · ${D(m.created_at)}</p><p style="white-space:pre-wrap">${esc(m.body)}</p><div class="row">${canReply?`<button class="btn" onclick="cl();MC.to='${m.sender_id}';MC.sub='Re: '+MC['${m.id}'].subject;MT='new';R()">پاسخ</button>`:''}<button class="btn o" onclick="cl()">بستن</button></div></div></div>`;
  if(MT==='in'&&!m.read_at){const {error}=await sb.from('messages').update({read_at:new Date().toISOString()}).eq('id',id);if(!error){m.read_at=1;await unread();head()}}}
async function sendMsg(){const b=$('#mbd').value.trim();if(!b)return T('متن پیام را بنویسید');const isA=PR.role==='admin';
  const {error}=await sb.from('messages').insert({sender_id:U.id,recipient_id:isA?$('#mt').value:null,subject:$('#ms').value.trim(),body:b});if(error)return fail(error);MC={};MT='out';R();T('پیام ارسال شد ✓')}

// ---------- admin
const guardA=()=>!U||!PR||PR.role!=='admin';
const cnt=async(t,f)=>{let q=sb.from(t).select('*',{count:'exact',head:true});if(f)q=f(q);const {count}=await q;return count||0};
async function a_dash(){if(guardA())return auth();
  const [as,ps,cu,se,ad,ur,bl]=await Promise.all([cnt('stores',q=>q.eq('status','approved')),cnt('stores',q=>q.eq('status','pending')),cnt('profiles',q=>q.eq('role','customer')),cnt('profiles',q=>q.eq('role','seller')),cnt('discounts',q=>q.eq('is_active',true)),cnt('redemptions',q=>q.eq('status','used')),cnt('profiles',q=>q.eq('blocked',true))]);
  return`<h2>داشبورد</h2><div class="stats">${[[as,'فروشگاه فعال'],[ps,'فروشگاه منتظر تأیید'],[cu,'مشتریان'],[se,'فروشندگان'],[ad,'تخفیف فعال'],[ur,'کدهای استفاده‌شده'],[bl,'حساب مسدود']].map(v=>`<div class="st"><b>${fa(v[0])}</b><span>${v[1]}</span></div>`).join('')}</div>`}
async function a_req(){if(guardA())return auth();const {data}=await sb.from('stores').select('*,profiles(name,email)').eq('status','pending').order('created_at');
  return`<h2>درخواست‌ها</h2>${(data||[]).length?data.map(s=>`<div class="box"><div class="row"><div class="ph nf">${im(s.logo_url,'🏪')}</div><div><b>${esc(s.name)}</b> <span class="tag p">${SN[s.status]}</span><div class="mu">${esc(s.category)} · ${esc([s.city,s.region,s.neighborhood].filter(Boolean).join('، '))}</div></div></div><p class="mu">صاحب: ${esc(s.owner_name||'-')} (${esc(s.profiles?s.profiles.email:'-')})<br>📍 ${esc(s.address)}${s.lat?` · <a href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=17/${s.lat}/${s.lng}" target="_blank" rel="noopener">نقشه</a>`:''}<br>📞 ${esc(fa(s.phone))} · ثبت: ${D(s.created_at)}</p><div class="row"><button class="btn" onclick="ss('${s.id}','approved')">تأیید</button><button class="btn r" onclick="ss('${s.id}','rejected')">رد</button></div></div>`).join(''):'<div class="emp">درخواست منتظر تأییدی وجود ندارد 🎉</div>'}`}
async function ss(id,s){const {error}=await sb.from('stores').update({status:s}).eq('id',id);if(error)return fail(error);await loadDS();R();T('وضعیت: '+SN[s])}
async function bu(id,v){const {error}=await sb.from('profiles').update({blocked:v}).eq('id',id);if(error)return fail(error);R()}
function userTable(l){return`<div class="tw box"><table><tr><th>نام</th><th>ایمیل</th><th>نقش</th><th>وضعیت</th><th></th></tr>${l.map(x=>`<tr><td>${esc(x.name)}</td><td dir="ltr">${esc(x.email)}</td><td>${{customer:'مشتری',seller:'فروشنده',admin:'مدیر'}[x.role]}</td><td>${x.blocked?'<span class="tag x">مسدود</span>':'<span class="tag">فعال</span>'}</td><td>${x.role==='admin'?'':`<button class="btn s ${x.blocked?'o':'r'}" onclick="bu('${x.id}',${!x.blocked})">${x.blocked?'رفع مسدودی':'مسدود'}</button>`}</td></tr>`).join('')||'<tr><td colspan=5 class="emp">موردی نیست</td></tr>'}</table></div>`}
function storeTable(l){return`<div class="tw box"><table><tr><th>فروشگاه</th><th>مالک</th><th>تماس</th><th>محل</th><th>وضعیت</th><th></th></tr>${l.map(s=>`<tr><td>${esc(s.name)}${s.is_demo?' <span class="tag g">نمایشی</span>':''}</td><td>${esc(s.profiles?s.profiles.name:'-')}</td><td>${esc(fa(s.phone))}</td><td>${esc([s.city,s.neighborhood].filter(Boolean).join('، '))}</td><td><span class="tag ${s.status==='approved'?'':s.status==='pending'?'p':'x'}">${SN[s.status]}</span></td><td><button class="btn s" onclick="ss('${s.id}','approved')">تأیید</button> <button class="btn s o" onclick="ss('${s.id}','rejected')">رد</button> <button class="btn s r" onclick="ss('${s.id}','blocked')">مسدود</button></td></tr>`).join('')||'<tr><td colspan=6 class="emp">موردی نیست</td></tr>'}</table></div>`}
async function a_acc(){if(guardA())return auth();const tabs=`<div class="chips">${[['customer','مشتریان'],['seller','فروشندگان'],['store','فروشگاه‌ها']].map(t=>`<span class="chip ${AA===t[0]?'on':''}" onclick="AA='${t[0]}';R()">${t[1]}</span>`).join('')}</div>`;let b;
  if(AA==='store'){const {data}=await sb.from('stores').select('*,profiles(name)').order('created_at',{ascending:false});b=storeTable(data||[])}
  else{const {data}=await sb.from('profiles').select('*').eq('role',AA).order('created_at',{ascending:false});b=userTable(data||[])}
  return`<h2>حساب‌ها</h2>${tabs}${b}`}
// settings
const back='<button class="btn s o" onclick="SS=\'menu\';R()">← بازگشت به تنظیمات</button>';
const names=s=>s.split(/[,،\n]/).map(x=>x.trim()).filter(Boolean);
async function a_set(){if(guardA())return auth();
  if(SS==='menu')return`<h2>تنظیمات</h2><div class="stats">${[['geo','🗺️','مناطق'],['cats','🗂️','دسته‌بندی‌ها'],['logo','🖼️','لوگو برنامه'],['block','⛔','مسدودسازی'],['disc','🏷️','مدیریت تخفیف‌ها']].map(x=>`<button class="st" style="border:0;cursor:pointer;text-align:center" onclick="SS='${x[0]}';R()"><b>${x[1]}</b><span>${x[2]}</span></button>`).join('')}</div>`;
  if(SS==='geo'){const c=CITIES.find(x=>x.id===GC)||CITIES[0];GC=c?c.id:0;const rg=REGIONS.filter(r=>r.city_id===GC);const reg=rg.find(r=>r.id===GR);if(!reg)GR=0;
    return`${back}<h2>مناطق</h2><div class="box"><h3>شهرها</h3><p class="mu">یک یا چند شهر (با ویرگول یا خط جدید جدا کنید). اگر فقط یک شهر باشد، فروشگاه‌ها آن را به‌صورت پیش‌فرض می‌بینند.</p><div class="row"><input class="in" id="gc" placeholder="مثلاً: گرمدره، کرج" style="margin:0"><button class="btn nf" onclick="addGeo('cities')">افزودن</button></div><div style="margin-top:8px">${CITIES.map(x=>`<span class="tag g" style="display:inline-block;margin:3px">${esc(x.name)} <a href="#" onclick="delGeo('cities',${x.id});return false">✕</a></span>`).join('')||'<span class="mu">شهری تعریف نشده</span>'}</div></div>
<div class="box"><h3>مناطق</h3><p class="mu">اختیاری؛ اگر خالی باشد، فروشگاه‌ها فیلد منطقه را نمی‌بینند.</p><select class="in" onchange="GC=+this.value;R()">${CITIES.map(x=>`<option value="${x.id}" ${x.id===GC?'selected':''}>${esc(x.name)}</option>`).join('')}</select><div class="row"><input class="in" id="gr" placeholder="نام منطقه (چند مورد با ویرگول)" style="margin:0"><button class="btn nf" onclick="addGeo('regions')">افزودن</button></div><div style="margin-top:8px">${rg.map(x=>`<span class="tag g" style="display:inline-block;margin:3px">${esc(x.name)} <a href="#" onclick="delGeo('regions',${x.id});return false">✕</a></span>`).join('')||'<span class="mu">منطقه‌ای تعریف نشده</span>'}</div></div>
<div class="box"><h3>محله‌ها</h3><p class="mu">اختیاری؛ می‌توانید محله را به یک منطقه وصل کنید.</p><select class="in" onchange="GR=+this.value;R()"><option value="0">بدون منطقه (کل شهر ${esc(c?c.name:'')})</option>${rg.map(x=>`<option value="${x.id}" ${x.id===GR?'selected':''}>${esc(x.name)}</option>`).join('')}</select><div class="row"><input class="in" id="gn" placeholder="نام محله (چند مورد با ویرگول)" style="margin:0"><button class="btn nf" onclick="addGeo('neighborhoods')">افزودن</button></div><div style="margin-top:8px">${NBHS.filter(n=>n.city_id===GC&&(GR?n.region_id===GR:true)).map(x=>`<span class="tag g" style="display:inline-block;margin:3px">${esc(x.name)} <a href="#" onclick="delGeo('neighborhoods',${x.id});return false">✕</a></span>`).join('')||'<span class="mu">محله‌ای تعریف نشده</span>'}</div></div>`}
  if(SS==='cats')return`${back}<h2>دسته‌بندی‌ها</h2><div class="box"><div class="row"><input class="in" id="cn" placeholder="نام دسته جدید" style="margin:0"><button class="btn nf" onclick="ac()">افزودن</button></div></div><div class="box">${CATS.map(c=>`<div class="row" style="margin-bottom:6px"><span>${esc(c)}</span><button class="btn s r nf" data-c="${esc(c)}" onclick="dc(this.dataset.c)">حذف</button></div>`).join('')}</div>`;
  if(SS==='logo'){PEND={};return`${back}<h2>لوگو برنامه</h2><div class="box"><div class="row"><div class="ph nf" id="alp">${SET.logo_url?im(SET.logo_url):'🌿'}</div><div><input type="file" accept="image/*" onchange="pickImg(this,'applogo',256,80,'alp',true)">${imgHint(256,80)}</div></div><button class="btn w" style="margin-top:10px" onclick="saveLogo()">ذخیره لوگو</button></div>`}
  if(SS==='block'){const [u,s]=await Promise.all([sb.from('profiles').select('*').eq('blocked',true),sb.from('stores').select('*,profiles(name)').eq('status','blocked')]);
    return`${back}<h2>مسدودسازی</h2><div class="box"><h3>مسدودسازی با ایمیل</h3><div class="row"><input class="in" id="be" dir="ltr" placeholder="email" style="margin:0"><button class="btn r nf" onclick="blockMail()">مسدود</button></div></div><h3>کاربران مسدود</h3>${userTable(u.data||[])}<h3>فروشگاه‌های مسدود</h3>${storeTable(s.data||[])}`}
  if(SS==='disc'){const [{data},{data:sts}]=await Promise.all([sb.from('discounts').select('*,stores(name,neighborhood)').order('created_at',{ascending:false}),sb.from('stores').select('id,name')]);
    let l=data||[];if(AF.st)l=l.filter(d=>d.store_id===AF.st);if(AF.nb)l=l.filter(d=>d.stores.neighborhood===AF.nb);if(AF.ct)l=l.filter(d=>d.category===AF.ct);
    const nbs=[...new Set(NBHS.map(n=>n.name))];
    return`${back}<h2>مدیریت تخفیف‌ها</h2><div class="row"><select class="in" onchange="AF.st=this.value;R()"><option value="">همه فروشگاه‌ها</option>${(sts||[]).map(s=>`<option value="${s.id}" ${AF.st===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select><select class="in" onchange="AF.nb=this.value;R()"><option value="">همه محله‌ها</option>${nbs.map(n=>`<option ${AF.nb===n?'selected':''}>${esc(n)}</option>`).join('')}</select><select class="in" onchange="AF.ct=this.value;R()"><option value="">همه دسته‌ها</option>${CATS.map(n=>`<option ${AF.ct===n?'selected':''}>${esc(n)}</option>`).join('')}</select></div><div class="tw box"><table><tr><th>تخفیف</th><th>فروشگاه</th><th>دسته</th><th></th></tr>${l.map(d=>`<tr><td>${esc(d.title)}</td><td>${esc(d.stores.name)}</td><td>${esc(d.category)}</td><td><button class="btn s o" onclick="tg('${d.id}',${!d.is_active})">${d.is_active?'غیرفعال':'فعال'}</button> <button class="btn s r" onclick="dl('${d.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan=4 class="emp">موردی نیست</td></tr>'}</table></div>`}
  return''}
async function addGeo(t){const id={cities:'#gc',regions:'#gr',neighborhoods:'#gn'}[t],l=names($(id).value);if(!l.length)return T('نامی وارد کنید');
  const rows=l.map(n=>t==='cities'?{name:n}:t==='regions'?{city_id:GC,name:n}:{city_id:GC,region_id:GR||null,name:n});if(t!=='cities'&&!GC)return T('ابتدا شهر تعریف کنید');
  const {error}=await sb.from(t).insert(rows);if(error)return fail(error.code==='23505'?'این مورد تکراری است':error);await loadGeo();R();T('افزوده شد ✓')}
async function delGeo(t,id){if(!confirm('حذف شود؟ موارد وابسته هم حذف می‌شوند.'))return;const {error}=await sb.from(t).delete().eq('id',id);if(error)return fail(error);await loadGeo();R()}
async function ac(){const n=$('#cn').value.trim();if(!n)return T('نام دسته را وارد کنید');const {error}=await sb.from('categories').insert({name:n,sort:CATS.length+1});if(error)return fail(error);await loadCats();R()}
async function dc(n){if(!confirm('حذف شود؟'))return;const {error}=await sb.from('categories').delete().eq('name',n);if(error)return fail(error);await loadCats();R()}
async function saveLogo(){try{const u=await upImg('applogo','app');if(!u)return T('ابتدا تصویر را انتخاب کنید');const {error}=await sb.from('app_settings').upsert({key:'logo_url',value:u,updated_at:new Date().toISOString()});if(error)throw error;await loadGeo();R();T('لوگو ذخیره شد ✓')}catch(e){fail(e)}}
async function blockMail(){const e=$('#be').value.trim().toLowerCase();if(!e)return;const {data,error}=await sb.from('profiles').update({blocked:true}).eq('email',e).neq('role','admin').select('id');if(error)return fail(error);if(!data.length)return T('کاربری با این ایمیل پیدا نشد');R();T('مسدود شد')}
boot();
