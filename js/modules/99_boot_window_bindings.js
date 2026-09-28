// ============================================================================
// SECTION: 99_boot_window_bindings.js
// boot(), auth-state router, window.* bindings for inline onclick, DOMContentLoaded
// Source: index.html lines 9894-10132 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        async function boot() {
            populateBranchOptions();
            fetchHolidays().catch(e => console.warn('Failed to fetch holidays during boot:', e));

            // Pre-initialize AI in the background – if it fails, log the error but don't break the app
            initAI().then(() => {
                if (aiReady && document.getElementById('aiBadgeDot')) {
                    const dot = document.getElementById('aiBadgeDot');
                    dot.style.display = 'block';
                    dot.textContent = '✦';
                    dot.style.fontSize = '10px';
                    dot.style.padding = '2px 4px';
                    dot.style.background = 'var(--teal)';
                    dot.style.color = '#fff';
                    dot.style.minWidth = '18px';
                    setTimeout(() => { dot.style.display = 'none'; }, 8000);
                }
            }).catch((err) => {
                // AI failed to load – log the error, the badge stays hidden
                console.warn('Ledger AI background initialization failed:', err);
                // Optionally show a subtle indicator that AI is unavailable
                const dot = document.getElementById('aiBadgeDot');
                if (dot) {
                    dot.style.display = 'block';
                    dot.textContent = '⚠';
                    dot.style.fontSize = '10px';
                    dot.style.padding = '2px 4px';
                    dot.style.background = 'var(--brick)';
                    dot.style.color = '#fff';
                    dot.style.minWidth = '18px';
                    setTimeout(() => { dot.style.display = 'none'; }, 5000);
                }
            });

            onAuthStateChanged(auth, async user => {
                if (window._mockUser) return;
                if (!user) {
                    currentUser = null;
                    currentUid = null;
                    attendanceCache = {};
                    isAdmin = false;
                    adminRequested = false;
                    document.getElementById('loadingScreen').style.display = 'none';
                    document.getElementById('app').style.display = 'none';
                    document.getElementById('authScreen').style.display = 'flex';
                    if (window._adminUnsub) { window._adminUnsub();
                        window._adminUnsub = null; }
                    if (window._holidaysUnsub) { window._holidaysUnsub();
                        window._holidaysUnsub = null; }
                    if (window._postsUnsub) { window._postsUnsub();
                        window._postsUnsub = null; }
                    if (window._feedbackUnsub) { window._feedbackUnsub();
                        window._feedbackUnsub = null; }
                    if (window._communityPostsUnsub) { window._communityPostsUnsub();
                        window._communityPostsUnsub = null; }
                    if (window._chessMembersUnsub) { window._chessMembersUnsub();
                        window._chessMembersUnsub = null; }
                    if (window._chessEventsUnsub) { window._chessEventsUnsub();
                        window._chessEventsUnsub = null; }
                    if (window._chessChallengesUnsub) { window._chessChallengesUnsub();
                        window._chessChallengesUnsub = null; }
                    if (window._chessActivityUnsub) { window._chessActivityUnsub();
                        window._chessActivityUnsub = null; }
                    if (window._chessGamesUnsub) { window._chessGamesUnsub();
                        window._chessGamesUnsub = null; }
                    if (typeof cleanupLedgerListener === 'function') {
                        cleanupLedgerListener();
                    }
                    // Always dismiss the (hard) roll gate when signing out so the
                    // login screen is never stuck behind the overlay.
                    rollGateLocked = false;
                    const _migrationModalEl = document.getElementById('migrationModal');
                    if (_migrationModalEl) _migrationModalEl.classList.remove('open');
                    updatePushButtonUI();
                    return;
                }
                // If user is already loaded and active (e.g. handleLogin or handleSignup just finished), don't duplicate
                if (currentUid === user.uid && currentUser) {
                    document.getElementById('loadingScreen').style.display = 'none';
                    return;
                }
                try {
                    const record = await loadUserProfile(user.uid);
                    await loginAs(record, user.uid);
                    document.getElementById('loadingScreen').style.display = 'none';
                    setTimeout(() => renderPostsFeed(), 500);
                    try {
                        if (sessionStorage.getItem('mmmut_active_view') === 'telegram') {
                            toggleTelegramSection(true);
                        } else if (sessionStorage.getItem('mmmut_active_view') === 'ledger') {
                            toggleLedgerSection(true);
                        }
                    } catch (_) {}
                } catch (e) {
                    if (signingUp) return;
                    if (window._mockUser) return;
                    console.warn('onAuthStateChanged loadUserProfile failed:', e);
                    await signOut(auth);
                    document.getElementById('loadingScreen').style.display = 'none';
                    document.getElementById('app').style.display = 'none';
                    document.getElementById('authScreen').style.display = 'flex';
                    showError('loginError', 'Could not load your profile. Please log in again.');
                }
            });
            setInterval(() => { if (currentUser) { renderTopbarDate();
                    renderSchedule();
                    renderHistoryView(); } }, 60000);
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAdminPanel();
                    closeProfileModal();
                    closeFeedbackForm();
                    closeMyFeedback();
                    closeRatingModal();
                    closeAdminReplyModal();
                    closeCreatePost();
                    if (typeof closeLedgerResetModal === 'function') closeLedgerResetModal();
                    if (document.getElementById('ledgerAiChat').classList.contains('open')) {
                        document.getElementById('ledgerAiChat').classList.remove('open');
                    } } });
            document.getElementById('adminPanel').addEventListener('click', (e) => {
                if (e.target === document.getElementById('adminPanel')) closeAdminPanel();
            });
            document.getElementById('profileModal').addEventListener('click', (e) => {
                if (e.target === document.getElementById('profileModal')) closeProfileModal();
            });
            document.getElementById('feedbackFormOverlay').addEventListener('click', (e) => {
                if (e.target === document.getElementById('feedbackFormOverlay')) closeFeedbackForm();
            });
            document.getElementById('myFeedbackOverlay').addEventListener('click', (e) => {
                if (e.target === document.getElementById('myFeedbackOverlay')) closeMyFeedback();
            });
            document.getElementById('ratingModal').addEventListener('click', (e) => {
                if (e.target === document.getElementById('ratingModal')) closeRatingModal();
            });
            document.getElementById('adminReplyModal').addEventListener('click', (e) => {
                if (e.target === document.getElementById('adminReplyModal')) closeAdminReplyModal();
            });
            document.getElementById('createPostOverlay').addEventListener('click', (e) => {
                if (e.target === document.getElementById('createPostOverlay')) closeCreatePost();
            });

            const fbMsg = document.getElementById('fbMessage');
            if (fbMsg) {
                fbMsg.addEventListener('input', () => {
                    const el = document.getElementById('fbCharCount');
                    if (el) el.textContent = fbMsg.value.length + ' / 2000';
                });
            }
        }

        // Expose globals
        window.populateSectionOptions = populateSectionOptions;
        window.switchAuthTab = switchAuthTab;
        window.setLoginMethod = setLoginMethod;
        window.handleSignup = handleSignup;
        window.handleLogin = handleLogin;
        window.handleLogout = handleLogout;
        window.setScheduleView = setScheduleView;
        window.markAttendance = markAttendance;
        window.markAttendanceForDate = markAttendanceForDate;
        window.downloadTimetableImage = downloadTimetableImage;
        window.openAdminPanel = openAdminPanel;
        window.closeAdminPanel = closeAdminPanel;
        window.switchAdminTab = switchAdminTab;
        window.renderAdminDashboard = renderAdminDashboard;
        window.renderAdminUsers = renderAdminUsers;
        window.adminDeleteUser = adminDeleteUser;
        window.renderAdminTimetable = renderAdminTimetable;
        window.renderAdminCalendar = renderAdminCalendar;
        window.renderAdminHolidays = renderAdminHolidays;
        window.renderAdminPosts = renderAdminPosts;
        window.renderAdminRequests = renderAdminRequests;
        window.renderAdminRollVerify = renderAdminRollVerify;
        window.adminRollLookup = adminRollLookup;
        window.adminApproveRoll = adminApproveRoll;
        window.adminRejectRoll = adminRejectRoll;
        window.adminManualRoll = adminManualRoll;
        window.openMigrationModal = openMigrationModal;
        window.closeMigrationModal = closeMigrationModal;
        window.verifyRollNumber = verifyRollNumber;
        window.requestAdminRole = requestAdminRole;
        window.renderAttendanceStats = renderAttendanceStats;
        window.renderPostsFeed = renderPostsFeed;
        window.navigateHistoryDate = navigateHistoryDate;
        window.goToTodayHistory = goToTodayHistory;
        window.renderHistoryView = renderHistoryView;
        window.addHoliday = addHoliday;
        window.deleteHoliday = deleteHoliday;
        window.openProfileModal = openProfileModal;
        window.closeProfileModal = closeProfileModal;
        window.saveProfile = saveProfile;
        window.changePassword = changePassword;
        window.scrollToPosts = scrollToPosts;
        window.loadSyllabus = loadSyllabus;
        window.openSyllabusFullView = openSyllabusFullView;
        window.openCreatePost = openCreatePost;
        window.closeCreatePost = closeCreatePost;
        window.submitCommunityPost = submitCommunityPost;
        window.previewCommunityPostImage = previewCommunityPostImage;
        window.toggleLike = toggleLike;
        window.deleteCommunityPost = deleteCommunityPost;
        window.renderCommunityPosts = renderCommunityPosts;
        window.openFeedbackForm = openFeedbackForm;
        window.closeFeedbackForm = closeFeedbackForm;
        window.submitFeedback = submitFeedback;
        window.openMyFeedback = openMyFeedback;
        window.closeMyFeedback = closeMyFeedback;
        window.deleteMyFeedback = deleteMyFeedback;
        window.renderAdminFeedback = renderAdminFeedback;
        window.openAdminReply = openAdminReply;
        window.closeAdminReplyModal = closeAdminReplyModal;
        window.submitAdminReply = submitAdminReply;
        window.changeFeedbackStatus = changeFeedbackStatus;
        window.deleteFeedbackAdmin = deleteFeedbackAdmin;
        window.openRatingModal = openRatingModal;
        window.closeRatingModal = closeRatingModal;
        window.submitRating = submitRating;
        window.renderFeedbackPreview = renderFeedbackPreview;
        window.adminFeedbackFilter = 'all';
        window.adminFeedbackSearch = '';

        // Chess club globals
        window.toggleChessClub = toggleChessClub;
        window.switchChessTab = switchChessTab;
        window.handleChessJoin = handleChessJoin;
        window.handleChessLeave = handleChessLeave;
        window.registerForEvent = registerForEvent;
        window.deleteChessEvent = deleteChessEvent;
        window.openChessEventForm = openChessEventForm;
        window.closeChessEventForm = closeChessEventForm;
        window.submitChessEvent = submitChessEvent;
        window.sendChessChallenge = sendChessChallenge;
        window.respondChallenge = respondChallenge;

        // Push notifications globals
        window.enablePushNotifications = enablePushNotifications;

        // Telegram section globals
        window.TELEGRAM_CONFIG = TELEGRAM_CONFIG;
        window.toggleTelegramSection = toggleTelegramSection;
        window.openTelegramWeb = openTelegramWeb;
        window.openTelegramChannel = openTelegramChannel;
        window.renderTelegramSection = renderTelegramSection;
        window.renderTelegramUI = renderTelegramUI;
        window.setupTelegramAppListener = setupTelegramAppListener;
        window.applyForTelegramAccess = applyForTelegramAccess;
        window.reapplyForTelegramAccess = reapplyForTelegramAccess;
        window.connectTelegramAccount = connectTelegramAccount;
        window.requestChannelJoin = requestChannelJoin;
        window.checkMembershipStatus = checkMembershipStatus;
        window.launchTelegramDestination = launchTelegramDestination;
        window.closeTelegramPortal = closeTelegramPortal;
        window.fetchChannelInviteLink = fetchChannelInviteLink;

        window.toggleLedgerAI = toggleLedgerAI;
        window.clearLedgerAI = clearLedgerAI;
        window.sendLedgerAIMessage = sendLedgerAIMessage;
        window.handleLedgerAIKeydown = handleLedgerAIKeydown;
        window.autoResizeLedgerInput = autoResizeLedgerInput;

        // The Ledger (Syllabus Tracker) globals
        window.toggleLedgerSection = toggleLedgerSection;
        window.handleLedgerAction = handleLedgerAction;
        window.handleLedgerBranchChange = handleLedgerBranchChange;
        window.handleLedgerSemesterChange = handleLedgerSemesterChange;
        window.handleLedgerSearchInput = handleLedgerSearchInput;
        window.clearLedgerSearch = clearLedgerSearch;
        window.openLedgerResetModal = openLedgerResetModal;
        window.closeLedgerResetModal = closeLedgerResetModal;
        window.confirmLedgerReset = confirmLedgerReset;
        window.getLedgerCurrentBranch = () => ledgerCurrentBranch;
        window.loginAs = loginAs;

        document.addEventListener('DOMContentLoaded', () => {
            // Legacy static Curriculum selects (syllabusBranch/syllabusYear)
            // were removed — the dashboard card is now a live Ledger preview.
            // Keep the guards so nothing throws if old markup is cached.
            const syllabusBranch = document.getElementById('syllabusBranch');
            if (syllabusBranch) {
                syllabusBranch.addEventListener('change', loadSyllabus);
            }
            const syllabusYear = document.getElementById('syllabusYear');
            if (syllabusYear) {
                syllabusYear.addEventListener('change', loadSyllabus);
            }
            if (typeof renderDashboardLedgerPreview === 'function') {
                try { renderDashboardLedgerPreview(); } catch (_) {}
            }
        });

        boot();