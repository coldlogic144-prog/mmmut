// ============================================================================
// SECTION: 80_feed_attendance_events_image_history.js
// Posts feed, topbar, schedule render+marking, stats, events, canvas image, history
// Source: index.html lines 7451-8012 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        async function renderPostsFeed(viewAll = false) {
            const content = document.getElementById('postsFeedContent');
            if (!content) return;
            let posts = allPosts.slice();
            if (!viewAll) {
                posts = posts.slice(0, 5);
            }
            if (posts.length === 0) {
                content.innerHTML = `<div class="empty-note">No announcements yet.</div>`;
                return;
            }
            let html = '';
            posts.forEach(p => {
                const date = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString(
                    'en-IN', { day: 'numeric', month: 'short' }) : '—';
                html += `
              <div class="post-item ${p.pinned ? 'pinned' : ''}" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--paper-line);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="post-title" style="font-size:13px;font-weight:600;">${p.title} ${p.pinned ? '📌' : ''}</span>
                  <span style="font-size:10px;color:var(--ink-soft);">${date}</span>
                </div>
                <div class="post-content" style="font-size:12px;margin-top:2px;color:var(--ink-soft);">${p.content}</div>
              </div>
            `;
            });
            if (!viewAll && allPosts.length > 5) {
                html +=
                    `<div style="text-align:right;margin-top:8px;"><button class="btn-secondary" style="padding:4px 12px;font-size:11px;margin:0;" onclick="renderPostsFeed(true)">View all ${allPosts.length} →</button></div>`;
            }
            content.innerHTML = html;
        }

        // ========== RENDER: Schedule ==========
        function renderTopbarDate() {
            const now = new Date();
            const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('todayLabel').textContent = now.toLocaleDateString('en-IN', opts);
        }

        function currentPeriodKey() {
            const now = new Date();
            const mins = now.getHours() * 60 + now.getMinutes();
            for (const p of PERIODS) {
                const [sh, sm] = p.start.split(':').map(Number);
                const [eh, em] = p.end.split(':').map(Number);
                const s = sh * 60 + sm,
                    e = eh * 60 + em;
                if (mins >= s && mins < e) return p.key;
            }
            return null;
        }

        function todayName() {
            const idx = new Date().getDay();
            const map = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
            return map[idx] || null;
        }

        function setScheduleView(v) {
            scheduleView = v;
            document.getElementById('tabToday').classList.toggle('active', v === 'today');
            document.getElementById('tabWeek').classList.toggle('active', v === 'week');
            document.getElementById('tabImage').classList.toggle('active', v === 'image');
            document.getElementById('todayView').style.display = v === 'today' ? 'block' : 'none';
            document.getElementById('weekView').style.display = v === 'week' ? 'block' : 'none';
            document.getElementById('imageView').style.display = v === 'image' ? 'block' : 'none';
            if (v === 'image') {
                if (document.fonts && document.fonts.ready) { document.fonts.ready.then(drawTimetableImage); } else { drawTimetableImage(); }
            } else { renderSchedule(); }
        }

        async function getAttendanceMap() { return attendanceCache || {}; }

        async function setAttendanceMap(map) {
            attendanceCache = map;
            if (!currentUid) return;
            const ref = doc(attendanceCollection, currentUid);
            try { await updateDoc(ref, { attendance: map }); } catch (e) { await setDoc(ref, { attendance: map }); }
        }

        async function markAttendance(periodKey, subjectCode, status) {
            const map = await getAttendanceMap();
            const today = dateKey(new Date());
            if (holidays.has(today)) {
                showToast('Today is a holiday – attendance cannot be marked.');
                return;
            }
            if (!map[today]) map[today] = {};
            const cellKey = periodKey + '::' + subjectCode;
            if (map[today][cellKey] === status) { delete map[today][cellKey]; } else { map[today][cellKey] = status; }
            await setAttendanceMap(map);
            renderSchedule();
            await renderAttendanceStats();
            renderHistoryView();
        }

        async function markAttendanceForDate(periodKey, subjectCode, status, dateStr) {
            const map = await getAttendanceMap();
            if (holidays.has(dateStr)) {
                showToast('This date is a holiday – attendance cannot be marked.');
                return;
            }
            if (!map[dateStr]) map[dateStr] = {};
            const cellKey = periodKey + '::' + subjectCode;
            if (map[dateStr][cellKey] === status) { delete map[dateStr][cellKey]; } else { map[dateStr][cellKey] =
                status; }
            await setAttendanceMap(map);
            renderSchedule();
            await renderAttendanceStats();
            renderHistoryView();
        }

        async function renderSchedule() {
            const day = todayName();
            const nowKey = currentPeriodKey();
            const map = await getAttendanceMap();
            const today = dateKey(new Date());
            const todayMarks = map[today] || {};
            let schedule = scheduleCache;
            if (currentUser && currentUser.branchId) {
                try {
                    const q = query(timetableOverridesCollection,
                        where('branchId', '==', currentUser.branchId),
                        where('section', '==', currentUser.section)
                    );
                    const snap = await getDocs(q);
                    snap.docs.forEach(d => {
                        const ov = d.data();
                        if (schedule[ov.day] && schedule[ov.day][ov.period]) {
                            schedule[ov.day][ov.period] = { code: ov.code, name: ov.name, type: ov.type };
                        }
                    });
                } catch (e) {}
            }
            const todayView = document.getElementById('todayView');
            if (!day || holidays.has(today)) {
                if (holidays.has(today)) {
                    todayView.innerHTML = `<div class="holiday-banner">🏖️ Today is a holiday. No classes scheduled.</div>`;
                } else {
                    todayView.innerHTML =
                    `<div class="empty-note">It's the weekend — no scheduled periods today. Enjoy it.</div>`;
                }
            } else {
                let html = `<div class="rail">`;
                PERIODS.forEach(p => {
                    if (p.key === 'LUNCH') {
                        html +=
                            `<div class="rail-item lunch"><div class="rail-dot">·</div><div class="rail-row"><span class="rail-time">Lunch · ${fmtTime(p.start)}–${fmtTime(p.end)}</span></div></div>`;
                        return;
                    }
                    const cell = schedule[day][p.key];
                    const isNow = p.key === nowKey;
                    const isPast = comparePeriod(p.key, nowKey) < 0;
                    const stateClass = isNow ? 'now' : (isPast ? 'done' : '');
                    const cellKey = p.key + '::' + cell.code;
                    const mark = todayMarks[cellKey];
                    const isFree = cell.code === '—';
                    html += `<div class="rail-item ${stateClass}">
                <div class="rail-dot">${p.key}</div>
                <div class="rail-row">
                  <div>
                    <div class="rail-subject">${cell.name}</div>
                    <div class="rail-meta">${cell.code!=='—'?cell.code+' · ':''}${cell.type} · ${fmtTime(p.start)}–${fmtTime(p.end)}</div>
                  </div>
                  ${isFree ? '' : `
                  <div class="rail-actions">
                    ${mark ? `<span class="status-tag ${mark}">${mark}</span>` : ''}
                    <button class="mini-btn present ${mark==='present'?'active':''}" title="Mark present" onclick="markAttendance('${p.key}','${cell.code}','present')">✓</button>
                    <button class="mini-btn absent ${mark==='absent'?'active':''}" title="Mark absent" onclick="markAttendance('${p.key}','${cell.code}','absent')">✕</button>
                  </div>`}
                </div>
              </div>`;
                });
                html += `</div>`;
                todayView.innerHTML = html;
            }
            const weekView = document.getElementById('weekView');
            let wh = `<div class="week-grid">`;
            wh += `<div></div>` + DAY_SHORT.map(d => `<div class="wh">${d}</div>`).join('');
            TEACH_PERIODS.forEach(p => {
                wh += `<div class="week-per">${p.key}</div>`;
                DAYS.forEach(d => {
                    const cell = schedule[d][p.key];
                    const cls = cell.type === 'Practical' ? 'p' : 'lec';
                    wh +=
                        `<div class="week-cell ${cls}"><div class="wc-code">${cell.code}</div><div class="wc-type">${cell.type}</div></div>`;
                });
            });
            wh += `</div>
            <div style="margin-top:12px;font-size:11px;color:var(--ink-soft);">
              <span class="legend-dot" style="background:var(--teal-soft);border:1px solid var(--teal);"></span>Practical block
              <span style="margin-left:14px;" class="legend-dot" style="background:var(--paper);border:1px solid var(--paper-line);"></span>Lecture / Tutorial
            </div>`;
            weekView.innerHTML = wh;
        }

        // ========== RENDER: Attendance Stats ==========
        async function renderAttendanceStats() {
            const branch = getBranch(currentUser.branchId);
            const map = await getAttendanceMap();
            const targetPct = Number(document.getElementById('targetPct').value);
            const counts = {};
            branch.subjects.forEach(s => counts[s.code] = { present: 0, absent: 0, name: s.name });
            Object.keys(map).forEach(dateStr => {
                if (holidays.has(dateStr)) return;
                const dayMap = map[dateStr];
                Object.entries(dayMap).forEach(([cellKey, status]) => {
                    const code = cellKey.split('::')[1];
                    if (counts[code]) {
                        if (status === 'present') counts[code].present++;
                        else if (status === 'absent') counts[code].absent++;
                    }
                });
            });
            let totalP = 0,
                totalA = 0;
            const statsEl = document.getElementById('subjectStats');
            let html = '';
            branch.subjects.forEach(s => {
                const c = counts[s.code];
                const total = c.present + c.absent;
                totalP += c.present;
                totalA += c.absent;
                const pct = total ? Math.round((c.present / total) * 100) : null;
                const barClass = pct === null ? '' : (pct < 65 ? 'danger' : (pct < 75 ? 'warn' : ''));
                const leave = total ? computeLeaveInfo(c.present, c.absent, targetPct) : { type: 'none' };
                let leaveLine = '';
                if (leave.type === 'skip') {
                    leaveLine = leave.value > 0 ?
                        `<div class="leave-line ok">can miss ${leave.value} more</div>` :
                        `<div class="leave-line warn">no more misses left</div>`;
                } else if (leave.type === 'attend') {
                    leaveLine = `<div class="leave-line warn">attend next ${leave.value} straight</div>`;
                }
                html += `<div class="stat-row">
              <div class="stat-label" title="${s.name}">${s.code}${leaveLine}</div>
              <div class="stat-bar-track"><div class="stat-bar-fill ${barClass}" style="width:${pct===null?0:pct}%;"></div></div>
              <div class="stat-pct">${pct===null?'—':pct+'%'}</div>
            </div>`;
            });
            statsEl.innerHTML = html ||
                `<div class="empty-note">No attendance marked yet — tick classes off as they happen.</div>`;
            const overallTotal = totalP + totalA;
            const overallPct = overallTotal ? Math.round((totalP / overallTotal) * 100) : null;
            document.getElementById('overallPct').textContent = overallPct === null ? '—' : overallPct + '%';
            document.getElementById('overallCounts').innerHTML = overallTotal ?
                `<b>${totalP}</b> attended<br><b>${totalA}</b> missed<br>of ${overallTotal} marked (excluding holidays)` :
                `Nothing marked yet this semester.`;
            const leaveEl = document.getElementById('overallLeave');
            if (!overallTotal) {
                leaveEl.innerHTML =
                    `<span style="color:var(--ink-soft);">Mark a few classes to see how much leave you can safely take toward ${targetPct}%.</span>`;
            } else {
                const overallLeave = computeLeaveInfo(totalP, totalA, targetPct);
                if (overallLeave.type === 'skip') {
                    leaveEl.innerHTML = overallLeave.value > 0 ?
                        `You're at <b>${overallPct}%</b> overall — you can take <b>${overallLeave.value}</b> more period${overallLeave.value===1?'':'s'} off and stay at or above ${targetPct}%.` :
                        `You're at <b>${overallPct}%</b>, right at the edge — one more miss will drop you below ${targetPct}%.`;
                } else {
                    leaveEl.innerHTML =
                        `You're at <b>${overallPct}%</b>, below ${targetPct}%. Attend the next <b>${overallLeave.value}</b> period${overallLeave.value===1?'':'s'} in a row (with no misses) to climb back to ${targetPct}%.`;
                }
            }
        }

        // ========== RENDER: Events ==========
        async function renderEvents() {
            const now = new Date();
            const todayStr = dateKey(now);
            let customEvents = [];
            try { const snap = await getDocs(eventOverridesCollection);
                customEvents = snap.docs.map(d => ({ ...d.data() })); } catch (e) {}
            const allEvents = [...BUILTIN_EVENTS, ...customEvents];
            const upcoming = allEvents
                .map(e => ({ ...e, endDate: new Date(e.end + 'T23:59:59') }))
                .filter(e => e.endDate >= now)
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .slice(0, 7);
            const el = document.getElementById('eventsList');
            if (!upcoming.length) { el.innerHTML =
                    `<div class="empty-note">No more scheduled events this session.</div>`; return; }
            el.innerHTML = upcoming.map(e => {
                const start = new Date(e.start + 'T00:00:00');
                const isOngoing = todayStr >= e.start && todayStr <= e.end;
                const mon = start.toLocaleDateString('en-IN', { month: 'short' });
                const day = start.getDate();
                const rangeStr = e.start === e.end ? start.toLocaleDateString('en-IN', { day: 'numeric',
                        month: 'short', year: 'numeric' }) :
                    `${start.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${new Date(e.end+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`;
                return `<div class="event-item">
              <div class="event-date"><span class="d">${day}</span>${mon}</div>
              <div>
                <div class="event-title">${e.title}</div>
                <div class="event-range">${rangeStr}</div>
                ${isOngoing ? `<span class="event-badge today">ongoing</span>` : ''}
              </div>
            </div>`;
            }).join('');
        }

        // ========== RENDER: Timetable Image ==========
        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
            const words = text.split(' ');
            let line = '',
                ly = y,
                lines = 0;
            for (let n = 0; n < words.length; n++) {
                const test = line + words[n] + ' ';
                if (ctx.measureText(test).width > maxWidth && n > 0) {
                    ctx.fillText(line.trim(), x, ly);
                    line = words[n] + ' ';
                    ly += lineHeight;
                    lines++;
                    if (lines >= maxLines - 1) {
                        const rest = words.slice(n + 1).join(' ');
                        let last = line.trim();
                        if (rest) { while (ctx.measureText(last + '…').width > maxWidth && last.length > 0) { last = last
                                .slice(0, -1); } last += '…'; }
                        ctx.fillText(last, x, ly);
                        return;
                    }
                } else { line = test; }
            }
            ctx.fillText(line.trim(), x, ly);
        }

        function drawTimetableImage() {
            const canvas = document.getElementById('ttCanvas');
            if (!canvas || !currentUser) return;
            const branch = getBranch(currentUser.branchId);
            const dpr = window.devicePixelRatio || 1;
            const W = 1180,
                H = 760;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            const ctx = canvas.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#F7F5EE';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#152A3B';
            ctx.fillRect(0, 0, W, 92);
            ctx.fillStyle = '#E4D2A4';
            ctx.font = '600 11px "IBM Plex Mono", monospace';
            ctx.fillText('M.M.M. UNIVERSITY OF TECHNOLOGY, GORAKHPUR  ·  SESSION 2026–27', 28, 24);
            ctx.fillStyle = '#F1ECDD';
            ctx.font = '600 25px "Fraunces", serif';
            ctx.fillText(branch.name + ' — Section ' + currentUser.section, 28, 58);
            ctx.font = '400 12px "IBM Plex Mono", monospace';
            ctx.fillStyle = '#CBD6DD';
            ctx.fillText('Room: ' + branch.room, 28, 80);
            const gridLeft = 96,
                gridTop = 118;
            const dayColW = (W - 28 - gridLeft) / 5;
            const rowH = (H - gridTop - 28) / 8;
            ctx.textAlign = 'center';
            DAYS.forEach((d, i) => {
                ctx.fillStyle = '#152A3B';
                ctx.font = '700 13px "IBM Plex Sans", sans-serif';
                ctx.fillText(DAY_SHORT[i].toUpperCase(), gridLeft + dayColW * i + dayColW / 2, gridTop - 16);
            });
            TEACH_PERIODS.forEach((p, ri) => {
                const y = gridTop + rowH * ri;
                ctx.fillStyle = '#2C4258';
                ctx.font = '700 12px "IBM Plex Mono", monospace';
                ctx.fillText(p.key, 44, y + rowH / 2 - 4);
                ctx.font = '400 9px "IBM Plex Mono", monospace';
                ctx.fillStyle = '#8B8676';
                ctx.fillText(fmtTime(p.start), 44, y + rowH / 2 + 11);
                ctx.textAlign = 'left';
                DAYS.forEach((d, ci) => {
                    const x = gridLeft + dayColW * ci;
                    const cell = scheduleCache[d][p.key];
                    const isP = cell.type === 'Practical';
                    const isFree = cell.code === '—';
                    ctx.fillStyle = isFree ? '#F1EFE6' : (isP ? '#DCE9E6' : '#EDEAE0');
                    ctx.strokeStyle = '#D9D4C4';
                    ctx.lineWidth = 1;
                    roundRect(ctx, x + 3, y + 3, dayColW - 6, rowH - 6, 7);
                    ctx.fill();
                    ctx.stroke();
                    if (!isFree) {
                        ctx.fillStyle = '#152A3B';
                        ctx.font = '700 11px "IBM Plex Mono", monospace';
                        ctx.fillText(cell.code, x + 11, y + 21);
                        ctx.font = '400 9.5px "IBM Plex Sans", sans-serif';
                        ctx.fillStyle = '#2C4258';
                        wrapText(ctx, cell.name, x + 11, y + 35, dayColW - 22, 11, 3);
                        ctx.font = '500 8.5px "IBM Plex Mono", monospace';
                        ctx.fillStyle = isP ? '#2F5D5A' : '#B08A3E';
                        ctx.fillText(cell.type.toUpperCase(), x + 11, y + rowH - 9);
                    } else {
                        ctx.fillStyle = '#B7B2A0';
                        ctx.font = 'italic 9.5px "IBM Plex Sans", sans-serif';
                        ctx.fillText('Self study', x + 11, y + rowH / 2 + 3);
                    }
                    ctx.textAlign = 'left';
                });
                ctx.textAlign = 'left';
            });
            ctx.fillStyle = '#8B8676';
            ctx.font = '400 9.5px "IBM Plex Mono", monospace';
            ctx.fillText(
                'Generated by The Ledger · exact slot placement is approximate, subjects & credit hours are as per curriculum',
                28, H - 12);
        }

        function downloadTimetableImage() {
            const canvas = document.getElementById('ttCanvas');
            const branch = getBranch(currentUser.branchId);
            const link = document.createElement('a');
            link.download = branch.id + '-sec' + currentUser.section + '-timetable.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }

        // ========== RENDER: History View ==========
        function navigateHistoryDate(delta) {
            const newDate = new Date(historyDate);
            newDate.setDate(newDate.getDate() + delta);
            historyDate = newDate;
            renderHistoryView();
            document.getElementById('histPrev').disabled = false;
            document.getElementById('histNext').disabled = false;
        }

        function goToTodayHistory() {
            historyDate = new Date();
            renderHistoryView();
        }

        async function renderHistoryView() {
            const container = document.getElementById('historyView');
            if (!container) return;
            const dateObj = historyDate;
            const dateStr = dateKey(dateObj);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const displayStr = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short',
                year: 'numeric' });
            document.getElementById('histDateDisplay').textContent = displayStr;

            const map = await getAttendanceMap();
            const dayMarks = map[dateStr] || {};

            const dayIdx = dateObj.getDay();
            const isWeekend = dayIdx === 0 || dayIdx === 6;
            const dayKey = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIdx];
            const isTeachingDay = DAYS.includes(dayKey);
            const isHoliday = holidays.has(dateStr);

            if (isWeekend || !isTeachingDay) {
                container.innerHTML = `
              <div class="history-empty">${dayKey} — no classes scheduled.</div>
              <div class="history-summary">
                <span class="hstat"><span class="num" style="color:var(--ink-soft);">—</span> <span class="lbl">no periods</span></span>
              </div>
            `;
                return;
            }

            if (isHoliday) {
                container.innerHTML = `
              <div class="holiday-banner">🏖️ Holiday — no classes on this day.</div>
              <div class="history-summary">
                <span class="hstat"><span class="num" style="color:var(--ink-soft);">—</span> <span class="lbl">no attendance</span></span>
              </div>
            `;
                return;
            }

            let schedule = scheduleCache;
            if (currentUser && currentUser.branchId) {
                try {
                    const q = query(timetableOverridesCollection,
                        where('branchId', '==', currentUser.branchId),
                        where('section', '==', currentUser.section)
                    );
                    const snap = await getDocs(q);
                    snap.docs.forEach(d => {
                        const ov = d.data();
                        if (schedule[ov.day] && schedule[ov.day][ov.period]) {
                            schedule[ov.day][ov.period] = { code: ov.code, name: ov.name, type: ov.type };
                        }
                    });
                } catch (e) {}
            }

            const daySchedule = schedule[dayKey];
            if (!daySchedule) {
                container.innerHTML = `<div class="history-empty">No schedule for ${dayKey}.</div>`;
                return;
            }

            let html = `<div class="rail" style="margin-top:4px;">`;
            let presentCount = 0,
                absentCount = 0;
            PERIODS.forEach(p => {
                if (p.key === 'LUNCH') {
                    html +=
                        `<div class="rail-item lunch"><div class="rail-dot">·</div><div class="rail-row"><span class="rail-time">Lunch · ${fmtTime(p.start)}–${fmtTime(p.end)}</span></div></div>`;
                    return;
                }
                const cell = daySchedule[p.key];
                if (!cell) return;
                const cellKey = p.key + '::' + cell.code;
                const mark = dayMarks[cellKey];
                if (mark === 'present') presentCount++;
                else if (mark === 'absent') absentCount++;
                const isFree = cell.code === '—';
                const isPast = dateObj < new Date() ? 'done' : '';
                html += `<div class="rail-item ${isPast}">
              <div class="rail-dot">${p.key}</div>
              <div class="rail-row">
                <div>
                  <div class="rail-subject">${cell.name}</div>
                  <div class="rail-meta">${cell.code!=='—'?cell.code+' · ':''}${cell.type} · ${fmtTime(p.start)}–${fmtTime(p.end)}</div>
                </div>
                ${isFree ? '' : `
                <div class="rail-actions history-actions">
                  ${mark ? `<span class="status-tag ${mark}">${mark}</span>` : `<span class="status-tag" style="background:var(--paper);color:var(--ink-soft);">—</span>`}
                  <button class="mini-btn present ${mark==='present'?'active':''}" title="Mark present" onclick="markAttendanceForDate('${p.key}','${cell.code}','present','${dateStr}')">✓</button>
                  <button class="mini-btn absent ${mark==='absent'?'active':''}" title="Mark absent" onclick="markAttendanceForDate('${p.key}','${cell.code}','absent','${dateStr}')">✕</button>
                </div>`}
              </div>
            </div>`;
            });
            html += `</div>`;

            const totalMarked = presentCount + absentCount;
            html += `
            <div class="history-summary">
              <span class="hstat"><span class="num present">${presentCount}</span> <span class="lbl">present</span></span>
              <span class="hstat"><span class="num absent">${absentCount}</span> <span class="lbl">absent</span></span>
              <span class="hstat"><span class="num" style="color:var(--ink-soft);">${totalMarked}</span> <span class="lbl">marked</span></span>
              ${totalMarked > 0 ? `<span class="hstat"><span class="num" style="color:var(--teal);">${Math.round(presentCount/totalMarked*100)}%</span> <span class="lbl">today</span></span>` : ''}
            </div>
          `;

            const todayStr = dateKey(new Date());
            if (dateStr > todayStr) {
                html +=
                    `<div style="font-size:11px;color:var(--brass);background:var(--brass-soft);padding:6px 12px;border-radius:8px;margin-top:6px;">⏳ This date is in the future — you can still pre-mark attendance if you know your schedule.</div>`;
            }

            container.innerHTML = html;
        }

        // ============================================================
        // ========== CHESS CLUB ======================================
        // ============================================================