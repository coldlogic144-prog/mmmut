// ============================================================================
// SECTION: 85_chess_club.js
// Chess club manager (members/events/challenges/games/activity)
// Source: index.html lines 8013-8578 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================


        function toggleChessClub(show) {
            const chessView = document.getElementById('chessClubView');
            const mainShell = document.getElementById('mainShell');
            const app = document.getElementById('app');
            if (show) {
                chessView.style.display = 'block';
                mainShell.style.display = 'none';
                // Hide footer? We'll keep footer visible but it's outside shell. Actually footer is inside app but after shell? The footer is inside app but after shell. We'll hide footer too.
                const footer = document.querySelector('.app-foot');
                if (footer) footer.style.display = 'none';
                // Show chess club view
                chessView.style.display = 'block';
                // Initialize data if not loaded
                if (currentUser) {
                    initChessClub();
                }
            } else {
                chessView.style.display = 'none';
                mainShell.style.display = 'flex';
                const footer = document.querySelector('.app-foot');
                if (footer) footer.style.display = 'block';
            }
        }

        function switchChessTab(tab) {
            chessCurrentTab = tab;
            document.querySelectorAll('#chessClubView .chess-tabs .tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            document.querySelectorAll('#chessClubView .chess-tab-content').forEach(el => {
                el.style.display = 'none';
            });
            const target = document.getElementById('chessTab-' + tab);
            if (target) target.style.display = 'block';
            // Render content based on tab
            if (tab === 'home') renderChessHome();
            else if (tab === 'members') renderChessMembers();
            else if (tab === 'leaderboard') renderChessLeaderboard();
            else if (tab === 'events') renderChessEvents();
            else if (tab === 'challenges') renderChessChallenges();
            else if (tab === 'games') renderChessGames();
            else if (tab === 'activity') renderChessActivity();
        }

        async function initChessClub() {
            // Check if user is member
            if (currentUid) {
                const docSnap = await getDoc(doc(chessMembersCollection, currentUid));
                chessMemberStatus = docSnap.exists();
                updateChessJoinButtons();
            }
            // Load members count
            const snap = await getDocs(chessMembersCollection);
            const count = snap.size;
            document.getElementById('chessMemberCount').textContent = count;
            document.getElementById('chessMemberCount2').textContent = count + ' members';

            // Listen for changes
            if (window._chessMembersUnsub) window._chessMembersUnsub();
            window._chessMembersUnsub = onSnapshot(chessMembersCollection, (snap) => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                chessMembers = docs;
                document.getElementById('chessMemberCount').textContent = docs.length;
                document.getElementById('chessMemberCount2').textContent = docs.length + ' members';
                if (chessCurrentTab === 'home') renderChessHome();
                if (chessCurrentTab === 'members') renderChessMembers();
                if (chessCurrentTab === 'leaderboard') renderChessLeaderboard();
                // Also update challenge opponent dropdown
                populateChallengeOpponents();
            });

            if (window._chessEventsUnsub) window._chessEventsUnsub();
            window._chessEventsUnsub = onSnapshot(chessEventsCollection, (snap) => {
                chessEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (chessCurrentTab === 'home') renderChessHome();
                if (chessCurrentTab === 'events') renderChessEvents();
            });

            if (window._chessChallengesUnsub) window._chessChallengesUnsub();
            window._chessChallengesUnsub = onSnapshot(chessChallengesCollection, (snap) => {
                chessChallenges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (chessCurrentTab === 'challenges') renderChessChallenges();
                if (chessCurrentTab === 'home') renderChessHome();
            });

            if (window._chessActivityUnsub) window._chessActivityUnsub();
            window._chessActivityUnsub = onSnapshot(query(chessActivityCollection, orderBy('createdAt', 'desc'), limit(20)), (snap) => {
                chessActivity = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (chessCurrentTab === 'activity') renderChessActivity();
                if (chessCurrentTab === 'home') renderChessHome();
            });

            if (window._chessGamesUnsub) window._chessGamesUnsub();
            window._chessGamesUnsub = onSnapshot(chessGamesCollection, (snap) => {
                chessGames = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (chessCurrentTab === 'games') renderChessGames();
            });

            // Initial render
            switchChessTab(chessCurrentTab);
            renderChessHome();
            populateChallengeOpponents();
            // Admin event button
            const eventCreateBtn = document.getElementById('chessEventCreateBtn');
            if (eventCreateBtn) {
                eventCreateBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            }
        }

        function updateChessJoinButtons() {
            const joinBtn = document.getElementById('chessJoinBtn');
            const leaveBtn = document.getElementById('chessLeaveBtn');
            if (chessMemberStatus) {
                joinBtn.style.display = 'none';
                leaveBtn.style.display = 'inline-block';
            } else {
                joinBtn.style.display = 'inline-block';
                leaveBtn.style.display = 'none';
            }
        }

        async function handleChessJoin() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            try {
                await setDoc(doc(chessMembersCollection, currentUid), {
                    uid: currentUid,
                    name: currentUser.name,
                    username: currentUser.username,
                    branch: currentUser.branchId,
                    section: currentUser.section,
                    joinedAt: serverTimestamp(),
                    rating: 1200, // initial rating
                    wins: 0,
                    losses: 0,
                    draws: 0
                });
                chessMemberStatus = true;
                updateChessJoinButtons();
                showToast('🎉 You joined the Chess Club!');
                // Add activity
                await addDoc(chessActivityCollection, {
                    type: 'join',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} joined the Chess Club`,
                    createdAt: serverTimestamp()
                });
                renderChessHome();
                renderChessMembers();
                renderChessLeaderboard();
            } catch (e) {
                showToast('Error joining: ' + e.message);
            }
        }

        async function handleChessLeave() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (!confirm('Are you sure you want to leave the Chess Club?')) return;
            try {
                await deleteDoc(doc(chessMembersCollection, currentUid));
                chessMemberStatus = false;
                updateChessJoinButtons();
                showToast('You left the Chess Club.');
                // Activity
                await addDoc(chessActivityCollection, {
                    type: 'leave',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} left the Chess Club`,
                    createdAt: serverTimestamp()
                });
                renderChessHome();
                renderChessMembers();
                renderChessLeaderboard();
            } catch (e) {
                showToast('Error leaving: ' + e.message);
            }
        }

        function renderChessHome() {
            // Next event
            const nextEvent = chessEvents.filter(e => new Date(e.date + 'T' + (e.time || '00:00')) >= new Date()).sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')))[0];
            const nextEl = document.getElementById('chessNextEvent');
            if (nextEvent) {
                const date = new Date(nextEvent.date + 'T' + (nextEvent.time || '00:00'));
                const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                nextEl.innerHTML = `
                    <div style="font-weight:600; font-size:15px;">${nextEvent.title}</div>
                    <div style="font-size:13px; color:var(--ink-soft);">${nextEvent.timeControl || ''} • ${dateStr} ${timeStr}</div>
                `;
            } else {
                nextEl.innerHTML = `<div style="font-size:13px; color:var(--ink-soft);">No upcoming events.</div>`;
            }

            // Leaderboard preview (top 3)
            const sorted = [...chessMembers].sort((a, b) => (b.rating || 1200) - (a.rating || 1200));
            const top3 = sorted.slice(0, 3);
            const preview = document.getElementById('chessLeaderboardPreview');
            if (top3.length === 0) {
                preview.innerHTML = `<div class="empty-note">No members yet.</div>`;
            } else {
                const medals = ['🥇', '🥈', '🥉'];
                preview.innerHTML = top3.map((m, i) => `
                    <div class="leaderboard-row">
                        <div class="rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${medals[i] || i+1}</div>
                        <div class="player">${m.name || 'Unknown'}</div>
                        <div class="rating">${m.rating || 1200}</div>
                    </div>
                `).join('');
            }

            // Recent activity preview
            const activityPreview = document.getElementById('chessActivityList');
            if (activityPreview && chessCurrentTab === 'home') {
                // we'll show only in activity tab
            }
        }

        function renderChessMembers() {
            const list = document.getElementById('chessMembersList');
            if (!list) return;
            if (chessMembers.length === 0) {
                list.innerHTML = `<div class="empty-note">No members yet. Be the first to join!</div>`;
                return;
            }
            let html = '';
            chessMembers.forEach(m => {
                const branchName = getBranch(m.branch)?.name || m.branch || '';
                const shortBranch = branchName.replace('B.Tech — ', '');
                const avatar = (m.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                html += `
                    <div class="member-item">
                        <div class="avatar">${avatar}</div>
                        <div class="info">
                            <div class="name">${m.name || 'Unknown'} ${m.uid === currentUid ? ' (you)' : ''}</div>
                            <div class="branch">${shortBranch}${m.section ? ' · Sec ' + m.section : ''}</div>
                        </div>
                        <div class="rating">${m.rating || 1200}</div>
                    </div>
                `;
            });
            list.innerHTML = html;
        }

        function renderChessLeaderboard() {
            const container = document.getElementById('chessLeaderboardFull');
            if (!container) return;
            const sorted = [...chessMembers].sort((a, b) => (b.rating || 1200) - (a.rating || 1200));
            if (sorted.length === 0) {
                container.innerHTML = `<div class="empty-note">No members yet.</div>`;
                return;
            }
            let html = '';
            sorted.forEach((m, i) => {
                const rank = i + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
                const games = (m.wins || 0) + (m.losses || 0) + (m.draws || 0);
                html += `
                    <div class="leaderboard-row">
                        <div class="rank ${rank===1?'gold':rank===2?'silver':rank===3?'bronze':''}">${medal}</div>
                        <div class="player">${m.name || 'Unknown'}</div>
                        <div style="font-size:12px; color:var(--ink-soft); flex:1;">${games} games</div>
                        <div class="rating">${m.rating || 1200}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function renderChessEvents() {
            const container = document.getElementById('chessEventsList');
            if (!container) return;
            if (chessEvents.length === 0) {
                container.innerHTML = `<div class="empty-note">No events scheduled.</div>`;
                return;
            }
            const sorted = [...chessEvents].sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
            let html = '';
            sorted.forEach(e => {
                const date = new Date(e.date + 'T' + (e.time || '00:00'));
                const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const participants = e.participants ? e.participants.length : 0;
                const isPast = date < new Date();
                html += `
                    <div class="event-card">
                        <div class="title">${e.title} ${isPast ? ' (past)' : ''}</div>
                        <div class="details">${dateStr} ${timeStr} · ${e.timeControl || 'No time control'} · ${participants} participants</div>
                        <div class="details" style="font-size:12px;">${e.description || ''}</div>
                        <div class="actions">
                            ${!isPast && currentUser ? `<button class="btn-primary" style="margin:0; padding:4px 16px; font-size:12px;" onclick="registerForEvent('${e.id}')">Register</button>` : ''}
                            ${isAdmin ? `<button class="btn-danger" style="margin:0; padding:4px 16px; font-size:12px;" onclick="deleteChessEvent('${e.id}')">Delete</button>` : ''}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        async function registerForEvent(eventId) {
            if (!currentUser) { showToast('Please log in first.'); return; }
            try {
                const ref = doc(chessEventsCollection, eventId);
                const snap = await getDoc(ref);
                if (!snap.exists()) { showToast('Event not found.'); return; }
                const data = snap.data();
                const participants = data.participants || [];
                if (participants.includes(currentUid)) {
                    showToast('You are already registered.');
                    return;
                }
                participants.push(currentUid);
                await updateDoc(ref, { participants });
                showToast('Registered for event!');
                renderChessEvents();
                // Activity
                await addDoc(chessActivityCollection, {
                    type: 'register',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} registered for ${data.title}`,
                    createdAt: serverTimestamp()
                });
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        async function deleteChessEvent(eventId) {
            if (!confirm('Delete this event?')) return;
            try {
                await deleteDoc(doc(chessEventsCollection, eventId));
                showToast('Event deleted.');
                renderChessEvents();
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        function openChessEventForm() {
            document.getElementById('chessEventForm').style.display = 'block';
            document.getElementById('chessEventDate').value = dateKey(new Date());
            document.getElementById('chessEventTime').value = '19:00';
        }

        function closeChessEventForm() {
            document.getElementById('chessEventForm').style.display = 'none';
        }

        async function submitChessEvent(e) {
            e.preventDefault();
            if (!isAdmin) { showToast('Only admins can create events.'); return; }
            const title = document.getElementById('chessEventTitle').value.trim();
            const date = document.getElementById('chessEventDate').value;
            const time = document.getElementById('chessEventTime').value;
            const timeControl = document.getElementById('chessEventTimeControl').value.trim();
            const description = document.getElementById('chessEventDesc').value.trim();
            if (!title || !date) { showToast('Title and date are required.'); return; }
            try {
                await addDoc(chessEventsCollection, {
                    title,
                    date,
                    time,
                    timeControl: timeControl || 'N/A',
                    description,
                    participants: [],
                    createdBy: currentUid,
                    createdAt: serverTimestamp()
                });
                showToast('Event created!');
                closeChessEventForm();
                renderChessEvents();
                // Activity
                await addDoc(chessActivityCollection, {
                    type: 'event_created',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} created event: ${title}`,
                    createdAt: serverTimestamp()
                });
                // Reset form
                document.getElementById('chessEventTitle').value = '';
                document.getElementById('chessEventDesc').value = '';
                document.getElementById('chessEventTimeControl').value = '';
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        function populateChallengeOpponents() {
            const sel = document.getElementById('chessChallengeOpponent');
            if (!sel) return;
            const current = sel.value;
            sel.innerHTML = '';
            chessMembers.forEach(m => {
                if (m.uid !== currentUid) {
                    const opt = document.createElement('option');
                    opt.value = m.uid;
                    opt.textContent = m.name || 'Unknown';
                    sel.appendChild(opt);
                }
            });
            if (current && sel.querySelector(`option[value="${current}"]`)) {
                sel.value = current;
            }
        }

        async function sendChessChallenge() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            const opponentUid = document.getElementById('chessChallengeOpponent').value;
            if (!opponentUid) { showToast('Select an opponent.'); return; }
            if (opponentUid === currentUid) { showToast('You cannot challenge yourself.'); return; }
            // Check if there is already a pending challenge between these two
            const existing = chessChallenges.find(c =>
                (c.challengerUid === currentUid && c.opponentUid === opponentUid && c.status === 'pending') ||
                (c.challengerUid === opponentUid && c.opponentUid === currentUid && c.status === 'pending')
            );
            if (existing) {
                showToast('A challenge is already pending between you two.');
                return;
            }
            try {
                await addDoc(chessChallengesCollection, {
                    challengerUid: currentUid,
                    opponentUid: opponentUid,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    challengerName: currentUser.name,
                    opponentName: chessMembers.find(m => m.uid === opponentUid)?.name || 'Unknown'
                });
                showToast('Challenge sent!');
                renderChessChallenges();
                // Activity
                await addDoc(chessActivityCollection, {
                    type: 'challenge',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} challenged ${chessMembers.find(m=>m.uid===opponentUid)?.name || 'Unknown'}`,
                    createdAt: serverTimestamp()
                });
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        function renderChessChallenges() {
            const container = document.getElementById('chessChallengesList');
            if (!container) return;
            // Show challenges where current user is involved
            const myChallenges = chessChallenges.filter(c => c.challengerUid === currentUid || c.opponentUid === currentUid);
            if (myChallenges.length === 0) {
                container.innerHTML = `<div class="empty-note">No challenges.</div>`;
                return;
            }
            let html = '';
            myChallenges.forEach(c => {
                const isChallenger = c.challengerUid === currentUid;
                const otherName = isChallenger ? c.opponentName || 'Unknown' : c.challengerName || 'Unknown';
                const status = c.status;
                const date = c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
                let actions = '';
                if (status === 'pending' && !isChallenger) {
                    actions = `<button class="btn-success" style="margin:0; padding:4px 12px; font-size:11px;" onclick="respondChallenge('${c.id}','accepted')">Accept</button>
                               <button class="btn-danger" style="margin:0; padding:4px 12px; font-size:11px;" onclick="respondChallenge('${c.id}','declined')">Decline</button>`;
                } else if (status === 'pending' && isChallenger) {
                    actions = `<button class="btn-danger" style="margin:0; padding:4px 12px; font-size:11px;" onclick="respondChallenge('${c.id}','cancelled')">Cancel</button>`;
                }
                html += `
                    <div class="challenge-item">
                        <div class="info">
                            <strong>${isChallenger ? 'You' : otherName}</strong> ${isChallenger ? 'challenged' : 'challenged you'} 
                            (${status}) ${date}
                        </div>
                        <div class="actions">${actions}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        async function respondChallenge(challengeId, status) {
            if (!currentUser) { showToast('Please log in first.'); return; }
            try {
                await updateDoc(doc(chessChallengesCollection, challengeId), { status });
                showToast(`Challenge ${status}.`);
                renderChessChallenges();
                // Activity
                const challenge = chessChallenges.find(c => c.id === challengeId);
                if (challenge) {
                    const msg = status === 'accepted' ? `${currentUser.name} accepted challenge from ${challenge.challengerName}` :
                        status === 'declined' ? `${currentUser.name} declined challenge from ${challenge.challengerName}` :
                        `Challenge cancelled`;
                    await addDoc(chessActivityCollection, {
                        type: 'challenge_response',
                        uid: currentUid,
                        name: currentUser.name,
                        message: msg,
                        createdAt: serverTimestamp()
                    });
                }
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        function renderChessGames() {
            const container = document.getElementById('chessGamesList');
            if (!container) return;
            // Show games where current user is involved
            const myGames = chessGames.filter(g => g.whiteUid === currentUid || g.blackUid === currentUid);
            if (myGames.length === 0) {
                container.innerHTML = `<div class="empty-note">No games recorded yet.</div>`;
                return;
            }
            let html = '';
            myGames.forEach(g => {
                const isWhite = g.whiteUid === currentUid;
                const opponent = isWhite ? g.blackName : g.whiteName;
                const result = g.result; // 'win', 'loss', 'draw'
                const resultText = result === 'win' ? (isWhite ? 'Win' : 'Loss') : result === 'loss' ? (isWhite ? 'Loss' : 'Win') : 'Draw';
                const date = g.playedAt ? new Date(g.playedAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                const ratingChange = g.ratingChange || 0;
                const resultClass = result === 'win' ? 'win' : result === 'loss' ? 'loss' : 'draw';
                html += `
                    <div class="game-item">
                        <div><span class="opponent">${opponent}</span> · ${date}</div>
                        <div><span class="result ${resultClass}">${resultText}</span> ${ratingChange !== 0 ? '(' + (ratingChange > 0 ? '+' : '') + ratingChange + ')' : ''}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function renderChessActivity() {
            const container = document.getElementById('chessActivityList');
            if (!container) return;
            if (chessActivity.length === 0) {
                container.innerHTML = `<div class="empty-note">No activity yet.</div>`;
                return;
            }
            let html = '';
            chessActivity.forEach(a => {
                const date = a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                html += `
                    <div style="padding:6px 0; border-bottom:1px solid var(--paper-line); font-size:13px;">
                        <span style="color:var(--ink-soft);">${date}</span> — ${a.message}
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        // Admin event form triggers
        document.addEventListener('DOMContentLoaded', () => {
            const chessEventCreateBtn = document.getElementById('chessEventCreateBtn');
            if (chessEventCreateBtn) {
                chessEventCreateBtn.addEventListener('click', openChessEventForm);
            }
        });

        // ============================================================
        // ========== COMMUNITY POSTS ==================================
        // ============================================================
