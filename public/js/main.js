  AOS.init({ once: true, duration: 800, easing: 'ease-out-cubic' });

  // Kelopak bunga melayang di halaman sampul
  const petalContainer = document.getElementById('petals');
  if (petalContainer) {
    const petalCount = 18;
    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.animationDuration = (7 + Math.random() * 6) + 's';
      petal.style.animationDelay = (Math.random() * 8) + 's';
      const size = 6 + Math.random() * 6;
      petal.style.width = size + 'px';
      petal.style.height = size + 'px';
      petal.style.background = i % 3 === 0 ? 'var(--gold-light)' : 'var(--gold)';
      petalContainer.appendChild(petal);
    }
  }

  // Guest name from URL (?to= or ?name=) -> populate cover + prefill RSVP name
  const params = new URLSearchParams(window.location.search);
  const guestRaw = params.get('to') || params.get('name') || '';
  if (guestRaw) {
    const guestName = decodeURIComponent(guestRaw.replace(/\+/g, ' ')).trim();
    const guestEl = document.getElementById('guestName');
    if (guestEl) guestEl.textContent = guestName;
    const wNameInput = document.getElementById('wName');
    if (wNameInput && !wNameInput.value) wNameInput.value = guestName;
    document.title = `Undangan — ${guestName} — Ichsan & Nur`;
  }

  // Open invitation (gapura gate animation)
  const cover = document.getElementById('cover');
  const openBtn = document.getElementById('openBtn');
  openBtn.addEventListener('click', () => {
    cover.classList.add('opened');
    document.body.classList.remove('locked');
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.3 },
      colors: ['#C9A34E', '#E8D5A0', '#5C1327']
    });
    setTimeout(() => { cover.style.display = 'none'; }, 1500);
  });

  // Countdown timer (Menuju Hari Bahagia → 00:00 WIB tanggal 11 Oktober 2026)
  const weddingDate = new Date('2026-10-11T00:00:00+07:00').getTime();
  function updateCountdown() {
    const now = new Date().getTime();
    const diff = weddingDate - now;
    if (diff <= 0) {
      ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => document.getElementById(id).textContent = '00');
      return;
    }
    const d = Math.ceil(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
    document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
    document.getElementById('cd-mins').textContent = String(m).padStart(2,'0');
    document.getElementById('cd-secs').textContent = String(s).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Toggle tombol konfirmasi kehadiran
  const attendButtons = document.querySelectorAll('.attend-btn');
  const wStatusInput = document.getElementById('wStatus');
  attendButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      attendButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      wStatusInput.value = btn.dataset.value;
    });
  });

  // Simpan ke Google Calendar
  const calendarBtn = document.getElementById('calendarBtn');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const start = '20261011T010000Z'; // 08:00 WIB
      const end = '20261011T100000Z';   // 17:00 WIB
      const title = encodeURIComponent('Pernikahan Ichsan & Nur');
      const details = encodeURIComponent('Akad Nikah & Resepsi Pernikahan Ichsan & Nur');
      const location = encodeURIComponent('Bekasi, Jawa Barat');
      const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
      window.open(url, '_blank');
    });
  }

  // Highlight menu aktif di bottom nav saat scroll
  const navLinks = document.querySelectorAll('.bottom-nav a');
  const navSections = Array.from(navLinks).map(a => document.querySelector(a.getAttribute('href')));
  window.addEventListener('scroll', () => {
    let current = navSections[0];
    navSections.forEach(sec => {
      if (sec && window.scrollY >= sec.offsetTop - 140) current = sec;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', document.querySelector(a.getAttribute('href')) === current);
    });
  });

  // Toggle detail amplop digital (Info)
  document.querySelectorAll('.gift-row-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const detail = document.getElementById(btn.dataset.target);
      const isOpen = detail.classList.contains('open');
      document.querySelectorAll('.gift-row-detail.open').forEach(d => d.classList.remove('open'));
      if (!isOpen) detail.classList.add('open');
    });
  });

  // Copy account number
  function copyAcc(id) {
    const el = document.getElementById(id);
    const text = el.textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
      const btn = el.nextElementSibling;
      const old = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check me-1"></i>Tersalin';
      setTimeout(() => { btn.innerHTML = old; }, 1800);
    });
  }

  // RSVP Form submit only - no public wish list
  const wishForm = document.getElementById('wishForm');

  wishForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('wName').value.trim();
    const status = document.getElementById('wStatus').value;
    const msg = document.getElementById('wMsg').value.trim();
    if (!name || !msg) return;

    try {
      const res = await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status, msg })
      });
      if (!res.ok) throw new Error('Server error');
      await res.json();
    } catch (err) {
      alert('Gagal mengirim ucapan. Coba lagi.');
      return;
    }

    wishForm.reset();
    attendButtons.forEach(b => b.classList.toggle('active', b.dataset.value === 'Hadir'));

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C9A34E', '#E8D5A0']
    });
  });

  // Closing confetti
  document.getElementById('confettiBtn').addEventListener('click', () => {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#C9A34E', '#E8D5A0', '#5C1327', '#0D3B2E'] });
  });

  // Doa & Ucapan - fetch and render
  async function loadDoaUcapan() {
    const container = document.getElementById('doaScroll');
    const hint = document.getElementById('doaHint');
    if (!container) return;

    try {
      const res = await fetch('/api/rsvps');
      if (!res.ok) throw new Error('Failed to fetch');
      const wishes = await res.json();

      container.innerHTML = '';
      if (!wishes.length) {
        container.innerHTML = '<div class="doa-card" style="width:100%; text-align:center;"><p style="color:#a8988a;">Belum ada doa dan ucapan. Jadilah yang pertama!</p></div>';
        if (hint) hint.style.display = 'none';
        return;
      }

      wishes.forEach(w => {
        const card = document.createElement('div');
        card.className = 'doa-card';
        const ts = w.timestamp || w.created_at;
        const date = ts ? new Date(ts).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
        card.innerHTML = `
          <div class="dc-name">${escapeHtml(w.name)}</div>
          <div class="dc-status"><i class="fa-solid fa-circle-check me-1"></i>${escapeHtml(w.status)}</div>
          <div class="dc-msg">"${escapeHtml(w.message)}"</div>
          <div class="dc-time">${date}</div>
        `;
        container.appendChild(card);
      });

      if (hint) {
        const showHint = container.scrollWidth > container.clientWidth;
        hint.style.display = showHint ? 'block' : 'none';
      }
    } catch (err) {
      container.innerHTML = '<div class="doa-card" style="width:100%; text-align:center;"><p style="color:#a8988a;">Gagal memuat doa dan ucapan.</p></div>';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadDoaUcapan();

  // Music player
  const bgMusic = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');

  if (bgMusic && musicToggle) {
    bgMusic.volume = 0.4;

    const tryPlay = () => {
      bgMusic.play().then(() => {
        musicToggle.classList.add('playing');
        musicToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
        document.removeEventListener('click', tryPlay);
        document.removeEventListener('touchstart', tryPlay);
      }).catch(() => {});
    };

    document.addEventListener('click', tryPlay);
    document.addEventListener('touchstart', tryPlay);

    musicToggle.addEventListener('click', () => {
      if (bgMusic.paused) {
        bgMusic.play().then(() => {
          musicToggle.classList.add('playing');
          musicToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
        });
      } else {
        bgMusic.pause();
        musicToggle.classList.remove('playing');
        musicToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    });
  }

