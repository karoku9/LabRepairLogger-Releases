"use strict";
(() => {
  const repo = "karoku9/LabRepairLogger";
  const actionField = document.getElementById("licenseAction");
  const durationField = document.getElementById("licenseDuration");
  actionField.addEventListener("change", () => {
    durationField.disabled = actionField.value === "Revocare";
  });
  document.getElementById("licenseForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const action = actionField.value;
    const reference = document.getElementById("licenseReference").value.trim();
    const duration = durationField.disabled ? "Non applicabile" : durationField.value;
    const note = document.getElementById("licenseNote").value.trim();
    if (!reference || reference.length > 90 || !["Emettere", "Rinnovare", "Revocare"].includes(action)) return;
    const title = "[LicenseAdmin] " + action + " · " + reference;
    const body = "Richiesta amministrativa da LRL Control Center.\\n\\nOperazione: " + action + "\\nRiferimento interno: " + reference + "\\nDurata: " + duration + "\\nNote: " + (note || "Nessuna") + "\\n\\nNON è una licenza firmata. L'operatore deve verificare l'autorizzazione e usare il sistema privato di emissione. Non inserire segreti.";
    const params = new URLSearchParams({title, body: body.replaceAll("\\n", "\n")});
    window.open("https://github.com/" + repo + "/issues/new?" + params.toString(), "_blank", "noopener,noreferrer");
  });
  const releaseVersion = document.getElementById("releaseVersion");
  const releaseStatus = document.getElementById("releaseStatus");
  const releaseDate = document.getElementById("releaseDate");
  const link = document.getElementById("releaseLink");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  fetch("https://api.github.com/repos/karoku9/LabRepairLogger-Releases/releases?per_page=10",
        {headers: {"Accept": "application/vnd.github+json"}, signal: controller.signal})
    .then(response => { if (!response.ok) throw new Error("GitHub"); return response.json(); })
    .then(releases => {
      if (!Array.isArray(releases)) throw new Error("Unexpected GitHub API response");
      const nightly = releases.find(r => r && !r.draft && r.prerelease && typeof r.tag_name === "string" && /^nightly-v\d{4}\.\d{2}\.\d{2}\.\d+$/.test(r.tag_name));
      if (!nightly) { releaseVersion.textContent = "Nessuna Nightly"; releaseStatus.textContent = "Non disponibile"; releaseDate.textContent = "Apri GitHub per verificare"; return; }
      releaseVersion.textContent = nightly.tag_name.replace("nightly-v", "v");
      releaseStatus.textContent = "Canale aggiornamenti online";
      releaseDate.textContent = nightly.published_at ? "Pubblicata: " + new Date(nightly.published_at).toLocaleString("it-IT", {dateStyle:"medium"}) : "Disponibile su GitHub";
      link.href = "https://github.com/karoku9/LabRepairLogger-Releases/releases/tag/" + encodeURIComponent(nightly.tag_name);
    })
    .catch(() => { releaseVersion.textContent = "GitHub non disponibile"; releaseStatus.textContent = "Stato non verificato"; releaseDate.textContent = "Usa il collegamento alla repository"; })
    .finally(() => clearTimeout(timeout));
})();