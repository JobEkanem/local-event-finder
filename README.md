# local-event-finder

This app aggregates and organizes local events for easy browsing and bookmarking
1.	Event Search & Filter
2.	Event Cards Grid
3.	Bookmark / “My Events”
4.	Interactive Map (Optional)


📂 File Structure
event-finder/
│── index.html
│── style.css
│── script.js


Pseudo Code (Core Logic):
// Data Structure
events = [
  { id:1, name:"Farmers Market", date:"2025-09-28", category:"Food", location:"Downtown" }
]

// Filter events
function filterEvents(category, date) {
   return events.filter(e => 
      (category ? e.category === category : true) &&
      (date ? e.date === date : true)
   );
}

// Display events
function displayEvents(filteredEvents) {
   filteredEvents.forEach(e => {
      createCard(e);
   })
}

// Bookmark
function toggleBookmark(eventId) {
   let saved = localStorage.getItem("bookmarks") || [];
   if(saved.includes(eventId)) remove(eventId);
   else saved.push(eventId);
   localStorage.setItem("bookmarks", saved);
   updateUI();
}

// Map Integration (Bonus)
function showOnMap(event) {
   map.addMarker(event.location);
}
