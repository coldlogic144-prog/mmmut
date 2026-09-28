// ============================================================================
// SECTION: 90_community_feedback_rating.js
// Community posts, feedback tickets, ratings
// Source: index.html lines 8579-9346 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        function openCreatePost() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (!isAdmin) { showToast('Only admins can create posts.'); return; }
            document.getElementById('createPostOverlay').classList.add('open');
            document.getElementById('cpTitle').value = '';
            document.getElementById('cpContent').value = '';
            document.getElementById('cpImage').value = '';
            document.getElementById('cpImagePreview').style.display = 'none';
            document.getElementById('cpFormError').style.display = 'none';
        }

        function closeCreatePost() {
            document.getElementById('createPostOverlay').classList.remove('open');
        }

        function previewCommunityPostImage() {
            const file = document.getElementById('cpImage').files[0];
            const preview = document.getElementById('cpImagePreview');
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
            }
        }

        async function submitCommunityPost(e) {
            e.preventDefault();
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (!isAdmin) { showToast('Only admins can create posts.'); return; }
            const errorEl = document.getElementById('cpFormError');
            errorEl.style.display = 'none';

            const title = document.getElementById('cpTitle').value.trim();
            const content = document.getElementById('cpContent').value.trim();
            const fileInput = document.getElementById('cpImage');

            if (!title) { errorEl.textContent = 'Please enter a title.';
                errorEl.style.display = 'block'; return; }
            if (!content) { errorEl.textContent = 'Please enter some content.';
                errorEl.style.display = 'block'; return; }

            let imageUrl = null;
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const path = `communityPosts/${currentUid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, path);
                try {
                    await uploadBytes(storageRef, file);
                    imageUrl = await getDownloadURL(storageRef);
                } catch (err) {
                    console.warn('Image upload failed, proceeding without image:', err);
                    showToast('⚠️ Image upload failed, but post will be saved without it.');
                }
            }

            try {
                await addDoc(communityPostsCollection, {
                    uid: currentUid,
                    username: currentUser.username,
                    name: currentUser.name,
                    title,
                    content,
                    imageUrl: imageUrl || null,
                    likes: [],
                    createdAt: serverTimestamp()
                });
                showToast('✅ Post published!');
                closeCreatePost();
            } catch (err) {
                errorEl.textContent = 'Error publishing post: ' + err.message;
                errorEl.style.display = 'block';
            }
        }

        async function renderCommunityPosts() {
            const feed = document.getElementById('communityPostsFeed');
            if (!feed) return;

            if (!currentUser) {
                feed.innerHTML = `<div class="empty-note">Log in to see community posts.</div>`;
                return;
            }

            if (communityPosts.length === 0) {
                feed.innerHTML =
                    `<div class="empty-note">No posts yet. Check back later for updates from the admin.</div>`;
                return;
            }

            let html = '';
            communityPosts.forEach(post => {
                const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString(
                    'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit',
                        minute: '2-digit' }) : '—';
                const isLiked = post.likes && post.likes.includes(currentUid);
                const likeCount = post.likes ? post.likes.length : 0;
                const isOwn = post.uid === currentUid;

                html += `
              <div class="community-post">
                <div class="cp-head">
                  <div>
                    <div class="cp-author">${post.name || 'Unknown'} <span>@${post.username || '—'}</span>
                      <span class="cp-admin-badge">Admin</span>
                    </div>
                    <div class="cp-title">${post.title}</div>
                  </div>
                  <div class="cp-time">${date}</div>
                </div>
                <div class="cp-body">${post.content}</div>
                ${post.imageUrl ? `<img src="${post.imageUrl}" class="cp-image" alt="Post image" loading="lazy" />` : ''}
                <div class="cp-actions">
                  <button class="cp-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    ${isLiked ? '❤️' : '🤍'} <span class="cp-like-count">${likeCount}</span>
                  </button>
                  ${isOwn ? `<button class="cp-delete-btn" onclick="deleteCommunityPost('${post.id}')">🗑️ Delete</button>` : ''}
                </div>
              </div>
            `;
            });

            feed.innerHTML = html;
        }

        async function toggleLike(postId) {
            if (!currentUser) { showToast('Please log in first.'); return; }
            try {
                const postRef = doc(communityPostsCollection, postId);
                const snap = await getDoc(postRef);
                if (!snap.exists()) { showToast('Post not found.'); return; }
                const data = snap.data();
                const likes = data.likes || [];
                const idx = likes.indexOf(currentUid);
                if (idx > -1) {
                    likes.splice(idx, 1);
                } else {
                    likes.push(currentUid);
                }
                await updateDoc(postRef, { likes });
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        async function deleteCommunityPost(postId) {
            if (!confirm('Delete this post? This cannot be undone.')) return;
            try {
                const postRef = doc(communityPostsCollection, postId);
                const snap = await getDoc(postRef);
                if (!snap.exists()) { showToast('Post not found.'); return; }
                const data = snap.data();
                if (data.uid !== currentUid) { showToast('You can only delete your own posts.'); return; }
                if (data.imageUrl) {
                    try {
                        const imageRef = ref(storage, data.imageUrl);
                        await deleteObject(imageRef);
                    } catch (e) {}
                }
                await deleteDoc(postRef);
                showToast('Post deleted.');
            } catch (e) {
                showToast('Error deleting: ' + e.message);
            }
        }

        // ============================================================
        // ========== FEEDBACK SYSTEM ==================================
        // ============================================================

        function generateTicketId() {
            const year = new Date().getFullYear();
            const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
            return `FB-${year}-${random}`;
        }

        async function checkRateLimit(uid) {
            const today = dateKey(new Date());
            const q = query(
                feedbackCollection,
                where('uid', '==', uid),
                where('createdAtDate', '==', today)
            );
            const snap = await getDocs(q);
            return snap.size < 5;
        }

        function openFeedbackForm() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            document.getElementById('feedbackFormOverlay').classList.add('open');
            document.getElementById('fbFormError').style.display = 'none';
            document.getElementById('fbCategory').value = '';
            document.getElementById('fbSubject').value = '';
            document.getElementById('fbMessage').value = '';
            document.getElementById('fbPriority').value = 'medium';
            document.getElementById('fbScreenshot').value = '';
            document.getElementById('fbCharCount').textContent = '0 / 2000';
        }

        function closeFeedbackForm() {
            document.getElementById('feedbackFormOverlay').classList.remove('open');
        }

        document.addEventListener('DOMContentLoaded', () => {
            const msg = document.getElementById('fbMessage');
            if (msg) {
                msg.addEventListener('input', () => {
                    document.getElementById('fbCharCount').textContent = msg.value.length + ' / 2000';
                });
            }
        });

        async function submitFeedback(e) {
            e.preventDefault();
            if (!currentUser) { showToast('Please log in first.'); return; }
            const errorEl = document.getElementById('fbFormError');
            errorEl.style.display = 'none';

            const category = document.getElementById('fbCategory').value;
            const subject = document.getElementById('fbSubject').value.trim();
            const message = document.getElementById('fbMessage').value.trim();
            const priority = document.getElementById('fbPriority').value;
            const fileInput = document.getElementById('fbScreenshot');

            if (!category) { errorEl.textContent = 'Please select a category.';
                errorEl.style.display = 'block'; return; }
            if (!subject || subject.length > 100) { errorEl.textContent =
                    'Subject is required and must be 100 characters or less.';
                errorEl.style.display = 'block'; return; }
            if (message.length < 20 || message.length > 2000) { errorEl.textContent =
                    'Description must be between 20 and 2000 characters.';
                errorEl.style.display = 'block'; return; }

            const ok = await checkRateLimit(currentUid);
            if (!ok) { errorEl.textContent = 'Daily feedback limit reached (5 per day).';
                errorEl.style.display = 'block'; return; }

            let attachmentUrl = null;
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const path = `feedback/${currentUid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, path);
                try {
                    await uploadBytes(storageRef, file);
                    attachmentUrl = await getDownloadURL(storageRef);
                } catch (err) {
                    errorEl.textContent = 'Failed to upload screenshot: ' + err.message;
                    errorEl.style.display = 'block';
                    return;
                }
            }

            const ticketId = generateTicketId();
            const today = dateKey(new Date());

            try {
                await addDoc(feedbackCollection, {
                    uid: currentUid,
                    username: currentUser.username,
                    name: currentUser.name,
                    branch: currentUser.branchId,
                    section: currentUser.section,
                    category,
                    subject,
                    message,
                    priority,
                    status: 'open',
                    attachment: attachmentUrl,
                    ticketId,
                    createdAtDate: today,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    adminReply: null,
                    adminReplyAt: null,
                    repliedBy: null
                });
                showToast('✅ Feedback submitted! Ticket: ' + ticketId);
                closeFeedbackForm();
                renderFeedbackPreview();
                if (isAdmin) renderAdminFeedback();
            } catch (err) {
                errorEl.textContent = 'Error submitting feedback: ' + err.message;
                errorEl.style.display = 'block';
            }
        }

        async function renderFeedbackPreview() {
            if (!currentUser) return;
            const previewEl = document.getElementById('feedbackPreviewContent');
            if (!previewEl) return;
            try {
                const q = query(feedbackCollection, where('uid', '==', currentUid), orderBy('createdAt', 'desc'), limit(3));
                const snap = await getDocs(q);
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                const allQ = query(feedbackCollection, where('uid', '==', currentUid));
                const allSnap = await getDocs(allQ);
                const allDocs = allSnap.docs.map(d => d.data());
                const total = allDocs.length;
                const open = allDocs.filter(d => d.status === 'open' || d.status === 'in_progress').length;
                const resolved = allDocs.filter(d => d.status === 'resolved' || d.status === 'closed').length;

                document.getElementById('fbTotalCount').textContent = total;
                document.getElementById('fbOpenCount').textContent = open;
                document.getElementById('fbResolvedCount').textContent = resolved;

                const latestEl = document.getElementById('fbLatestPreview');
                if (items.length === 0) {
                    latestEl.textContent = 'No feedback yet. Click "New" to submit.';
                } else {
                    const latest = items[0];
                    const statusMap = {
                        'open': '🟡 Open',
                        'in_progress': '🔵 In Progress',
                        'resolved': '🟢 Resolved',
                        'closed': '⚪ Closed'
                    };
                    const date = latest.createdAt ? new Date(latest.createdAt.seconds * 1000).toLocaleDateString(
                        'en-IN', { day: 'numeric', month: 'short' }) : '—';
                    latestEl.innerHTML =
                        `<strong>${latest.ticketId || '—'}</strong> — ${latest.subject} <span style="color:var(--ink-soft);font-size:11px;">(${statusMap[latest.status] || latest.status} · ${date})</span>`;
                }
            } catch (e) {}
        }

        // ========== MY FEEDBACK ==========
        let myFeedbackPage = 0;
        const MY_FEEDBACK_LIMIT = 20;

        function openMyFeedback() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            document.getElementById('myFeedbackOverlay').classList.add('open');
            myFeedbackPage = 0;
            renderMyFeedback();
        }

        function closeMyFeedback() {
            document.getElementById('myFeedbackOverlay').classList.remove('open');
        }

        async function renderMyFeedback() {
            const body = document.getElementById('myFeedbackBody');
            if (!body) return;
            try {
                const q = query(
                    feedbackCollection,
                    where('uid', '==', currentUid),
                    orderBy('createdAt', 'desc'),
                    limit(MY_FEEDBACK_LIMIT)
                );
                const snap = await getDocs(q);
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                if (items.length === 0) {
                    body.innerHTML = `<div class="feedback-empty">You haven't submitted any feedback yet.</div>`;
                    return;
                }

                let html = '';
                items.forEach(f => {
                    const statusMap = {
                        'open': 'fb-status-open',
                        'in_progress': 'fb-status-in_progress',
                        'resolved': 'fb-status-resolved',
                        'closed': 'fb-status-closed'
                    };
                    const statusLabel = {
                        'open': 'Open',
                        'in_progress': 'In Progress',
                        'resolved': 'Resolved',
                        'closed': 'Closed'
                    };
                    const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString(
                        'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                    const priorityClass = f.priority === 'high' ? 'fb-priority-high' : f.priority === 'medium' ?
                        'fb-priority-medium' : 'fb-priority-low';

                    html += `
                <div class="feedback-list-item">
                  <div class="fb-head">
                    <div>
                      <span class="fb-ticket">${f.ticketId || '—'}</span>
                      <span class="fb-subject">${f.subject}</span>
                    </div>
                    <span class="fb-status-badge ${statusMap[f.status] || 'fb-status-open'}">${statusLabel[f.status] || 'Open'}</span>
                  </div>
                  <div class="fb-meta">
                    <span class="${priorityClass}">${f.priority?.toUpperCase() || 'MEDIUM'}</span>
                    · ${f.category} · ${date}
                  </div>
                  <div class="fb-message">${f.message}</div>
                  ${f.attachment ? `<a href="${f.attachment}" target="_blank" class="fb-attachment-link">📎 View Attachment</a>` : ''}
                  ${f.adminReply ? `
                    <div class="fb-reply">
                      <div class="fb-reply-label">💬 Admin Reply</div>
                      ${f.adminReply}
                      <div style="font-size:10px;color:var(--ink-soft);margin-top:4px;">${f.repliedBy ? 'by ' + f.repliedBy : ''} · ${f.adminReplyAt ? new Date(f.adminReplyAt.seconds * 1000).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''}</div>
                    </div>
                  ` : ''}
                  <div class="fb-actions">
                    ${f.status === 'open' ? `<button class="btn-sm delete" onclick="deleteMyFeedback('${f.id}')">Delete</button>` : ''}
                  </div>
                </div>
              `;
                });

                body.innerHTML = html;
            } catch (e) {
                body.innerHTML = `<div class="feedback-empty">Error loading feedback: ${e.message}</div>`;
            }
        }

        async function deleteMyFeedback(id) {
            if (!confirm('Delete this feedback? This cannot be undone.')) return;
            try {
                const docRef = doc(feedbackCollection, id);
                const snap = await getDoc(docRef);
                if (!snap.exists()) { showToast('Feedback not found.'); return; }
                const data = snap.data();
                if (data.uid !== currentUid) { showToast('You can only delete your own feedback.'); return; }
                if (data.status !== 'open') { showToast('Only open feedback can be deleted.'); return; }
                await deleteDoc(docRef);
                showToast('Feedback deleted.');
                renderMyFeedback();
                renderFeedbackPreview();
                if (isAdmin) renderAdminFeedback();
            } catch (e) {
                showToast('Error deleting: ' + e.message);
            }
        }

        // ========== ADMIN FEEDBACK ==========
        let adminFeedbackPage = 0;
        const ADMIN_FEEDBACK_LIMIT = 20;
        let adminFeedbackFilter = 'all';
        let adminFeedbackSearch = '';
        let adminFeedbackLastDoc = null;
        let adminFeedbackDocs = [];

        async function renderAdminFeedback() {
            const el = document.getElementById('adminFeedbackContent');
            if (!el) return;
            try {
                let q = query(feedbackCollection, orderBy('createdAt', 'desc'), limit(ADMIN_FEEDBACK_LIMIT));

                let filtered = [];
                const snap = await getDocs(q);
                let allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                const search = adminFeedbackSearch.trim().toLowerCase();
                if (search) {
                    allDocs = allDocs.filter(d =>
                        (d.name || '').toLowerCase().includes(search) ||
                        (d.username || '').toLowerCase().includes(search) ||
                        (d.ticketId || '').toLowerCase().includes(search) ||
                        (d.subject || '').toLowerCase().includes(search) ||
                        (d.category || '').toLowerCase().includes(search) ||
                        (d.branch || '').toLowerCase().includes(search) ||
                        (d.section || '').toLowerCase().includes(search) ||
                        (d.status || '').toLowerCase().includes(search)
                    );
                }

                if (adminFeedbackFilter === 'open') {
                    allDocs = allDocs.filter(d => d.status === 'open' || d.status === 'in_progress');
                } else if (adminFeedbackFilter === 'high') {
                    allDocs = allDocs.filter(d => d.priority === 'high');
                } else if (adminFeedbackFilter === 'resolved') {
                    allDocs = allDocs.filter(d => d.status === 'resolved' || d.status === 'closed');
                } else if (adminFeedbackFilter === 'closed') {
                    allDocs = allDocs.filter(d => d.status === 'closed');
                }

                adminFeedbackDocs = allDocs;

                if (allDocs.length === 0) {
                    el.innerHTML = `
                <div class="fb-admin-search">
                  <input class="search-box" placeholder="Search by name, username, ticket, subject…" value="${adminFeedbackSearch}" oninput="adminFeedbackSearch=this.value;renderAdminFeedback();" />
                  <div class="fb-admin-filters">
                    <button class="filter-btn ${adminFeedbackFilter==='all'?'active':''}" onclick="adminFeedbackFilter='all';renderAdminFeedback();">All</button>
                    <button class="filter-btn ${adminFeedbackFilter==='open'?'active':''}" onclick="adminFeedbackFilter='open';renderAdminFeedback();">Open</button>
                    <button class="filter-btn ${adminFeedbackFilter==='high'?'active':''}" onclick="adminFeedbackFilter='high';renderAdminFeedback();">High Priority</button>
                    <button class="filter-btn ${adminFeedbackFilter==='resolved'?'active':''}" onclick="adminFeedbackFilter='resolved';renderAdminFeedback();">Resolved</button>
                    <button class="filter-btn ${adminFeedbackFilter==='closed'?'active':''}" onclick="adminFeedbackFilter='closed';renderAdminFeedback();">Closed</button>
                  </div>
                </div>
                <div class="feedback-empty">No feedback tickets found.</div>
              `;
                    return;
                }

                let html = `
              <div class="fb-admin-search">
                <input class="search-box" placeholder="Search by name, username, ticket, subject…" value="${adminFeedbackSearch}" oninput="adminFeedbackSearch=this.value;renderAdminFeedback();" />
                <div class="fb-admin-filters">
                  <button class="filter-btn ${adminFeedbackFilter==='all'?'active':''}" onclick="adminFeedbackFilter='all';renderAdminFeedback();">All</button>
                  <button class="filter-btn ${adminFeedbackFilter==='open'?'active':''}" onclick="adminFeedbackFilter='open';renderAdminFeedback();">Open</button>
                  <button class="filter-btn ${adminFeedbackFilter==='high'?'active':''}" onclick="adminFeedbackFilter='high';renderAdminFeedback();">High Priority</button>
                  <button class="filter-btn ${adminFeedbackFilter==='resolved'?'active':''}" onclick="adminFeedbackFilter='resolved';renderAdminFeedback();">Resolved</button>
                  <button class="filter-btn ${adminFeedbackFilter==='closed'?'active':''}" onclick="adminFeedbackFilter='closed';renderAdminFeedback();">Closed</button>
                </div>
              </div>
              <div class="fb-admin-table-wrap">
                <table class="fb-admin-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Student</th>
                      <th>Branch/Sec</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Subject</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
            `;

                allDocs.forEach(f => {
                    const statusMap = {
                        'open': 'fb-status-open',
                        'in_progress': 'fb-status-in_progress',
                        'resolved': 'fb-status-resolved',
                        'closed': 'fb-status-closed'
                    };
                    const statusLabel = {
                        'open': 'Open',
                        'in_progress': 'In Progress',
                        'resolved': 'Resolved',
                        'closed': 'Closed'
                    };
                    const branchName = getBranch(f.branch)?.name || f.branch || '—';
                    const shortBranch = branchName.replace('B.Tech — ', '');
                    const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString(
                        'en-IN', { day: 'numeric', month: 'short' }) : '—';

                    html += `
                <tr>
                  <td><span class="fb-ticket" style="font-weight:600;">${f.ticketId || '—'}</span></td>
                  <td>${f.name || '—'}<br/><span style="font-size:10px;color:var(--ink-soft);">@${f.username || '—'}</span></td>
                  <td>${shortBranch}<br/><span style="font-size:10px;color:var(--ink-soft);">Sec ${f.section || '—'}</span></td>
                  <td>${f.category || '—'}</td>
                  <td><span class="${f.priority === 'high' ? 'fb-priority-high' : f.priority === 'medium' ? 'fb-priority-medium' : 'fb-priority-low'}">${f.priority?.toUpperCase() || 'MED'}</span></td>
                  <td><span class="fb-status-badge ${statusMap[f.status] || 'fb-status-open'}">${statusLabel[f.status] || 'Open'}</span></td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.subject || ''}">${f.subject || '—'}</td>
                  <td>
                    <div class="fb-admin-actions">
                      <button class="btn-sm reply-btn" onclick="openAdminReply('${f.id}')">Reply</button>
                      <button class="btn-sm status-btn" onclick="changeFeedbackStatus('${f.id}')">Status</button>
                      <button class="btn-sm del-btn" onclick="deleteFeedbackAdmin('${f.id}')">Delete</button>
                    </div>
                  </td>
                </tr>
              `;
                });

                html += `</tbody></table></div>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="feedback-empty">Error loading feedback: ${e.message}</div>`;
            }
        }

        // ========== ADMIN REPLY ==========
        let replyFeedbackId = null;

        function openAdminReply(feedbackId) {
            replyFeedbackId = feedbackId;
            document.getElementById('adminReplyModal').classList.add('open');
            document.getElementById('adminReplyText').value = '';
            document.getElementById('adminReplyError').style.display = 'none';
            getDoc(doc(feedbackCollection, feedbackId)).then(snap => {
                if (snap.exists()) {
                    const data = snap.data();
                    document.getElementById('replyTicketInfo').textContent =
                        `Ticket: ${data.ticketId || '—'} — ${data.subject || ''}`;
                }
            }).catch(() => {});
        }

        function closeAdminReplyModal() {
            document.getElementById('adminReplyModal').classList.remove('open');
            replyFeedbackId = null;
        }

        async function submitAdminReply() {
            if (!replyFeedbackId) { showToast('No feedback selected.'); return; }
            const reply = document.getElementById('adminReplyText').value.trim();
            if (!reply) { document.getElementById('adminReplyError').textContent = 'Please enter a reply.';
                document.getElementById('adminReplyError').style.display = 'block'; return; }

            try {
                await updateDoc(doc(feedbackCollection, replyFeedbackId), {
                    adminReply: reply,
                    adminReplyAt: serverTimestamp(),
                    repliedBy: currentUser ? currentUser.username : 'admin',
                    status: 'in_progress',
                    updatedAt: serverTimestamp()
                });
                showToast('✅ Reply sent!');
                closeAdminReplyModal();
                renderAdminFeedback();
                renderFeedbackPreview();
            } catch (e) {
                document.getElementById('adminReplyError').textContent = 'Error: ' + e.message;
                document.getElementById('adminReplyError').style.display = 'block';
            }
        }

        // ========== CHANGE STATUS ==========
        async function changeFeedbackStatus(feedbackId) {
            const statuses = ['open', 'in_progress', 'resolved', 'closed'];
            const labels = ['🟡 Open', '🔵 In Progress', '🟢 Resolved', '⚪ Closed'];
            const current = await getDoc(doc(feedbackCollection, feedbackId));
            if (!current.exists()) { showToast('Feedback not found.'); return; }
            const curStatus = current.data().status || 'open';
            const idx = statuses.indexOf(curStatus);
            const next = statuses[(idx + 1) % statuses.length];
            const choice = confirm(
                `Current status: ${labels[statuses.indexOf(curStatus)]}\nClick OK to change to: ${labels[statuses.indexOf(next)]}`
                );
            if (!choice) return;
            try {
                await updateDoc(doc(feedbackCollection, feedbackId), {
                    status: next,
                    updatedAt: serverTimestamp()
                });
                showToast(`Status changed to ${next}.`);
                renderAdminFeedback();
                renderFeedbackPreview();
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        // ========== DELETE FEEDBACK (ADMIN) ==========
        async function deleteFeedbackAdmin(feedbackId) {
            if (!confirm('Delete this feedback permanently?')) return;
            try {
                const snap = await getDoc(doc(feedbackCollection, feedbackId));
                if (snap.exists() && snap.data().attachment) {
                    try {
                        const attachmentRef = ref(storage, snap.data().attachment);
                        await deleteObject(attachmentRef);
                    } catch (e) {}
                }
                await deleteDoc(doc(feedbackCollection, feedbackId));
                showToast('Feedback deleted.');
                renderAdminFeedback();
                renderFeedbackPreview();
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        // ========== ERP RATING ==========
        let selectedRating = 0;
        let existingRating = null;

        function openRatingModal() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            document.getElementById('ratingModal').classList.add('open');
            document.getElementById('ratingFormError').style.display = 'none';
            document.getElementById('ratingComment').value = '';
            loadExistingRating();
        }

        function closeRatingModal() {
            document.getElementById('ratingModal').classList.remove('open');
        }

        async function loadExistingRating() {
            if (!currentUser) return;
            try {
                const q = query(ratingsCollection, where('uid', '==', currentUid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    existingRating = { id: doc.id, ...doc.data() };
                    selectedRating = existingRating.rating || 0;
                    document.getElementById('ratingComment').value = existingRating.comment || '';
                    document.getElementById('ratingExisting').style.display = 'block';
                    document.getElementById('ratingExisting').innerHTML =
                        `⭐ You rated ${existingRating.rating} stars. You can update your rating below.`;
                    updateRatingStars();
                } else {
                    existingRating = null;
                    selectedRating = 0;
                    document.getElementById('ratingExisting').style.display = 'none';
                    updateRatingStars();
                }
            } catch (e) {}
        }

        function updateRatingStars() {
            const stars = document.querySelectorAll('#ratingStars span');
            stars.forEach((el, i) => {
                el.className = i < selectedRating ? 'star-on' : 'star-off';
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            const stars = document.querySelectorAll('#ratingStars span');
            stars.forEach(el => {
                el.addEventListener('click', () => {
                    selectedRating = parseInt(el.dataset.val);
                    updateRatingStars();
                });
                el.addEventListener('mouseenter', () => {
                    const val = parseInt(el.dataset.val);
                    const all = document.querySelectorAll('#ratingStars span');
                    all.forEach((s, i) => {
                        s.className = i < val ? 'star-on' : 'star-off';
                    });
                });
                el.addEventListener('mouseleave', updateRatingStars);
            });
        });

        async function submitRating() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (selectedRating < 1 || selectedRating > 5) {
                document.getElementById('ratingFormError').textContent = 'Please select a rating (1–5 stars).';
                document.getElementById('ratingFormError').style.display = 'block';
                return;
            }
            const comment = document.getElementById('ratingComment').value.trim();

            try {
                if (existingRating) {
                    await updateDoc(doc(ratingsCollection, existingRating.id), {
                        rating: selectedRating,
                        comment: comment,
                        updatedAt: serverTimestamp()
                    });
                    showToast('⭐ Rating updated!');
                } else {
                    await addDoc(ratingsCollection, {
                        uid: currentUid,
                        username: currentUser.username,
                        name: currentUser.name,
                        rating: selectedRating,
                        comment: comment,
                        createdAt: serverTimestamp()
                    });
                    showToast('⭐ Thanks for rating!');
                }
                closeRatingModal();
                loadExistingRating();
            } catch (e) {
                document.getElementById('ratingFormError').textContent = 'Error: ' + e.message;
                document.getElementById('ratingFormError').style.display = 'block';
            }
        }

        // ============================================================
        // ========== LEDGER AI – CHAT IMPLEMENTATION =================
        // ============================================================

        let aiConversationHistory = [];
        const MAX_HISTORY = 20;
