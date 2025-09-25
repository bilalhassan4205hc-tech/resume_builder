// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
let templateSelect = document.getElementById('templateSelect');
let messageDiv = document.getElementById('message');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    templateSelect.addEventListener('change', function() {
        document.body.className = this.value;
    });
});

// Section Management Functions
function moveUp(btn) {
    const section = btn.closest('section');
    const prev = section.previousElementSibling;
    if (prev) section.parentNode.insertBefore(section, prev);
}

function moveDown(btn) {
    const section = btn.closest('section');
    const next = section.nextElementSibling;
    if (next) section.parentNode.insertBefore(next, section);
}

function deleteSection(btn) {
    if (confirm('Are you sure you want to delete this section?')) {
        btn.closest('section').remove();
    }
}

function addSection() {
    const newSection = document.createElement('section');
    newSection.contentEditable = "true";
    newSection.setAttribute('data-title', 'Custom Section');
    newSection.innerHTML = `
        <div class="section-controls">
            <button onclick="moveUp(this)">↑</button>
            <button onclick="moveDown(this)">↓</button>
            <button onclick="deleteSection(this)">🗑</button>
        </div>
        <h2>New Section</h2>
        <p>Click to edit content...</p>
    `;
    document.getElementById('resume').appendChild(newSection);
}

function togglePreview() {
    document.querySelectorAll('.section-controls').forEach(el => {
        el.style.display = el.style.display === 'none' ? 'flex' : 'none';
    });
}

function downloadPDF() {
    window.print();
}

// Extract personal information from the header section
function extractPersonalInfo() {
    const headerSection = document.querySelector('section[data-title="Header"]');
    if (!headerSection) return null;

    const headerText = headerSection.textContent || '';
    
    // Simple parsing logic - you might want to make this more robust
    const nameMatch = headerText.match(/^([^\n|]+)/);
    const emailMatch = headerText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    const phoneMatch = headerText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const locationMatch = headerText.match(/([^|]+)$/);

    return {
        name: nameMatch ? nameMatch[0].trim() : 'Unknown',
        email: emailMatch ? emailMatch[0].trim() : '',
        phone: phoneMatch ? phoneMatch[0].trim() : '',
        city: locationMatch ? locationMatch[0].trim().split(',')[0] : '',
        country: locationMatch && locationMatch[0].includes(',') ? 
                 locationMatch[0].split(',')[1].trim() : '',
        resume_content: document.getElementById('resume').innerHTML,
        template: document.body.className,
        created_at: new Date().toISOString()
    };
}

// Show message function
function showMessage(message, type = 'success') {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Submit Resume Function
async function submitResume() {
    try {
        const personalInfo = extractPersonalInfo();
        
        if (!personalInfo || !personalInfo.name || !personalInfo.email) {
            showMessage('Please make sure your resume has a header with name and email', 'error');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/resumes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personalInfo)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Resume submitted successfully!');
        } else {
            showMessage(result.error || 'Failed to submit resume', 'error');
        }

    } catch (error) {
        console.error('Error submitting resume:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Restore button state
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Optional: Auto-save functionality
let autoSaveTimer;
function startAutoSave() {
    // Clear existing timer
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    // Set new timer (save after 5 seconds of inactivity)
    autoSaveTimer = setTimeout(() => {
        const personalInfo = extractPersonalInfo();
        if (personalInfo && personalInfo.name) {
            localStorage.setItem('resumeDraft', JSON.stringify(personalInfo));
        }
    }, 5000);
}

// Add event listeners for auto-save
document.addEventListener('input', startAutoSave);

// Load draft on page load
document.addEventListener('DOMContentLoaded', function() {
    const draft = localStorage.getItem('resumeDraft');
    if (draft) {
        console.log('Draft resume found in local storage');
    }
});