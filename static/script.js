let instanceCounter = 0;
let flagCounter = 0;
let previewYamlData = null;

// Helper function to create label with info icon
function createLabelWithInfo(labelText, helpText) {
    const safeLabel = escapeHtml(labelText);
    // Process help text to format flag examples properly - wrap flag strings in spans to prevent wrapping
    let processedHelp = escapeHtml(helpText);
    // Replace bullet points followed by flag examples with formatted spans that don't wrap
    // Match pattern: bullet point, optional space, then flag pattern
    processedHelp = processedHelp.replace(/(•\s*)(FIRE\{[^}]+\}|DDC\{[^}]+\})/g, (match, bullet, flag) => {
        return '<div style="margin: 6px 0; line-height: 1.6;">' + bullet + '<span class="flag-example">' + flag + '</span></div>';
    });

    return `
        <label>
            ${safeLabel}
            <span class="info-icon" onclick="this.classList.toggle('active')" onmouseleave="this.classList.remove('active')">
                i
                <span class="tooltip">${processedHelp}</span>
            </span>
        </label>
    `;
}

// Security: Input sanitization functions
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    // Remove null bytes and control characters (except newlines and tabs for textareas)
    return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function sanitizeForAttribute(value) {
    return escapeHtml(sanitizeInput(value));
}

function sanitizeForText(value) {
    return sanitizeInput(value);
}

function sanitizeForYaml(value) {
    if (typeof value !== 'string') {
        return '';
    }
    // Remove null bytes and dangerous control characters
    // Allow newlines and tabs for multi-line YAML content
    return value.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

// Custom alert function
function showAlert(message, title = 'Alert') {
    const alertModal = document.getElementById('customAlert');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');

    // Sanitize inputs before displaying
    alertTitle.textContent = sanitizeForText(title);
    alertMessage.textContent = sanitizeForText(message);
    alertModal.style.display = 'block';
}

function closeAlert() {
    const alertModal = document.getElementById('customAlert');
    alertModal.style.display = 'none';
}

// Custom confirm function
let confirmCallback = null;

function showConfirm(message, title = 'Confirm', callback) {
    const confirmModal = document.getElementById('customConfirm');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');

    // Sanitize inputs before displaying
    confirmTitle.textContent = sanitizeForText(title);
    confirmMessage.textContent = sanitizeForText(message);
    confirmCallback = callback;
    confirmModal.style.display = 'block';
}

function confirmAction(result) {
    const confirmModal = document.getElementById('customConfirm');
    confirmModal.style.display = 'none';
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

// Close modals when clicking outside or pressing Escape
document.addEventListener('DOMContentLoaded', function () {
    const alertModal = document.getElementById('customAlert');
    const confirmModal = document.getElementById('customConfirm');

    if (alertModal) {
        alertModal.addEventListener('click', function (event) {
            if (event.target === alertModal) {
                closeAlert();
            }
        });
    }

    if (confirmModal) {
        confirmModal.addEventListener('click', function (event) {
            if (event.target === confirmModal) {
                confirmAction(false);
            }
        });
    }

    // Close modals on Escape key
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (alertModal && alertModal.style.display === 'block') {
                closeAlert();
            }
            if (confirmModal && confirmModal.style.display === 'block') {
                confirmAction(false);
            }
        }
    });
});

// Category prefixes
const categoryPrefixes = {
    "Starters": "st_",
    "Forensics": "fr_",
    "Web exploitation": "we_",
    "Cryptography": "cry_",
    "Boot 2 Root": "b2r_",
    "Reverse Engineering": "re_",
    "Binary (PWN)": "bn_",
    "Misc": "mi_",
    "Operational Technologies": "ot_",
};

// Validation functions
function validateChallengeName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: "Challenge name is required. Expected: letters, numbers, spaces, hyphens, and underscores only." };
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
        return { valid: false, error: "Challenge name format is invalid. Expected: letters (a-z, A-Z), numbers (0-9), spaces, hyphens (-), and underscores (_) only. No special characters allowed." };
    }
    return { valid: true };
}

function validateTag(tag) {
    if (!tag || tag.trim().length === 0) {
        return { valid: false, error: "Tag is required. Expected: lowercase letters, numbers, hyphens, and underscores only." };
    }
    if (!/^[a-z0-9\-_]+$/.test(tag)) {
        return { valid: false, error: "Tag format is invalid. Expected: lowercase letters (a-z), numbers (0-9), hyphens (-), and underscores (_) only. No uppercase letters, spaces, or special characters allowed." };
    }
    return { valid: true };
}

function validateFlagTag(flagTag) {
    if (!flagTag || flagTag.trim().length === 0) {
        return { valid: false, error: "Flag tag is required. Expected: lowercase letters, numbers, hyphens, and underscores only." };
    }
    if (!/^[a-z0-9\-_]+$/.test(flagTag)) {
        return { valid: false, error: "Flag tag format is invalid. Expected: lowercase letters (a-z), numbers (0-9), hyphens (-), and underscores (_) only. No uppercase letters, spaces, or special characters allowed." };
    }
    return { valid: true };
}

function validateFlagStatic(flagStatic) {
    if (!flagStatic || flagStatic.trim().length === 0) {
        return { valid: false, error: "Flag value is required. Expected format: FIRE{...} or DDC{...} with 6-50 characters inside the braces." };
    }

    const trimmed = flagStatic.trim();

    // Check for FIRE{...} or DDC{...} format
    const firePattern = /^FIRE\{[a-zA-Z0-9\-_]{6,50}\}$/;
    const ddcPattern = /^DDC\{[a-zA-Z0-9\-_]{6,50}\}$/;

    if (!firePattern.test(trimmed) && !ddcPattern.test(trimmed)) {
        // Provide detailed error message
        if (!trimmed.startsWith('FIRE{') && !trimmed.startsWith('DDC{')) {
            return { valid: false, error: "Flag value format is invalid. Expected: Must start with 'FIRE{' or 'DDC{' (e.g., FIRE{example_flag_123456} or DDC{example_flag_123456})." };
        }
        if (!trimmed.endsWith('}')) {
            return { valid: false, error: "Flag value format is invalid. Expected: Must end with '}' (e.g., FIRE{example_flag_123456} or DDC{example_flag_123456})." };
        }

        // Extract content between braces
        const match = trimmed.match(/^(FIRE|DDC)\{([^}]*)\}$/);
        if (match) {
            const content = match[2];
            if (content.length < 6) {
                return { valid: false, error: "Flag value format is invalid. Expected: Content inside braces must be 6-50 characters long. Current length: " + content.length + " characters. Example: FIRE{example_flag_123456} or DDC{example_flag_123456}." };
            }
            if (content.length > 50) {
                return { valid: false, error: "Flag value format is invalid. Expected: Content inside braces must be 6-50 characters long. Current length: " + content.length + " characters. Example: FIRE{example_flag_123456} or DDC{example_flag_123456}." };
            }
            if (!/^[a-zA-Z0-9\-_]+$/.test(content)) {
                return { valid: false, error: "Flag value format is invalid. Expected: Content inside braces can only contain letters (a-z, A-Z), numbers (0-9), hyphens (-), and underscores (_). Example: FIRE{example_flag_123456} or DDC{example_flag_123456}." };
            }
        }

        return { valid: false, error: "Flag value format is invalid. Expected: FIRE{...} or DDC{...} with 6-50 characters inside the braces. Characters allowed: letters (a-z, A-Z), numbers (0-9), hyphens (-), and underscores (_). Example: FIRE{example_flag_123456} or DDC{example_flag_123456}." };
    }

    return { valid: true };
}

function validateDnsName(dnsName) {
    if (!dnsName || dnsName.trim().length === 0) {
        return { valid: false, error: "DNS name cannot be empty" };
    }

    const trimmed = dnsName.trim();

    // Must end with .cfire
    if (!trimmed.endsWith('.cfire')) {
        return { valid: false, error: "DNS name format is invalid. Expected: Must end with '.cfire' (e.g., service1.cfire). The TLD must always be '.cfire'." };
    }

    // Must be at least "x.cfire" (minimum 7 characters)
    if (trimmed.length < 7) {
        return { valid: false, error: "DNS name format is invalid. Expected: At least 1 character before '.cfire' (minimum 7 characters total). Example: service1.cfire" };
    }

    // Extract the part before .cfire
    const hostname = trimmed.slice(0, -6); // Remove ".cfire"

    // Validate hostname part follows DNS rules
    // - Can contain lowercase letters, numbers, hyphens, and dots
    // - Cannot start or end with a hyphen or dot
    // - Cannot have consecutive dots
    // - Each label (between dots) must be 1-63 characters
    if (!/^[a-z0-9.\-]+$/.test(hostname)) {
        return { valid: false, error: "DNS name format is invalid. Expected: Only lowercase letters (a-z), numbers (0-9), dots (.), and hyphens (-) are allowed. Must end with '.cfire'. Example: service1.cfire" };
    }

    // Cannot start or end with hyphen or dot
    if (hostname.startsWith('-') || hostname.startsWith('.') ||
        hostname.endsWith('-') || hostname.endsWith('.')) {
        return { valid: false, error: "DNS name format is invalid. Expected: Cannot start or end with a hyphen (-) or dot (.). Must end with '.cfire'. Example: service1.cfire" };
    }

    // Cannot have consecutive dots
    if (hostname.includes('..')) {
        return { valid: false, error: "DNS name format is invalid. Expected: Cannot contain consecutive dots (..). Must end with '.cfire'. Example: service1.cfire" };
    }

    // Split by dots and validate each label
    const labels = hostname.split('.');
    for (const label of labels) {
        if (label.length === 0) {
            return { valid: false, error: "DNS name format is invalid. Expected: Cannot have empty parts between dots. Must end with '.cfire'. Example: service1.cfire" };
        }
        if (label.length > 63) {
            return { valid: false, error: "DNS name format is invalid. Expected: Each part (between dots) must be 63 characters or less. Must end with '.cfire'. Example: service1.cfire" };
        }
        if (label.startsWith('-') || label.endsWith('-')) {
            return { valid: false, error: "DNS name format is invalid. Expected: Each part cannot start or end with a hyphen (-). Must end with '.cfire'. Example: service1.cfire" };
        }
    }

    return { valid: true };
}

function validateNoDuplicates(formData) {
    const errors = [];

    // Check for duplicate images (normalize by removing prefix for comparison)
    const images = [];
    formData.instances.forEach((instance, idx) => {
        let image = instance.image.trim();
        // Normalize: remove prefix if present for comparison
        if (image.startsWith('ghcr.io/campfire-security/')) {
            image = image.replace('ghcr.io/campfire-security/', '');
        }
        if (image && image !== 'dummy') {
            if (images.includes(image)) {
                errors.push(`Duplicate image found: "${image}" is used in multiple services`);
            } else {
                images.push(image);
            }
        }
    });

    // Check for duplicate flag tags
    const flagTags = [];
    if (formData.flags) {
        formData.flags.forEach((flag, idx) => {
            const tag = flag.tag.trim();
            if (tag) {
                if (flagTags.includes(tag)) {
                    errors.push(`Duplicate flag tag found: "${tag}" is used in multiple flags`);
                } else {
                    flagTags.push(tag);
                }
            }
        });
    }

    // Check for duplicate DNS names across all services
    const dnsNames = [];
    if (!formData.static) {
        formData.instances.forEach((instance, serviceIdx) => {
            instance.dns.forEach((dns, dnsIdx) => {
                const dnsName = dns.name.trim();
                if (dnsName) {
                    if (dnsNames.includes(dnsName)) {
                        errors.push(`Duplicate DNS name found: "${dnsName}" is used in multiple services`);
                    } else {
                        dnsNames.push(dnsName);
                    }
                }
            });
        });
    }

    if (errors.length > 0) {
        return { valid: false, error: errors.join('\n') };
    }
    return { valid: true };
}

function updateTagPreview() {
    const category = sanitizeForText(document.getElementById('category').value);
    const tag = sanitizeForText(document.getElementById('tag').value);
    const prefix = categoryPrefixes[category] || 'we_';
    const preview = document.getElementById('tagPreview');

    if (tag) {
        preview.textContent = `Full tag: ${prefix}${tag}`;
    } else {
        preview.textContent = '';
    }
}

function getChallengeNameSlug() {
    const name = sanitizeForText(document.getElementById('name').value) || 'challenge-template';
    return name.toLowerCase().replace(/[^a-z0-9\-_]/g, '').replace(/\s+/g, '-');
}

// Initialize with one instance
document.addEventListener('DOMContentLoaded', function () {
    addInstance();
    // Don't add a flag by default - user will add as needed

    // Set up event listeners
    document.getElementById('category').addEventListener('change', updateTagPreview);
    document.getElementById('tag').addEventListener('input', updateTagPreview);
    document.getElementById('static').addEventListener('change', function () {
        updateAllInstancesForStatic();
    });
    document.getElementById('name').addEventListener('input', function () {
        updateAllInstanceImages();
        // Real-time validation
        const validation = validateChallengeName(this.value);
        if (!validation.valid && this.value.length > 0) {
            this.setCustomValidity(validation.error);
        } else {
            this.setCustomValidity('');
        }
    });

    document.getElementById('tag').addEventListener('input', function () {
        const validation = validateTag(this.value);
        if (!validation.valid && this.value.length > 0) {
            this.setCustomValidity(validation.error);
        } else {
            this.setCustomValidity('');
        }
    });

    updateTagPreview();
});

function addInstance() {
    const isStatic = document.getElementById('static').checked;

    // Prevent adding more services when static (only one dummy service allowed)
    if (isStatic) {
        const existingCards = document.querySelectorAll('.instance-card');
        if (existingCards.length > 0) {
            showAlert('Static challenges can only have one service (dummy). If this is not a static challenge, please uncheck the "Static" checkbox.', 'Static Challenge Restriction');
            return;
        }
    }

    instanceCounter++;
    const container = document.getElementById('instancesContainer');
    const instanceDiv = document.createElement('div');
    instanceDiv.className = 'instance-card';
    instanceDiv.id = `instance-${instanceCounter}`;
    const nameSlug = getChallengeNameSlug();
    const imageValue = isStatic ? 'dummy' : `${nameSlug}:service${instanceCounter}`;

    // Sanitize values before inserting into HTML
    const safeInstanceCounter = escapeHtml(String(instanceCounter));
    const safeImageValue = sanitizeForAttribute(imageValue);
    const safeNameSlug = sanitizeForAttribute(nameSlug);
    const staticAttr = isStatic ? 'style="display: none;"' : '';
    const readonlyAttr = isStatic ? 'readonly' : 'required';
    const requiredAttr = isStatic ? '' : 'required';

    const dockerImageHelp = isStatic
        ? 'Automatically set to "dummy" for static challenges'
        : 'Only enter the suffix (e.g., challenge-template:service1). Prefix "ghcr.io/campfire-security/" will be added automatically.';
    const dnsHelp = 'Must end with .cfire (e.g., service1.cfire). Lowercase letters, numbers, dots, and hyphens only.';

    instanceDiv.innerHTML = `
        <div class="instance-header">
            <h3>Service ${safeInstanceCounter}</h3>
            <button type="button" class="btn btn-danger" onclick="removeInstance(${safeInstanceCounter})" ${staticAttr}>Remove</button>
        </div>
        <div class="form-group">
            ${createLabelWithInfo(`Docker Image ${isStatic ? '(auto: dummy)' : '*'}`, dockerImageHelp)}
            <input type="text" class="instance-image" data-instance-id="${safeInstanceCounter}" 
                   value="${safeImageValue}" 
                   ${readonlyAttr} 
                   placeholder="${isStatic ? 'dummy' : 'challenge-template:service1'}">
        </div>
        <div class="form-group" ${staticAttr}>
            ${createLabelWithInfo('DNS Name *', dnsHelp)}
            <input type="text" class="dns-name" data-instance-id="${safeInstanceCounter}" placeholder="service1.cfire" ${requiredAttr} pattern="[a-z0-9.\-]+\.cfire$">
        </div>
    `;

    container.appendChild(instanceDiv);
}

function updateAllInstancesForStatic() {
    const isStatic = document.getElementById('static').checked;
    const container = document.getElementById('instancesContainer');
    const instanceCards = document.querySelectorAll('.instance-card');
    const addButton = container.parentElement.querySelector('button[onclick="addInstance()"]');

    if (isStatic) {
        // Remove all but the first service
        if (instanceCards.length > 1) {
            for (let i = instanceCards.length - 1; i > 0; i--) {
                instanceCards[i].remove();
            }
        }

        // Update the remaining service
        const firstCard = document.querySelector('.instance-card');
        if (firstCard) {
            const imageInput = firstCard.querySelector('.instance-image');
            const dnsInput = firstCard.querySelector('.dns-name');
            const dnsGroup = dnsInput ? dnsInput.closest('.form-group') : null;
            const removeButton = firstCard.querySelector('.btn-danger');

            if (imageInput) {
                imageInput.value = 'dummy';
                imageInput.readOnly = true;
                imageInput.required = false;
            }
            if (dnsGroup) {
                dnsGroup.style.display = 'none';
                if (dnsInput) {
                    dnsInput.value = '';
                    dnsInput.required = false;
                }
            }
            // Hide remove button for static services
            if (removeButton) {
                removeButton.style.display = 'none';
            }
        }

        // Hide the "Add Service" button when static
        if (addButton) {
            addButton.style.display = 'none';
        }
    } else {
        // Show DNS fields and update images
        instanceCards.forEach((card, index) => {
            const imageInput = card.querySelector('.instance-image');
            const dnsInput = card.querySelector('.dns-name');
            const dnsGroup = dnsInput ? dnsInput.closest('.form-group') : null;
            const removeButton = card.querySelector('.btn-danger');
            const nameSlug = getChallengeNameSlug();

            if (imageInput) {
                const safeNameSlug = sanitizeForAttribute(nameSlug);
                imageInput.value = `${safeNameSlug}:service${index + 1}`;
                imageInput.readOnly = false;
                imageInput.required = true;
            }
            if (dnsGroup) {
                dnsGroup.style.display = 'block';
                if (dnsInput) {
                    dnsInput.required = true;
                }
            }
            // Show remove button for non-static services
            if (removeButton) {
                removeButton.style.display = 'inline-block';
            }
        });

        // Show the "Add Service" button when not static
        if (addButton) {
            addButton.style.display = 'inline-block';
        }
    }
}

function updateAllInstanceImages() {
    const isStatic = document.getElementById('static').checked;
    if (isStatic) return; // Don't update if static

    const instanceCards = document.querySelectorAll('.instance-card');
    const nameSlug = getChallengeNameSlug();

    instanceCards.forEach((card, index) => {
        const imageInput = card.querySelector('.instance-image');
        if (imageInput && !imageInput.readOnly) {
            const currentValue = imageInput.value;
            // Only update if it matches the pattern (was auto-generated)
            if (currentValue.includes(':service')) {
                const safeNameSlug = sanitizeForAttribute(nameSlug);
                imageInput.value = `${safeNameSlug}:service${index + 1}`;
            }
        }
    });
}

function removeInstance(instanceId) {
    // Sanitize instanceId to prevent XSS
    const sanitizedId = String(instanceId).replace(/[^0-9]/g, '');
    if (!sanitizedId) {
        return;
    }

    const isStatic = document.getElementById('static').checked;

    // Prevent removing the only service when static
    if (isStatic) {
        const remainingCards = document.querySelectorAll('.instance-card');
        if (remainingCards.length <= 1) {
            showAlert('Static challenges must have exactly one service (dummy). Cannot remove the last service.', 'Cannot Remove Service');
            return;
        }
    }

    const instance = document.getElementById(`instance-${sanitizedId}`);
    if (instance) {
        instance.remove();
    }
}


function addFlag() {
    flagCounter++;
    const container = document.getElementById('flagsContainer');
    const flagDiv = document.createElement('div');
    flagDiv.className = 'flag-entry';
    flagDiv.id = `flag-${flagCounter}`;

    // Sanitize flag counter before inserting into HTML
    const safeFlagCounter = escapeHtml(String(flagCounter));

    flagDiv.innerHTML = `
        <div class="form-group">
            ${createLabelWithInfo('Flag Tag *', 'Lowercase letters, numbers, hyphens, and underscores only')}
            <input type="text" class="flag-tag" placeholder="challenge-template-1" required pattern="[a-z0-9\-_]+">
        </div>
        <div class="form-group">
            ${createLabelWithInfo('Flag Name *', 'Display name shown on the platform')}
            <input type="text" class="flag-name" placeholder="Challenge name" required>
        </div>
        <div class="form-group">
            ${createLabelWithInfo('Static Flag Value *', 'Must be FIRE{...} or DDC{...} format with 6-50 characters inside braces. Allowed characters: letters (a-z, A-Z), numbers (0-9), hyphens (-), underscores (_).\n\nExample flags:\n\n• FIRE{flag_here_in_1337speak}\n• DDC{h4nds_up_7h1s_15_4_r0pp3ry}\n• FIRE{771b2f7a-d8f2-48f9-856e-70a83c9dd65c}')}
            <input type="text" class="flag-static" placeholder="FIRE{flag_here_in_1337speak}" required pattern="^(FIRE|DDC)\{[a-zA-Z0-9\-_]{6,50}\}$">
        </div>
        <div class="form-group">
            ${createLabelWithInfo('Points *', 'Points awarded for capturing this flag')}
            <input type="number" class="flag-points" value="20" placeholder="20" min="0" required>
        </div>
        <div class="form-group">
            ${createLabelWithInfo('Category *', 'Category shown on the platform')}
            <select class="flag-category" required>
                <option value="Starters">Starters</option>
                <option value="Forensics">Forensics</option>
                <option value="Web exploitation" selected>Web exploitation</option>
                <option value="Cryptography">Cryptography</option>
                <option value="Boot 2 Root">Boot 2 Root</option>
                <option value="Reverse Engineering">Reverse Engineering</option>
                <option value="Binary (PWN)">Binary (PWN)</option>
                <option value="Misc">Misc</option>
                <option value="Operational Technologies">Operational Technologies</option>
            </select>
        </div>
        <div class="form-group" style="flex-basis: 100%;">
            ${createLabelWithInfo('Flag Description (TD) *', 'Description formatted in markdown. For static challenges, include links to handouts along with SHA256 checksums for verification.')}
            <textarea class="flag-td" rows="4" placeholder="Challenge description goes here in markdown format." required></textarea>
        </div>
        <button type="button" class="btn remove-btn" onclick="removeFlag(${safeFlagCounter})" style="align-self: flex-start;">Remove</button>
    `;

    container.appendChild(flagDiv);
}

function removeFlag(flagId) {
    // Sanitize flagId to prevent XSS
    const sanitizedId = String(flagId).replace(/[^0-9]/g, '');
    if (!sanitizedId) {
        return;
    }

    const flag = document.getElementById(`flag-${sanitizedId}`);
    if (flag) {
        flag.remove();
    }
}

function collectFormData() {
    // Sanitize all inputs when collecting form data
    const formData = {
        name: sanitizeForYaml(document.getElementById('name').value.trim()),
        category: sanitizeForYaml(document.getElementById('category').value),
        tag: sanitizeForYaml(document.getElementById('tag').value.trim()),
        static: document.getElementById('static').checked,
        od: sanitizeForYaml(document.getElementById('od').value),
        instances: []
    };

    // Collect instances
    const instanceCards = document.querySelectorAll('.instance-card');
    const isStatic = formData.static;

    instanceCards.forEach((card, index) => {
        const imageInput = card.querySelector('.instance-image');
        let imageValue = sanitizeForYaml(imageInput.value.trim());

        // For non-static, remove prefix if user included it
        if (!isStatic && imageValue.startsWith('ghcr.io/campfire-security/')) {
            imageValue = imageValue.replace('ghcr.io/campfire-security/', '');
        }

        const instance = {
            image: imageValue,
            dns: []
        };

        // Collect DNS entry (only one per service, only for non-static)
        if (!isStatic) {
            const dnsInput = card.querySelector('.dns-name');
            if (dnsInput) {
                const dnsName = sanitizeForYaml(dnsInput.value.trim());
                if (dnsName) {
                    instance.dns.push({
                        name: dnsName,
                        type: "A"  // Always use A record
                    });
                }
            }
        }

        formData.instances.push(instance);
    });

    // Collect flags from the separate flags container
    formData.flags = [];
    const flagEntries = document.querySelectorAll('#flagsContainer .flag-entry');
    flagEntries.forEach(flagEntry => {
        const tag = sanitizeForYaml(flagEntry.querySelector('.flag-tag').value.trim());
        if (tag) {
            formData.flags.push({
                tag: tag,
                name: sanitizeForYaml(flagEntry.querySelector('.flag-name').value),
                static: sanitizeForYaml(flagEntry.querySelector('.flag-static').value),
                points: parseInt(flagEntry.querySelector('.flag-points').value) || 20,
                category: sanitizeForYaml(flagEntry.querySelector('.flag-category').value),
                td: sanitizeForYaml(flagEntry.querySelector('.flag-td').value)
            });
        }
    });

    return formData;
}

// Generate YAML from form data (client-side)
function generateYamlFromData(formData) {
    try {
        // Get category and apply prefix to tag
        const category = formData.category;
        let tagSuffix = formData.tag.trim();
        const prefix = categoryPrefixes[category] || 'we_';

        // Remove existing prefix if present
        for (const [cat, pre] of Object.entries(categoryPrefixes)) {
            if (tagSuffix.startsWith(pre)) {
                tagSuffix = tagSuffix.substring(pre.length);
                break;
            }
        }

        // Build full tag with prefix
        const fullTag = prefix + tagSuffix;
        const isStatic = formData.static;

        // Build challenge structure (values already sanitized in collectFormData)
        const challenge = {
            name: sanitizeForYaml(formData.name),
            tag: sanitizeForYaml(fullTag),
            static: isStatic,
            secret: true,
            od: sanitizeForYaml(formData.od),
            instance: []
        };

        // Process instances
        const challengeNameSlug = formData.name.toLowerCase()
            .replace(/[^a-z0-9\-_]/g, '')
            .replace(/\s+/g, '-') || 'challenge-template';

        formData.instances.forEach((instanceData, idx) => {
            let instance;

            if (isStatic) {
                instance = { image: 'dummy' };
            } else {
                let imageSuffix = sanitizeForYaml(instanceData.image.trim());
                if (!imageSuffix) {
                    imageSuffix = `${challengeNameSlug}:service${idx + 1}`;
                }
                instance = {
                    image: `ghcr.io/campfire-security/${imageSuffix}`
                };

                // Process DNS entry (only one per service) - only add if DNS is provided
                if (instanceData.dns && instanceData.dns.length > 0) {
                    const dnsEntry = instanceData.dns[0];
                    if (dnsEntry.name && dnsEntry.name.trim()) {
                        instance.dns = [{
                            name: sanitizeForYaml(dnsEntry.name.trim()),
                            type: 'A'
                        }];
                    }
                }
                // If no DNS provided, don't add dns field at all
            }

            challenge.instance.push(instance);
        });

        // Add flags to the last service (or create a new service entry if no services exist)
        if (formData.flags && formData.flags.length > 0) {
            const flags = formData.flags.map(flagData => ({
                tag: sanitizeForYaml(flagData.tag.trim()),
                name: sanitizeForYaml(flagData.name),
                static: sanitizeForYaml(flagData.static),
                points: parseInt(flagData.points) || 20,
                category: sanitizeForYaml(flagData.category),
                td: sanitizeForYaml(flagData.td)
            }));

            // Add flags to the last service entry
            if (challenge.instance.length > 0) {
                challenge.instance[challenge.instance.length - 1].flags = flags;
            } else {
                // If no services, create a dummy service for flags
                challenge.instance.push({
                    image: isStatic ? 'dummy' : `ghcr.io/campfire-security/${challengeNameSlug}:service1`,
                    flags: flags
                });
            }
        }

        // Convert to YAML with proper formatting
        let yaml = jsyaml.dump(challenge, {
            lineWidth: -1,
            noRefs: true,
            sortKeys: false,
            quotingType: '"',
            forceQuotes: false
        });

        // Replace "|-" with "|" for od and td fields (literal block scalars without strip)
        // Handle both "od: |-" and "od:|-" formats
        yaml = yaml.replace(/^(\s*)od:\s*\|\-/gm, '$1od: |');
        yaml = yaml.replace(/^(\s*)td:\s*\|\-/gm, '$1td: |');
        // Also handle nested td fields (inside flags)
        yaml = yaml.replace(/(\s+)td:\s*\|\-/g, '$1td: |');

        return yaml;
    } catch (error) {
        throw new Error('Failed to generate YAML: ' + error.message);
    }
}

function previewYaml() {
    const formData = collectFormData();

    // Validation
    const nameValidation = validateChallengeName(formData.name);
    if (!nameValidation.valid) {
        showAlert(nameValidation.error, 'Validation Error');
        return;
    }

    const tagValidation = validateTag(formData.tag);
    if (!tagValidation.valid) {
        showAlert(tagValidation.error, 'Validation Error');
        return;
    }

    if (!formData.od || formData.od.trim().length === 0) {
        showAlert('Please fill in the challenge description', 'Missing Information');
        return;
    }

    // Validate services
    if (formData.instances.length === 0) {
        showAlert('Please add at least one service', 'Missing Service');
        return;
    }

    // Validate static: only one service allowed when static
    if (formData.static && formData.instances.length > 1) {
        showAlert('Static challenges can only have one service (dummy). Please remove extra services.', 'Too Many Services');
        return;
    }

    // Validate flags - at least one flag required
    if (!formData.flags || formData.flags.length === 0) {
        showAlert('Please add at least one flag', 'Missing Flag');
        return;
    }

    for (let j = 0; j < formData.flags.length; j++) {
        const flag = formData.flags[j];
        const flagTagValidation = validateFlagTag(flag.tag);
        if (!flagTagValidation.valid) {
            showAlert(`Flag ${j + 1} - Tag: ${flagTagValidation.error}`, 'Validation Error');
            return;
        }
        const flagStaticValidation = validateFlagStatic(flag.static);
        if (!flagStaticValidation.valid) {
            showAlert(`Flag ${j + 1} - Flag Value: ${flagStaticValidation.error}`, 'Validation Error');
            return;
        }
    }

    // Validate DNS entries for non-static services (max one per service)
    if (!formData.static) {
        for (let i = 0; i < formData.instances.length; i++) {
            const instance = formData.instances[i];
            if (instance.dns.length > 1) {
                showAlert(`Service ${i + 1} can only have one DNS entry. Please remove extra DNS entries.`, 'Too Many DNS Entries');
                return;
            }
            for (let j = 0; j < instance.dns.length; j++) {
                const dns = instance.dns[j];
                const dnsValidation = validateDnsName(dns.name);
                if (!dnsValidation.valid) {
                    showAlert(`Service ${i + 1}, DNS Entry: ${dnsValidation.error}`, 'Validation Error');
                    return;
                }
            }
        }
    }

    // Check for duplicates (images, flag tags, DNS names)
    const duplicateValidation = validateNoDuplicates(formData);
    if (!duplicateValidation.valid) {
        showAlert(duplicateValidation.error, 'Duplicate Values Found');
        return;
    }

    try {
        const yaml = generateYamlFromData(formData);
        previewYamlData = formData;
        document.getElementById('yamlPreview').textContent = yaml;
        document.getElementById('previewModal').style.display = 'block';
    } catch (error) {
        showAlert(error.message, 'Error Generating Preview');
    }
}

function generateYaml() {
    const formData = collectFormData();

    // Validation (same as preview)
    const nameValidation = validateChallengeName(formData.name);
    if (!nameValidation.valid) {
        showAlert(nameValidation.error, 'Validation Error');
        return;
    }

    const tagValidation = validateTag(formData.tag);
    if (!tagValidation.valid) {
        showAlert(tagValidation.error, 'Validation Error');
        return;
    }

    if (!formData.od || formData.od.trim().length === 0) {
        showAlert('Please fill in the challenge description', 'Missing Information');
        return;
    }

    // Validate services
    if (formData.instances.length === 0) {
        showAlert('Please add at least one service', 'Missing Service');
        return;
    }

    // Validate static: only one service allowed when static
    if (formData.static && formData.instances.length > 1) {
        showAlert('Static challenges can only have one service (dummy). Please remove extra services.', 'Too Many Services');
        return;
    }

    // Validate flags - at least one flag required
    if (!formData.flags || formData.flags.length === 0) {
        showAlert('Please add at least one flag', 'Missing Flag');
        return;
    }

    for (let j = 0; j < formData.flags.length; j++) {
        const flag = formData.flags[j];
        const flagTagValidation = validateFlagTag(flag.tag);
        if (!flagTagValidation.valid) {
            showAlert(`Flag ${j + 1} - Tag: ${flagTagValidation.error}`, 'Validation Error');
            return;
        }
        const flagStaticValidation = validateFlagStatic(flag.static);
        if (!flagStaticValidation.valid) {
            showAlert(`Flag ${j + 1} - Flag Value: ${flagStaticValidation.error}`, 'Validation Error');
            return;
        }
    }

    // Validate DNS entries for non-static services (max one per service)
    if (!formData.static) {
        for (let i = 0; i < formData.instances.length; i++) {
            const instance = formData.instances[i];
            if (instance.dns.length > 1) {
                showAlert(`Service ${i + 1} can only have one DNS entry. Please remove extra DNS entries.`, 'Too Many DNS Entries');
                return;
            }
            for (let j = 0; j < instance.dns.length; j++) {
                const dns = instance.dns[j];
                const dnsValidation = validateDnsName(dns.name);
                if (!dnsValidation.valid) {
                    showAlert(`Service ${i + 1}, DNS Entry: ${dnsValidation.error}`, 'Validation Error');
                    return;
                }
            }
        }
    }

    // Check for duplicates (images, flag tags, DNS names)
    const duplicateValidation = validateNoDuplicates(formData);
    if (!duplicateValidation.valid) {
        showAlert(duplicateValidation.error, 'Duplicate Values Found');
        return;
    }

    try {
        const yaml = generateYamlFromData(formData);
        const blob = new Blob([yaml], { type: 'application/x-yaml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'challenge.yml';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        showAlert(error.message, 'Error Generating YAML');
    }
}

function downloadFromPreview() {
    if (previewYamlData) {
        generateYaml();
        closePreview();
    }
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
}

function resetForm() {
    showConfirm('Are you sure you want to reset the form? All data will be lost.', 'Reset Form', function (result) {
        if (result) {
            document.getElementById('challengeForm').reset();
            document.getElementById('instancesContainer').innerHTML = '';
            document.getElementById('flagsContainer').innerHTML = '';
            instanceCounter = 0;
            flagCounter = 0;
            addInstance();
        }
    });
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('previewModal');
    if (event.target == modal) {
        closePreview();
    }
}

