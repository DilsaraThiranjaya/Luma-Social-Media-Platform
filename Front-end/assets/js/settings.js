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
            const {exp} = jwtDecode(token);
            return Date.now() >= exp * 1000; // Correct if `exp` is in seconds
        } catch (error) {
            return true; // Treat invalid tokens as expired
        }
    }

    if (authData?.token) {
        try {
            // Check token expiration first
            if (isTokenExpired(authData.token)) {
                await refreshAuthToken();
            }
            initializeUI();
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
                    const educationEntrieOriginal = document.getElementById('educationContainer').innerHTML;
                    const workEntriesOriginal = document.getElementById('workContainer').innerHTML;
                    document.getElementById('educationContainer').innerHTML = '';
                    document.getElementById('workContainer').innerHTML = '';

                    // Populate Education
                    if (user.education && user.education.length > 0) {
                        user.education.forEach(edu => {
                            const educationEntry = document.createElement("div");
                            educationEntry.classList.add("education-entry");
                            educationEntry.innerHTML = `
                        <i class="fas fa-times remove-entry"></i>
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
                        const educationEntry = document.createElement("div");
                        educationEntry.classList.add("education-entry");
                        educationEntry.innerHTML = educationEntrieOriginal;
                    }

                    // Populate Work Experience
                    if (user.workExperience && user.workExperience.length > 0) {
                        user.workExperience.forEach(work => {
                            const workEntry = document.createElement("div");
                            workEntry.classList.add("work-entry");
                            workEntry.innerHTML = `
                        <i class="fas fa-times remove-entry"></i>
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
                        const workEntry = document.createElement("div");
                        workEntry.classList.add("work-entry");
                        workEntry.innerHTML = workEntriesOriginal;
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
                    title: "Failed to load user data"
                });
            }
        }


        // Initialize page
        loadUserData();

        // Account Settings Form
        const accountForm = document.getElementById("accountForm");
        if (accountForm) {
            accountForm.addEventListener("submit", async function (e) {
                e.preventDefault();

                if (!document.getElementById('email').classList.contains("is-valid")) {
                    await Toast.fire({
                        icon: "error",
                        title: "Email is not verified!"
                    });
                    return
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
                        title: error.message || "Failed to update settings"
                    });
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        }

        // Privacy Settings
        const privacyToggles = document.querySelectorAll("#privacy .form-check-input");
        privacyToggles.forEach(toggle => {
            toggle.addEventListener("change", async function () {
                try {
                    const response = await fetch(`${BASE_URL}/privacy`, {
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

                    const data = await response.json();

                    if (data.code === 200) {
                        await Toast.fire({
                            icon: "success",
                            title: "Privacy settings updated"
                        });
                    } else {
                        await Toast.fire({
                            icon: "error",
                            title: data.message
                        });
                    }
                } catch (error) {
                    console.error('Error updating privacy settings:', error);
                    await Toast.fire({
                        icon: "error",
                        title: "Failed to update privacy settings"
                    });
                }
            });
        });

        // Notification Settings
        const notificationToggles = document.querySelectorAll("#notifications .form-check-input");
        notificationToggles.forEach(toggle => {
            toggle.addEventListener("change", async function () {
                try {
                    const response = await fetch(`${BASE_URL}/notifications`, {
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

                    const data = await response.json();

                    if (data.code === 200) {
                        await Toast.fire({
                            icon: "success",
                            title: "Notification settings updated"
                        });
                    } else {
                        await Toast.fire({
                            icon: "error",
                            title: data.message
                        });
                    }
                } catch (error) {
                    console.error('Error updating notification settings:', error);
                    await Toast.fire({
                        icon: "error",
                        title: "Failed to update notification settings"
                    });
                }
            });
        });

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

                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Updating...';

                try {
                    const response = await fetch(`${BASE_URL}/security/password`, {
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

                    const data = await response.json();

                    if (data.code === 200) {
                        this.reset();
                        await Toast.fire({
                            icon: "success",
                            title: "Password updated successfully"
                        });
                    } else {
                        await Toast.fire({
                            icon: "error",
                            title: data.message
                        });
                    }
                } catch (error) {
                    console.error('Error updating password:', error);
                    await Toast.fire({
                        icon: "error",
                        title: "Failed to update password"
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
                    const response = await fetch(`${BASE_URL}/security/2fa`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authData.token}`
                        },
                        body: JSON.stringify({
                            enabled: this.checked
                        })
                    });

                    const data = await response.json();

                    if (data.code === 200) {
                        await Toast.fire({
                            icon: "success",
                            title: `2FA ${this.checked ? 'enabled' : 'disabled'}`
                        });
                    } else {
                        this.checked = !this.checked; // Revert the toggle
                        await Toast.fire({
                            icon: "error",
                            title: data.message
                        });
                    }
                } catch (error) {
                    console.error('Error updating 2FA settings:', error);
                    this.checked = !this.checked; // Revert the toggle
                    await Toast.fire({
                        icon: "error",
                        title: "Failed to update 2FA settings"
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
                        const response = await fetch(`${BASE_URL}/deactivate`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${authData.token}`
                            }
                        });

                        const data = await response.json();

                        if (data.code === 200) {
                            sessionStorage.removeItem('authData');
                            window.location.href = '/login.html';
                        } else {
                            await Toast.fire({
                                icon: "error",
                                title: data.message
                            });
                        }
                    } catch (error) {
                        console.error('Error deactivating account:', error);
                        await Toast.fire({
                            icon: "error",
                            title: "Failed to deactivate account"
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

        // Email verification
        document
            .querySelector(".verify-button")
            .addEventListener("click", function () {
                const email = document.getElementById("email").value;
                if (email) {
                    this.disabled = true;
                    this.innerHTML =
                        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

                    // Simulate verification process
                    setTimeout(() => {
                        this.classList.add("d-none");
                        document.getElementById("email").classList.add("is-valid");
                    }, 2000);
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

        // Location autocomplete (simulated)
        const locationInput = document.getElementById("location");
        let timeoutId;

        locationInput.addEventListener("input", function () {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // Simulate location API call
                if (this.value.length > 2) {
                    // Add loading indicator
                    this.style.backgroundImage =
                        "url('data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23999' d='M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z'/%3E%3C/svg%3E')";
                    this.style.backgroundRepeat = "no-repeat";
                    this.style.backgroundPosition = "right 10px center";
                    this.style.backgroundSize = "20px";
                }
            }, 300);
        });
    }
});

