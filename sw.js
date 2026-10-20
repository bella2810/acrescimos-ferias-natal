/* Acréscimos 2026: funciona sem internet e vai buscar sempre a versão mais recente quando há ligação */
const CACHE="acr2026";
const CORE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(self.clients.claim());});
self.addEventListener("message",e=>{if(e.data==="skip")self.skipWaiting();});
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
  if(new URL(r.url).pathname.endsWith("version.json"))return;
  e.respondWith(fetch(r).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));return res;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("index.html"))));
});
