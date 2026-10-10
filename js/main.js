/* =========================================================
   CẤU HÌNH – sửa thông tin ở đây
   ========================================================= */
const CONFIG = {
  // Số điện thoại của Công Tuấn, ví dụ "0901 234 567". Để trống thì hiện "đang cập nhật".
  phone: "0918047901",

  eventStart: "2026-10-17T10:00:00+07:00",
  eventEnd: "2026-10-17T12:00:00+07:00",
  eventTitle: "Lễ tốt nghiệp của Công Tuấn 🎓",
  eventPlace:
    "Sảnh A, Trường Đại học Tôn Đức Thắng, 19 Nguyễn Hữu Thọ, Phường Tân Hưng, TP. Hồ Chí Minh",

  // Bong bóng gợi ý hiện thường trực sau khi chibi nói xong
  hint: "Ấn vào tui để nghe dặn dò nè 👆",
  // Câu chibi nói khi vừa chạy xuống góc phải
  dockGreeting: "Tui theo bạn xuống đây nè! 🏃",
  // Chibi ở góc: đang cuộn thì giấu gợi ý, ngừng cuộn 1,5 giây thì hiện lại (và giữ luôn)
  dockHintAfterScrollMs: 1500,

  // Âm lượng nhạc nền (0 → 1). Nhạc tự phát khi vào trang; trình duyệt chặn thì phát ở lần chạm đầu tiên.
  musicVolume: 0.45,

  // Lời dặn dò – mỗi lần ấn chibi nói lần lượt 1 câu, hết thì quay lại câu đầu
  reminders: [
    "Lễ bắt đầu 10h sáng thứ Bảy 17/10 nha, đừng trễ nhé! ⏰",
    "Nhớ mang CCCD theo nha! Sinh viên trường thì mang thẻ sinh viên 🪪",
    "Bảo vệ hỏi thì đọc MSSV của tui: 52200033 nha!",
    "Đi xe máy thì vào cổng 7 hoặc cổng 9 nha 🛵",
    "Đi ô tô thì vào cổng 9, có bãi đỗ riêng 🚗",
    "Đi xe công nghệ thì xuống cổng 1 hoặc 2 cho đỡ đi bộ nha 🚕",
    "Gặp nhau ở Sảnh A nhé!",
    "Lạc đường thì gọi tui liền nhen 📞",
    "Có bạn đến là tui vui lắm luôn 💛",
  ],
};

const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ---------- Lời chào theo tên: ?to=Minh ---------- */
const guest = (new URLSearchParams(location.search).get("to") || "")
  .trim()
  .slice(0, 40);
if (guest) {
  $("#greeting").textContent = `Gửi ${guest} thân mến,`;
  $("#guestName").textContent = guest;
  document.title = `${guest} ơi, mời bạn dự Lễ tốt nghiệp của Công Tuấn!`;
}

/* ---------- Pháo giấy ---------- */
const COLORS = [
  "#ff5d73",
  "#ffc2cc",
  "#ffd166",
  "#ffffff",
  "#a8dadc",
  "#4a3350",
];
function burst(opts = {}) {
  if (reduceMotion || typeof window.confetti !== "function") return;
  window.confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 38,
    colors: COLORS,
    origin: { y: 0.55 },
    ...opts,
  });
}

/* ---------- Bong bóng thoại (dùng chung cho chibi lớn và chibi ở góc) ---------- */
let reminderIndex = 0; // 2 chibi dùng chung → lời dặn nói tiếp chứ không lặp lại từ đầu
function nextReminder() {
  const text = CONFIG.reminders[reminderIndex];
  reminderIndex = (reminderIndex + 1) % CONFIG.reminders.length;
  return text;
}

function createTalker(bubble) {
  let timer;
  let awake = true;
  let speaking = false;

  function show(text, isHint) {
    bubble.textContent = text;
    bubble.classList.remove("is-shown");
    bubble.classList.toggle("bubble--hint", isHint);
    void bubble.offsetWidth; // chạy lại animation
    bubble.classList.add("is-shown");
  }

  function showHint() {
    if (!awake || speaking) return;
    clearTimeout(timer);
    show(CONFIG.hint, true);
  }

  // Chỉ ẩn lời gợi ý; câu dặn dò đang nói thì để nói cho xong
  function hideHint() {
    if (speaking) return;
    clearTimeout(timer);
    bubble.classList.remove("is-shown");
  }

  // Nói 1 câu → ẩn bong bóng → hiện lại lời gợi ý "ấn vào tui"
  function say(text) {
    if (!awake) return;
    clearTimeout(timer);
    speaking = true;
    show(text, false);
    const readMs = Math.max(2600, text.length * 75); // câu dài thì giữ lâu hơn
    timer = setTimeout(() => {
      speaking = false;
      bubble.classList.remove("is-shown");
      timer = setTimeout(showHint, 500);
    }, readMs);
  }

  function sleep() {
    awake = false;
    speaking = false;
    clearTimeout(timer);
    bubble.classList.remove("is-shown");
  }

  function wake(text) {
    awake = true;
    clearTimeout(timer);
    if (text) say(text);
    else timer = setTimeout(showHint, 300);
  }

  return { say, sleep, wake, showHint, hideHint };
}

// Nhảy tưng 1 cái rồi quay về trạng thái thở
function hop(el) {
  el.classList.remove("is-idle", "is-hopping", "is-waving");
  void el.offsetWidth;
  el.classList.add("is-hopping");
}
function onHopEnd(el) {
  el.addEventListener("animationend", (e) => {
    if (e.animationName !== "hop") return;
    el.classList.remove("is-hopping");
    el.classList.add("is-idle");
  });
}

/* ---------- Chibi lớn: nhảy lên → vẫy chào → thở ---------- */
const chibi = $("#chibi");
const bubble = $("#bubble");
const heroTalker = createTalker(bubble);

chibi.addEventListener("animationend", function onEnter(e) {
  if (e.animationName !== "jumpIn") return;
  chibi.removeEventListener("animationend", onEnter);
  chibi.classList.remove("is-entering");
  chibi.classList.add("is-waving", "is-idle");
  heroTalker.say(guest ? `Hello ${guest}! 👋` : "Hello bạn! 👋");
  burst({ origin: { x: 0.25, y: 0.5 }, angle: 60 });
  burst({ origin: { x: 0.75, y: 0.5 }, angle: 120 });
});

chibi.addEventListener("click", () => {
  if (chibi.classList.contains("is-entering")) return;
  hop(chibi);
  heroTalker.say(nextReminder());
  burst({ particleCount: 40, spread: 60, origin: { y: 0.45 } });
});
// Ấn vào bong bóng gợi ý cũng tính như ấn vào chibi
bubble.addEventListener("click", () => chibi.click());
onHopEnd(chibi);

/* ---------- Chibi chạy xuống góc phải khi lướt qua ---------- */
const dock = $("#dock");
const dockChibi = $("#dockChibi");
const dockBubble = $("#dockBubble");
const dockTalker = createTalker(dockBubble);
dockTalker.sleep();

function showDock() {
  if (dock.classList.contains("is-in")) return;
  heroTalker.sleep();
  dock.hidden = false;
  dock.classList.remove("is-out");
  dockChibi.className = "dock__chibi is-running";
  dock.classList.add("is-in");
}

function hideDock() {
  if (!dock.classList.contains("is-in")) return;
  dockTalker.sleep();
  dock.classList.remove("is-in");
  dock.classList.add("is-out");
  heroTalker.wake();
}

// Chạy tới nơi → nhún → chào → hiện gợi ý
dockChibi.addEventListener("animationend", (e) => {
  if (e.animationName !== "land") return;
  dockChibi.className = "dock__chibi is-idle";
  dockTalker.wake(CONFIG.dockGreeting);
});
// Chạy đi xong thì ẩn hẳn
dock.addEventListener("animationend", (e) => {
  if (e.animationName === "runOut" && dock.classList.contains("is-out")) {
    dock.hidden = true;
    dock.classList.remove("is-out");
  }
});

dockChibi.addEventListener("click", () => {
  if (dockChibi.classList.contains("is-running")) return;
  hop(dockChibi);
  dockTalker.say(nextReminder());
  burst({
    particleCount: 35,
    spread: 55,
    startVelocity: 30,
    origin: { x: 0.88, y: 0.85 },
    angle: 110,
  });
});
dockBubble.addEventListener("click", () => dockChibi.click());
onHopEnd(dockChibi);

// Đang cuộn thì giấu lời gợi ý cho đỡ che nội dung; ngừng cuộn một lúc thì hiện lại
let scrollIdleTimer;
window.addEventListener(
  "scroll",
  () => {
    if (
      !dock.classList.contains("is-in") ||
      dockChibi.classList.contains("is-running")
    )
      return;
    dockTalker.hideHint();
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(
      dockTalker.showHint,
      CONFIG.dockHintAfterScrollMs,
    );
  },
  { passive: true },
);

// Theo dõi chibi lớn: cuộn qua khỏi màn hình → gọi chibi nhỏ ra góc; cuộn lên lại → cất đi
if ("IntersectionObserver" in window) {
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) hideDock();
      else if (entry.boundingClientRect.top < 0) showDock();
    },
    { threshold: 0, rootMargin: "-25% 0px 0px 0px" },
  ).observe($(".stage"));
}

/* ---------- Nhạc nền ---------- */
const bgm = $("#bgm");
const musicBtn = $("#musicBtn");
let userPausedMusic = false; // khách đã tự tắt thì không tự bật lại
let resumeOnReturn = false;

bgm.volume = CONFIG.musicVolume;
// Có file nhạc mới hiện nút (file có thể đã tải xong trước khi script chạy)
const revealMusicButton = () => {
  musicBtn.hidden = false;
};
if (bgm.readyState >= 1) revealMusicButton();
else bgm.addEventListener("loadedmetadata", revealMusicButton, { once: true });

// Trình duyệt chặn phát nhạc (khách chưa chạm vào trang) → chờ lần chạm / bấm phím đầu tiên
const GESTURES = ["pointerdown", "touchend", "keydown"];
function startOnFirstGesture(e) {
  if (e && musicBtn.contains(e.target)) return; // chạm vào nút nhạc → để nút tự xử lý
  GESTURES.forEach((t) =>
    document.removeEventListener(t, startOnFirstGesture, true),
  );
  if (!userPausedMusic && bgm.paused) playMusic();
}
function playMusic() {
  bgm.play().catch(() => {
    GESTURES.forEach((t) =>
      document.addEventListener(t, startOnFirstGesture, true),
    );
  });
}
function syncMusicButton() {
  const playing = !bgm.paused;
  musicBtn.classList.toggle("is-playing", playing);
  musicBtn.setAttribute("aria-pressed", String(playing));
  musicBtn.setAttribute(
    "aria-label",
    playing ? "Tắt nhạc nền" : "Bật nhạc nền",
  );
}
bgm.addEventListener("play", syncMusicButton);
bgm.addEventListener("pause", syncMusicButton);

musicBtn.addEventListener("click", () => {
  if (bgm.paused) {
    userPausedMusic = false;
    playMusic();
  } else {
    userPausedMusic = true;
    bgm.pause();
  }
});

// Vào trang (kể cả tải lại) là phát luôn. Trang mở ở tab nền thì đợi khách chuyển sang mới phát.
if (document.hidden) resumeOnReturn = true;
else playMusic();

// Chuyển sang app khác / khoá màn hình thì tạm dừng, quay lại thì phát tiếp
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    resumeOnReturn = !bgm.paused;
    bgm.pause();
  } else if (resumeOnReturn) {
    playMusic();
  }
});

/* ---------- Phong bì → thiệp ---------- */
const envelope = $("#envelope");
const card = $("#inviteCard");
$("#openEnvelope").addEventListener("click", () => {
  if (envelope.classList.contains("is-open")) return;
  envelope.classList.add("is-open");
  if (!userPausedMusic) playMusic();
  setTimeout(
    () => {
      envelope.classList.add("is-gone");
      card.hidden = false;
      burst({ particleCount: 120, spread: 100, origin: { y: 0.4 } });
      // cuộn theo section (thiệp đang có transform nên đo sẽ lệch)
      $("#invite").scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    reduceMotion ? 0 : 900,
  );
});

/* ---------- Link Google Calendar ---------- */
(function calendar() {
  const fmt = (iso) => iso.slice(0, 19).replace(/[-:]/g, ""); // giờ địa phương
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", CONFIG.eventTitle);
  url.searchParams.set(
    "dates",
    `${fmt(CONFIG.eventStart)}/${fmt(CONFIG.eventEnd)}`,
  );
  url.searchParams.set("ctz", "Asia/Ho_Chi_Minh");
  url.searchParams.set("location", CONFIG.eventPlace);
  url.searchParams.set(
    "details",
    "Nhớ mang CCCD (hoặc thẻ sinh viên) nha! Thiệp: " +
      location.origin +
      location.pathname,
  );
  $("#calendarLink").href = url.toString();
})();

/* ---------- Đếm ngược ---------- */
(function countdown() {
  const start = new Date(CONFIG.eventStart).getTime();
  const end = new Date(CONFIG.eventEnd).getTime();
  const box = $("#countdown");
  const note = $("#countdownNote");
  const cells = {
    days: box.querySelector('[data-unit="days"]'),
    hours: box.querySelector('[data-unit="hours"]'),
    minutes: box.querySelector('[data-unit="minutes"]'),
    seconds: box.querySelector('[data-unit="seconds"]'),
  };
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const now = Date.now();
    if (now >= start) {
      box.hidden = true;
      note.hidden = false;
      note.textContent =
        now < end
          ? "🎉 Buổi lễ đang diễn ra – vào Sảnh A nha!"
          : "💛 Cảm ơn mọi người đã đến chung vui cùng Tuấn!";
      return;
    }
    let s = Math.floor((start - now) / 1000);
    cells.days.textContent = Math.floor(s / 86400);
    cells.hours.textContent = pad(Math.floor((s %= 86400) / 3600));
    cells.minutes.textContent = pad(Math.floor((s %= 3600) / 60));
    cells.seconds.textContent = pad(s % 60);
    setTimeout(tick, 1000 - (now % 1000));
  }
  tick();
})();

/* ---------- Số điện thoại ---------- */
(function phone() {
  const link = $("#phoneLink");
  const raw = CONFIG.phone.trim();
  if (!raw) {
    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
    return;
  }
  link.textContent = `📞 ${raw}`;
  link.href = `tel:${raw.replace(/[^\d+]/g, "")}`;
})();

/* ---------- Copy MSSV ---------- */
const toast = $("#toast");
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 1800);
}
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      showToast("Đã copy MSSV ✅");
    } catch {
      showToast(`MSSV: ${btn.dataset.copy}`);
    }
  });
});

/* ---------- Phóng to sơ đồ ---------- */
const mapDialog = $("#mapDialog");
$("#openMap").addEventListener("click", () => mapDialog.showModal());
mapDialog.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]") || e.target === mapDialog)
    mapDialog.close();
});

/* ---------- Hiện dần khi cuộn tới ---------- */
(function reveal() {
  const items = document.querySelectorAll("main .section > :not(.invite)");
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  items.forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
})();
