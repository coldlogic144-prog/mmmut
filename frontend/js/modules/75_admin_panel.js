// ============================================================================
// SECTION: 75_admin_panel.js
// Admin dashboard/users/timetable-editor/calendar/holidays/posts/requests
// Source: index.html lines 6865-7450 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        function openAdminPanel() {
            if (!isAdmin) { showToast('You are not an admin.'); return; }
            document.getElementById('adminPanel').classList.add('open');
            switchAdminTab(adminTab || 'dashboard');
        }

        function closeAdminPanel() { document.getElementById('adminPanel').classList.remove('open'); }

        function switchAdminTab(tab) {
            adminTab = tab;
            document.querySelectorAll('.admin-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tab);
            });
            document.querySelectorAll('.admin-panel-body .tab-content').forEach(t => {
                t.classList.toggle('active', t.id === 'tab-' + tab);
            });
            if (tab === 'dashboard') renderAdminDashboard();
            if (tab === 'users') renderAdminUsers();
            if (tab === 'timetable') renderAdminTimetable();
            if (tab === 'calendar') renderAdminCalendar();
            if (tab === 'holidays') renderAdminHolidays();
            if (tab === 'posts') renderAdminPosts();
            if (tab === 'requests') renderAdminRequests();
            if (tab === 'feedback') renderAdminFeedback();
            if (tab === 'rollverify') renderAdminRollVerify();
        }

        // ========== ADMIN: DASHBOARD ==========
        async function renderAdminDashboard() {
            const el = document.getElementById('adminDashboardContent');
            try {
                const usersSnap = await getDocs(usersCollection);
                const totalUsers = usersSnap.size;
                const adminUsers = usersSnap.docs.filter(d => d.data().isAdmin).length;
                const requestsSnap = await getDocs(query(adminRequestsCollection, where('status', '==', 'pending')));
                const pendingRequests = requestsSnap.size;
                const postsSnap = await getDocs(postsCollection);
                const totalPosts = postsSnap.size;
                const holidaysSnap = await getDocs(holidaysCollection);
                const totalHolidays = holidaysSnap.size;
                const fbSnap = await getDocs(feedbackCollection);
                const totalFeedback = fbSnap.size;
                const cpSnap = await getDocs(communityPostsCollection);
                const totalCommunityPosts = cpSnap.size;
                el.innerHTML = `
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;">
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalUsers}</div><div style="font-size:12px;color:var(--ink-soft);">Total Users</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${adminUsers}</div><div style="font-size:12px;color:var(--ink-soft);">Admins</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${pendingRequests}</div><div style="font-size:12px;color:var(--ink-soft);">Pending Admin Requests</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalPosts}</div><div style="font-size:12px;color:var(--ink-soft);">Announcements</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalHolidays}</div><div style="font-size:12px;color:var(--ink-soft);">Holidays</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalFeedback}</div><div style="font-size:12px;color:var(--ink-soft);">Feedback Tickets</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalCommunityPosts}</div><div style="font-size:12px;color:var(--ink-soft);">Community Posts</div></div>
              </div>
              <div style="font-size:13px;color:var(--ink-soft);">Welcome to the admin panel. Use the tabs above to manage users, timetable, calendar, holidays, announcements, admin requests, and feedback.</div>
            `;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading dashboard: ${e.message}</div>`;
            }
        }

        // ========== ADMIN: USERS ==========
        async function renderAdminUsers() {
            const el = document.getElementById('adminUsersContent');
            try {
                const snap = await getDocs(usersCollection);
                let users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const q = String(window.adminUsersSearch || '').trim().toLowerCase();
                if (q) {
                    users = users.filter(u =>
                        String(u.name || '').toLowerCase().includes(q) ||
                        String(u.username || '').toLowerCase().includes(q) ||
                        String(u.rollNumber || '').toLowerCase().includes(q) ||
                        String(u.pendingRollNumber || '').toLowerCase().includes(q));
                }
                let html = `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
                <input id="adminUsersSearchBox" style="flex:1;min-width:220px;padding:9px 12px;border-radius:8px;border:1px solid var(--paper-line);background:#fff;font-size:13px;color:var(--ink);" placeholder="Search by name, roll number or username…" value="${escapeHtml(window.adminUsersSearch || '')}" oninput="window.adminUsersSearch=this.value;renderAdminUsers();" />
                <span style="font-size:12px;color:var(--ink-soft);">${users.length} account(s)</span>
              </div>
              <div style="font-size:12.5px;color:var(--ink-soft);margin-bottom:10px;">⚠️ Delete permanently removes the student's profile and frees their linked roll number. You cannot delete your own signed-in account.</div>
              <div style="overflow-x:auto;max-height:500px;overflow-y:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead style="background:var(--ink);color:#F1ECDD;position:sticky;top:0;">
                    <tr><th style="padding:10px 8px;text-align:left;">Name</th><th style="padding:10px 8px;text-align:left;">Roll No.</th><th style="padding:10px 8px;text-align:left;">Username</th><th style="padding:10px 8px;text-align:left;">Branch</th><th style="padding:10px 8px;text-align:left;">Sec</th><th style="padding:10px 8px;text-align:left;">Hostel</th><th style="padding:10px 8px;text-align:left;">Gender</th><th style="padding:10px 8px;text-align:left;">Admin</th><th style="padding:10px 8px;text-align:left;">Actions</th></tr>
                  </thead>
                  <tbody>
            `;
                users.forEach(u => {
                    const branch = getBranch(u.branchId);
                    const roll = u.rollNumber || u.pendingRollNumber || '';
                    html += `
                <tr style="border-bottom:1px solid var(--paper-line);">
                  <td style="padding:8px;">${escapeHtml(u.name || '—')}</td>
                  <td style="padding:8px;" class="mono">${roll ? escapeHtml(roll) : '—'}</td>
                  <td style="padding:8px;" class="mono">${escapeHtml(u.username || '—')}</td>
                  <td style="padding:8px;">${branch ? escapeHtml(branch.name.replace('B.Tech — ', '').replace('B.Tech - ', '')) : escapeHtml(u.branchId || '—')}</td>
                  <td style="padding:8px;">${escapeHtml(u.section || '—')}</td>
                  <td style="padding:8px;">${escapeHtml(u.hostel || 'Day Scholar')}</td>
                  <td style="padding:8px;">${escapeHtml(u.gender || 'Not specified')}</td>
                  <td style="padding:8px;">${u.isAdmin ? '✅' : '—'}</td>
                  <td style="padding:8px;white-space:nowrap;">${u.id === currentUid
                      ? '<span style="color:var(--ink-soft);font-size:12px;">you</span>'
                      : '<button style="background:var(--brick-soft);color:var(--brick);border:none;border-radius:8px;padding:6px 12px;font-weight:600;font-size:12px;cursor:pointer;" onclick="adminDeleteUser(\'' + u.id + '\',\'' + escapeHtml(u.username || '') + '\',\'' + roll + '\')">🗑 Delete</button>'}</td>
                </tr>
              `;
                });
                html += `</tbody></table></div>`;
                el.innerHTML = html;
                if (q) {
                    const sb = document.getElementById('adminUsersSearchBox');
                    if (sb) { sb.focus(); try { sb.setSelectionRange(sb.value.length, sb.value.length); } catch (e) { /* ignore */ } }
                }
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading users: ${e.message}</div>`;
            }
        }

        // ========== ADMIN: DELETE USER ==========
        // Permanently removes a user's profile document and frees their claimed
        // roll number so someone else can link it again. The Firebase Auth record
        // itself cannot be deleted from the client SDK — but without a
        // users/{uid} profile the account can no longer load (login shows
        // "Could not load your profile"), so access is effectively revoked.
        async function adminDeleteUser(uid, username, roll) {
            if (!isAdmin) { showToast('You are not an admin.'); return; }
            if (!uid) return;
            if (uid === currentUid) { showToast('You cannot delete the account you are currently signed in with.'); return; }
            const label = username || uid;
            const msg = 'Permanently delete the account "' + label + '"?' +
                (roll ? '\n\nTheir roll number ' + roll + ' will also be unlinked so it can be claimed again.' : '') +
                '\n\nThis action cannot be undone.';
            if (!window.confirm(msg)) return;
            try {
                await deleteDoc(doc(usersCollection, uid));
            } catch (e) {
                showToast('Delete failed: ' + e.message);
                return;
            }
            let note = '';
            if (roll) {
                try {
                    await deleteDoc(doc(userRollsCollection, roll));
                } catch (e) {
                    note = ' ⚠ Roll ' + roll + ' could not be unlinked automatically — remove it from the userRolls collection manually.';
                }
            }
            showToast('🗑 Account deleted: ' + label + '.' + note);
            renderAdminUsers();
        }

        // ========== ADMIN: TIMETABLE ==========
        let ttEditBranch = 'cse',
            ttEditSection = 'A',
            ttEditDay = 'Monday',
            ttEditPeriod = 'I';

        async function renderAdminTimetable() {
            const el = document.getElementById('adminTimetableContent');
            const branch = getBranch(ttEditBranch);
            if (!branch) { el.innerHTML = `<div class="empty-note">Select a branch.</div>`; return; }
            let html = `
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
              <div><label style="font-size:11px;font-weight:600;display:block;color:var(--ink-soft);">Branch</label>
                <select id="ttBranch" onchange="ttEditBranch=this.value;renderAdminTimetable();">
                  ${BRANCHES.map(b => `<option value="${b.id}" ${b.id===ttEditBranch?'selected':''}>${b.name}</option>`).join('')}
                </select>
              </div>
              <div><label style="font-size:11px;font-weight:600;display:block;color:var(--ink-soft);">Section</label>
                <select id="ttSection" onchange="ttEditSection=this.value;renderAdminTimetable();">
                  ${branch.sections.map(s => `<option value="${s}" ${s===ttEditSection?'selected':''}>${s}</option>`).join('')}
                </select>
              </div>
              <div><label style="font-size:11px;font-weight:600;display:block;color:var(--ink-soft);">Day</label>
                <select id="ttDay" onchange="ttEditDay=this.value;renderAdminTimetable();">
                  ${DAYS.map(d => `<option value="${d}" ${d===ttEditDay?'selected':''}>${d}</option>`).join('')}
                </select>
              </div>
              <div><label style="font-size:11px;font-weight:600;display:block;color:var(--ink-soft);">Period</label>
                <select id="ttPeriod" onchange="ttEditPeriod=this.value;renderAdminTimetable();">
                  ${TEACH_PERIODS.map(p => `<option value="${p.key}" ${p.key===ttEditPeriod?'selected':''}>${p.key}</option>`).join('')}
                </select>
              </div>
            </div>
          `;
            const schedule = buildSchedule(branch, ttEditSection);
            const dayData = schedule[ttEditDay];
            const cell = dayData ? dayData[ttEditPeriod] : null;
            let override = null;
            try {
                const q = query(timetableOverridesCollection,
                    where('branchId', '==', ttEditBranch),
                    where('section', '==', ttEditSection),
                    where('day', '==', ttEditDay),
                    where('period', '==', ttEditPeriod)
                );
                const snap = await getDocs(q);
                if (!snap.empty) override = { id: snap.docs[0].id, ...snap.docs[0].data() };
            } catch (e) {}
            const current = override || cell || { code: '—', name: 'Self Study / Library', type: 'Free' };
            html += `
            <div class="admin-card">
              <div style="font-weight:600;margin-bottom:8px;">Editing: ${ttEditDay}, Period ${ttEditPeriod}</div>
              <div style="font-size:13px;margin-bottom:12px;">Current: <b>${current.code}</b> — ${current.name} (${current.type})</div>
              <form id="ttEditForm" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" onsubmit="event.preventDefault();saveTimetableOverride();">
                <div><label style="font-size:11px;font-weight:600;color:var(--ink-soft);">Subject Code</label>
                  <input id="ttCode" value="${current.code !== '—' ? current.code : ''}" placeholder="e.g. BSM-110"></div>
                <div><label style="font-size:11px;font-weight:600;color:var(--ink-soft);">Subject Name</label>
                  <input id="ttName" value="${current.name !== 'Self Study / Library' ? current.name : ''}" placeholder="e.g. Engineering Mathematics I"></div>
                <div><label style="font-size:11px;font-weight:600;color:var(--ink-soft);">Type</label>
                  <select id="ttType">
                    <option value="Lecture" ${current.type==='Lecture'?'selected':''}>Lecture</option>
                    <option value="Tutorial" ${current.type==='Tutorial'?'selected':''}>Tutorial</option>
                    <option value="Practical" ${current.type==='Practical'?'selected':''}>Practical</option>
                    <option value="Free" ${current.type==='Free'?'selected':''}>Free / Self Study</option>
                  </select>
                </div>
                <div style="display:flex;align-items:flex-end;gap:8px;">
                  <button type="submit" class="btn-primary" style="width:auto;padding:10px 24px;margin:0;">Save Override</button>
                  ${override ? `<button type="button" class="btn-danger" style="width:auto;padding:10px 20px;margin:0;" onclick="deleteTimetableOverride('${override.id}')">Delete</button>` : ''}
                </div>
              </form>
              <div style="margin-top:10px;font-size:11px;color:var(--ink-soft);">Overrides are stored per branch+section+day+period. Leave code/name blank for "Free".</div>
            </div>
          `;
            el.innerHTML = html;
        }
        window.ttEditBranch = 'cse';
        window.ttEditSection = 'A';
        window.ttEditDay = 'Monday';
        window.ttEditPeriod = 'I';
        window.renderAdminTimetable = renderAdminTimetable;

        async function saveTimetableOverride() {
            const branchId = document.getElementById('ttBranch')?.value || ttEditBranch;
            const section = document.getElementById('ttSection')?.value || ttEditSection;
            const day = document.getElementById('ttDay')?.value || ttEditDay;
            const period = document.getElementById('ttPeriod')?.value || ttEditPeriod;
            const code = document.getElementById('ttCode').value.trim() || '—';
            const name = document.getElementById('ttName').value.trim() || 'Self Study / Library';
            const type = document.getElementById('ttType').value;
            try {
                const q = query(timetableOverridesCollection,
                    where('branchId', '==', branchId),
                    where('section', '==', section),
                    where('day', '==', day),
                    where('period', '==', period)
                );
                const snap = await getDocs(q);
                const data = { branchId, section, day, period, code, name, type,
                    updatedBy: currentUser ? currentUser.username : 'admin', updatedAt: serverTimestamp() };
                if (snap.empty) {
                    await addDoc(timetableOverridesCollection, data);
                    showToast('Timetable override saved.');
                } else {
                    await updateDoc(doc(timetableOverridesCollection, snap.docs[0].id), data);
                    showToast('Timetable override updated.');
                }
                const branch = getBranch(branchId);
                if (branch && currentUser) {
                    scheduleCache = buildSchedule(branch, currentUser.section);
                    renderSchedule();
                    renderHistoryView();
                }
                renderAdminTimetable();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deleteTimetableOverride(id) {
            if (!confirm('Delete this timetable override?')) return;
            try {
                await deleteDoc(doc(timetableOverridesCollection, id));
                showToast('Override deleted.');
                const branch = getBranch(ttEditBranch);
                if (branch && currentUser) { scheduleCache = buildSchedule(branch, currentUser.section);
                    renderSchedule();
                    renderHistoryView(); }
                renderAdminTimetable();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.saveTimetableOverride = saveTimetableOverride;
        window.deleteTimetableOverride = deleteTimetableOverride;

        // ========== ADMIN: CALENDAR ==========
        async function renderAdminCalendar() {
            const el = document.getElementById('adminCalendarContent');
            try {
                const snap = await getDocs(eventOverridesCollection);
                const customEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const allEvents = [...BUILTIN_EVENTS.map(e => ({ ...e, isBuiltin: true })), ...customEvents.map(e => ({ ...e,
                        isBuiltin: false }))];
                allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
                let html = `
              <div class="admin-form">
                <div class="full"><label>Title</label><input id="calTitle" placeholder="e.g. Minor Test Examination"></div>
                <div><label>Start Date</label><input id="calStart" type="date" value="2026-08-01"></div>
                <div><label>End Date</label><input id="calEnd" type="date" value="2026-08-01"></div>
                <div class="form-actions">
                  <button class="btn-primary" onclick="addCalendarEvent()">Add Event</button>
                </div>
              </div>
              <div style="margin-top:16px;max-height:400px;overflow-y:auto;">
            `;
                allEvents.forEach(e => {
                    const isCustom = !e.isBuiltin;
                    const range = e.start === e.end ?
                        new Date(e.start + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric',
                            month: 'short',
                            year: 'numeric' }) :
                        `${new Date(e.start+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${new Date(e.end+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`;
                    html += `
                <div class="admin-card">
                  <div class="row">
                    <div class="left">
                      <div class="title">${e.title} ${e.isBuiltin ? '<span style="font-size:10px;color:var(--ink-soft);">(built-in)</span>' : ''}</div>
                      <div class="sub">${range}</div>
                    </div>
                    <div class="actions">
                      ${isCustom ? `<button class="btn-sm delete" onclick="deleteCalendarEvent('${e.id}')">Delete</button>` : ''}
                    </div>
                  </div>
                </div>
              `;
                });
                html += `</div>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading calendar: ${e.message}</div>`;
            }
        }

        async function addCalendarEvent() {
            const title = document.getElementById('calTitle').value.trim();
            const start = document.getElementById('calStart').value;
            const end = document.getElementById('calEnd').value;
            if (!title || !start || !end) { showToast('Fill in all fields.'); return; }
            if (new Date(start) > new Date(end)) { showToast('Start date must be before end date.'); return; }
            try {
                await addDoc(eventOverridesCollection, { title, start, end, updatedBy: currentUser ? currentUser
                        .username :
                        'admin', updatedAt: serverTimestamp(), isCustom: true });
                showToast('Event added.');
                renderAdminCalendar();
                renderEvents();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deleteCalendarEvent(id) {
            if (!confirm('Delete this event?')) return;
            try {
                await deleteDoc(doc(eventOverridesCollection, id));
                showToast('Event deleted.');
                renderAdminCalendar();
                renderEvents();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.addCalendarEvent = addCalendarEvent;
        window.deleteCalendarEvent = deleteCalendarEvent;

        // ========== ADMIN: HOLIDAYS ==========
        async function renderAdminHolidays() {
            const el = document.getElementById('adminHolidaysContent');
            try {
                const snap = await getDocs(holidaysCollection);
                const holidayDocs = snap.docs.map(d => ({ id: d.id, date: d.data().date }));
                let html = `
              <div class="admin-form">
                <div class="full"><label>Add Holiday</label>
                  <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <input type="date" id="holidayDate" value="${dateKey(new Date())}" style="flex:1;min-width:180px;">
                    <button class="btn-primary" onclick="addHoliday()" style="width:auto;padding:10px 24px;margin:0;">Add Holiday</button>
                  </div>
                </div>
              </div>
              <div style="margin-top:16px;max-height:400px;overflow-y:auto;">
            `;
                if (holidayDocs.length === 0) {
                    html += `<div class="empty-note">No holidays set.</div>`;
                } else {
                    holidayDocs.forEach(h => {
                        const dateObj = new Date(h.date + 'T00:00:00');
                        const display = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric',
                            month: 'short', year: 'numeric' });
                        html += `
                  <div class="admin-card">
                    <div class="row">
                      <div class="left">
                        <div class="title">${display}</div>
                      </div>
                      <div class="actions">
                        <button class="btn-sm delete" onclick="deleteHoliday('${h.id}')">Delete</button>
                      </div>
                    </div>
                  </div>
                `;
                    });
                }
                html += `</div>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading holidays: ${e.message}</div>`;
            }
        }

        async function addHoliday() {
            const date = document.getElementById('holidayDate').value;
            if (!date) { showToast('Select a date.'); return; }
            if (holidays.has(date)) { showToast('Already a holiday.'); return; }
            try {
                await addDoc(holidaysCollection, { date });
                showToast('Holiday added.');
                renderAdminHolidays();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deleteHoliday(id) {
            if (!confirm('Remove this holiday?')) return;
            try {
                await deleteDoc(doc(holidaysCollection, id));
                showToast('Holiday removed.');
                renderAdminHolidays();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.addHoliday = addHoliday;
        window.deleteHoliday = deleteHoliday;

        // ========== ADMIN: POSTS ==========
        async function renderAdminPosts() {
            const el = document.getElementById('adminPostsContent');
            try {
                const snap = await getDocs(postsCollection);
                let posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                posts.sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    const da = a.createdAt?.seconds || 0;
                    const db = b.createdAt?.seconds || 0;
                    return db - da;
                });
                let html = `
              <div class="admin-form">
                <div class="full"><label>Title</label><input id="postTitle" placeholder="Announcement title"></div>
                <div class="full"><label>Content</label><textarea id="postContent" placeholder="Write your announcement…" rows="3"></textarea></div>
                <div class="form-actions">
                  <button class="btn-primary" onclick="addPost()">Publish Announcement</button>
                  <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:400;text-transform:none;">
                    <input type="checkbox" id="postPinned"> Pin this post
                  </label>
                </div>
              </div>
              <div style="margin-top:16px;max-height:400px;overflow-y:auto;">
            `;
                if (posts.length === 0) {
                    html += `<div class="empty-note">No announcements yet.</div>`;
                } else {
                    posts.forEach(p => {
                        const date = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString(
                            'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                        html += `
                  <div class="post-item ${p.pinned ? 'pinned' : ''}">
                    <div class="post-title">${p.title} ${p.pinned ? '📌' : ''}</div>
                    <div class="post-meta">by ${p.author || 'admin'} · ${date}</div>
                    <div class="post-content">${p.content}</div>
                    <div class="actions" style="margin-top:6px;display:flex;gap:6px;">
                      <button class="btn-sm ${p.pinned ? 'edit' : 'pin'}" onclick="togglePinPost('${p.id}', ${!p.pinned})">${p.pinned ? 'Unpin' : 'Pin'}</button>
                      <button class="btn-sm delete" onclick="deletePost('${p.id}')">Delete</button>
                    </div>
                  </div>
                `;
                    });
                }
                html += `</div>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading posts: ${e.message}</div>`;
            }
        }

        async function addPost() {
            const title = document.getElementById('postTitle').value.trim();
            const content = document.getElementById('postContent').value.trim();
            const pinned = document.getElementById('postPinned').checked;
            if (!title || !content) { showToast('Fill in title and content.'); return; }
            try {
                await addDoc(postsCollection, {
                    title,
                    content,
                    pinned,
                    author: currentUser ? currentUser.username : 'admin',
                    authorName: currentUser ? currentUser.name : 'Admin',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                showToast('Announcement published.');
                document.getElementById('postTitle').value = '';
                document.getElementById('postContent').value = '';
                document.getElementById('postPinned').checked = false;
                renderAdminPosts();
                renderPostsFeed();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function togglePinPost(id, pinned) {
            try {
                await updateDoc(doc(postsCollection, id), { pinned });
                showToast(pinned ? 'Post pinned.' : 'Post unpinned.');
                renderAdminPosts();
                renderPostsFeed();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deletePost(id) {
            if (!confirm('Delete this announcement?')) return;
            try {
                await deleteDoc(doc(postsCollection, id));
                showToast('Announcement deleted.');
                renderAdminPosts();
                renderPostsFeed();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.addPost = addPost;
        window.togglePinPost = togglePinPost;
        window.deletePost = deletePost;

        // ========== ADMIN: REQUESTS ==========
        async function renderAdminRequests() {
            const el = document.getElementById('adminRequestsContent');
            try {
                const snap = await getDocs(query(adminRequestsCollection, where('status', '==', 'pending')));
                const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                let html =
                    `<div style="margin-bottom:16px;font-size:13px;color:var(--ink-soft);">${requests.length} pending request${requests.length !== 1 ? 's' : ''}.</div>`;
                if (requests.length === 0) {
                    html += `<div class="empty-note">No pending admin requests.</div>`;
                } else {
                    requests.forEach(r => {
                        const date = r.requestedAt ? new Date(r.requestedAt.seconds * 1000).toLocaleDateString(
                            'en-IN', { day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit' }) : '—';
                        html += `
                  <div class="admin-card">
                    <div class="row">
                      <div class="left">
                        <div class="title">${r.name} (@${r.username})</div>
                        <div class="sub">${r.branchId} · Section ${r.section} · requested ${date}</div>
                      </div>
                      <div class="actions">
                        <button class="btn-sm approve" onclick="approveAdminRequest('${r.id}','${r.uid}')">Approve</button>
                        <button class="btn-sm reject" onclick="rejectAdminRequest('${r.id}','${r.uid}')">Reject</button>
                      </div>
                    </div>
                  </div>
                `;
                    });
                }
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading requests: ${e.message}</div>`;
            }
        }

        async function approveAdminRequest(requestId, uid) {
            if (!confirm('Approve this admin request?')) return;
            try {
                await updateDoc(doc(adminRequestsCollection, requestId), { status: 'approved', reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser ? currentUser.username : 'admin' });
                await updateDoc(doc(usersCollection, uid), { isAdmin: true, adminRequested: false });
                showToast('Admin request approved!');
                renderAdminRequests();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function rejectAdminRequest(requestId, uid) {
            if (!confirm('Reject this admin request?')) return;
            try {
                await updateDoc(doc(adminRequestsCollection, requestId), { status: 'rejected', reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser ? currentUser.username : 'admin' });
                await updateDoc(doc(usersCollection, uid), { adminRequested: false });
                showToast('Admin request rejected.');
                renderAdminRequests();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.approveAdminRequest = approveAdminRequest;
        window.rejectAdminRequest = rejectAdminRequest;

        // ========== RENDER: Posts Feed ==========