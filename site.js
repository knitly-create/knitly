// ============ DATA ============
const COLORS = [
  { id: 'volt',     name: 'Volt',      hex: '#c8d400' },
  { id: 'ember',    name: 'Ember',     hex: '#e8501a' },
  { id: 'neon_rose',name: 'Neon Rose', hex: '#e01070' },
  { id: 'klein',    name: 'Klein',     hex: '#1a3bff' },
  { id: 'glacial',  name: 'Glacial',   hex: '#009db5' },
  { id: 'shadow',   name: 'Shadow',    hex: '#1a1a1a' },
  { id: 'cognac',   name: 'Cognac',    hex: '#7a3b28' },
  { id: 'aura',     name: 'Aura',      hex: '#7b2abd' },
];
const FORMATS = [
  { id: 'court', label: 'COURT — 40 CM', size: '40 cm', price: 19.90 },
  { id: 'grand', label: 'GRAND — 80 CM', size: '80 cm', price: 27.90 },
];

// Real product photos, 2+ per (color × format).
const PHOTOS = {
  // 40 cm (court) → image 1 = produit seul, petite bande, bonne couleur ;
  //                 image 2 (hover) = mannequin portant le même modèle, même couleur.
  //                 (Aura : pas de visuel mannequin disponible — fallback sur la bande pliée violette.)
  // 80 cm (grand) → image 1 = produit seul avec la grande bande (suspendu, phone à l'intérieur) ;
  //                 image 2 (hover) = mannequin portant en bandoulière.
  //                 (Neon Rose / Glacial / Volt : pas de visuel mannequin grand — fallback sur la bande pliée
  //                  de la bonne couleur pour rester cohérent.)
  volt:      { court: ['volt-court-1.jpg','volt-court-2.webp'],          grand: ['volt-grand-1.jpeg','volt-grand-2.png'] },
  ember:     { court: ['ember-court-1.jpg','ember-court-2.webp'],        grand: ['ember-grand-1b.webp','ember-grand-2.webp'] },
  neon_rose: { court: ['neon_rose-court-1.jpg','neon_rose-court-2.webp'],grand: ['neon_rose-grand-1.png','neon_rose-grand-2.png'] },
  klein:     { court: ['klein-court-1.jpg','klein-court-2.webp'],        grand: ['klein-grand-1.webp','klein-grand-2.webp'] },
  glacial:   { court: ['glacial-court-1.jpg','glacial-court-2.webp'],    grand: ['glacial-grand-1.jpeg','glacial-grand-2.png'] },
  shadow:    { court: ['shadow-court-1.jpg','shadow-court-2.webp'],      grand: ['shadow-grand-1.png','shadow-grand-2.webp'] },
  cognac:    { court: ['cognac-court-1.jpg','cognac-court-2.webp'],      grand: ['cognac-grand-1.jpg','cognac-grand-2.webp'] },
  aura:      { court: ['aura-court-1.jpg','aura-court-2.webp'],          grand: ['aura-grand-1.png','aura-grand-2.webp'] },
};
const photoUrl = f => `assets/products/${f}`;

const PRODUCTS = [];
COLORS.forEach(c => FORMATS.forEach(f => PRODUCTS.push({
  id: `${c.id}_${f.id}`,
  color: c.id, colorName: c.name, hex: c.hex,
  format: f.id, formatLabel: f.label, size: f.size,
  price: f.price,
  label: `${c.name} — ${f.id === 'court' ? 'Court' : 'Grand'}`,
  photos: PHOTOS[c.id][f.id],
})));

// ============ STATE ============
const PROMO_CODES = { 'KNITLY5': 5 };
const state = {
  cart: JSON.parse(localStorage.getItem('knitly-cart') || '[]'),
  promo: localStorage.getItem('knitly-promo') || null,
  filter: 'all',
};

// ============ HELPERS ============
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const fmtEUR = n => n.toFixed(2).replace('.', ',') + ' €';
const saveCart = () => localStorage.setItem('knitly-cart', JSON.stringify(state.cart));
const scrollTo2 = id => { const el = document.getElementById(id); if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' }); };
window.scrollTo2 = scrollTo2;

// ============ PRODUCT GRID ============
function renderProducts(){
  const pg = $('#pg');
  if (!pg) return;
  pg.innerHTML = PRODUCTS
    .filter(p => state.filter === 'all' || p.format === state.filter)
    .map(p => {
      const [img1, img2] = p.photos;
      return `
      <article class="pc" data-format="${p.format}" data-id="${p.id}" onclick="openProduct('${p.id}')">
        <div class="pc-img">
          <img class="pc-photo pc-photo-1" src="${photoUrl(img1)}" alt="${p.label}" loading="lazy">
          <img class="pc-photo pc-photo-2" src="${photoUrl(img2)}" alt="${p.label} — autre angle" loading="lazy">
          <div class="pc-tag">${p.size}</div>
          <div class="pc-swatch" style="background:${p.hex};"></div>
        </div>
        <div class="pc-info">
          <div class="pc-name">${p.colorName.toUpperCase()}</div>
          <div class="pc-meta">${p.format === 'court' ? 'COURT · 40 CM' : 'GRAND · 80 CM'} · MAILLE 3D</div>
          <div class="pc-foot">
            <span class="pc-price">${fmtEUR(p.price)}</span>
            <button class="pc-add" data-add="${p.id}" onclick="event.stopPropagation();addToCart('${p.id}')">+ AJOUTER</button>
          </div>
        </div>
      </article>
    `;
    }).join('');
}
function filterP(f){
  state.filter = f;
  $$('.fb').forEach(b => b.classList.toggle('on', b.dataset.f === f));
  renderProducts();
}
window.filterP = filterP;

// ============ SWATCHES ============
function renderSwatches(){
  const root = $('#swatches');
  if (!root) return;
  root.innerHTML = COLORS.map(c => `
    <div class="sw" onclick="goToColor('${c.id}')">
      <div class="sw-strap" style="background:${c.hex};"></div>
      <div class="sw-label">${c.name}</div>
    </div>
  `).join('');
}

// Click a swatch → reset filter, scroll to that color's card in the grid, flash it.
function goToColor(colorId){
  if (state.filter !== 'all') {
    state.filter = 'all';
    $$('.fb').forEach(b => b.classList.toggle('on', b.dataset.f === 'all'));
    renderProducts();
  }
  // Wait a frame for the DOM to settle if we just re-rendered.
  requestAnimationFrame(() => {
    const card = document.querySelector(`.pc[data-id="${colorId}_court"]`)
              || document.querySelector(`.pc[data-id="${colorId}_grand"]`);
    if (!card) return;
    const top = card.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: 'smooth' });
    card.classList.remove('pulse');
    void card.offsetWidth;
    card.classList.add('pulse');
    setTimeout(() => card.classList.remove('pulse'), 1800);
  });
}
window.goToColor = goToColor;

// ============ PRODUCT MODAL ============
function openProduct(id){
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  $('#pm-name').textContent = p.colorName;
  $('#pm-format').textContent = p.format === 'court' ? 'COURT · 40 CM' : 'GRAND · 80 CM';
  $('#pm-price').textContent = fmtEUR(p.price);
  $('#pm-swatch').style.background = p.hex;
  $('#pm-add').onclick = () => { addToCart(id); closeProduct(); };
  const gallery = $('#pm-gallery');
  gallery.innerHTML = p.photos.map((f, i) => `
    <img class="pm-photo ${i===0?'on':''}" src="${photoUrl(f)}" data-i="${i}" alt="${p.label} ${i+1}">
  `).join('');
  const thumbs = $('#pm-thumbs');
  thumbs.innerHTML = p.photos.map((f, i) => `
    <button class="pm-thumb ${i===0?'on':''}" data-i="${i}" onclick="pmGo(${i})">
      <img src="${photoUrl(f)}" alt="thumb ${i+1}">
    </button>
  `).join('');
  $('#pm-ov').hidden = false;
  document.body.style.overflow = 'hidden';
}
function pmGo(i){
  $$('.pm-photo').forEach((el, j) => el.classList.toggle('on', j === i));
  $$('.pm-thumb').forEach((el, j) => el.classList.toggle('on', j === i));
}
function closeProduct(){
  $('#pm-ov').hidden = true;
  document.body.style.overflow = '';
}
window.openProduct = openProduct;
window.pmGo = pmGo;
window.closeProduct = closeProduct;

// ============ CART ============
function openCart(){
  renderCart();
  $('#cart-drawer').classList.add('open');
  $('#cart-ov').classList.add('show');
  $('#cart-drawer').setAttribute('aria-hidden','false');
}
function closeCart(){
  $('#cart-drawer').classList.remove('open');
  $('#cart-ov').classList.remove('show');
  $('#cart-drawer').setAttribute('aria-hidden','true');
}
window.openCart = openCart;
window.closeCart = closeCart;

function addToCart(id){
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const existing = state.cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else state.cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  showToast(`✓ ${product.label.toUpperCase()} AJOUTÉ`);
  if (!$('#cart-drawer').classList.contains('open')) {
    openCart();
  }
}
function changeQty(id, delta){
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}
function removeItem(id){
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}
window.changeQty = changeQty;
window.removeItem = removeItem;

function renderCart(){
  if (!$('#cart-count')) return;
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  $('#cart-count').textContent = count;
  $('#cart-count').style.display = count ? 'inline-block' : 'none';
  $('#cart-title-count').textContent = `(${count} ARTICLE${count > 1 ? 'S' : ''})`;

  const items = state.cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="img"><img src="${photoUrl(p.photos[0])}" alt="${p.label}"></div>
        <div>
          <div class="name">${p.colorName.toUpperCase()}</div>
          <div class="meta">${p.size} · ${p.format === 'court' ? 'COURT' : 'GRAND'}</div>
          <div class="qty">
            <button onclick="changeQty('${p.id}',-1)" aria-label="moins">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${p.id}',1)" aria-label="plus">+</button>
          </div>
          <button class="rm" onclick="removeItem('${p.id}')">SUPPRIMER</button>
        </div>
        <div class="price">${fmtEUR(p.price * item.qty)}</div>
      </div>
    `;
  }).join('');
  $('#cart-items').innerHTML = items;
  $('#cart-empty').hidden = state.cart.length > 0;
  $('#cart-footer').hidden = state.cart.length === 0;

  // Totals
  const subtotal = state.cart.reduce((s, i) => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const discount = (state.promo && PROMO_CODES[state.promo]) ? PROMO_CODES[state.promo] : 0;
  const shipping = subtotal > 0 ? 4.99 : 0;
  const total = Math.max(0, subtotal - discount + shipping);
  $('#cart-subtotal').textContent = fmtEUR(subtotal);
  $('#cart-disc').textContent = '−' + fmtEUR(discount);
  $('#cart-disc-row').hidden = !discount;
  $('#cart-total').textContent = fmtEUR(total);
  $('#promo-applied').hidden = !discount;
  if (discount) {
    $('#promo-applied').innerHTML =
      `<span>✓ CODE ${state.promo} APPLIQUÉ — −${fmtEUR(discount)}</span>` +
      `<button class="promo-remove" onclick="removePromo()" aria-label="Retirer le code">RETIRER ✕</button>`;
  }

  // Hide the newsletter offer banner once the user has subscribed,
  // dismissed the popup, or explicitly interacted with the offer.
  const banner = document.querySelector('.promo-banner');
  const offerDone = localStorage.getItem('knitly-nl-subscribed')
                 || localStorage.getItem('knitly-offer-dismissed')
                 || localStorage.getItem('knitly-nl-dismissed');
  if (banner) banner.hidden = !!offerDone;
}

function removePromo(){
  state.promo = null;
  localStorage.removeItem('knitly-promo');
  renderCart();
  showToast('✓ CODE PROMO RETIRÉ');
}
window.removePromo = removePromo;

// ============ PROMO ============
function applyPromo(){
  const input = $('#cart-promo-input');
  const code = input.value.trim().toUpperCase();
  const err = $('#promo-error');
  err.hidden = true;
  err.textContent = '';
  if (!code) {
    err.textContent = 'Veuillez saisir un code';
    err.hidden = false;
    return;
  }
  if (PROMO_CODES[code]) {
    state.promo = code;
    localStorage.setItem('knitly-promo', code);
    input.value = '';
    renderCart();
    showToast(`✓ CODE ${code} APPLIQUÉ`);
  } else {
    err.textContent = 'Code invalide';
    err.hidden = false;
    // shake input briefly
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
  }
}
window.applyPromo = applyPromo;

// ============ CHECKOUT ============
function checkout(){
  if (state.cart.length === 0) return;
  const btn = $('#btn-checkout');
  btn.disabled = true;
  btn.classList.add('loading');
  const original = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> REDIRECTION…';
  setTimeout(() => {
    window.location.href = 'checkout.html';
  }, 900);
}
window.checkout = checkout;

// ============ TOAST ============
let toastT;
function showToast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

// ============ NEWSLETTER ============
function openNL(){ $('#nl-ov').hidden = false; }
function closeNL(){
  $('#nl-ov').hidden = true;
  localStorage.setItem('knitly-nl-dismissed', '1');
}
// Triggered from the cart offer banner — dismiss the banner permanently
// regardless of whether the user actually submits the newsletter form.
function dismissOffer(){
  localStorage.setItem('knitly-offer-dismissed', '1');
  closeCart();
  openNL();
}
window.dismissOffer = dismissOffer;
function revealPromo(){
  const e = $('#nl-email').value;
  if (!e) return;
  $('#nl-promo').hidden = false;
  localStorage.setItem('knitly-nl-dismissed', '1');
  localStorage.setItem('knitly-nl-subscribed', '1');
  // Cart may already be in the DOM — refresh so the offer banner disappears.
  renderCart();
}
window.openNL = openNL;
window.closeNL = closeNL;
window.revealPromo = revealPromo;

// ============ INIT ============
function init(){
  renderProducts();
  renderSwatches();
  renderCart();
  // Auto-show newsletter after 6s on first visit
  if (!localStorage.getItem('knitly-nl-dismissed')) {
    setTimeout(openNL, 6000);
  }
  // Close cart / modal / NL on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCart(); closeNL(); closeProduct(); }
  });
  // Click outside product modal to close
  $('#pm-ov')?.addEventListener('click', e => {
    if (e.target.id === 'pm-ov') closeProduct();
  });
}
init();
