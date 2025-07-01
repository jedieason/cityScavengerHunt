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

async function initFirebase() {
  const app = firebase.initializeApp(firebaseConfig);
  db = firebase.database(app);
  const snapshot = await db.ref('cityScavengerHunt').get();
  teams = snapshot.val() || [];
}

async function updateCurrent(value) {
  if (teamIndex === null) return;
  await db.ref(`cityScavengerHunt/${teamIndex}/current`).set(value);
  team.current = value;
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
  const btn = document.querySelector('#page-container button.confirm-btn') ||
              document.querySelector('#page-container button[type="submit"]');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    let nextId;
    if (id === '0-1') {
      const pwd = document.querySelector('#page-container input')?.value.trim();
      const idx = teams.findIndex(t => t.password === pwd);
      if (idx === -1) {
        alert('密碼錯誤');
        return;
      }
      teamIndex = idx;
      team = teams[idx];
      nextId = team.sequence[team.sequence.indexOf('0-1') + 1];
    } else {
      const input = document.querySelector('#page-container input');
      if (input && input.value.trim() !== 'password') {
        alert('密碼錯誤');
        return;
      }
      const currIdx = team.sequence.indexOf(id);
      nextId = team.sequence[currIdx + 1];
    }
    if (nextId) {
      await updateCurrent(nextId);
      await loadPage(nextId);
    }
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  await initFirebase();
  loadPage('0-1');
});
