"use strict";
const $=id=>document.getElementById(id);
const root="https://api.github.com/repos/karoku9/LabRepairLogger-Releases";
const publicKeys={"beta-issuer":"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErjQEbmA+rtcNe2OllC+jw7O+md5AYA3dLrijlfUvnRPVa3uR4uo3Bap0ZjdI+/3vOJgjwDiTw4h8LxVrya1c2w==","beta-customer":"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEiwlMKBoQXhqzUMZyG9AkjgCAQNGZi9a8HlUF09PskesZIyvd/Y6nJvvasrUEBKoKRZr6ncISvRaSpdLfXLfPVA=="};
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const decoder=new TextDecoder("utf-8",{fatal:true});
const el=(tag,t,cls)=>{const x=document.createElement(tag);if(t!==undefined)x.textContent=t;if(cls)x.className=cls;return x};
async function api(path){const r=await fetch(root+path,{cache:"no-store",headers:{Accept:"application/vnd.github+json"},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error("GitHub HTTP "+r.status);return r.json()}
async function verify(file,id){
 if(file.type!=="file"||file.encoding!=="base64"||file.size<2||file.size>65536)throw Error();
 const doc=b64(file.content);if(doc.length!==file.size)throw Error();
 const env=JSON.parse(decoder.decode(doc));if(env.IssuerKeyId!=="beta-issuer"||env.CustomerKeyId!=="beta-customer")throw Error();
 const payload=b64(env.Payload);
 for(const [name,sig] of [[env.IssuerKeyId,env.IssuerSignature],[env.CustomerKeyId,env.CustomerSignature]]){
  const key=await crypto.subtle.importKey("spki",b64(publicKeys[name]),{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);const s=b64(sig);
  if(s.length!==64||!await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},key,s,payload))throw Error();
 }
 const c=JSON.parse(decoder.decode(payload));
 if(c.Version!==1||c.Product!=="LabRepairLogger.Desktop/v1"||c.LicenseId!==id||!Number.isSafeInteger(c.Generation)||c.Generation<1||!["Active","Suspended","Revoked"].includes(c.Disposition)||!Number.isFinite(Date.parse(c.ExpiresAtUtc))||!Array.isArray(c.DeviceWhitelist)||c.DeviceWhitelist.length<1||c.DeviceWhitelist.length>128||c.DeviceWhitelist.some(x=>!/^[A-F0-9]{64}$/.test(x)))throw Error();return c;
}
async function licenses(){
 const files=await api("/contents/licenses/v1?ref=main");
 if(!Array.isArray(files)||files.length>999)throw Error("Elenco non valido");
 const rows=$("rows"),result=[];let failed=0;
 for(const f of files){if(f.type!=="file"||!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}\.json$/.test(f.name))continue;
 try{result.push(await verify(await api("/contents/licenses/v1/"+encodeURIComponent(f.name)+"?ref=main"),f.name.slice(0,-5)))}catch{failed++}}
 rows.replaceChildren();for(const c of result){const expired=Date.parse(c.ExpiresAtUtc)<=Date.now();const active=c.Disposition==="Active"&&!expired;const tr=el("tr");const flag=el("td");flag.append(el("span",undefined,"indicator"+(active?" on":"")),document.createTextNode(active?"Sì":"No"));const state=el("td");state.append(el("span",c.Disposition==="Revoked"?"Revocata":expired?"Scaduta":c.Disposition==="Suspended"?"Sospesa":"Attiva","status "+(c.Disposition==="Revoked"?"revoked":active?"active":"suspended")));tr.append(flag,el("td",c.LicenseId),state,el("td",new Date(c.ExpiresAtUtc).toLocaleDateString("it-IT")),el("td",String(c.DeviceWhitelist.length)),el("td",String(c.Generation)));rows.append(tr)}
 if(!result.length){const tr=el("tr"),td=el("td","Nessuna licenza verificata");td.colSpan=6;tr.append(td);rows.append(tr)}
 $("count").textContent="("+result.length+")";$("licenseStatus").textContent="Doppia firma verificata. "+(failed?failed+" documenti non verificabili. ":"")+ "Ultimo controllo: "+new Date().toLocaleTimeString("it-IT");
}
async function releases(){const rs=await api("/releases?per_page=20");const list=rs.filter(r=>!r.draft&&r.prerelease&&/^nightly-v\d{4}\.\d{2}\.\d{2}\.\d+$/.test(r.tag_name)&&r.assets.some(a=>a.name==="client-update.json")&&r.assets.some(a=>a.name==="LRL-Nightly-Client-"+r.tag_name.slice(9)+"-win-x64.zip"));list.sort((a,b)=>{const x=a.tag_name.slice(9).split(".").map(Number),y=b.tag_name.slice(9).split(".").map(Number);for(let i=0;i<4;i++)if(x[i]!==y[i])return y[i]-x[i];return 0});$("version").textContent=list[0]?.tag_name.slice(9)||"Nessuna release completa";if(list[0])$("releaseLink").href="https://github.com/karoku9/LabRepairLogger-Releases/releases/tag/"+encodeURIComponent(list[0].tag_name)}
async function refresh(){$("refresh").disabled=true;await Promise.all([licenses().catch(e=>{$("rows").replaceChildren();const tr=el("tr"),td=el("td","Stato non verificabile");td.colSpan=6;tr.append(td);$("rows").append(tr);$("licenseStatus").textContent=e.message||"Errore verifica";$("count").textContent=""}),releases().catch(()=>{$("version").textContent="Stato non disponibile"})]);$("refresh").disabled=false}
$("refresh").onclick=refresh;refresh();