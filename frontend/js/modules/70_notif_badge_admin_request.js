// ============================================================================
// SECTION: 70_notif_badge_admin_request.js
// Notification badge, posts-read, admin role request, admin roll-verify tab
// Source: index.html lines 6647-6864 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== NOTIFICATION ==========
        function updateNotificationBadge() {
            const badge = document.getElementById('notifBadge');
            if (!badge) return;
            const unread = allPosts.filter(p => {
                const ts = p.createdAt?.seconds || 0;
                return ts > lastReadPosts;
            }).length;
            if (unread > 0) {
                badge.style.display = 'inline';
                badge.textContent = unread > 99 ? '99+' : unread;
            } else {
                badge.style.display = 'none';
            }
        }

        async function markPostsRead() {
            if (!currentUid) return;
            const now = Date.now() / 1000;
            try {
                await updateDoc(doc(usersCollection, currentUid), { lastReadPosts: now });
                lastReadPosts = now;
                updateNotificationBadge();
            } catch (e) {}
        }

        function scrollToPosts() {
            const card = document.getElementById('postsTopCard');
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(markPostsRead, 1000);
            }
        }

        // ========== REQUEST ADMIN ==========
        async function requestAdminRole() {
            if (!currentUid || !currentUser) { showToast('Please log in first.'); return; }
            if (adminRequested) { showToast('You already have a pending request.'); return; }
            if (isAdmin) { showToast('You are already an admin.'); return; }
            try {
                const q = query(adminRequestsCollection, where('uid', '==', currentUid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const existing = snap.docs[0].data();
                    if (existing.status === 'pending') {
                        adminRequested = true;
                        await updateDoc(doc(usersCollection, currentUid), { adminRequested: true });
                        showToast('Your request is already pending.');
                        return;
                    } else if (existing.status === 'approved') {
                        showToast('You are already an admin.');
                        return;
                    } else if (existing.status === 'rejected') {
                        await deleteDoc(doc(adminRequestsCollection, snap.docs[0].id));
                    }
                }
                await addDoc(adminRequestsCollection, {
                    uid: currentUid,
                    username: currentUser.username,
                    name: currentUser.name,
                    branchId: currentUser.branchId,
                    section: currentUser.section,
                    status: 'pending',
                    requestedAt: serverTimestamp()
                });
                await updateDoc(doc(usersCollection, currentUid), { adminRequested: true });
                adminRequested = true;
                showToast('Admin request sent! Waiting for approval.');
                const btn = document.querySelector('.topbar-right .btn-request-admin');
                if (btn) { btn.textContent = '⏳ Request Pending';
                    btn.disabled = true;
                    btn.style.opacity = '0.6'; }
            } catch (e) {
                console.error(e);
                showToast('Failed to send request: ' + e.message);
            }
        }

        // ========== ADMIN: ROLL VERIFICATION (uses the EXISTING isAdmin system) ==========
        async function renderAdminRollVerify() {
            const el = document.getElementById('adminRollVerifyContent');
            if (!el) return;
            try {
                const userSnap = await getDocs(usersCollection);
                const users = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const needReview = users.filter(u => (u.migrationStatus || 'pending') !== 'verified' || (u.pendingRollNumber));
                let html = '<div style="font-size:13px;color:var(--ink-soft);margin-bottom:14px;">' +
                    'Students whose roll-number link is pending / in manual review / rejected. Approve only after checking the roster.</div>';
                if (!needReview.length) {
                    html += '<div class="empty-note">No pending roll number links. 🎉</div>';
                } else {
                    html += '<div style="overflow-x:auto;max-height:520px;overflow-y:auto;">' +
                        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
                        '<thead style="background:var(--ink);color:#F1ECDD;position:sticky;top:0;">' +
                        '<tr><th style="padding:9px 8px;text-align:left;">Name</th>' +
                        '<th style="padding:9px 8px;text-align:left;">Username</th>' +
                        '<th style="padding:9px 8px;text-align:left;">Roll entered</th>' +
                        '<th style="padding:9px 8px;text-align:left;">Status</th>' +
                        '<th style="padding:9px 8px;text-align:left;">Actions</th></tr></thead><tbody>';
                    needReview.forEach(u => {
                        const roll = u.rollNumber || u.pendingRollNumber || '';
                        const reasons = u.migrationReviewReason ? ' <small style="color:var(--brick);">(' + escapeHtml(u.migrationReviewReason) + ')</small>' : '';
                        const actions = (u.migrationStatus === 'verified')
                            ? '<span style="color:var(--moss);">✓ verified</span>'
                            : '<button class="btn-primary" style="margin:0 4px 0 0;padding:5px 10px;font-size:12px;" onclick="adminApproveRoll(\'' + u.id + '\',\'' + escapeHtml(u.username || '') + '\',\'' + roll + '\')">Approve</button>' +
                              '<button class="btn-secondary" style="margin:0 4px 0 0;padding:5px 10px;font-size:12px;" onclick="adminRejectRoll(\'' + u.id + '\',\'' + roll + '\')">Reject</button>' +
                              '<button class="btn-secondary" style="margin:0;padding:5px 10px;font-size:12px;" onclick="adminManualRoll(\'' + u.id + '\')">Review</button>';
                        html += '<tr style="border-bottom:1px solid var(--paper-line);">' +
                            '<td style="padding:8px;">' + escapeHtml(u.name || '—') + '</td>' +
                            '<td style="padding:8px;" class="mono">' + escapeHtml(u.username || '—') + '</td>' +
                            '<td style="padding:8px;" class="mono">' + (roll ? escapeHtml(roll) : '—') + '</td>' +
                            '<td style="padding:8px;">' + rollMigrationLabel(u.migrationStatus) + reasons + '</td>' +
                            '<td style="padding:8px;white-space:nowrap;">' + actions + '</td></tr>';
                    });
                    html += '</tbody></table></div>';
                }
                html += '<hr style="border:none;border-top:1px solid var(--paper-line);margin:18px 0;" />' +
                    '<div style="max-width:480px;">' +
                    '<label style="font-weight:600;font-size:13px;">Look up a roll number (roster + current claim)</label>' +
                    '<div style="display:flex;gap:8px;margin-top:8px;">' +
                    '<input id="adminRollLookupInput" placeholder="2026011001" maxlength="12" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--paper-line);font-size:13px;" />' +
                    '<button class="btn-primary" style="margin:0;padding:8px 18px;" onclick="adminRollLookup()">Look up</button>' +
                    '</div><div id="adminRollLookupResult" style="margin-top:10px;font-size:13px;line-height:1.6;"></div></div>';
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = '<div class="empty-note">Error loading roll verification: ' + escapeHtml(e.message) + '</div>';
            }
        }

        function escapeHtml(s) {
            return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[ch]));
        }

        async function adminRollLookup() {
            const roll = normalizeRollInput(document.getElementById('adminRollLookupInput').value);
            const out = document.getElementById('adminRollLookupResult');
            if (!out) return;
            if (!ROLL_NUMBER_PATTERN.test(roll)) { out.innerHTML = 'Enter a 10-digit roll number.'; return; }
            let html = '';
            const rSnap = await getDoc(doc(studentRosterCollection, roll)).catch(() => null);
            if (rSnap && rSnap.exists()) {
                const r = rSnap.data();
                html += '• Roster: <b>' + escapeHtml(r.formalName || r.applicantName) + '</b> — ' +
                    escapeHtml(r.enrollmentNo || '') + ' (' + escapeHtml(r.branchName || '?') + ')<br/>';
            } else {
                html += '• Not present in the import roster.<br/>';
            }
            const cSnap = await getDoc(doc(userRollsCollection, roll)).catch(() => null);
            if (cSnap && cSnap.exists()) {
                const c = cSnap.data();
                html += '• Claimed by uid <span class="mono">' + escapeHtml(c.uid || '?') + '</span> (' +
                    escapeHtml(c.username || '') + ').<br/>';
            } else {
                html += '• Not claimed by anyone yet.<br/>';
            }
            out.innerHTML = html;
        }

        async function adminApproveRoll(uid, username, roll) {
            roll = normalizeRollInput(roll || '');
            if (!roll) { showToast('No roll number entered for this user yet.'); return; }
            if (!window.confirm('Approve linking roll ' + roll + ' to this EXISTING account? This only merges fields — it never deletes Firebase users, changes UIDs, emails or passwords.')) return;
            const claim = await getDoc(doc(userRollsCollection, roll)).catch(() => null);
            if (claim && claim.exists() && claim.data().uid !== uid) {
                showToast('Refusing: roll ' + roll + ' is already linked to another uid (' + claim.data().uid + ').');
                return;
            }
            try {
                if (!claim || !claim.exists()) {
                    await setDoc(doc(userRollsCollection, roll), {
                        uid,
                        username: username || '',
                        rollNumber: roll,
                        verifiedAt: serverTimestamp()
                    }, { merge: false });
                }
                await updateDoc(doc(usersCollection, uid), {
                    rollNumber: roll,
                    migrationStatus: 'verified',
                    rollNumberVerified: true,
                    pendingRollNumber: '',
                    migrationReviewReason: '',
                    rollClaimedAt: serverTimestamp()
                });
                showToast('✓ Roll verified for ' + (username || uid));
                renderAdminRollVerify();
            } catch (e) {
                showToast('Approval failed: ' + e.message);
            }
        }

        async function adminRejectRoll(uid, roll) {
            if (!window.confirm('Reject this roll-number link request?')) return;
            try {
                await updateDoc(doc(usersCollection, uid), {
                    migrationStatus: 'rejected',
                    pendingRollNumber: normalizeRollInput(roll || ''),
                    migrationReviewReason: 'rejected-by-admin'
                });
                showToast('Roll request rejected.');
                renderAdminRollVerify();
            } catch (e) { showToast('Reject failed: ' + e.message); }
        }

        async function adminManualRoll(uid) {
            if (!window.confirm('Mark this roll-number link as needing manual review?')) return;
            try {
                await updateDoc(doc(usersCollection, uid), { migrationStatus: 'manual_review' });
                showToast('Marked for manual review.');
                renderAdminRollVerify();
            } catch (e) { showToast('Update failed: ' + e.message); }
        }

        // ========== ADMIN PANEL ==========
        let adminTab = 'dashboard';
