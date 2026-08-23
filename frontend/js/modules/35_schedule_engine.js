// ============================================================================
// SECTION: 35_schedule_engine.js
// Helpers + seeded timetable generator
// Source: index.html lines 4920-5042 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== HELPERS ==========
        function getBranch(id) { return BRANCHES.find(b => b.id === id); }

        function authEmail(username) { return username + '@mmmut.local'; }

        function dateKey(d) { return d.toISOString().slice(0, 10); }

        function fmtTime(t) {
            const [h, m] = t.split(':').map(Number);
            const ap = h >= 12 ? 'pm' : 'am';
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return `${h12}:${m.toString().padStart(2, '0')}${ap}`;
        }

        function comparePeriod(key, nowKey) {
            const order = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
            if (!nowKey) return -1;
            return order.indexOf(key) - order.indexOf(nowKey);
        }

        function computeLeaveInfo(present, absent, targetPct) {
            const total = present + absent;
            const target = targetPct / 100;
            if (total === 0) return { type: 'none' };
            const currentPct = present / total;
            if (currentPct >= target) {
                const x = Math.floor(present / target - total + 1e-9);
                return { type: 'skip', value: Math.max(0, x) };
            } else {
                const y = Math.ceil((target * total - present) / (1 - target) - 1e-9);
                return { type: 'attend', value: Math.max(1, y) };
            }
        }

        function hashSeed(str) {
            let h = 1779033703 ^ str.length;
            for (let i = 0; i < str.length; i++) {
                h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
                h = (h << 13) | (h >>> 19);
            }
            return function() {
                h = Math.imul(h ^ (h >>> 16), 2246822519);
                h = Math.imul(h ^ (h >>> 13), 3266489917);
                h = (h ^= h >>> 16) >>> 0;
                return h / 4294967296;
            };
        }

        function seededShuffle(arr, rng) {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        function buildSchedule(branch, section) {
            const pdfGrid = PDF_TIMETABLES[branch.id + '::' + section];
            if (pdfGrid) return JSON.parse(JSON.stringify(pdfGrid));
            const rng = hashSeed(branch.id + '::' + section);
            const grid = {};
            DAYS.forEach(d => { grid[d] = {};
                TEACH_PERIODS.forEach(p => grid[d][p.key] = null); });
            const dayHas = {};
            DAYS.forEach(d => dayHas[d] = new Set());
            let units = [];
            branch.subjects.forEach(s => {
                const [L, T] = s.ltp;
                for (let i = 0; i < L; i++) units.push({ code: s.code, name: s.name, type: 'Lecture' });
                for (let i = 0; i < T; i++) units.push({ code: s.code, name: s.name, type: 'Tutorial' });
            });
            units = seededShuffle(units, rng);
            const morningSlots = [];
            DAYS.forEach(d => ['I', 'II', 'III', 'IV'].forEach(k => morningSlots.push({ day: d, key: k })));
            const shuffledMorning = seededShuffle(morningSlots, rng);
            const remaining = units.slice();
            shuffledMorning.forEach(slot => {
                if (!remaining.length) return;
                let idx = remaining.findIndex(u => !dayHas[slot.day].has(u.code));
                if (idx === -1) idx = 0;
                const u = remaining.splice(idx, 1)[0];
                grid[slot.day][slot.key] = u;
                dayHas[slot.day].add(u.code);
            });
            let blocks = [];
            branch.subjects.forEach(s => {
                const P = s.ltp[2];
                const blockCount = Math.max(0, Math.round(P / 2));
                for (let i = 0; i < blockCount; i++) blocks.push({ code: s.code, name: s.name, type: 'Practical' });
            });
            blocks = seededShuffle(blocks, rng);
            let pairSlots = [];
            DAYS.forEach(d => { pairSlots.push({ day: d, keys: ['V', 'VI'] });
                pairSlots.push({ day: d, keys: ['VII', 'VIII'] }); });
            pairSlots = seededShuffle(pairSlots, rng);
            const usedPair = new Set();

            function tryPlaceBlock(block, avoidSameDay) {
                for (const pair of pairSlots) {
                    const pid = pair.day + ':' + pair.keys[0];
                    if (usedPair.has(pid)) continue;
                    if (avoidSameDay && dayHas[pair.day].has(block.code)) continue;
                    grid[pair.day][pair.keys[0]] = block;
                    grid[pair.day][pair.keys[1]] = block;
                    dayHas[pair.day].add(block.code);
                    usedPair.add(pid);
                    return true;
                }
                return false;
            }
            blocks.forEach(block => {
                if (!tryPlaceBlock(block, true)) { tryPlaceBlock(block, false); }
            });
            DAYS.forEach(d => {
                TEACH_PERIODS.forEach(p => {
                    if (!grid[d][p.key]) grid[d][p.key] = { code: '—', name: 'Self Study / Library',
                    type: 'Free' };
                });
            });
            return grid;
        }
