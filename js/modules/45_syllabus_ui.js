// ============================================================================
// SECTION: 45_syllabus_ui.js
// Syllabus Tracker preview (dashboard) — merged with The Ledger.
// The old static "Curriculum" table viewer was removed: the dashboard card at
// #syllabusCard is now a live preview of the Ledger (Syllabus Tracker).
// loadSyllabus()/openSyllabusFullView() are kept as backwards-compatible shims
// so any lingering onclick / test hooks route into the Ledger instead of 404ing.
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // Backwards-compat: old "Curriculum" card called these. Route to Ledger.
        function loadSyllabus() {
            if (typeof renderDashboardLedgerPreview === 'function') {
                renderDashboardLedgerPreview();
            }
            return;
        }

        function openSyllabusFullView() {
            if (typeof toggleLedgerSection === 'function') {
                toggleLedgerSection(true);
            }
            return;
        }

        // Live dashboard preview of the Syllabus Tracker (Ledger).
        // Shows the user's own branch, current semester view, one compact row
        // per course with real progress bars + working checkboxes.
        function renderDashboardLedgerPreview() {
            const host = document.getElementById('dashboardLedgerPreview');
            if (!host) return;
            if (typeof LEDGER_DATA === 'undefined' || !LEDGER_DATA) {
                host.innerHTML = `<div class="syllabus-loading">Syllabus data is loading…</div>`;
                return;
            }
            const branch = (typeof ledgerCurrentBranch !== 'undefined' && LEDGER_DATA[ledgerCurrentBranch])
                ? ledgerCurrentBranch
                : (typeof detectUserBranch === 'function' ? detectUserBranch() : 'civil');
            const bData = LEDGER_DATA[branch];
            if (!bData) {
                host.innerHTML = `<div class="syllabus-loading">Syllabus data not available for this branch.</div>`;
                return;
            }
            const view = (typeof ledgerCurrentView !== 'undefined') ? String(ledgerCurrentView) : '1';
            const subjects = (bData.semesters && bData.semesters[view]) || [];
            if (!subjects.length) {
                host.innerHTML = `<div class="syllabus-loading">Curriculum records are being updated for this semester.</div>`;
                return;
            }
            const roman = (typeof LEDGER_ROMAN !== 'undefined' && LEDGER_ROMAN[Number(view) - 1]) || ('Sem ' + view);
            let doneCount = 0;
            const rows = subjects.slice(0, 6).map(sub => {
                const total = (typeof getLedgerCourseTopicCount === 'function') ? getLedgerCourseTopicCount(sub) : 0;
                const done = (typeof getLedgerCourseTopicsDone === 'function') ? getLedgerCourseTopicsDone(branch, sub) : 0;
                const isDone = (typeof isLedgerCourseDone === 'function') ? isLedgerCourseDone(branch, sub, view) : false;
                if (isDone) doneCount++;
                const pct = total > 0 ? Math.round((done / total) * 100) : (isDone ? 100 : 0);
                const detailHint = sub.d ? ' · unit syllabus available' : '';
                return `
                    <div class="ledger-preview-row ${isDone ? 'row-done' : ''}">
                        <button type="button" class="ledger-cb preview-cb ${isDone ? 'checked' : ''}"
                            onclick="handleLedgerAction('subj', '${view}', '${escapeHtml(sub.code)}')"
                            role="checkbox" aria-checked="${isDone}" aria-label="Mark ${escapeHtml(sub.name)} completed">
                            ${(typeof LEDGER_CHECK_SVG !== 'undefined') ? LEDGER_CHECK_SVG : '✓'}
                        </button>
                        <div class="ledger-preview-main" onclick="toggleLedgerSection(true)" title="Open in Syllabus Tracker">
                            <div class="ledger-preview-title-row">
                                <span class="ledger-course-code sm">${escapeHtml(sub.code)}</span>
                                <span class="ledger-preview-name">${escapeHtml(sub.name)}</span>
                            </div>
                            <div class="ledger-preview-bar"><i style="width:${pct}%"></i></div>
                            <div class="ledger-preview-meta">${done}/${total} topics · ${pct}%${detailHint}</div>
                        </div>
                    </div>`;
            }).join('');
            const extraNote = subjects.length > 6 ? `<div class="ledger-preview-more">+ ${subjects.length - 6} more courses in Sem ${roman}</div>` : '';
            host.innerHTML = `
                <div class="ledger-preview-head">
                    <span class="ledger-preview-branch">${escapeHtml(bData.name)}</span>
                    <span class="ledger-preview-sem">Sem ${roman} · ${doneCount}/${subjects.length} done</span>
                </div>
                <div class="ledger-preview-list">${rows}</div>
                ${extraNote}
                <button class="btn-secondary ledger-preview-open" onclick="toggleLedgerSection(true)">Open full Syllabus Tracker →</button>`;
        }