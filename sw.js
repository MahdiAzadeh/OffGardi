const V='offgardi-v5',SHELL=['./','./index.html','./style.css','./app.js','./config.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.hostname.endsWith('supabase.co')||u.hostname.includes('tile.openstreetmap'))return; // API + map tiles: network only
 e.respondWith((async()=>{const c=await caches.open(V);const hit=await c.match(r,{ignoreSearch:r.mode==='navigate'});
  const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  const res=await net;if(res)return res;
  if(r.mode==='navigate'){const f=await c.match('./index.html');if(f)return f}
  return new Response('',{status:504})})())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus' in c)return c.focus()}return self.clients.openWindow('./')}))});
