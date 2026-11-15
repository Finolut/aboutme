// =========================================================
// PENGATURAN — cukup ubah bagian ini
// =========================================================
const PORTFOLIO_URL = "";   // contoh: "https://finolut.github.io/portofolio"
const CV_URL = "";          // contoh: "cv-lutfino.pdf"
const VIDEO_SPEED = 2;      // 1 = normal, 2 = dua kali lebih cepat, 0.5 = slow-mo
const VIDEO_LOOP_POINT = 27.1; // Titik selesai animasi (detik) sebelum jeda kosong/hitam di akhir file
// =========================================================

const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// Tombol portofolio dan CV
function setupButton(id, url, download) {
  const el = document.getElementById(id);
  if (!el) return;
  if (url) {
    el.href = url;
    el.querySelector('.soon')?.remove();
    if (download) el.setAttribute('download', '');
    else { el.target = '_blank'; el.rel = 'noopener'; }
  } else {
    el.addEventListener('click', (e) => { e.preventDefault(); toast('Segera hadir, tunggu ya!'); });
  }
}
setupButton('portfolioBtn', PORTFOLIO_URL, false);
setupButton('cvBtn', CV_URL, true);

// Tombol share
const shareBtn = document.getElementById('shareBtn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const data = { title: document.title, url: location.href };
    if (navigator.share) {
      try { await navigator.share(data); } catch (e) { }
    } else {
      try { await navigator.clipboard.writeText(location.href); toast('Link disalin!'); }
      catch (e) { toast(location.href); }
    }
  });
}

// =========================================================
// PEMUTAR LAGU (file lagu.mp3)
// =========================================================
const audio = document.getElementById('audio');
const player = document.getElementById('player');
const playBtn = document.getElementById('playBtn');
const progress = document.getElementById('progress');
const bar = progress ? progress.parentElement : null;
const tNow = document.getElementById('tNow');
const tLeft = document.getElementById('tLeft');

// Status apakah user secara manual menekan jeda
let userPaused = false;

const fmt = (sec) => {
  const s = Math.max(0, Math.floor(sec || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

function render() {
  if (!audio || !player || !playBtn || !progress || !tNow || !tLeft) return;
  const playing = !audio.paused;
  player.classList.toggle('playing', playing);
  playBtn.setAttribute('aria-label', playing ? 'Jeda lagu' : 'Putar lagu');
  const d = audio.duration || 0;
  progress.style.width = d ? (audio.currentTime / d) * 100 + '%' : '0%';
  tNow.textContent = fmt(audio.currentTime);
  tLeft.textContent = '-' + fmt(d - audio.currentTime);

  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }
}

if (audio) {
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach((ev) => audio.addEventListener(ev, render));

  // Informasi media untuk sistem notifikasi HP
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Sunflower',
      artist: 'Post Malone, Swae Lee'
    });
    navigator.mediaSession.setActionHandler('play', () => {
      userPaused = false;
      audio.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      userPaused = true;
      audio.pause();
    });
  }

  // Coba putar otomatis saat halaman dibuka.
  // Kalau browser menolak (kebijakan autoplay), lagu mulai pada sentuhan pertama di layar.
  audio.play().then(() => {
    userPaused = false;
  }).catch(() => {
    const unlock = (e) => {
      if (!playBtn || !playBtn.contains(e.target)) {
        if (!userPaused) {
          audio.play().then(() => {
            userPaused = false;
          }).catch(() => {});
        }
      }
      ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.removeEventListener(t, unlock, true));
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.addEventListener(t, unlock, true));
  });

  // Tombol play/jeda
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        userPaused = false;
        audio.play().catch((err) => {
          if (audio.error || err.name === 'NotSupportedError') toast('lagu.mp3 tidak ditemukan di folder ini');
          else toast('Ketuk tombol play sekali lagi');
          console.warn('Gagal memutar:', err.name, err.message, audio.currentSrc);
        });
      } else {
        userPaused = true;
        audio.pause();
      }
    });
  }

  // Ketuk progress bar untuk loncat ke bagian lagu
  if (bar) {
    bar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const r = bar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
  }

  // Kalau file lagu tidak ditemukan
  audio.addEventListener('error', () => toast('File lagu.mp3 tidak ditemukan'));
}

// =========================================================
// VIDEO DI BAWAH CV
// =========================================================
const clip = document.getElementById('clip');
const clipVideo = document.getElementById('clipVideo');

if (clipVideo && clip) {
  function restartVideo() {
    clipVideo.currentTime = 0;
    clipVideo.play().catch(() => { });
  }

  function checkVideoLoop() {
    const loopPoint = (VIDEO_LOOP_POINT > 0 && clipVideo.duration)
      ? Math.min(VIDEO_LOOP_POINT, clipVideo.duration)
      : (clipVideo.duration || 0);

    if (loopPoint > 0 && clipVideo.currentTime >= (loopPoint - 0.08)) {
      restartVideo();
    }

    if ('requestVideoFrameCallback' in clipVideo) {
      clipVideo.requestVideoFrameCallback(checkVideoLoop);
    }
  }

  function videoSiap() {
    clipVideo.playbackRate = VIDEO_SPEED;
    clipVideo.classList.add('siap');
    clip.classList.add('ada');
    clipVideo.play().catch(() => { });

    if ('requestVideoFrameCallback' in clipVideo) {
      clipVideo.requestVideoFrameCallback(checkVideoLoop);
    }
  }

  // Loop cepat saat mencapai batas animasi atau selesai
  clipVideo.addEventListener('timeupdate', () => {
    const loopPoint = (VIDEO_LOOP_POINT > 0 && clipVideo.duration)
      ? Math.min(VIDEO_LOOP_POINT, clipVideo.duration)
      : (clipVideo.duration || 0);

    if (loopPoint > 0 && clipVideo.currentTime >= (loopPoint - 0.08)) {
      restartVideo();
    }
  });

  clipVideo.addEventListener('ended', restartVideo);

  // Perbaikan bug: video bisa sudah termuat sebelum kode ini jalan
  if (clipVideo.readyState >= 2) videoSiap();
  else clipVideo.addEventListener('loadeddata', videoSiap, { once: true });
  clipVideo.addEventListener('error', () => console.warn('bg.mp4 tidak ditemukan atau formatnya tidak didukung'));
}

// =========================================================
// KONTROL KELUAR / KEMBALI / MINIMIZE (INSTAGRAM & MOBILE WEBVIEW)
// Menghentikan lagu seketika saat user menekan 'Back', menutup tab,
// atau kembali ke Instagram feed/aplikasi lain.
// =========================================================
function jedaSemuaMedia() {
  if (audio && !audio.paused) {
    audio.pause();
  }
  if (clipVideo && !clipVideo.paused) {
    clipVideo.pause();
  }
}

function putarKembaliMedia() {
  // Hanya putar kembali jika user sebelumnya tidak sengaja mem-pause lagu
  if (audio && audio.paused && !userPaused) {
    audio.play().catch(() => {});
  }
  if (clipVideo && clipVideo.paused) {
    clipVideo.play().catch(() => {});
  }
}

// 1. Saat tab/webview disembunyikan atau dibuka kembali
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    jedaSemuaMedia();
  } else {
    putarKembaliMedia();
  }
});

// 2. Event saat browser ditutup / tombol 'Kembali' ditekan di Instagram WebView
window.addEventListener('pagehide', jedaSemuaMedia);
window.addEventListener('beforeunload', jedaSemuaMedia);
window.addEventListener('unload', jedaSemuaMedia);
window.addEventListener('freeze', jedaSemuaMedia);

// 3. Saat aplikasi kehilangan fokus (misal notifikasi IG / kembali ke feed)
window.addEventListener('blur', () => {
  // Cek apakah memang tab/halaman tidak aktif
  if (document.hidden) {
    jedaSemuaMedia();
  }
});
