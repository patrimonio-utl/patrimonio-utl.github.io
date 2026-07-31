const safeText = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const normalise = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const catalogKey = document.body.dataset.catalog;
const allCategories = window.PATRIMONIO_CATALOG?.[catalogKey] || [];
const sectionsTarget = document.getElementById("catalogSections");
const jumpTarget = document.getElementById("categoryJump");
const params = new URLSearchParams(window.location.search);
const originFilter = catalogKey === "cartas-patrimoniais" ? params.get("origem") : null;

function filteredCategories() {
  if (!originFilter) return allCategories;
  return allCategories
    .map(category => ({ ...category, items: category.items.filter(item => item.origin === originFilter) }))
    .filter(category => category.items.length > 0);
}

function availabilityNote(item) {
  if (!item.onlineOnly) return "";
  return `<span class="availability-note">${safeText(item.availabilityNote || "Disponível apenas para consulta online.")}</span>`;
}

function actionButtons(item) {
  const isLinksPage = catalogKey === "ligacoes";
  const view = item.viewUrl || item.externalUrl || item.url || "";
  const download = item.downloadUrl || "";
  const viewLabel = item.viewLabel || item.externalLabel || (item.onlineOnly ? "Consultar online" : "Consultar documento");
  const downloadLabel = item.downloadLabel || "Transferir documento";

  if (isLinksPage && item.externalUrl) {
    return `<a class="document-action external" href="${safeText(item.externalUrl)}" target="_blank" rel="noopener">${safeText(item.externalLabel || "Abrir site")}</a>`;
  }

  const viewButton = view
    ? `<a class="document-action view" href="${safeText(view)}" target="_blank" rel="noopener">${safeText(viewLabel)}</a>`
    : `<button class="document-action view disabled" type="button" disabled>${safeText(viewLabel)}</button>`;

  if (item.onlineOnly) return viewButton + availabilityNote(item);

  const downloadButton = download
    ? `<a class="document-action download" href="${safeText(download)}" target="_blank" rel="noopener">${safeText(downloadLabel)}</a>`
    : `<button class="document-action download disabled" type="button" disabled>${safeText(downloadLabel)}</button>`;

  return viewButton + downloadButton;
}

function documentTemplate(item) {
  const search = normalise([item.title, item.description].filter(Boolean).join(" "));
  return `<li class="document-item searchable-document" data-search="${safeText(search)}"><div class="document-link"><span class="document-icon" aria-hidden="true">${safeText(item.iconLabel || (item.externalUrl ? "LINK" : "PDF"))}</span><span class="document-copy"><span class="document-title">${safeText(item.title)}</span>${item.description ? `<span class="document-description">${safeText(item.description)}</span>` : ""}<span class="document-actions">${actionButtons(item)}</span></span></div></li>`;
}

function countRecords(categories) {
  const seen = new Set();
  let count = 0;
  categories.forEach(category => category.items.forEach(item => {
    const id = item.recordId || normalise(item.title);
    if (seen.has(id)) return;
    seen.add(id);
    count += Number(item.recordCount || 1);
  }));
  return count;
}

function renderCatalog() {
  if (!sectionsTarget) return;
  const categories = filteredCategories();
  if (jumpTarget) jumpTarget.innerHTML = `<ul>${categories.map((category,index)=>`<li><a href="#${safeText(category.id)}">${safeText(category.title)}<span>${String(index+1).padStart(2,"0")}</span></a></li>`).join("")}</ul>`;
  const linksPage = catalogKey === "ligacoes";
  sectionsTarget.innerHTML = categories.map((category,index)=>`<section class="document-section reveal${linksPage ? " links-section" : ""}" id="${safeText(category.id)}"><div class="document-section-heading"><div>${linksPage ? "" : `<p class="eyebrow">Categoria ${String(index+1).padStart(2,"0")}</p>`}<h2>${safeText(category.title)}</h2></div><span class="count-badge">${category.items.length}</span></div>${category.intro?`<p class="category-intro">${safeText(category.intro)}</p>`:""}${category.items.length?`<ul class="document-list">${category.items.map(documentTemplate).join("")}</ul>`:`<div class="empty-category"><strong>Conteúdos em preparação</strong><p>Esta categoria será preenchida assim que os respetivos conteúdos forem adicionados.</p></div>`}</section>`).join("");
  const count = countRecords(categories);
  const countEl = document.getElementById("catalogCount");
  if (countEl) countEl.textContent = count === 1 ? "1 registo disponível" : `${count} registos disponíveis`;
  bindRevealElements();
}

const form = document.getElementById("catalogSearchForm");
const input = document.getElementById("catalogSearch");
const meta = document.getElementById("catalogSearchMeta");
function searchCatalog(){
  const term=normalise(input?.value.trim());
  let visible=0;
  document.querySelectorAll(".searchable-document").forEach(el=>{const show=!term||el.dataset.search.includes(term);el.hidden=!show;if(show)visible++});
  document.querySelectorAll(".document-section").forEach(section=>{const any=[...section.querySelectorAll(".searchable-document")].some(el=>!el.hidden);section.hidden=!!term&&!any});
  if(meta)meta.textContent=term?`${visible} resultado${visible===1?"":"s"} encontrado${visible===1?"":"s"}.`:"";
}
form?.addEventListener("submit",e=>{e.preventDefault();searchCatalog()});
input?.addEventListener("search",()=>{if(!input.value)searchCatalog()});

const menuToggle=document.getElementById("menuToggle"),mainNav=document.getElementById("mainNav"),acervoDropdown=document.getElementById("acervoDropdown"),acervoToggle=document.getElementById("acervoToggle");
menuToggle?.addEventListener("click",()=>{const open=menuToggle.getAttribute("aria-expanded")==="true";menuToggle.setAttribute("aria-expanded",String(!open));mainNav.classList.toggle("open",!open)});
acervoToggle?.addEventListener("click",e=>{e.stopPropagation();const open=acervoDropdown.classList.toggle("open");acervoToggle.setAttribute("aria-expanded",String(open))});
document.addEventListener("click",e=>{if(acervoDropdown&&!acervoDropdown.contains(e.target)){acervoDropdown.classList.remove("open");acervoToggle.setAttribute("aria-expanded","false")}});

let observer;
function bindRevealElements(){if(!("IntersectionObserver" in window)){document.querySelectorAll(".reveal").forEach(el=>el.classList.add("is-visible"));return}if(!observer)observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target)}}),{threshold:.1});document.querySelectorAll(".reveal:not(.is-visible)").forEach(el=>observer.observe(el))}
renderCatalog();
