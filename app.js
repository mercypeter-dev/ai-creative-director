/* ═══════════════════════════════════════════════════════════
   AI CREATIVE DIRECTOR — Application Logic
   ═══════════════════════════════════════════════════════════ */

'use strict';

// Known retired or legacy Anthropic model identifiers that return 404
const RETIRED_ANTHROPIC_MODELS = [
  'claude-3-5-haiku-latest',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307',
  'claude-3-5-sonnet-latest',
  'claude-3-7-sonnet-latest',
  'claude-3-5-sonnet-20241022'
];

function sanitizeStoredModel(storageKey) {
  const val = localStorage.getItem(storageKey);
  if (val && RETIRED_ANTHROPIC_MODELS.includes(val)) {
    localStorage.removeItem(storageKey);
    return '';
  }
  return val || '';
}

// ── State ───────────────────────────────────────────────────────
const state = {
  apiKey: '',
  currentPage: 'home',
  generationMode: localStorage.getItem('acd_generation_mode') || 'turbo',
  cachedTurboModel: sanitizeStoredModel('acd_cached_turbo_model'),
  cachedDirectorModel: sanitizeStoredModel('acd_cached_director_model'),
  cachedGeminiModel: localStorage.getItem('acd_cached_gemini_model') || '',
  ideaData: {
    idea: '',
    budget: '',
    style: '',
    category: 'birthday',
  },
  brief: null,
  concept: null,
  conversationHistory: [], // For context-aware refinement
  activeClaudeModel: sanitizeStoredModel('acd_active_model'),
  availableAnthropicModels: [],
};

function setGenerationMode(mode) {
  state.generationMode = mode;
  localStorage.setItem('acd_generation_mode', mode);

  const turboBtn = document.getElementById('btn-mode-turbo');
  const directorBtn = document.getElementById('btn-mode-director');
  const badge = document.getElementById('engine-badge');

  if (turboBtn && directorBtn) {
    if (mode === 'turbo') {
      turboBtn.classList.add('active');
      directorBtn.classList.remove('active');
      if (badge) {
        badge.textContent = '⚡ Turbo Mode';
        badge.style.color = 'var(--gold)';
        badge.style.background = 'var(--gold-pale)';
      }
    } else {
      directorBtn.classList.add('active');
      turboBtn.classList.remove('active');
      if (badge) {
        badge.textContent = '✦ Director Mode';
        badge.style.color = 'var(--plum)';
        badge.style.background = 'rgba(74, 44, 89, 0.08)';
      }
    }
  }
}

function updateProgressStage(step) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`load-step-${i}`);
    if (!el) continue;
    const checkEl = el.querySelector('.step-check');
    if (i < step) {
      el.className = 'loading-step-item done';
      if (checkEl) checkEl.textContent = '✓';
    } else if (i === step) {
      el.className = 'loading-step-item active';
      if (checkEl) checkEl.textContent = '✦';
    } else {
      el.className = 'loading-step-item';
      if (checkEl) checkEl.textContent = '○';
    }
  }
}


// ── Suggestions ─────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    idea: "I want to plan a romantic anniversary dinner for two. It should feel intimate, elegant, and thoughtful — not cheesy at all.",
    budget: "₦60,000",
    style: "Intimate, elegant, understated romance",
    category: "romantic",
  },
  {
    idea: "I want to throw a surprise 30th birthday party for my best friend. She loves art, vintage aesthetics, and bold colours. She's the creative type.",
    budget: "₦120,000",
    style: "Vintage art gallery, bold and expressive",
    category: "surprise",
  },
  {
    idea: "I need a concept for an outdoor photoshoot for a small Nigerian fashion brand. The vibe should be moody and editorial — think high fashion meets real life.",
    budget: "Low budget, creative",
    style: "Moody editorial, high fashion",
    category: "photoshoot",
  },
  {
    idea: "I want to host an intimate dinner party for 8 close friends. The vibe should be sophisticated but warm — African-inspired aesthetics with a modern twist.",
    budget: "₦80,000",
    style: "Modern African-inspired, warm and sophisticated",
    category: "gathering",
  },
];

// ── Curated Interactive Showcase Concept ──────────────────────────
const SAMPLE_CONCEPT = {
  conceptName: "Nocturne & Amber: Modern Afro-Editorial Salon",
  tagline: "A sensorial, candlelight-drenched gathering celebrating intimate community, warm terracotta earth tones, and soulful culinary craft.",
  bigIdea: {
    summary: "Transform an ordinary apartment dining space into a transportive, high-touch private salon reminiscent of contemporary Lagos art galleries and Sahelian sunset architecture. The evening is choreographed around low-slung amber illumination, tactile unglazed clayware, artisanal local florals, and a shared family-style tasting menu that invites lingering conversation."
  },
  creativeDirection: {
    vision: "An evening designed to feel less like a rigid dinner party and more like an exclusive creative retreat among confidants. Every sensory touchpoint—from the warmth of unvarnished stoneware to the low hum of acoustic desert blues—reinforces intimacy, cultural pride, and tactile luxury.",
    mood: "Intimate, warm, grounded luxury with an effortless contemporary African editorial sensibility.",
    keyPrinciples: [
      "Tactile Warmth over Commercial Polish",
      "Low Ambient Illumination (No Harsh Overhead Lights)",
      "Cultural Resonance Through Modern Craft & Materials",
      "Communal Unhurried Pacing with Thoughtful Rituals"
    ]
  },
  visualIdentity: {
    colourPalette: [
      { name: "Terracotta Earth", hex: "#C26D53", role: "Primary Base" },
      { name: "Raw Desert Ochre", hex: "#D4A359", role: "Warm Glow" },
      { name: "Deep Charcoal Charcoal", hex: "#231F20", role: "Contrast Anchor" },
      { name: "Bleached Linen", hex: "#F5EFE6", role: "Tactile Neutral" }
    ],
    lighting: "Strictly multi-level candlelight and amber accent lamps placed below eye level. Fluted glass votives, tall hand-dipped beeswax tapers in staggered brass or ceramic holders, and hidden warm-white LED uplighting behind potted foliage to create soft sculptural shadows.",
    textures: "Raw unglazed earthenware, heavily slubbed natural linen tablecloths, dried indigenous grasses (pampas and sorghum stems), brushed aged brass, and hand-torn raw cotton cardstock with deckled edges.",
    styling: "Low organic floral runners running the entire length of the table rather than tall blocking arrangements. Asymmetrical fruit displays of halved pomegranates, figs, and plantain crisps arranged on matte stone platters.",
    references: [
      "Alára Lagos editorial tablescapes",
      "Wabi-sabi West African interior aesthetics",
      "Kinfolk Volume 24 intimate dining essays",
      "Studio Lani sculptural design language",
      "Sahelian vernacular earth architecture"
    ]
  },
  experience: {
    description: "Guests transition off their fast-paced day into a sanctuary of warmth the moment they cross the threshold. Handed an iced hibiscus-ginger cordial in ribbed glassware, they gather around a table where every seat feels personal, conversational, and deeply honored.",
    memorableElements: [
      "Welcome Toast Ritual: Signature Zobo-Infused Spiced Cider with smoked cinnamon sprigs",
      "Handwritten Calligraphy Namecards featuring personal thank-you notes on the reverse side",
      "Curated Vinyl / Lo-fi Highlife & Neo-Soul acoustic soundtrack tuned precisely for effortless talking",
      "Shared Family-Style Feast presented on oversized artisanal wooden carving boards"
    ]
  },
  budget: {
    totalBudget: "₦80,000",
    currency: "NGN",
    items: [
      { category: "Floral & Botanical", item: "Dried local foliage, pampas stems, eucalyptus & terracotta pots (Balogun/Oyingbo Market)", estimatedCost: "₦14,000", notes: "Reusable long after the dinner as permanent home décor" },
      { category: "Illumination", item: "Set of 16 unscented ivory taper candles + ribbed glass votives & tea lights", estimatedCost: "₦9,500", notes: "Key to eliminating need for expensive overhead lighting" },
      { category: "Tablescape & Linen", item: "Raw beige linen table runner, deckled cardstock for menus, jute twine accents", estimatedCost: "₦11,000", notes: "Cut fabric by the yard from textile merchants for 60% savings" },
      { category: "Signature Beverages", item: "Zobo concentrate, fresh ginger, sparkling water, cloves, whole oranges & garnishes", estimatedCost: "₦12,000", notes: "Produces 15+ mocktail/cocktail servings at artisanal craft quality" },
      { category: "Artisanal Table Accents", item: "Natural beeswax, custom printed editorial conversation menu cards & ceramic styling", estimatedCost: "₦8,500", notes: "Printed at local digital print hub on 300gsm textured stock" },
      { category: "Soundtrack & Ambience", item: "Aromatherapy room diffuser oil (Cedarwood & Sweet Orange) + portable speaker setup", estimatedCost: "₦7,500", notes: "Curated 4-hour uninterrupted playlist already pre-sequenced" },
      { category: "Contingency & Ice", item: "Clean ice bags, lemons, fresh mint garnishes, extra matches & packaging", estimatedCost: "₦5,500", notes: "Buffer for last-minute prep adjustments" }
    ],
    totalEstimate: "₦67,500",
    savingTips: [
      "Purchase plain unbleached linen directly by the yard from local textile stalls instead of ready-made designer tablecloths.",
      "Opt for dried sculptural botanicals and seeded eucalyptus over fresh cut roses; they cost 40% less and last indefinitely.",
      "Feature family-style communal service platters—this feels elevated and luxurious while reducing plating individual courses."
    ]
  },
  shoppingList: {
    items: [
      { emoji: "🌿", item: "Dried pampas, palm spears, eucalyptus branches", where: "Balogun or local botanical florist" },
      { emoji: "🕯️", item: "Box of 12 taper candles (ivory/beige) + 12 glass tea-light holders", where: "Local home store or supermarket" },
      { emoji: "🧵", item: "3 yards of natural raw linen or unbleached calico fabric", where: "Local fabric market / haberdashery" },
      { emoji: "📜", item: "8 sheets of heavyweight textured A4 cardstock (cut into menus)", where: "Print shop / stationery center" },
      { emoji: "🍹", item: "Dried hibiscus calyces (zobo), ginger root, cinnamon sticks, citrus", where: "Local market / fruit stall" },
      { emoji: "🏺", item: "Low earthenware bowls or unglazed terracotta plant saucers", where: "Local pottery artisan / garden market" }
    ]
  },
  timeline: {
    steps: [
      { when: "2 weeks before", title: "Confirm RSVPs & Dietary Notes", description: "Lock in final guest headcount, check allergies, and finalize the playlist vibe." },
      { when: "1 week before", title: "Procure Linens & Botanicals", description: "Buy fabric, candles, and dried florals; test table dimensions with dummy setup." },
      { when: "3 days before", title: "Print Menus & Namecards", description: "Print custom menu cards, handwrite personal notes on the back of each place card." },
      { when: "1 day before", title: "Batch Signature Cordial & Clean Glassware", description: "Brew and chill spiced zobo concentrate; polish glasses and press linen runners." },
      { when: "Day of (4 hrs before)", title: "Assemble Table & Ambient Illumination", description: "Arrange runner, candles, place settings, and test lighting as twilight begins." },
      { when: "In the moment", title: "Light Tapers & Queue Music", description: "Light candles 15 minutes prior to guest arrival; pour welcome drinks as door knocks." }
    ]
  },
  finishingTouches: {
    details: [
      "Scent Architecture: Warm cedarwood and bergamot diffuser lit 45 minutes prior so the entryway greets guests like a boutique hotel.",
      "The Unseen Playlist: Volume calibrated so guest voices never need to compete with bass; transition from mellow acoustic at 7 PM to upbeat jazz/afrobeats after dessert.",
      "Bespoke Conversation Cards: Tuck one provocative, reflective question under each dessert plate to spark unforced, memorable table storytelling.",
      "Ambient Lighting Check: Turn completely off all cool-white LED downlights 30 minutes before arrival—let warm candles carry the entire visual atmosphere.",
      "Takeaway Keepsake: Tie a small bundle of dried lavender and cinnamon with jute twine around each guest's napkin as a souvenir they carry home."
    ]
  }
};

function loadSampleConcept() {
  state.ideaData = {
    idea: "I want to host an intimate dinner party for 8 close friends. The vibe should be sophisticated but warm — African-inspired aesthetics with a modern twist.",
    budget: "₦80,000",
    style: "Modern African-inspired, warm and sophisticated",
    category: "gathering",
  };
  buildBrief();
  state.concept = SAMPLE_CONCEPT;
  state.conversationHistory = [
    { role: 'user', parts: [{ text: buildConceptUserPrompt(state.ideaData, state.brief, '') }] },
    { role: 'model', parts: [{ text: JSON.stringify(SAMPLE_CONCEPT) }] },
  ];
  renderConcept(SAMPLE_CONCEPT);
  showPage('concept');
  showConceptLoading(false);
  showConceptError(false);
  showConceptResults(true);
  showToast('✦ Interactive sample concept loaded! Explore the dossier, refine, or view final plan.');
}

// ── Loading messages ─────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Crafting your concept…",
  "Developing your visual direction…",
  "Building your experience plan…",
  "Curating your budget breakdown…",
  "Finalising your execution timeline…",
  "Adding the finishing touches…",
];

// ══════════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════════

function showPage(pageName) {
  const pages = ['home', 'brief', 'concept', 'final'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) {
      el.style.display = (p === pageName) ? 'block' : 'none';
      el.classList.toggle('page-active', p === pageName);
    }
  });
  state.currentPage = pageName;

  // Show/hide New Project nav button
  const navBtn = document.getElementById('nav-new-project');
  if (navBtn) navBtn.style.display = (pageName !== 'home') ? 'inline-flex' : 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════════════
//  SETTINGS / API KEY
// ══════════════════════════════════════════════════════════════════

function getStoredApiKey() {
  return localStorage.getItem('acd_api_key') || localStorage.getItem('acd_gemini_key') || '';
}

function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  const isOpen = panel.classList.contains('active');
  panel.classList.toggle('active', !isOpen);
  overlay.classList.toggle('active', !isOpen);

  if (!isOpen) {
    // Pre-fill existing key
    const existing = getStoredApiKey();
    const input = document.getElementById('api-key-input');
    if (input) input.value = existing;
    updateApiStatus();
  }
}

function cleanApiKey(raw) {
  if (!raw) return '';
  let key = raw.trim();
  key = key.replace(/^["'`]|["'`]$/g, '').trim();
  key = key.replace(/^Bearer\s+/i, '').trim();
  key = key.replace(/^export\s+(ANTHROPIC|GEMINI)_API_KEY\s*=\s*/i, '').trim();
  return key;
}

async function testKey(key) {
  if (!key) return { ok: false, message: 'Please enter an API key.' };
  key = cleanApiKey(key);

  if (key.length < 15) {
    return { ok: false, message: 'API key is too short. Please paste your complete key.' };
  }

  if (key.startsWith('sk-ant-')) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          state.availableAnthropicModels = data.data;
        }
        return { ok: true, message: 'Anthropic (Claude) API key is valid and connected!' };
      }
      const data = await res.json().catch(() => ({}));
      const msg = data?.error?.message || `HTTP ${res.status}`;
      if (res.status === 401) {
        return { ok: false, message: `Anthropic rejected key (401 Unauthorized: ${msg}). Key may be invalid, revoked, or expired at console.anthropic.com.` };
      }
      if (res.status === 400 || res.status === 402 || (msg && (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('balance')))) {
        return { ok: false, message: `Anthropic billing issue: ${msg}. Check credit balance at console.anthropic.com/settings/billing or use a free Gemini key.` };
      }
      return { ok: false, message: `Anthropic error (${res.status}): ${msg}` };
    } catch (err) {
      return { ok: false, message: `Network error reaching Anthropic: ${err.message}` };
    }
  } else {
    // Google Gemini API key (supports AIza..., AQ..., and any valid Google AI Studio key)
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (res.ok) {
        return { ok: true, message: 'Google (Gemini) API key is valid and connected!' };
      }
      const data = await res.json().catch(() => ({}));
      const msg = data?.error?.message || `HTTP ${res.status}`;
      if (res.status === 400 && (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid'))) {
        return { ok: false, message: `Invalid Gemini API key. Please check your key at aistudio.google.com/app/apikey.` };
      }
      return { ok: false, message: `Gemini error (${res.status}): ${msg}` };
    } catch (err) {
      return { ok: false, message: `Network error reaching Gemini: ${err.message}` };
    }
  }
}

async function testCurrentApiKey() {
  const input = document.getElementById('api-key-input');
  const key = cleanApiKey(input ? input.value : '') || getStoredApiKey();
  if (!key) {
    showApiStatus('Please enter an API key to test.', 'error');
    return;
  }
  showApiStatus('Testing key connection with AI provider...', 'info');
  const result = await testKey(key);
  if (result.ok) {
    showApiStatus(`✓ ${result.message}`, 'success');
  } else {
    showApiStatus(`✕ ${result.message}`, 'error');
  }
}

async function saveApiKey() {
  const input = document.getElementById('api-key-input');
  const key = cleanApiKey(input ? input.value : '');
  if (!key) {
    showApiStatus('Please enter an API key.', 'error');
    return;
  }
  if (key.length < 15) {
    showApiStatus('API key is too short. Please paste your complete API key.', 'error');
    return;
  }

  // Clear stale model caches on key update
  localStorage.removeItem('acd_cached_turbo_model');
  localStorage.removeItem('acd_cached_director_model');
  localStorage.removeItem('acd_cached_gemini_model');
  localStorage.removeItem('acd_active_model');
  state.cachedTurboModel = '';
  state.cachedDirectorModel = '';
  state.cachedGeminiModel = '';
  state.activeClaudeModel = '';

  localStorage.setItem('acd_api_key', key);
  localStorage.setItem('acd_gemini_key', key);
  state.apiKey = key;
  if (input) input.value = key;

  const provider = key.startsWith('sk-ant-') ? 'Anthropic (Claude)' : 'Google (Gemini)';
  showApiStatus(`Testing ${provider} key connection...`, 'info');

  const result = await testKey(key);
  if (result.ok) {
    showApiStatus(`✓ ${provider} API key verified & saved!`, 'success');
    updateHomeApiWarning();
    setTimeout(() => toggleSettings(), 1600);
  } else {
    showApiStatus(`⚠ Key saved, but verification failed: ${result.message}`, 'error');
    updateHomeApiWarning();
  }
}

function clearApiKey() {
  localStorage.removeItem('acd_api_key');
  localStorage.removeItem('acd_gemini_key');
  localStorage.removeItem('acd_cached_turbo_model');
  localStorage.removeItem('acd_cached_director_model');
  localStorage.removeItem('acd_cached_gemini_model');
  localStorage.removeItem('acd_active_model');
  state.apiKey = '';
  state.cachedTurboModel = '';
  state.cachedDirectorModel = '';
  state.cachedGeminiModel = '';
  state.activeClaudeModel = '';
  state.availableAnthropicModels = [];
  const input = document.getElementById('api-key-input');
  if (input) input.value = '';
  showApiStatus('API key cleared.', 'error');
  updateHomeApiWarning();
}

function showApiStatus(message, type) {
  const el = document.getElementById('api-status');
  if (!el) return;
  el.textContent = message;
  el.className = `api-status ${type}`;
  el.style.display = 'block';
}

function updateApiStatus() {
  const key = getStoredApiKey();
  if (key) {
    const provider = key.startsWith('sk-ant-') ? 'Anthropic (Claude)' : 'Google (Gemini)';
    showApiStatus(`✓ ${provider} API key configured`, 'success');
  } else {
    const el = document.getElementById('api-status');
    if (el) {
      el.style.display = 'none';
      el.className = 'api-status';
    }
  }
}

function toggleApiKeyVisibility() {
  const input = document.getElementById('api-key-input');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function loadApiKey() {
  const key = getStoredApiKey();
  if (key) {
    state.apiKey = key;
  }
}

function updateHomeApiWarning() {
  const warning = document.getElementById('home-api-warning');
  if (!warning) return;
  const key = getStoredApiKey();
  warning.style.display = key ? 'none' : 'flex';
}

// ══════════════════════════════════════════════════════════════════
//  HOME PAGE
// ══════════════════════════════════════════════════════════════════

function updateCharCount() {
  const textarea = document.getElementById('idea-input');
  const counter = document.getElementById('char-count');
  if (textarea && counter) {
    counter.textContent = textarea.value.length;
  }
}

function selectCategory(btn) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip-active'));
  btn.classList.add('chip-active');
  state.ideaData.category = btn.dataset.value;
}

function fillSuggestion(index) {
  const s = SUGGESTIONS[index];
  if (!s) return;
  const ideaInput = document.getElementById('idea-input');
  const budgetInput = document.getElementById('budget-input');
  const styleInput = document.getElementById('style-input');
  if (ideaInput) { ideaInput.value = s.idea; updateCharCount(); }
  if (budgetInput) budgetInput.value = s.budget;
  if (styleInput) styleInput.value = s.style;

  // Set category chip
  document.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('chip-active', c.dataset.value === s.category);
  });
  state.ideaData.category = s.category;

  // Scroll to form
  const form = document.getElementById('idea-form');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function scrollToBrief(event) {
  if (event) event.preventDefault();
  const el = document.getElementById('form-heading') || document.getElementById('idea-form') || document.getElementById('form-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const input = document.getElementById('idea-input');
    if (input) setTimeout(() => input.focus(), 400);
  }
}

function submitIdea(event) {
  event.preventDefault();

  const ideaInput = document.getElementById('idea-input');
  const idea = (ideaInput ? ideaInput.value : '').trim();

  if (!idea) {
    ideaInput.focus();
    ideaInput.style.borderColor = '#b8694a';
    setTimeout(() => { ideaInput.style.borderColor = ''; }, 2000);
    showToast('Please describe your idea first.');
    return;
  }

  state.ideaData.idea = idea;
  state.ideaData.budget = (document.getElementById('budget-input')?.value || '').trim();
  state.ideaData.style = (document.getElementById('style-input')?.value || '').trim();

  // Build and display brief
  buildBrief();
  showPage('brief');
}

// ══════════════════════════════════════════════════════════════════
//  BRIEF PAGE
// ══════════════════════════════════════════════════════════════════

function buildBrief() {
  const { idea, budget, style, category } = state.ideaData;

  // Parse basic info from idea text for display purposes
  const categoryLabels = {
    birthday: '🎂 Birthday Celebration',
    romantic: '💌 Romantic Experience',
    surprise: '🎉 Surprise Celebration',
    gathering: '🥂 Intimate Gathering',
    photoshoot: '📸 Photoshoot Concept',
    personal: '✨ Personal Project',
  };

  state.brief = {
    objective: idea,
    budget: budget || 'Not specified — AI will make budget-conscious suggestions',
    style: style || 'Not specified — AI will infer from context',
    category: categoryLabels[category] || category,
  };

  renderBrief();
}

function renderBrief() {
  const container = document.getElementById('brief-grid');
  if (!container || !state.brief) return;

  const cards = [
    {
      icon: '🎯',
      label: 'Objective & Vision',
      value: state.brief.objective,
      missing: false,
    },
    {
      icon: '💰',
      label: 'Stated Budget',
      value: state.brief.budget,
      missing: !state.ideaData.budget,
    },
    {
      icon: '🎨',
      label: 'Preferred Style / Vibe',
      value: state.brief.style,
      missing: !state.ideaData.style,
    },
    {
      icon: '📋',
      label: 'Experience Category',
      value: state.brief.category,
      missing: false,
    },
  ];

  container.innerHTML = cards.map(card => `
    <div class="brief-card ${card.missing ? 'brief-card-missing' : ''}">
      <div class="brief-card-header">
        <div class="brief-card-icon">${card.icon}</div>
        <div class="brief-card-label">${card.label}</div>
      </div>
      <div class="brief-card-value">${escapeHtml(card.value)}</div>
      ${card.missing ? '<div class="brief-inferred-tag">✦ AI will infer and calibrate this from context</div>' : ''}
    </div>
  `).join('');
}

// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
//  CONCEPT GENERATION & PROMPT DEFINITIONS
// ══════════════════════════════════════════════════════════════════

const CREATIVE_DIRECTOR_SYSTEM_PROMPT = `You are an elite creative director, experience designer, and event planner with impeccable editorial taste and culture-specific sensibility.
Transform client briefs into distinctive, unforgettable, and highly detailed creative concepts.
Be specific, naming actual styling textures, real color references, actual stores/markets (Nigerian ones if relevant to the currency), itemized budgets, and execution timelines.

Output strictly valid JSON matching this schema with NO markdown wrapping or conversational commentary:
{
  "conceptName": "Distinctive evocative name (3-7 words)",
  "tagline": "A short, beautiful one-sentence summary of the concept's essence",
  "bigIdea": {
    "summary": "2-3 sentences. What is the core creative concept? What makes it distinctive and memorable?"
  },
  "creativeDirection": {
    "vision": "2-3 sentences describing the overall vision and intended experience",
    "mood": "Emotional tone and atmosphere (e.g. intimate, electric, dreamy, sophisticated)",
    "keyPrinciples": ["Principle 1", "Principle 2", "Principle 3", "Principle 4"]
  },
  "visualIdentity": {
    "colourPalette": [
      {"name": "Colour name", "hex": "#HEXCODE", "role": "Primary/Secondary/Accent"},
      {"name": "Colour name", "hex": "#HEXCODE", "role": "Primary/Secondary/Accent"},
      {"name": "Colour name", "hex": "#HEXCODE", "role": "Primary/Secondary/Accent"},
      {"name": "Colour name", "hex": "#HEXCODE", "role": "Primary/Secondary/Accent"}
    ],
    "lighting": "Lighting approach in detail",
    "textures": "Materials, textures, and tactile elements",
    "styling": "Overall styling direction",
    "references": ["Visual reference 1", "Visual reference 2", "Visual reference 3", "Visual reference 4", "Visual reference 5"]
  },
  "experience": {
    "description": "2-3 sentences on how this feels from recipient perspective",
    "memorableElements": ["Element 1", "Element 2", "Element 3", "Element 4"]
  },
  "budget": {
    "totalBudget": "Formatted stated budget (e.g. ₦80,000)",
    "currency": "NGN (or stated currency)",
    "items": [
      {"category": "Category name", "item": "Specific item/service description", "estimatedCost": "₦X,XXX", "notes": ""}
    ],
    "totalEstimate": "₦XX,XXX",
    "savingTips": ["Tip 1", "Tip 2"]
  },
  "shoppingList": {
    "items": [
      {"emoji": "🛍️", "item": "Specific thing to buy or prepare", "where": "Where to get it"}
    ]
  },
  "timeline": {
    "steps": [
      {"when": "2 weeks before", "title": "Step title", "description": "Specific action"},
      {"when": "1 week before", "title": "Step title", "description": "Specific action"},
      {"when": "3 days before", "title": "Step title", "description": "Specific action"},
      {"when": "1 day before", "title": "Step title", "description": "Specific action"},
      {"when": "Day of", "title": "Step title", "description": "Specific action"},
      {"when": "In the moment", "title": "Step title", "description": "Specific action"}
    ]
  },
  "finishingTouches": {
    "details": [
      "Specific small detail that makes a big difference",
      "Another thoughtful touch",
      "A sensory detail (scent, sound, taste)",
      "A personalisation idea",
      "A timing or delivery detail"
    ]
  }
}`;

function buildConceptUserPrompt(ideaData, brief, adjustment) {
  const { idea, budget, style, category } = ideaData;
  return `CLIENT CREATIVE BRIEF:
Idea: ${idea}
Category: ${category}
Budget: ${budget || 'Not specified — provide practical budget-conscious suggestions'}
Preferred Style/Vibe: ${style || 'Infer from idea description'}
${adjustment ? `Additional Client Context/Adjustments: ${adjustment}` : ''}

Generate the complete, distinctive creative concept as specified in the schema.`;
}

// Backward compatibility helper
function buildConceptPrompt(ideaData, brief, adjustment) {
  return buildConceptUserPrompt(ideaData, brief, adjustment);
}

async function generateConcept() {
  const key = getStoredApiKey();
  if (!key) {
    showToast('Please add your API key first (Anthropic or Gemini).');
    toggleSettings();
    return;
  }

  state.apiKey = key;

  // Sync mode UI
  setGenerationMode(state.generationMode);

  // Get any brief adjustments
  const adjustment = (document.getElementById('brief-edit-input')?.value || '').trim();

  // Build the user prompt
  const userPrompt = buildConceptUserPrompt(state.ideaData, state.brief, adjustment);

  // Navigate to concept page and show loading
  showPage('concept');
  showConceptLoading(true);
  showConceptError(false);
  showConceptResults(false);

  // Animate loading stages
  updateProgressStage(1);
  let currentStage = 1;
  const stageSpeed = state.generationMode === 'turbo' ? 800 : 2600;
  const stageInterval = setInterval(() => {
    if (currentStage < 4) {
      currentStage++;
      updateProgressStage(currentStage);
    }
  }, stageSpeed);

  const msgInterval = cycleLoadingMessages();

  try {
    const conceptData = await callAiApi(userPrompt, [], CREATIVE_DIRECTOR_SYSTEM_PROMPT);
    clearInterval(msgInterval);
    clearInterval(stageInterval);
    updateProgressStage(5); // all complete

    state.concept = conceptData;
    state.conversationHistory = [
      { role: 'user', parts: [{ text: userPrompt }] },
      { role: 'model', parts: [{ text: JSON.stringify(conceptData) }] },
    ];

    renderConcept(conceptData);
    showConceptLoading(false);
    showConceptResults(true);
  } catch (err) {
    clearInterval(msgInterval);
    clearInterval(stageInterval);
    console.error('Generation error:', err);
    showConceptLoading(false);
    showConceptError(true, err.message || 'An unexpected error occurred. Please try again.');
  }
}

// ══════════════════════════════════════════════════════════════════
//  API DISPATCH & INTEGRATION (ANTHROPIC + GEMINI)
// ══════════════════════════════════════════════════════════════════

async function callAiApi(userPrompt, history = [], systemPrompt = CREATIVE_DIRECTOR_SYSTEM_PROMPT) {
  const key = state.apiKey || getStoredApiKey();
  if (!key) {
    throw new Error('No API key configured.');
  }
  if (key.startsWith('sk-ant-')) {
    return await callAnthropicAPI(userPrompt, history, systemPrompt);
  } else {
    // For Gemini, combine system prompt with user prompt
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    return await callGeminiAPI(fullPrompt, history);
  }
}

function extractAndParseJson(text) {
  if (!text) throw new Error('Empty response from AI.');
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    }
    throw err;
  }
}

async function getAnthropicAvailableModels(apiKey) {
  if (state.availableAnthropicModels && state.availableAnthropicModels.length > 0) {
    return state.availableAnthropicModels;
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        state.availableAnthropicModels = data.data;
        return data.data;
      }
    } else {
      const errorData = await res.json().catch(() => ({}));
      const msg = errorData?.error?.message;
      if (res.status === 401) {
        throw new Error(`Invalid Anthropic API key (${msg || '401 Unauthorized'}). Please check your key at console.anthropic.com or switch to a free Gemini key in Settings.`);
      }
      if (res.status === 402 || res.status === 429 || (msg && (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('balance')))) {
        throw new Error(`Anthropic billing limit: ${msg || 'Insufficient credit balance or rate limit'}. Please check your Anthropic Console billing or switch to a free Gemini key.`);
      }
    }
  } catch (err) {
    if (err.message && (err.message.includes('Invalid Anthropic') || err.message.includes('credit') || err.message.includes('rate limit') || err.message.includes('billing limit'))) {
      throw err;
    }
    console.warn('Could not query /v1/models:', err);
  }
  return [];
}

async function callAnthropicAPI(userPrompt, history = [], systemPrompt = CREATIVE_DIRECTOR_SYSTEM_PROMPT) {
  const apiKey = state.apiKey || getStoredApiKey();
  const url = 'https://api.anthropic.com/v1/messages';
  const mode = state.generationMode || 'turbo';

  const messages = [];

  // Convert conversation history if present
  if (history && history.length > 0) {
    for (const h of history) {
      const role = h.role === 'model' ? 'assistant' : 'user';
      let content = '';
      if (typeof h.content === 'string') {
        content = h.content;
      } else if (h.parts && h.parts[0]) {
        content = h.parts[0].text;
      } else {
        content = JSON.stringify(h);
      }
      messages.push({ role, content });
    }
    messages.push({ role: 'user', content: userPrompt });
  } else {
    // Note: Do not prefill trailing assistant messages.
    // Modern Claude models reject assistant prefill with a 400 Bad Request error.
    messages.push({ role: 'user', content: userPrompt });
  }

  // 1. Cached verified model for current mode (if valid and not retired)
  const cachedModel = mode === 'turbo' ? state.cachedTurboModel : state.cachedDirectorModel;
  let candidateModels = [];

  if (cachedModel && !RETIRED_ANTHROPIC_MODELS.includes(cachedModel)) {
    candidateModels.push(cachedModel);
  }

  // 2. Fetch live available models for this specific API key from Anthropic
  try {
    const liveModels = await getAnthropicAvailableModels(apiKey);
    if (liveModels && liveModels.length > 0) {
      if (mode === 'turbo') {
        const haikus = liveModels.filter(m => (m.line === 'haiku' || m.id.toLowerCase().includes('haiku'))).map(m => m.id);
        const sonnets = liveModels.filter(m => (m.line === 'sonnet' || m.id.toLowerCase().includes('sonnet'))).map(m => m.id);
        const others = liveModels.map(m => m.id).filter(id => !haikus.includes(id) && !sonnets.includes(id));
        candidateModels.push(...haikus, ...sonnets, ...others);
      } else {
        const sonnets = liveModels.filter(m => (m.line === 'sonnet' || m.id.toLowerCase().includes('sonnet') || m.line === 'opus' || m.id.toLowerCase().includes('opus'))).map(m => m.id);
        const haikus = liveModels.filter(m => (m.line === 'haiku' || m.id.toLowerCase().includes('haiku'))).map(m => m.id);
        const others = liveModels.map(m => m.id).filter(id => !sonnets.includes(id) && !haikus.includes(id));
        candidateModels.push(...sonnets, ...haikus, ...others);
      }
    }
  } catch (discoveryErr) {
    console.warn('Anthropic model discovery failed, falling back to curated list:', discoveryErr);
  }

  // 3. Fallbacks with modern active models first
  const modernTurboFallbacks = [
    'claude-haiku-5-5',
    'claude-haiku-4-5',
    'claude-sonnet-5-5',
    'claude-sonnet-4-6',
    'claude-3-5-haiku-20241022',
    'claude-3-5-haiku-latest',
    'claude-3-haiku-20240307'
  ];

  const modernDirectorFallbacks = [
    'claude-sonnet-5-5',
    'claude-sonnet-4-6',
    'claude-opus-5-5',
    'claude-haiku-5-5',
    'claude-haiku-4-5',
    'claude-3-7-sonnet-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-20241022'
  ];

  const defaultFallbacks = mode === 'turbo' ? modernTurboFallbacks : modernDirectorFallbacks;
  candidateModels.push(...defaultFallbacks);

  // De-duplicate while preserving priority order
  let uniqueModels = [...new Set(candidateModels)];

  let lastError = null;

  for (let i = 0; i < uniqueModels.length; i++) {
    const model = uniqueModels[i];
    try {
      const requestBody = {
        model: model,
        max_tokens: mode === 'turbo' ? 2500 : 4096,
        system: systemPrompt,
        messages: messages
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMsg = errorData?.error?.message;
        const msg = rawMsg || `Anthropic API error ${response.status}`;

        if (response.status === 401) {
          throw new Error(`Invalid Anthropic API key (${rawMsg || '401 Unauthorized'}). Please verify your key at console.anthropic.com or switch to a free Google Gemini key in Settings.`);
        }
        if (response.status === 402 || response.status === 429 || (rawMsg && (rawMsg.toLowerCase().includes('credit') || rawMsg.toLowerCase().includes('balance')))) {
          throw new Error(`Anthropic billing limit: ${rawMsg || 'Insufficient credit balance or rate limit'}. Check your credits at console.anthropic.com/settings/billing or switch to a free Gemini key in Settings.`);
        }
        // If 404 / model deprecated / unsupported, clear invalid model cache and try next candidate
        if (
          response.status === 404 ||
          msg.toLowerCase().includes('model') ||
          msg.toLowerCase().includes('not found') ||
          msg.toLowerCase().includes('unsupported')
        ) {
          console.warn(`Claude model ${model} unavailable (${msg}). Trying next...`);
          if (state.cachedTurboModel === model) {
            state.cachedTurboModel = '';
            localStorage.removeItem('acd_cached_turbo_model');
          }
          if (state.cachedDirectorModel === model) {
            state.cachedDirectorModel = '';
            localStorage.removeItem('acd_cached_director_model');
          }
          if (state.activeClaudeModel === model) {
            state.activeClaudeModel = '';
            localStorage.removeItem('acd_active_model');
          }
          lastError = new Error(msg);
          continue;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      const rawText = data?.content?.[0]?.text;

      if (!rawText) {
        throw new Error('The AI returned an empty response. Please try again.');
      }

      try {
        const parsed = extractAndParseJson(rawText);
        // Successfully parsed! Cache this working model for instant future calls:
        if (mode === 'turbo') {
          state.cachedTurboModel = model;
          localStorage.setItem('acd_cached_turbo_model', model);
        } else {
          state.cachedDirectorModel = model;
          localStorage.setItem('acd_cached_director_model', model);
        }
        state.activeClaudeModel = model;
        localStorage.setItem('acd_active_model', model);
        return parsed;
      } catch (parseErr) {
        console.error('Failed to parse JSON from Anthropic response:', rawText.substring(0, 300));
        throw new Error('The AI returned an unexpected format. Please try again.');
      }
    } catch (err) {
      if (err.message && (err.message.includes('Invalid Anthropic API key') || err.message.includes('billing limit') || err.message.includes('rate limit') || err.message.includes('credit balance') || err.message.includes('insufficient'))) {
        throw err;
      }
      lastError = err;
    }
  }

  if (lastError && (lastError.message.toLowerCase().includes('model') || lastError.message.includes('404'))) {
    throw new Error(`Claude model unavailable: The requested AI model could not be reached with this API key. We attempted all available Claude models. Please check your Anthropic account billing/credits at console.anthropic.com or switch to a free Google Gemini key in Settings.`);
  }

  throw lastError || new Error('Could not find an active Claude model for this API key. Please check your Anthropic account or switch to a free Gemini key in Settings.');
}

async function callGeminiAPI(prompt, history) {
  const apiKey = state.apiKey || getStoredApiKey();
  const cachedModel = state.cachedGeminiModel || localStorage.getItem('acd_cached_gemini_model');
  const defaultModels = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];
  const candidateModels = cachedModel ? [cachedModel, ...defaultModels] : defaultModels;
  const models = [...new Set(candidateModels)];

  const contents = [];

  // Add conversation history for refinement context
  if (history && history.length > 0) {
    contents.push(...history);
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const requestBody = {
    contents,
    generationConfig: {
      temperature: 0.85,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  let lastError = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `API error ${response.status}`;

      if (response.status === 400 && (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid'))) {
        throw new Error('Invalid Gemini API key. Please check your key in Settings and try again.');
      }
      if (response.status === 403) {
        throw new Error('API key doesn\'t have permission. Make sure you enabled the Gemini API for this key at aistudio.google.com.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit reached. Please wait a moment and try again.');
      }
      // If model is deprecated or not available, try next fallback
      if (
        response.status === 404 ||
        msg.toLowerCase().includes('no longer available') ||
        msg.toLowerCase().includes('not available') ||
        msg.toLowerCase().includes('deprecated') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('is not supported')
      ) {
        console.warn(`Gemini model ${model} unavailable (${msg}). Trying next fallback...`);
        if (state.cachedGeminiModel === model) {
          state.cachedGeminiModel = '';
          localStorage.removeItem('acd_cached_gemini_model');
        }
        lastError = new Error(msg);
        continue;
      }
      throw new Error(msg);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('The AI returned an empty response. Please try again.');
    }

    try {
      const parsed = extractAndParseJson(rawText);
      state.cachedGeminiModel = model;
      localStorage.setItem('acd_cached_gemini_model', model);
      return parsed;
    } catch {
      console.error('Failed to parse JSON:', rawText.substring(0, 300));
      throw new Error('The AI returned an unexpected format. Please try again — this sometimes happens on first attempt.');
    }
  }

  if (lastError && (lastError.message.toLowerCase().includes('model') || lastError.message.includes('404') || lastError.message.toLowerCase().includes('not found'))) {
    throw new Error(`Gemini model unavailable: ${lastError.message}. Please check your Google AI Studio configuration or switch keys in Settings.`);
  }

  throw lastError || new Error('Could not connect to Gemini models.');
}

function cycleLoadingMessages() {
  let i = 0;
  const el = document.getElementById('loading-subtitle');
  if (el) el.textContent = LOADING_MESSAGES[0];
  return setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    if (el) el.textContent = LOADING_MESSAGES[i];
  }, 2200);
}

function showConceptLoading(show) {
  const el = document.getElementById('loading-state');
  if (el) el.style.display = show ? 'flex' : 'none';
}
function showConceptError(show, message) {
  const el = document.getElementById('error-state');
  if (el) el.style.display = show ? 'flex' : 'none';
  if (show && message) {
    const msgEl = document.getElementById('error-message');
    if (msgEl) {
      if (message.toLowerCase().includes('model: claude-3-5-haiku-latest') || message.toLowerCase() === 'model: claude-3-5-haiku-latest') {
        msgEl.textContent = 'The Claude model (claude-3-5-haiku-latest) is retired or unavailable for this Anthropic account. Please check your Anthropic account or switch to a free Google Gemini key in Settings.';
      } else {
        msgEl.textContent = message;
      }
    }
  }
}
function showConceptResults(show) {
  const el = document.getElementById('concept-results');
  if (el) el.style.display = show ? 'block' : 'none';
}

// ══════════════════════════════════════════════════════════════════
//  RENDER CONCEPT
// ══════════════════════════════════════════════════════════════════

function renderConcept(concept) {
  // Header
  const nameEl = document.getElementById('concept-name');
  const taglineEl = document.getElementById('concept-tagline');
  if (nameEl) nameEl.textContent = concept.conceptName || 'Untitled Concept';
  if (taglineEl) taglineEl.textContent = concept.tagline || '';

  // Sections
  const container = document.getElementById('concept-sections');
  if (!container) return;

  const sections = [
    renderBigIdea(concept.bigIdea),
    renderCreativeDirection(concept.creativeDirection),
    renderVisualIdentity(concept.visualIdentity),
    renderExperience(concept.experience),
    renderBudget(concept.budget),
    renderShoppingList(concept.shoppingList),
    renderTimeline(concept.timeline),
    renderFinishingTouches(concept.finishingTouches),
  ].filter(Boolean);

  container.innerHTML = sections.map((html, i) => {
    return `<div class="concept-section" style="animation-delay:${i * 0.08}s">${html}</div>`;
  }).join('');
}

function sectionWrap(number, icon, title, body) {
  const numStr = String(number).padStart(2, '0');
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const roman = romanNumerals[number - 1] || numStr;
  return `
    <div class="section-header">
      <div class="section-icon-badge">${icon}</div>
      <div class="section-title-group">
        <div class="section-number">SECTION ${numStr} · PART ${roman}</div>
        <div class="section-title">${title}</div>
      </div>
    </div>
    <div class="section-body">
      ${body}
    </div>
  `;
}

function renderBigIdea(data) {
  if (!data) return '';
  return sectionWrap(1, '💡', 'The Big Idea', `
    <div class="big-idea-editorial">
      <div class="big-idea-quote-mark">“</div>
      <p class="section-text big-idea-text">${escapeHtml(data.summary || '')}</p>
    </div>
  `);
}

function renderCreativeDirection(data) {
  if (!data) return '';
  const principles = (data.keyPrinciples || []).map((p, idx) => `
    <div class="pillar-card">
      <span class="pillar-num">0${idx + 1}</span>
      <span class="pillar-text">${escapeHtml(p)}</span>
    </div>
  `).join('');

  return sectionWrap(2, '🧭', 'The Creative Direction', `
    <div class="vision-editorial">
      <p class="section-text vision-text">${escapeHtml(data.vision || '')}</p>
    </div>
    ${data.mood ? `
      <div class="mood-signature-row">
        <span class="mood-label">ATMOSPHERIC MOOD &amp; VIBE</span>
        <span class="mood-pill">✦ ${escapeHtml(data.mood)}</span>
      </div>
    ` : ''}
    ${principles ? `
      <div class="pillars-section">
        <span class="sub-label">KEY CREATIVE PRINCIPLES</span>
        <div class="pillars-grid">${principles}</div>
      </div>
    ` : ''}
  `);
}

function renderVisualIdentity(data) {
  if (!data) return '';

  const palette = (data.colourPalette || []).map(c => `
    <div class="colour-swatch-card">
      <div class="colour-swatch-preview" style="background-color:${escapeHtml(c.hex || '#E0D6C8')}" title="${escapeHtml(c.name || '')}"></div>
      <div class="colour-swatch-info">
        <span class="colour-name">${escapeHtml(c.name || 'Bespoke Hue')}</span>
        <div class="colour-meta-row">
          <span class="colour-role">${escapeHtml(c.role || 'Accent')}</span>
          <code class="colour-hex">${escapeHtml(c.hex || '')}</code>
        </div>
      </div>
    </div>
  `).join('');

  const refs = (data.references || []).map(r =>
    `<span class="tag">✦ ${escapeHtml(r)}</span>`
  ).join('');

  return sectionWrap(3, '🎨', 'The Visual Identity', `
    ${palette ? `
      <div class="palette-block">
        <span class="sub-label">CURATED BESPOKE COLOUR PALETTE</span>
        <div class="colour-palette-grid">${palette}</div>
      </div>
    ` : ''}
    
    <div class="sensory-grid">
      ${data.lighting ? `
        <div class="sensory-card">
          <span class="sensory-label">LIGHTING &amp; ILLUMINATION</span>
          <p class="section-text">${escapeHtml(data.lighting)}</p>
        </div>
      ` : ''}
      ${data.textures ? `
        <div class="sensory-card">
          <span class="sensory-label">TEXTURES &amp; TACTILE MATERIALS</span>
          <p class="section-text">${escapeHtml(data.textures)}</p>
        </div>
      ` : ''}
      ${data.styling ? `
        <div class="sensory-card">
          <span class="sensory-label">OVERALL STYLING DIRECTION</span>
          <p class="section-text">${escapeHtml(data.styling)}</p>
        </div>
      ` : ''}
    </div>

    ${refs ? `
      <div class="references-block">
        <span class="sub-label">VISUAL REFERENCES &amp; SEARCH TERMS</span>
        <div class="tag-list">${refs}</div>
      </div>
    ` : ''}
  `);
}

function renderExperience(data) {
  if (!data) return '';
  const elements = (data.memorableElements || []).map(e => `
    <div class="memorable-item">
      <div class="memorable-diamond">✦</div>
      <span>${escapeHtml(e)}</span>
    </div>
  `).join('');

  return sectionWrap(4, '✨', 'The Experience', `
    <div class="experience-narrative">
      <p class="section-text">${escapeHtml(data.description || '')}</p>
    </div>
    ${elements ? `
      <div class="memorable-block">
        <span class="sub-label">WHAT WILL MAKE IT UNFORGETTABLE</span>
        <div class="memorable-list">${elements}</div>
      </div>
    ` : ''}
  `);
}

function renderBudget(data) {
  if (!data) return '';

  const rows = (data.items || []).map(item => `
    <tr>
      <td><span class="budget-cat-pill">${escapeHtml(item.category || 'General')}</span></td>
      <td class="budget-item-name">${escapeHtml(item.item || '')}</td>
      <td class="budget-amount">${escapeHtml(item.estimatedCost || '')}</td>
      <td class="budget-notes">${escapeHtml(item.notes || '—')}</td>
    </tr>
  `).join('');

  const tips = (data.savingTips || []).map(t => `
    <div class="budget-tip-item">
      <span class="budget-tip-bullet">✦</span>
      <span>${escapeHtml(t)}</span>
    </div>
  `).join('');

  return sectionWrap(5, '💰', 'The Budget Breakdown', `
    <div class="budget-table-wrap">
      <table class="budget-table">
        <thead>
          <tr>
            <th style="width:18%">Category</th>
            <th style="width:40%">Item &amp; Description</th>
            <th style="width:20%;text-align:right">Estimated Cost</th>
            <th style="width:22%">Strategic Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="budget-total-row">
            <td colspan="2" class="budget-total-label">
              <span>TOTAL ESTIMATED INVESTMENT</span>
            </td>
            <td class="budget-amount budget-total-amount">${escapeHtml(data.totalEstimate || '')}</td>
            <td class="budget-currency-note">${escapeHtml(data.currency || 'Calculated')}</td>
          </tr>
        </tbody>
      </table>
    </div>
    ${tips ? `
      <div class="budget-tips-card">
        <span class="budget-tips-title">💡 STRATEGIC BUDGET &amp; VALUE TIPS</span>
        <div class="budget-tips-list">${tips}</div>
      </div>
    ` : ''}
  `);
}

function renderShoppingList(data) {
  if (!data) return '';

  const items = (data.items || []).map(item => `
    <div class="resource-card">
      <div class="resource-icon-wrap">${escapeHtml(item.emoji || '🛍️')}</div>
      <div class="resource-details">
        <div class="resource-name">${escapeHtml(item.item || '')}</div>
        ${item.where ? `<div class="resource-location">📍 ${escapeHtml(item.where)}</div>` : ''}
      </div>
    </div>
  `).join('');

  return sectionWrap(6, '🛍️', 'Shopping & Resources List', `
    <div class="resource-grid">${items}</div>
  `);
}

function renderTimeline(data) {
  if (!data) return '';

  const steps = (data.steps || []).map((step, i) => `
    <div class="timeline-step-row">
      <div class="timeline-step-marker">
        <span class="timeline-step-number">${String(i + 1).padStart(2, '0')}</span>
        <div class="timeline-stem-line"></div>
      </div>
      <div class="timeline-step-card">
        <div class="timeline-timing-pill">${escapeHtml(step.when || `Phase ${i + 1}`)}</div>
        <h4 class="timeline-title">${escapeHtml(step.title || '')}</h4>
        <p class="timeline-desc">${escapeHtml(step.description || '')}</p>
      </div>
    </div>
  `).join('');

  return sectionWrap(7, '📅', 'The Execution Timeline', `
    <div class="editorial-timeline">${steps}</div>
  `);
}

function renderFinishingTouches(data) {
  if (!data) return '';

  const details = (data.details || []).map(d => `
    <div class="touch-item">
      <div class="touch-icon">✦</div>
      <div class="touch-text">${escapeHtml(d)}</div>
    </div>
  `).join('');

  return sectionWrap(8, '🌟', 'The Finishing Touches', `
    <p class="section-text" style="margin-bottom:16px">Small details that elevate the entire experience from good to unforgettable:</p>
    <div class="touches-grid">${details}</div>
  `);
}

// ══════════════════════════════════════════════════════════════════
//  REFINEMENT
// ══════════════════════════════════════════════════════════════════

function fillRefinement(btn) {
  const input = document.getElementById('refinement-input');
  if (input) {
    input.value = btn.textContent.trim();
    input.focus();
  }
}

async function refineConceptHandler() {
  const input = document.getElementById('refinement-input');
  const request = (input ? input.value : '').trim();

  if (!request) {
    showToast('Tell your Creative Director what you\'d like to change.');
    if (input) input.focus();
    return;
  }

  const key = getStoredApiKey();
  if (!key) {
    showToast('Please add your API key first.');
    toggleSettings();
    return;
  }
  state.apiKey = key;

  // Show refine loading overlay
  const refineLoading = document.getElementById('refine-loading');
  const refineBtn = document.getElementById('refine-btn');
  if (refineLoading) refineLoading.style.display = 'flex';
  if (refineBtn) refineBtn.disabled = true;

  const refinementPrompt = buildRefinementPrompt(request, state.concept);

  try {
    const refined = await callAiApi(refinementPrompt, state.conversationHistory);

    // Update history
    state.conversationHistory.push(
      { role: 'user', parts: [{ text: refinementPrompt }] },
      { role: 'model', parts: [{ text: JSON.stringify(refined) }] }
    );

    state.concept = refined;

    // Clear input
    if (input) input.value = '';

    // Re-render
    renderConcept(refined);

    // Scroll to top of sections
    document.getElementById('concept-sections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    showToast('✓ Concept refined successfully!');
  } catch (err) {
    console.error('Refinement error:', err);
    showToast('Refinement failed: ' + (err.message || 'Please try again.'));
  } finally {
    if (refineLoading) refineLoading.style.display = 'none';
    if (refineBtn) refineBtn.disabled = false;
  }
}

function buildRefinementPrompt(request, currentConcept) {
  return `You are the same expert creative director. The client has reviewed the concept and has a refinement request.

CURRENT CONCEPT NAME: ${currentConcept?.conceptName || 'Current concept'}

CLIENT'S REFINEMENT REQUEST: "${request}"

Please revise the creative concept based on this request. Preserve everything that the client hasn't asked to change. Only update the sections that are relevant to the request. The concept should still feel coherent and complete.

Return the full updated concept as a valid JSON object with the exact same structure as before (no markdown, no code blocks, just raw JSON):

{
  "conceptName": "...",
  "tagline": "...",
  "bigIdea": { "summary": "..." },
  "creativeDirection": { "vision": "...", "mood": "...", "keyPrinciples": [...] },
  "visualIdentity": { "colourPalette": [...], "lighting": "...", "textures": "...", "styling": "...", "references": [...] },
  "experience": { "description": "...", "memorableElements": [...] },
  "budget": { "totalBudget": "...", "currency": "...", "items": [...], "totalEstimate": "...", "savingTips": [...] },
  "shoppingList": { "items": [...] },
  "timeline": { "steps": [...] },
  "finishingTouches": { "details": [...] }
}`;
}

// ══════════════════════════════════════════════════════════════════
//  FINAL PLAN
// ══════════════════════════════════════════════════════════════════

function showFinalPlan() {
  if (!state.concept) {
    showToast('No concept to display yet.');
    return;
  }
  renderFinalPlan(state.concept);
  showPage('final');
}

function renderFinalPlan(concept) {
  const titleEl = document.getElementById('final-plan-title');
  if (titleEl) titleEl.textContent = concept.conceptName || 'Your Creative Plan';

  const container = document.getElementById('final-plan-content');
  if (!container) return;

  const c = concept;

  // Build consolidated proposal layout
  const budgetItems = (c.budget?.items || []).map(item => `
    <tr>
      <td><span class="budget-cat-pill">${escapeHtml(item.category || 'General')}</span></td>
      <td class="budget-item-name">${escapeHtml(item.item || '')}</td>
      <td class="budget-amount">${escapeHtml(item.estimatedCost || '')}</td>
      <td class="budget-notes">${escapeHtml(item.notes || '—')}</td>
    </tr>
  `).join('');

  const timelineSteps = (c.timeline?.steps || []).map((step, i) => `
    <div class="timeline-step-row">
      <div class="timeline-step-marker">
        <span class="timeline-step-number">${String(i + 1).padStart(2, '0')}</span>
        <div class="timeline-stem-line"></div>
      </div>
      <div class="timeline-step-card">
        <div class="timeline-timing-pill">${escapeHtml(step.when || `Phase ${i + 1}`)}</div>
        <h4 class="timeline-title">${escapeHtml(step.title || '')}</h4>
        <p class="timeline-desc">${escapeHtml(step.description || '')}</p>
      </div>
    </div>
  `).join('');

  const shoppingItems = (c.shoppingList?.items || []).map(item => `
    <div class="resource-card">
      <div class="resource-icon-wrap">${escapeHtml(item.emoji || '🛍️')}</div>
      <div class="resource-details">
        <div class="resource-name">${escapeHtml(item.item || '')}</div>
        ${item.where ? `<div class="resource-location">📍 ${escapeHtml(item.where)}</div>` : ''}
      </div>
    </div>
  `).join('');

  const finishingDetails = (c.finishingTouches?.details || []).map(d => `
    <div class="touch-item">
      <div class="touch-icon">✦</div>
      <div class="touch-text">${escapeHtml(d)}</div>
    </div>
  `).join('');

  const paletteSwatches = (c.visualIdentity?.colourPalette || []).map(col => `
    <div class="colour-swatch-card" style="min-width:140px">
      <div class="colour-swatch-preview" style="height:54px;background-color:${escapeHtml(col.hex || '#ccc')}"></div>
      <div class="colour-swatch-info" style="padding:8px 10px">
        <span class="colour-name" style="font-size:0.8125rem">${escapeHtml(col.name || '')}</span>
        <div class="colour-meta-row" style="font-size:0.625rem">
          <span class="colour-role">${escapeHtml(col.role || '')}</span>
          <code class="colour-hex">${escapeHtml(col.hex || '')}</code>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="final-meta">
      <div style="font-size:0.6875rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold-dark);margin-bottom:6px">AI CREATIVE DIRECTOR · EXECUTIVE PROPOSAL DOSSIER</div>
      <div class="final-concept-title">${escapeHtml(c.conceptName || '')}</div>
      <div class="final-concept-tagline">${escapeHtml(c.tagline || '')}</div>
    </div>

    <div class="final-section">
      <div class="final-section-title">The Big Idea</div>
      <div class="final-section-body">
        <div class="big-idea-editorial">
          <div class="big-idea-quote-mark">“</div>
          <p class="section-text big-idea-text">${escapeHtml(c.bigIdea?.summary || '')}</p>
        </div>
      </div>
    </div>

    <div class="final-section">
      <div class="final-section-title">Creative Direction &amp; Mood</div>
      <div class="final-section-body">
        <p class="section-text" style="margin-bottom:16px">${escapeHtml(c.creativeDirection?.vision || '')}</p>
        ${c.creativeDirection?.mood ? `
          <div class="mood-signature-row" style="margin-bottom:16px">
            <span class="mood-label">ATMOSPHERIC MOOD</span>
            <span class="mood-pill">✦ ${escapeHtml(c.creativeDirection.mood)}</span>
          </div>
        ` : ''}
        ${(c.creativeDirection?.keyPrinciples || []).length ? `
          <div class="pillars-grid">
            ${(c.creativeDirection.keyPrinciples || []).map((p, idx) => `
              <div class="pillar-card">
                <span class="pillar-num">0${idx + 1}</span>
                <span class="pillar-text">${escapeHtml(p)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>

    <div class="final-section">
      <div class="final-section-title">Visual Identity &amp; Palette</div>
      <div class="final-section-body">
        ${paletteSwatches ? `
          <div style="margin-bottom:20px">
            <span class="sub-label">CURATED PALETTE</span>
            <div class="colour-palette-grid">${paletteSwatches}</div>
          </div>
        ` : ''}
        <div class="sensory-grid" style="margin-bottom:16px">
          ${c.visualIdentity?.lighting ? `<div class="sensory-card"><span class="sensory-label">LIGHTING</span><p class="section-text">${escapeHtml(c.visualIdentity.lighting)}</p></div>` : ''}
          ${c.visualIdentity?.textures ? `<div class="sensory-card"><span class="sensory-label">TEXTURES &amp; MATERIALS</span><p class="section-text">${escapeHtml(c.visualIdentity.textures)}</p></div>` : ''}
          ${c.visualIdentity?.styling ? `<div class="sensory-card"><span class="sensory-label">STYLING DIRECTION</span><p class="section-text">${escapeHtml(c.visualIdentity.styling)}</p></div>` : ''}
        </div>
        ${(c.visualIdentity?.references || []).length ? `
          <div>
            <span class="sub-label">VISUAL REFERENCES</span>
            <div class="tag-list">${c.visualIdentity.references.map(r => `<span class="tag">✦ ${escapeHtml(r)}</span>`).join('')}</div>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="final-section">
      <div class="final-section-title">The Budget Breakdown</div>
      <div class="final-section-body">
        <div class="budget-table-wrap" style="margin-bottom:16px">
          <table class="budget-table">
            <thead>
              <tr>
                <th style="width:18%">Category</th>
                <th style="width:40%">Item &amp; Description</th>
                <th style="width:20%;text-align:right">Estimated Cost</th>
                <th style="width:22%">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${budgetItems}
              <tr class="budget-total-row">
                <td colspan="2" class="budget-total-label">TOTAL ESTIMATE</td>
                <td class="budget-amount budget-total-amount">${escapeHtml(c.budget?.totalEstimate || '')}</td>
                <td class="budget-currency-note">${escapeHtml(c.budget?.currency || 'Calculated')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ${(c.budget?.savingTips || []).length ? `
          <div class="budget-tips-card">
            <span class="budget-tips-title">💡 STRATEGIC VALUE TIPS</span>
            <div class="budget-tips-list">
              ${c.budget.savingTips.map(t => `<div class="budget-tip-item"><span class="budget-tip-bullet">✦</span><span>${escapeHtml(t)}</span></div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="final-section">
      <div class="final-section-title">Shopping &amp; Resources List</div>
      <div class="final-section-body">
        <div class="resource-grid">${shoppingItems}</div>
      </div>
    </div>

    <div class="final-section">
      <div class="final-section-title">Execution Timeline</div>
      <div class="final-section-body">
        <div class="editorial-timeline">${timelineSteps}</div>
      </div>
    </div>

    <div class="final-section">
      <div class="final-section-title">Finishing Touches</div>
      <div class="final-section-body">
        <div class="touches-grid">${finishingDetails}</div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════
//  EXPORT / COPY
// ══════════════════════════════════════════════════════════════════

async function copyPlan() {
  if (!state.concept) return;
  const c = state.concept;

  const text = [
    `AI CREATIVE DIRECTOR — FINAL PLAN`,
    `═`.repeat(50),
    ``,
    `CONCEPT: ${c.conceptName || ''}`,
    `${c.tagline || ''}`,
    ``,
    `THE BIG IDEA`,
    `─`.repeat(30),
    c.bigIdea?.summary || '',
    ``,
    `CREATIVE DIRECTION`,
    `─`.repeat(30),
    c.creativeDirection?.vision || '',
    `Mood: ${c.creativeDirection?.mood || ''}`,
    ``,
    ...(c.creativeDirection?.keyPrinciples || []).map(p => `• ${p}`),
    ``,
    `VISUAL IDENTITY`,
    `─`.repeat(30),
    `Colours: ${(c.visualIdentity?.colourPalette || []).map(col => col.name).join(', ')}`,
    `Lighting: ${c.visualIdentity?.lighting || ''}`,
    `Textures: ${c.visualIdentity?.textures || ''}`,
    `Styling: ${c.visualIdentity?.styling || ''}`,
    `References: ${(c.visualIdentity?.references || []).join(', ')}`,
    ``,
    `THE BUDGET`,
    `─`.repeat(30),
    ...(c.budget?.items || []).map(item => `${item.category}: ${item.item} — ${item.estimatedCost}`),
    `TOTAL: ${c.budget?.totalEstimate || ''}`,
    ``,
    `SHOPPING LIST`,
    `─`.repeat(30),
    ...(c.shoppingList?.items || []).map(item => `${item.emoji || '•'} ${item.item}${item.where ? ` (${item.where})` : ''}`),
    ``,
    `EXECUTION TIMELINE`,
    `─`.repeat(30),
    ...(c.timeline?.steps || []).map((s, i) => `${i + 1}. [${s.when}] ${s.title}: ${s.description}`),
    ``,
    `FINISHING TOUCHES`,
    `─`.repeat(30),
    ...(c.finishingTouches?.details || []).map(d => `✦ ${d}`),
    ``,
    `─`.repeat(50),
    `Generated by AI Creative Director`,
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('copy-btn');
    if (btn) {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      setTimeout(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Plan`;
      }, 3000);
    }
    showToast('Plan copied to clipboard!');
  } catch {
    showToast('Could not copy. Try selecting and copying the text manually.');
  }
}

// ══════════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════════

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, duration = 3500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), duration);
}

// ══════════════════════════════════════════════════════════════════
//  INITIALISATION
// ══════════════════════════════════════════════════════════════════

function init() {
  loadApiKey();
  updateHomeApiWarning();
  showPage('home');

  // Keyboard: Escape closes settings
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const panel = document.getElementById('settings-panel');
      if (panel?.classList.contains('active')) toggleSettings();
    }
  });

  // Load existing API key into settings panel
  const existing = getStoredApiKey();
  const input = document.getElementById('api-key-input');
  if (input && existing) input.value = existing;

  // Sync generation engine mode
  setGenerationMode(state.generationMode);

  console.log('AI Creative Director loaded. Set your API key in Settings to get started.');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
