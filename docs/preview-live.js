"use strict";
(() => {
const box=document.getElementById("previewStatus"),btn=document.getElementById("previewRefresh");
const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const key="MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEApPxxbEwzd+eBKLtG8GAEMsEVZqO1JT+4ILRGn387lh1mKZ+5ccffMWGeJlpJuuahxSsr23LcPBba9Tpsg+D8oYG4IivEsv1InJf/9YvawWglZwZennYtmzainziGyPJTzj3TRLV4eJsmZvd5d6pTKGhGbYGqUKrgwZgaXkgxmu2Q+phkQBjX9qKfKkZPVFPC7wbyZMIf2+BI5/yXtk/uABqPkP3mf7NmLiRAucf7rEgd/Bg2+ZerzAILEp0X/n0fP14YPHaRQeE2wXuY9wn3c1ox/VsAgBz1j7nSA+lpr6t18YBg+xeNWwauzOfJ6t08+apHxL/V2dCVPfG0e7r7RJvXCtY1XXm8eUGd3MgBy3OQig4mWLjsq2E675c9grkXKICtdUU4k7OcOwtOnD+vZhGe6YFUXz9ZfTGP1PzEzd/BVzvLa+BgGFGdpsBUZ9/KYCOvhozFaazLxpW6nPmcT/LsVtBZU8fTbnbCQnL7cRIzhd/1u0nhnDIZkf+2jZ2BAgMBAAE=";
async function refresh(){
btn.disabled=true;box.textContent="Verifica firma...";
try{
const r=await fetch("https://raw.githubusercontent.com/karoku9/LabRepairLogger-Releases/main/docs/preview/signed.json?v="+crypto.randomUUID(),{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(10000)});
if(!r.ok)throw Error("Feed unavailable");
const text=await r.text();if(text.length>32768)throw Error("Oversize");
const e=JSON.parse(text),payload=decode(e.payload),signature=decode(e.signature);
if(payload.length>16000||signature.length!==384)throw Error("Invalid envelope");
const pub=await crypto.subtle.importKey("spki",decode(key),{name:"RSA-PSS",hash:"SHA-256"},false,["verify"]);
if(!await crypto.subtle.verify({name:"RSA-PSS",saltLength:32},pub,signature,payload))throw Error("Bad signature");
const s=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(payload));
if(s.environment!=="TEST_ONLY"||s.schema!==1||!Number.isSafeInteger(s.revision)||s.revision<1||typeof s.serverDatabase?.sqlCipherEnabled!=="boolean"||!Array.isArray(s.licenses)||s.licenses.length>50)throw Error("Invalid test state");
const lines=["Firma verificata · Revisione "+s.revision,"Database test: "+(s.serverDatabase.sqlCipherEnabled?"SQLCipher":"SQLite")];
for(const row of s.licenses){if(!/^DEMO-[A-Za-z0-9_.-]{1,60}$/.test(row.id)||!["active","revoked"].includes(row.status)||!Number.isSafeInteger(row.generation)||!/^\d{4}-\d{2}-\d{2}$/.test(row.expiresAt))throw Error("Invalid test license");lines.push(row.id+" · "+(row.status==="active"?"Attiva":"Revocata")+" · gen. "+row.generation+" · "+row.expiresAt);}
box.textContent=lines.join("\n");
}catch{box.textContent="Stato di collaudo non verificabile. Riprova.";}
finally{btn.disabled=false;}
}
btn.addEventListener("click",refresh);refresh();
})();