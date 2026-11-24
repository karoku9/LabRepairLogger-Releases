"use strict";
(() => {
  const byId = id => document.getElementById(id);
  const validId = id => typeof id === "string" && /^[A-Za-z0-9_.-]{1,128}$/.test(id);
  const licenses = new Map();
  const selection = byId("licenseSelect");
  const message = byId("licenseMessage");
  function pickLicense() {
    const record = licenses.get(selection.value);
    const detail = byId("licenseDetails");
    detail.hidden = !record;
    detail.textContent = record ? "Dati dichiarati nel file (firma non verificata)\nGenerazione: " + record.Generation + " · Stato: " + record.Disposition + "\nScadenza: " + record.ExpiresAtUtc + " · Dispositivi: " + record.DeviceWhitelist.length : "";
  }
  selection.addEventListener("change", pickLicense);
  byId("licenseFiles").addEventListener("change", async event => {
    const files = Array.from(event.target.files || []).slice(0,100);
    let rejected = 0;
    for (const file of files) {
      try {
        if (file.size < 2 || file.size > 65536) throw new Error();
        const envelope = JSON.parse(await file.text());
        if (!envelope || typeof envelope.Payload !== "string" || envelope.Payload.length > 32768 ||
          typeof envelope.IssuerSignature !== "string" || typeof envelope.CustomerSignature !== "string") throw new Error();
        const payload = JSON.parse(new TextDecoder("utf-8", {fatal:true}).decode(Uint8Array.from(atob(envelope.Payload), c => c.charCodeAt(0))));
        if (!payload || payload.Version !== 1 || payload.Product !== "LabRepairLogger.Desktop/v1" || !validId(payload.LicenseId) ||
          !Number.isSafeInteger(payload.Generation) || payload.Generation < 1 ||
          !["Active","Revoked"].includes(payload.Disposition) ||
          typeof payload.ExpiresAtUtc !== "string" || !Number.isFinite(Date.parse(payload.ExpiresAtUtc)) ||
          !Array.isArray(payload.DeviceWhitelist) || payload.DeviceWhitelist.length < 1 || payload.DeviceWhitelist.length > 128) throw new Error();
        const old = licenses.get(payload.LicenseId);
        if (!old || payload.Generation > old.Generation) licenses.set(payload.LicenseId, payload);
      } catch { rejected++; }
    }
    selection.replaceChildren(new Option(licenses.size ? "Scegli una licenza" : "Nessuna licenza caricata",""));
    for (const [key, item] of [...licenses].sort(([a],[b]) => a.localeCompare(b))) selection.add(new Option(key + " · gen. " + item.Generation,key));
    selection.disabled = !licenses.size;
    if (licenses.size === 1) { selection.value = licenses.keys().next().value; pickLicense(); }
    message.textContent = licenses.size + " licenze lette localmente; " + rejected + " file ignorati. Firma non verificata. Nessun file inviato.";
    event.target.value = "";
  });
  async function refresh() {
    const btn = byId("refreshRelease");
    btn.disabled = true;
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(),7000);
    try {
      const r = await fetch("https://api.github.com/repos/karoku9/LabRepairLogger-Releases/releases?per_page=20",{signal:controller.signal,headers:{Accept:"application/vnd.github+json"}});
      if (!r.ok) throw new Error();
      const releases = await r.json();
      if (!Array.isArray(releases)) throw new Error();
      const list = releases.filter(x => x && !x.draft && x.prerelease && /^nightly-v\d{4}\.\d{2}\.\d{2}\.\d+$/.test(x.tag_name) && Array.isArray(x.assets) && x.assets.some(a => a.name === "client-update.json") && x.assets.some(a => a.name === "LRL-Nightly-Client-" + x.tag_name.slice(9) + "-win-x64.zip"));
      list.sort((a,b) => {const x=a.tag_name.slice(9).split(".").map(Number),y=b.tag_name.slice(9).split(".").map(Number);for(let i=0;i<4;i++) if(x[i]!==y[i])return y[i]-x[i];return 0;});
      const latest = list[0];
      byId("releaseVersion").textContent = latest ? latest.tag_name.slice(9) : "Nessuna release completa";
      byId("releaseDate").textContent = latest && latest.published_at ? new Date(latest.published_at).toLocaleString("it-IT",{dateStyle:"medium"}) : "Controlla GitHub";
      byId("releaseLink").href = "https://github.com/karoku9/LabRepairLogger-Releases/releases" + (latest ? "/tag/" + encodeURIComponent(latest.tag_name) : "");
    } catch { byId("releaseVersion").textContent = "Stato non disponibile"; byId("releaseDate").textContent = "Riprova o apri GitHub"; }
    finally {clearTimeout(deadline);btn.disabled=false;}
  }
  byId("refreshRelease").addEventListener("click",refresh);
  refresh();
})();