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
            try {
                attendanceCache = await loadAttendanceMap(uid);
            } catch (attErr) {
                console.warn('loadAttendanceMap non-fatal error:', attErr);
                attendanceCache = {};
            }
            currentUser = record;
            isAdmin = record.isAdmin || false;
            adminRequested = record.adminRequested || false;
            lastReadPosts = record.lastReadPosts || 0;

            const ls = document.getElementById('loadingScreen');
            if (ls) ls.style.display = 'none';
            document.getElementById('authScreen').style.display = 'none';
            rollGateLocked = false;
            document.getElementById('app').style.display = 'block';

            const branch = getBranch(record.branchId) || BRANCHES[0];
            document.getElementById('pillName').textContent = record.name || record.username || 'Student';
            document.getElementById('pillBranch').textContent = (branch ? branch.name.replace('B.Tech — ', '') : 'B.Tech') + ' · Sec ' + (record.section || 'A');
            document.getElementById('pillAvatar').textContent = (record.name || record.username || 'ST').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

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
            if (topRight) {
                const userMenuContainer = document.getElementById('userMenuContainer');
                if (userMenuContainer) {
                    topRight.insertBefore(btn, userMenuContainer);
                } else {
                    topRight.appendChild(btn);
                }
            }

            // Show/hide sidebar Admin Panel button based on admin status
            const sidebarAdminBtn = document.getElementById('sidebarAdminBtn');
            if (sidebarAdminBtn) {
                sidebarAdminBtn.style.display = isAdmin ? 'flex' : 'none';
            }

            const dropdownAdminLabel = document.getElementById('dropdownAdminLabel');
            const dropdownAdminIcon = document.getElementById('dropdownAdminIcon');
            if (dropdownAdminLabel) {
                if (isAdmin) {
                    dropdownAdminLabel.textContent = 'Admin Panel';
                    if (dropdownAdminIcon) dropdownAdminIcon.textContent = '🛡️';
                } else if (!adminRequested) {
                    dropdownAdminLabel.textContent = 'Request Admin Role';
                    if (dropdownAdminIcon) dropdownAdminIcon.textContent = '👤';
                } else {
                    dropdownAdminLabel.textContent = 'Admin Request Pending';
                    if (dropdownAdminIcon) dropdownAdminIcon.textContent = '⏳';
                }
            }

            scheduleCache = buildSchedule(branch, record.section);
            renderTopbarDate();
            renderSchedule();
            renderEvents();
            await renderAttendanceStats();
            renderPostsFeed();
            historyDate = new Date();
            renderHistoryView();

            // Curriculum viewer merged into Syllabus Tracker — refresh the
            // dashboard preview instead of the removed static table.
            if (typeof renderDashboardLedgerPreview === 'function') {
                try { renderDashboardLedgerPreview(); } catch (_) {}
            }

            if (window._holidaysUnsub) window._holidaysUnsub();
            window._holidaysUnsub = listenHolidays();

            if (typeof setupTelegramAppListener === 'function') {
                setupTelegramAppListener(record.uid || currentUid);
            }

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
                        const tr = document.querySelector('.topbar-right');
                        if (tr) {
                            const userMenuContainer = document.getElementById('userMenuContainer');
                            if (userMenuContainer) {
                                tr.insertBefore(b, userMenuContainer);
                            } else {
                                tr.appendChild(b);
                            }
                        }
                        const sidebarAdminBtn2 = document.getElementById('sidebarAdminBtn');
                        if (sidebarAdminBtn2) {
                            sidebarAdminBtn2.style.display = isAdmin ? 'flex' : 'none';
                        }
                        const dropdownAdminLabel2 = document.getElementById('dropdownAdminLabel');
                        const dropdownAdminIcon2 = document.getElementById('dropdownAdminIcon');
                        if (dropdownAdminLabel2) {
                            if (isAdmin) {
                                dropdownAdminLabel2.textContent = 'Admin Panel';
                                if (dropdownAdminIcon2) dropdownAdminIcon2.textContent = '🛡️';
                            } else if (!adminRequested) {
                                dropdownAdminLabel2.textContent = 'Request Admin Role';
                                if (dropdownAdminIcon2) dropdownAdminIcon2.textContent = '👤';
                            } else {
                                dropdownAdminLabel2.textContent = 'Admin Request Pending';
                                if (dropdownAdminIcon2) dropdownAdminIcon2.textContent = '⏳';
                            }
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
            rollGateLocked = false;
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