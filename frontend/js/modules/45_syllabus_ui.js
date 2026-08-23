// ============================================================================
// SECTION: 45_syllabus_ui.js
// Syllabus viewer
// Source: index.html lines 5613-5693 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== SYLLABUS FUNCTIONS ==========
        function loadSyllabus() {
            const branchId = document.getElementById('syllabusBranch').value;
            const year = parseInt(document.getElementById('syllabusYear').value);
            const content = document.getElementById('syllabusContent');

            if (!branchId) {
                content.innerHTML =
                `<div class="syllabus-loading">Select your branch to view the syllabus.</div>`;
                return;
            }

            const branchData = syllabusData[branchId];
            if (!branchData) {
                content.innerHTML =
                    `<div class="syllabus-loading">Syllabus data not available for this branch.</div>`;
                return;
            }

            const semesterData = branchData.semesters[year];
            if (!semesterData) {
                content.innerHTML = `<div class="syllabus-loading">Syllabus for Year ${year} not available.</div>`;
                return;
            }

            let html = `<h3>${branchData.name} — Year ${year}</h3>`;
            html += `<table>
                        <thead>
                            <tr>
                                <th>Subject Code</th>
                                <th>Subject Name</th>
                                <th>L-T-P</th>
                                <th>Credits</th>
                            </tr>
                        </thead>
                        <tbody>`;

            semesterData.forEach(sub => {
                html += `<tr>
                            <td><span class="subject-code">${sub.code}</span></td>
                            <td>${sub.name}</td>
                            <td>${sub.ltp}</td>
                            <td>${sub.credits}</td>
                        </tr>`;
            });

            html += `</tbody></table>`;
            html +=
                `<p style="font-size:11px;color:var(--ink-soft);margin-top:12px;">Source: MMMUT Curriculum Structure & Syllabi (w.e.f. 2024-25)</p>`;
            content.innerHTML = html;
        }

        function openSyllabusFullView() {
            const branchId = document.getElementById('syllabusBranch').value;
            if (!branchId) {
                showToast('Please select a branch first to view the full syllabus.');
                return;
            }
            const year = document.getElementById('syllabusYear').value;
            const content = document.getElementById('syllabusContent').innerHTML;
            const win = window.open('', '_blank', 'width=800,height=600');
            if (win) {
                win.document.write(`
                    <html><head><title>Syllabus - ${syllabusData[branchId]?.name || 'MMMUT'}</title>
                    <style>
                        body { font-family: 'IBM Plex Sans', sans-serif; background: #EDEAE0; color: #152A3B; padding: 30px; max-width: 900px; margin: 0 auto; }
                        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                        th, td { border: 1px solid #D9D4C4; padding: 8px 10px; text-align: left; vertical-align: top; }
                        th { background: #152A3B; color: #F1ECDD; }
                        tr:nth-child(even) { background: #F7F5EE; }
                        .subject-code { font-weight: 600; color: #B08A3E; }
                        h3 { font-family: 'Fraunces', serif; }
                    </style>
                    </head><body>
                    ${content}
                    <p style="font-size:11px;color:#8B8676;margin-top:20px;">MMMUT Gorakhpur — Curriculum Structure & Syllabi (w.e.f. 2024-25)</p>
                    </body></html>
                `);
                win.document.close();
            }
        }