// API Configuration
const isDevEnv = /mitchellnet\.dev\.local$/i.test(window.location.hostname) || window.location.hostname === 'localhost';
const API_BASE_URL = isDevEnv
    ? 'http://localhost:5001/api'  // Development
    : '/fitness/api'; // Production - use relative path through nginx proxy

const API_KEY = window.FITNESS_API_KEY || '';
function getAuthHeaders(extra = {}) {
    return { 'X-API-Key': API_KEY, ...extra };
}

// State
let allUnits = [];
let allActivities = [];
let allUnitTypes = [];
let editingUnit = null;
let editingActivity = null;

// DOM Elements
const statusIndicator = document.getElementById('apiStatus');
const statusText = document.getElementById('statusText');
const unitTypeForm = document.getElementById('unitTypeForm');
const unitTypeName = document.getElementById('unitTypeName');
const unitTypesList = document.getElementById('unitTypesList');
const unitForm = document.getElementById('unitForm');
const unitName = document.getElementById('unitName');
const unitType = document.getElementById('unitType');
const unitsList = document.getElementById('unitsList');
const activityForm = document.getElementById('activityForm');
const activityName = document.getElementById('activityName');
const activityUnit = document.getElementById('activityUnit');
const activityDefault = document.getElementById('activityDefault');
const activitiesList = document.getElementById('activitiesList');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAPIHealth();
    loadUnitTypes();
    loadUnits();
    loadActivities();

    // Event listeners
    unitTypeForm.addEventListener('submit', handleUnitTypeSubmit);
    unitForm.addEventListener('submit', handleUnitSubmit);
    activityForm.addEventListener('submit', handleActivitySubmit);
});

// Check API health
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, { headers: getAuthHeaders() });
        const data = await response.json();

        if (data.status === 'healthy') {
            statusIndicator.classList.add('healthy');
            statusText.textContent = 'API Connected';
        } else {
            statusIndicator.classList.remove('healthy');
            statusText.textContent = 'API Error';
        }
    } catch (error) {
        statusIndicator.classList.remove('healthy');
        statusText.textContent = 'API Offline';
        console.error('Health check failed:', error);
    }
}

// ============ UNIT TYPES MANAGEMENT ============

async function loadUnitTypes() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/unit-types`, { headers: getAuthHeaders() });
        const data = await response.json();

        if (data.success) {
            allUnitTypes = data.data;
            displayUnitTypes();
            updateUnitTypeDropdown();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        unitTypesList.innerHTML = `<p class="error">Failed to load unit types: ${error.message}</p>`;
        console.error('Error loading unit types:', error);
    }
}

function displayUnitTypes() {
    if (allUnitTypes.length === 0) {
        unitTypesList.innerHTML = '<p class="loading">No unit types found.</p>';
        return;
    }

    unitTypesList.innerHTML = allUnitTypes.map(type => `
        <div class="admin-item">
            <div class="admin-item-details">
                <strong>${escapeHtml(type)}</strong>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-small btn-danger" onclick="deleteUnitType('${escapeHtml(type)}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateUnitTypeDropdown() {
    const currentValue = unitType.value;
    unitType.innerHTML = '<option value="">Select type...</option>';

    allUnitTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        unitType.appendChild(option);
    });

    // Restore selection if editing
    if (currentValue) {
        unitType.value = currentValue;
    }
}

async function handleUnitTypeSubmit(e) {
    e.preventDefault();

    const name = unitTypeName.value.trim();

    if (!name) {
        alert('Please enter a unit type name');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/unit-types`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                name: name
            })
        });

        const result = await response.json();

        if (result.success) {
            // Reset form
            unitTypeForm.reset();

            // Reload unit types
            await loadUnitTypes();

            // Show success message
            alert('Unit type added successfully!');
        } else {
            alert('Failed to add unit type: ' + result.error);
        }
    } catch (error) {
        alert('Error adding unit type: ' + error.message);
        console.error('Add unit type error:', error);
    }
}

async function deleteUnitType(typeName) {
    if (!confirm(`Are you sure you want to delete the unit type "${typeName}"? This will fail if any units use this type.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/unit-types/${encodeURIComponent(typeName)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (result.success) {
            await loadUnitTypes();
            alert('Unit type deleted successfully!');
        } else {
            alert('Failed to delete unit type: ' + result.error);
        }
    } catch (error) {
        alert('Error deleting unit type: ' + error.message);
        console.error('Delete unit type error:', error);
    }
}

// ============ UNITS MANAGEMENT ============

async function loadUnits() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/units`, { headers: getAuthHeaders() });
        const data = await response.json();

        if (data.success) {
            allUnits = data.data;
            displayUnits();
            updateActivityUnitDropdown();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        unitsList.innerHTML = `<p class="error">Failed to load units: ${error.message}</p>`;
        console.error('Error loading units:', error);
    }
}

function displayUnits() {
    if (allUnits.length === 0) {
        unitsList.innerHTML = '<p class="loading">No units found.</p>';
        return;
    }

    unitsList.innerHTML = allUnits.map(unit => `
        <div class="admin-item">
            <div class="admin-item-details">
                <strong>${escapeHtml(unit.name)}</strong>
                <span class="admin-item-meta">Type: ${escapeHtml(unit.unit)}</span>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-small btn-change" onclick="editUnit(${unit.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteUnit(${unit.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateActivityUnitDropdown() {
    const currentValue = activityUnit.value;
    activityUnit.innerHTML = '<option value="">Select unit...</option>';

    allUnits.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = `${unit.name} (${unit.unit})`;
        activityUnit.appendChild(option);
    });

    // Restore selection if editing
    if (currentValue) {
        activityUnit.value = currentValue;
    }
}

async function handleUnitSubmit(e) {
    e.preventDefault();

    const name = unitName.value.trim();
    const type = unitType.value;

    if (!name || !type) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const url = editingUnit
            ? `${API_BASE_URL}/admin/units/${editingUnit.id}`
            : `${API_BASE_URL}/admin/units`;

        const method = editingUnit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                name: name,
                unit: type
            })
        });

        const result = await response.json();

        if (result.success) {
            // Reset form
            unitForm.reset();
            editingUnit = null;

            // Reload units and unit types
            await loadUnits();
            await loadUnitTypes();

            // Show success message
            alert(method === 'PUT' ? 'Unit updated successfully!' : 'Unit added successfully!');
        } else {
            alert('Failed to save unit: ' + result.error);
        }
    } catch (error) {
        alert('Error saving unit: ' + error.message);
        console.error('Save unit error:', error);
    }
}

function editUnit(id) {
    const unit = allUnits.find(u => u.id === id);
    if (!unit) return;

    editingUnit = unit;
    unitName.value = unit.name;
    unitType.value = unit.unit;

    // Scroll to form
    unitForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function deleteUnit(id) {
    if (!confirm('Are you sure you want to delete this unit? This will fail if any activities use this unit.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/units/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (result.success) {
            await loadUnits();
            await loadUnitTypes();
            alert('Unit deleted successfully!');
        } else {
            alert('Failed to delete unit: ' + result.error);
        }
    } catch (error) {
        alert('Error deleting unit: ' + error.message);
        console.error('Delete unit error:', error);
    }
}

// ============ ACTIVITIES MANAGEMENT ============

async function loadActivities() {
    try {
        const response = await fetch(`${API_BASE_URL}/activities`, { headers: getAuthHeaders() });
        const data = await response.json();

        if (data.success) {
            allActivities = data.data;
            displayActivities();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        activitiesList.innerHTML = `<p class="error">Failed to load activities: ${error.message}</p>`;
        console.error('Error loading activities:', error);
    }
}

function displayActivities() {
    if (allActivities.length === 0) {
        activitiesList.innerHTML = '<p class="loading">No activities found.</p>';
        return;
    }

    activitiesList.innerHTML = allActivities.map(activity => `
        <div class="admin-item">
            <div class="admin-item-details">
                <strong>${escapeHtml(activity.name)}</strong>
                <span class="admin-item-meta">Unit: ${escapeHtml(activity.unit_name)} | Default: ${activity.default_amt}</span>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-small btn-change" onclick="editActivity(${activity.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteActivity(${activity.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function handleActivitySubmit(e) {
    e.preventDefault();

    const name = activityName.value.trim();
    const unitId = activityUnit.value;
    const defaultAmt = activityDefault.value;

    if (!name || !unitId || !defaultAmt) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const url = editingActivity
            ? `${API_BASE_URL}/admin/activities/${editingActivity.id}`
            : `${API_BASE_URL}/admin/activities`;

        const method = editingActivity ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                name: name,
                unitId: unitId,
                defaultAmt: defaultAmt
            })
        });

        const result = await response.json();

        if (result.success) {
            // Reset form
            activityForm.reset();
            editingActivity = null;

            // Reload activities
            await loadActivities();

            // Show success message
            alert(method === 'PUT' ? 'Activity updated successfully!' : 'Activity added successfully!');
        } else {
            alert('Failed to save activity: ' + result.error);
        }
    } catch (error) {
        alert('Error saving activity: ' + error.message);
        console.error('Save activity error:', error);
    }
}

function editActivity(id) {
    const activity = allActivities.find(a => a.id === id);
    if (!activity) return;

    editingActivity = activity;
    activityName.value = activity.name;
    activityUnit.value = activity.fkUnitID;
    activityDefault.value = activity.default_amt;

    // Scroll to form
    activityForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function deleteActivity(id) {
    if (!confirm('Are you sure you want to delete this activity? This will fail if there are any logged entries for this activity.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/activities/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (result.success) {
            await loadActivities();
            alert('Activity deleted successfully!');
        } else {
            alert('Failed to delete activity: ' + result.error);
        }
    } catch (error) {
        alert('Error deleting activity: ' + error.message);
        console.error('Delete activity error:', error);
    }
}

// ============ UTILITY FUNCTIONS ============

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
