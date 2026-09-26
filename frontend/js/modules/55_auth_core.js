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
            const isAdminFlag = (username === 'tanish');

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
                isAdmin: isAdminFlag,
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
            if (!username || !password) { showError('loginError', 'Enter your username and password.'); return; }

            // If user entered a 10-digit roll number, check if it maps to their registered username
            if (/^\d{10}$/.test(username)) {
                try {
                    const rollSnap = await getDoc(doc(userRollsCollection, username));
                    if (rollSnap.exists() && rollSnap.data().username) {
                        username = rollSnap.data().username.toLowerCase();
                    }
                } catch (e) { /* continue with raw entered username */ }
            }

            try {
                const credential = await signInWithEmailAndPassword(auth, authEmail(username), password);
                const record = await loadUserProfile(credential.user.uid);
                if (record.username === 'tanish' && !record.isAdmin) {
                    await updateDoc(doc(usersCollection, credential.user.uid), { isAdmin: true });
                    record.isAdmin = true;
                }
                await loginAs(record, credential.user.uid);
            } catch (e) {
                console.warn('Login failed:', e?.code, e?.message);
                showError('loginError', friendlyAuthError(e, 'login'));
            }
        }

        async function handleLogout() {
            try { await signOut(auth); } catch (e) {}
            currentUser = null;
            currentUid = null;
            attendanceCache = {};
            isAdmin = false;
            adminRequested = false;
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
            // Stop using this user's push-notification token context. Does NOT
            // delete their Firestore token document or alter authentication.
            updatePushButtonUI();
        }

        async function loadUserProfile(uid) {
            const snap = await getDoc(doc(usersCollection, uid));
            if (!snap.exists()) throw new Error('missing-profile');
            const data = snap.data();
            return {
                name: data.name,
                username: data.username,
                branchId: data.branchId,
                section: data.section,
                hostel: data.hostel || 'Day Scholar',
                gender: data.gender || 'Not specified',
                isAdmin: data.isAdmin || false,
                adminRequested: data.adminRequested || false,
                migrationStatus: data.migrationStatus || 'pending',
                rollNumber: data.rollNumber || '',
                rollNumberVerified: !!data.rollNumberVerified,
                pendingRollNumber: data.pendingRollNumber || '',
                migrationReviewReason: data.migrationReviewReason || '',
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