// ============================================================================
// SECTION: 50_state_toast_holidays_profile.js
// Shared state lets, toast, holidays, profile modal, branch options
// Source: index.html lines 5694-5912 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================


        // ========== STATE ==========
        let currentUser = null;
        let currentUid = null;
        let attendanceCache = {};
        let scheduleCache = null;
        let scheduleView = 'today';
        let signingUp = false;
        let isAdmin = false;
        let adminRequested = false;
        let historyDate = new Date();
        let holidays = new Set();
        let allPosts = [];
        let lastReadPosts = 0;
        let communityPosts = [];

        // Chess club state
        let chessMembers = [];
        let chessEvents = [];
        let chessChallenges = [];
        let chessActivity = [];
        let chessGames = [];
        let chessCurrentTab = 'home';
        let chessMemberStatus = false; // whether current user is a member

        // ========== TOAST ==========
        function showToast(msg, duration = 3000) {
            const el = document.getElementById('toast');
            el.textContent = msg;
            el.classList.add('show');
            clearTimeout(el._timer);
            el._timer = setTimeout(() => el.classList.remove('show'), duration);
        }

        // ========== HOLIDAYS ==========
        async function fetchHolidays() {
            try {
                const snap = await getDocs(holidaysCollection);
                holidays = new Set(snap.docs.map(d => d.data().date));
            } catch (e) {
                console.warn('Failed to fetch holidays:', e);
                holidays = new Set();
            }
        }

        function listenHolidays() {
            return onSnapshot(holidaysCollection, (snap) => {
                holidays = new Set(snap.docs.map(d => d.data().date));
                if (currentUser) {
                    renderSchedule();
                    renderHistoryView();
                    renderAttendanceStats();
                }
            });
        }

        // ========== PROFILE MODAL ==========
        function openProfileModal() {
            if (!currentUser) return;
            const branch = getBranch(currentUser.branchId);
            document.getElementById('profileName').value = currentUser.name;
            document.getElementById('profileUsername').value = currentUser.username;
            document.getElementById('profileBranch').value = branch.name;
            const sel = document.getElementById('profileSection');
            sel.innerHTML = branch.sections.map(s =>
                `<option value="${s}" ${s===currentUser.section?'selected':''}>${s}</option>`).join('');
            document.getElementById('profileHostel').value = currentUser.hostel || 'Day Scholar';
            document.getElementById('profileGender').value = currentUser.gender || 'Not specified';
            const rollField = document.getElementById('profileRollNumber');
            const migField = document.getElementById('profileMigrationStatus');
            if (rollField) rollField.value = currentUser.rollNumber || (currentUser.pendingRollNumber ? currentUser.pendingRollNumber + ' (unverified)' : '—');
            if (migField) migField.value = rollMigrationLabel(currentUser.migrationStatus);
            const linkBtn = document.getElementById('profileLinkRollBtn');
            if (linkBtn) {
                linkBtn.style.display = (currentUser.migrationStatus !== 'verified' && rollMigrationActive(currentUser)) ? 'inline-block' : 'none';
            }
            document.getElementById('profileOldPassword').value = '';
            document.getElementById('profileNewPassword').value = '';
            document.getElementById('profileConfirmPassword').value = '';
            document.getElementById('profileModal').classList.add('open');
        }

        function closeProfileModal() {
            document.getElementById('profileModal').classList.remove('open');
        }

        async function saveProfile() {
            const newSection = document.getElementById('profileSection').value;
            const newHostel = document.getElementById('profileHostel').value;
            const newGender = document.getElementById('profileGender').value;
            if (newSection === currentUser.section && newHostel === currentUser.hostel && newGender === currentUser
                .gender) {
                showToast('No change made.');
                closeProfileModal();
                return;
            }
            try {
                const updates = { section: newSection, hostel: newHostel, gender: newGender };
                await updateDoc(doc(usersCollection, currentUid), updates);
                currentUser.section = newSection;
                currentUser.hostel = newHostel;
                currentUser.gender = newGender;
                const branch = getBranch(currentUser.branchId);
                scheduleCache = buildSchedule(branch, newSection);
                renderSchedule();
                renderHistoryView();
                renderAttendanceStats();
                document.getElementById('pillBranch').textContent = branch.name.replace('B.Tech — ', '') + ' · Sec ' +
                    newSection;
                showToast('Profile updated!');
                closeProfileModal();
            } catch (e) {
                showToast('Error updating profile: ' + e.message);
            }
        }

        // ========== CHANGE PASSWORD ==========
        async function changePassword() {
            const oldPw = document.getElementById('profileOldPassword').value;
            const newPw = document.getElementById('profileNewPassword').value;
            const confirmPw = document.getElementById('profileConfirmPassword').value;
            if (!oldPw) { showToast('Please enter your current password.'); return; }
            if (!newPw || newPw.length < 6) { showToast('New password must be at least 6 characters.'); return; }
            if (newPw !== confirmPw) { showToast('New passwords do not match.'); return; }

            try {
                const user = auth.currentUser;
                if (!user) { showToast('You are not logged in.'); return; }
                const credential = EmailAuthProvider.credential(user.email, oldPw);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPw);
                showToast('Password changed successfully!');
                document.getElementById('profileOldPassword').value = '';
                document.getElementById('profileNewPassword').value = '';
                document.getElementById('profileConfirmPassword').value = '';
                closeProfileModal();
            } catch (e) {
                console.error(e);
                if (e.code === 'auth/wrong-password') {
                    showToast('Incorrect current password.');
                } else if (e.code === 'auth/weak-password') {
                    showToast('New password is too weak. Use at least 6 characters.');
                } else {
                    showToast('Error changing password: ' + e.message);
                }
            }
        }

        // ========== AUTH UI ==========
        function populateBranchOptions() {
            const sel = document.getElementById('suBranch');
            sel.innerHTML = BRANCHES.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            populateSectionOptions();

            const syllabusSel = document.getElementById('syllabusBranch');
            syllabusSel.innerHTML = `<option value="">Select Branch</option>` +
                Object.entries(syllabusData).map(([id, data]) =>
                    `<option value="${id}">${data.name}</option>`
                ).join('');
            if (currentUser) {
                const branchId = currentUser.branchId;
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
                const mapped = syllabusBranchMap[branchId];
                if (mapped && syllabusData[mapped]) {
                    syllabusSel.value = mapped;
                }
                document.getElementById('syllabusYear').value = '1';
                loadSyllabus();
            }
        }

        function populateSectionOptions() {
            const branch = getBranch(document.getElementById('suBranch').value);
            const sel = document.getElementById('suSection');
            sel.innerHTML = branch.sections.map(s => `<option value="${s}">Section ${s}</option>`).join('');
        }

        // Toggle between "Login with Username" and "Login with Roll Number".
        let loginMethod = 'user'; // 'user' | 'roll'
        function setLoginMethod(m) {
            loginMethod = (m === 'roll') ? 'roll' : 'user';
            const userBtn = document.getElementById('loginMethodUser');
            const rollBtn = document.getElementById('loginMethodRoll');
            const lbl = document.getElementById('loginIdentifierLabel');
            const inp = document.getElementById('loginUsername');
            if (userBtn) userBtn.classList.toggle('active', loginMethod === 'user');
            if (rollBtn) rollBtn.classList.toggle('active', loginMethod === 'roll');
            if (lbl) lbl.textContent = loginMethod === 'roll' ? 'Roll Number' : 'Username';
            if (inp) {
                inp.value = '';
                inp.placeholder = loginMethod === 'roll' ? 'e.g. 2026011001' : 'e.g. rahul.cse26';
                inp.autocomplete = loginMethod === 'roll' ? 'off' : 'username';
            }
        }

        function switchAuthTab(which) {
            document.getElementById('tabLogin').classList.toggle('active', which === 'login');
            document.getElementById('tabSignup').classList.toggle('active', which === 'signup');
            document.getElementById('loginForm').style.display = which === 'login' ? 'block' : 'none';
            document.getElementById('signupForm').style.display = which === 'signup' ? 'block' : 'none';
        }

        function showError(id, msg) { const el = document.getElementById(id);
            el.textContent = msg;
            el.style.display = 'block'; }

        function hideError(id) { document.getElementById(id).style.display = 'none'; }
