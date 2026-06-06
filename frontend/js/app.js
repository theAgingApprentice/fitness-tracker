// API Configuration
const isDevEnv = /mitchellnet\.dev\.local$/i.test(window.location.hostname) || window.location.hostname === 'localhost';
const API_BASE_URL = isDevEnv
    ? 'http://localhost:5001/api'  // Development
    : '/fitness/api'; // Production - use relative path through nginx proxy

// State
let currentDate = new Date();
let activeDates = new Set();
let availableActivities = [];
let selectedDateStr = '';

// DOM Elements
const statusIndicator = document.getElementById('apiStatus');
const statusText = document.getElementById('statusText');
const environmentSpan = document.getElementById('environment');
const currentMonthEl = document.getElementById('currentMonth');
const calendarGridEl = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const activityDetailsEl = document.getElementById('activityDetails');
const selectedDateEl = document.getElementById('selectedDate');
const activitiesContainer = document.getElementById('activitiesContainer');
const activityForm = document.getElementById('activityForm');
const activitySelect = document.getElementById('activitySelect');
const unitDisplay = document.getElementById('unitDisplay');
const valueInput = document.getElementById('valueInput');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAPIHealth();
    loadActivities();
    renderCalendar();

    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    activitySelect.addEventListener('change', updateUnitsDisplay);
    activityForm.addEventListener('submit', handleAddActivity);
});

// Load available activities
async function loadActivities() {
    try {
        const response = await fetch(`${API_BASE_URL}/activities`);
        const data = await response.json();

        if (data.success) {
            availableActivities = data.data;
            populateActivityDropdown();
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Populate activity dropdown
function populateActivityDropdown() {
    activitySelect.innerHTML = '<option value="">Select activity...</option>';
    availableActivities.forEach(activity => {
        const option = document.createElement('option');
        option.value = activity.id;
        option.textContent = activity.name;
        option.dataset.unitName = activity.unit_name;
        option.dataset.defaultAmt = activity.default_amt;
        activitySelect.appendChild(option);
    });
}

// Update units display based on selected activity
function updateUnitsDisplay() {
    const selectedOption = activitySelect.options[activitySelect.selectedIndex];
    if (selectedOption.value) {
        unitDisplay.value = selectedOption.dataset.unitName;
        valueInput.value = selectedOption.dataset.defaultAmt;
    } else {
        unitDisplay.value = '';
        valueInput.value = '';
    }
}

// Check API health
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/fitness/api', '')}/fitness/api/health`);
        const data = await response.json();

        if (data.status === 'healthy') {
            statusIndicator.classList.add('healthy');
            statusText.textContent = 'API Connected';
            environmentSpan.textContent = data.database === 'connected' ? 'Connected' : 'Disconnected';
        } else {
            throw new Error('API unhealthy');
        }
    } catch (error) {
        statusIndicator.classList.add('error');
        statusText.textContent = 'API Connection Failed';
        console.error('Health check failed:', error);
    }
}

// Render calendar for current month
async function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;

    // Get active dates for this month
    await loadActiveDates(year, month);

    // Calculate calendar grid
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Clear calendar (keep headers)
    const headers = calendarGridEl.querySelectorAll('.calendar-day-header');
    calendarGridEl.innerHTML = '';
    headers.forEach(header => calendarGridEl.appendChild(header));

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGridEl.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Check if this day has activities
        if (activeDates.has(dateStr)) {
            dayEl.classList.add('has-activity');
        }

        // Check if this is today
        if (year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()) {
            dayEl.classList.add('today');
        }

        dayEl.innerHTML = `<div class="day-number">${day}</div>`;
        dayEl.dataset.date = dateStr;
        dayEl.addEventListener('click', () => showActivitiesForDate(dateStr));

        calendarGridEl.appendChild(dayEl);
    }
}

// Load dates with activities for a specific month
async function loadActiveDates(year, month) {
    try {
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        const response = await fetch(`${API_BASE_URL}/activity-log?month=${monthStr}`);
        const data = await response.json();

        if (data.success) {
            activeDates = new Set(data.data.map(item => item.date));
        } else {
            console.error('Failed to load active dates:', data.error);
            activeDates = new Set();
        }
    } catch (error) {
        console.error('Error loading active dates:', error);
        activeDates = new Set();
    }
}

// Show activities for a specific date
async function showActivitiesForDate(dateStr) {
    try {
        selectedDateStr = dateStr;
        selectedDateEl.textContent = formatDate(dateStr);
        activityDetailsEl.style.display = 'block';
        activitiesContainer.innerHTML = '<p class="loading">Loading activities...</p>';

        const response = await fetch(`${API_BASE_URL}/activity-log?date=${dateStr}`);
        const data = await response.json();

        if (data.success) {
            displayActivities(data.data);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        activitiesContainer.innerHTML = `<p class="error">Failed to load activities: ${error.message}</p>`;
        console.error('Error loading activities:', error);
    }
}

// Display activities
function displayActivities(activities) {
    if (activities.length === 0) {
        activitiesContainer.innerHTML = '<p class="loading">No activities logged for this day.</p>';
        return;
    }

    activitiesContainer.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-details-grid">
                <div class="detail-row">
                    <strong>Activity:</strong> ${escapeHtml(activity.activity_name)}
                </div>
                <div class="detail-row">
                    <strong>Units:</strong> ${escapeHtml(activity.unit_name)}
                </div>
                <div class="detail-row">
                    <strong>Value:</strong> ${activity.duration}
                </div>
            </div>
            <div class="activity-actions">
                <button class="btn btn-small btn-change" onclick="editActivity(${activity.id}, ${activity.fkActivityId}, ${activity.duration})">Change</button>
                <button class="btn btn-small btn-danger" onclick="deleteActivity(${activity.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle add activity form submission
async function handleAddActivity(e) {
    e.preventDefault();

    const activityId = activitySelect.value;
    const duration = valueInput.value;

    if (!activityId || !duration || !selectedDateStr) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/activity-log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                activityId: activityId,
                date: selectedDateStr,
                duration: duration
            })
        });

        const result = await response.json();

        if (result.success) {
            // Reset form
            activityForm.reset();
            unitDisplay.value = '';

            // Reload activities for this date
            showActivitiesForDate(selectedDateStr);

            // Refresh calendar to update active dates
            renderCalendar();
        } else {
            alert('Failed to add activity: ' + result.error);
        }
    } catch (error) {
        alert('Error adding activity: ' + error.message);
        console.error('Add activity error:', error);
    }
}

// Edit activity
async function editActivity(id, activityId, currentDuration) {
    const newDuration = prompt('Enter new value:', currentDuration);

    if (newDuration === null || newDuration === '') {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/activity-log/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                duration: newDuration
            })
        });

        const result = await response.json();

        if (result.success) {
            showActivitiesForDate(selectedDateStr);
        } else {
            alert('Failed to update activity: ' + result.error);
        }
    } catch (error) {
        alert('Error updating activity: ' + error.message);
        console.error('Update activity error:', error);
    }
}

// Delete activity
async function deleteActivity(id) {
    if (!confirm('Are you sure you want to delete this activity?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/activity-log/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showActivitiesForDate(selectedDateStr);
            renderCalendar();
        } else {
            alert('Failed to delete activity: ' + result.error);
        }
    } catch (error) {
        alert('Error deleting activity: ' + error.message);
        console.error('Delete activity error:', error);
    }
}
