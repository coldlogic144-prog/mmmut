// ============================================================================
// SECTION: 55_auth_core.js
// Signup / Login / Logout / profile loaders / friendlyAuthError
// Source: index.html lines 5913-6160 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== AUTH ==========
        async function handleSignup() {
            hideError('signupError');
            const nameEl = document.getElementById('suName');
            const name = (nameEl ? nameEl.value : '').trim();
            const username = document.getElementById('suUsername').value.trim().toLowerCase();
            const password = document.getElementById('suPassword').value;
            const branchId = document.getElementById('suBranch').value;
            const section = document.getElementById('suSection').value;
            const hostel = document.getElementById('suHostel').value;
            const gender = document.getElementById('suGender').value;

            if (!name || !username || !password) {
                showError('signupError', 'Fill in your name, username and password.');
                return;
            }
            if (username.length < 3) {
                showError('signupError', 'Username should be at least 3 characters.');
                return;
            }
            if (!/^[a-z0-9._-]+$/.test(username)) {
                showError('signupError', 'Username can only contain letters, numbers, dots, hyphens, and underscores.');
                return;
            }
            if (password.length < 6) {
                showError('signupError', 'Password should be at least 6 characters.');
                return;
            }
            // SECURITY: never self-assign admin. Admins are promoted only via
            // Firestore rules (isAdmin) by an existing admin.

            signingUp = true;

            // ==========================================
            // STEP A: FIREBASE AUTHENTICATION SIGNUP
            // ==========================================
            let credential;
            const email = authEmail(username);
            try {
                credential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (authErr) {
                console.error('Signup Auth Error:\ncode:', authErr?.code, '\nmessage:', authErr?.message);
                signingUp = false;
                showError('signupError', friendlyAuthError(authErr, 'signup'));
                return; // STOP! Never proceed to profile creation if auth fails.
            }

            if (!credential || !credential.user || !credential.user.uid) {
                console.error('Signup Auth Error: No user credential returned.');
                signingUp = false;
                showError('signupError', 'Authentication succeeded but no session was returned. Please try logging in.');
                return; // STOP!
            }

            // ==========================================
            // STEP B: FIRESTORE PROFILE CREATION (ONLY AFTER AUTH SUCCEEDS)
            // ==========================================
            const uid = credential.user.uid;
            const record = {
                name,
                username,
                branchId,
                section,
                hostel,
                gender,
                isAdmin: false,
                adminRequested: false,
                migrationStatus: 'verified',
                rollNumber: '',
                rollNumberVerified: false,
                pendingRollNumber: '',
                migrationReviewReason: '',
                createdAt: Date.now(),
                lastReadPosts: 0
            };

            // STEP 2 Verification: Inspect auth state prior to Firestore profile write
            console.log('Signup Auth verification before Firestore write:', {
                currentUser: auth.currentUser ? {
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email
                } : null,
                currentUserUid: auth.currentUser ? auth.currentUser.uid : null,
                currentUserEmail: auth.currentUser ? auth.currentUser.email : null,
                docUid: uid,
                isAuthActive: auth.currentUser != null,
                uidMatches: auth.currentUser ? (auth.currentUser.uid === uid) : false
            });

            try {
                await setDoc(doc(usersCollection, uid), record, { merge: true });
                try {
                    await setDoc(doc(attendanceCollection, uid), { attendance: {} });
                } catch (attErr) {
                    console.warn('Initial attendance doc creation skipped:', attErr);
                }
                await loginAs(record, uid);
            } catch (profileErr) {
                console.error('Signup Profile Write Error:\ncode:', profileErr?.code, '\nmessage:', profileErr?.message);
                showError('signupError', friendlyAuthError(profileErr, 'signup'));
            } finally {
                signingUp = false;
            }
        }

        async function handleLogin() {
            hideError('loginError');
            let username = document.getElementById('loginUsername').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            if (!username || !password) {
                showError('loginError', 'Enter your username and password.');
                return;
            }

            // ==========================================
            // STEP 1: FIREBASE AUTHENTICATION LOGIN
            // ==========================================
            let credential;
            const email = authEmail(username);
            try {
                credential = await signInWithEmailAndPassword(auth, email, password);
                console.log('AUTH LOGIN:\nSUCCESS\ncode: auth/success\nmessage: Authentication succeeded for ' + email);
            } catch (authErr) {
                console.error('AUTH LOGIN:\nFAILED\ncode:', authErr?.code, '\nmessage:', authErr?.message);
                showError('loginError', friendlyAuthError(authErr, 'login'));
                return; // STOP! Never proceed if Auth fails.
            }

            if (!credential || !credential.user || !credential.user.uid) {
                console.error('AUTH LOGIN:\nFAILED\ncode: no-credential\nmessage: No user returned');
                showError('loginError', 'Authentication succeeded but no session was returned.');
                return;
            }

            const uid = credential.user.uid;

            // ==========================================
            // STEP 2: FIRESTORE PROFILE RETRIEVAL
            // ==========================================
            let record;
            try {
                record = await loadUserProfile(uid);
                console.log('FIRESTORE PROFILE:\nSUCCESS\ncode: firestore/success\nmessage: Profile loaded for ' + record.username);
            } catch (profileErr) {
                console.error('FIRESTORE PROFILE:\nFAILED\ncode:', profileErr?.code || 'profile-error', '\nmessage:', profileErr?.message);
                showError('loginError', 'Auth succeeded, but profile could not be loaded: ' + (profileErr?.message || profileErr?.code));
                return; // STOP! Do not report as incorrect password.
            }

            // SECURITY: no client-side auto-promotion. Admin rights come only
            // from Firestore (isAdmin) and rules block self-escalation.

            // ==========================================
            // STEP 3: NAVIGATION TO ERP / DASHBOARD
            // ==========================================
            try {
                await loginAs(record, uid);
                console.log('NAVIGATION:\nSUCCESS\nmessage: Dashboard opened successfully');
            } catch (navErr) {
                console.error('NAVIGATION:\nFAILED\ncode:', navErr?.code || 'nav-error', '\nmessage:', navErr?.message);
                showError('loginError', 'Navigation to dashboard failed: ' + (navErr?.message || navErr));
            }
        }

        async function handleLogout() {
            try { await signOut(auth); } catch (e) {}
            currentUser = null;
            currentUid = null;
            attendanceCache = {};
            isAdmin = false;
            adminRequested = false;
            try {
                sessionStorage.removeItem('mmmut_active_view');
                sessionStorage.clear();
            } catch (_) {}
            document.getElementById('app').style.display = 'none';
            document.getElementById('authScreen').style.display = 'flex';
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            closeAdminPanel();
            closeProfileModal();
            closeMigrationModal();
            closeFeedbackForm();
            closeMyFeedback();
            closeRatingModal();
            closeAdminReplyModal();
            closeCreatePost();
            if (document.getElementById('ledgerAiChat').classList.contains('open')) {
                document.getElementById('ledgerAiChat').classList.remove('open');
            }
            // Close chess club if open
            if (document.getElementById('chessClubView').style.display !== 'none') {
                toggleChessClub(false);
            }
            // Close Telegram section if open
            if (document.getElementById('telegramView') && document.getElementById('telegramView').style.display !== 'none') {
                toggleTelegramSection(false);
            }
            // Close Ledger section if open
            if (document.getElementById('ledgerView') && document.getElementById('ledgerView').style.display !== 'none') {
                toggleLedgerSection(false);
            }
            if (typeof setupTelegramAppListener === 'function') {
                setupTelegramAppListener(null);
            }
            // Stop using this user's push-notification token context. Does NOT
            // delete their Firestore token document or alter authentication.
            updatePushButtonUI();
            const sidebarAdminBtn = document.getElementById('sidebarAdminBtn');
            if (sidebarAdminBtn) sidebarAdminBtn.style.display = 'none';
        }

        async function loadUserProfile(uid) {
            const snap = await getDoc(doc(usersCollection, uid));
            if (!snap.exists()) {
                const u = auth.currentUser;
                if (u && u.uid === uid) {
                    const fallbackUsername = (u.email || '').replace('@mmmut.local', '').toLowerCase() || 'student';
                    console.warn('Profile doc users/' + uid + ' missing in Firestore. Creating fallback profile for', fallbackUsername);
                    const fallbackRecord = {
                        name: fallbackUsername,
                        username: fallbackUsername,
                        branchId: 'cse',
                        section: 'A',
                        hostel: 'Day Scholar',
                        gender: 'Not specified',
                        isAdmin: false,
                        adminRequested: false,
                        migrationStatus: 'verified',
                        rollNumber: '',
                        rollNumberVerified: false,
                        pendingRollNumber: '',
                        migrationReviewReason: '',
                        createdAt: Date.now(),
                        lastReadPosts: 0
                    };
                    try {
                        await setDoc(doc(usersCollection, uid), fallbackRecord, { merge: true });
                        return fallbackRecord;
                    } catch (healErr) {
                        console.error('Failed to create fallback profile doc:', healErr);
                    }
                }
                throw new Error('missing-profile');
            }
            const data = snap.data();
            return {
                name: data.name || data.username || 'Student',
                username: data.username || '',
                branchId: data.branchId || 'cse',
                section: data.section || 'A',
                hostel: data.hostel || 'Day Scholar',
                gender: data.gender || 'Not specified',
                isAdmin: data.isAdmin || false,
                adminRequested: data.adminRequested || false,
                migrationStatus: data.migrationStatus || 'verified',
                rollNumber: data.rollNumber || '',
                rollNumberVerified: !!data.rollNumberVerified,
                pendingRollNumber: data.pendingRollNumber || '',
                migrationReviewReason: data.migrationReviewReason || '',
                createdAt: data.createdAt || 0,
                lastReadPosts: data.lastReadPosts || 0
            };
        }

        async function loadAttendanceMap(uid) {
            const ref = doc(attendanceCollection, uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) { await setDoc(ref, { attendance: {} }); return {}; }
            const data = snap.data();
            return data.attendance || {};
        }

        function friendlyAuthError(error, mode) {
            const code = error && error.code ? error.code : '';
            if (code === 'auth/email-already-in-use') return 'That username is already taken.';
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Incorrect username or password.';
            if (code === 'auth/user-not-found') return 'No account with that username. Try signing up.';
            if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
            if (code === 'auth/operation-not-allowed') return 'Email/password sign up is not enabled in Firebase Authentication.';
            if (code === 'auth/unauthorized-domain') return 'This domain is not authorized in Firebase Authentication settings.';
            if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
            if (code === 'permission-denied') return 'Firebase saved the account, but Firestore rules blocked the profile.';
            if (code) return (mode === 'signup' ? 'Signup failed: ' : 'Login failed: ') + code;
            return mode === 'signup' ? 'Something went wrong creating your account.' :
                'Could not log in — please try again.';
        }