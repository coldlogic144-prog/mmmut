// ============================================================================
// SECTION: 65_roll_verification.js
// Roll-number hard gate, claim, finalize (roll-login core)
// Source: index.html lines 6350-6646 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        function rollMigrationActive(user) {
            if (!ROLL_MIGRATION_ENABLED) return false;
            if (!ROLL_MIGRATION_TEST_MODE) return true;
            const username = String((user && user.username) || '').toLowerCase();
            return ROLL_MIGRATION_TEST_USERS.map(u => u.toLowerCase()).includes(username);
        }

        function rollMigrationLog(...args) {
            if (ROLL_MIGRATION_ENABLED && ROLL_MIGRATION_DEBUG) {
                try {
                    // Migration diagnostics ONLY — never passwords, auth tokens,
                    // FCM tokens, private keys, or service-account credentials.
                    console.debug('[roll-mig]', ...args);
                } catch (e) { /* ignore */ }
            }
        }

        function normalizeUserName(s) {
            return String(s || '').toUpperCase().replace(/[^A-Z]/g, ' ').replace(/\s+/g, ' ').trim();
        }

        function normalizeRollInput(raw) {
            return String(raw || '').trim().replace(/\s+/g, '');
        }

        function rollMigrationLabel(status) {
            const map = {
                pending: 'Pending — roll not linked',
                verified: 'Verified',
                rejected: 'Rejected',
                manual_review: 'Manual review'
            };
            return map[status] || String(status || 'pending');
        }

        function renderMigrationStatus() {
            const el = document.getElementById('migrationStatus');
            if (!el || !currentUser) return;
            if (currentUser.migrationStatus === 'verified' && currentUser.rollNumber) {
                el.innerHTML = '<div style="color:var(--moss);font-weight:600;">✓ Roll number verified: <span class="mono">' +
                    escapeHtml(currentUser.rollNumber) + '</span></div>';
            } else {
                const extra = currentUser.migrationReviewReason ? ' — ' + escapeHtml(currentUser.migrationReviewReason) : '';
                el.innerHTML = '<div style="color:var(--ink-soft);">' + rollMigrationLabel(currentUser.migrationStatus) + extra + '.</div>';
            }
        }

        // HARD-GATE STATE — while the roll number is unverified the app is hidden behind
        // this modal and it cannot be dismissed (no ✕, no "skip for now").
        let rollGateLocked = false;

        // Maps a roster branch code to the app's branch id. Codes come from the
        // enrollment-number prefix in the official 2026-27 admission roster:
        //   CED Civil · CSD CSE · EED Electrical · ECD ECE · IOT ECE(IoT)
        //   MED Mechanical · CHD Chemical · ITC IT
        const ROSTER_BRANCH_TO_ID = {
            'CED': 'civil',
            'CSD': 'cse',
            'EED': 'ee',
            'ECD': 'ece',
            'IOT': 'eceiot',
            'MED': 'me',
            'CHD': 'chemical',
            'ITC': 'it',
        };
        function rosterBranchToId(branchName) {
            return ROSTER_BRANCH_TO_ID[String(branchName || '').trim().toUpperCase()] || 'civil';
        }

        function rollGateActive(user) {
            return ROLL_MIGRATION_ENABLED && rollMigrationActive(user) &&
                String(user && user.migrationStatus) !== 'verified';
        }

        function enforceRollGate() {
            const app = document.getElementById('app');
            const modal = document.getElementById('migrationModal');
            if (!currentUser) {
                rollGateLocked = false;
                if (app) app.style.display = 'block';
                if (modal) modal.classList.remove('open');
                return;
            }
            rollGateLocked = rollGateActive(currentUser);
            if (app) app.style.display = rollGateLocked ? 'none' : 'block';
            if (rollGateLocked) {
                openMigrationModal();
            } else if (modal) {
                modal.classList.remove('open');
            }
        }

        function openMigrationModal() {
            const modal = document.getElementById('migrationModal');
            if (!modal || !currentUser) return;
            if (!rollMigrationActive(currentUser)) return;
            if (currentUser.migrationStatus === 'verified') return;
            const input = document.getElementById('migrationRollInput');
            if (input) input.value = currentUser.pendingRollNumber || currentUser.rollNumber || '';
            const errEl = document.getElementById('migrationError');
            if (errEl) errEl.style.display = 'none';
            renderMigrationStatus();
            modal.classList.add('open');
        }

        function closeMigrationModal() {
            // The verification gate CANNOT be dismissed while it is blocking the
            // app — but it is always allowed to close during sign-out (no user).
            if (rollGateLocked && currentUser) return;
            const modal = document.getElementById('migrationModal');
            if (modal) modal.classList.remove('open');
        }

        async function setMigrationState(status, roll, reason) {
            const patch = { migrationStatus: status };
            if (status === 'verified') {
                patch.rollNumber = roll;
                patch.rollNumberVerified = true;
                patch.rollClaimedAt = serverTimestamp();
                patch.pendingRollNumber = '';
                patch.migrationReviewReason = '';
            } else {
                if (roll) patch.pendingRollNumber = roll;
                if (reason) patch.migrationReviewReason = reason;
            }
            await updateDoc(doc(usersCollection, currentUid), patch);
            currentUser.migrationStatus = status;
            if (status === 'verified') {
                currentUser.rollNumber = roll;
                currentUser.rollNumberVerified = true;
                currentUser.pendingRollNumber = '';
                currentUser.migrationReviewReason = '';
            } else {
                if (roll) currentUser.pendingRollNumber = roll;
                if (reason) currentUser.migrationReviewReason = reason;
            }
            rollMigrationLog('state', { uid: currentUid, status, roll, reason });
        }

        function evaluateRollClaim(profile, rosterEntry) {
            if (!rosterEntry) return { verdict: 'notfound', reasons: ['not-in-roster'] };
            const reasons = [];
            const isAdmin = !!(profile && profile.isAdmin);
            const pName = normalizeUserName(profile ? profile.name : '');
            const rName = normalizeUserName(rosterEntry.applicantName || rosterEntry.formalName || '');
            const nameMismatch = !pName || !rName || pName !== rName;
            // Admins may self-verify a roster roll even when the profile name does
            // not exactly match the roster applicantName (e.g. the MMMUT admin
            // 'tanish' — whose full name is not present in the admission CSV).
            if (nameMismatch && !isAdmin) reasons.push('name-mismatch');
            else if (nameMismatch && isAdmin) rollMigrationLog('admin name override', { roll: rosterEntry.rollNumber });
            const branch = String(rosterEntry.branchName ||
                (rosterEntry.enrollmentNo || '').slice(4, 7) || '').toUpperCase();
            // Map ANY roster branch via the authoritative table (was hardcoded to
            // CED/CSD only, producing 'unknown-branch' for the other six branches
            // in the legacy admin-override path — now consistent with verify()).
            const mapped = rosterBranchToId(
                rosterEntry.branchName || (rosterEntry.enrollmentNo || '').slice(4, 7) || branch);
            if (String(profile ? profile.branchId : '').toLowerCase() !== mapped) {
                if (!isAdmin) reasons.push('branch-mismatch');
                else rollMigrationLog('admin branch override', { roll: rosterEntry.rollNumber, mapped });
            }
            return reasons.length === 0
                ? { verdict: 'ok', reasons, branch }
                : { verdict: 'manual-review', reasons, branch };
        }

        async function verifyRollNumber() {
            const err = document.getElementById('migrationError');
            const fail = (msg) => { if (err) { err.textContent = msg; err.style.display = 'block'; } };
            if (err) err.style.display = 'none';
            if (!currentUser) { fail('You are not logged in.'); return; }
            if (!rollMigrationActive(currentUser)) { fail('Roll-number verification is not enabled for this session yet.'); return; }
            const raw = normalizeRollInput(document.getElementById('migrationRollInput').value);
            if (!raw) return fail('Enter your roll number.');
            if (!ROLL_NUMBER_PATTERN.test(raw)) return fail('That does not look like a 10-digit roll number (e.g. 2026011001).');

            rollMigrationLog('verify start', { uid: currentUid, roll: raw });

            // ===== DIAGNOSTICS (temporary, safe fields only — never credentials) =====
            const diag = {
                roll: raw,
                fsResult: 'not-attempted',     // hit | miss | error:<code>
                backendAttempted: false,
                backendResult: 'not-attempted',// hit | miss | unavailable | disabled
                decision: ''
            };
            const diagDecision = (reason) => {
                diag.decision = reason;
                rollMigrationLog('verify decision', diag);
            };

            let rosterEntry = null;
            try {
                const snap = await getDoc(doc(studentRosterCollection, raw));
                rosterEntry = snap.exists() ? snap.data() : null;
                diag.fsResult = rosterEntry ? 'hit' : 'miss';
            } catch (e) {
                diag.fsResult = 'error:' + ((e && e.code) || 'unknown');
                rollMigrationLog('roster read error', e && e.code);
            }
            // FIX (D2): backend API mirror of admission_data.csv — keeps verification
            // working when the studentRoster read fails or the doc is missing
            // (e.g. stale partial import / rules / CDN / App Check hiccups).
            if (!rosterEntry) {
                diag.backendAttempted = true;
                if (typeof apiFetchRoster !== 'function') {
                    diag.backendResult = 'disabled';
                } else {
                    const apiRec = await apiFetchRoster(raw);
                    if (apiRec && apiRec.applicantName) {
                        rosterEntry = apiRec;
                        diag.backendResult = 'hit';
                        rollMigrationLog('roster resolved via backend API', { roll: raw });
                    } else {
                        // apiService returns null both for "backend not configured"
                        // and for genuine misses; distinguish via its base URL.
                        diag.backendResult =
                            (localStorage.getItem('mmmut_api_base') || '') ? 'miss' : 'unconfigured';
                    }
                }
            }
            if (!rosterEntry) {
                fail('That roll number was not found in the B.Tech 2026–27 admission roster. Only published roll numbers can be verified.');
                diagDecision('rejected:not-in-roster');
                return;
            }

            // The applicant's NAME IS AUTO-ASSIGNED from the roll number data, and
            // the branch is derived the same way (CED -> civil, CSD -> cse) — so no
            // name/branch mismatch can stall a legitimate claim.
            const rosterName = (rosterEntry.applicantName || rosterEntry.formalName || '').trim();
            if (!rosterName) {
                fail('The admission roster entry for this roll number has no applicant name. Contact an administrator.');
                return;
            }
            const mappedBranch = rosterBranchToId(rosterEntry.branchName || (rosterEntry.enrollmentNo || '').slice(4, 7));
            const rosterSection = String(rosterEntry.section || '').trim().toUpperCase();

            let claim = null;
            try {
                const cSnap = await getDoc(doc(userRollsCollection, raw));
                claim = cSnap.exists() ? cSnap.data() : null;
                diag.claimRead = claim ? 'hit' : 'miss';
            } catch (e) {
                diag.claimRead = 'error:' + ((e && e.code) || 'unknown');
                rollMigrationLog('claim read failed', e && e.code);
            }
            if (claim) {
                if (claim.uid === currentUid && claim.rollNumber === raw) {
                    await finalizeRollVerification(raw, rosterName, mappedBranch, rosterSection);
                    showToast('✓ Roll number verified: ' + raw);
                    diagDecision('verified:already-own-claim');
                    return;
                }
                fail('This roll number is already linked to a different account. Contact an administrator if you believe this is an error.');
                await setMigrationState('rejected', raw, 'already-claimed');
                renderMigrationStatus();
                diagDecision('rejected:already-claimed-by-other');
                return;
            }

            try {
                await setDoc(doc(userRollsCollection, raw), {
                    uid: currentUid,
                    username: currentUser.username || '',
                    rollNumber: raw,
                    verifiedAt: serverTimestamp()
                }, { merge: false });
            } catch (e) {
                // FIX (D1): a failed claim write is NOT always a race. If the real
                // cause is a missing rule (permission-denied) we must NOT flag the
                // account for manual_review — the user stays pending and gets an
                // actionable message instead of being stuck with a wrong status.
                const code = e && e.code;
                if (code === 'permission-denied') {
                    rollMigrationLog('claim write permission-denied', { roll: raw });
                    fail('Verification could not be saved: Firestore refused the write to "userRolls". The admin needs to publish the staged rules from firestore_rules_append.txt. Your account is NOT marked as rejected — please try again after the rules are live.');
                    diagDecision('blocked:permission-denied-on-claim-write');
                    return;
                }
                rollMigrationLog('claim write failed', { roll: raw, code: code || String(e) });
                if (code !== 'already-exists') {
                    // Unknown failure — surface it honestly, keep the user pending.
                    fail('Verification could not be saved right now (' + (code || 'network error') + '). Your account is unchanged — please try again.');
                    diagDecision('error:claim-write-' + (code || 'network'));
                    return;
                }
                fail('This roll number was claimed by another account at the same moment. It has been flagged for manual review.');
                await setMigrationState('manual_review', raw, 'claim-race');
                renderMigrationStatus();
                diagDecision('manual-review:claim-race');
                return;
            }

            await finalizeRollVerification(raw, rosterName, mappedBranch, rosterSection);
            showToast('✓ Roll number verified: ' + raw);
            diagDecision('verified:new-claim-created');
        }

        // Marks the roll as verified AND adopts the roster identity (name + branch)
        // into the user's profile, then unlocks the whole app.
        async function finalizeRollVerification(raw, rosterName, mappedBranch, rosterSection) {
            const wasBranch = currentUser.branchId;
            const wasSection = currentUser.section;
            // Adopt the roster's exact section when it is valid for this branch.
            const validVerifySections = ((getBranch(mappedBranch) || {}).sections) || [];
            const finalSection = (rosterSection && validVerifySections.includes(rosterSection))
                ? rosterSection : (wasSection || validVerifySections[0] || '');
            await updateDoc(doc(usersCollection, currentUid), {
                name: rosterName,
                branchId: mappedBranch,
                section: finalSection,
                migrationStatus: 'verified',
                rollNumber: raw,
                rollNumberVerified: true,
                pendingRollNumber: '',
                migrationReviewReason: '',
                rollClaimedAt: serverTimestamp()
            });
            currentUser.name = rosterName;
            currentUser.branchId = mappedBranch;
            currentUser.section = finalSection;
            currentUser.migrationStatus = 'verified';
            currentUser.rollNumber = raw;
            currentUser.rollNumberVerified = true;
            currentUser.pendingRollNumber = '';
            currentUser.migrationReviewReason = '';

            // Reflect the roster-assigned identity in the top bar + schedule.
            const branch = getBranch(mappedBranch);
            if (branch) {
                document.getElementById('pillName').textContent = rosterName;
                document.getElementById('pillAvatar').textContent =
                    rosterName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                document.getElementById('pillBranch').textContent =
                    branch.name.replace('B.Tech — ', '') + ' · Sec ' + (currentUser.section || '');
                if (wasBranch !== mappedBranch || wasSection !== finalSection) {
                    scheduleCache = buildSchedule(branch, currentUser.section);
                    renderSchedule();
                    renderHistoryView();
                    renderAttendanceStats();
                }
            }

            // UNLOCK THE APP — verification is the only key.
            rollGateLocked = false;
            const app = document.getElementById('app');
            if (app) app.style.display = 'block';
            closeMigrationModal();
            renderMigrationStatus();
            rollMigrationLog('verified', { uid: currentUid, roll: raw, name: rosterName });
        }
