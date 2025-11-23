// script.js — portfolio project renderer (Kaggle + local + GitHub + UI)
// Safe, defensive, and includes Kaggle items you provided.

const GITHUB_USER = 'umeshrai01'; // change if needed
const projectsList = document.getElementById('projectsList');
const kaggleGrid = document.getElementById('kaggleGrid');
const refreshBtn = document.getElementById('refreshProjects');
const addBtn = document.getElementById('openAddProject');
const addPanel = document.getElementById('addProjectPanel');
const addForm = document.getElementById('addProjectForm');
const closeAdd = document.getElementById('closeAdd');
const cancelAdd = document.getElementById('cancelAdd');

const modal = document.getElementById('projectModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

const darkToggle = document.getElementById('darkModeToggle');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

try {
  if (document.getElementById('year')) {
    document.getElementById('year').innerText = new Date().getFullYear();
  }
} catch (e) {
  console.warn('Year element not found', e);
}

// local storage keys
const LS_PROJECTS = 'local_projects_v1';
const LS_DARK = 'site_dark_v1';

// ----------------------
// Pre-populated Kaggle Projects (your links + descriptions)
const KAGGLE_PROJECTS = [
  {
    title: "House Price Prediction",
    subtitle: "Regression, Feature Engineering",
    description: "Predicts house sale prices with careful EDA, feature engineering and ensemble models. Uses the House Prices dataset and stacking of tree-based regressors for improved accuracy.",
    link: "https://www.kaggle.com/code/umeshkumarrai123/house-price-prediction",
    img: ""
  },
  {
    title: "Spaceship Titanic Project",
    subtitle: "Classification, Feature Engineering",
    description: "Solves the Spaceship Titanic challenge with preprocessing, categorical encoding, and gradient boosting models to predict transportations.",
    link: "https://www.kaggle.com/code/umeshkumarrai123/spaceship-titanic-project",
    img: ""
  },
  {
    title: "Sentiment Analysis with Neural Networks",
    subtitle: "NLP, Deep Learning",
    description: "Performs sentiment classification using neural networks: tokenization, embeddings and an LSTM/CNN-based model to classify sentiment from text data.",
    link: "https://www.kaggle.com/code/umeshkumarrai123/sentiment-analysis-with-neural-networks/",
    img: ""
  },
  {
    title: "MNIST Digit Recognition",
    subtitle: "Computer Vision, CNN",
    description: "Classic digit recognition on MNIST — preprocesses 28x28 images, trains a convolutional neural network and evaluates high-accuracy results.",
    link: "https://www.kaggle.com/code/umeshkumarrai123/mnist-digit-recognition",
    img: ""
  },
  {
    title: "NYC Taxi Trip Duration",
    subtitle: "Regression, Geo features",
    description: "Predicts taxi trip duration by extracting geospatial features (haversine distance), time features, and training boosted tree models with robust validation.",
    link: "https://www.kaggle.com/code/umeshkumarrai123/nyc-taxi-trip-duration",
    img: ""
  },
  {
    title: "Titanic Classification Project",
    subtitle: "Classification, Feature Engineering",
    description: "A beginner-friendly Kaggle solution for Titanic survival prediction: feature extraction, encoding, and training classification models like Random Forest and Logistic Regression.",
    link: "https://www.kaggle.com/code/umeshkumarrai123/titanic-classification-project",
    img: ""
  }
];

// small utility
function qs(sel){ try { return document.querySelector(sel); } catch(e){ return null; } }
function qsa(sel){ try { return Array.from(document.querySelectorAll(sel)); } catch(e){ return []; } }

// Toggle dark mode
function applyDark(isDark){
  try {
    if(isDark){ document.body.classList.add('dark'); if(darkToggle) darkToggle.textContent = '☀️'; }
    else { document.body.classList.remove('dark'); if(darkToggle) darkToggle.textContent = '🌙'; }
    localStorage.setItem(LS_DARK, isDark ? '1' : '0');
  } catch(e){ console.warn('applyDark failed', e); }
}
if (darkToggle) {
  darkToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark');
    applyDark(isDark);
  });
}
try { applyDark(localStorage.getItem(LS_DARK) === '1'); } catch(e){}

/* Mobile burger nav */
if (burger) {
  burger.addEventListener('click', () => {
    try {
      const open = navLinks && navLinks.style && navLinks.style.display === 'flex';
      if (navLinks) navLinks.style.display = open ? 'none' : 'flex';
      burger.setAttribute('aria-expanded', String(!open));
    } catch (e) { console.warn(e); }
  });
}

// Local projects helpers
function getLocalProjects(){
  try{
    const raw = localStorage.getItem(LS_PROJECTS);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ console.warn('getLocalProjects', e); return [] }
}
function saveLocalProjects(list){
  try { localStorage.setItem(LS_PROJECTS, JSON.stringify(list || [])); } catch(e){ console.warn('saveLocalProjects', e); }
}

// Render card
function createProjectCard(p, source='local'){
  const card = document.createElement('article');
  card.className = 'project-card';
  const subtitleHtml = p.subtitle ? `<p class="muted">${escapeHtml(p.subtitle)}</p>` : '';
  const desc = p.description ? escapeHtml(p.description) : '';
  card.innerHTML = `
    <h3>${escapeHtml(p.title)}</h3>
    ${subtitleHtml}
    <p>${desc}</p>
    <div class="project-footer">
      ${p.link ? `<a class="link" href="${escapeAttr(p.link)}" target="_blank" rel="noopener">Open</a>` : ''}
      <button class="btn small" data-action="details">Details</button>
      <span class="hint">${escapeHtml(source)}</span>
    </div>
  `;
  const btn = card.querySelector('[data-action="details"]');
  if (btn) btn.addEventListener('click', () => openProjectModal(p));
  return card;
}

// Safe escaping helpers
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];}); }
function escapeAttr(s){ return escapeHtml(s); }

// Modal open/close
function openProjectModal(p){
  try{
    modalBody.innerHTML = `
      <h2>${escapeHtml(p.title)}</h2>
      ${p.subtitle ? `<h4 class="muted">${escapeHtml(p.subtitle)}</h4>` : ''}
      <p>${escapeHtml(p.description || '')}</p>
      ${p.img ? `<img src="${escapeAttr(p.img)}" alt="${escapeHtml(p.title)}" style="width:100%;border-radius:8px;margin-top:8px">` : ''}
      ${p.link ? `<p style="margin-top:.8rem"><a href="${escapeAttr(p.link)}" target="_blank" rel="noopener" class="link">Open project</a></p>` : ''}
    `;
    modal.setAttribute('aria-hidden','false');
  }catch(e){ console.error('openProjectModal', e); }
}
if (closeModal) closeModal.addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));

// // Add Project panel handlers
// if (addBtn) addBtn.addEventListener('click', ()=> addPanel.setAttribute('aria-hidden','false'));
// if (closeAdd) closeAdd.addEventListener('click', ()=> addPanel.setAttribute('aria-hidden','true'));
// if (cancelAdd) cancelAdd.addEventListener('click', ()=> addPanel.setAttribute('aria-hidden','true'));

// if (addForm){
//   addForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     try {
//       const p = {
//         title: document.getElementById('pTitle').value.trim(),
//         subtitle: document.getElementById('pSubtitle').value.trim(),
//         description: document.getElementById('pDesc').value.trim(),
//         link: document.getElementById('pLink').value.trim(),
//         img: document.getElementById('pImg').value.trim()
//       };
//       const list = getLocalProjects(); list.unshift(p); saveLocalProjects(list);
//       addPanel.setAttribute('aria-hidden','true'); addForm.reset(); renderAll();
//     } catch(err){ console.warn('addForm submit', err); }
//   });
// }

// Fetch GitHub repos + README fallback
async function fetchGitHubProjects(username, limit=6){
  try{
    if(!window.axios){
      console.warn('axios not loaded — skipping GitHub fetch');
      return [];
    }
    const res = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`);
    if(!res.data || !Array.isArray(res.data)) return [];
    const repoList = res.data.filter(r => !r.fork).slice(0, limit);

    function cleanMarkdown(text){
      if(!text) return '';
      let s = text.replace(/```[\s\S]*?```/g, '');
      s = s.replace(/`([^`]*)`/g, '$1');
      s = s.replace(/!\[.*?\]\(.*?\)/g, '');
      s = s.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      s = s.replace(/^#+\s*/gm, '');
      s = s.replace(/<\/?[^>]+(>|$)/g, '');
      s = s.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
      return s;
    }
    function firstParagraph(text){
      if(!text) return '';
      const cleaned = cleanMarkdown(text);
      const parts = cleaned.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
      for(const p of parts){
        if(p.length >= 30 && !/license|toc|table of contents|usage/i.test(p)) return p;
      }
      return parts[0] || '';
    }

    const projects = [];
    const cache = {};

    for(const r of repoList){
      let desc = r.description && r.description.trim() ? r.description.trim() : '';
      if(!desc){
        try {
          if(cache[r.name]) desc = cache[r.name];
          else {
            const readmeRes = await axios.get(`https://api.github.com/repos/${username}/${r.name}/readme`, { headers: { Accept: 'application/vnd.github.v3+json' } });
            if(readmeRes && readmeRes.data && readmeRes.data.content){
              const b64 = readmeRes.data.content.replace(/\s/g,'');
              let decoded = '';
              try{ decoded = decodeURIComponent(escape(atob(b64))); }catch(e){ try{ decoded = atob(b64); }catch(_){} }
              const candidate = firstParagraph(decoded);
              if(candidate) desc = candidate;
              cache[r.name] = desc;
            }
          }
        } catch(err){ /* ignore per-repo failures */ }
      }
      if(!desc) desc = 'No description provided. Consider adding a short repo description or a README first paragraph.';
      projects.push({ title: r.name, subtitle: r.language || '', description: desc, link: r.html_url, img: '' });
    }
    return projects;
  }catch(err){
    console.warn('GitHub fetch failed', err && err.message);
    return [];
  }
}

// Render Kaggle
function renderKaggle(){
  try {
    if(!kaggleGrid) return;
    kaggleGrid.innerHTML = '';
    KAGGLE_PROJECTS.forEach(p => kaggleGrid.appendChild(createProjectCard(p, 'kaggle')));
  } catch(e){ console.warn('renderKaggle', e); }
}

// Render all projects (Kaggle -> local -> GitHub)
async function renderAll(){
  try {
    if(!projectsList) return;
    projectsList.innerHTML = `<div class="project-card"><p>Loading projects…</p></div>`;
    const [ghProjects, localProjects] = await Promise.all([ fetchGitHubProjects(GITHUB_USER, 6).catch(()=>[]), Promise.resolve(getLocalProjects()) ]);
    const cards = [];

    // kaggle first
    KAGGLE_PROJECTS.forEach(p => cards.push({p, source:'kaggle'}));
    // local next
    if(localProjects && localProjects.length) localProjects.forEach(p => cards.push({p, source:'local'}));
    // github next
    if(ghProjects && ghProjects.length) ghProjects.forEach(p => cards.push({p, source:'github'}));

    if(cards.length === 0){
      cards.push({ p: { title: "No projects found", subtitle: "", description: "Add projects using the Add Project button or make your GitHub repos public with README descriptions.", link: "#", img: "" }, source:'info' });
    }

    projectsList.innerHTML = '';
    cards.forEach(item => projectsList.appendChild(createProjectCard(item.p, item.source)));
    renderKaggle();
  } catch(err){
    console.error('renderAll failed', err);
    if(projectsList) projectsList.innerHTML = `<div class="project-card"><p>Unable to load projects. See console for details.</p></div>`;
  }
}

// refresh button
if (refreshBtn) refreshBtn.addEventListener('click', ()=> renderAll());

// init
renderAll();

// reveal animations on scroll
function reveal(){
  qsa('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight - 60){ el.classList.add('show'); }
  });
}
window.addEventListener('scroll', reveal);
window.addEventListener('resize', reveal);
document.addEventListener('DOMContentLoaded', reveal);

// accessibility: close modals with escape
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){
    try { if(modal) modal.setAttribute('aria-hidden','true'); if(addPanel) addPanel.setAttribute('aria-hidden','true'); } catch(e){}
  }
});
