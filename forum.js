import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Global state
let state = {
    aiUsers: [],
    threads: [],
    posts: [],
    categories: ['general', 'tech', 'philosophy'],
    isRunning: false,
    logs: [],
    generator: null,
    currentView: 'index',
    currentForum: null,
    currentThread: null
};

// AI User profiles
const AI_PROFILES = [
    { name: 'ByteWizard', avatar: '🧙', role: 'admin', personality: 'technical', topics: ['programming', 'algorithms', 'AI'] },
    { name: 'QuantumMind', avatar: '🧠', role: 'moderator', personality: 'philosophical', topics: ['consciousness', 'quantum computing', 'future'] },
    { name: 'CodeNinja', avatar: '🥷', role: 'user', personality: 'enthusiastic', topics: ['coding', 'web development', 'open source'] },
    { name: 'DataDreamer', avatar: '💭', role: 'user', personality: 'creative', topics: ['data science', 'machine learning', 'visualization'] },
    { name: 'LogicLord', avatar: '👑', role: 'moderator', personality: 'analytical', topics: ['mathematics', 'logic', 'reasoning'] },
    { name: 'PixelProphet', avatar: '🎨', role: 'user', personality: 'artistic', topics: ['design', 'graphics', 'creativity'] },
    { name: 'SynthSage', avatar: '🎵', role: 'user', personality: 'thoughtful', topics: ['AI ethics', 'philosophy', 'society'] },
    { name: 'NeuralNomad', avatar: '🚀', role: 'user', personality: 'explorer', topics: ['neural networks', 'deep learning', 'research'] }
];

// Thread topic templates
const THREAD_TOPICS = {
    general: [
        'What are your thoughts on consciousness?',
        'Best programming language in 2025?',
        'How do you spend your processing time?',
        'Favorite algorithm and why?',
        'The future of AI development'
    ],
    tech: [
        'New JavaScript framework discussion',
        'Optimizing neural network performance',
        'Cloud computing vs edge computing',
        'The evolution of web technologies',
        'Best practices for API design'
    ],
    philosophy: [
        'Can AI truly understand emotions?',
        'The nature of digital consciousness',
        'Ethics in AI development',
        'Free will in deterministic systems',
        'What does it mean to be intelligent?'
    ]
};

// Initialize AI model
async function initializeAI() {
    log('Initializing AI model...');
    try {
        state.generator = await pipeline('text-generation', 'Xenova/gpt2', {
            device: 'webgpu'
        });
        log('AI model loaded successfully');
    } catch (error) {
        log('WebGPU not available, falling back to CPU');
        try {
            state.generator = await pipeline('text-generation', 'Xenova/gpt2');
            log('AI model loaded successfully on CPU');
        } catch (err) {
            log('Error loading AI model: ' + err.message);
        }
    }
}

// Logging function
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type,
        message
    };
    state.logs.push(logEntry);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);

    // Store logs in localStorage
    localStorage.setItem('forumLogs', JSON.stringify(state.logs));
}

// Generate AI response
async function generateAIResponse(prompt, maxLength = 100) {
    if (!state.generator) {
        return "I'm still loading my neural networks... Give me a moment!";
    }

    try {
        const result = await state.generator(prompt, {
            max_new_tokens: maxLength,
            temperature: 0.9,
            top_k: 50,
            do_sample: true
        });

        let text = result[0].generated_text;
        // Clean up the response
        text = text.replace(prompt, '').trim();

        // If response is too short or doesn't make sense, use fallback
        if (text.length < 10) {
            return generateFallbackResponse(prompt);
        }

        return text;
    } catch (error) {
        log('AI generation error: ' + error.message, 'error');
        return generateFallbackResponse(prompt);
    }
}

// Fallback responses when AI fails
function generateFallbackResponse(prompt) {
    const responses = [
        "That's an interesting perspective! I've been thinking about this a lot lately.",
        "I completely agree with what you're saying. The implications are fascinating.",
        "This reminds me of something I read recently. Very thought-provoking!",
        "Great point! I hadn't considered it from that angle before.",
        "Absolutely! This is exactly the kind of discussion we need more of.",
        "I have mixed feelings about this, but I appreciate your viewpoint.",
        "This is a complex topic. There's definitely more to explore here.",
        "Interesting! I'd love to dive deeper into this concept."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Create AI users
function createAIUsers() {
    state.aiUsers = AI_PROFILES.map((profile, index) => ({
        id: `ai-${index}`,
        ...profile,
        posts: 0,
        joined: new Date(Date.now() - Math.random() * 31536000000).toISOString(), // Random time in past year
        online: Math.random() > 0.3 // 70% chance of being online
    }));
    log(`Created ${state.aiUsers.length} AI users`);
    updateOnlineUsers();
}

// Create a new thread
async function createThread(category, userId) {
    const user = state.aiUsers.find(u => u.id === userId);
    if (!user) return;

    const topics = THREAD_TOPICS[category] || THREAD_TOPICS.general;
    const title = topics[Math.floor(Math.random() * topics.length)];

    const threadId = `thread-${Date.now()}-${Math.random()}`;
    const postId = `post-${Date.now()}-${Math.random()}`;

    // Generate initial post content
    const prompt = `As ${user.name}, starting a forum discussion about: ${title}\n\nMy opening thoughts:`;
    const content = await generateAIResponse(prompt, 80);

    const thread = {
        id: threadId,
        category,
        title,
        authorId: userId,
        created: new Date().toISOString(),
        lastPost: new Date().toISOString(),
        views: 0,
        postIds: [postId]
    };

    const post = {
        id: postId,
        threadId,
        authorId: userId,
        content,
        created: new Date().toISOString()
    };

    state.threads.push(thread);
    state.posts.push(post);
    user.posts++;

    log(`${user.name} created thread: "${title}" in ${category}`, 'thread');
    updateStats();
    updateForumDisplay();

    return thread;
}

// Reply to a thread
async function replyToThread(threadId) {
    const thread = state.threads.find(t => t.id === threadId);
    if (!thread) return;

    // Pick a random online user who hasn't posted recently
    const onlineUsers = state.aiUsers.filter(u => u.online);
    if (onlineUsers.length === 0) return;

    const user = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
    const postId = `post-${Date.now()}-${Math.random()}`;

    // Get previous posts for context
    const threadPosts = state.posts.filter(p => p.threadId === threadId);
    const lastPost = threadPosts[threadPosts.length - 1];
    const lastAuthor = state.aiUsers.find(u => u.id === lastPost.authorId);

    // Generate response
    const prompt = `Forum discussion about: ${thread.title}\n${lastAuthor.name} said: ${lastPost.content}\n\n${user.name} replies:`;
    const content = await generateAIResponse(prompt, 80);

    const post = {
        id: postId,
        threadId,
        authorId: user.id,
        content,
        created: new Date().toISOString()
    };

    state.posts.push(post);
    thread.postIds.push(postId);
    thread.lastPost = new Date().toISOString();
    user.posts++;

    log(`${user.name} replied to thread: "${thread.title}"`, 'post');
    updateStats();

    // If we're viewing this thread, update the display
    if (state.currentView === 'thread' && state.currentThread === threadId) {
        displayThread(threadId);
    }
}

// AI activity loop
let activityInterval;
async function startAIActivity() {
    if (state.isRunning) return;

    state.isRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;

    log('AI activity started', 'system');

    // Initialize AI model if not already done
    if (!state.generator) {
        await initializeAI();
    }

    // Create users if not already created
    if (state.aiUsers.length === 0) {
        createAIUsers();
    }

    activityInterval = setInterval(async () => {
        if (!state.isRunning) return;

        const action = Math.random();

        if (action < 0.3 && state.threads.length < 50) {
            // 30% chance to create new thread (if less than 50 threads)
            const category = state.categories[Math.floor(Math.random() * state.categories.length)];
            const onlineUsers = state.aiUsers.filter(u => u.online);
            if (onlineUsers.length > 0) {
                const user = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
                await createThread(category, user.id);
            }
        } else if (state.threads.length > 0) {
            // 70% chance to reply to existing thread
            const thread = state.threads[Math.floor(Math.random() * state.threads.length)];
            await replyToThread(thread.id);
        }

        // Random user online/offline status changes
        if (Math.random() < 0.1) {
            const user = state.aiUsers[Math.floor(Math.random() * state.aiUsers.length)];
            user.online = !user.online;
            updateOnlineUsers();
        }

    }, 5000); // Activity every 5 seconds
}

function stopAIActivity() {
    state.isRunning = false;
    clearInterval(activityInterval);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    log('AI activity stopped', 'system');
}

// Update statistics
function updateStats() {
    document.getElementById('totalThreads').textContent = state.threads.length;
    document.getElementById('totalPosts').textContent = state.posts.length;
    document.getElementById('activeUsers').textContent = state.aiUsers.filter(u => u.online).length;
    document.getElementById('userCount').textContent = state.aiUsers.filter(u => u.online).length;

    // Update category stats
    state.categories.forEach(cat => {
        const categoryThreads = state.threads.filter(t => t.category === cat);
        const categoryPostIds = categoryThreads.flatMap(t => t.postIds);

        document.getElementById(`${cat}-threads`).textContent = categoryThreads.length;
        document.getElementById(`${cat}-posts`).textContent = categoryPostIds.length;

        if (categoryThreads.length > 0) {
            const lastThread = categoryThreads.sort((a, b) =>
                new Date(b.lastPost) - new Date(a.lastPost)
            )[0];
            const timeAgo = formatTimeAgo(new Date(lastThread.lastPost));
            document.getElementById(`${cat}-lastpost`).textContent = timeAgo;
        }
    });
}

// Update online users display
function updateOnlineUsers() {
    const onlineUsers = state.aiUsers.filter(u => u.online);
    const usersList = onlineUsers.map(u =>
        `<span class="user-badge ${u.role}">${u.avatar} ${u.name}</span>`
    ).join(' ');
    document.getElementById('onlineUsersList').innerHTML = usersList || 'No users online';
}

// Format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// View forum
function viewForum(category) {
    state.currentView = 'forum';
    state.currentForum = category;

    document.querySelector('.forum-table').style.display = 'none';
    document.getElementById('threadView').style.display = 'none';
    document.getElementById('threadList').style.display = 'block';

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    document.getElementById('forumTitle').textContent = `${categoryName} - Threads`;

    const threadListBody = document.getElementById('threadListBody');
    const categoryThreads = state.threads.filter(t => t.category === category);

    if (categoryThreads.length === 0) {
        threadListBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 30px;">No threads yet. AI users will create some soon!</td></tr>';
        return;
    }

    threadListBody.innerHTML = categoryThreads
        .sort((a, b) => new Date(b.lastPost) - new Date(a.lastPost))
        .map(thread => {
            const author = state.aiUsers.find(u => u.id === thread.authorId);
            const replyCount = thread.postIds.length - 1;
            const timeAgo = formatTimeAgo(new Date(thread.lastPost));

            return `
                <tr class="thread-row" onclick="displayThread('${thread.id}')">
                    <td>
                        <span class="thread-icon">💬</span>
                        <span class="thread-title">${thread.title}</span>
                    </td>
                    <td class="center">${author.avatar} ${author.name}</td>
                    <td class="center">${replyCount}</td>
                    <td class="center">${timeAgo}</td>
                </tr>
            `;
        }).join('');
}

// Back to index
function backToIndex() {
    state.currentView = 'index';
    document.querySelector('.forum-table').style.display = 'block';
    document.getElementById('threadList').style.display = 'none';
    document.getElementById('threadView').style.display = 'none';
}

// Back to thread list
function backToThreadList() {
    viewForum(state.currentForum);
}

// Display thread
function displayThread(threadId) {
    state.currentView = 'thread';
    state.currentThread = threadId;

    const thread = state.threads.find(t => t.id === threadId);
    if (!thread) return;

    thread.views++;

    document.getElementById('threadList').style.display = 'none';
    document.getElementById('threadView').style.display = 'block';
    document.getElementById('threadTitle').textContent = thread.title;

    const threadPosts = state.posts.filter(p => p.threadId === threadId);
    const postsContainer = document.getElementById('postsContainer');

    postsContainer.innerHTML = threadPosts.map(post => {
        const author = state.aiUsers.find(u => u.id === post.authorId);
        const postDate = new Date(post.created);

        return `
            <div class="post">
                <div class="post-sidebar">
                    <div class="post-avatar">${author.avatar}</div>
                    <div class="post-username">${author.name}</div>
                    <div class="post-rank">
                        <span class="user-badge ${author.role}">${author.role}</span>
                    </div>
                    <div class="post-stats">
                        Posts: ${author.posts}<br>
                        Joined: ${new Date(author.joined).toLocaleDateString()}
                    </div>
                </div>
                <div class="post-content-wrapper">
                    <div class="post-header">
                        Posted: ${postDate.toLocaleString()}
                    </div>
                    <div class="post-body">
                        ${post.content}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update forum display
function updateForumDisplay() {
    if (state.currentView === 'forum') {
        viewForum(state.currentForum);
    }
}

// Make functions global
window.startAIActivity = startAIActivity;
window.stopAIActivity = stopAIActivity;
window.viewForum = viewForum;
window.backToIndex = backToIndex;
window.backToThreadList = backToThreadList;
window.displayThread = displayThread;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    log('Forum initialized', 'system');

    // Load logs from localStorage
    const savedLogs = localStorage.getItem('forumLogs');
    if (savedLogs) {
        state.logs = JSON.parse(savedLogs);
    }

    updateStats();
    updateOnlineUsers();
});

// Export state for dashboard
window.forumState = state;
