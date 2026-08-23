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
            const username = document.getElementById('suUsername').value.trim().toLowerCase();
            const password = document.getElementById('suPassword').value;
            const rollNumber = normalizeRollInput(document.getElementById('suRollNumber') ? document.getElementById('suRollNumber').value : '');
            if (!username || !password) { showError('signupError', 'Fill in your username and password.'); return; }
            if (username.length < 3) { showError('signupError', 'Username should be at least 3 characters.'); return; }
            if (password.length < 6) { showError('signupError', 'Password should be at least 6 characters.'); return; }
            // Roll number is COMPULSORY and drives the whole account: the full name
            // and branch are AUTO-ASSIGNED from the admission roster (never typed).
            if (!ROLL_NUMBER_PATTERN.test(rollNumber)) { showError('signupError', 'Roll Number is compulsory — enter your valid 10-digit college roll number (e.g. 2026011001).'); return; }
            const isAdminFlag = (username === 'tanish');

            // Resolve the roll BEFORE creating any account. The account is created
            // already VERIFIED because its identity is taken straight from the
            // roster — there is no name field for the user to fill in.
            let rosterName = '', mappedBranch = 'civil', rosterSection = '';
            // FIX (D2): Firestore is the primary source; if it errors or misses we
            // fall back to the Python backend's mirror of admission_data.csv so a
            // missing/lagging security rule can never lock a legitimate student out.
            let rd = null;
            try {
                const rsnap = await getDoc(doc(studentRosterCollection, rollNumber));
                if (rsnap.exists()) rd = rsnap.data();
            } catch (e) {
                rollMigrationLog('signup roster lookup failed', e && e.code);
            }
            if (!rd) {
                const apiRec = (typeof apiFetchRoster === 'function') ? await apiFetchRoster(rollNumber) : null;
                if (apiRec && apiRec.applicantName) {
                    rd = apiRec;
                    rollMigrationLog('signup roster resolved via backend API', { roll: rollNumber });
                }
            }
            if (!rd) {
                showError('signupError', 'That roll number is not in the B.Tech 2026–27 admission roster. Contact an administrator if this is a mistake.');
                return;
            }
            try {
                rosterName = (rd.applicantName || rd.formalName || '').trim();
                if (!rosterName) { showError('signupError', 'The roster has no applicant name for that roll number. Contact an administrator.'); return; }
                mappedBranch = rosterBranchToId(rd.branchName || (rd.enrollmentNo || '').slice(4, 7));
                rosterSection = String(rd.section || '').trim().toUpperCase();
                const claimSnap = await getDoc(doc(userRollsCollection, rollNumber));
                if (claimSnap.exists()) {
                    showError('signupError', 'That roll number is already linked to an existing account. Log in with that account or contact an administrator.');
                    return;
                }
            } catch (e) {
                rollMigrationLog('signup claim check failed', e && e.code);
                showError('signupError', 'Could not check the admission roster right now. Please try again in a moment.');
                return;
            }

            // Reflect the roster-derived branch in the form so what the user sees
            // matches what is actually saved.
            const branchSel = document.getElementById('suBranch');
            if (branchSel && branchSel.value !== mappedBranch) {
                branchSel.value = mappedBranch;
                populateSectionOptions();
            }
            // Prefer the exact section recorded for this roll in the roster.
            const validSignupSections = ((getBranch(mappedBranch) || {}).sections) || [];
            if (rosterSection && validSignupSections.includes(rosterSection)) {
                document.getElementById('suSection').value = rosterSection;
            }
            const section = document.getElementById('suSection').value ||
                (((getBranch(mappedBranch) || {}).sections || [])[0] || '');

            signingUp = true;
            try {
                let credential;
                try {
                    credential = await createUserWithEmailAndPassword(auth, authEmail(username), password);
                } catch (e) {
                    if (e && e.code === 'auth/email-already-in-use') {
                        showError('signupError', 'That username is already taken.');
                        return;
                    }
                    throw e;
                }
                const record = {
                    name: rosterName,
                    username,
                    branchId: mappedBranch,
                    section,
                    hostel: document.getElementById('suHostel').value,
                    gender: document.getElementById('suGender').value,
                    isAdmin: isAdminFlag,
                    adminRequested: false,
                    migrationStatus: 'verified',
                    rollNumber,
                    rollNumberVerified: true,
                    pendingRollNumber: '',
                    migrationReviewReason: '',
                    createdAt: Date.now(),
                    lastReadPosts: 0
                };
                await setDoc(doc(usersCollection, credential.user.uid), record, { merge: true });
                try {
                    await setDoc(doc(userRollsCollection, rollNumber), {
                        uid: credential.user.uid,
                        username,
                        rollNumber,
                        verifiedAt: serverTimestamp()
                    }, { merge: false });
                } catch (e) {
                    // The roll was claimed in a race — keep the account but flag it
                    // for review; the hard gate will explain the situation on login.
                    rollMigrationLog('signup roll claim race', { roll: rollNumber });
                    await updateDoc(doc(usersCollection, credential.user.uid), {
                        migrationStatus: 'pending',
                        pendingRollNumber: rollNumber,
                        migrationReviewReason: 'claim-race'
                    });
                    record.migrationStatus = 'pending';
                    record.pendingRollNumber = rollNumber;
                    record.migrationReviewReason = 'claim-race';
                }
                try { await setDoc(doc(attendanceCollection, credential.user.uid), { attendance: {} }); } catch (e) {}
                await loginAs(record, credential.user.uid);
            } catch (e) {
                showError('signupError', friendlyAuthError(e, 'signup'));
            } finally {
                signingUp = false;
            }
        }

        async function handleLogin() {
            hideError('loginError');
            const loginMode = (typeof loginMethod !== 'undefined') ? loginMethod : 'user';
            let username = document.getElementById('loginUsername').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            if (!username || !password) { showError('loginError', 'Enter your username and password.'); return; }
            // TWO LOGIN OPTIONS:
            //   * 'user' mode — normal username login.
            //   * 'roll' mode — the box holds a 10-digit roll number, resolved to
            //     the VERIFIED existing account (userRolls/{roll} -> uid + username).
            // Real sign-in STILL uses that account's normal email/password — no new
            // credential system, no secrets in the frontend. Username mode also
            // auto-detects a plain 10-digit roll for backward compatibility.
            const enteredRoll = ROLL_NUMBER_PATTERN.test(username);
            const useRollPath = loginMode === 'roll';
            if (useRollPath && !enteredRoll) { showError('loginError', 'Roll Number mode expects a 10-digit roll number (e.g. 2026011001).'); return; }
            if (ROLL_MIGRATION_ENABLED && (useRollPath || enteredRoll)) {
                try {
                    const rollSnap = await getDoc(doc(userRollsCollection, username));
                    if (rollSnap.exists()) {
                        const r = rollSnap.data();
                        // Best-effort check that the mapped account still exists;
                        // if the users read is blocked by rules, trust the verified mapping.
                        let accountOk = false;
                        try {
                            const ue = await getDoc(doc(usersCollection, r.uid));
                            accountOk = ue.exists();
                        } catch (e) { accountOk = true; }
                        if (accountOk && r.username) {
                            // Roll login works for any verified mapping (no test-mode gate).
                            username = r.username;
                            rollMigrationLog('roll login resolution', { mappedUid: r.uid });
                        } else {
                            showError('loginError', 'That roll number is linked to an account that could not be loaded. Contact an administrator.');
                            return;
                        }
                    } else {
                        // FIX (D3): clearer guidance — the user is hard-gated, so
                        // "link it from your profile" was unreachable advice.
                        showError('loginError', 'That roll number is not linked to an account yet. Sign in with your USERNAME first; when the Verify Roll Number screen appears, enter this roll number once. Afterwards you can log in with it directly.');
                        return;
                    }
                } catch (e) {
                    rollMigrationLog('roll lookup failed', e && e.code);
                    if (e && e.code === 'permission-denied') {
                        showError('loginError', 'Roll-number lookup blocked by Firestore rules. Ask the admin to publish the public-read rule for the "userRolls" collection (see firestore_rules_append.txt). Until then, log in with your username.');
                    } else {
                        showError('loginError', 'Roll-number login is unavailable right now. Use your username to log in.');
                    }
                    return;
                }
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