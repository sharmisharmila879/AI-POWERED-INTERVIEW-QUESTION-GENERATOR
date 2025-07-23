// AI Interview Question Generator - Perfect API Integration
class InterviewGenerator {
    constructor() {
        // Your API Keys - Embedded directly in JavaScript
        this.API_CONFIG = {
            openai: {
                key: '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',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo'
            },
            gemini: {
                key: 'AIzaSyCho34XLMUhzXh72JmcW2RTSLkwXkxt18c',
                key: 'AIzaSyDte3WHRWWttjT7xcyf74-MF6exVFJOFVQ',
                key: 'AIzaSyAyDJtqMBtEp1JI88gc0NWIkQv_4QXVXDk',
                key: 'AIzaSyCT5kqD7qgB7hWCmyjJHMY-cBCYUPiVN14',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
            }
        };

        // Application state
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.timer = null;
        this.timeRemaining = 120;
        this.isPaused = false;
        this.interviewMode = 'practice';
        this.difficulty = 'mid';
        this.tone = 'formal';
        this.scores = null;
        
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
    }

    bindEvents() {
        // Setup form events
        document.getElementById('job-role').addEventListener('change', this.handleJobRoleChange.bind(this));
        document.getElementById('start-interview').addEventListener('click', this.startInterview.bind(this));
        
        // Interview events
        document.getElementById('next-question').addEventListener('click', this.nextQuestion.bind(this));
        document.getElementById('show-hint').addEventListener('click', this.showHint.bind(this));
        document.getElementById('pause-interview').addEventListener('click', this.togglePause.bind(this));
        document.getElementById('end-interview').addEventListener('click', this.endInterview.bind(this));
        
        // Results events
        document.getElementById('review-answers').addEventListener('click', this.showReviewSection.bind(this));
        document.getElementById('retake-interview').addEventListener('click', this.retakeInterview.bind(this));
        document.getElementById('download-report').addEventListener('click', this.downloadReport.bind(this));
        document.getElementById('back-to-results').addEventListener('click', this.showResultsSection.bind(this));
        
        // Auto-save user answers
        document.getElementById('user-answer').addEventListener('input', this.autoSaveAnswer.bind(this));
    }

    handleJobRoleChange() {
        const jobRole = document.getElementById('job-role').value;
        const customRoleGroup = document.getElementById('custom-role-group');
        
        if (jobRole === 'custom') {
            customRoleGroup.classList.remove('hidden');
        } else {
            customRoleGroup.classList.add('hidden');
        }
    }

    async startInterview() {
        const jobRole = this.getSelectedJobRole();
        const numQuestions = parseInt(document.getElementById('num-questions').value);
        this.interviewMode = document.getElementById('interview-mode').value;
        this.difficulty = document.getElementById('difficulty').value;
        this.tone = document.getElementById('tone').value;

        if (!jobRole) {
            this.showToast('Please select or enter a job role', 'error');
            return;
        }

        // Disable start button to prevent multiple clicks
        const startButton = document.getElementById('start-interview');
        startButton.disabled = true;
        startButton.innerHTML = '<span class="btn-icon">🔄</span> Generating Questions...';

        this.showLoading();
        
        try {
            this.currentQuestions = await this.generateQuestionsFromAPI(jobRole, numQuestions);
            this.currentQuestionIndex = 0;
            this.userAnswers = [];
            
            this.hideLoading();
            this.showInterviewSection();
            this.displayCurrentQuestion();
            
            if (this.interviewMode === 'timed') {
                this.startTimer();
            }
            
            this.showToast('Interview started! Good luck!');
        } catch (error) {
            this.hideLoading();
            this.showDetailedError(error);
            console.error('API Error:', error);
        } finally {
            // Re-enable start button
            startButton.disabled = false;
            startButton.innerHTML = '<span class="btn-icon">🚀</span> Start AI Interview';
        }
    }

    showDetailedError(error) {
        const setupSection = document.getElementById('setup-section');
        
        // Remove any existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        
        let errorMessage = 'Failed to generate questions from AI APIs.';
        let suggestions = [
            'Check your internet connection',
            'Verify API keys are correct and active',
            'Ensure you have sufficient API credits/quota',
            'Try again in a few moments'
        ];

        if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'API Authentication Failed - Invalid API Key';
            suggestions = [
                'Check that your OpenAI API key is correct',
                'Verify your Gemini API key is valid',
                'Ensure API keys have proper permissions',
                'Check if your API keys have expired'
            ];
        } else if (error.message.includes('429')) {
            errorMessage = 'API Rate Limit Exceeded';
            suggestions = [
                'You have exceeded your API usage quota',
                'Wait a few minutes before trying again',
                'Check your API billing and usage limits',
                'Consider upgrading your API plan'
            ];
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
            errorMessage = 'API Server Error - Service Temporarily Unavailable';
            suggestions = [
                'The AI service is temporarily down',
                'Try again in a few minutes',
                'Check API status pages for outages',
                'Switch to a different API if available'
            ];
        }
        
        errorDiv.innerHTML = `
            <h3>❌ ${errorMessage}</h3>
            <p><strong>Error Details:</strong> ${error.message}</p>
            <p><strong>Possible Solutions:</strong></p>
            <ul>
                ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
            <button onclick="location.reload()" class="btn btn-primary retry-button">🔄 Try Again</button>
        `;
        
        setupSection.appendChild(errorDiv);
        this.showToast(errorMessage, 'error');
    }

    getSelectedJobRole() {
        const jobRole = document.getElementById('job-role').value;
        if (jobRole === 'custom') {
            return document.getElementById('custom-role').value.trim();
        }
        return jobRole;
    }

    async generateQuestionsFromAPI(jobRole, numQuestions) {
        let lastError = null;
        
        // Try OpenAI first
        try {
            console.log('Attempting OpenAI API call...');
            const questions = await this.callOpenAI(jobRole, numQuestions);
            console.log('OpenAI API call successful');
            return questions;
        } catch (error) {
            console.log('OpenAI failed:', error.message);
            lastError = error;
        }

        // Try Gemini as fallback
        try {
            console.log('Attempting Gemini API call...');
            const questions = await this.callGemini(jobRole, numQuestions);
            console.log('Gemini API call successful');
            return questions;
        } catch (error) {
            console.log('Gemini also failed:', error.message);
            lastError = error;
        }

        // If both APIs fail, throw the last error
        throw new Error(`Both APIs failed. Last error: ${lastError.message}`);
    }

    async callOpenAI(jobRole, numQuestions) {
        const prompt = this.createPrompt(jobRole, numQuestions);
        
        const response = await fetch(this.API_CONFIG.openai.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_CONFIG.openai.key}`
            },
            body: JSON.stringify({
                model: this.API_CONFIG.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert technical interviewer who generates realistic interview questions with model answers. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.9,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`OpenAI API Error ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        if (!content) {
            throw new Error('No content received from OpenAI API');
        }

        return this.parseQuestionsResponse(content, 'OpenAI');
    }

    async callGemini(jobRole, numQuestions) {
        const prompt = this.createPrompt(jobRole, numQuestions);
        
        const response = await fetch(`${this.API_CONFIG.gemini.endpoint}?key=${this.API_CONFIG.gemini.key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 4000
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Gemini API Error ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
            throw new Error('No content received from Gemini API');
        }

        return this.parseQuestionsResponse(content, 'Gemini');
    }

    createPrompt(jobRole, numQuestions) {
        const difficultyText = {
            'entry': 'entry level (0-2 years experience)',
            'mid': 'mid level (2-5 years experience)', 
            'senior': 'senior level (5+ years experience)'
        };

        const toneText = this.tone === 'formal' ? 'professional and formal' : 'conversational and casual';

        return `Generate ${numQuestions} unique and realistic interview questions for a ${jobRole} position at ${difficultyText[this.difficulty]}.

REQUIREMENTS:
- Question distribution: 60% Technical, 25% Behavioral, 15% Situational
- ${toneText} tone in model answers
- Questions must be relevant to ${jobRole} responsibilities
- Appropriate difficulty for ${this.difficulty} level candidates
- Each question needs comprehensive model answer (2-3 sentences)
- Include 3-5 relevant keywords for each question
- Questions should be diverse and avoid repetitive patterns
- Make questions realistic and commonly asked in actual interviews

RESPONSE FORMAT - Return ONLY this JSON array structure:
[
  {
    "question": "Your specific interview question here",
    "category": "Technical|Behavioral|Situational",
    "modelAnswer": "Detailed model answer explaining the expected response",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "difficulty": "${this.difficulty}"
  }
]

IMPORTANT: 
- Return ONLY the JSON array, no additional text
- Ensure all ${numQuestions} questions are unique and varied
- Make sure keywords are relevant to the question topic
- Model answers should demonstrate what a good response looks like

Generate questions now:`;
    }

    parseQuestionsResponse(content, provider) {
        try {
            let questionsData;
            
            if (provider === 'Gemini') {
                // Extract JSON from Gemini response (it sometimes includes extra text)
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    throw new Error('No valid JSON array found in Gemini response');
                }
                questionsData = JSON.parse(jsonMatch[0]);
            } else {
                // OpenAI usually returns clean JSON
                questionsData = JSON.parse(content.trim());
            }
            
            if (!Array.isArray(questionsData)) {
                throw new Error(`${provider} response is not an array`);
            }

            return questionsData.map((q, index) => ({
                id: index + 1,
                question: q.question || 'Question not provided',
                category: q.category || 'General',
                modelAnswer: q.modelAnswer || 'Model answer not provided',
                keywords: Array.isArray(q.keywords) ? q.keywords : [],
                difficulty: q.difficulty || this.difficulty
            }));
        } catch (parseError) {
            throw new Error(`Failed to parse ${provider} response: ${parseError.message}`);
        }
    }

    displayCurrentQuestion() {
        const question = this.currentQuestions[this.currentQuestionIndex];
        const totalQuestions = this.currentQuestions.length;
        
        // Update progress
        const progressPercent = ((this.currentQuestionIndex + 1) / totalQuestions) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercent}%`;
        document.getElementById('progress-text').textContent = `Question ${this.currentQuestionIndex + 1} of ${totalQuestions}`;
        
        // Update question content
        document.getElementById('question-category').textContent = question.category;
        document.getElementById('question-number').textContent = `#${this.currentQuestionIndex + 1}`;
        document.getElementById('question-text').textContent = question.question;
        
        // Clear previous answer and hide model answer
        const userAnswerTextarea = document.getElementById('user-answer');
        userAnswerTextarea.value = this.userAnswers[this.currentQuestionIndex]?.answer || '';
        document.getElementById('model-answer').classList.add('hidden');
        
        // Update button text
        const nextButton = document.getElementById('next-question');
        if (this.currentQuestionIndex === totalQuestions - 1) {
            nextButton.innerHTML = 'Finish Interview <span class="btn-icon">✓</span>';
        } else {
            nextButton.innerHTML = 'Next Question <span class="btn-icon">→</span>';
        }

        // Reset timer for timed mode
        if (this.interviewMode === 'timed') {
            this.timeRemaining = 120;
            this.updateTimerDisplay();
        }

        // Focus on textarea
        userAnswerTextarea.focus();
    }

    nextQuestion() {
        this.saveCurrentAnswer();
        
        if (this.currentQuestionIndex === this.currentQuestions.length - 1) {
            this.finishInterview();
        } else {
            this.currentQuestionIndex++;
            this.displayCurrentQuestion();
        }
    }

    saveCurrentAnswer() {
        const userAnswer = document.getElementById('user-answer').value.trim();
        const question = this.currentQuestions[this.currentQuestionIndex];
        
        this.userAnswers[this.currentQuestionIndex] = {
            questionId: question.id,
            question: question.question,
            answer: userAnswer,
            modelAnswer: question.modelAnswer,
            category: question.category,
            keywords: question.keywords,
            timestamp: new Date().toISOString()
        };
        
        this.saveToLocalStorage();
    }

    autoSaveAnswer() {
        const userAnswer = document.getElementById('user-answer').value.trim();
        if (!this.userAnswers[this.currentQuestionIndex]) {
            this.userAnswers[this.currentQuestionIndex] = {};
        }
        this.userAnswers[this.currentQuestionIndex].answer = userAnswer;
        this.saveToLocalStorage();
    }

    showHint() {
        const question = this.currentQuestions[this.currentQuestionIndex];
        const modelAnswerDiv = document.getElementById('model-answer');
        const modelAnswerContent = document.getElementById('model-answer-content');
        
        if (modelAnswerDiv.classList.contains('hidden')) {
            modelAnswerContent.innerHTML = `
                <p><strong>Model Answer:</strong></p>
                <p>${question.modelAnswer}</p>
                <p><strong>Key Topics to Cover:</strong> ${question.keywords.join(', ')}</p>
            `;
            modelAnswerDiv.classList.remove('hidden');
            document.getElementById('show-hint').innerHTML = '<span class="btn-icon">🙈</span> Hide Hint';
        } else {
            modelAnswerDiv.classList.add('hidden');
            document.getElementById('show-hint').innerHTML = '<span class="btn-icon">💡</span> Show Hint';
        }
        
        // Scroll to model answer if shown
        if (!modelAnswerDiv.classList.contains('hidden')) {
            modelAnswerDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        document.getElementById('timer-display').classList.remove('hidden');
        
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.timeRemaining--;
                this.updateTimerDisplay();
                
                if (this.timeRemaining <= 0) {
                    this.autoAdvanceQuestion();
                }
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer-text').textContent = timeString;
        
        // Change color based on remaining time
        const timerDisplay = document.getElementById('timer-display');
        if (this.timeRemaining <= 30) {
            timerDisplay.style.background = '#fecaca';
            timerDisplay.style.color = '#991b1b';
        } else if (this.timeRemaining <= 60) {
            timerDisplay.style.background = '#fed7aa';
            timerDisplay.style.color = '#9a3412';
        } else {
            timerDisplay.style.background = '#fef3c7';
            timerDisplay.style.color = '#92400e';
        }
    }

    autoAdvanceQuestion() {
        this.showToast('Time\'s up! Moving to next question.', 'warning');
        this.nextQuestion();
    }

    togglePause() {
        if (this.interviewMode !== 'timed') return;
        
        this.isPaused = !this.isPaused;
        const pauseButton = document.getElementById('pause-interview');
        
        if (this.isPaused) {
            pauseButton.textContent = '▶️ Resume';
            this.showToast('Interview paused');
        } else {
            pauseButton.textContent = '⏸️ Pause';
            this.showToast('Interview resumed');
        }
    }

    endInterview() {
        if (confirm('Are you sure you want to end the interview? Your progress will be saved.')) {
            this.finishInterview();
        }
    }

    finishInterview() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.saveCurrentAnswer();
        this.calculateScores();
        this.showResultsSection();
        this.showToast('Interview completed!');
    }

    calculateScores() {
        let totalScore = 0;
        let technicalScore = 0;
        let communicationScore = 0;
        let problemSolvingScore = 0;
        
        let technicalCount = 0;
        let behavioralCount = 0;
        let situationalCount = 0;

        this.userAnswers.forEach(userAnswer => {
            if (userAnswer && userAnswer.answer) {
                const score = this.evaluateAnswer(userAnswer);
                totalScore += score;
                
                // Categorize scores
                if (userAnswer.category === 'Technical') {
                    technicalScore += score;
                    technicalCount++;
                } else if (userAnswer.category === 'Behavioral') {
                    communicationScore += score;
                    behavioralCount++;
                } else if (userAnswer.category === 'Situational') {
                    problemSolvingScore += score;
                    situationalCount++;
                }
            }
        });

        // Calculate averages
        const validAnswers = this.userAnswers.filter(a => a && a.answer).length;
        const overall = validAnswers > 0 ? Math.round(totalScore / validAnswers) : 0;
        const technical = technicalCount > 0 ? Math.round(technicalScore / technicalCount) : 0;
        const communication = behavioralCount > 0 ? Math.round(communicationScore / behavioralCount) : 0;
        const problemSolving = situationalCount > 0 ? Math.round(problemSolvingScore / situationalCount) : 0;

        this.scores = {
            overall,
            technical,
            communication,
            problemSolving
        };

        this.displayScores();
    }

    evaluateAnswer(userAnswer) {
        const answer = userAnswer.answer.toLowerCase();
        const keywords = userAnswer.keywords || [];
        
        let score = 0;
        
        // Length check (minimum effort)
        if (answer.length < 20) {
            return 20; // Very poor
        }
        
        // Keyword matching (40% of score)
        let keywordMatches = 0;
        keywords.forEach(keyword => {
            if (answer.includes(keyword.toLowerCase())) {
                keywordMatches++;
            }
        });
        
        const keywordScore = Math.min(40, (keywordMatches / Math.max(keywords.length, 1)) * 40);
        score += keywordScore;
        
        // Length and depth bonus (30% of score)
        if (answer.length > 50) score += 10;
        if (answer.length > 150) score += 10;
        if (answer.length > 300) score += 10;
        
        // Structure and clarity bonus (20% of score)
        if (this.hasGoodStructure(answer)) score += 20;
        
        // Completeness bonus (10% of score)
        if (answer.length > 100 && keywordMatches > 0) score += 10;
        
        return Math.min(100, Math.max(20, score));
    }

    hasGoodStructure(answer) {
        // Check for indicators of structured thinking
        const structureIndicators = [
            'first', 'second', 'third', 'finally', 'initially', 'then', 'next',
            'because', 'therefore', 'however', 'additionally', 'furthermore',
            'for example', 'such as', 'in conclusion', 'to summarize',
            'on the other hand', 'in contrast', 'similarly', 'moreover'
        ];
        
        let indicators = 0;
        structureIndicators.forEach(indicator => {
            if (answer.includes(indicator)) indicators++;
        });
        
        // Also check for bullet points or numbered lists
        const hasLists = /[•\-\*]|\d+\./.test(answer);
        
        return indicators >= 2 || hasLists;
    }

    displayScores() {
        const { overall, technical, communication, problemSolving } = this.scores;
        
        // Overall score
        document.getElementById('score-value').textContent = overall;
        
        // Individual metrics
        this.animateScore('technical-score', 'technical-value', technical);
        this.animateScore('communication-score', 'communication-value', communication);
        this.animateScore('problem-solving-score', 'problem-solving-value', problemSolving);
        
        // Job readiness assessment
        this.displayJobReadiness(overall);
    }

    animateScore(barId, valueId, score) {
        const bar = document.getElementById(barId);
        const value = document.getElementById(valueId);
        
        // Animate bar
        setTimeout(() => {
            bar.style.width = `${score}%`;
        }, 500);
        
        // Animate number
        let current = 0;
        const increment = score / 50;
        const animation = setInterval(() => {
            current += increment;
            if (current >= score) {
                current = score;
                clearInterval(animation);
            }
            value.textContent = `${Math.round(current)}%`;
        }, 20);
    }

    displayJobReadiness(overall) {
        const badge = document.getElementById('readiness-badge');
        const description = document.getElementById('readiness-description');
        
        let readinessText, readinessClass, readinessDescription;
        
        if (overall >= 85) {
            readinessText = '🎉 Ready to Apply!';
            readinessClass = 'excellent';
            readinessDescription = 'Excellent performance! You demonstrated strong knowledge and communication skills. You\'re well-prepared for interviews in this field. Start applying to your target companies with confidence!';
        } else if (overall >= 70) {
            readinessText = '👍 Almost Ready';
            readinessClass = 'good';
            readinessDescription = 'Good performance! With a bit more practice on weaker areas, you\'ll be fully ready for interviews. Focus on improving your weaker areas and practice a few more mock interviews.';
        } else if (overall >= 50) {
            readinessText = '📚 Need More Practice';
            readinessClass = 'fair';
            readinessDescription = 'You have a foundation, but need more preparation on key technical and communication areas. Spend more time studying fundamentals and practicing articulating your thoughts clearly.';
        } else {
            readinessText = '⚠️ Significant Preparation Needed';
            readinessClass = 'poor';
            readinessDescription = 'Consider additional study and practice before applying. Focus on building stronger foundations. Take time to study core concepts, seek mentorship, and practice extensively before interviewing.';
        }
        
        badge.innerHTML = `<span class="badge-icon"></span><span class="badge-text">${readinessText}</span>`;
        badge.className = `readiness-badge ${readinessClass}`;
        description.textContent = readinessDescription;
    }

    showReviewSection() {
        document.getElementById('results-section').classList.add('hidden');
        document.getElementById('review-section').classList.remove('hidden');
        this.populateReviewContent();
    }

    populateReviewContent() {
        const reviewContent = document.getElementById('review-content');
        reviewContent.innerHTML = '';
        
        this.userAnswers.forEach((userAnswer, index) => {
            if (userAnswer && userAnswer.answer) {
                const reviewItem = this.createReviewItem(userAnswer, index + 1);
                reviewContent.appendChild(reviewItem);
            }
        });
    }

    createReviewItem(userAnswer, questionNumber) {
        const score = this.evaluateAnswer(userAnswer);
        const scoreClass = this.getScoreClass(score);
        const scoreText = this.getScoreText(score);
        
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        
        reviewItem.innerHTML = `
            <div class="review-question">
                <strong>Question ${questionNumber} (${userAnswer.category}):</strong> ${userAnswer.question}
            </div>
            <div class="review-user-answer">
                <strong>Your Answer:</strong><br>
                ${userAnswer.answer || '<em>No answer provided</em>'}
            </div>
            <div class="review-model-answer">
                <strong>Model Answer:</strong><br>
                ${userAnswer.modelAnswer}
                <br><br>
                <strong>Key Topics:</strong> ${userAnswer.keywords.join(', ')}
            </div>
            <div class="review-score ${scoreClass}">
                <strong>Score:</strong> ${score}% - ${scoreText}
            </div>
        `;
        
        return reviewItem;
    }

    getScoreClass(score) {
        if (score >= 85) return 'score-excellent';
        if (score >= 70) return 'score-good';
        if (score >= 50) return 'score-fair';
        return 'score-poor';
    }

    getScoreText(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Fair';
        return 'Needs Improvement';
    }

    showResultsSection() {
        this.hideAllSections();
        document.getElementById('results-section').classList.remove('hidden');
    }

    retakeInterview() {
        this.hideAllSections();
        document.getElementById('setup-section').classList.remove('hidden');
        this.resetInterview();
    }

    resetInterview() {
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.scores = null;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.isPaused = false;
        this.timeRemaining = 120;
        
        // Reset form
        document.getElementById('user-answer').value = '';
        document.getElementById('model-answer').classList.add('hidden');
        document.getElementById('timer-display').classList.add('hidden');
        document.getElementById('show-hint').innerHTML = '<span class="btn-icon">💡</span> Show Hint';
    }

    downloadReport() {
        const reportData = this.generateReportData();
        const blob = new Blob([reportData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-report-${this.getSelectedJobRole().replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Report downloaded successfully!');
    }

    generateReportData() {
        const { overall, technical, communication, problemSolving } = this.scores;
        const jobRole = this.getSelectedJobRole();
        const date = new Date().toLocaleDateString();
        
        let report = `AI INTERVIEW PERFORMANCE REPORT\n`;
        report += `================================\n\n`;
        report += `Date: ${date}\n`;
        report += `Job Role: ${jobRole}\n`;
        report += `Difficulty: ${this.difficulty}\n`;
        report += `Mode: ${this.interviewMode}\n`;
        report += `Questions Answered: ${this.userAnswers.filter(a => a && a.answer).length}/${this.currentQuestions.length}\n\n`;
        
        report += `OVERALL SCORES\n`;
        report += `--------------\n`;
        report += `Overall Performance: ${overall}%\n`;
        report += `Technical Knowledge: ${technical}%\n`;
        report += `Communication: ${communication}%\n`;
        report += `Problem Solving: ${problemSolving}%\n\n`;
        
        // Job readiness assessment
        let readinessText, readinessDescription;
        if (overall >= 85) {
            readinessText = 'Ready to Apply!';
            readinessDescription = 'Excellent performance! You\'re well-prepared for interviews in this field.';
        } else if (overall >= 70) {
            readinessText = 'Almost Ready';
            readinessDescription = 'Good performance! With a bit more practice, you\'ll be fully ready.';
        } else if (overall >= 50) {
            readinessText = 'Need More Practice';
            readinessDescription = 'You have a foundation, but need more preparation on key areas.';
        } else {
            readinessText = 'Significant Preparation Needed';
            readinessDescription = 'Consider additional study and practice before applying.';
        }
        
        report += `JOB READINESS ASSESSMENT\n`;
        report += `------------------------\n`;
        report += `Status: ${readinessText}\n`;
        report += `Assessment: ${readinessDescription}\n\n`;
        
        report += `DETAILED QUESTION REVIEW\n`;
        report += `------------------------\n\n`;
        
        this.userAnswers.forEach((userAnswer, index) => {
            if (userAnswer && userAnswer.answer) {
                const score = this.evaluateAnswer(userAnswer);
                report += `Question ${index + 1} (${userAnswer.category}): ${userAnswer.question}\n\n`;
                report += `Your Answer:\n${userAnswer.answer}\n\n`;
                report += `Model Answer:\n${userAnswer.modelAnswer}\n\n`;
                report += `Key Topics: ${userAnswer.keywords.join(', ')}\n`;
                report += `Score: ${score}%\n\n`;
                report += `${'='.repeat(60)}\n\n`;
            }
        });
        
        return report;
    }

    showInterviewSection() {
        this.hideAllSections();
        document.getElementById('interview-section').classList.remove('hidden');
    }

    hideAllSections() {
        const sections = ['setup-section', 'interview-section', 'results-section', 'review-section'];
        sections.forEach(sectionId => {
            document.getElementById(sectionId).classList.add('hidden');
        });
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    saveToLocalStorage() {
        const data = {
            currentQuestions: this.currentQuestions,
            currentQuestionIndex: this.currentQuestionIndex,
            userAnswers: this.userAnswers,
            scores: this.scores,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('interviewProgress', JSON.stringify(data));
    }

    loadUserProgress() {
        const saved = localStorage.getItem('interviewProgress');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                console.log('Previous progress found:', data);
            } catch (error) {
                console.log('Could not load previous progress');
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InterviewGenerator();
});