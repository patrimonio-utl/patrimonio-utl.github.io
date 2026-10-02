/* Dados e ações da página de entrada são gerados a partir de catalog-data.js. */
const DATA = window.PATRIMONIO_CATALOG || {};
const LOCAL_HERO_COUNT = 45;
const HERO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const HERO_DIRECTORIES = ["assets/fotos-capa", "assets"];
const fallbackHeroPhotos = [
  "https://images.unsplash.com/photo-1762881779361-f6e70aa0340f?auto=format&fit=crop&fm=jpg&q=86&w=2200",
  "https://images.unsplash.com/photo-1761131706401-14bea90b8cda?auto=format&fit=crop&fm=jpg&q=86&w=2200",
  "https://images.unsplash.com/photo-1745531682477-b01ec21061d0?auto=format&fit=crop&fm=jpg&q=86&w=2200"
];
const home = DATA.home || {};
const sessions = DATA.aulas || [];
const arrowSvg = '<svg class="arrow" viewBox="0 0 10 17" aria-hidden="true"><path d="M1.25 16.08a1.25 1.25 0 0 1-.88-2.13l5.91-5.91L.37 2.14A1.25 1.25 0 0 1 2.14.37l6.79 6.79a1.25 1.25 0 0 1 0 1.77l-6.79 6.79c-.24.24-.56.36-.89.36Z" fill="currentColor"/></svg>';
const safeText = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const normalise = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const shuffle = values => [...values].sort(() => Math.random() - 0.5);
const imageLoads = source => new Promise(resolve => { const image = new Image(); image.onload = () => resolve(source); image.onerror = () => resolve(null); image.src = source; });

async function setRandomHeroPhoto() {
  const hero = document.getElementById("inicio");
  if (!hero) return;
  hero.style.backgroundImage = `url("${shuffle(fallbackHeroPhotos)[0]}")`;
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem("patrimonioHeroRecent") || "[]"); } catch { recent = []; }
  const indices = shuffle(Array.from({ length: LOCAL_HERO_COUNT }, (_, i) => i + 1));
  const preferred = indices.filter(n => !recent.some(path => path.includes(`capa-${String(n).padStart(2, "0")}.`)));
  const order = [...preferred, ...indices.filter(n => !preferred.includes(n))];
  for (const number of order) {
    const base = `capa-${String(number).padStart(2, "0")}`;
    const candidates = HERO_DIRECTORIES.flatMap(directory => HERO_EXTENSIONS.map(extension => `${directory}/${base}.${extension}`));
    for (const candidate of candidates) {
      const source = await imageLoads(candidate);
      if (!source) continue;
      hero.style.backgroundImage = `url("${source.replace(/"/g, '\\"')}")`;
      const nextRecent = [source, ...recent.filter(item => item !== source)].slice(0, 8);
      try { localStorage.setItem("patrimonioHeroRecent", JSON.stringify(nextRecent)); } catch {}
      return;
    }
  }
}

function categorySearchText(item) {
  const key = item.catalogKey;
  if (!key || !Array.isArray(DATA[key])) return "";
  let categories = DATA[key];
  if (item.categoryId) categories = categories.filter(category => category.id === item.categoryId);
  const entries = categories.flatMap(category => category.items || []).filter(entry => !item.origin || entry.origin === item.origin);
  return entries.map(entry => `${entry.title || ""} ${entry.description || ""}`).join(" ");
}

function cardTemplate(item) {
  const images = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
  const search = normalise([item.title, item.description, categorySearchText(item)].filter(Boolean).join(" "));
  const media = images.length ? `<div class="card-media"><img data-card-images="${safeText(images.join("||"))}" alt="" loading="lazy"></div>` : "";
  return `<li class="card reveal searchable-item" data-search="${safeText(search)}"><a class="card-link" href="${safeText(item.href || "#")}">${media}<div class="card-content"><div class="card-title-row"><h3 class="card-title">${safeText(item.title)}</h3>${arrowSvg}</div><p class="card-description">${safeText(item.description)}</p></div></a></li>`;
}

function bindCardImages(target) {
  target.querySelectorAll("img[data-card-images]").forEach(img => {
    const candidates = (img.dataset.cardImages || "").split("||").filter(Boolean);
    let index = 0;
    const tryNext = () => {
      if (index >= candidates.length) {
        img.closest(".card-media")?.classList.add("image-missing");
        img.remove();
        return;
      }
      img.src = candidates[index++];
    };
    img.addEventListener("error", tryNext);
    tryNext();
  });
}

function renderCards(targetId, items) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = (items || []).map(cardTemplate).join("");
  bindCardImages(target);
}
renderCards("legislationGrid", home.legislacao);
renderCards("technicalGrid", home["documentos-tecnicos"]);
renderCards("bibliographyGrid", home.bibliografia);
renderCards("chartersGrid", home["cartas-patrimoniais"]);
renderCards("mediaGrid", home.multimedia);

/* Contagem automática: documentos, bibliografia, cartas, multimédia e aulas disponíveis; Ligações excluídas. */
function countGlobalRecords() {
  const config = DATA.countConfig || {};
  const catalogs = config.catalogs || ["legislacao", "documentos-tecnicos", "bibliografia", "cartas-patrimoniais", "multimedia"];
  let total = 0;
  catalogs.forEach(key => {
    const seen = new Set();
    (DATA[key] || []).forEach(category => (category.items || []).forEach(item => {
      const id = item.recordId || normalise(item.title);
      if (seen.has(id)) return;
      seen.add(id);
      total += Number(item.recordCount || 1);
    }));
  });
  const sessionsKey = config.sessionsKey || "aulas";
  total += (DATA[sessionsKey] || []).filter(session => session.status === "disponivel" || session.viewUrl || session.downloadUrl).length;
  return total;
}

function animateGlobalCount() {
  const valueEl = document.getElementById("globalRecordCount");
  const phraseEl = document.getElementById("globalRecordPhrase");
  if (!valueEl || !phraseEl) return;
  const total = countGlobalRecords();
  const duration = Number(DATA.countConfig?.animationDurationMs || 2000);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const setText = value => {
    valueEl.textContent = String(value);
    phraseEl.textContent = value === 1 ? "registo disponível para consulta e transferência" : "registos disponíveis para consulta e transferência";
  };
  if (reduced || duration <= 0) { setText(total); return; }
  const start = performance.now();
  const tick = now => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    setText(Math.round(total * eased));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* Menu */
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const acervoDropdown = document.getElementById("acervoDropdown");
const acervoToggle = document.getElementById("acervoToggle");
menuToggle?.addEventListener("click", () => { const open = menuToggle.getAttribute("aria-expanded") === "true"; menuToggle.setAttribute("aria-expanded", String(!open)); mainNav.classList.toggle("open", !open); });
acervoToggle?.addEventListener("click", event => { event.stopPropagation(); const open = acervoDropdown.classList.toggle("open"); acervoToggle.setAttribute("aria-expanded", String(open)); });
document.addEventListener("click", event => { if (acervoDropdown && !acervoDropdown.contains(event.target)) { acervoDropdown.classList.remove("open"); acervoToggle.setAttribute("aria-expanded", "false"); } });
mainNav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => { menuToggle.setAttribute("aria-expanded", "false"); mainNav.classList.remove("open"); acervoDropdown.classList.remove("open"); acervoToggle.setAttribute("aria-expanded", "false"); }));

/* Diálogo */
const dialog = document.getElementById("infoDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");
function openDialog(title, text) { dialogTitle.textContent = title; dialogText.innerHTML = text; dialog.classList.add("open"); document.getElementById("dialogClose")?.focus(); }
function closeDialog() { dialog.classList.remove("open"); }
document.getElementById("dialogClose")?.addEventListener("click", closeDialog);
dialog?.addEventListener("click", event => { if (event.target === dialog) closeDialog(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeDialog(); });

/* Aulas */
const sessionsGrid = document.getElementById("sessionsGrid");
const previousSessions = document.getElementById("previousSessions");
const nextSessions = document.getElementById("nextSessions");
const pageStatus = document.getElementById("pageStatus");
const showAvailableSessions = document.getElementById("showAvailableSessions");
const sessionsEmpty = document.getElementById("sessionsEmpty");
const pageSize = 8;
let sessionPage = 0;
let sessionMode = "paged";
let activeSearchTerm = "";
function sessionTemplate(item) {
  const available = item.status === "disponivel" || item.viewUrl || item.downloadUrl;
  const search = normalise(`sessao ${item.number} ${item.date} ${item.title} aulas apresentacoes`);
  const actions = available ? `<span class="session-actions">${item.viewUrl ? `<a class="session-action view" href="${safeText(item.viewUrl)}" target="_blank" rel="noopener">Consultar apresentação</a>` : ""}${item.downloadUrl ? `<a class="session-action download" href="${safeText(item.downloadUrl)}" target="_blank" rel="noopener">Transferir apresentação</a>` : ""}</span>` : "";
  const body = `<div><span class="session-date">${safeText(item.date)}</span><h3>Sessão ${String(item.number).padStart(2, "0")}</h3><p>${safeText(item.title)}</p>${actions}</div>${available ? `<span class="session-arrow">${arrowSvg}</span>` : ""}`;
  return `<article class="session-card searchable-item" data-search="${safeText(search)}"><div class="session-card-static">${body}</div></article>`;
}
function getSessionItems() { if (activeSearchTerm) return sessions.filter(item => normalise(`sessao ${item.number} ${item.date} ${item.title}`).includes(activeSearchTerm)); if (sessionMode === "available") return sessions.filter(item => item.status === "disponivel" || item.viewUrl || item.downloadUrl); return sessions; }
function renderSessions() {
  if (!sessionsGrid) return;
  const items = getSessionItems();
  let visibleItems = items;
  if (!activeSearchTerm && sessionMode === "paged") visibleItems = items.slice(sessionPage * pageSize, sessionPage * pageSize + pageSize);
  sessionsGrid.innerHTML = visibleItems.map(sessionTemplate).join("");
  sessionsEmpty?.classList.toggle("show", visibleItems.length === 0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (previousSessions) previousSessions.disabled = !!activeSearchTerm || sessionMode !== "paged" || sessionPage === 0;
  if (nextSessions) nextSessions.disabled = !!activeSearchTerm || sessionMode !== "paged" || sessionPage >= totalPages - 1;
  if (pageStatus) {
    if (activeSearchTerm) pageStatus.textContent = `${items.length} aula${items.length === 1 ? "" : "s"} encontrada${items.length === 1 ? "" : "s"}`;
    else if (sessionMode === "available") pageStatus.textContent = items.length === 1 ? "1 aula disponível" : `${items.length} aulas disponíveis`;
    else { const first = items.length ? sessionPage * pageSize + 1 : 0; const last = Math.min((sessionPage + 1) * pageSize, items.length); pageStatus.textContent = `Sessões ${first}–${last} de ${items.length}`; }
  }
  if (showAvailableSessions) showAvailableSessions.textContent = sessionMode === "available" ? "Voltar à navegação por sessões" : "Mostrar todas as aulas disponíveis";
  bindRevealElements();
}
previousSessions?.addEventListener("click", () => { if (sessionPage > 0) { sessionPage--; renderSessions(); } });
nextSessions?.addEventListener("click", () => { const totalPages = Math.ceil(sessions.length / pageSize); if (sessionPage < totalPages - 1) { sessionPage++; renderSessions(); } });
showAvailableSessions?.addEventListener("click", () => { sessionMode = sessionMode === "available" ? "paged" : "available"; sessionPage = 0; renderSessions(); });

/* Pesquisa */
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("siteSearch");
const searchMeta = document.getElementById("searchMeta");
function applySearch() {
  const term = normalise(searchInput?.value.trim());
  activeSearchTerm = term;
  let visible = 0;
  document.querySelectorAll(".card.searchable-item").forEach(item => { const show = !term || item.dataset.search.includes(term); item.hidden = !show; if (show) visible++; });
  renderSessions();
  visible += getSessionItems().length;
  if (searchMeta) searchMeta.textContent = term ? `${visible} resultado${visible === 1 ? "" : "s"} encontrado${visible === 1 ? "" : "s"}.` : "";
}
searchForm?.addEventListener("submit", event => { event.preventDefault(); applySearch(); });
searchInput?.addEventListener("search", () => { if (!searchInput.value) applySearch(); });

/* Favoritos e instalação */
document.getElementById("favoriteButton")?.addEventListener("click", () => { const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); openDialog("Adicionar aos favoritos", mobile ? "Abra o menu do navegador e escolha <strong>Adicionar aos favoritos</strong>, <strong>Adicionar marcador</strong> ou <strong>Adicionar ao ecrã principal</strong>." : "No Windows, pressione <strong>Ctrl + D</strong>. No Mac, pressione <strong>⌘ + D</strong>."); });
let deferredPrompt = null;
const installButton = document.getElementById("installButton");
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); deferredPrompt = event; });
async function installApp() { if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; return; } const ios = /iPad|iPhone|iPod/.test(navigator.userAgent); openDialog("Instalar no telemóvel", ios ? "No Safari, toque em <strong>Partilhar</strong> e escolha <strong>Adicionar ao ecrã principal</strong>." : "Abra o menu do navegador e escolha <strong>Instalar aplicação</strong> ou <strong>Adicionar ao ecrã principal</strong>. A instalação exige que o site esteja publicado através de HTTPS."); }
installButton?.addEventListener("click", installApp);

/* Animações */
let observer;
function bindRevealElements() { if (!("IntersectionObserver" in window)) { document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible")); return; } if (!observer) observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }); }, { threshold: .1 }); document.querySelectorAll(".reveal:not(.is-visible)").forEach(element => observer.observe(element)); }

setRandomHeroPhoto();
renderSessions();
animateGlobalCount();
bindRevealElements();
if ("serviceWorker" in navigator && location.protocol !== "file:") window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
