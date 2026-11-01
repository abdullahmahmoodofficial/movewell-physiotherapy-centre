/* MoveWell — multi-step online booking (front-end demo, no server).
   Steps: 1 service -> 2 therapist -> 3 date -> 4 time slot -> 5 details -> 6 review
   -> confirmation with MW-XXXXXX reference, localStorage save + WhatsApp link.
   ?t=<service-id> and ?d=<therapist-id> pre-select steps 1 and 2.
   Exposes window.MoveWellBooking pure helpers for testing. */
(function () {
  'use strict';
  var WA = '923001234567';
  var SERVICES = [
    { id: 'initial-assessment', name: 'Initial Assessment & Treatment Plan', price: 2000, blurb: 'Full one-hour assessment + written plan' },
    { id: 'back-neck-pain-therapy', name: 'Back & Neck Pain Therapy', price: 3000, blurb: 'Per session — manual therapy + exercise' },
    { id: 'sports-injury-rehabilitation', name: 'Sports Injury Rehabilitation', price: 3500, blurb: 'Per session — staged return to sport' },
    { id: 'post-surgery-rehabilitation', name: 'Post-Surgery Rehabilitation', price: 3500, blurb: 'Per session — milestone-based recovery' },
    { id: 'stroke-neuro-rehabilitation', name: 'Stroke & Neuro Rehabilitation', price: 4000, blurb: 'Per session — balance & gait retraining' },
    { id: 'home-visit-physiotherapy', name: 'Home Visit Physiotherapy', price: 4500, blurb: 'Per visit — full treatment at your home' },
    { id: 'recovery-pack-6-sessions', name: 'Recovery Pack — 6 Sessions', price: 15000, blurb: 'Six sessions + progress review' },
    { id: 'complete-recovery-program-12-sessions', name: 'Complete Recovery Program — 12 Sessions', price: 27000, blurb: 'Twelve sessions + discharge report' }
  ];
  var DOCTORS = [
    { id: '', name: 'No preference', role: 'First available therapist', opd: 'Mon\u2013Sat, 9 AM\u20138 PM', days: [1, 2, 3, 4, 5, 6], start: 9 * 60, end: 20 * 60, step: 60 },
    { id: 'dr-ayesha-khan', name: 'Dr. Ayesha Khan', role: 'Lead Physiotherapist \u2014 pain & posture', opd: 'Mon, Wed, Fri: 9 AM\u20131 PM', days: [1, 3, 5], start: 9 * 60, end: 13 * 60, step: 30 },
    { id: 'dr-usman-tariq', name: 'Dr. Usman Tariq', role: 'Sports Rehabilitation Specialist', opd: 'Tue, Thu, Sat: 11 AM\u20133 PM', days: [2, 4, 6], start: 11 * 60, end: 15 * 60, step: 30 },
    { id: 'dr-mahnoor-fatima', name: 'Dr. Mahnoor Fatima', role: 'Neuro Rehabilitation Specialist', opd: 'Mon\u2013Sat: 4\u20138 PM', days: [1, 2, 3, 4, 5, 6], start: 16 * 60, end: 20 * 60, step: 30 }
  ];
  function findService(id) { for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) return SERVICES[i]; return null; }
  function findDoctor(id) { for (var i = 0; i < DOCTORS.length; i++) if (DOCTORS[i].id === id) return DOCTORS[i]; return DOCTORS[0]; }
  function fmtPrice(n) { return 'PKR ' + n.toLocaleString('en-PK'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseLocalDate(s) { var p = (s || '').split('-'); if (p.length !== 3) return null; var d = new Date(+p[0], +p[1] - 1, +p[2]); return isNaN(d.getTime()) ? null : d; }
  function isPastDate(s) { return !!s && s < todayStr(); }
  function isSunday(s) { var d = parseLocalDate(s); return !!d && d.getDay() === 0; }
  function doctorAvailableOn(doctorId, s) {
    var d = parseLocalDate(s); if (!d) return false;
    return findDoctor(doctorId).days.indexOf(d.getDay()) !== -1;
  }
  function formatDate(s) {
    var d = parseLocalDate(s); if (!d) return s || '';
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }
  function fmtSlot(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return h12 + ':' + pad(m) + ' ' + ap;
  }
  function getSlotsForDoctor(doctorId) {
    var doc = findDoctor(doctorId), out = [];
    for (var t = doc.start; t < doc.end; t += doc.step) out.push(fmtSlot(t));
    return out;
  }
  function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000; return h; }
  // Deterministic "already booked" slots (exactly 1 in 4, rotating by date).
  function isSeedBooked(doctorId, dateStr, slot, idx) {
    return ((hashStr(doctorId + '|' + dateStr) + idx) % 4) === 0;
  }
  function loadBookings() {
    try { var v = JSON.parse(localStorage.getItem('movewell_bookings') || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function saveBooking(b) {
    var all = loadBookings(); all.push(b);
    try { localStorage.setItem('movewell_bookings', JSON.stringify(all)); } catch (e) { /* storage unavailable: booking still confirmed on screen */ }
    return all;
  }
  function isActuallyBooked(doctorId, dateStr, slot, bookings) {
    return (bookings || loadBookings()).some(function (b) {
      return b.doctorId === doctorId && b.date === dateStr && b.slot === slot;
    });
  }
  function makeRef() {
    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', out = '';
    for (var i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return 'MW-' + out;
  }
  function buildWhatsAppText(b) {
    return 'Assalam-o-Alaikum! I would like to confirm my physiotherapy booking.\n' +
      'Booking ref: ' + b.ref + '\nName: ' + b.name + '\nPhone: ' + b.phone + '\n' +
      'Treatment: ' + b.serviceName + ' (' + fmtPrice(b.price) + ')\nTherapist: ' + b.doctorName + '\n' +
      'Date: ' + formatDate(b.date) + '\nTime: ' + b.slot + '\nNotes: ' + (b.notes || 'None');
  }
  function buildWhatsAppUrl(b) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(buildWhatsAppText(b)); }
  function validatePhone(phone) { return (phone || '').replace(/\D/g, '').length >= 10; }
  function parsePreselection(search) {
    var q = new URLSearchParams(search || ''), out = {};
    if (findService(q.get('t') || '')) out.serviceId = q.get('t');
    if (q.get('d') !== null && DOCTORS.some(function (d) { return d.id === q.get('d'); })) out.doctorId = q.get('d');
    return out;
  }
  window.MoveWellBooking = {
    SERVICES: SERVICES, DOCTORS: DOCTORS, findService: findService, findDoctor: findDoctor,
    fmtPrice: fmtPrice, todayStr: todayStr, isPastDate: isPastDate, isSunday: isSunday,
    doctorAvailableOn: doctorAvailableOn, formatDate: formatDate, getSlotsForDoctor: getSlotsForDoctor,
    isSeedBooked: isSeedBooked, isActuallyBooked: isActuallyBooked, makeRef: makeRef,
    buildWhatsAppText: buildWhatsAppText, buildWhatsAppUrl: buildWhatsAppUrl,
    validatePhone: validatePhone, parsePreselection: parsePreselection,
    loadBookings: loadBookings, saveBooking: saveBooking
  };

  // ---- UI (only runs on the appointment page) ----
  var root = document.getElementById('bookingWizard');
  if (!root) return;
  var state = { step: 1, serviceId: '', doctorId: '', date: '', slot: '', name: '', phone: '', notes: '', ref: '' };
  var pre = parsePreselection(location.search);
  if (pre.serviceId) state.serviceId = pre.serviceId;
  if (pre.doctorId !== undefined) state.doctorId = pre.doctorId;
  var svcEl = document.getElementById('bkServices'), docEl = document.getElementById('bkDoctors'),
      dateEl = document.getElementById('bkDate'), slotEl = document.getElementById('bkSlots'),
      nameEl = document.getElementById('bkName'), phoneEl = document.getElementById('bkPhone'),
      notesEl = document.getElementById('bkNotes'), errEl = document.getElementById('bkError'),
      backBtn = document.getElementById('bkBack'), nextBtn = document.getElementById('bkNext');
  if (dateEl) { dateEl.min = todayStr(); dateEl.value = ''; }

  function showErr(msg) { if (errEl) { errEl.textContent = msg || ''; errEl.style.display = msg ? 'block' : 'none'; } }
  function renderServices() {
    if (!svcEl) return;
    svcEl.innerHTML = '';
    SERVICES.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-option' + (state.serviceId === s.id ? ' selected' : '');
      b.setAttribute('aria-pressed', state.serviceId === s.id ? 'true' : 'false');
      b.innerHTML = '<b>' + s.name + '</b><span>' + s.blurb + '</span><strong>' + fmtPrice(s.price) + '</strong>';
      b.addEventListener('click', function () { state.serviceId = s.id; renderServices(); updateNav(); });
      svcEl.appendChild(b);
    });
  }
  function renderDoctors() {
    if (!docEl) return;
    docEl.innerHTML = '';
    DOCTORS.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-option' + (state.doctorId === d.id ? ' selected' : '');
      b.setAttribute('aria-pressed', state.doctorId === d.id ? 'true' : 'false');
      b.innerHTML = '<b>' + d.name + '</b><span>' + d.role + '</span><small>Hours: ' + d.opd + '</small>';
      b.addEventListener('click', function () { state.doctorId = d.id; state.slot = ''; renderDoctors(); renderSlots(); updateNav(); });
      docEl.appendChild(b);
    });
  }
  function renderSlots() {
    if (!slotEl) return;
    slotEl.innerHTML = '';
    var doc = findDoctor(state.doctorId);
    var note = document.getElementById('bkSlotNote');
    if (!state.date) { if (note) note.textContent = 'Choose a date first to see available times.'; return; }
    if (isSunday(state.date)) { if (note) note.textContent = 'The centre is closed on Sundays. Please choose a Monday\u2013Saturday date.'; return; }
    if (!doctorAvailableOn(state.doctorId, state.date)) {
      if (note) note.textContent = doc.name + ' is not available on that weekday (Hours: ' + doc.opd + '). Please choose another date, or select \u201cNo preference\u201d.';
      return;
    }
    if (note) note.textContent = 'Showing ' + doc.name + ' \u2014 ' + doc.opd + '. Greyed-out times are already booked.';
    var bookings = loadBookings();
    getSlotsForDoctor(state.doctorId).forEach(function (slot, idx) {
      var booked = isSeedBooked(state.doctorId, state.date, slot, idx) || isActuallyBooked(state.doctorId, state.date, slot, bookings);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-slot' + (state.slot === slot ? ' selected' : '') + (booked ? ' booked' : '');
      b.textContent = slot; b.disabled = booked;
      if (booked) b.title = 'Already booked';
      b.setAttribute('aria-pressed', state.slot === slot ? 'true' : 'false');
      b.addEventListener('click', function () { state.slot = slot; renderSlots(); updateNav(); });
      slotEl.appendChild(b);
    });
  }
  function renderReview() {
    var el = document.getElementById('bkReview'); if (!el) return;
    var s = findService(state.serviceId), d = findDoctor(state.doctorId);
    el.innerHTML =
      '<div><span>Treatment</span><b>' + s.name + '</b></div>' +
      '<div><span>Price</span><b>' + fmtPrice(s.price) + ' (confirmed before treatment)</b></div>' +
      '<div><span>Therapist</span><b>' + d.name + ' \u2014 ' + d.role + '</b></div>' +
      '<div><span>Date</span><b>' + formatDate(state.date) + '</b></div>' +
      '<div><span>Time</span><b>' + state.slot + '</b></div>' +
      '<div><span>Patient</span><b>' + state.name + ' \u2014 ' + state.phone + '</b></div>' +
      '<div><span>Notes</span><b>' + (state.notes || 'None') + '</b></div>';
  }
  function showStep(n) {
    state.step = n;
    for (var i = 1; i <= 6; i++) {
      var p = document.getElementById('bkStep' + i);
      if (p) p.classList.toggle('on', i === n);
    }
    document.querySelectorAll('.bk-progress li').forEach(function (li, idx) {
      li.classList.toggle('done', idx + 1 < n);
      li.classList.toggle('current', idx + 1 === n);
    });
    if (n === 4) renderSlots();
    if (n === 6) renderReview();
    updateNav(); showErr('');
    var top = document.getElementById('bookingWizard');
    if (top && n > 1) top.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  function updateNav() {
    if (backBtn) backBtn.style.visibility = state.step === 1 ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.textContent = state.step === 6 ? 'Confirm Booking \u2192' : (state.step === 5 ? 'Review Booking \u2192' : 'Continue \u2192');
  }
  function validateStep(n) {
    if (n === 1) return state.serviceId ? '' : 'Please choose a treatment to continue.';
    if (n === 2) return ''; // therapist optional (No preference is a valid choice)
    if (n === 3) {
      if (!state.date) return 'Please choose a date.';
      if (isPastDate(state.date)) return 'That date has already passed. Please choose today or a future date.';
      if (isSunday(state.date)) return 'The centre is closed on Sundays. Please choose a Monday\u2013Saturday date.';
      if (!doctorAvailableOn(state.doctorId, state.date)) return findDoctor(state.doctorId).name + ' is not available on that weekday. Please choose another date.';
      return '';
    }
    if (n === 4) return state.slot ? '' : 'Please choose an available time slot.';
    if (n === 5) {
      if (!state.name.trim()) return 'Please enter the patient\u2019s full name.';
      if (!validatePhone(state.phone)) return 'Please enter a valid phone number (at least 10 digits).';
      return '';
    }
    return '';
  }
  if (backBtn) backBtn.addEventListener('click', function () { if (state.step > 1) showStep(state.step - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () {
    if (state.step === 6) { confirmBooking(); return; }
    var err = validateStep(state.step);
    if (err) { showErr(err); return; }
    showStep(state.step + 1);
  });
  if (dateEl) dateEl.addEventListener('change', function () { state.date = dateEl.value; state.slot = ''; renderSlots(); updateNav(); });
  if (nameEl) nameEl.addEventListener('input', function () { state.name = nameEl.value; });
  if (phoneEl) phoneEl.addEventListener('input', function () { state.phone = phoneEl.value; });
  if (notesEl) notesEl.addEventListener('input', function () { state.notes = notesEl.value; });
  document.querySelectorAll('[data-goto-step]').forEach(function (btn) {
    btn.addEventListener('click', function () { showStep(parseInt(btn.getAttribute('data-goto-step'), 10)); });
  });
  function confirmBooking() {
    var s = findService(state.serviceId), d = findDoctor(state.doctorId);
    if (!s) { showErr('Please choose a treatment first.'); showStep(1); return; }
    state.ref = makeRef();
    var booking = {
      ref: state.ref, serviceId: s.id, serviceName: s.name, price: s.price,
      doctorId: state.doctorId, doctorName: d.name, date: state.date, slot: state.slot,
      name: state.name.trim(), phone: state.phone.trim(), notes: state.notes.trim(),
      createdAt: new Date().toISOString()
    };
    saveBooking(booking);
    var conf = document.getElementById('bkConfirm');
    var refEl = document.getElementById('bkRef'), sumEl = document.getElementById('bkConfirmSummary'),
        waEl = document.getElementById('bkWhatsApp');
    if (refEl) refEl.textContent = booking.ref;
    if (sumEl) sumEl.innerHTML = '<b>' + s.name + ' \u2014 ' + fmtPrice(s.price) + '</b><br>' + d.name + ' \u00b7 ' + formatDate(state.date) + ' at ' + state.slot + '<br>' + booking.name + ' \u00b7 ' + booking.phone;
    if (waEl) waEl.href = buildWhatsAppUrl(booking);
    var wiz = document.getElementById('bkWizardPanels'); if (wiz) wiz.style.display = 'none';
    var nav = document.getElementById('bkNav'); if (nav) nav.style.display = 'none';
    var prog = document.querySelector('.bk-progress'); if (prog) prog.style.display = 'none';
    if (conf) { conf.style.display = 'block'; conf.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
  }
  var again = document.getElementById('bkAgain');
  if (again) again.addEventListener('click', function () {
    state = { step: 1, serviceId: '', doctorId: '', date: '', slot: '', name: '', phone: '', notes: '', ref: '' };
    if (dateEl) dateEl.value = '';
    if (nameEl) nameEl.value = ''; if (phoneEl) phoneEl.value = ''; if (notesEl) notesEl.value = '';
    var wiz = document.getElementById('bkWizardPanels'); if (wiz) wiz.style.display = '';
    var nav = document.getElementById('bkNav'); if (nav) nav.style.display = '';
    var prog = document.querySelector('.bk-progress'); if (prog) prog.style.display = '';
    var conf = document.getElementById('bkConfirm'); if (conf) conf.style.display = 'none';
    renderServices(); renderDoctors(); renderSlots(); showStep(1);
  });
  renderServices(); renderDoctors(); showStep(1);
})();
