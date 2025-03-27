document.addEventListener('DOMContentLoaded', async () => {
    const LOGIN_URL = "/Luma-Social-Media-Platform/Front-end/pages/login.html";
    const BASE_URL = "http://localhost:8080/api/v1";

    const handleAuthError = async (message) => {
        await Swal.fire({
            title: "Access Denied!",
            text: message,
            icon: "error",
            draggable: false
        });
        sessionStorage.removeItem('authData');
        window.location.href = LOGIN_URL;
    };

    const authData = JSON.parse(sessionStorage.getItem('authData'));

    function isTokenExpired(token) {
        try {
            const {exp} = jwt_decode(token);
            return Date.now() >= exp * 1000; // Correct if `exp` is in seconds
        } catch (error) {
            return true; // Treat invalid tokens as expired
        }
    }

    function getRoleFromToken(token) {
        try {
            const decoded = jwt_decode(token);

            // Check different possible claim names for role
            return decoded.role ||
                decoded.roles?.[0] || // if it's an array
                decoded.authorities?.[0]?.replace('ROLE_', '') || // Spring format
                null;
        } catch (error) {
            throw error;
        }
    }

    if (authData?.token) {
        try {
            // Check token expiration first
            if (isTokenExpired(authData.token)) {
                await refreshAuthToken();
            }
            initializeUI();
            initializeRoleBasedAccess(getRoleFromToken(authData.token));
            initializeLogout();
        } catch (error) {
            await handleAuthError("Session expired. Please log in again.");
        }
    } else {
        await handleAuthError("You need to log in to access this page.");
    }

    async function refreshAuthToken() {
        try {
            const authData = JSON.parse(sessionStorage.getItem('authData'));

            // Send refreshToken in the request body
            const response = await fetch(`${BASE_URL}/auth/refreshToken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Required for JSON body
                },
                body: JSON.stringify({
                    refreshToken: authData.token // Use the token from storage
                })
            });

            if (!response.ok) throw new Error('Refresh failed');

            // Parse the response and extract the new access token from data
            const responseData = await response.json();
            const newAccessToken = responseData.data.token;

            // Update the stored access token
            const newAuthData = {...authData, token: newAccessToken};
            sessionStorage.setItem('authData', JSON.stringify(newAuthData));

            return newAccessToken;
        } catch (error) {
            throw error;
        }
    }

    function initializeRoleBasedAccess(roleFromToken) {
        if (roleFromToken !== 'ADMIN') {
            document.getElementById('adminButton').classList.add('d-none');
            document.getElementById('adminPushNotificationsTitle').classList.add('d-none');
            document.getElementById('adminPushNotificationsItem').classList.add('d-none');
        }
    }

    function initializeLogout() {
        const logoutButton = document.getElementById('logoutButton');
        logoutButton.addEventListener('click', async () => {
            try {
                sessionStorage.removeItem('authData');
                window.location.href = LOGIN_URL;
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: "Logout Failed",
                    text: error.message
                });
            }
        });
    }

    function initializeUI() {

        // Toast configuration
        const Toast = Swal.mixin({
            toast: true,
            position: "bottom-end",
            iconColor: "white",
            customClass: {
                popup: "colored-toast",
            },
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
        });

        // Initialize
        loadUserData();
        initLocationAutocomplete();
        setupFormValidation();

        let initialEmail = null;

        // Verify Email Button Appearance
        document.getElementById('email').addEventListener('input', function () {
            const verifyButton = document.querySelector('.verify-button');
            if (this.value !== initialEmail) {
                verifyButton.classList.remove('d-none');
                verifyButton.disabled = false;
                verifyButton.innerHTML = 'Verify';
                document.getElementById('email').classList.remove('is-valid');
            } else {
                verifyButton.classList.add('d-none');
                verifyButton.disabled = true;
                document.getElementById('email').classList.add('is-valid');
            }
        });

        // Load user data
        async function loadUserData() {
            try {
                const response = await fetch(`${BASE_URL}/settings/account`, {
                    headers: {
                        'Authorization': `Bearer ${authData.token}`
                    }
                });
                const responseData = await response.json();

                if (responseData.code === 200 || responseData.code === 201) {
                    const user = responseData.data;

                    initialEmail = user.email;
                    const verifyButton = document.querySelector('.verify-button');
                    verifyButton.classList.add('d-none');
                    verifyButton.disabled = true;
                    document.getElementById('email').classList.add('is-valid');

                    // Populate form fields
                    document.getElementById('firstName').value = user.firstName;
                    document.getElementById('lastName').value = user.lastName;
                    document.getElementById('email').value = user.email;
                    document.getElementById('phone').value = user.phoneNumber;
                    document.getElementById('location').value = user.location;
                    document.getElementById('bio').value = user.bio;
                    document.getElementById('gender').value = user.gender?.toLowerCase();
                    document.getElementById('birthday').value = user.birthday;

                    // Clear existing entries first
                    document.getElementById('educationContainer').innerHTML = '';
                    document.getElementById('workContainer').innerHTML = '';

                    // Populate Education
                    if (user.education && user.education.length > 0) {
                        user.education.forEach((edu, index) => {
                            const educationEntry = document.createElement("div");
                            educationEntry.classList.add("education-entry");

                            // Only add close button if it's not the first entry
                            const closeButton = index === 0 ? '' : `<i class="fas fa-times remove-entry"></i>`;

                            educationEntry.innerHTML = `
                        ${closeButton}
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control" 
                                           value="${edu.institution || ''}" 
                                           placeholder="School/University name" />
                                    <label>School/University</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control" 
                                           value="${edu.fieldOfStudy || ''}" 
                                           placeholder="Degree/Field of study" />
                                    <label>Degree/Field of Study</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control education-date" 
                                           value="${edu.startDate || ''}" 
                                           placeholder="Start date" />
                                    <label>Start Date</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control education-date" 
                                           value="${edu.endDate || ''}" 
                                           placeholder="End date" />
                                    <label>End Date</label>
                                </div>
                            </div>
                        </div>
                    `;
                            document.getElementById("educationContainer").appendChild(educationEntry);

                            // Initialize date pickers
                            educationEntry.querySelectorAll(".education-date").forEach((input) => {
                                flatpickr(input, {
                                    dateFormat: "Y-m-d",
                                    maxDate: "today",
                                });
                            });
                        });
                    } else {
                        document.getElementById("educationContainer").innerHTML = `
        <div class="education-entry">
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control" placeholder="School/University name" />
                        <label>School/University</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control" placeholder="Degree/Field of study" />
                        <label>Degree/Field of Study</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control education-date" placeholder="Start date" />
                        <label>Start Date</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control education-date" placeholder="End date" />
                        <label>End Date</label>
                    </div>
                </div>
            </div>
        </div>
    `;
                    }

                    // Populate Work Experience
                    if (user.workExperience && user.workExperience.length > 0) {
                        user.workExperience.forEach((work, index) => {
                            const workEntry = document.createElement("div");
                            workEntry.classList.add("work-entry");

                            // Only add close button if it's not the first entry
                            const closeButton = index === 0 ? '' : `<i class="fas fa-times remove-entry"></i>`;

                            workEntry.innerHTML = `
                        ${closeButton}
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control" 
                                           value="${work.company || ''}" 
                                           placeholder="Company name" />
                                    <label>Company</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control" 
                                           value="${work.jobTitle || ''}" 
                                           placeholder="Job title" />
                                    <label>Job Title</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control work-date" 
                                           value="${work.startDate || ''}" 
                                           placeholder="Start date" />
                                    <label>Start Date</label>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-floating">
                                    <input type="text" class="form-control work-date" 
                                           value="${work.endDate || ''}" 
                                           placeholder="End date" />
                                    <label>End Date</label>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="form-floating">
                                    <textarea class="form-control" style="height: 100px" 
                                              placeholder="Description">${work.description || ''}</textarea>
                                    <label>Description</label>
                                </div>
                            </div>
                        </div>
                    `;
                            document.getElementById("workContainer").appendChild(workEntry);

                            // Initialize date pickers
                            workEntry.querySelectorAll(".work-date").forEach((input) => {
                                flatpickr(input, {
                                    dateFormat: "Y-m-d",
                                    maxDate: "today",
                                });
                            });
                        });
                    } else {
                        document.getElementById("workContainer").innerHTML = `
        <div class="work-entry">
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control" placeholder="Company name" />
                        <label>Company</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control" placeholder="Job title" />
                        <label>Job Title</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control work-date" placeholder="Start date" />
                        <label>Start Date</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control work-date" placeholder="End date" />
                        <label>End Date</label>
                    </div>
                </div>
                <div class="col-12">
                    <div class="form-floating">
                        <textarea class="form-control" style="height: 100px" placeholder="Description"></textarea>
                        <label>Description</label>
                    </div>
                </div>
            </div>
        </div>
    `;
                    }

                    // Set privacy toggles
                    document.getElementById('profileVisibility').checked = user.isProfilePublic;
                    document.getElementById('showEmail').checked = user.isDisplayEmail;
                    document.getElementById('showPhone').checked = user.isDisplayPhone;
                    document.getElementById('showBirthday').checked = user.isDisplayBirthdate;
                    document.getElementById('showActivity').checked = user.isShowActivity;
                    document.getElementById('defaultPostPrivacy').checked = user.isPostPublic;
                    document.getElementById('allowSharing').checked = user.isShareAllowed;

                    // Set notification toggles
                    document.getElementById('newFollower').checked = user.isPushNewFollowers;
                    document.getElementById('postLikes').checked = user.isPushPostLikes;
                    document.getElementById('comments').checked = user.isPushPostComments;
                    document.getElementById('shares').checked = user.isPushPostShares;
                    document.getElementById('directMessages').checked = user.isPushMessages;
                    document.getElementById('reportAlerts').checked = user.isPushReports;

                    // Set 2FA toggle
                    document.getElementById('twoFactor').checked = user.enable2fa;

                    return;
                } else {
                    await Toast.fire({
                        icon: "error",
                        title: responseData.message
                    });
                    return
                }
            } catch (error) {
                await Toast.fire({
                    icon: "error",
                    title: error.message || "Failed to load user data"
                });
            }
        }

        // Account Settings Form
        const accountForm = document.getElementById("accountForm");
        if (accountForm) {
            accountForm.addEventListener("submit", async function (e) {
                e.preventDefault();

                // 1. First check email verification
                if (!document.getElementById('email').classList.contains("is-valid")) {
                    await Toast.fire({
                        icon: "error",
                        title: "Email is not verified!"
                    });
                    return;
                }

                // 2. Then validate all fields
                if (!validateAllFields()) {
                    scrollToFirstError();
                    showErrorSummary();
                    return;
                }

                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

                try {
                    // Collect education entries
                    const educationEntries = [];
                    document.querySelectorAll('.education-entry').forEach(entry => {
                        const inputs = entry.querySelectorAll('input, textarea');
                        educationEntries.push({
                            institution: inputs[0].value,
                            fieldOfStudy: inputs[1].value,
                            startDate: inputs[2].value,
                            endDate: inputs[3].value
                        });
                    });

                    // Collect work experience entries
                    const workEntries = [];
                    document.querySelectorAll('.work-entry').forEach(entry => {
                        const inputs = entry.querySelectorAll('input, textarea');
                        workEntries.push({
                            company: inputs[0].value,
                            jobTitle: inputs[1].value,
                            startDate: inputs[2].value,
                            endDate: inputs[3].value,
                            description: inputs[4].value
                        });
                    });

                    // Prepare the complete data object
                    const formData = {
                        firstName: document.getElementById('firstName').value,
                        lastName: document.getElementById('lastName').value,
                        email: document.getElementById('email').value,
                        phoneNumber: document.getElementById('phone').value,
                        location: document.getElementById('location').value,
                        bio: document.getElementById('bio').value,
                        gender: document.getElementById('gender').value.toUpperCase(),
                        birthday: document.getElementById('birthday').value,
                        education: educationEntries,
                        workExperience: workEntries
                    };
                    const response = await fetch(`${BASE_URL}/settings/account`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authData.token}`
                        },
                        body: JSON.stringify(formData)
                    });

                    const responseData = await response.json();

                    if (responseData.code === 200 || responseData.code === 201) {
                        await Toast.fire({
                            icon: "success",
                            title: responseData.message
                        });
                    } else {
                        await Toast.fire({
                            icon: "error",
                            title: responseData.message
                        });
                    }
                } catch (error) {
                    await Toast.fire({
                        icon: "error",
                        title: error.message || "Failed to update settings"
                    });
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        }

        function validateAllFields() {
            let isValid = true;

            // Validate static fields
            const staticFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'bio', 'gender'];
            staticFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    const event = { target: field };
                    if (!validateField(event)) {
                        isValid = false;
                    }
                }
            });

            // Validate dynamic fields (education/work)
            document.querySelectorAll('#educationContainer input, #workContainer input').forEach(field => {
                if (field.value.trim() && !validateDynamicField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        function validateDynamicField(field) {
            // Add specific validation for dynamic fields if needed
            return true; // Default to valid if no special validation
        }

        function scrollToFirstError() {
            const firstError = document.querySelector('.input-error');
            if (firstError) {
                firstError.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                firstError.focus();
            }
        }

        function showErrorSummary() {
            const errorMessages = [];
            document.querySelectorAll('.validation-message').forEach(el => {
                if (el.style.display === 'block') {
                    errorMessages.push(el.textContent);
                }
            });

            if (errorMessages.length > 0) {
                Toast.fire({
                    icon: 'error',
                    title: 'Form Errors'
                })
            }
        }

        // Privacy Settings
        const privacyToggles = document.querySelectorAll("#privacy .form-check-input");
        privacyToggles.forEach(toggle => {
            toggle.addEventListener("change", async function () {
                try {
                    const response = await fetch(`${BASE_URL}/settings/privacy`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authData.token}`
                        },
                        body: JSON.stringify({
                            isProfilePublic: document.getElementById('profileVisibility').checked,
                            isDisplayEmail: document.getElementById('showEmail').checked,
                            isDisplayPhone: document.getElementById('showPhone').checked,
                            isDisplayBirthdate: document.getElementById('showBirthday').checked,
                            isShowActivity: document.getElementById('showActivity').checked,
                            isPostPublic: document.getElementById('defaultPostPrivacy').checked,
                            isShareAllowed: document.getElementById('allowSharing').checked
                        })
                    });

                    const responseData = await response.json();

                    if (responseData.code === 200 || responseData.code === 201) {
                        await Toast.fire({
                            icon: "success",
                            title: responseData.message
                        });
                        return;
                    } else {
                        await Toast.fire({
                            icon: "error",
                            title: responseData.message
                        });
                        return
                    }
                } catch (error) {
                    this.checked = !this.checked;
                    await Toast.fire({
                        icon: "error",
                        title: error.message || "Failed to update privacy settings"
                    });
                }
            });
        });

        // Notification Settings
        const notificationToggles = document.querySelectorAll("#notifications .form-check-input");

        notificationToggles.forEach(toggle => {
            toggle.addEventListener("change", async function () {
                try {
                    const response = await fetch(`${BASE_URL}/settings/notifications`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authData.token}`
                        },
                        body: JSON.stringify({
                            isPushNewFollowers: document.getElementById('newFollower').checked,
                            isPushMessages: document.getElementById('directMessages').checked,
                            isPushPostLikes: document.getElementById('postLikes').checked,
                            isPushPostComments: document.getElementById('comments').checked,
                            isPushPostShares: document.getElementById('shares').checked,
                            isPushReports: document.getElementById('reportAlerts').checked
                        })
                    });

                    const responseData = await response.json();

                    if (responseData.code === 200 || responseData.code === 201) {
                        await Toast.fire({
                            icon: "success",
                            title: responseData.message
                        });
                        return;
                    } else {
                        await Toast.fire({
                            icon: "error",
                            title: responseData.message
                        });
                        return
                    }
                } catch (error) {
                    this.checked = !this.checked;
                    await Toast.fire({
                        icon: "error",
                        title: error.message || "Failed to update notification settings"
                    });
                }
            });
        });

        // Toggle password visibility
        const togglePasswordButtons = document.querySelectorAll(".toggle-password");
        togglePasswordButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const passwordInput =
                    this.closest(".password-field").querySelector("input");
                const icon = this.querySelector("i");

                if (passwordInput.type === "password") {
                    passwordInput.type = "text";
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                } else {
                    passwordInput.type = "password";
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            });
        });

        // Password strength meter with requirements check
        const passwordInput = document.getElementById("newPassword");
        if (passwordInput) {
            passwordInput.addEventListener("input", function () {
                const password = this.value;
                const progressBar = document.querySelector(
                    ".password-strength .progress-bar"
                );
                const strengthText = document.getElementById("strengthText");

                if (!progressBar || !strengthText) return;

                // Check password requirements
                const requirements = {
                    length: password.length >= 8,
                    uppercase: /[A-Z]/.test(password),
                    lowercase: /[a-z]/.test(password),
                    number: /[0-9]/.test(password),
                    special: /[^A-Za-z0-9]/.test(password),
                };

                // Update requirement indicators
                Object.entries(requirements).forEach(([req, met]) => {
                    const reqElement = document.querySelector(`[data-requirement="${req}"]`);
                    if (reqElement) {
                        const icon = reqElement.querySelector("i");

                        reqElement.classList.toggle("met", met);
                        reqElement.classList.toggle("unmet", !met);

                        if (met) {
                            icon.classList.remove("fa-times-circle");
                            icon.classList.add("fa-check-circle");
                        } else {
                            icon.classList.remove("fa-check-circle");
                            icon.classList.add("fa-times-circle");
                        }
                    }
                });

                // Calculate strength based on requirements
                let strength = 0;
                let status = "";

                // Length check
                if (requirements.length) strength += 25;

                // Lowercase check
                if (requirements.lowercase) strength += 25;

                // Uppercase check
                if (requirements.uppercase) strength += 25;

                // Number/Special character check
                if (requirements.number || requirements.special) strength += 25;

                // Update progress bar
                progressBar.style.width = strength + "%";

                // Update progress bar color and text
                if (strength <= 25) {
                    progressBar.className = "progress-bar bg-danger";
                    status = "weak";
                } else if (strength <= 50) {
                    progressBar.className = "progress-bar bg-warning";
                    status = "fair";
                } else if (strength <= 75) {
                    progressBar.className = "progress-bar bg-info";
                    status = "good";
                } else {
                    progressBar.className = "progress-bar bg-success";
                    status = "strong";
                }

                strengthText.textContent = status;
                strengthText.className = `strength-${status}`;
            });
        }

        // Password Update Form
        const passwordForm = document.getElementById("passwordForm");
        if (passwordForm) {
            passwordForm.addEventListener("submit", async function (e) {
                e.preventDefault();

                const newPassword = document.getElementById("newPassword").value;
                const confirmPassword = document.getElementById("confirmPassword").value;

                if (newPassword !== confirmPassword) {
                    await Toast.fire({
                        icon: "error",
                        title: "Passwords do not match"
                    });
                    return;
                }

                // Check if all password requirements are met
                const requirements = {
                    length: newPassword.length >= 8,
                    uppercase: /[A-Z]/.test(newPassword),
                    lowercase: /[a-z]/.test(newPassword),
                    number: /[0-9]/.test(newPassword),
                    special: /[^A-Za-z0-9]/.test(newPassword),
                };

                const allRequirementsMet = Object.values(requirements).every(Boolean);

                if (!allRequirementsMet) {
                    await Toast.fire({
                        icon: "error",
                        title: "Password doesn't meet all requirements"
                    });
                    return;
                }

                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Updating...';

                try {
                    const response = await fetch(`${BASE_URL}/settings/security/changePassword`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authData.token}`
                        },
                        body: JSON.stringify({
                            currentPassword: document.getElementById("currentPassword").value,
                            newPassword: newPassword
                        })
                    });

                    const responseData = await response.json();

                    if (responseData.code === 200 || responseData.code === 201) {
                        await Toast.fire({
                            icon: "success",
                            title: responseData.message
                        });
                        this.reset();
                        return
                    } else {
                        await Toast.fire({
                            icon: "error",
                            title: responseData.message
                        });
                        return
                    }
                } catch (error) {
                    await Toast.fire({
                        icon: "error",
                        title: error.message || "Failed to change password"
                    });
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        }

        // Two-Factor Authentication Toggle
        const twoFactorToggle = document.getElementById("twoFactor");
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener("change", async function () {
                try {
                    const response = await fetch(`${BASE_URL}/settings/security/2fa`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authData.token}`
                        },
                        body: JSON.stringify({
                            enabled: this.checked
                        })
                    });

                    const responseData = await response.json();

                    if (responseData.code === 200 || responseData.code === 201) {
                        await Toast.fire({
                            icon: "success",
                            title: responseData.message
                        });
                        return
                    } else {
                        await Toast.fire({
                            icon: "error",
                            title: responseData.message
                        });
                        return
                    }
                } catch (error) {
                    this.checked = !this.checked;
                    await Toast.fire({
                        icon: "error",
                        title: error.message || "Failed to update 2FA settings"
                    });
                }
            });
        }

        // Account Deactivation
        const deactivateBtn = document.querySelector(".danger-zone button");

        if (deactivateBtn) {
            deactivateBtn.addEventListener("click", async function () {
                const result = await Swal.fire({
                    title: 'Are you sure?',
                    text: "This action cannot be undone!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, deactivate it!'
                });

                if (result.isConfirmed) {
                    this.disabled = true;
                    this.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Deactivating...';

                    try {
                        const response = await fetch(`${BASE_URL}/settings/security/deactivate`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${authData.token}`
                            }
                        });

                        const responseData = await response.json();

                        if (responseData.code === 200 || responseData.code === 201) {
                            sessionStorage.removeItem('authData'); // Clear session data
                            window.location.href = LOGIN_URL; // Redirect to login
                        } else {
                            await Toast.fire({
                                icon: "error",
                                title: responseData.message
                            });
                        }
                    } catch (error) {
                        await Toast.fire({
                            icon: "error",
                            title: error.message || "Failed to deactivate account"
                        });
                    } finally {
                        this.disabled = false;
                        this.innerHTML = 'Deactivate Account';
                    }
                }
            });
        }


        // Initialize date pickers
        flatpickr("#birthday", {
            dateFormat: "Y-m-d",
            maxDate: "today"
        });

        flatpickr(".education-date", {
            dateFormat: "Y-m-d",
            maxDate: "today"
        });

        flatpickr(".work-date", {
            dateFormat: "Y-m-d",
            maxDate: "today"
        });

        // Email verification
        let timerInterval;
        let otpCode = null;
        let emailToVerify = null;

// OTP Input Handling for modal
        const otpInputs = document.querySelectorAll("#otpModal .otp-inputs input");
        otpInputs.forEach((input, index) => {
            input.addEventListener("input", (e) => {
                if (e.target.value) {
                    if (index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                }
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
        });

// Timer Function
        function startTimer() {
            let timeLeft = 60;
            const timerDisplay = document.getElementById("timer");
            const resendBtn = document.getElementById("resendOtpBtn");

            clearInterval(timerInterval);
            resendBtn.disabled = true;
            timerInterval = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    resendBtn.disabled = false;
                }
            }, 1000);
        }

//Verify Button Handler
        document.querySelector(".verify-button").addEventListener("click", function () {
            const email = document.getElementById("email").value;
            if (!email) return;

            emailToVerify = email;
            const btn = this;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

            sendOTP(email)
                .then(() => {
                    const otpModal = new bootstrap.Modal('#otpModal');
                    otpModal.show();
                    otpInputs[0].focus();
                })
                .catch((error) => {
                    btn.disabled = false;
                    btn.innerHTML = 'Verify';
                    Toast.fire({icon: 'error', title: error.message});
                });
        });

// Send OTP Function
        async function sendOTP(email) {
            console.log(email)
            try {
                const response = await fetch("http://localhost:8080/api/v1/settings/sendOtpCode", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.token}`
                    },
                    body: JSON.stringify({email})
                });

                const data = await response.json();
                if (data.code === 200 || data.code === 201) {
                    Toast.fire({icon: 'success', title: data.message});
                    otpCode = data.data;
                    startTimer();
                    return true;
                }
                throw new Error(data.message || "Failed to send OTP");
            } catch (error) {
                throw new Error(error.message || "OTP sending failed");
            }
        }

// Verify OTP Handler
        document.getElementById("verifyOtpBtn").addEventListener("click", async function () {
            const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');
            if (enteredOtp.length !== 6) return;

            const btn = this;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying...';

            if (enteredOtp == otpCode) {
                Toast.fire({icon: 'success', title: 'Email verified!'});
                document.getElementById('email').classList.add('is-valid');
                document.querySelector('.verify-button').classList.add('d-none');
                initialEmail = document.getElementById('email').value;
                bootstrap.Modal.getInstance('#otpModal').hide();
            } else {
                Toast.fire({icon: 'error', title: 'Invalid OTP'});
                otpInputs.forEach(input => input.value = "");
            }
            btn.disabled = false;
            btn.innerHTML = 'Verify OTP';
        });

// Resend OTP Handler
        document.getElementById("resendOtpBtn").addEventListener("click", function () {
            if (!emailToVerify) return;
            this.disabled = true;
            otpInputs.forEach(input => input.value = "");
            sendOTP(emailToVerify);
        });

        // Reset Verify Button State When Closing Modal
        document.getElementById('otpModal').addEventListener('hidden.bs.modal', function () {
            const verifyBtn = document.querySelector('.verify-button');
            if (verifyBtn && verifyBtn.disabled) {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = 'Verify';
            }
        });

        // Add education entry
        document
            .getElementById("addEducation")
            .addEventListener("click", function () {
                // Create a new div for education entry
                const educationEntry = document.createElement("div");
                educationEntry.classList.add("education-entry");

                // Add inner HTML for the new education entry
                educationEntry.innerHTML = `
      <i class="fas fa-times remove-entry"></i>
                            <div class="row g-3">
                              <div class="col-md-6">
                                <div class="form-floating">
                                  <input type="text" class="form-control" placeholder="School/University name" />
                                  <label>School/University</label>
                                </div>
                              </div>
                              <div class="col-md-6">
                                <div class="form-floating">
                                  <input type="text" class="form-control" placeholder="Degree/Field of study" />
                                  <label>Degree/Field of Study</label>
                                </div>
                              </div>
                              <div class="col-md-6">
                                <div class="form-floating">
                                  <input type="text" class="form-control education-date" placeholder="Start date" />
                                  <label>Start Date</label>
                                </div>
                              </div>
                              <div class="col-md-6">
                                <div class="form-floating">
                                  <input type="text" class="form-control education-date" placeholder="End date" />
                                  <label>End Date</label>
                                </div>
                              </div>
                            </div>
    `;

                // Append new entry to the container
                document.getElementById("educationContainer").appendChild(educationEntry);

                // Reinitialize date pickers for new fields
                educationEntry.querySelectorAll(".education-date").forEach((input) => {
                    flatpickr(input, {
                        dateFormat: "Y-m-d",
                        maxDate: "today",
                    });
                });

                // Add event listener to remove button
                educationEntry
                    .querySelector(".remove-education")
                    .addEventListener("click", function () {
                        educationEntry.remove();
                    });
            });

        // Add work entry
        document.getElementById("addWork").addEventListener("click", function () {
            // Create a new div for the work entry
            const workEntry = document.createElement("div");
            workEntry.classList.add("work-entry");

            // Add inner HTML for the new work entry
            workEntry.innerHTML = `
      <i class="fas fa-times remove-entry"></i>
                            <div class="row g-3">
                              <div class="col-md-6">
                                <div class="form-floating">
                                  <input type="text" class="form-control" placeholder="Company name" />
                                  <label>Company</label>
                                </div>
                              </div>
                              <div class="col-md-6">
                                <div class="form-floating">
                                  <input type="text" class="form-control" placeholder="Job title" />
                                  <label>Job Title</label>
                                </div>
                              </div>
                              <div class="col-md-6">
                                <div class="form-floating">
                                  <input type="text" class="form-control work-date" placeholder="Start date" />
                                  <label>Start Date</label>
                                </div>
                              </div>
                              <div class="col-md-6">
                                <div class="form-floating">
                                  <input type="text" class="form-control work-date" placeholder="End date" />
                                  <label>End Date</label>
                                </div>
                              </div>
                              <div class="col-12">
                                <div class="form-floating">
                                  <textarea class="form-control" style="height: 100px" placeholder="Description"></textarea>
                                  <label>Description</label>
                                </div>
                              </div>
                            </div>
    `;

            // Append the new entry to the container
            document.getElementById("workContainer").appendChild(workEntry);

            // Reinitialize date pickers for new fields
            workEntry.querySelectorAll(".work-date").forEach((input) => {
                flatpickr(input, {
                    dateFormat: "Y-m-d",
                    maxDate: "today",
                });
            });

            // Add event listener to remove button
            workEntry
                .querySelector(".remove-work")
                .addEventListener("click", function () {
                    workEntry.remove();
                });
        });

        // Remove entry functionality
        document.addEventListener("click", function (e) {
            if (e.target.classList.contains("remove-entry")) {
                const entry = e.target.closest(".education-entry, .work-entry");
                if (
                    entry &&
                    (document.querySelectorAll(".education-entry").length > 1 ||
                        document.querySelectorAll(".work-entry").length > 1)
                ) {
                    entry.remove();
                }
            }
        });

        function initLocationAutocomplete() {
            const locationInput = document.getElementById("location");
            let timeoutId;
            let resultsContainer;

            // Create results container
            function createResultsContainer() {
                if (!resultsContainer) {
                    resultsContainer = document.createElement("div");
                    resultsContainer.className = "autocomplete-results";
                    locationInput.parentNode.appendChild(resultsContainer);
                }
            }

            // Show loading state
            function showLoading() {
                locationInput.classList.add("loading");
            }

            // Hide loading state
            function hideLoading() {
                locationInput.classList.remove("loading");
            }

            // Show suggestions
            function showSuggestions(suggestions) {
                createResultsContainer();
                resultsContainer.innerHTML = suggestions
                    .map(location => `<div class="autocomplete-item">${location}</div>`)
                    .join("");
                resultsContainer.style.display = "block";
            }

            // Hide suggestions
            function hideSuggestions() {
                if (resultsContainer) {
                    resultsContainer.innerHTML = "";
                    resultsContainer.style.display = "none";
                }
            }

            // Fetch locations from OpenStreetMap API
            async function fetchLocations(query) {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`);
                    const data = await response.json();

                    return data.map(place => formatLocation(place.display_name));
                } catch (error) {
                    console.error("Error fetching location data:", error);
                    return [];
                }
            }

            // Format location string
            function formatLocation(fullAddress) {
                const parts = fullAddress.split(",");
                if (parts.length >= 3) {
                    // Take first, second, and last parts (City, District, Country)
                    return `${parts[0].trim()}, ${parts[1].trim()}, ${parts[parts.length - 1].trim()}`;
                }
                return fullAddress; // If format doesn't match, return original
            }

            // Handle input event
            locationInput.addEventListener("input", function (e) {
                clearTimeout(timeoutId);
                const value = e.target.value.trim();

                if (value.length < 2) {
                    hideSuggestions();
                    return;
                }

                timeoutId = setTimeout(async () => {
                    showLoading();

                    // Fetch locations from API
                    const suggestions = await fetchLocations(value);

                    hideLoading();

                    if (suggestions.length > 0) {
                        showSuggestions(suggestions);
                    } else {
                        hideSuggestions();
                    }
                }, 300);
            });

            // Handle clicks on suggestions
            document.addEventListener("click", function (e) {
                if (e.target.classList.contains("autocomplete-item")) {
                    locationInput.value = e.target.textContent;
                    hideSuggestions();
                }
            });

            // Close suggestions when clicking outside
            document.addEventListener("click", function (e) {
                if (!locationInput.contains(e.target)) {
                    hideSuggestions();
                }
            });

            // Handle keyboard navigation
            locationInput.addEventListener("keydown", function (e) {
                if (e.key === "Escape") {
                    hideSuggestions();
                }
            });
        }

        // Validation Functions
        function setupFormValidation() {
            // Add validation message containers
            addValidationContainers();

            // Real-time validation for all fields except dates
            document.querySelectorAll('#accountForm input:not(.education-date):not(.work-date), #accountForm select, #accountForm textarea').forEach(input => {
                input.addEventListener('input', validateField);
                input.addEventListener('blur', validateField);
            });

            // Form submission validation
            document.getElementById('accountForm').addEventListener('submit', function(e) {
                if (!validateForm()) {
                    e.preventDefault();
                }
            });
        }

        function addValidationContainers() {
            const fields = [
                'firstName', 'lastName', 'email', 'phone', 'location', 'bio', 'gender'
            ];

            fields.forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'validation-message';
                    field.parentNode.appendChild(messageDiv);
                }
            });
        }

        function validateField(e) {
            const field = e.target;
            const value = field.value.trim();
            const fieldName = field.id;
            let isValid = true;
            let errorMessage = '';

            // Skip validation for email field if it's already verified
            if (fieldName === 'email' && field.classList.contains('email-verified')) {
                return true;
            }

            // Common validations
            switch(fieldName) {
                case 'firstName':
                case 'lastName':
                    if (!value) {
                        errorMessage = 'This field is required';
                        isValid = false;
                    }
                    break;

                case 'email':
                    if (!value) {
                        errorMessage = 'Email is required';
                        isValid = false;
                    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
                        errorMessage = 'Invalid email format';
                        isValid = false;
                    }
                    break;

                case 'phone':
                    if (value && !/^\+?[0-9\s-]{7,}$/.test(value)) {
                        errorMessage = 'Invalid phone number format';
                        isValid = false;
                    }
                    break;

                case 'location':
                    if (value && !/^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(value)) {
                        errorMessage = 'Location should be in "City, Country" format';
                        isValid = false;
                    }
                    break;

                case 'bio':
                    if (value.length > 1000) {
                        errorMessage = 'Bio cannot exceed 1000 characters';
                        isValid = false;
                    }
                    break;
            }

            updateFieldValidation(field, isValid, errorMessage);
            return isValid;
        }

        function updateFieldValidation(field, isValid, errorMessage) {
            const messageDiv = field.parentNode.querySelector('.validation-message');

            if (messageDiv) {
                if (!isValid) {
                    field.classList.add('input-error');
                    messageDiv.textContent = errorMessage;
                    messageDiv.style.display = 'block';
                } else {
                    field.classList.remove('input-error');
                    messageDiv.style.display = 'none';

                    // Special handling for email verification
                    if (field.id === 'email' && field.classList.contains('email-verified')) {
                        return; // Don't modify verified email field styling
                    }
                }
            }
        }

        function validateForm() {
            let isValid = true;

            // Validate all fields except dates
            document.querySelectorAll('#accountForm input:not(.education-date):not(.work-date), #accountForm select, #accountForm textarea').forEach(field => {
                const event = { target: field };
                if (!validateField(event)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        // Session Management
        // const sessionButtons = document.querySelectorAll(".session-item button");
        // sessionButtons.forEach((button) => {
        //     button.addEventListener("click", function () {
        //         const sessionItem = this.closest(".session-item");
        //         const deviceName = sessionItem.querySelector(".device-name").textContent;
        //
        //         if (
        //             confirm(`Are you sure you want to end the session for ${deviceName}?`)
        //         ) {
        //             sessionItem.style.opacity = "0.5";
        //             this.disabled = true;
        //             this.innerHTML =
        //                 '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        //
        //             // Simulate API call
        //             setTimeout(() => {
        //                 sessionItem.remove();
        //             }, 1500);
        //         }
        //     });
        // });

    }
});

