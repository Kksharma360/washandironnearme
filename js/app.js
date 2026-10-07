const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];

// mobile navigation
const toggle=q('.menu-toggle'), nav=q('.nav-links');
toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open)});
qa('.nav-links a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

// cursor highlight
window.addEventListener('pointermove',e=>{document.documentElement.style.setProperty('--mx',`${e.clientX}px`);document.documentElement.style.setProperty('--my',`${e.clientY}px`)});
const glow=q('.cursor-glow');window.addEventListener('pointermove',e=>{if(glow){glow.style.left=`${e.clientX-160}px`;glow.style.top=`${e.clientY-160}px`}});

// reveal on scroll
const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');obs.unobserve(entry.target)}}),{threshold:.13});qa('.reveal').forEach(el=>obs.observe(el));

// counter
const counter=q('[data-counter]');if(counter){const end=+counter.dataset.counter;let done=false;const co=new IntersectionObserver(es=>{if(es[0].isIntersecting&&!done){done=true;let start=0;const step=Math.max(1,Math.ceil(end/55));const tick=()=>{start=Math.min(end,start+step);counter.textContent=start+'+';if(start<end)requestAnimationFrame(tick)};tick();co.disconnect()}},{threshold:.5});co.observe(counter)}

// dates for schedule pickup
const schedDate = q('#sched-date');
if (schedDate) {
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const toIso = d => d.toISOString().slice(0, 10);
  schedDate.min = toIso(today);
  schedDate.max = toIso(tomorrow);
  schedDate.value = toIso(today);
}

// multi-select services dropdown
const multiTrigger = q('#sched-services-trigger');
const multiDropdown = q('#multiSelectDropdown');
const multiWrap = q('#multiSelectWrap');
const placeholderText = q('#servicesPlaceholderText');
const serviceCheckboxes = qa('.multi-opt input[type="checkbox"]');

multiTrigger?.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = multiDropdown.classList.toggle('open');
  multiTrigger.setAttribute('aria-expanded', isOpen);
});

document.addEventListener('click', e => {
  if (multiWrap && !multiWrap.contains(e.target)) {
    multiDropdown?.classList.remove('open');
    multiTrigger?.setAttribute('aria-expanded', false);
  }
});

function updateSelectedServices() {
  const selected = serviceCheckboxes.filter(c => c.checked).map(c => c.value);
  if (selected.length === 0) {
    if (placeholderText) {
      placeholderText.textContent = 'Choose service(s)...';
      placeholderText.style.color = '#7b8e88';
    }
  } else if (selected.length <= 2) {
    if (placeholderText) {
      placeholderText.textContent = selected.join(', ');
      placeholderText.style.color = '#1a221f';
    }
  } else {
    if (placeholderText) {
      placeholderText.textContent = `${selected.length} services selected`;
      placeholderText.style.color = '#1a221f';
    }
  }
}
serviceCheckboxes.forEach(cb => cb.addEventListener('change', updateSelectedServices));

// map pin location
const btnPin = q('#btnPinLocation');
const pinText = q('#pinText');
const pinnedInput = q('#pinnedLocation');

btnPin?.addEventListener('click', () => {
  if (navigator.geolocation) {
    if (pinText) pinText.textContent = 'Locating...';
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        const link = `https://maps.google.com/?q=${lat},${lng}`;
        if (pinnedInput) pinnedInput.value = link;
        btnPin.classList.add('pinned');
        if (pinText) pinText.textContent = `✓ Pinned (${lat}, ${lng})`;
      },
      () => {
        const manual = prompt('Enter landmark or Gurugram society location:', 'Gurugram');
        if (manual) {
          if (pinnedInput) pinnedInput.value = manual;
          btnPin.classList.add('pinned');
          if (pinText) pinText.textContent = '✓ Location Pinned';
        } else {
          if (pinText) pinText.textContent = 'Open Map & Pin Location';
        }
      },
      { timeout: 7000 }
    );
  } else {
    const manual = prompt('Enter landmark or Gurugram society location:');
    if (manual) {
      if (pinnedInput) pinnedInput.value = manual;
      btnPin.classList.add('pinned');
      if (pinText) pinText.textContent = '✓ Location Pinned';
    }
  }
});

// booking dispatch
function getBookingMessage(data, servicesList) {
  return [
    '✦ *NEW LAUNDRY PICKUP REQUEST*',
    'Hi Wash & Iron Near Me, I want to schedule a doorstep laundry pickup.',
    '',
    `👤 *Name:* ${data.get('name') || 'N/A'}`,
    `📞 *Phone:* ${data.get('phone') || 'N/A'}`,
    `🧺 *Services:* ${servicesList.length ? servicesList.join(', ') : 'Wash & Iron'}`,
    `📍 *Area:* ${data.get('area') || 'N/A'}`,
    `🏠 *Address:* ${data.get('address') || 'N/A'}`,
    `📅 *Pickup Date:* ${data.get('pickupDate') || 'Today'}`,
    `⏰ *Preferred Time:* ${data.get('slot') || 'As early as possible'}`,
    data.get('note') ? `📝 *Note:* ${data.get('note')}` : '',
    data.get('pinnedLocation') ? `🗺️ *Map Pin:* ${data.get('pinnedLocation')}` : '',
    '',
    'Please confirm pickup availability and schedule our slot.'
  ].filter(Boolean).join('\n');
}

const schedForm = q('#bookingForm');
const btnBookWa = q('#btnBookWhatsapp');

function validateAndGetPayload() {
  if (!schedForm) return null;
  if (!schedForm.reportValidity()) return null;
  const data = new FormData(schedForm);
  const checkedServices = serviceCheckboxes.filter(c => c.checked).map(c => c.value);
  return { data, checkedServices };
}

btnBookWa?.addEventListener('click', () => {
  const payload = validateAndGetPayload();
  if (!payload) return;
  const msg = getBookingMessage(payload.data, payload.checkedServices);
  window.open(`https://wa.me/919217410047?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});

schedForm?.addEventListener('submit', e => {
  e.preventDefault();
  const payload = validateAndGetPayload();
  if (!payload) return;
  const msg = getBookingMessage(payload.data, payload.checkedServices);
  alert('✓ Pickup Request Received! Opening WhatsApp to instantly confirm your slot.');
  window.open(`https://wa.me/919217410047?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});

// reviews carousel
const cards=qa('.review-card'), dots=qa('.review-dots button');let ri=0;
function showReview(i){if(!cards.length)return;ri=(i+cards.length)%cards.length;cards.forEach((c,idx)=>c.classList.toggle('active',idx===ri));dots.forEach((d,idx)=>d.classList.toggle('active',idx===ri))}
q('.review-nav.prev')?.addEventListener('click',()=>showReview(ri-1));q('.review-nav.next')?.addEventListener('click',()=>showReview(ri+1));dots.forEach((d,i)=>d.addEventListener('click',()=>showReview(i)));setInterval(()=>showReview(ri+1),7000);

// faq
qa('.faq-item button').forEach(btn=>btn.addEventListener('click',()=>btn.parentElement.classList.toggle('open')));

// active nav on sections
const sectionIds=['home','services','pricing','process','coverage','reviews','contact'];const links=qa('.nav-links a');
const sectionObs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${e.target.id}`))}})},{rootMargin:'-30% 0px -60% 0px',threshold:0});sectionIds.forEach(id=>{const el=q(`#${id}`);if(el)sectionObs.observe(el)});

q('#year').textContent=new Date().getFullYear();
