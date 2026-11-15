'use strict';
const NB=['امیرآباد','سعادتیه','تاج بخش','ناصریه','کوهکن'];
let CATS=['خوراکی و مواد غذایی','پوشاک و کفش','خانه و زندگی','زیبایی و سلامت','خدمات','ورزش و تفریح','سایر'];
const SN={pending:'در انتظار تأیید',approved:'تأیید شده',rejected:'رد شده',blocked:'مسدود شده'};
const $=s=>document.querySelector(s);
const fa=s=>String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const P=n=>fa(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'٬'))+' تومان';
const D=d=>new Date(d).toLocaleDateString('fa-IR');
const today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sb,U=null,PR=null,DS=[],FV=new Set(),V='home',Q='',NBF='',CF='',TAB='dash',AT='dash',AF={st:'',nb:'',ct:''},AM='in',STORE=null,MYDS=[],tok=0,deferred=null;
const live=d=>d.is_active&&d.stores&&d.stores.status==='approved'&&d.start_date<=today()&&d.end_date>=today();
const panel=()=>!PR?'auth':PR.role==='admin'?'admin':PR.role==='seller'?'seller':'acc';
function T(m){const t=$('#tb');t.textContent=m;t.style.display='block';clearTimeout(T.h);T.h=setTimeout(()=>t.style.display='none',2800)}
const fail=e=>T('❌ '+(e&&e.message?e.message:e));
function go(v,t){V=v;if(t)TAB=t;R();scrollTo(0,0)}

async function boot(){
  addEventListener('online',()=>$('#off').hidden=true);addEventListener('offline',()=>$('#off').hidden=false);$('#off').hidden=navigator.onLine;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;head()});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  const c=window.OFFGARDI||{};
  if(!c.url||c.url.startsWith('YOUR_')){$('#app').innerHTML='<div class="box emp">⚙️ اتصال به سوپابیس تنظیم نشده است (config.js).</div>';return}
  sb=supabase.createClient(c.url,c.key);
  const {data:{session}}=await sb.auth.getSession();await setUser(session&&session.user);
  sb.auth.onAuthStateChange((_e,s)=>{const id=s&&s.user?s.user.id:null;if(id!==(U?U.id:null))setTimeout(()=>setUser(s&&s.user),0)});
}
async function setUser(u){
  U=u||null;PR=null;FV=new Set();
  if(U){const {data}=await sb.from('profiles').select('*').eq('id',U.id).maybeSingle();PR=data;
    const f=await sb.from('favorites').select('discount_id').eq('user_id',U.id);FV=new Set((f.data||[]).map(x=>x.discount_id))}
  await Promise.all([loadDS(),loadCats()]);R();
}
async function loadDS(){const {data,error}=await sb.from('discounts').select('*,stores(id,name,address,neighborhood,phone,status)').order('created_at',{ascending:false});if(error)fail(error);DS=data||[]}
async function loadCats(){const {data}=await sb.from('categories').select('name').order('sort');if(data&&data.length)CATS=data.map(x=>x.name)}

async function R(){const my=++tok;head();const m={home,cats:()=>home(true),fav,auth,acc,reg,seller,admin};let h;
  try{h=await (m[V]||home)()}catch(e){h=`<div class="emp">⚠️ ${esc(e.message)}</div>`}
  if(my===tok)$('#app').innerHTML=h}
function head(){
  $('#nav').innerHTML=[['home','تخفیف‌ها'],['cats','دسته‌بندی‌ها'],['reg','ثبت فروشگاه']].map(x=>`<button class="lk ${V===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</button>`).join('');
  $('#usr').innerHTML=(deferred?'<button class="btn s o" onclick="inst()">⬇️ نصب</button> ':'')+(U?`<button class="lk on" onclick="go('${panel()}')">👤 ${esc(PR&&PR.name||'حساب')}</button><button class="lk" onclick="logout()">خروج</button>`:`<button class="btn s" onclick="go('auth')">ورود / ثبت‌نام</button>`);
  $('#bot').innerHTML=[['home','🏠','خانه'],['cats','🗂️','دسته‌بندی‌ها'],['fav','❤️','علاقه‌مندی‌ها'],[panel(),'👤','حساب من']].map(x=>`<button class="${V===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}<br>${x[2]}</button>`).join('')}
async function inst(){if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;head()}

// ---------- customer
function card(d){const s=d.stores,f=FV.has(d.id);return`<div class="card" onclick="det('${d.id}')"><span class="bd">٪${fa(d.discount_percent)}</span><button class="heart" onclick="event.stopPropagation();fv('${d.id}')">${f?'❤️':'🤍'}</button><div class="img">${esc(d.emoji)}</div><div class="cb"><h3>${esc(d.title)}</h3><div class="mu">${esc(s.name)} · ${esc(s.neighborhood)}</div><div><span class="old">${P(d.original_price)}</span><br><span class="nw">${P(d.discounted_price)}</span></div><button class="btn s w" style="margin-top:8px">مشاهده جزئیات</button></div></div>`}
function list(){let l=DS.filter(live);if(NBF)l=l.filter(d=>d.stores.neighborhood===NBF);if(CF)l=l.filter(d=>d.category===CF);
  if(Q){const q=Q.trim();l=l.filter(d=>(d.title+d.stores.name+(d.description||'')).includes(q))}
  return l.length?`<div class="grid">${l.map(card).join('')}</div>`:'<div class="emp">😕 تخفیفی با این فیلتر پیدا نشد.</div>'}
function chips(){return`<div class="chips">${['',...CATS].map(c=>`<span class="chip ${CF===c?'on':''}" onclick="CF=this.dataset.c;R()" data-c="${esc(c)}">${esc(c)||'همه'}</span>`).join('')}</div>`}
function home(c){return`${c?'':`<div class="hero"><h1>تخفیف‌های خوب، همین دور و بر تو</h1><p>پیشنهادهای ویژه فروشگاه‌های گرمدره را پیدا کن و هوشمندانه‌تر خرید کن.</p><input class="in" style="margin:0" placeholder="🔍 جست‌وجوی کالا، خدمات و فروشگاه" value="${esc(Q)}" oninput="Q=this.value;sr()"></div>`}<select class="in" onchange="NBF=this.value;R()"><option value="">همه محله‌ها</option>${NB.map(n=>`<option ${NBF===n?'selected':''}>${n}</option>`).join('')}</select>${chips()}<div id="ls">${list()}</div>`}
function sr(){$('#ls').innerHTML=list()}
async function fv(id){if(!U||!PR||PR.role!=='customer'){T('برای ذخیره، به‌عنوان مشتری وارد شوید');return go('auth')}
  const had=FV.has(id);const {error}=had?await sb.from('favorites').delete().eq('user_id',U.id).eq('discount_id',id):await sb.from('favorites').insert({user_id:U.id,discount_id:id});
  if(error)return fail(error);had?FV.delete(id):FV.add(id);R();if($('#mo').innerHTML)det(id,true)}
async function fav(){if(!U)return auth();return`<h2>❤️ علاقه‌مندی‌ها</h2>${(()=>{const l=DS.filter(d=>live(d)&&FV.has(d.id));return l.length?`<div class="grid">${l.map(card).join('')}</div>`:'<div class="emp">هنوز تخفیفی ذخیره نکرده‌اید.</div>'})()}`}
function det(id,quiet){const d=DS.find(x=>x.id===id);if(!d)return;const s=d.stores;if(!quiet)sb.rpc('increment_store_view',{p_store:s.id}).then(()=>{});
  $('#mo').innerHTML=`<div class="md" onclick="if(event.target===this)cl()"><div class="mb"><div class="img" style="border-radius:16px;height:150px;font-size:72px">${esc(d.emoji)}</div><h2>${esc(d.title)} <span class="bd" style="position:static;display:inline-block">٪${fa(d.discount_percent)}</span></h2><p class="mu">${esc(s.name)} · ${esc(d.category)} · ${esc(s.neighborhood)}<br>📍 ${esc(s.address)}${s.phone?'<br>📞 '+esc(fa(s.phone)):''}</p><div><span class="old">${P(d.original_price)}</span> <span class="nw" style="font-size:20px">${P(d.discounted_price)}</span></div><p>${esc(d.description)}</p><div class="box"><b>شرایط استفاده:</b><br>${esc(d.terms)}<br><b>⚠️ استفاده از تخفیف فقط حضوری است؛ باید به فروشگاه مراجعه کنید.</b></div><p class="mu">اعتبار تا ${D(d.end_date)} · موجودی: ${d.stock>0?fa(d.stock)+' عدد':'ناموجود'}</p><div class="row"><button class="btn" ${d.stock>0?'':'disabled'} onclick="use('${d.id}')">استفاده از تخفیف</button><button class="btn o" onclick="fv('${d.id}')">${FV.has(d.id)?'حذف از علاقه‌مندی‌ها':'ذخیره در علاقه‌مندی‌ها'}</button></div></div></div>`}
function cl(){$('#mo').innerHTML=''}
async function use(id){if(!U||!PR||PR.role!=='customer'){cl();T('ابتدا به‌عنوان مشتری وارد شوید');return go('auth')}
  const {data,error}=await sb.rpc('create_redemption',{p_discount:id});if(error)return fail(error);
  $('#mo').innerHTML=`<div class="md" onclick="if(event.target===this)cl()"><div class="mb"><h3>کد تخفیف شما</h3><div class="code">${esc(data.code)}</div><p class="mu">این کد را به فروشنده نشان دهید. تا ${fa(new Date(data.expires_at).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}))} معتبر است و فقط یک‌بار قابل استفاده است.</p><button class="btn w" onclick="cl();go('acc')">مشاهده کدهای من</button></div></div>`}

// ---------- auth
function auth(){if(U&&PR){V=panel();R();return''}if(U)return'<div class="emp">در حال بارگذاری…</div>';
  const up=AM==='up';return`<div class="box"><div class="chips"><span class="chip ${up?'':'on'}" onclick="AM='in';R()">ورود</span><span class="chip ${up?'on':''}" onclick="AM='up';R()">ثبت‌نام</span></div>${up?'<input class="in" id="an" placeholder="نام و نام خانوادگی"><input class="in" id="ap" type="tel" placeholder="شماره تماس"><select class="in" id="ar"><option value="customer">مشتری هستم</option><option value="seller">فروشنده هستم</option></select>':''}<input class="in" id="ae" type="email" placeholder="ایمیل" dir="ltr"><input class="in" id="aw" type="password" placeholder="رمز عبور (حداقل ۶ نویسه)" dir="ltr"><button class="btn w" id="ab" onclick="${up?'signup()':'login()'}">${up?'ثبت‌نام':'ورود'}</button></div>`}
async function login(){const b=$('#ab');b.disabled=true;const {error}=await sb.auth.signInWithPassword({email:$('#ae').value.trim(),password:$('#aw').value});b.disabled=false;if(error)return fail('ایمیل یا رمز عبور اشتباه است');T('خوش آمدید 👋');go(panel())}
async function signup(){const g=i=>$(i).value.trim(),e=g('#ae'),w=$('#aw').value;if(!g('#an'))return T('نام الزامی است');if(!/^\S+@\S+\.\S+$/.test(e))return T('ایمیل نامعتبر است');if(w.length<6)return T('رمز عبور حداقل ۶ نویسه باشد');
  const b=$('#ab');b.disabled=true;const {data,error}=await sb.auth.signUp({email:e,password:w,options:{data:{name:g('#an'),phone:g('#ap'),role:g('#ar')}}});b.disabled=false;if(error)return fail(error);
  if(!data.session){AM='in';R();return T('ثبت‌نام انجام شد. ایمیل خود را برای تأیید بررسی کنید و سپس وارد شوید.')}T('ثبت‌نام موفق بود 🎉')}
async function logout(){await sb.auth.signOut();U=null;PR=null;V='home';await setUser(null)}

async function acc(){if(!U)return auth();if(!PR)return'<div class="emp">در حال بارگذاری…</div>';if(PR.role!=='customer'){V=panel();return R(),''}
  const {data,error}=await sb.from('redemptions').select('*,discounts(title,emoji),stores(name)').eq('user_id',U.id).order('created_at',{ascending:false});if(error)throw error;
  const st=r=>r.status==='used'?['استفاده‌شده','']:new Date(r.expires_at)<new Date()?['منقضی','x']:['فعال','p'];
  return`<h2>حساب من</h2>${PR.blocked?'<div class="note">حساب شما مسدود شده است.</div>':''}<div class="box"><input class="in" id="pn" value="${esc(PR.name)}" placeholder="نام"><input class="in" id="pp" value="${esc(PR.phone||'')}" placeholder="شماره تماس"><div class="mu" style="margin-bottom:8px" dir="ltr">${esc(PR.email)}</div><button class="btn" onclick="pf()">ذخیره پروفایل</button></div><h3>کدها و سوابق</h3>${(data||[]).length?data.map(r=>{const s=st(r);return`<div class="box row"><div><b>${esc(r.discounts.emoji)} ${esc(r.discounts.title)}</b><div class="mu">${esc(r.stores.name)}</div></div><div class="code" style="font-size:18px;margin:0">${esc(r.code)}</div><span class="tag ${s[1]}">${s[0]}</span></div>`}).join(''):'<div class="emp">هنوز کدی دریافت نکرده‌اید.</div>'}`}
async function pf(){const {error}=await sb.from('profiles').update({name:$('#pn').value.trim(),phone:$('#pp').value.trim()}).eq('id',U.id);if(error)return fail(error);const {data}=await sb.from('profiles').select('*').eq('id',U.id).maybeSingle();PR=data;R();T('پروفایل ذخیره شد ✓')}

// ---------- seller
function regForm(){return`<div class="box"><h2>ثبت فروشگاه</h2><p class="mu">پس از ثبت، فروشگاه «در انتظار تأیید» مدیر می‌ماند و تا آن زمان عمومی نمی‌شود.</p><input class="in" id="sn" placeholder="نام فروشگاه"><select class="in" id="sc">${CATS.map(c=>`<option>${esc(c)}</option>`).join('')}</select><select class="in" id="sb">${NB.map(c=>`<option>${c}</option>`).join('')}</select><input class="in" id="sa" placeholder="نشانی"><input class="in" id="sp" type="tel" placeholder="شماره تماس"><textarea class="in" id="sd" placeholder="توضیحات (اختیاری)"></textarea><button class="btn w" onclick="rs()">ثبت فروشگاه</button></div>`}
async function reg(){if(!U||!PR||PR.role!=='seller')return`<div class="box emp">برای ثبت فروشگاه باید با حساب «فروشنده» وارد شوید.<br><br><button class="btn" onclick="AM='up';go('auth')">ورود / ثبت‌نام</button></div>`;
  const {data}=await sb.from('stores').select('id').eq('owner_id',U.id).maybeSingle();if(data){V='seller';return R(),''}return regForm()}
async function rs(){const g=i=>$(i).value.trim();if(!g('#sn')||!g('#sa')||!g('#sp'))return T('همه فیلدهای ضروری را پر کنید');
  const {error}=await sb.from('stores').insert({owner_id:U.id,name:g('#sn'),category:g('#sc'),neighborhood:g('#sb'),address:g('#sa'),phone:g('#sp'),description:g('#sd')});if(error)return fail(error);T('ثبت شد؛ در انتظار تأیید مدیر');go('seller','dash')}
async function seller(){if(!U||!PR||PR.role!=='seller')return auth();
  const {data:s}=await sb.from('stores').select('*').eq('owner_id',U.id).maybeSingle();if(!s)return regForm();STORE=s;
  const [pd,rd]=await Promise.all([sb.from('discounts').select('*').eq('store_id',s.id).order('created_at',{ascending:false}),sb.from('redemptions').select('*,discounts(title)').eq('store_id',s.id).order('created_at',{ascending:false})]);
  MYDS=pd.data||[];const rs_=rd.data||[],ok=s.status==='approved';
  const tabs=`<div class="chips">${[['dash','داشبورد'],['prod','محصولات و تخفیف‌ها'],['ver','تأیید کد'],['hist','کدهای مشتریان']].map(t=>`<span class="chip ${TAB===t[0]?'on':''}" onclick="TAB='${t[0]}';R()">${t[1]}</span>`).join('')}</div>`;let b='';
  if(TAB==='dash')b=`<div class="box"><b>${esc(s.name)}</b> · ${esc(s.neighborhood)} <span class="tag ${ok?'':'p'}">${SN[s.status]}</span>${ok?'':'<p class="mu">تا تأیید مدیر، تخفیف‌های شما عمومی نمی‌شود و امکان افزودن تخفیف ندارید.</p>'}</div><div class="stats"><div class="st"><b>${fa(MYDS.filter(d=>d.is_active).length)}</b>تخفیف فعال</div><div class="st"><b>${fa(s.views)}</b>بازدید</div><div class="st"><b>${fa(rs_.filter(r=>r.status==='used').length)}</b>استفاده‌شده</div></div>`;
  if(TAB==='prod')b=`<button class="btn" ${ok?'':'disabled'} onclick="pform()">+ افزودن تخفیف</button><div class="tw box" style="margin-top:10px"><table><tr><th>عنوان</th><th>٪</th><th>قیمت</th><th>موجودی</th><th>استفاده</th><th></th></tr>${MYDS.map(d=>`<tr><td>${esc(d.emoji)} ${esc(d.title)}</td><td>${fa(d.discount_percent)}</td><td>${P(d.discounted_price)}</td><td>${fa(d.stock)}</td><td>${fa(d.uses)}</td><td><button class="btn s o" onclick="pform('${d.id}')">ویرایش</button> <button class="btn s o" onclick="tg('${d.id}',${!d.is_active})">${d.is_active?'غیرفعال':'فعال'}</button> <button class="btn s r" onclick="dl('${d.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan=6 class="emp">محصولی ندارید</td></tr>'}</table></div>`;
  if(TAB==='ver')b=`<div class="box"><h3>تأیید کد مشتری</h3><input class="in" id="vc" dir="ltr" maxlength="6" style="text-transform:uppercase" placeholder="کد ۶ حرفی"><button class="btn w" ${ok?'':'disabled'} onclick="ver()">تأیید کد</button></div>`;
  if(TAB==='hist')b=`<div class="tw box"><table><tr><th>کد</th><th>تخفیف</th><th>وضعیت</th></tr>${rs_.map(r=>`<tr><td dir="ltr">${esc(r.code)}</td><td>${esc(r.discounts.title)}</td><td>${r.status==='used'?'استفاده‌شده':new Date(r.expires_at)<new Date()?'منقضی':'فعال'}</td></tr>`).join('')||'<tr><td colspan=3 class="emp">کدی نیست</td></tr>'}</table></div>`;
  return`<h2>پنل فروشنده</h2>${tabs}${b}`}
async function ver(){const c=$('#vc').value.trim();if(!c)return T('کد را وارد کنید');const {data,error}=await sb.rpc('verify_redemption',{p_code:c});if(error)return fail(error);$('#vc').value='';T('✅ کد تأیید شد: '+data.title);R()}
function pform(id){const d=id?MYDS.find(x=>x.id===id):{title:'',emoji:'🛍️',category:CATS[0],description:'',terms:'مراجعه حضوری الزامی است.',original_price:'',discounted_price:'',start_date:today(),end_date:new Date(Date.now()+14*864e5).toISOString().slice(0,10),stock:10};
  $('#mo').innerHTML=`<div class="md" onclick="if(event.target===this)cl()"><div class="mb"><h3>${id?'ویرایش':'افزودن'} تخفیف</h3><input class="in" id="f1" placeholder="عنوان" value="${esc(d.title)}"><input class="in" id="f2" placeholder="تصویر (یک ایموجی)" value="${esc(d.emoji)}"><select class="in" id="f3">${CATS.map(c=>`<option ${c===d.category?'selected':''}>${esc(c)}</option>`).join('')}</select><textarea class="in" id="f5" placeholder="توضیحات">${esc(d.description)}</textarea><textarea class="in" id="f6" placeholder="شرایط استفاده">${esc(d.terms)}</textarea><div class="row"><input class="in" id="f7" type="number" min="1" placeholder="قیمت اصلی (تومان)" value="${d.original_price}"><input class="in" id="f8" type="number" min="1" placeholder="قیمت تخفیف‌خورده" value="${d.discounted_price}"></div><div class="row"><input class="in" id="f9" type="date" value="${d.start_date}"><input class="in" id="fa" type="date" value="${d.end_date}"><input class="in" id="fb" type="number" min="0" placeholder="موجودی" value="${d.stock}"></div><button class="btn w" onclick="ps('${id||''}')">ذخیره</button></div></div>`}
async function ps(id){const g=i=>$(i).value.trim(),op=+g('#f7'),dp=+g('#f8');
  if(!g('#f1')||!g('#f5')||!g('#f9')||!g('#fa'))return T('فیلدهای ضروری را پر کنید');if(!(op>0)||!(dp>0))return T('قیمت‌ها باید مثبت باشند');if(dp>=op)return T('قیمت تخفیفی باید کمتر از قیمت اصلی باشد');if(g('#fa')<g('#f9'))return T('تاریخ پایان قبل از شروع است');if(+g('#fb')<0)return T('موجودی نامعتبر است');
  const o={title:g('#f1'),emoji:g('#f2')||'🛍️',category:g('#f3'),description:g('#f5'),terms:g('#f6'),original_price:op,discounted_price:dp,start_date:g('#f9'),end_date:g('#fa'),stock:+g('#fb')};
  const {error}=id?await sb.from('discounts').update(o).eq('id',id):await sb.from('discounts').insert({...o,store_id:STORE.id});if(error)return fail(error);cl();await loadDS();R();T('ذخیره شد ✓ (تخفیف: ٪'+fa(Math.round((1-dp/op)*100))+')')}
async function tg(id,v){const {error}=await sb.from('discounts').update({is_active:v}).eq('id',id);if(error)return fail(error);await loadDS();R()}
async function dl(id){if(!confirm('حذف شود؟'))return;const {error}=await sb.from('discounts').delete().eq('id',id);if(error)return fail(error);await loadDS();R()}

// ---------- admin
async function admin(){if(!U||!PR||PR.role!=='admin')return auth();
  const tabs=`<div class="chips">${[['dash','داشبورد'],['st','فروشگاه‌ها'],['ds','تخفیف‌ها'],['us','کاربران'],['ct','دسته‌بندی‌ها']].map(t=>`<span class="chip ${AT===t[0]?'on':''}" onclick="AT='${t[0]}';R()">${t[1]}</span>`).join('')}</div>`;let b='';
  const cnt=async(t,f)=>{let q=sb.from(t).select('*',{count:'exact',head:true});if(f)q=f(q);const {count}=await q;return count||0};
  if(AT==='dash'){const [u,s,p,d,r]=await Promise.all([cnt('profiles'),cnt('stores'),cnt('stores',q=>q.eq('status','pending')),cnt('discounts',q=>q.eq('is_active',true)),cnt('redemptions',q=>q.eq('status','used'))]);
    b=`<div class="stats">${[[u,'کاربران'],[s,'فروشگاه‌ها'],[p,'در انتظار تأیید'],[d,'تخفیف فعال'],[r,'استفاده‌ها']].map(x=>`<div class="st"><b>${fa(x[0])}</b>${x[1]}</div>`).join('')}</div>`}
  if(AT==='st'){const {data}=await sb.from('stores').select('*,profiles(name,phone)').order('created_at',{ascending:false});
    b=`<div class="tw box"><table><tr><th>فروشگاه</th><th>مالک</th><th>تماس</th><th>محله</th><th>نشانی</th><th>ثبت</th><th>وضعیت</th><th></th></tr>${(data||[]).map(s=>`<tr><td>${esc(s.name)}${s.is_demo?' <span class="tag">نمایشی</span>':''}</td><td>${esc(s.profiles?s.profiles.name:'-')}</td><td>${esc(fa(s.phone))}</td><td>${esc(s.neighborhood)}</td><td>${esc(s.address)}</td><td>${D(s.created_at)}</td><td><span class="tag ${s.status==='approved'?'':s.status==='pending'?'p':'x'}">${SN[s.status]}</span></td><td><button class="btn s" onclick="ss('${s.id}','approved')">تأیید</button> <button class="btn s o" onclick="ss('${s.id}','rejected')">رد</button> <button class="btn s r" onclick="ss('${s.id}','blocked')">مسدود</button></td></tr>`).join('')}</table></div>`}
  if(AT==='ds'){const [{data},{data:sts}]=await Promise.all([sb.from('discounts').select('*,stores(name,neighborhood)').order('created_at',{ascending:false}),sb.from('stores').select('id,name')]);
    let l=data||[];if(AF.st)l=l.filter(d=>d.store_id===AF.st);if(AF.nb)l=l.filter(d=>d.stores.neighborhood===AF.nb);if(AF.ct)l=l.filter(d=>d.category===AF.ct);
    b=`<div class="row"><select class="in" onchange="AF.st=this.value;R()"><option value="">همه فروشگاه‌ها</option>${(sts||[]).map(s=>`<option value="${s.id}" ${AF.st===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select><select class="in" onchange="AF.nb=this.value;R()"><option value="">همه محله‌ها</option>${NB.map(n=>`<option ${AF.nb===n?'selected':''}>${n}</option>`).join('')}</select><select class="in" onchange="AF.ct=this.value;R()"><option value="">همه دسته‌ها</option>${CATS.map(n=>`<option ${AF.ct===n?'selected':''}>${esc(n)}</option>`).join('')}</select></div><div class="tw box"><table><tr><th>تخفیف</th><th>فروشگاه</th><th>محله</th><th>دسته</th><th></th></tr>${l.map(d=>`<tr><td>${esc(d.title)}</td><td>${esc(d.stores.name)}</td><td>${esc(d.stores.neighborhood)}</td><td>${esc(d.category)}</td><td><button class="btn s o" onclick="tg('${d.id}',${!d.is_active})">${d.is_active?'غیرفعال':'فعال'}</button> <button class="btn s r" onclick="dl('${d.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan=5 class="emp">موردی نیست</td></tr>'}</table></div>`}
  if(AT==='us'){const {data}=await sb.from('profiles').select('*').order('created_at',{ascending:false});
    b=`<div class="tw box"><table><tr><th>نام</th><th>ایمیل</th><th>نقش</th><th>وضعیت</th><th></th></tr>${(data||[]).map(x=>`<tr><td>${esc(x.name)}</td><td dir="ltr">${esc(x.email)}</td><td>${{customer:'مشتری',seller:'فروشنده',admin:'مدیر'}[x.role]}</td><td>${x.blocked?'مسدود':'فعال'}</td><td>${x.role==='admin'?'':`<button class="btn s o" onclick="bu('${x.id}',${!x.blocked})">${x.blocked?'رفع مسدودی':'مسدود'}</button>`}</td></tr>`).join('')}</table></div>`}
  if(AT==='ct')b=`<div class="box"><div class="row"><input class="in" id="cn" placeholder="نام دسته جدید" style="margin:0"><button class="btn" style="flex:0 0 auto" onclick="ac()">افزودن</button></div></div><div class="box">${CATS.map(c=>`<div class="row" style="margin-bottom:6px"><span>${esc(c)}</span><button class="btn s r" style="flex:0 0 auto" data-c="${esc(c)}" onclick="dc(this.dataset.c)">حذف</button></div>`).join('')}</div>`;
  return`<h2>پنل مدیریت</h2>${tabs}${b}`}
async function ss(id,s){const {error}=await sb.from('stores').update({status:s}).eq('id',id);if(error)return fail(error);await loadDS();R();T('وضعیت: '+SN[s])}
async function bu(id,v){const {error}=await sb.from('profiles').update({blocked:v}).eq('id',id);if(error)return fail(error);R()}
async function ac(){const n=$('#cn').value.trim();if(!n)return T('نام دسته را وارد کنید');const {error}=await sb.from('categories').insert({name:n,sort:CATS.length+1});if(error)return fail(error);await loadCats();R()}
async function dc(n){if(!confirm('حذف شود؟'))return;const {error}=await sb.from('categories').delete().eq('name',n);if(error)return fail(error);await loadCats();R()}
boot();
