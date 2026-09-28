// ============================================================================
// SECTION: 86_ledger.js
// The Ledger — Integrated Syllabus & Curriculum Tracker Module
// Full Firestore progress synchronization per authenticated student
// Supports 10 branches, 8 semesters, electives, units, topics & search
// ============================================================================

        let ledgerCurrentBranch = 'civil';
        let ledgerCurrentView = '1';
        let ledgerSearchQuery = '';
        let ledgerOpenCourses = new Set();
        let ledgerState = {}; // branchId -> { [key]: 1 }
        let ledgerUnsub = null;
        let ledgerSyncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
        let ledgerSyncTimeout = null;

        const LEDGER_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
        const LEDGER_CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>`;

        // Helper keys
        function getLedgerFlagKey(branch, view, code) {
            return `f|${branch}|${view}|${code}`;
        }

        function getLedgerTopicKey(branch, d, unitIdx, topicIdx) {
            return `t|${branch}|${d}|${unitIdx}|${topicIdx}`;
        }

        function getActiveLedgerBranch() {
            return LEDGER_DATA[ledgerCurrentBranch] || LEDGER_DATA['civil'];
        }

        function getLedgerCourseTopicCount(sub) {
            if (!sub.d) return 0;
            const detail = LEDGER_DETAIL[sub.d];
            if (!detail || !detail.u) return 0;
            return detail.u.reduce((acc, u) => acc + (u.p ? u.p.length : 0), 0);
        }

        function getLedgerCourseTopicsDone(branch, sub) {
            if (!sub.d) return 0;
            const detail = LEDGER_DETAIL[sub.d];
            if (!detail || !detail.u) return 0;
            const branchMap = ledgerState[branch] || {};
            let count = 0;
            detail.u.forEach((u, uIdx) => {
                if (u.p) {
                    u.p.forEach((_, tIdx) => {
                        const key = getLedgerTopicKey(branch, sub.d, uIdx, tIdx);
                        if (branchMap[key]) count++;
                    });
                }
            });
            return count;
        }

        function isLedgerCourseDone(branch, sub, view) {
            const branchMap = ledgerState[branch] || {};
            const total = getLedgerCourseTopicCount(sub);
            if (total > 0) {
                return getLedgerCourseTopicsDone(branch, sub) === total || !!branchMap[getLedgerFlagKey(branch, view, sub.code)];
            }
            return !!branchMap[getLedgerFlagKey(branch, view, sub.code)];
        }

        function isLedgerUnitDone(branch, sub, unitIdx) {
            if (!sub.d) return false;
            const detail = LEDGER_DETAIL[sub.d];
            if (!detail || !detail.u || !detail.u[unitIdx] || !detail.u[unitIdx].p) return false;
            const topics = detail.u[unitIdx].p;
            if (!topics.length) return false;
            const branchMap = ledgerState[branch] || {};
            return topics.every((_, tIdx) => !!branchMap[getLedgerTopicKey(branch, sub.d, unitIdx, tIdx)]);
        }

        function getLedgerUnitTopicsDone(branch, sub, unitIdx) {
            if (!sub.d) return 0;
            const detail = LEDGER_DETAIL[sub.d];
            if (!detail || !detail.u || !detail.u[unitIdx] || !detail.u[unitIdx].p) return 0;
            const branchMap = ledgerState[branch] || {};
            let count = 0;
            detail.u[unitIdx].p.forEach((_, tIdx) => {
                if (branchMap[getLedgerTopicKey(branch, sub.d, unitIdx, tIdx)]) count++;
            });
            return count;
        }

        function getLedgerSemTotals(branch, semView) {
            const bData = LEDGER_DATA[branch];
            if (!bData || !bData.semesters || !bData.semesters[semView]) {
                return { total: 0, done: 0, coursesTotal: 0, coursesDone: 0 };
            }
            const subjects = bData.semesters[semView];
            let totalCredits = 0;
            let doneCredits = 0;
            let coursesTotal = subjects.length;
            let coursesDone = 0;

            subjects.forEach(sub => {
                const credits = Number(sub.credits) || 0;
                totalCredits += credits;
                if (isLedgerCourseDone(branch, sub, semView)) {
                    doneCredits += credits;
                    coursesDone++;
                }
            });

            return { total: totalCredits, done: doneCredits, coursesTotal, coursesDone };
        }

        function getLedgerBranchOverallStats(branch) {
            const bData = LEDGER_DATA[branch];
            if (!bData) {
                return { totalCredits: 0, doneCredits: 0, semsTotal: 0, semsDone: 0, topicsTotal: 0, topicsDone: 0 };
            }

            let totalCredits = 0;
            let doneCredits = 0;
            let semsTotal = 0;
            let semsDone = 0;
            let topicsTotal = 0;
            let topicsDone = 0;

            if (bData.semesters) {
                Object.keys(bData.semesters).forEach(semKey => {
                    const st = getLedgerSemTotals(branch, semKey);
                    totalCredits += st.total;
                    doneCredits += st.done;
                    semsTotal++;
                    if (st.total > 0 && st.done === st.total) {
                        semsDone++;
                    }
                    bData.semesters[semKey].forEach(sub => {
                        topicsTotal += getLedgerCourseTopicCount(sub);
                        topicsDone += getLedgerCourseTopicsDone(branch, sub);
                    });
                });
            }

            if (bData.extras) {
                bData.extras.forEach(extra => {
                    if (extra.groups) {
                        extra.groups.forEach(g => {
                            if (g.subjects) {
                                g.subjects.forEach(sub => {
                                    topicsTotal += getLedgerCourseTopicCount(sub);
                                    topicsDone += getLedgerCourseTopicsDone(branch, sub);
                                });
                            }
                        });
                    }
                });
            }

            return { totalCredits, doneCredits, semsTotal, semsDone, topicsTotal, topicsDone };
        }

        // Auto-detect student branch from profile
        function detectUserBranch() {
            if (currentUser && currentUser.branchId) {
                const b = String(currentUser.branchId).toLowerCase().trim();
                if (LEDGER_DATA[b]) return b;
                // Special mapping check
                if (b === 'cse' && LEDGER_DATA['cse']) return 'cse';
                if (b === 'it' && LEDGER_DATA['it']) return 'it';
                if (b === 'ece' && LEDGER_DATA['ece']) return 'ece';
                if (b === 'eceiot' && LEDGER_DATA['eceiot']) return 'eceiot';
                if (b === 'civil' && LEDGER_DATA['civil']) return 'civil';
                if (b === 'ee' && LEDGER_DATA['ee']) return 'ee';
                if (b === 'me' && LEDGER_DATA['me']) return 'me';
                if (b === 'chemical' && LEDGER_DATA['chemical']) return 'chemical';
                if (b === 'bba' && LEDGER_DATA['bba']) return 'bba';
                if (b === 'bpharm' && LEDGER_DATA['bpharm']) return 'bpharm';
            }
            return 'civil';
        }

        // Navigation toggler
        function toggleLedgerSection(show) {
            const ledgerView = document.getElementById('ledgerView');
            const mainShell = document.getElementById('mainShell');
            const telegramView = document.getElementById('telegramView');
            const chessView = document.getElementById('chessClubView');
            if (!ledgerView) return;

            if (show) {
                if (mainShell) mainShell.style.display = 'none';
                if (telegramView) telegramView.style.display = 'none';
                if (chessView) chessView.style.display = 'none';
                ledgerView.style.display = 'block';

                try { sessionStorage.setItem('mmmut_active_view', 'ledger'); } catch (_) {}

                if (typeof window.toggleSidebar === 'function') {
                    window.toggleSidebar(false);
                }

                // Initialize branch & data if first open
                if (!ledgerState[ledgerCurrentBranch]) {
                    ledgerCurrentBranch = detectUserBranch();
                }

                attachLedgerFirestoreListener(ledgerCurrentBranch);
                renderLedgerUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                ledgerView.style.display = 'none';
                if (mainShell) mainShell.style.display = 'block';
                try { sessionStorage.removeItem('mmmut_active_view'); } catch (_) {}

                // Clean up Firestore listener when navigating away
                cleanupLedgerListener();
            }
        }

        function cleanupLedgerListener() {
            if (ledgerUnsub) {
                ledgerUnsub();
                ledgerUnsub = null;
            }
        }

        // Attach Realtime Firestore Listener for the selected branch
        function attachLedgerFirestoreListener(branch) {
            cleanupLedgerListener();
            if (!currentUid || (typeof auth !== 'undefined' && !auth.currentUser)) {
                // Read from local cache if unauthenticated or offline
                try {
                    const local = localStorage.getItem(`mmmut_ledger_${branch}`);
                    if (local) ledgerState[branch] = JSON.parse(local);
                } catch (_) {}
                updateLedgerSyncBadge('offline');
                renderLedgerUI();
                return;
            }

            updateLedgerSyncBadge('syncing');

            try {
                const docRef = doc(db, 'users', currentUid, 'ledgerProgress', branch);
                ledgerUnsub = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        ledgerState[branch] = data.completed || {};
                    } else {
                        // Check if we have local cache to migrate/seed
                        let cached = null;
                        try {
                            const raw = localStorage.getItem(`mmmut_ledger_${branch}`);
                            if (raw) cached = JSON.parse(raw);
                        } catch (_) {}

                        if (cached && Object.keys(cached).length > 0) {
                            ledgerState[branch] = cached;
                            saveLedgerProgressToFirestore(branch);
                        } else {
                            ledgerState[branch] = {};
                        }
                    }
                    updateLedgerSyncBadge('synced');
                    renderLedgerUI();
                }, (error) => {
                    console.warn('[Ledger] Firestore progress listener warning:', error);
                    updateLedgerSyncBadge('offline');
                    // Fallback to local cache
                    try {
                        const local = localStorage.getItem(`mmmut_ledger_${branch}`);
                        if (local && !ledgerState[branch]) ledgerState[branch] = JSON.parse(local);
                    } catch (_) {}
                    renderLedgerUI();
                });
            } catch (err) {
                console.error('[Ledger] Failed to attach listener:', err);
                updateLedgerSyncBadge('error');
            }
        }

        // Debounced Firestore Save
        function saveLedgerProgress(branch) {
            // Immediately persist to local cache for instant resilience
            try {
                localStorage.setItem(`mmmut_ledger_${branch}`, JSON.stringify(ledgerState[branch] || {}));
            } catch (_) {}

            updateLedgerSyncBadge('syncing');

            if (ledgerSyncTimeout) clearTimeout(ledgerSyncTimeout);
            ledgerSyncTimeout = setTimeout(() => {
                saveLedgerProgressToFirestore(branch);
            }, 300);
        }

        async function saveLedgerProgressToFirestore(branch) {
            if (!currentUid || (typeof auth !== 'undefined' && !auth.currentUser)) {
                updateLedgerSyncBadge('offline');
                return;
            }

            try {
                const docRef = doc(db, 'users', currentUid, 'ledgerProgress', branch);
                await setDoc(docRef, {
                    branch: branch,
                    completed: ledgerState[branch] || {},
                    lastUpdated: serverTimestamp()
                }, { merge: true });
                updateLedgerSyncBadge('synced');
            } catch (err) {
                console.warn('[Ledger] Progress sync error:', err);
                updateLedgerSyncBadge('offline');
            }
        }

        function updateLedgerSyncBadge(status) {
            ledgerSyncStatus = status;
            const badge = document.getElementById('ledgerSyncBadge');
            if (!badge) return;

            if (status === 'synced') {
                badge.className = 'ledger-sync-badge synced';
                badge.innerHTML = `<span class="sync-dot"></span><span>Cloud Synced</span>`;
            } else if (status === 'syncing') {
                badge.className = 'ledger-sync-badge syncing';
                badge.innerHTML = `<span class="sync-dot"></span><span>Saving…</span>`;
            } else if (status === 'offline') {
                badge.className = 'ledger-sync-badge offline';
                badge.innerHTML = `<span class="sync-dot"></span><span>Offline Mode</span>`;
            } else {
                badge.className = 'ledger-sync-badge error';
                badge.innerHTML = `<span class="sync-dot"></span><span>Sync Paused</span>`;
            }
        }

        // Subject, Unit, and Topic action handlers
        function handleLedgerAction(act, view, code, unitIdx, topicIdx) {
            const branch = ledgerCurrentBranch;
            if (!ledgerState[branch]) ledgerState[branch] = {};
            const branchMap = ledgerState[branch];
            const bData = LEDGER_DATA[branch];
            if (!bData) return;

            // Locate subject
            let sub = null;
            if (bData.semesters && bData.semesters[view]) {
                sub = bData.semesters[view].find(s => s.code === code);
            }
            if (!sub && bData.extras) {
                const extra = bData.extras.find(x => x.id === view);
                if (extra && extra.groups) {
                    for (const g of extra.groups) {
                        const found = g.subjects.find(s => s.code === code);
                        if (found) { sub = found; break; }
                    }
                }
            }
            if (!sub) return;

            const detail = sub.d ? LEDGER_DETAIL[sub.d] : null;

            if (act === 'open') {
                if (!sub.d) return;
                const sid = `${branch}|${view}|${code}`;
                if (ledgerOpenCourses.has(sid)) {
                    ledgerOpenCourses.delete(sid);
                } else {
                    ledgerOpenCourses.add(sid);
                }
                renderLedgerCoursesOnly();
                return;
            }

            if (act === 'subj') {
                const currentlyDone = isLedgerCourseDone(branch, sub, view);
                const willBeDone = !currentlyDone;
                const fKey = getLedgerFlagKey(branch, view, sub.code);

                if (willBeDone) {
                    branchMap[fKey] = 1;
                } else {
                    delete branchMap[fKey];
                }

                if (detail && detail.u) {
                    detail.u.forEach((u, uI) => {
                        if (u.p) {
                            u.p.forEach((_, tI) => {
                                const tKey = getLedgerTopicKey(branch, sub.d, uI, tI);
                                if (willBeDone) branchMap[tKey] = 1;
                                else delete branchMap[tKey];
                            });
                        }
                    });
                }

                saveLedgerProgress(branch);
                renderLedgerUI();
                return;
            }

            if (act === 'unit') {
                const uI = parseInt(unitIdx, 10);
                if (!detail || !detail.u || !detail.u[uI]) return;
                const u = detail.u[uI];
                const unitDone = isLedgerUnitDone(branch, sub, uI);
                const willBeDone = !unitDone;

                if (u.p) {
                    u.p.forEach((_, tI) => {
                        const tKey = getLedgerTopicKey(branch, sub.d, uI, tI);
                        if (willBeDone) branchMap[tKey] = 1;
                        else delete branchMap[tKey];
                    });
                }

                // If all topics in all units are now done, we can flag whole course or remove flag if not
                delete branchMap[getLedgerFlagKey(branch, view, sub.code)];

                saveLedgerProgress(branch);
                renderLedgerUI();
                return;
            }

            if (act === 'topic') {
                const uI = parseInt(unitIdx, 10);
                const tI = parseInt(topicIdx, 10);
                if (!detail) return;
                const tKey = getLedgerTopicKey(branch, sub.d, uI, tI);

                if (branchMap[tKey]) {
                    delete branchMap[tKey];
                } else {
                    branchMap[tKey] = 1;
                }

                // Clear course whole-cleared flag so topic count determines course status
                delete branchMap[getLedgerFlagKey(branch, view, sub.code)];

                saveLedgerProgress(branch);
                renderLedgerUI();
                return;
            }
        }

        function handleLedgerBranchChange(newBranch) {
            if (!LEDGER_DATA[newBranch]) return;
            ledgerCurrentBranch = newBranch;
            ledgerCurrentView = '1';
            ledgerSearchQuery = '';
            ledgerOpenCourses.clear();
            const qEl = document.getElementById('ledgerSearchInput');
            if (qEl) qEl.value = '';

            attachLedgerFirestoreListener(ledgerCurrentBranch);
            renderLedgerUI();
        }

        function handleLedgerSemesterChange(newView) {
            ledgerCurrentView = String(newView);
            ledgerSearchQuery = '';
            const qEl = document.getElementById('ledgerSearchInput');
            if (qEl) qEl.value = '';
            renderLedgerUI();
        }

        function handleLedgerSearchInput(query) {
            ledgerSearchQuery = (query || '').trim().toLowerCase();
            const clearBtn = document.getElementById('ledgerSearchClearBtn');
            if (clearBtn) {
                clearBtn.style.display = ledgerSearchQuery ? 'inline-flex' : 'none';
            }
            renderLedgerCoursesOnly();
        }

        function clearLedgerSearch() {
            ledgerSearchQuery = '';
            const qEl = document.getElementById('ledgerSearchInput');
            if (qEl) qEl.value = '';
            const clearBtn = document.getElementById('ledgerSearchClearBtn');
            if (clearBtn) clearBtn.style.display = 'none';
            renderLedgerCoursesOnly();
        }

        // Reset branch confirmation modal
        function openLedgerResetModal() {
            const modal = document.getElementById('ledgerResetModal');
            const targetBranchName = document.getElementById('ledgerResetBranchName');
            if (targetBranchName) {
                targetBranchName.textContent = getActiveLedgerBranch().name;
            }
            if (modal) modal.classList.add('open');
        }

        function closeLedgerResetModal() {
            const modal = document.getElementById('ledgerResetModal');
            if (modal) modal.classList.remove('open');
        }

        async function confirmLedgerReset() {
            const branch = ledgerCurrentBranch;
            ledgerState[branch] = {};
            try {
                localStorage.removeItem(`mmmut_ledger_${branch}`);
            } catch (_) {}

            closeLedgerResetModal();
            saveLedgerProgress(branch);
            renderLedgerUI();
            showToast(`Progress for ${getActiveLedgerBranch().name} has been reset.`);
        }

        // Course matching for search
        function matchLedgerCourse(sub, q) {
            if (!q) return true;
            if (sub.code.toLowerCase().includes(q)) return true;
            if (sub.name.toLowerCase().includes(q)) return true;
            if (sub.d) {
                const detail = LEDGER_DETAIL[sub.d];
                if (detail) {
                    if (detail.c && detail.c.toLowerCase().includes(q)) return true;
                    if (detail.u) {
                        for (const u of detail.u) {
                            if (u.t && u.t.toLowerCase().includes(q)) return true;
                            if (u.p && u.p.some(topic => topic.toLowerCase().includes(q))) return true;
                        }
                    }
                }
            }
            return false;
        }

        // Render functions
        function renderLedgerUI() {
            const container = document.getElementById('ledgerView');
            if (!container) return;

            renderLedgerBranchSelector();
            renderLedgerSummaryStats();
            renderLedgerSemesterChips();
            renderLedgerCoursesOnly();
            // Keep the dashboard Syllabus Tracker preview in sync (single source: Ledger state).
            if (typeof renderDashboardLedgerPreview === 'function') {
                try { renderDashboardLedgerPreview(); } catch (_) {}
            }
        }

        function renderLedgerBranchSelector() {
            const sel = document.getElementById('ledgerBranchSelect');
            if (!sel) return;

            if (sel.options.length === 0) {
                let opts = '';
                Object.keys(LEDGER_DATA).forEach(k => {
                    opts += `<option value="${k}">${escapeHtml(LEDGER_DATA[k].name)}</option>`;
                });
                sel.innerHTML = opts;
            }
            sel.value = ledgerCurrentBranch;
        }

        function renderLedgerSummaryStats() {
            const branch = ledgerCurrentBranch;
            const stats = getLedgerBranchOverallStats(branch);
            const semTotals = getLedgerSemTotals(branch, ledgerCurrentView);

            const pct = stats.totalCredits > 0 ? Math.round((stats.doneCredits / stats.totalCredits) * 100) : 0;
            const remainingTopics = Math.max(0, stats.topicsTotal - stats.topicsDone);

            const elTotalCreds = document.getElementById('ledgerStatCredits');
            if (elTotalCreds) elTotalCreds.textContent = `${stats.doneCredits} / ${stats.totalCredits}`;

            const elPct = document.getElementById('ledgerStatPct');
            if (elPct) elPct.textContent = `${pct}%`;

            const elTopicsDone = document.getElementById('ledgerStatTopicsDone');
            if (elTopicsDone) elTopicsDone.textContent = `${stats.topicsDone}`;

            const elTopicsRem = document.getElementById('ledgerStatTopicsRemaining');
            if (elTopicsRem) elTopicsRem.textContent = `${remainingTopics}`;

            const elSemProgress = document.getElementById('ledgerStatSemProgress');
            if (elSemProgress) {
                const isEx = !!(LEDGER_DATA[branch].extras || []).find(x => x.id === ledgerCurrentView);
                if (isEx) {
                    elSemProgress.textContent = `Electives / Special Track`;
                } else {
                    const semPct = semTotals.total > 0 ? Math.round((semTotals.done / semTotals.total) * 100) : 0;
                    elSemProgress.textContent = `${semTotals.done}/${semTotals.total} credits (${semPct}%)`;
                }
            }

            const bar = document.getElementById('ledgerSemProgressBar');
            if (bar) {
                const semPct = semTotals.total > 0 ? Math.round((semTotals.done / semTotals.total) * 100) : 0;
                bar.style.width = `${semPct}%`;
            }

            const footerBranchName = document.getElementById('ledgerFooterBranchName');
            if (footerBranchName) {
                footerBranchName.textContent = getActiveLedgerBranch().name;
            }
        }

        function renderLedgerSemesterChips() {
            const strip = document.getElementById('ledgerSemesterStrip');
            if (!strip) return;

            const bData = getActiveLedgerBranch();
            let html = '';

            if (bData.semesters) {
                const sems = Object.keys(bData.semesters).map(Number).sort((a, b) => a - b);
                sems.forEach(s => {
                    const sStr = String(s);
                    const totals = getLedgerSemTotals(ledgerCurrentBranch, sStr);
                    const isDone = totals.total > 0 && totals.done === totals.total;
                    const isActive = sStr === ledgerCurrentView && !ledgerSearchQuery;
                    const roman = LEDGER_ROMAN[s - 1] || s;

                    html += `<button type="button" class="ledger-chip ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" 
                        onclick="handleLedgerSemesterChange('${sStr}')" title="Semester ${roman}">
                        <span>Sem ${roman}</span>
                        ${isDone ? `<span class="chip-check">✓</span>` : ''}
                    </button>`;
                });
            }

            if (bData.extras && bData.extras.length > 0) {
                html += `<div class="ledger-chip-divider"></div>`;
                bData.extras.forEach(extra => {
                    const isActive = extra.id === ledgerCurrentView && !ledgerSearchQuery;
                    html += `<button type="button" class="ledger-chip text-chip ${isActive ? 'active' : ''}" 
                        onclick="handleLedgerSemesterChange('${extra.id}')" title="${escapeHtml(extra.label)}">
                        <span>${escapeHtml(extra.label)}</span>
                    </button>`;
                });
            }

            strip.innerHTML = html;
        }

        function renderLedgerCoursesOnly() {
            const listEl = document.getElementById('ledgerCourseList');
            if (!listEl) return;

            const branch = ledgerCurrentBranch;
            const bData = getActiveLedgerBranch();
            let html = '';

            if (ledgerSearchQuery) {
                // Search across all views
                let matchesCount = 0;
                const searchResults = [];

                // Semesters
                if (bData.semesters) {
                    Object.keys(bData.semesters).forEach(semKey => {
                        const semLabel = `Sem ${LEDGER_ROMAN[Number(semKey) - 1] || semKey}`;
                        bData.semesters[semKey].forEach(sub => {
                            if (matchLedgerCourse(sub, ledgerSearchQuery)) {
                                searchResults.push({ sub, view: semKey, tag: semLabel });
                            }
                        });
                    });
                }

                // Extras
                if (bData.extras) {
                    bData.extras.forEach(extra => {
                        if (extra.groups) {
                            extra.groups.forEach(g => {
                                if (g.subjects) {
                                    g.subjects.forEach(sub => {
                                        if (matchLedgerCourse(sub, ledgerSearchQuery)) {
                                            searchResults.push({ sub, view: extra.id, tag: extra.label });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                if (searchResults.length === 0) {
                    listEl.innerHTML = `
                        <div class="ledger-empty-state">
                            <div class="empty-icon">🔍</div>
                            <h4>No matching courses or topics</h4>
                            <p>No results found for "${escapeHtml(ledgerSearchQuery)}" in ${escapeHtml(bData.name)}. Try searching for keywords like "beams", "circuits", "matrix", or a subject code.</p>
                            <button class="btn-secondary" onclick="clearLedgerSearch()" style="margin-top:10px;">Clear Search</button>
                        </div>`;
                    return;
                }

                html += `<div class="ledger-search-banner">Found <strong>${searchResults.length}</strong> matching courses & topics in <strong>${escapeHtml(bData.name)}</strong>:</div>`;
                html += `<div class="ledger-courses-table">`;
                searchResults.forEach(item => {
                    html += renderLedgerCourseRow(item.sub, item.view, item.tag);
                });
                html += `</div>`;
                listEl.innerHTML = html;
                return;
            }

            // Normal Semester / Extra View
            const extra = (bData.extras || []).find(x => x.id === ledgerCurrentView);
            if (extra) {
                if (extra.groups && extra.groups.length > 0) {
                    extra.groups.forEach(g => {
                        html += `<div class="ledger-group-heading">
                            <h4>${escapeHtml(g.title)}</h4>
                            <span class="group-count">${g.subjects ? g.subjects.length : 0} subjects</span>
                        </div>`;
                        html += `<div class="ledger-courses-table">`;
                        if (g.subjects) {
                            g.subjects.forEach(s => {
                                html += renderLedgerCourseRow(s, ledgerCurrentView, null);
                            });
                        }
                        html += `</div>`;
                    });
                }
            } else {
                const subjects = (bData.semesters && bData.semesters[ledgerCurrentView]) || [];
                if (subjects.length === 0) {
                    listEl.innerHTML = `
                        <div class="ledger-empty-state">
                            <div class="empty-icon">📚</div>
                            <h4>No courses listed for Semester ${LEDGER_ROMAN[Number(ledgerCurrentView) - 1] || ledgerCurrentView}</h4>
                            <p>Curriculum records are being updated for this semester.</p>
                        </div>`;
                    return;
                }

                html += `<div class="ledger-courses-table">`;
                subjects.forEach(s => {
                    html += renderLedgerCourseRow(s, ledgerCurrentView, null);
                });
                html += `</div>`;
            }

            listEl.innerHTML = html;
        }

        function renderLedgerCourseRow(sub, view, tag) {
            const branch = ledgerCurrentBranch;
            const sid = `${branch}|${view}|${sub.code}`;
            const detail = sub.d ? LEDGER_DETAIL[sub.d] : null;
            const totalTopics = getLedgerCourseTopicCount(sub);
            const doneTopics = totalTopics > 0 ? getLedgerCourseTopicsDone(branch, sub) : 0;
            const courseDone = isLedgerCourseDone(branch, sub, view);
            const isPartial = !courseDone && doneTopics > 0;
            const isOpen = ledgerOpenCourses.has(sid) && detail;
            const pct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

            let rowHtml = `
            <div class="ledger-course-item ${courseDone ? 'course-done' : ''} ${isOpen ? 'course-open' : ''}">
                <div class="ledger-course-header">
                    <!-- Checkbox -->
                    <button type="button" class="ledger-cb ${courseDone ? 'checked' : ''} ${isPartial ? 'partial' : ''}" 
                        onclick="handleLedgerAction('subj', '${view}', '${escapeHtml(sub.code)}')"
                        role="checkbox" aria-checked="${courseDone}" aria-label="Mark ${escapeHtml(sub.name)} completed">
                        ${LEDGER_CHECK_SVG}
                    </button>

                    <!-- Code Badge -->
                    <div class="ledger-course-code">${escapeHtml(sub.code)}</div>

                    <!-- Course Title & Progress Bar -->
                    <div class="ledger-course-main" onclick="handleLedgerAction('open', '${view}', '${escapeHtml(sub.code)}')">
                        <div class="ledger-course-title-wrap">
                            <span class="ledger-course-title">${escapeHtml(sub.name)}</span>
                            ${tag ? `<span class="ledger-sem-tag">${escapeHtml(tag)}</span>` : ''}
                        </div>
                        <div class="ledger-course-meta-inline">
                            ${totalTopics > 0 ? `
                                <div class="ledger-mini-bar-wrap">
                                    <div class="ledger-mini-bar"><i style="width:${pct}%"></i></div>
                                    <span class="ledger-mini-label">${doneTopics} of ${totalTopics} topics (${pct}%)</span>
                                </div>
                            ` : `
                                <span class="ledger-not-loaded-tag">Unit syllabus not loaded · mark course as a whole</span>
                            `}
                        </div>
                    </div>

                    <!-- L-T-P (Desktop / Tablet) -->
                    <div class="ledger-course-ltp" title="Lecture-Tutorial-Practical">${escapeHtml(sub.ltp || '—')}</div>

                    <!-- Credits -->
                    <div class="ledger-course-credits" title="Credits">${sub.credits != null ? sub.credits + ' cr' : '—'}</div>

                    <!-- Expand Chevron -->
                    <button type="button" class="ledger-expand-btn ${isOpen ? 'open' : ''}" 
                        onclick="handleLedgerAction('open', '${view}', '${escapeHtml(sub.code)}')"
                        aria-label="Toggle details for ${escapeHtml(sub.name)}" ${detail ? '' : 'disabled style="opacity:0.3;"'}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>`;

            if (isOpen && detail) {
                rowHtml += renderLedgerCourseDetailsPanel(sub, view, detail);
            }

            rowHtml += `</div>`;
            return rowHtml;
        }

        function renderLedgerCourseDetailsPanel(sub, view, detail) {
            const branch = ledgerCurrentBranch;
            let panel = `<div class="ledger-course-details-panel">`;

            // Metadata card
            panel += `<div class="ledger-detail-meta-grid">`;
            if (detail.c) panel += `<div class="meta-item"><span class="meta-label">Category</span><span class="meta-val">${escapeHtml(detail.c)}</span></div>`;
            if (detail.p) panel += `<div class="meta-item"><span class="meta-label">Prerequisites</span><span class="meta-val">${escapeHtml(detail.p)}</span></div>`;
            if (detail.k) panel += `<div class="meta-item"><span class="meta-label">Contact Hours</span><span class="meta-val">${escapeHtml(detail.k)}</span></div>`;
            if (detail.cr != null) panel += `<div class="meta-item"><span class="meta-label">Credits</span><span class="meta-val">${detail.cr}</span></div>`;
            if (detail.a) panel += `<div class="meta-item full-width"><span class="meta-label">Evaluation Scheme</span><span class="meta-val">${escapeHtml(detail.a)}</span></div>`;
            panel += `</div>`;

            // Objectives
            if (detail.o) {
                panel += `
                <div class="ledger-section-block">
                    <h5 class="ledger-section-title">Course Objectives</h5>
                    <p class="ledger-section-text">${escapeHtml(detail.o)}</p>
                </div>`;
            }

            // Outcomes
            if (detail.co && detail.co.length > 0) {
                panel += `
                <div class="ledger-section-block">
                    <h5 class="ledger-section-title">Course Outcomes</h5>
                    <ul class="ledger-outcomes-list">
                        ${detail.co.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>`;
            }

            // Units & Topics
            if (detail.u && detail.u.length > 0) {
                panel += `
                <div class="ledger-section-block">
                    <div class="ledger-section-header-flex">
                        <h5 class="ledger-section-title">Units &amp; Topic Syllabus</h5>
                        <span class="ledger-section-sub">Tick individual topics or whole units as covered</span>
                    </div>
                    <div class="ledger-units-accordion">`;

                detail.u.forEach((u, uIdx) => {
                    const uTotal = u.p ? u.p.length : 0;
                    const uDone = getLedgerUnitTopicsDone(branch, sub, uIdx);
                    const unitComplete = uTotal > 0 && uDone === uTotal;
                    const unitPartial = !unitComplete && uDone > 0;

                    panel += `
                    <div class="ledger-unit-card">
                        <div class="ledger-unit-header">
                            <button type="button" class="ledger-cb unit-cb ${unitComplete ? 'checked' : ''} ${unitPartial ? 'partial' : ''}" 
                                onclick="handleLedgerAction('unit', '${view}', '${escapeHtml(sub.code)}', ${uIdx})"
                                role="checkbox" aria-checked="${unitComplete}" aria-label="Mark Unit ${escapeHtml(u.l)} completed">
                                ${LEDGER_CHECK_SVG}
                            </button>
                            <div class="ledger-unit-title-wrap">
                                <span class="ledger-unit-badge">Unit ${escapeHtml(u.l)}</span>
                                <span class="ledger-unit-title">${escapeHtml(u.t || 'Topics')}</span>
                            </div>
                            <div class="ledger-unit-metrics">
                                ${u.h ? `<span class="unit-hours">${u.h} hrs</span>` : ''}
                                <span class="unit-counter">${uDone}/${uTotal} covered</span>
                            </div>
                        </div>

                        <!-- Topics Grid -->
                        <div class="ledger-topics-grid">`;

                    if (u.p) {
                        u.p.forEach((topicText, tIdx) => {
                            const isTopicChecked = !!(ledgerState[branch] && ledgerState[branch][getLedgerTopicKey(branch, sub.d, uIdx, tIdx)]);
                            panel += `
                            <div class="ledger-topic-item ${isTopicChecked ? 'topic-done' : ''}" 
                                onclick="handleLedgerAction('topic', '${view}', '${escapeHtml(sub.code)}', ${uIdx}, ${tIdx})">
                                <button type="button" class="ledger-cb topic-cb ${isTopicChecked ? 'checked' : ''}" 
                                    tabindex="-1" aria-hidden="true">
                                    ${LEDGER_CHECK_SVG}
                                </button>
                                <span class="ledger-topic-text">${escapeHtml(topicText)}</span>
                            </div>`;
                        });
                    }

                    panel += `</div></div>`;
                });

                panel += `</div></div>`;
            }

            // Reference Books
            if (detail.b && detail.b.length > 0) {
                panel += `
                <div class="ledger-section-block">
                    <h5 class="ledger-section-title">Recommended Books &amp; Textbooks</h5>
                    <ol class="ledger-books-list">
                        ${detail.b.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                    </ol>
                </div>`;
            }

            panel += `</div>`;
            return panel;
        }
