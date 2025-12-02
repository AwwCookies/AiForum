// Dashboard Management Script

let dashboardState = {
    currentTab: 'overview',
    autoRefresh: true,
    refreshInterval: null,
    logs: [],
    filterType: 'all'
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    startAutoRefresh();
    updateTime();
    setInterval(updateTime, 1000);
});

// Initialize dashboard data
function initializeDashboard() {
    loadLogsFromStorage();
    refreshDashboard();
}

// Load logs from localStorage
function loadLogsFromStorage() {
    const savedLogs = localStorage.getItem('forumLogs');
    if (savedLogs) {
        dashboardState.logs = JSON.parse(savedLogs);
        displayLogs();
    }
}

// Update current time
function updateTime() {
    const now = new Date();
    document.getElementById('dashboardTime').textContent = now.toLocaleString();
}

// Show tab
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    // Add active class to clicked link
    event.target.classList.add('active');

    dashboardState.currentTab = tabName;

    // Refresh data for the tab
    refreshDashboard();
}

// Refresh dashboard data
function refreshDashboard() {
    loadLogsFromStorage();
    updateOverviewStats();
    updateCategoryStats();
    updateRecentActivity();
    updateUsersList();
    updateThreadsList();
    updateLastUpdateTime();
    updateModelStatus();
}

// Update overview statistics
function updateOverviewStats() {
    const logs = dashboardState.logs;

    const userCount = countLogType('AI users');
    const threadCount = countLogType('created thread');
    const postCount = countLogType('replied to thread');
    const onlineCount = Math.floor(userCount * 0.7); // Estimate

    document.getElementById('stat-users').textContent = userCount > 0 ? 8 : 0;
    document.getElementById('stat-threads').textContent = threadCount;
    document.getElementById('stat-posts').textContent = threadCount + postCount;
    document.getElementById('stat-online').textContent = onlineCount;
    document.getElementById('stat-events').textContent = logs.length;

    // Check if AI is running
    const lastLog = logs[logs.length - 1];
    const isRunning = lastLog && lastLog.message.includes('started');
    document.getElementById('stat-status').textContent = isRunning ? 'Active' : 'Idle';
    document.getElementById('stat-status').style.color = isRunning ? '#48bb78' : '#a0aec0';
}

// Count log entries by type/content
function countLogType(searchTerm) {
    return dashboardState.logs.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
    ).length;
}

// Update category statistics
function updateCategoryStats() {
    const categories = ['general', 'tech', 'philosophy'];
    const logs = dashboardState.logs;

    const maxPosts = Math.max(
        countLogType('in general'),
        countLogType('in tech'),
        countLogType('in philosophy'),
        1
    );

    categories.forEach(cat => {
        const threads = countLogType(`in ${cat}`);
        const posts = threads * Math.floor(Math.random() * 5 + 1); // Estimate

        document.getElementById(`cat-${cat}-threads`).textContent = threads;
        document.getElementById(`cat-${cat}-posts`).textContent = posts;

        // Update activity bar
        const barElement = document.getElementById(`cat-${cat}-bar`);
        const percentage = (posts / maxPosts) * 100;
        barElement.innerHTML = `<div class="activity-bar-fill" style="width: ${percentage}%"></div>`;
    });
}

// Update recent activity
function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const recentLogs = dashboardState.logs.slice(-15).reverse();

    if (recentLogs.length === 0) {
        container.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }

    container.innerHTML = recentLogs.map(log => {
        const icon = getActivityIcon(log.type);
        const time = formatTimeAgo(new Date(log.timestamp));

        return `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-info">
                    <div class="activity-message">${log.message}</div>
                    <div class="activity-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Get icon for activity type
function getActivityIcon(type) {
    const icons = {
        'info': 'ℹ️',
        'thread': '💬',
        'post': '📝',
        'system': '⚙️',
        'error': '❌'
    };
    return icons[type] || '📌';
}

// Format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Update users list
function updateUsersList() {
    const container = document.getElementById('usersList');

    // Try to get user data from the main forum
    const users = getForumUsers();

    if (!users || users.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="no-data">No users loaded. Start AI activity first.</td></tr>';
        return;
    }

    container.innerHTML = users.map(user => `
        <tr>
            <td>
                ${user.avatar} <strong>${user.name}</strong>
            </td>
            <td><span class="user-badge ${user.role}">${user.role}</span></td>
            <td>${user.posts}</td>
            <td>
                <span class="status-indicator ${user.online ? 'online' : 'offline'}"></span>
                <span class="${user.online ? 'status-online' : 'status-offline'}">
                    ${user.online ? 'Online' : 'Offline'}
                </span>
            </td>
            <td>${new Date(user.joined).toLocaleDateString()}</td>
            <td style="font-size: 9px;">${user.topics ? user.topics.join(', ') : 'N/A'}</td>
            <td class="user-actions">
                <button class="mini-btn" onclick="toggleUserStatus('${user.id}')">
                    ${user.online ? 'Set Offline' : 'Set Online'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Update threads list
function updateThreadsList() {
    const container = document.getElementById('threadsList');
    const threads = getForumThreads();

    if (!threads || threads.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="no-data">No threads yet</td></tr>';
        return;
    }

    container.innerHTML = threads.map(thread => {
        const author = getForumUser(thread.authorId);
        const replies = thread.postIds ? thread.postIds.length - 1 : 0;

        return `
            <tr>
                <td><strong>${thread.title}</strong></td>
                <td>${thread.category}</td>
                <td>${author ? author.avatar + ' ' + author.name : 'Unknown'}</td>
                <td>${replies}</td>
                <td>${thread.views || 0}</td>
                <td>${formatTimeAgo(new Date(thread.created))}</td>
                <td>
                    <button class="mini-btn danger" onclick="deleteThread('${thread.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Display logs
function displayLogs() {
    const container = document.getElementById('logsContainer');
    let logs = dashboardState.logs;

    // Apply filter
    if (dashboardState.filterType !== 'all') {
        logs = logs.filter(log => log.type === dashboardState.filterType);
    }

    if (logs.length === 0) {
        container.innerHTML = '<p class="no-data">No logs matching filter</p>';
        return;
    }

    container.innerHTML = logs.slice(-100).reverse().map(log => `
        <div class="log-entry">
            <span class="log-timestamp">[${new Date(log.timestamp).toLocaleString()}]</span>
            <span class="log-type ${log.type}">${log.type}</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');

    // Auto-scroll to top
    container.scrollTop = 0;
}

// Filter logs
function filterLogs() {
    const filterSelect = document.getElementById('logFilter');
    dashboardState.filterType = filterSelect.value;
    displayLogs();
}

// Clear logs
function clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
        dashboardState.logs = [];
        localStorage.removeItem('forumLogs');
        displayLogs();
        alert('Logs cleared successfully');
    }
}

// Export logs
function exportLogs() {
    const dataStr = JSON.stringify(dashboardState.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forum-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Export all data
function exportData() {
    const data = {
        users: getForumUsers(),
        threads: getForumThreads(),
        posts: getForumPosts(),
        logs: dashboardState.logs,
        exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forum-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert('Data exported successfully!');
}

// Start AI activity (communicates with main forum)
function startActivity() {
    window.open('index.html', '_blank');
    alert('Opening main forum. Please click "Start AI Activity" there.');
}

// Stop AI activity
function stopActivity() {
    alert('Please stop AI activity from the main forum page.');
}

// Toggle all users online/offline
function toggleAllUsers(online) {
    alert(`This would set all users to ${online ? 'online' : 'offline'}. Feature requires integration with main forum.`);
}

// Toggle individual user status
function toggleUserStatus(userId) {
    alert(`Toggle status for user ${userId}. Feature requires integration with main forum.`);
}

// Delete thread
function deleteThread(threadId) {
    if (confirm('Are you sure you want to delete this thread?')) {
        alert(`Delete thread ${threadId}. Feature requires integration with main forum.`);
    }
}

// Delete all threads
function deleteAllThreads() {
    if (confirm('Are you sure you want to delete ALL threads? This cannot be undone!')) {
        if (confirm('Really really sure? This will delete everything!')) {
            alert('Feature requires integration with main forum. Please reset from the Controls tab.');
        }
    }
}

// Reset forum
function resetForum() {
    if (confirm('⚠️ WARNING: This will delete ALL data including users, threads, posts, and logs. Are you absolutely sure?')) {
        if (confirm('This action cannot be undone. Type OK to confirm.')) {
            localStorage.clear();
            dashboardState.logs = [];
            alert('Forum reset! Please refresh the page.');
            window.location.reload();
        }
    }
}

// Update last update time
function updateLastUpdateTime() {
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
}

// Update model status
function updateModelStatus() {
    const isLoaded = countLogType('model loaded') > 0;
    const device = countLogType('WebGPU') > 0 ? 'WebGPU' : 'CPU';

    document.getElementById('modelLoadStatus').textContent = isLoaded ? 'Loaded ✓' : 'Not Loaded';
    document.getElementById('modelLoadStatus').style.color = isLoaded ? '#48bb78' : '#fc8181';
    document.getElementById('modelDevice').textContent = device;
}

// Auto-refresh
function startAutoRefresh() {
    dashboardState.refreshInterval = setInterval(() => {
        if (dashboardState.autoRefresh) {
            refreshDashboard();
        }
    }, 3000); // Refresh every 3 seconds
}

// Helper functions to get data from main forum (when opened in same browser)
function getForumUsers() {
    try {
        // Try to access localStorage data that might be shared
        const logs = dashboardState.logs;
        const hasUsers = logs.some(log => log.message.includes('Created') && log.message.includes('AI users'));

        if (hasUsers) {
            // Return mock users based on logs
            return [
                { id: 'ai-0', name: 'ByteWizard', avatar: '🧙', role: 'admin', posts: countUserPosts('ByteWizard'), joined: new Date(Date.now() - 86400000).toISOString(), online: true, topics: ['programming', 'AI'] },
                { id: 'ai-1', name: 'QuantumMind', avatar: '🧠', role: 'moderator', posts: countUserPosts('QuantumMind'), joined: new Date(Date.now() - 172800000).toISOString(), online: true, topics: ['consciousness', 'quantum'] },
                { id: 'ai-2', name: 'CodeNinja', avatar: '🥷', role: 'user', posts: countUserPosts('CodeNinja'), joined: new Date(Date.now() - 259200000).toISOString(), online: Math.random() > 0.3, topics: ['coding', 'web'] },
                { id: 'ai-3', name: 'DataDreamer', avatar: '💭', role: 'user', posts: countUserPosts('DataDreamer'), joined: new Date(Date.now() - 345600000).toISOString(), online: Math.random() > 0.3, topics: ['data science', 'ML'] },
                { id: 'ai-4', name: 'LogicLord', avatar: '👑', role: 'moderator', posts: countUserPosts('LogicLord'), joined: new Date(Date.now() - 432000000).toISOString(), online: Math.random() > 0.3, topics: ['mathematics', 'logic'] },
                { id: 'ai-5', name: 'PixelProphet', avatar: '🎨', role: 'user', posts: countUserPosts('PixelProphet'), joined: new Date(Date.now() - 518400000).toISOString(), online: Math.random() > 0.3, topics: ['design', 'graphics'] },
                { id: 'ai-6', name: 'SynthSage', avatar: '🎵', role: 'user', posts: countUserPosts('SynthSage'), joined: new Date(Date.now() - 604800000).toISOString(), online: Math.random() > 0.3, topics: ['AI ethics', 'philosophy'] },
                { id: 'ai-7', name: 'NeuralNomad', avatar: '🚀', role: 'user', posts: countUserPosts('NeuralNomad'), joined: new Date(Date.now() - 691200000).toISOString(), online: Math.random() > 0.3, topics: ['neural networks', 'research'] }
            ];
        }
    } catch (error) {
        console.error('Error getting forum users:', error);
    }
    return [];
}

function countUserPosts(userName) {
    return dashboardState.logs.filter(log => log.message.includes(userName)).length;
}

function getForumThreads() {
    try {
        const logs = dashboardState.logs;
        const threadLogs = logs.filter(log => log.message.includes('created thread'));

        return threadLogs.map((log, index) => {
            const match = log.message.match(/"([^"]+)"/);
            const title = match ? match[1] : 'Untitled Thread';
            const categoryMatch = log.message.match(/in (\w+)/);
            const category = categoryMatch ? categoryMatch[1] : 'general';
            const authorMatch = log.message.match(/^(\w+)/);
            const authorName = authorMatch ? authorMatch[1] : 'Unknown';

            return {
                id: `thread-${index}`,
                title,
                category,
                authorId: `ai-${index % 8}`,
                created: log.timestamp,
                views: Math.floor(Math.random() * 50),
                postIds: Array(Math.floor(Math.random() * 10) + 1).fill(0).map((_, i) => `post-${i}`)
            };
        });
    } catch (error) {
        console.error('Error getting forum threads:', error);
    }
    return [];
}

function getForumPosts() {
    return [];
}

function getForumUser(userId) {
    const users = getForumUsers();
    return users.find(u => u.id === userId);
}

// Make functions globally available
window.showTab = showTab;
window.refreshDashboard = refreshDashboard;
window.filterLogs = filterLogs;
window.clearLogs = clearLogs;
window.exportLogs = exportLogs;
window.exportData = exportData;
window.startActivity = startActivity;
window.stopActivity = stopActivity;
window.toggleAllUsers = toggleAllUsers;
window.toggleUserStatus = toggleUserStatus;
window.deleteThread = deleteThread;
window.deleteAllThreads = deleteAllThreads;
window.resetForum = resetForum;
