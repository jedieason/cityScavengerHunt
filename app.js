const firebaseConfig = {
  apiKey: "AIzaSyBLWYpv72R8z4XwZE6F2y9mdy4HDdiqkHc",
  authDomain: "city-scavenger-hunt-2025.firebaseapp.com",
  databaseURL: "https://city-scavenger-hunt-2025-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "city-scavenger-hunt-2025",
  storageBucket: "city-scavenger-hunt-2025.firebasestorage.app",
  messagingSenderId: "950959276332",
  appId: "1:950959276332:web:cbbd2bd8dc49619aa42c89",
  measurementId: "G-5GE9NWQ1YP"
};

let db;
let teams = [];
let teamIndex = null;
let team = null;

function showAlert(msg) {
  const modal = document.getElementById('alert-modal');
  const textEl = document.getElementById('alert-text');
  if (!modal || !textEl) return;
  textEl.textContent = msg;
  modal.classList.add('show');
}

function hideAlert() {
  const modal = document.getElementById('alert-modal');
  if (!modal) return;
  modal.classList.remove('show');
}

async function initFirebase() {
  const app = firebase.initializeApp(firebaseConfig);
  db = firebase.database(app);
  const snapshot = await db.ref('cityScavengerHunt').get();
  teams = snapshot.val() || [];
}

async function updateCurrent(value, idx) {
  if (teamIndex === null) return;
  const updates = { current: value };
  if (typeof idx === 'number') updates.index = idx;
  await db.ref(`cityScavengerHunt/${teamIndex}`).update(updates);
  team.current = value;
  if (typeof idx === 'number') team.index = idx;
}

async function loadPage(id) {
  const res = await fetch(`${id}.html`);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const styleEl = document.getElementById('page-style');
  styleEl.textContent = doc.querySelector('style')?.textContent || '';
  const container = document.getElementById('page-container');
  container.innerHTML = doc.body.innerHTML;
  attachHandler(id);
}

function attachHandler(id) {
  if (id === '0-2') {
    setupStartPage();
    return;
  }
  const btn = document.querySelector('#page-container button.confirm-btn') ||
              document.querySelector('#page-container button[type="submit"]');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    let nextId;
    let nextIndex;
    if (id === '0-1') {
      const pwd = document.querySelector('#page-container input')?.value.trim();
      const idx = teams.findIndex(t => t.password === pwd);
      if (idx === -1) {
        showAlert('密碼錯誤');
        return;
      }
      teamIndex = idx;
      team = teams[idx];
      if (team.current && team.current !== '0-1') {
        nextId = team.current;
        nextIndex = team.index ?? team.sequence.indexOf(nextId);
      } else {
        const i0 = team.sequence.indexOf('0-1');
        nextId = team.sequence[i0 + 1];
        nextIndex = i0 + 1;
      }
    } else {
      const input = document.querySelector('#page-container input');
      if (input && input.value.trim() !== 'password') {
        showAlert('密碼錯誤');
        return;
      }
      const currIdx = team.index ?? team.sequence.indexOf(id);
      nextId = team.sequence[currIdx + 1];
      nextIndex = currIdx + 1;
    }
    if (nextId) {
      await updateCurrent(nextId, nextIndex);
      const finales = {
        '1-2': '苦盡甘來遇線你',
        '2-5-b': '內卷即地獄',
        '3-9': '我們與醫的距離'
      };
      if (finales[id]) {
        showAlert(`恭喜完成「${finales[id]}」`);
        const close = document.getElementById('alert-close');
        const handler = async () => {
          close.removeEventListener('click', handler);
          hideAlert();
          await loadPage(nextId);
        };
        close.addEventListener('click', handler);
      } else {
        await loadPage(nextId);
      }
    }
  });
}

function setupStartPage() {
  if (!team) return;
  const buttons = document.querySelectorAll('#page-container .button-group button');
  if (buttons.length < 3) return;

  const currIdx = team.index ?? team.sequence.indexOf('0-2');
  const nextId = team.sequence[currIdx + 1];
  const visited = team.sequence.slice(0, currIdx);
  const done1 = visited.includes('1-2');
  const done2 = visited.includes('2-5-b');
  const done3 = visited.includes('3-9');

  buttons.forEach(btn => {
    btn.classList.add('disabled');
    btn.disabled = true;
  });

  if (done1) buttons[0].classList.add('done');
  if (done2) buttons[1].classList.add('done');
  if (done3) buttons[2].classList.add('done');

  let idx;
  if (nextId.startsWith('1')) idx = 0;
  else if (nextId.startsWith('2')) idx = 1;
  else if (nextId.startsWith('3')) idx = 2;

  const target = buttons[idx];
  target.classList.remove('disabled');
  target.disabled = false;
  target.addEventListener('click', async () => {
    const nextIndex = currIdx + 1;
    await updateCurrent(nextId, nextIndex);
    await loadPage(nextId);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const closeBtn = document.getElementById('alert-close');
  if (closeBtn) closeBtn.addEventListener('click', hideAlert);
  await initFirebase();
  loadPage('0-1');
});
