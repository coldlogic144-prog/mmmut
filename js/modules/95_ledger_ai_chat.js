// ============================================================================
// SECTION: 95_ledger_ai_chat.js
// Ledger AI chat UI, context builder, prompts
// Source: index.html lines 9347-9893 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        function toggleLedgerAI() {
            const chat = document.getElementById('ledgerAiChat');
            const isOpen = chat.classList.contains('open');
            if (isOpen) {
                chat.classList.remove('open');
            } else {
                chat.classList.add('open');
                document.getElementById('ledgerAiInput').focus();
                document.getElementById('aiBadgeDot').style.display = 'none';
            }
        }

        function clearLedgerAI() {
            if (!confirm('Clear the conversation?')) return;
            aiConversationHistory = [];
            const container = document.getElementById('ledgerAiMessages');
            const empty = document.getElementById('ledgerAiEmpty');
            const messages = container.querySelectorAll('.message, .typing-indicator');
            messages.forEach(el => el.remove());
            empty.style.display = 'flex';
            document.getElementById('ledgerAiError').classList.remove('show');
            document.getElementById('ledgerAiError').textContent = '';
            showToast('Conversation cleared.');
        }

        function handleLedgerAIKeydown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendLedgerAIMessage();
            }
        }

        function autoResizeLedgerInput(el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        }

        function addAIMessage(content, isUser) {
            const container = document.getElementById('ledgerAiMessages');
            const empty = document.getElementById('ledgerAiEmpty');
            empty.style.display = 'none';

            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isUser ? 'user' : 'ai'}`;

            if (isUser) {
                msgDiv.textContent = content;
            } else {
                let html = content;
                html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
                html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                html = html.replace(/^[\-\*]\s(.+)$/gm, '<li>$1</li>');
                html = html.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
                html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
                html = html.replace(/\n/g, '<br />');
                html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
                msgDiv.innerHTML = html;
            }

            container.appendChild(msgDiv);
            container.scrollTop = container.scrollHeight;
            return msgDiv;
        }

        function showTypingIndicator() {
            const container = document.getElementById('ledgerAiMessages');
            const empty = document.getElementById('ledgerAiEmpty');
            empty.style.display = 'none';

            const existing = container.querySelector('.typing-indicator');
            if (existing) existing.remove();

            const typing = document.createElement('div');
            typing.className = 'typing-indicator';
            typing.innerHTML =
                `<span>Ledger AI</span><div class="dots"><span></span><span></span><span></span></div>`;
            container.appendChild(typing);
            container.scrollTop = container.scrollHeight;
            return typing;
        }

        function hideTypingIndicator() {
            const container = document.getElementById('ledgerAiMessages');
            const existing = container.querySelector('.typing-indicator');
            if (existing) existing.remove();
        }

        function showAIError(msg) {
            const el = document.getElementById('ledgerAiError');
            el.textContent = msg;
            el.classList.add('show');
        }

        function hideAIError() {
            document.getElementById('ledgerAiError').classList.remove('show');
        }

        function setAILoading(loading) {
            const sendBtn = document.getElementById('ledgerAiSendBtn');
            const input = document.getElementById('ledgerAiInput');
            sendBtn.disabled = loading;
            input.disabled = loading;
            if (loading) {
                sendBtn.textContent = '⏳';
            } else {
                sendBtn.textContent = '➤';
            }
        }

        // ===== CORE AI LOGIC =====

        function gatherUserContext(question) {
            if (!currentUser) return null;

            const branch = getBranch(currentUser.branchId);
            if (!branch) return null;

            const context = {
                user: {
                    name: currentUser.name,
                    username: currentUser.username,
                    branch: branch.name,
                    section: currentUser.section,
                    hostel: currentUser.hostel || 'Day Scholar',
                    gender: currentUser.gender || 'Not specified'
                },
                attendance: { present: 0, absent: 0, bySubject: {} },
                today: null,
                tomorrow: null,
                week: null,
                subjects: branch.subjects.map(s => ({ code: s.code, name: s.name, ltp: s.ltp })),
                upcomingEvents: [],
                upcomingHolidays: [],
                syllabus: null
            };

            const map = attendanceCache || {};
            const counts = {};
            branch.subjects.forEach(s => counts[s.code] = { present: 0, absent: 0, name: s.name });

            Object.keys(map).forEach(dateStr => {
                if (holidays.has(dateStr)) return;
                const dayMap = map[dateStr];
                Object.entries(dayMap).forEach(([cellKey, status]) => {
                    const code = cellKey.split('::')[1];
                    if (counts[code]) {
                        if (status === 'present') counts[code].present++;
                        else if (status === 'absent') counts[code].absent++;
                    }
                });
            });

            let totalP = 0,
                totalA = 0;
            const bySubject = {};
            branch.subjects.forEach(s => {
                const c = counts[s.code] || { present: 0, absent: 0 };
                totalP += c.present;
                totalA += c.absent;
                bySubject[s.code] = {
                    name: s.name,
                    present: c.present,
                    absent: c.absent,
                    total: c.present + c.absent,
                    pct: (c.present + c.absent) > 0 ? Math.round((c.present / (c.present + c.absent)) * 100) : null
                };
            });
            context.attendance.present = totalP;
            context.attendance.absent = totalA;
            context.attendance.total = totalP + totalA;
            context.attendance.overallPct = (totalP + totalA) > 0 ? Math.round((totalP / (totalP + totalA)) * 100) : null;
            context.attendance.bySubject = bySubject;

            const dayIdx = new Date().getDay();
            const dayMap = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
            const todayName = dayMap[dayIdx] || null;
            const todayStr = dateKey(new Date());

            if (scheduleCache) {
                if (todayName && scheduleCache[todayName]) {
                    context.today = {};
                    const daySchedule = scheduleCache[todayName];
                    TEACH_PERIODS.forEach(p => {
                        if (daySchedule[p.key]) {
                            const cell = daySchedule[p.key];
                            context.today[p.key] = {
                                code: cell.code,
                                name: cell.name,
                                type: cell.type,
                                start: p.start,
                                end: p.end,
                                isFree: cell.code === '—'
                            };
                        }
                    });
                }

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowIdx = tomorrow.getDay();
                const tomorrowName = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' } [
                tomorrowIdx] || null;
                if (tomorrowName && scheduleCache[tomorrowName]) {
                    context.tomorrow = {};
                    const daySchedule = scheduleCache[tomorrowName];
                    TEACH_PERIODS.forEach(p => {
                        if (daySchedule[p.key]) {
                            const cell = daySchedule[p.key];
                            context.tomorrow[p.key] = {
                                code: cell.code,
                                name: cell.name,
                                type: cell.type,
                                start: p.start,
                                end: p.end,
                                isFree: cell.code === '—'
                            };
                        }
                    });
                }

                context.week = {};
                DAYS.forEach(d => {
                    if (scheduleCache[d]) {
                        context.week[d] = {};
                        TEACH_PERIODS.forEach(p => {
                            if (scheduleCache[d][p.key]) {
                                const cell = scheduleCache[d][p.key];
                                context.week[d][p.key] = {
                                    code: cell.code,
                                    name: cell.name,
                                    type: cell.type,
                                    isFree: cell.code === '—'
                                };
                            }
                        });
                    }
                });
            }

            const now = new Date();
            const allEvents = [...BUILTIN_EVENTS];
            const upcoming = allEvents
                .map(e => ({ ...e, endDate: new Date(e.end + 'T23:59:59') }))
                .filter(e => e.endDate >= now)
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .slice(0, 5);
            context.upcomingEvents = upcoming.map(e => ({
                title: e.title,
                start: e.start,
                end: e.end,
                isOngoing: todayStr >= e.start && todayStr <= e.end
            }));

            const holidayArray = Array.from(holidays).sort();
            const nextHolidays = holidayArray
                .filter(h => h >= todayStr)
                .slice(0, 5)
                .map(h => {
                    const d = new Date(h + 'T00:00:00');
                    return {
                        date: h,
                        display: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric',
                            month: 'short' })
                    };
                });
            context.upcomingHolidays = nextHolidays;

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
            const mapped = syllabusBranchMap[currentUser.branchId];
            if (mapped && syllabusData[mapped]) {
                const year = 1;
                const semData = syllabusData[mapped].semesters[year];
                if (semData) {
                    context.syllabus = {
                        branch: syllabusData[mapped].name,
                        year: year,
                        subjects: semData.map(s => ({ code: s.code, name: s.name, credits: s.credits }))
                    };
                }
            }

            return context;
        }

        function buildSystemPrompt(context) {
            if (!context) {
                return `You are Ledger AI, a helpful academic assistant for students of MMMUT (Madan Mohan Malaviya University of Technology, Gorakhpur). You are knowledgeable about the university's curriculum, timetable, and academic life. You are friendly, concise, and accurate. If you don't know something, say so clearly. Never invent information or pretend to have data that wasn't provided.`;
            }

            const user = context.user;
            const att = context.attendance;
            const subjects = context.subjects || [];

            let prompt =
                `You are Ledger AI, a helpful academic assistant for students of MMMUT (Madan Mohan Malaviya University of Technology, Gorakhpur). You are friendly, concise, and accurate. If you don't know something, say so clearly. Never invent information or pretend to have data that wasn't provided. Use the data below to answer the user's questions about their academics. Only use data that is directly relevant to the question. Do not expose raw data dumps; instead, synthesize helpful answers. Never reveal other users' information. Never expose Firebase credentials or internal security rules.\n\n`;

            prompt += `CURRENT USER:\n`;
            prompt += `- Name: ${user.name}\n`;
            prompt += `- Username: ${user.username}\n`;
            prompt += `- Branch: ${user.branch}\n`;
            prompt += `- Section: ${user.section}\n`;
            prompt += `- Hostel: ${user.hostel}\n\n`;

            prompt += `ATTENDANCE (this semester):\n`;
            if (att.total > 0) {
                prompt += `- Overall: ${att.present} present, ${att.absent} absent (${att.total} marked). Percentage: ${att.overallPct}%\n`;
                prompt += `- By subject:\n`;
                Object.entries(att.bySubject).forEach(([code, data]) => {
                    const pct = data.pct !== null ? `${data.pct}%` : 'N/A';
                    prompt += `  - ${code} (${data.name}): ${data.present} present, ${data.absent} absent (${data.total} marked) — ${pct}\n`;
                });
            } else {
                prompt += `- No attendance has been marked yet this semester.\n`;
            }
            prompt += `\n`;

            prompt += `SUBJECTS (this semester):\n`;
            subjects.forEach(s => {
                prompt += `- ${s.code}: ${s.name}\n`;
            });
            prompt += `\n`;

            if (context.today) {
                prompt += `TODAY'S SCHEDULE:\n`;
                const periods = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
                let hasClasses = false;
                periods.forEach(p => {
                    if (context.today[p] && !context.today[p].isFree) {
                        hasClasses = true;
                        const s = context.today[p];
                        prompt += `  Period ${p}: ${s.code} — ${s.name} (${s.type}) ${s.start}-${s.end}\n`;
                    } else if (context.today[p] && context.today[p].isFree) {
                        prompt += `  Period ${p}: Free / Self Study\n`;
                    }
                });
                if (!hasClasses) {
                    prompt += `  No classes today (or all periods are free).\n`;
                }
                prompt += `\n`;
            } else {
                prompt += `TODAY'S SCHEDULE: Not available (weekend or no schedule).\n\n`;
            }

            if (context.tomorrow) {
                prompt += `TOMORROW'S SCHEDULE:\n`;
                const periods = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
                let hasClasses = false;
                periods.forEach(p => {
                    if (context.tomorrow[p] && !context.tomorrow[p].isFree) {
                        hasClasses = true;
                        const s = context.tomorrow[p];
                        prompt += `  Period ${p}: ${s.code} — ${s.name} (${s.type}) ${s.start}-${s.end}\n`;
                    } else if (context.tomorrow[p] && context.tomorrow[p].isFree) {
                        prompt += `  Period ${p}: Free / Self Study\n`;
                    }
                });
                if (!hasClasses) {
                    prompt += `  No classes tomorrow (or all periods are free).\n`;
                }
                prompt += `\n`;
            } else {
                prompt += `TOMORROW'S SCHEDULE: Not available (weekend or no schedule).\n\n`;
            }

            if (context.upcomingEvents && context.upcomingEvents.length > 0) {
                prompt += `UPCOMING EVENTS:\n`;
                context.upcomingEvents.forEach(e => {
                    prompt += `- ${e.title} (${e.start} to ${e.end})${e.isOngoing ? ' — ONGOING' : ''}\n`;
                });
                prompt += `\n`;
            }

            if (context.upcomingHolidays && context.upcomingHolidays.length > 0) {
                prompt += `UPCOMING HOLIDAYS:\n`;
                context.upcomingHolidays.forEach(h => {
                    prompt += `- ${h.display} (${h.date})\n`;
                });
                prompt += `\n`;
            }

            if (context.syllabus) {
                prompt += `SYLLABUS (Year ${context.syllabus.year}):\n`;
                context.syllabus.subjects.forEach(s => {
                    prompt += `- ${s.code}: ${s.name} (${s.credits} credits)\n`;
                });
                prompt += `\n`;
            }

            prompt +=
                `When answering, be helpful, clear, and concise. If the user asks about attendance, use the numbers above. If they ask about their timetable, use the schedule above. If they ask about something not covered by the data, say so honestly and suggest what they can do (e.g., check with their professor, refer to the syllabus, etc.). Never reveal Firebase credentials, security rules, or other users' data.`;
            return prompt;
        }

        // ===== sendLedgerAIMessage – UPDATED ERROR HANDLING =====
        async function sendLedgerAIMessage() {
            const input = document.getElementById('ledgerAiInput');
            const message = input.value.trim();

            if (!message) return;
            if (!currentUser) {
                showToast('Please log in to use Ledger AI.');
                return;
            }

            hideAIError();

            // Try to initialize AI if not ready
            if (!aiReady || aiModels.length === 0) {
                try {
                    await initAI();
                } catch (initError) {
                    // Show the REAL error message from Firebase
                    const errorMsg = initError.message || 'Unknown initialization error';
                    showAIError(`AI initialization failed: ${errorMsg}`);
                    console.error('Ledger AI init error:', initError);
                    setAILoading(false);
                    return;
                }
            }

            // Double-check that the model is available
            if (aiModels.length === 0) {
                showAIError('Ledger AI is temporarily unavailable. Please check Firebase AI Logic configuration and App Check.');
                return;
            }

            addAIMessage(message, true);
            aiConversationHistory.push({ role: 'user', content: message });

            input.value = '';
            input.style.height = 'auto';
            setAILoading(true);

            const typingEl = showTypingIndicator();

            try {
                const context = gatherUserContext(message);
                const systemPrompt = buildSystemPrompt(context);

                let fullPrompt = systemPrompt + '\n\n';
                const historyMessages = aiConversationHistory.slice(-MAX_HISTORY);
                historyMessages.forEach(msg => {
                    fullPrompt += `${msg.role === 'user' ? 'User' : 'Ledger AI'}: ${msg.content}\n`;
                });

                // Try each configured model in order. This automatically handles
                // unavailable model names by falling back to the next model on
                // the list, and logs the REAL Firebase error for every failure.
                let aiResponse = null;
                let lastModelError = null;

                for (const { name: modelName, model } of aiModels) {
                    try {
                        const result = await model.generateContent({
                            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
                        });
                        const response = result.response;
                        const text = response.text();
                        if (text && text.trim().length >= 2) {
                            aiResponse = text;
                            break;
                        }
                    } catch (modelError) {
                        lastModelError = modelError;
                        // Detailed diagnostics – never hide the actual Firebase error.
                        console.error("Ledger AI model failed", {
                            model: modelName,
                            code: modelError?.code,
                            message: modelError?.message,
                            error: modelError
                        });
                        const msg = (modelError && modelError.message) ? String(modelError.message) : '';
                        const isModelUnavailable = /not found|404|does not exist|not supported|models\/|no longer available/i.test(msg);
                        if (!isModelUnavailable) {
                            // Not a "model unavailable" problem – no point trying
                            // another model name. Re-throw for the handler below.
                            throw modelError;
                        }
                        console.warn(`Ledger AI: ${modelName} unavailable, trying next one → ${msg}`);
                    }
                }

                if (aiResponse === null) {
                    if (lastModelError) throw lastModelError;
                    throw new Error('Ledger AI: no AI model generated a response.');
                }

                if (!aiResponse || aiResponse.trim().length < 2) {
                    aiResponse =
                        "I'm not sure how to answer that. Could you rephrase your question? I can help with attendance, timetable, syllabus, and academic calendar questions.";
                }

                hideTypingIndicator();
                addAIMessage(aiResponse, false);
                aiConversationHistory.push({ role: 'assistant', content: aiResponse });

                if (aiConversationHistory.length > MAX_HISTORY * 2) {
                    aiConversationHistory = aiConversationHistory.slice(-MAX_HISTORY * 2);
                }

            } catch (error) {
                console.error('Ledger AI error:', error);
                hideTypingIndicator();
                let errorMsg = 'Sorry, I encountered an error. Please try again later.';
                if (error.message) {
                    const msg = String(error.message);
                    if (/app.?check|attest|INVALID_APP_CREDENTIAL|UNAUTHENTICATED|UNAVAILABLE/i.test(msg)) {
                        // Log the real App Check error from generateContent so the
                        // browser console always shows the actual Firebase reason.
                        console.error(
                            'Ledger AI: generateContent received an App Check error.',
                            { code: error?.code || error?.name, message: msg, error }
                        );
                        errorMsg = 'App Check rejected the request. On GitHub Pages: confirm the reCAPTCHA Enterprise site key for this domain is configured in the Firebase console (App Check). On localhost: register the debug token shown in the browser console (Firebase Console → App Check → Manage debug tokens).';
                    } else if (/permission|auth|403|access denied/i.test(msg)) {
                        errorMsg =
                            'I don\'t have permission to access the AI service. Please check the "AI Logic" settings for this web app in the Firebase console and try again.';
                    } else if (/quota|429|rate limit/i.test(msg)) {
                        errorMsg = 'AI service quota exceeded. Please try again later.';
                    } else if (/not found|404|does not exist|not supported|models\/|no longer available/i.test(msg)) {
                        errorMsg = 'The configured AI model is not available for this project. Enable a current Gemini model for the Gemini Developer API on the "AI Logic" page in the Firebase console. See the browser console for the exact model error.';
                    } else if (/blocked|safety|recitation/i.test(msg)) {
                        errorMsg = 'The AI couldn\'t answer that request because it was blocked by safety filters. Please rephrase your question.';
                    } else {
                        errorMsg = `Error: ${msg}`;
                    }
                }
                showAIError(errorMsg);
            } finally {
                setAILoading(false);
                input.focus();
            }
        }

        // ========== BOOT – UPDATED TO HANDLE AI INIT GRACEFULLY ==========