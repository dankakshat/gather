(() => {
  const STORAGE_KEY = "gather-campus-events-v1";
  const REG_KEY = "gather-campus-registrations-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const addDays = (days, hour = 17) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
  const seedEvents = [
    {id:"evt-lantern",title:"Lanterns by the lake",category:"Community",date:addDays(3,18),time:"18:00",location:"East Lake Pavilion",capacity:60,description:"As the evening settles in, make a paper lantern and share a little light with the campus community.",art:"lantern",label:"AN EVENING GATHERING"},
    {id:"evt-studio",title:"Open studio: clay & fire",category:"Arts",date:addDays(5,16),time:"16:30",location:"Fine Arts · Studio 04",capacity:24,description:"Try hand-building with clay in a relaxed, beginner-friendly studio session. Materials and tea are on us.",art:"studio",label:"MAKE SOMETHING BY HAND"},
    {id:"evt-garden",title:"A slower kind of morning",category:"Wellness",date:addDays(7,8),time:"08:00",location:"Herb Garden Courtyard",capacity:30,description:"A gentle stretch, a cup of tea, and a quiet start to your day. Bring a mat if you have one.",art:"garden",label:"PAUSE / BREATHE / BEGIN"},
    {id:"evt-film",title:"Cinema under the cedars",category:"Arts",date:addDays(9,19),time:"19:30",location:"North Quad",capacity:80,description:"Bring a blanket for an open-air screening and a post-film conversation under the trees.",art:"film",label:"AFTER DARK, TOGETHER"},
    {id:"evt-lecture",title:"Ideas worth passing on",category:"Learning",date:addDays(11,12),time:"12:15",location:"Library · Reading Room",capacity:35,description:"Students and faculty share one small idea that changed how they see the world. Lunch provided.",art:"lecture",label:"A LUNCHTIME EXCHANGE"},
    {id:"evt-wellness",title:"The art of doing nothing",category:"Wellness",date:addDays(13,15),time:"15:00",location:"Quiet Room · Student Hall",capacity:18,description:"A short guided reset for busy minds: no screens, no pressure, just a little room to breathe.",art:"wellness",label:"A LITTLE ROOM TO RESET"}
  ];
  const read = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; } catch { return fallback; } };
  let events = read(STORAGE_KEY, seedEvents);
  let registrations = read(REG_KEY, []);
  let activeFilter = "all";
  const eventDialog = $("#event-dialog");
  const organizerDialog = $("#organizer-dialog");
  const confirmationDialog = $("#confirmation-dialog");
  const formatDate = (value, opts = {weekday:"short",month:"short",day:"numeric"}) => new Intl.DateTimeFormat("en", opts).format(new Date(value));
  const eventRegistrations = id => registrations.filter(r => r.eventId === id);
  const seatsLeft = event => Math.max(0, Number(event.capacity) - eventRegistrations(event.id).length);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const persist = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); localStorage.setItem(REG_KEY, JSON.stringify(registrations)); };
  const artHTML = (event, detail = false) => `<div class="${detail ? "event-detail-art" : "event-art"}" data-art="${escapeHTML(event.art || "lantern")}"><span class="art-orb"></span><span class="art-arch"></span>${detail ? "" : `<span class="art-label">${escapeHTML(event.label || event.category)}</span><span class="event-date-badge">${escapeHTML(formatDate(event.date,{month:"short",day:"2-digit"}))}<br>${escapeHTML(new Intl.DateTimeFormat("en",{weekday:"short"}).format(new Date(event.date)))}</span>`}</div>`;
  function renderEvents() {
    const query = $("#event-search").value.trim().toLowerCase();
    const visible = events.filter(event => (activeFilter === "all" || event.category === activeFilter) && (!query || `${event.title} ${event.location} ${event.category} ${event.description}`.toLowerCase().includes(query)));
    $("#all-count").textContent = String(events.length).padStart(2, "0");
    $("#event-grid").innerHTML = visible.map(event => {
      const left = seatsLeft(event);
      return `<article class="event-card" tabindex="0" role="button" aria-label="View ${escapeHTML(event.title)}" data-event="${escapeHTML(event.id)}">${artHTML(event)}<div class="event-info"><div class="event-meta"><span class="category-mark">${escapeHTML(event.category)}</span><span>${escapeHTML(event.time)}</span></div><h3>${escapeHTML(event.title)}</h3><p>${escapeHTML(event.description)}</p><div class="event-card-footer"><span>${escapeHTML(event.location)}</span><span class="seat-meter ${left < 6 ? "is-low" : ""}"><i></i>${left ? `${left} seats left` : "Fully booked"}</span><span class="card-arrow" aria-hidden="true">↗</span></div></div></article>`;
    }).join("");
    $("#empty-state").hidden = visible.length > 0;
    $$(".event-card").forEach(card => {
      card.addEventListener("click", () => openEvent(card.dataset.event));
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEvent(card.dataset.event); } });
    });
  }
  function openEvent(id) {
    const event = events.find(item => item.id === id); if (!event) return;
    const left = seatsLeft(event);
    $("#event-detail").innerHTML = `${artHTML(event,true)}<div class="detail-copy"><div class="modal-kicker">${escapeHTML(event.category)} / ${escapeHTML(formatDate(event.date,{weekday:"long",month:"long",day:"numeric"}))}</div><h2>${escapeHTML(event.title)}</h2><p>${escapeHTML(event.description)}</p><div class="detail-facts"><span>◷ &nbsp;${escapeHTML(event.time)}</span><span>⌖ &nbsp;${escapeHTML(event.location)}</span><span>◌ &nbsp;${left} of ${Number(event.capacity)} seats available</span></div>${left ? `<form id="register-form" class="register-form" data-event="${escapeHTML(event.id)}"><label>Your name<input name="name" autocomplete="name" required maxlength="70" placeholder="Full name"></label><label>Registration number<input name="registration" required maxlength="30" placeholder="Your student ID"></label><button class="button button-primary" type="submit">Reserve my seat <span>↗</span></button></form>` : `<p class="form-message">This gathering is fully booked. Check back if a seat opens.</p>`}</div>`;
    eventDialog.showModal();
    const form = $("#register-form"); if (form) form.addEventListener("submit", submitRegistration);
  }
  function submitRegistration(e) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); const id = form.dataset.event;
    const registration = String(data.get("registration")).trim(); const normalizedRegistration = registration.toLowerCase(); const name = String(data.get("name")).trim(); const event = events.find(item => item.id === id);
    if (!event) return;
    if (registrations.some(r => r.eventId === id && String(r.registration).toLowerCase() === normalizedRegistration)) { showToast("You already have a seat for this event."); return; }
    if (seatsLeft(event) <= 0) { showToast("This event has just filled up. Please choose another."); openEvent(id); return; }
    const ticket = {id:`G-${Math.random().toString(36).slice(2,8).toUpperCase()}`,eventId:id,name,registration,createdAt:new Date().toISOString()};
    registrations.push(ticket); persist(); eventDialog.close(); renderEvents(); renderOrganizerList(); openConfirmation(ticket);
  }
  function openConfirmation(ticket) {
    const event = events.find(item => item.id === ticket.eventId); if (!event) return;
    $("#confirmation-content").innerHTML = `<div class="modal-kicker">GATHER / YOUR PLACE IS HELD</div><div class="confirmation-card"><div class="confirmation-code">${escapeHTML(ticket.id)}</div><h2>${escapeHTML(event.title)}</h2><p>We’ll see you there, ${escapeHTML(ticket.name)}.</p><div class="confirmation-facts"><div><span>Date</span><strong>${escapeHTML(formatDate(event.date,{weekday:"long",month:"long",day:"numeric"}))}</strong></div><div><span>Time</span><strong>${escapeHTML(event.time)}</strong></div><div><span>Where</span><strong>${escapeHTML(event.location)}</strong></div><div><span>Student</span><strong>${escapeHTML(ticket.registration)}</strong></div></div></div><button class="button button-primary print-button" id="print-ticket" type="button">Print confirmation <span>↗</span></button>`;
    confirmationDialog.showModal(); $("#print-ticket").addEventListener("click", () => window.print());
  }
  function renderOrganizerList() {
    $("#organizer-list").innerHTML = events.length ? events.map(event => `<div class="organizer-row"><div><strong>${escapeHTML(event.title)}</strong><br><span>${escapeHTML(formatDate(event.date))} · ${escapeHTML(eventRegistrations(event.id).length)} / ${Number(event.capacity)} booked</span></div><div class="organizer-row-actions"><button type="button" data-edit="${escapeHTML(event.id)}">Edit</button><button type="button" data-delete="${escapeHTML(event.id)}">Remove</button></div></div>`).join("") : `<p class="modal-lede">No events yet. Add one above.</p>`;
    $$('[data-edit]', $("#organizer-list")).forEach(button => button.addEventListener("click", () => populateForm(button.dataset.edit)));
    $$('[data-delete]', $("#organizer-list")).forEach(button => button.addEventListener("click", () => removeEvent(button.dataset.delete)));
  }
  function populateForm(id) {
    const event = events.find(item => item.id === id); if (!event) return;
    $("#event-id").value = event.id; $("#event-title").value = event.title; $("#event-category").value = event.category; $("#event-date").value = new Date(event.date).toISOString().slice(0,10); $("#event-time").value = event.time; $("#event-capacity").value = event.capacity; $("#event-location").value = event.location; $("#event-description").value = event.description;
    $("#event-title").focus(); window.scrollTo({top:0,behavior:"smooth"});
  }
  function removeEvent(id) {
    events = events.filter(event => event.id !== id); registrations = registrations.filter(registration => registration.eventId !== id); persist(); renderEvents(); renderOrganizerList(); showToast("Event removed from this browser.");
  }
  function showToast(message) {
    $(".toast")?.remove(); const toast = document.createElement("div"); toast.className = "toast"; toast.setAttribute("role","status"); toast.textContent = message; document.body.append(toast); setTimeout(() => toast.remove(), 3300);
  }
  $$(".filter-chip").forEach(chip => chip.addEventListener("click", () => { activeFilter = chip.dataset.filter; $$(".filter-chip").forEach(c => c.classList.toggle("is-selected",c === chip)); renderEvents(); }));
  $("#event-search").addEventListener("input", renderEvents);
  $("#clear-filters").addEventListener("click", () => { activeFilter = "all"; $("#event-search").value = ""; $$(".filter-chip").forEach(c => c.classList.toggle("is-selected",c.dataset.filter === "all")); renderEvents(); });
  $$(".organizer-trigger").forEach(button => button.addEventListener("click", () => { renderOrganizerList(); organizerDialog.showModal(); }));
  $("#event-form").addEventListener("submit", e => {
    e.preventDefault(); const data = new FormData(e.currentTarget); const id = String(data.get("id") || $("#event-id").value || ""); const existing = events.find(event => event.id === id);
    const event = {id:id || `evt-${Date.now()}`,title:String(data.get("title")).trim(),category:String(data.get("category")),date:new Date(`${data.get("date")}T12:00:00`).toISOString(),time:String(data.get("time")),location:String(data.get("location")).trim(),capacity:Number(data.get("capacity")),description:String(data.get("description")).trim(),art:existing?.art || ["lantern","studio","garden","film","lecture","wellness"][events.length % 6],label:existing?.label || "A CAMPUS GATHERING"};
    if (existing) { if (event.capacity < eventRegistrations(id).length) { showToast("Capacity cannot be lower than current registrations."); return; } events = events.map(item => item.id === id ? event : item); } else events.push(event);
    persist(); e.currentTarget.reset(); $("#event-id").value = ""; $("#event-capacity").value = 30; renderEvents(); renderOrganizerList(); showToast(existing ? "Event updated." : "Event added to the calendar.");
  });
  $("#reset-demo").addEventListener("click", () => { events = seedEvents; registrations = []; persist(); $("#event-form").reset(); $("#event-id").value = ""; $("#event-capacity").value = 30; renderEvents(); renderOrganizerList(); showToast("Demo events restored and registrations cleared."); });
  $(".menu-toggle").addEventListener("click", e => { const open = $(".main-nav").classList.toggle("is-open"); e.currentTarget.setAttribute("aria-expanded",String(open)); });
  $$(".main-nav a").forEach(link => link.addEventListener("click", () => { $(".main-nav").classList.remove("is-open"); $(".menu-toggle").setAttribute("aria-expanded","false"); }));
  window.addEventListener("storage", e => { if ([STORAGE_KEY,REG_KEY].includes(e.key)) { events = read(STORAGE_KEY,seedEvents); registrations = read(REG_KEY,[]); renderEvents(); renderOrganizerList(); } });
  renderEvents();
})();
