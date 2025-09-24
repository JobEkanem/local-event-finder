/* Local Event Finder - script.js
   - Events and bookmarks persist to localStorage
   - Add events, filter, bookmark, delete locally
*/

'use strict';

/* ---------- Sample events (used only if no saved data) ---------- */
const SAMPLE_EVENTS = [
  { id: 1, name: "Live Jazz Night", category: "Music", date: "2025-09-25", location: "Downtown Club", description: "" },
  { id: 2, name: "Tech Startup Meetup", category: "Tech", date: "2025-09-27", location: "Innovation Hub", description: "" },
  { id: 3, name: "Farmers Market", category: "Food", date: "2025-09-28", location: "Central Park", description: "" },
  { id: 4, name: "Yoga in the Park", category: "Fitness", date: "2025-09-29", location: "Riverside Park", description: "" },
  { id: 5, name: "Coding Bootcamp", category: "Tech", date: "2025-10-02", location: "Online", description: "" }
];

/* ---------- Selectors ---------- */
const eventContainer = document.getElementById('eventContainer');
const bookmarkContainer = document.getElementById('bookmarkContainer');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const dateFilter = document.getElementById('dateFilter');
const filterBtn = document.getElementById('filterBtn');
const clearFilterBtn = document.getElementById('clearFilterBtn');

const addEventForm = document.getElementById('addEventForm');
const eventCategorySelect = document.getElementById('eventCategorySelect');
const newCategoryRow = document.getElementById('newCategoryRow');
const newCategoryInput = document.getElementById('newCategoryInput');
const formMessage = document.getElementById('formMessage');
const resetBtn = document.getElementById('resetBtn');

/* ---------- State (loaded from localStorage when available) ---------- */
let events = loadEventsFromStorage();
let bookmarks = loadBookmarksFromStorage();

/* ---------- Initial render ---------- */
updateCategoryOptions();
displayEvents(events);
renderBookmarks();

/* ---------- Storage helpers ---------- */
function loadEventsFromStorage() {
  try {
    const raw = localStorage.getItem('events');
    if (!raw) return [...SAMPLE_EVENTS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...SAMPLE_EVENTS];
  } catch (e) {
    console.error('Failed to load events:', e);
    return [...SAMPLE_EVENTS];
  }
}
function saveEventsToStorage() {
  localStorage.setItem('events', JSON.stringify(events));
}
function loadBookmarksFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('bookmarks')) || [];
  } catch {
    return [];
  }
}
function saveBookmarksToStorage() {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

/* ---------- Display events ---------- */
function displayEvents(list) {
  eventContainer.innerHTML = '';
  if (!list || list.length === 0) {
    eventContainer.innerHTML = '<p>No events found.</p>';
    return;
  }

  list.forEach(ev => {
    const card = document.createElement('article');
    card.className = 'event-card';
    card.innerHTML = `
      <h3>${escapeHtml(ev.name)}</h3>
      <p class="event-meta">📌 ${escapeHtml(ev.location)} &nbsp; • &nbsp; 📅 ${escapeHtml(ev.date)} &nbsp; • &nbsp; 🏷️ ${escapeHtml(ev.category)}</p>
      ${ev.description ? `<p>${escapeHtml(ev.description)}</p>` : ''}
      <div class="card-actions">
        <button class="bookmark-btn" data-id="${ev.id}">
          ${bookmarks.includes(ev.id) ? 'Remove Bookmark' : '⭐ Bookmark'}
        </button>
        <button class="delete-btn" data-id="${ev.id}" title="Delete event">Delete</button>
      </div>
    `;
    eventContainer.appendChild(card);
  });
}

/* ---------- Filtering ---------- */
function filterEvents() {
  const keyword = (searchInput.value || '').toLowerCase().trim();
  const category = categoryFilter.value;
  const date = dateFilter.value;

  const filtered = events.filter(e => {
    const matchesKeyword = !keyword || e.name.toLowerCase().includes(keyword) || e.location.toLowerCase().includes(keyword);
    const matchesCategory = !category || category === '' ? true : e.category === category;
    const matchesDate = !date || date === '' ? true : e.date === date;
    return matchesKeyword && matchesCategory && matchesDate;
  });

  displayEvents(filtered);
}

/* ---------- Bookmarks ---------- */
function toggleBookmark(eventId) {
  const id = Number(eventId);
  if (bookmarks.includes(id)) {
    bookmarks = bookmarks.filter(x => x !== id);
  } else {
    bookmarks.push(id);
  }
  saveBookmarksToStorage();
  filterEvents(); // re-render so button text updates
  renderBookmarks();
}
function renderBookmarks() {
  bookmarkContainer.innerHTML = '';
  if (!bookmarks.length) {
    bookmarkContainer.textContent = 'No bookmarks yet.';
    return;
  }
  bookmarks.forEach(id => {
    const e = events.find(ev => ev.id === id);
    if (!e) return;
    const row = document.createElement('div');
    row.className = 'bookmarked-item';
    row.innerHTML = `<div>${escapeHtml(e.name)} (${escapeHtml(e.date)}) — ${escapeHtml(e.location)}</div>
                     <div><button class="bookmark-remove" data-id="${e.id}">Remove</button></div>`;
    bookmarkContainer.appendChild(row);
  });
}

/* ---------- Add / Delete events ---------- */
addEventForm.addEventListener('submit', function (ev) {
  ev.preventDefault();

  const name = document.getElementById('eventName').value.trim();
  const location = document.getElementById('eventLocation').value.trim();
  const date = document.getElementById('eventDate').value;
  const categorySelectVal = eventCategorySelect.value;
  const category = categorySelectVal === '__other__' ? (newCategoryInput.value || '').trim() : categorySelectVal;
  const description = document.getElementById('eventDescription').value.trim();

  // Basic validation
  if (!name) return showFormMessage('Please provide a name for the event.', 'error');
  if (!location) return showFormMessage('Please provide a location.', 'error');
  if (!date) return showFormMessage('Please select a date.', 'error');
  if (!category) return showFormMessage('Please choose or enter a category.', 'error');

  const newEvent = {
    id: Date.now(), // simple unique id
    name, location, date, category, description
  };

  events.push(newEvent);
  saveEventsToStorage();

  updateCategoryOptions();
  filterEvents();
  showFormMessage('Event added successfully!', 'success');
  addEventForm.reset();
  newCategoryRow.classList.add('hidden');
});

function deleteEvent(id) {
  const numId = Number(id);
  events = events.filter(e => e.id !== numId);
  bookmarks = bookmarks.filter(b => b !== numId);
  saveEventsToStorage();
  saveBookmarksToStorage();
  updateCategoryOptions();
  filterEvents();
  renderBookmarks();
}

/* ---------- Category options (keeps filter + add form in sync) ---------- */
function getUniqueCategories() {
  const set = new Set(events.map(e => e.category).filter(Boolean));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

function updateCategoryOptions() {
  // For filter
  const categories = getUniqueCategories();
  categoryFilter.innerHTML = `<option value="">All Categories</option>`;
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  });

  // For add-event select
  eventCategorySelect.innerHTML = '';
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    eventCategorySelect.appendChild(opt);
  });
  // Add a special "Other" option
  const otherOpt = document.createElement('option');
  otherOpt.value = '__other__';
  otherOpt.textContent = 'Other (create new)';
  eventCategorySelect.appendChild(otherOpt);
}

/* ---------- Event delegation for dynamic buttons ---------- */
eventContainer.addEventListener('click', (e) => {
  const bookmarkBtn = e.target.closest('.bookmark-btn');
  if (bookmarkBtn) {
    const id = bookmarkBtn.dataset.id;
    toggleBookmark(id);
    return;
  }
  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (confirm('Delete this event? This cannot be undone.')) {
      deleteEvent(id);
    }
    return;
  }
});

bookmarkContainer.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.bookmark-remove');
  if (removeBtn) {
    const id = Number(removeBtn.dataset.id);
    bookmarks = bookmarks.filter(b => b !== id);
    saveBookmarksToStorage();
    filterEvents();
    renderBookmarks();
  }
});

/* ---------- Category select change (show new category input) ---------- */
eventCategorySelect.addEventListener('change', () => {
  if (eventCategorySelect.value === '__other__') {
    newCategoryRow.classList.remove('hidden');
  } else {
    newCategoryRow.classList.add('hidden');
    newCategoryInput.value = '';
  }
});

/* ---------- Filters and UI bindings ---------- */
filterBtn.addEventListener('click', filterEvents);
searchInput.addEventListener('input', filterEvents);
categoryFilter.addEventListener('change', filterEvents);
dateFilter.addEventListener('change', filterEvents);
clearFilterBtn.addEventListener('click', () => {
  searchInput.value = '';
  categoryFilter.value = '';
  dateFilter.value = '';
  filterEvents();
});

resetBtn.addEventListener('click', () => {
  addEventForm.reset();
  newCategoryRow.classList.add('hidden');
  formMessage.textContent = '';
});

/* ---------- Utility helpers ---------- */
function showFormMessage(message, type = 'success') {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type === 'error' ? 'error' : 'success'}`;
  setTimeout(() => {
    formMessage.textContent = '';
    formMessage.className = 'form-message';
  }, 3500);
}

function escapeHtml(str = '') {
  // Simple HTML escape to avoid accidental injection from event text
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
