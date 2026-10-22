(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOTAL = 4;
  const AUTO_HINT_AFTER = 3;
  let solved = 0;

  const goTo = (el, delay = 0) => setTimeout(() => el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), delay);

  /* ---------- House state ---------- */
  function render() {
    $$('.room').forEach((room) => {
      const n = Number(room.dataset.room);
      room.classList.toggle('locked', n > solved + 1);
      room.classList.toggle('solved', n <= solved);
      $('.solved-note', room).hidden = n > solved;
    });
    $$('.slot').forEach((s) => s.classList.toggle('got', Number(s.dataset.item) <= solved));
    $$('.house .win').forEach((w) => w.classList.toggle('lit', Number(w.dataset.room) <= solved));
    $('#inv-count').textContent = `${solved}/${TOTAL}`;
  }

  function solve(n) {
    if (solved >= n) return;
    setTimeout(() => {
      solved = n;
      render();
      const slot = $(`.slot[data-item="${n}"]`);
      slot.classList.remove('bump'); void slot.offsetWidth; slot.classList.add('bump');
      if (n < TOTAL) goTo($(`#room-${n + 1}`), 1600);
      else if (!reduceMotion) $('#visitor-name').focus({ preventScroll: true });
    }, 1100);
  }

  /* ---------- Point-and-click scenes ---------- */
  const scenes = {
    1: {
      answer: 'plug',
      start: 'Tap the objects to investigate.',
      win: 'It’s alive! Plugged in and working.',
      lines: {
        monitor: 'Black screen. Not even a blink.',
        keyboard: 'You type "hello?". Nothing happens.',
        mug: 'Cold coffee. Very IT support.',
        note: 'The sticky note says: "Rule #1: check the obvious."',
        outlet: 'An empty outlet. Suspicious...',
      },
      onSolve() {
        $('#cable').setAttribute('d', 'M210 120 Q236 150 250 160 Q268 166 282 163');
        $('#plug').setAttribute('x', '274');
        $('#plug').setAttribute('y', '158');
        $('#pc-text').textContent = 'Hello!';
      },
      onReset() {
        $('#cable').setAttribute('d', 'M210 120 Q236 150 240 176 Q244 186 262 184');
        $('#plug').setAttribute('x', '260');
        $('#plug').setAttribute('y', '178');
        $('#pc-text').textContent = '';
      },
    },
    2: {
      answer: 'robot',
      start: 'Tap the objects to investigate.',
      win: 'Found it! The remote was inside the robot. Class can start!',
      lines: {
        board: 'AI 101. The lesson is ready. The projector isn’t.',
        screen: 'A blank screen and 30 kids staring at it.',
        drawer: 'Chalk, three pencils and a lot of confiscated slime.',
        laptop: 'A student’s prompt: "make the robot dance". Not now.',
        projector: 'It needs its remote. Where would kids hide it?',
        backpack: 'Snacks, a soccer ball and zero remotes.',
      },
      onSolve() { $('#proj-text').textContent = 'Hello, class!'; },
      onReset() { $('#proj-text').textContent = ''; },
    },
    3: {
      answer: 'salt',
      start: 'Tap the objects to investigate.',
      win: 'Coarse salt, nothing else. Now that’s a churrasco!',
      lines: {
        tv: 'The match is on. Priorities, but not yet.',
        grill: 'The fire is ready. The meat isn’t.',
        picanha: 'Beautiful fat cap. It’s missing something, though.',
        cooler: 'Cold drinks for later. Not what the meat needs.',
        ketchup: 'Ketchup on picanha? Absolutely not.',
        charcoal: 'The fire is already perfect. Don’t touch it.',
      },
    },
    4: {
      answer: 'backpack',
      start: 'Tap the objects to investigate.',
      win: 'There it is: your new badge! Beep. The door slides open.',
      lines: {
        plant: 'A plant. Very on-brand for an agro company.',
        coffee: 'Coffee later. Door first.',
        door: 'Locked. Glass doors are polite but firm.',
        reader: 'A card reader with a little light. It’s waiting for something.',
      },
    },
  };

  function showHint(n) {
    const wrap = $(`#room-${n} .hint-wrap`);
    $('.hint-box', wrap).hidden = false;
    $('.hint-btn', wrap).hidden = true;
  }

  Object.entries(scenes).forEach(([key, sc]) => {
    const n = Number(key);
    const svg = $(`#scene-${n}`);
    sc.misses = 0;
    const tap = (id) => {
      if (solved >= n || svg.classList.contains('solved')) return;
      if (id === sc.answer) {
        svg.classList.add('solved');
        if (sc.onSolve) sc.onSolve();
        $(`#msg-${n}`).textContent = sc.win;
        solve(n);
        return;
      }
      $(`#msg-${n}`).textContent = sc.lines[id] || 'Nothing useful here.';
      sc.misses++;
      if (sc.misses >= AUTO_HINT_AFTER) showHint(n);
    };
    $$('.obj', svg).forEach((el) => {
      el.addEventListener('click', () => tap(el.dataset.obj));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(el.dataset.obj); }
      });
    });
  });

  $$('.hint-btn').forEach((b) => b.addEventListener('click', () => showHint(Number(b.dataset.room))));

  function resetScenes() {
    Object.entries(scenes).forEach(([key, sc]) => {
      const n = Number(key);
      $(`#scene-${n}`).classList.remove('solved');
      if (sc.onReset) sc.onReset();
      sc.misses = 0;
      $(`#msg-${n}`).textContent = sc.start;
      const wrap = $(`#room-${n} .hint-wrap`);
      $('.hint-box', wrap).hidden = true;
      $('.hint-btn', wrap).hidden = false;
    });
  }

  /* ---------- Ending ---------- */
  function finish(name) {
    $('#visitor').textContent = name;
    $('#finale').hidden = false;
    goTo($('#finale'), 300);
  }

  $('#name-form').addEventListener('submit', (e) => {
    e.preventDefault();
    finish($('#visitor-name').value.trim() || 'friend');
  });

  /* ---------- Videos ---------- */
  const videos = $$('.clip video');
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !reduceMotion) en.target.play().catch(() => {});
      else if (!en.isIntersecting) en.target.pause();
    });
  }, { threshold: 0.35 }) : null;
  videos.forEach((v) => {
    if (io) io.observe(v);
    v.addEventListener('click', () => { if (v.paused) v.play().catch(() => {}); else v.pause(); });
  });
  $$('.clip .sound').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = $('video', btn.parentElement);
      const turnOn = v.muted;
      videos.forEach((o) => { o.muted = true; });
      $$('.clip .sound').forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.textContent = 'Sound on'; });
      if (turnOn) {
        v.muted = false;
        v.currentTime = 0;
        v.play().catch(() => {});
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = 'Sound off';
      }
    });
  });

  /* ---------- Start, skip & replay ---------- */
  $('#start').addEventListener('click', () => goTo($('#room-1')));

  $('#skip').addEventListener('click', () => {
    Object.entries(scenes).forEach(([key, sc]) => {
      const n = Number(key);
      $(`#scene-${n}`).classList.add('solved');
      if (sc.onSolve) sc.onSolve();
    });
    solved = TOTAL;
    render();
    finish('friend');
  });

  $('#replay').addEventListener('click', () => {
    solved = 0;
    resetScenes();
    $('#visitor-name').value = '';
    $('#finale').hidden = true;
    render();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  resetScenes();
  render();
})();
