// ============================================================================
// SECTION: 25_ai_init.js
// Ledger AI (Gemini) model init
// Source: index.html lines 3878-3906 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        async function initAI() {
            if (aiReady) return;

            try {
                const ai = getAI(firebaseApp, {
                    backend: new GoogleAIBackend()
                });

                aiModels = AI_MODELS.map(modelName => ({
                    name: modelName,
                    model: getGenerativeModel(ai, {
                        model: modelName
                    })
                }));

                aiReady = true;
                console.log("Ledger AI: Firebase AI Logic initialized.");
            } catch (error) {
                aiReady = false;
                aiModels = [];

                console.error("Ledger AI initialization failed:", error);
                console.error("Code:", error?.code);
                console.error("Message:", error?.message);

                throw error;
            }
        }
