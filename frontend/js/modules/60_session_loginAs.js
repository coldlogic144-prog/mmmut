// ============================================================================
// SECTION: 60_session_loginAs.js
// loginAs() session starter wiring all listeners + gates
// Source: index.html lines 6161-6349 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================


        // ========== LOGIN AS ==========
        async function loginAs(record, uid) {
            currentUid = uid;
            attendanceCache = await loadAttendanceMap(uid);
            currentUser = record;
            isAdmin = record.isAdmin || false;
            adminRequested = record.adminRequested || false;
            lastReadPosts = record.lastReadPosts || 0;

            document.getElementById('authScreen').style.display = 'none';
            // HARD roll-number gate — the whole app stays hidden until the account
            // is verified, so NO feature is usable before verification succeeds.
            rollGateLocked = ROLL_MIGRATION_ENABLED && rollMigrationActive(record) && record.migrationStatus !== 'verified';
            document.getElementById('app').style.display = rollGateLocked ? 'none' : 'block';

            const branch = getBranch(record.branchId);
            document.getElementById('pillName').textContent = record.name;
            document.getElementById('pillBranch').textContent = branch.name.replace('B.Tech — ', '') + ' · Sec ' + record
                .section;
            document.getElementById('pillAvatar').textContent = record.name.split(' ').map(w => w[0]).slice(0, 2).join('')
                .toUpperCase();

            const topRight = document.querySelector('.topbar-right');
            const existing = topRight.querySelector('.btn-admin, .btn-request-admin');
            if (existing) existing.remove();

            const btn = document.createElement('button');
            if (isAdmin) {
                btn.className = 'btn-admin';
                btn.textContent = '⚙️ Admin';
                btn.onclick = () => openAdminPanel();
            } else if (!adminRequested) {
                btn.className = 'btn-request-admin';
                btn.textContent = '👤 Request Admin';
                btn.onclick = () => requestAdminRole();
            } else {
                btn.className = 'btn-request-admin';
                btn.textContent = '⏳ Request Pending';
                btn.disabled = true;
                btn.style.opacity = '0.6';
            }
            const userPill = topRight.querySelector('.user-pill');
            if (userPill && userPill.nextSibling) {
                topRight.insertBefore(btn, userPill.nextSibling);
            } else {
                topRight.appendChild(btn);
            }

            scheduleCache = buildSchedule(branch, record.section);
            renderTopbarDate();
            renderSchedule();
            renderEvents();
            await renderAttendanceStats();
            renderPostsFeed();
            historyDate = new Date();
            renderHistoryView();

            const syllabusSel = document.getElementById('syllabusBranch');
            const syllabusBranchMap = {
                'cse': 'cse',
                'it': 'it',
                'ece': 'ece',
                'eceiot': 'eceiot',
                'civil': 'civil',
                'me': 'me',
                'chemical': 'chemical',
                'ee': 'ee',
                'bba': 'bba',
                'bpharm': 'bpharm'
            };
            const mapped = syllabusBranchMap[record.branchId];
            if (mapped && syllabusData[mapped]) {
                syllabusSel.value = mapped;
                document.getElementById('syllabusYear').value = '1';
                loadSyllabus();
            }

            if (window._holidaysUnsub) window._holidaysUnsub();
            window._holidaysUnsub = listenHolidays();

            if (window._postsUnsub) window._postsUnsub();
            window._postsUnsub = onSnapshot(query(postsCollection, orderBy('createdAt', 'desc')), (snap) => {
                allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                updateNotificationBadge();
                if (document.getElementById('postsFeedContent')) {
                    renderPostsFeed();
                }
            });

            if (window._communityPostsUnsub) window._communityPostsUnsub();
            window._communityPostsUnsub = onSnapshot(
                query(communityPostsCollection, orderBy('createdAt', 'desc')),
                (snap) => {
                    communityPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    renderCommunityPosts();
                    const newBtn = document.getElementById('cpNewPostBtn');
                    if (newBtn) {
                        newBtn.style.display = isAdmin ? 'inline-flex' : 'none';
                    }
                }
            );

            if (window._feedbackUnsub) window._feedbackUnsub();
            window._feedbackUnsub = onSnapshot(
                query(feedbackCollection, where('uid', '==', currentUid), orderBy('createdAt', 'desc')),
                (snap) => {
                    if (document.getElementById('feedbackPreviewContent')) {
                        renderFeedbackPreview();
                    }
                    snap.docChanges().forEach(change => {
                        if (change.type === 'modified') {
                            const data = change.doc.data();
                            if (data.adminReply && data.adminReply !== data._prevReply) {
                                showToast('💬 Your feedback has received a reply.');
                            }
                            data._prevReply = data.adminReply;
                        }
                    });
                }
            );

            if (currentUid) {
                const unsub = onSnapshot(doc(usersCollection, currentUid), (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        isAdmin = data.isAdmin || false;
                        adminRequested = data.adminRequested || false;
                        if (data.lastReadPosts !== undefined) lastReadPosts = data.lastReadPosts;
                        updateNotificationBadge();
                        const btn2 = document.querySelector(
                        '.topbar-right .btn-admin, .topbar-right .btn-request-admin');
                        if (btn2) btn2.remove();
                        const b = document.createElement('button');
                        if (isAdmin) {
                            b.className = 'btn-admin';
                            b.textContent = '⚙️ Admin';
                            b.onclick = () => openAdminPanel();
                        } else if (!adminRequested) {
                            b.className = 'btn-request-admin';
                            b.textContent = '👤 Request Admin';
                            b.onclick = () => requestAdminRole();
                        } else {
                            b.className = 'btn-request-admin';
                            b.textContent = '⏳ Request Pending';
                            b.disabled = true;
                            b.style.opacity = '0.6';
                        }
                        const pill = document.querySelector('.topbar-right .user-pill');
                        if (pill && pill.nextSibling) {
                            pill.parentNode.insertBefore(b, pill.nextSibling);
                        } else {
                            document.querySelector('.topbar-right').appendChild(b);
                        }
                        const newBtn = document.getElementById('cpNewPostBtn');
                        if (newBtn) {
                            newBtn.style.display = isAdmin ? 'inline-flex' : 'none';
                        }
                    }
                });
                window._adminUnsub = unsub;
            }

            setTimeout(updateNotificationBadge, 500);
            renderFeedbackPreview();
            loadExistingRating();
            renderCommunityPosts();
            // Initialize chess club if not already
            initChessClub();

            // Initialize push notifications (additive, non-blocking, never prompts
            // automatically — see PART 4/9). Runs after auth is fully established.
            updatePushButtonUI();
            initializePushNotifications().catch(e => console.warn('Push init skipped:', e));
            // Hard roll-number gate — non-dismissible; unlocks only on verification.
            enforceRollGate();
        }

        // ========== ROLL-NUMBER VERIFICATION — CORE (hard-gate, additive) ==========
        // Safety rules enforced below:
        //   * roll numbers come ONLY from studentRoster (admin-imported CSV).
        //   * a roll number is linked exactly once (create-only userRolls doc).
        //   * existing users/{uid} docs are merged (updateDoc) — never replaced.
        //   * Firebase UIDs, emails, passwords and attendance are untouched.
        //   * UNVERIFIED accounts are HARD-GATED: the app stays hidden behind the
        //     verification modal until the roll number is verified — no feature is
        //     usable first, and the gate cannot be dismissed.
        //   * the full name is NEVER asked — it is auto-assigned from the roster.
        //   * verified users keep working with their normal username/password login.