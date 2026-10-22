/* Acréscimos 2026: funciona sem internet e vai buscar sempre a versão mais recente quando há ligação */
const CACHE="acr2026"; /* página principal: confirma sempre no servidor (no-cache), para abrir a versão atual */
const CORE=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(self.clients.claim());});
self.addEventListener("message",e=>{if(e.data==="skip")self.skipWaiting();});
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
  if(new URL(r.url).pathname.endsWith("version.json"))return;
  e.respondWith((r.mode==="navigate"||/\/(index\.html)?$/.test(new URL(r.url).pathname)?fetch(r.url,{cache:"no-cache",credentials:"same-origin"}):fetch(r)).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));return res;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("index.html"))));
});
