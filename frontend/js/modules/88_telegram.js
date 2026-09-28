// ============================================================================
// SECTION: 88_telegram.js
// Private Telegram Access System & State Machine Controller
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        let telegramAppUnsub = null;
        let currentTelegramAppState = 'NOT_APPLIED';
        let currentTelegramAppData = null;
        let telegramTokenWatcherTimer = null;

        async function getIdTokenSafe() {
            try {
                if (typeof auth !== 'undefined' && auth.currentUser) {
                    return await auth.currentUser.getIdToken();
                }
            } catch (_) {}
            return null;
        }

        async function fetchChannelInviteLink() {
            const cfg = window.TELEGRAM_CONFIG || (typeof TELEGRAM_CONFIG !== 'undefined' ? TELEGRAM_CONFIG : {});

            // Attempt to retrieve real private invite link from backend (auth required)
            if (typeof apiGetTelegramChannelInvite === 'function') {
                try {
                    const idToken = await getIdTokenSafe();
                    const res = await apiGetTelegramChannelInvite(idToken);
                    if (res && res.ok && res.inviteLink) {
                        const link = String(res.inviteLink).trim();
                        if (link && !link.includes('mmmut_erp_bot') && !link.includes('mmmut_erp_official')) {
                            cfg.channelUrl = link;
                            if (res.channelName) cfg.channelName = res.channelName;
                            return link;
                        }
                    }
                } catch (e) {
                    console.warn('[Telegram] Could not fetch channel invite link from backend:', e);
                }
            }

            // No hardcoded fallback: invite must come from the server after auth.
            return cfg.channelUrl || null;
        }

        function openTelegramWeb(sameTab = false) {
            const url = (window.TELEGRAM_CONFIG && window.TELEGRAM_CONFIG.webUrl) ||
                (typeof TELEGRAM_CONFIG !== 'undefined' && TELEGRAM_CONFIG.webUrl) ||
                'https://web.telegram.org/k/';
            if (sameTab) {
                try { sessionStorage.setItem('mmmut_active_view', 'telegram'); } catch (_) {}
                window.location.href = url;
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }

        async function openTelegramChannel() {
            const inviteUrl = await fetchChannelInviteLink();
            if (!inviteUrl) {
                showToast('⚠️ Private channel invite link is not configured on the server yet. Please contact the administrator.');
                return;
            }
            try {
                window.open(inviteUrl, '_blank', 'noopener,noreferrer');
            } catch (_) {}
            launchTelegramDestination(inviteUrl, 'Roomhub (Private Channel)');
        }

        function launchTelegramDestination(url, title = 'Telegram Channel Access') {
            if (!url) return;
            const container = document.getElementById('telegramLaunchPortal');
            if (container) {
                container.style.display = 'block';
                const titleEl = document.getElementById('tgPortalTitle');
                if (titleEl) titleEl.textContent = title;
                const urlEl = document.getElementById('tgPortalUrl');
                if (urlEl) urlEl.textContent = url;
                const webBtn = document.getElementById('btnPortalOpenWeb');
                if (webBtn) {
                    webBtn.onclick = () => {
                        try { sessionStorage.setItem('mmmut_active_view', 'telegram'); } catch (_) {}
                        window.location.href = url;
                    };
                }
                const tabBtn = document.getElementById('btnPortalOpenTab');
                if (tabBtn) {
                    tabBtn.onclick = () => {
                        window.open(url, '_blank', 'noopener,noreferrer');
                    };
                }
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }

        function closeTelegramPortal() {
            const container = document.getElementById('telegramLaunchPortal');
            if (container) container.style.display = 'none';
        }

        // ============================================================================
        // REAL-TIME LISTENER FOR STUDENT'S TELEGRAM APPLICATION
        // ============================================================================
        function setupTelegramAppListener(uid) {
            if (telegramAppUnsub) {
                try { telegramAppUnsub(); } catch (_) {}
                telegramAppUnsub = null;
            }
            if (!uid) {
                currentTelegramAppState = 'NOT_APPLIED';
                currentTelegramAppData = null;
                renderTelegramUI();
                return;
            }

            try {
                const appDocRef = doc(telegramApplicationsCollection, uid);
                telegramAppUnsub = onSnapshot(appDocRef, (snap) => {
                    if (!snap.exists()) {
                        currentTelegramAppState = 'NOT_APPLIED';
                        currentTelegramAppData = null;
                    } else {
                        currentTelegramAppData = snap.data();
                        const rawStatus = currentTelegramAppData.status || 'PENDING_ADMIN_APPROVAL';
                        // Decouple Stage 1 (ERP Admin) from Stage 2 (Telegram Connection)
                        if (rawStatus === 'ADMIN_APPROVED' && !currentTelegramAppData.telegramUserId) {
                            currentTelegramAppState = 'TELEGRAM_NOT_CONNECTED';
                        } else {
                            currentTelegramAppState = rawStatus;
                        }
                    }
                    renderTelegramUI();
                }, (err) => {
                    console.warn('[Telegram] Listener notice:', err.message);
                });
            } catch (err) {
                console.error('[Telegram] Failed to attach application listener:', err);
            }
        }

        // ============================================================================
        // STATE TRANSITION ACTIONS (STUDENT FACING)
        // ============================================================================

        // Stage 1: Student submits application for ERP Admin Review
        async function applyForTelegramAccess() {
            if (!currentUser || !currentUid) {
                showToast('Please sign in to apply for Telegram access.');
                return;
            }

            const btn = document.getElementById('btnApplyTelegram');
            if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

            try {
                const studentName = (currentProfile && (currentProfile.name || currentProfile.displayName)) ||
                    (currentUser && currentUser.displayName) || 'Student';
                const studentRoll = (currentProfile && (currentProfile.rollNumber || currentProfile.pendingRollNumber)) || '';
                const studentBranch = (currentProfile && currentProfile.branchId) || '';
                const studentUsername = (currentProfile && currentProfile.username) || '';

                const appDoc = {
                    uid: currentUid,
                    studentName: studentName,
                    studentRoll: studentRoll,
                    studentBranch: studentBranch,
                    studentUsername: studentUsername,
                    status: 'PENDING_ADMIN_APPROVAL',
                    appliedAt: serverTimestamp(),
                    reviewedAt: null,
                    reviewedBy: null,
                    rejectionReason: null,
                    telegramUserId: null,
                    telegramUsername: null
                };

                await setDoc(doc(telegramApplicationsCollection, currentUid), appDoc);
                showToast('✅ Application submitted for ERP Administrator approval.');
            } catch (err) {
                console.error('[Telegram] Error submitting application:', err);
                showToast('Failed to submit application: ' + (err.message || 'Permission denied'));
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Apply for Telegram Access'; }
            }
        }

        // Re-apply if previously rejected by admin
        async function reapplyForTelegramAccess() {
            if (!currentUser || !currentUid) return;
            const btn = document.getElementById('btnReapplyTelegram');
            if (btn) { btn.disabled = true; btn.textContent = 'Re-submitting…'; }

            try {
                await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                    status: 'PENDING_ADMIN_APPROVAL',
                    appliedAt: serverTimestamp(),
                    rejectionReason: null
                });
                showToast('✅ Application re-submitted for Administrator review.');
            } catch (err) {
                console.error('[Telegram] Reapply error:', err);
                showToast('Error re-applying: ' + err.message);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Re-apply for Access'; }
            }
        }

        // Stage 2, Step A: Connect Telegram Identity via Official Deep-link (/start <token>)
        async function connectTelegramAccount() {
            if (!currentUser || !currentUid) return;
            const btn = document.getElementById('btnConnectTelegram');
            if (btn) { btn.disabled = true; btn.textContent = 'Generating Link…'; }

            try {
                const idToken = await getIdTokenSafe();

                // Request single-use linking token from server-side backend
                const res = typeof apiCreateTelegramToken === 'function' ?
                    await apiCreateTelegramToken(currentUid, idToken) : null;

                if (res && res.ok && res.deepLink) {
                    window.open(res.deepLink, '_blank', 'noopener,noreferrer');
                    showToast('Opening Telegram bot… Press Start in Telegram to link.');
                    startTelegramTokenWatcher(res.token, idToken);
                } else {
                    showToast('Could not generate Telegram link. Please try again after login.');
                }
            } catch (err) {
                console.error('[Telegram] Error connecting Telegram:', err);
                showToast('Could not initiate Telegram connection.');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Connect Telegram Account'; }
            }
        }

        // Polling watcher while student links with bot on Telegram
        function startTelegramTokenWatcher(token, idToken) {
            if (telegramTokenWatcherTimer) {
                clearInterval(telegramTokenWatcherTimer);
                telegramTokenWatcherTimer = null;
            }

            let attempts = 0;
            telegramTokenWatcherTimer = setInterval(async () => {
                attempts++;
                if (attempts > 40) { // 2 minutes max
                    clearInterval(telegramTokenWatcherTimer);
                    telegramTokenWatcherTimer = null;
                    return;
                }

                if (typeof apiGetTelegramTokenStatus === 'function') {
                    const fresh = idToken || await getIdTokenSafe();
                    const statusRes = await apiGetTelegramTokenStatus(token, fresh);
                    if (statusRes && statusRes.ok && statusRes.linked) {
                        clearInterval(telegramTokenWatcherTimer);
                        telegramTokenWatcherTimer = null;

                        // Token is single-use and consumed server-side; webhook
                        // already recorded the link. Refresh from Firestore listener.
                        showToast('🎉 Telegram account connected successfully!');
                    }
                }
            }, 3000);
        }

        // Fallback helper to record handle if bot server is unreachable
        async function promptManualTelegramHandle() {
            const handle = prompt('Enter your Telegram @username to link with your ERP profile:');
            if (!handle) return;
            const clean = handle.trim().replace(/^@/, '');
            if (!clean) return;

            try {
                await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                    telegramUsername: clean,
                    telegramUserId: clean,
                    status: 'JOIN_REQUEST_NOT_SENT',
                    linkedAt: serverTimestamp()
                });
                showToast('Telegram username saved. Proceed to request channel access.');
            } catch (e) {
                showToast('Failed to save Telegram handle: ' + e.message);
            }
        }

        // Stage 2, Step B: Student requests to join the private channel
        async function requestChannelJoin() {
            if (!currentUser || !currentUid) return;
            const btn = document.getElementById('btnRequestJoinChannel');
            if (btn) { btn.disabled = true; btn.textContent = 'Resolving Link…'; }

            try {
                // Fetch private channel invite link
                const inviteUrl = await fetchChannelInviteLink();
                if (!inviteUrl) {
                    showToast('⚠️ Private channel invite link is not configured on the server yet. Please contact the administrator.');
                    return;
                }

                // Open private channel join request link safely
                try {
                    window.open(inviteUrl, '_blank', 'noopener,noreferrer');
                } catch (_) {}
                launchTelegramDestination(inviteUrl, 'Roomhub (Private Channel Join Request)');

                // Update state to JOIN_REQUEST_PENDING
                await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                    status: 'JOIN_REQUEST_PENDING',
                    joinRequestedAt: serverTimestamp()
                });

                showToast('Join link opened. Once you request in Telegram, wait for channel admin approval.');
            } catch (err) {
                console.error('[Telegram] Error recording join request:', err);
                showToast('Failed to record join request: ' + err.message);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Request to Join Private Channel'; }
            }
        }

        // Stage 2, Step C: Check membership status via Telegram getChatMember
        async function checkMembershipStatus() {
            if (!currentUser || !currentUid) return;
            const btn = document.getElementById('btnCheckMembership');
            if (btn) { btn.disabled = true; btn.textContent = 'Checking Status…'; }

            try {
                const tgUserId = currentTelegramAppData?.telegramUserId;
                const idToken = await getIdTokenSafe();

                let checkRes = null;
                if (typeof apiCheckTelegramMembership === 'function') {
                    checkRes = await apiCheckTelegramMembership(currentUid, tgUserId, idToken);
                }

                if (checkRes && checkRes.ok) {
                    if (checkRes.isMember || checkRes.status === 'CHANNEL_APPROVED') {
                        // User is an active member
                        await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                            status: 'CHANNEL_APPROVED',
                            verifiedAt: serverTimestamp()
                        });
                        showToast('🎉 Membership verified! Welcome to the private channel.');
                    } else if (checkRes.status === 'CHANNEL_REJECTED' && checkRes.rejectionEvidence) {
                        // Reliable evidence of rejection
                        await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                            status: 'CHANNEL_REJECTED',
                            reviewedAt: serverTimestamp()
                        });
                        showToast('Your channel join request was declined by the administrator.');
                    } else {
                        // USER CORRECTION ENFORCEMENT:
                        // If not currently a member, REMAINS JOIN_REQUEST_PENDING!
                        // Do NOT falsely display CHANNEL_REJECTED.
                        showToast('⏳ Your join request is still pending channel administrator approval.');
                    }
                } else {
                    // Backend unavailable or fallback
                    showToast('Status check: still awaiting channel administrator approval.');
                }
            } catch (err) {
                console.error('[Telegram] Membership check error:', err);
                showToast('Could not verify membership right now. Please try again.');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = '🔄 Check Membership Status'; }
            }
        }

        // ============================================================================
        // UI RENDERING FOR THE 8 STATES
        // ============================================================================
        function renderTelegramUI() {
            const container = document.getElementById('telegramStateContainer');
            if (!container) return;

            const state = currentTelegramAppState || 'NOT_APPLIED';
            const data = currentTelegramAppData || {};

            let html = '';

            switch (state) {
                case 'NOT_APPLIED':
                    html = `
                    <div class="tg-state-card">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 1 of 2</span>
                            <span class="tg-status-badge tg-badge-neutral">Not Applied</span>
                        </div>
                        <h3 class="tg-state-title">Apply for University Telegram Access</h3>
                        <p class="tg-state-desc">
                            Access to the private university channel is restricted to verified MMMUT students.
                            First, submit your application for ERP Administrator verification.
                        </p>
                        <div class="tg-applicant-box">
                            <div class="tg-info-row"><span>Student Name:</span> <strong>${escapeHtml((currentProfile && (currentProfile.name || currentProfile.displayName)) || (currentUser && currentUser.displayName) || 'Student')}</strong></div>
                            <div class="tg-info-row"><span>Roll Number:</span> <strong>${escapeHtml((currentProfile && (currentProfile.rollNumber || currentProfile.pendingRollNumber)) || '—')}</strong></div>
                            <div class="tg-info-row"><span>Branch:</span> <strong>${escapeHtml(getBranchName((currentProfile && currentProfile.branchId) || ''))}</strong></div>
                        </div>
                        <div class="tg-actions">
                            <button id="btnApplyTelegram" class="btn-primary" onclick="applyForTelegramAccess()">
                                <span>Apply for Telegram Access</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'PENDING_ADMIN_APPROVAL':
                    html = `
                    <div class="tg-state-card">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 1 of 2</span>
                            <span class="tg-status-badge tg-badge-warning">⏳ Pending ERP Admin Review</span>
                        </div>
                        <h3 class="tg-state-title">Application Under Review</h3>
                        <p class="tg-state-desc">
                            Your application has been received and is queued for verification by an ERP Administrator.
                            Once approved, you will be invited to link your Telegram account and join the private channel.
                        </p>
                        <div class="tg-timeline-note">
                            <span>🕒</span>
                            <span>Submitted: ${data.appliedAt ? formatDate(data.appliedAt) : 'Just now'}. Reviews typically complete within 24 hours.</span>
                        </div>
                    </div>`;
                    break;

                case 'ADMIN_REJECTED':
                    html = `
                    <div class="tg-state-card tg-card-danger">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 1 of 2</span>
                            <span class="tg-status-badge tg-badge-danger">❌ Application Not Approved</span>
                        </div>
                        <h3 class="tg-state-title">ERP Access Request Declined</h3>
                        <p class="tg-state-desc">
                            Your application for Telegram access was reviewed and declined by the ERP administrator.
                        </p>
                        ${data.rejectionReason ? `
                        <div class="tg-reason-box">
                            <strong>Reason:</strong> ${escapeHtml(data.rejectionReason)}
                        </div>` : ''}
                        <div class="tg-actions">
                            <button id="btnReapplyTelegram" class="btn-primary" onclick="reapplyForTelegramAccess()">
                                <span>Re-apply for Access</span>
                                <span>↺</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'ADMIN_APPROVED':
                case 'TELEGRAM_NOT_CONNECTED':
                    html = `
                    <div class="tg-state-card tg-card-success">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 2 of 2</span>
                            <span class="tg-status-badge tg-badge-success">✅ ERP Admin Approved</span>
                        </div>
                        <h3 class="tg-state-title">Connect Your Telegram Account</h3>
                        <p class="tg-state-desc">
                            Your student application has been verified! Now link your Telegram account so our official
                            bot can recognize you when you request access to the private university channel.
                        </p>
                        <div class="tg-helper-note">
                            <span>💡</span>
                            <span>Clicking the button will open Telegram with our official verification bot. Simply tap <strong>Start</strong> to link.</span>
                        </div>
                        <div class="tg-actions">
                            <button id="btnConnectTelegram" class="btn-telegram-primary" onclick="connectTelegramAccount()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
                                <span>Connect Telegram Account</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'JOIN_REQUEST_NOT_SENT':
                    html = `
                    <div class="tg-state-card">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 2 of 2</span>
                            <span class="tg-status-badge tg-badge-info">🔗 Telegram Linked</span>
                        </div>
                        <h3 class="tg-state-title">Telegram Connected: @${escapeHtml(data.telegramUsername || data.telegramUserId || 'User')}</h3>
                        <p class="tg-state-desc">
                            Your Telegram identity is verified. You may now request to join the private university channel.
                            The channel administrator will approve your request inside Telegram.
                        </p>
                        <div class="tg-actions">
                            <button id="btnRequestJoinChannel" class="btn-primary" onclick="requestChannelJoin()">
                                <span>Request to Join Private Channel</span>
                                <span>↗</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'JOIN_REQUEST_PENDING':
                    html = `
                    <div class="tg-state-card">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 2 of 2</span>
                            <span class="tg-status-badge tg-badge-warning">⏳ Join Request Pending Channel Admin</span>
                        </div>
                        <h3 class="tg-state-title">Awaiting Channel Administrator Approval</h3>
                        <p class="tg-state-desc">
                            Your join request has been delivered to the private Telegram channel.
                            The channel administrator will review and accept your request in Telegram.
                        </p>
                        <div class="tg-helper-note">
                            <span>ℹ️</span>
                            <span>Once the channel admin accepts your join request, click the button below to verify your membership.</span>
                        </div>
                        <div class="tg-actions">
                            <button id="btnCheckMembership" class="btn-secondary" onclick="checkMembershipStatus()">
                                <span>🔄 Check Membership Status</span>
                            </button>
                            <button class="btn-secondary" onclick="requestChannelJoin()">
                                <span>Re-open Channel Link</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'CHANNEL_APPROVED':
                    html = `
                    <div class="tg-state-card tg-card-success">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Access Granted</span>
                            <span class="tg-status-badge tg-badge-success">🎉 Active Channel Member</span>
                        </div>
                        <h3 class="tg-state-title">Welcome to Roomhub (Private Channel)</h3>
                        <p class="tg-state-desc">
                            Your membership is confirmed! You have full access to official semester notices, circulars,
                            academic updates, and university broadcasts.
                        </p>
                        <div class="tg-actions">
                            <button class="btn-telegram-primary" onclick="openTelegramChannel()">
                                <span>Open Roomhub Channel</span>
                                <span>↗</span>
                            </button>
                            <button class="btn-secondary" onclick="openTelegramWeb()">
                                <span>Launch Telegram Web</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'CHANNEL_REJECTED':
                    html = `
                    <div class="tg-state-card tg-card-danger">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Channel Access</span>
                            <span class="tg-status-badge tg-badge-danger">🚫 Request Declined</span>
                        </div>
                        <h3 class="tg-state-title">Channel Join Request Declined</h3>
                        <p class="tg-state-desc">
                            Your join request to the private Telegram channel was declined by the channel administrator.
                        </p>
                        <div class="tg-actions">
                            <button class="btn-secondary" onclick="requestChannelJoin()">
                                <span>Re-submit Join Request</span>
                            </button>
                            <button id="btnCheckMembership" class="btn-secondary" onclick="checkMembershipStatus()">
                                <span>🔄 Re-check Status</span>
                            </button>
                        </div>
                    </div>`;
                    break;
            }

            container.innerHTML = html;
        }

        function getBranchName(branchId) {
            if (typeof getBranch === 'function') {
                const b = getBranch(branchId);
                if (b && b.name) return b.name;
            }
            return branchId || 'All Branches';
        }

        function renderTelegramSection() {
            const config = window.TELEGRAM_CONFIG || (typeof TELEGRAM_CONFIG !== 'undefined' ? TELEGRAM_CONFIG : {});
            const chNameEl = document.getElementById('telegramChannelName');
            const chDescEl = document.getElementById('telegramChannelDesc');
            if (chNameEl && config.channelName) {
                chNameEl.textContent = config.channelName;
            }
            if (chDescEl && config.channelDescription) {
                chDescEl.textContent = config.channelDescription;
            }

            // Also re-render dynamic state machine UI
            renderTelegramUI();
        }

        function toggleTelegramSection(show) {
            const telegramView = document.getElementById('telegramView');
            const mainShell = document.getElementById('mainShell');
            const chessView = document.getElementById('chessClubView');
            if (!telegramView) return;

            if (show) {
                if (chessView) chessView.style.display = 'none';
                const ledgerView = document.getElementById('ledgerView');
                if (ledgerView) ledgerView.style.display = 'none';
                if (mainShell) mainShell.style.display = 'none';
                telegramView.style.display = 'block';

                try { sessionStorage.setItem('mmmut_active_view', 'telegram'); } catch (_) {}

                // Close mobile sidebar drawer if open
                if (typeof window.toggleSidebar === 'function') {
                    window.toggleSidebar(false);
                }

                // If signed in, initialize real-time application listener
                if (currentUid && (!telegramAppUnsub || currentTelegramAppState === 'NOT_APPLIED')) {
                    setupTelegramAppListener(currentUid);
                }

                // Render dynamic channel info from configuration
                renderTelegramSection();

                // Smoothly scroll to the top of view
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                telegramView.style.display = 'none';
                if (mainShell) mainShell.style.display = 'flex';
                try { sessionStorage.removeItem('mmmut_active_view'); } catch (_) {}
            }
        }
