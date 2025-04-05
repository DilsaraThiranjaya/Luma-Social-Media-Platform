// auth-register.js
document.addEventListener("DOMContentLoaded", function () {
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

    const BASE_URL = "http://localhost:8080/api/v1/auth";
    const DIRECTORY_URL = "/Luma-Social-Media-Platform/Front-end/pages/timeline.html";
    let otpCode = null;
    let emailToVerify = null;
    let timerInterval = null;

    // Initialize registration functionality

    // handleGoogleCallback();
    setupOTPInputs();
    setupFormValidation();
    setupPasswordStrengthMeter();
    setupPasswordToggles();
    setupFormSubmission();
    setupSocialButtonAnimations();
    setupInputFocusEffects();

    // // Handle Google OAuth callback
    // function handleGoogleCallback() {
    //   const urlParams = new URLSearchParams(window.location.search);
    //   const token = urlParams.get("token");
    //   const error = urlParams.get("error");
    //
    //   const existingAuthData = JSON.parse(sessionStorage.getItem('authData')) || {};
    //
    //   if (token) {
    //     const newAuthData = {...existingAuthData, token: token};
    //     sessionStorage.setItem('authData', JSON.stringify(newAuthData));
    //     Toast.fire({
    //       icon: "success",
    //       title: "Successfully logged in."
    //     })
    //     window.location.href = DIRECTORY_URL;
    //   } else if (error) {
    //     Toast.fire({
    //       icon: "error",
    //       title: error
    //     });
    //   }
    // }
    //

    // OTP Input Handling
    function setupOTPInputs() {
        const otpInputs = document.querySelectorAll("#otpModal .otp-inputs input");

        otpInputs.forEach((input, index) => {
            input.addEventListener("input", (e) => {
                if (e.target.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
        });
    }

    // Password Strength Meter
    function setupPasswordStrengthMeter() {
        const passwordInput = document.getElementById("password");
        const progressBar = document.querySelector(".password-strength .progress-bar");
        const strengthText = document.getElementById("strengthText");

        passwordInput.addEventListener("input", function() {
            const password = this.value;
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
                    icon.className = met ? "fas fa-check-circle" : "fas fa-times-circle";
                }
            });

            // Calculate strength
            const strength = Object.values(requirements).filter(Boolean).length * 20;
            progressBar.style.width = `${strength}%`;
            progressBar.className = `progress-bar ${
                strength <= 20 ? "bg-danger" :
                    strength <= 40 ? "bg-warning" :
                        strength <= 60 ? "bg-info" : "bg-success"
            }`;
            strengthText.textContent =
                strength <= 20 ? "weak" :
                    strength <= 40 ? "fair" :
                        strength <= 60 ? "good" : "strong";
        });
    }

    // Password Toggle Visibility
    function setupPasswordToggles() {
        document.querySelectorAll(".toggle-password").forEach(button => {
            button.addEventListener("click", function() {
                const input = this.closest(".password-field").querySelector("input");
                const icon = this.querySelector("i");
                input.type = input.type === "password" ? "text" : "password";
                icon.classList.toggle("fa-eye-slash");
                icon.classList.toggle("fa-eye");
            });
        });
    }

    // Form Validation Setup
    function setupFormValidation() {
        // Add validation message containers
        addValidationContainers();

        // Real-time validation for all fields
        document.querySelectorAll('#registerForm input').forEach(input => {
            input.addEventListener('input', validateField);
            input.addEventListener('blur', validateField);
        });

        document.getElementById("confirmPassword").addEventListener("input", validatePasswordMatch);

        // Form submission validation
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            if (!validateForm()) {
                e.preventDefault();
            }
        });
    }

    function addValidationContainers() {
        const fields = [
            'firstName', 'lastName', 'email','password', 'confirmPassword'
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

    // Field Validation
    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = "";

        switch(field.id) {
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

            case "password":
                isValid = value.length >= 8;
                errorMessage = "At least 8 characters required";
                break;

            case "confirmPassword":
                isValid = value === document.getElementById("password").value;
                errorMessage = "Passwords do not match";
                break;
        }

        updateValidationUI(field, isValid, errorMessage);
        return isValid;
    }

    // Password Match Validation
    function validatePasswordMatch() {
        const confirmField = document.getElementById("confirmPassword");
        const password = document.getElementById("password").value;
        const isValid = confirmField.value === password;
        updateValidationUI(confirmField, isValid, "Passwords do not match");
        return isValid;
    }

    // Update Validation UI
    function updateValidationUI(field, isValid, errorMessage) {
        const messageDiv = field.parentNode.querySelector('.validation-message');
        if (messageDiv) {
            if (!isValid) {
                if (field.id === 'email') {
                    document.querySelector('.verify-button').classList.add('d-none');
                }

                field.classList.add('input-error');
                messageDiv.textContent = errorMessage;
                messageDiv.style.display = 'block';
            } else {
                if (field.id === 'email') {
                    document.querySelector('.verify-button').classList.remove('d-none');
                }
                field.classList.remove('input-error');
                messageDiv.style.display = 'none';

                // Special handling for email verification
                if (field.id === 'email' && field.classList.contains('is-valid')) {
                    return; // Don't modify verified email field styling
                }
            }
        }
    }

    function validateForm() {
        let isValid = true;

        // Validate all fields except dates
        document.querySelectorAll('#registerForm input').forEach(field => {
            const event = { target: field };
            if (!validateField(event)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Email Verification
    document.querySelector(".verify-button").addEventListener("click", async function() {
        const emailField = document.getElementById("email");
        const email = emailField.value.trim();

        if (!validateField({ target: emailField })) return;

        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
            const response = await fetch(`${BASE_URL}/sendOtpCodeRegister`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            otpCode = data.data;
            emailToVerify = email;
            startOTPTimer();

            const otpModal = new bootstrap.Modal("#otpModal");
            otpModal.show();
            document.querySelector("#otpModal input").focus();
        } catch (error) {
            Toast.fire({ icon: "error", title: error.message });
        } finally {
            this.disabled = false;
            this.innerHTML = "Verify";
        }
    });

    // OTP Verification
    document.getElementById("verifyOtpBtn").addEventListener("click", async function() {
        const enteredOtp = Array.from(document.querySelectorAll("#otpModal input"))
            .map(input => input.value)
            .join("");

        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying...';

        try {
            if (enteredOtp !== String(otpCode)) {
                Toast.fire({ icon: "error", title: "Invalid OTP" });
                return
            }

            document.getElementById("email").classList.add("is-valid");
            document.querySelector(".verify-button").classList.add("d-none");

            bootstrap.Modal.getInstance("#otpModal").hide();
            otpCode = null;
        } catch (error) {
            Toast.fire({ icon: "error", title: error.message });
        } finally {
            this.disabled = false;
            this.innerHTML = "Verify OTP";
            document.querySelectorAll("#otpModal input").forEach(input => input.value = "");
        }
    });

    // Resend OTP
    document.getElementById("resendOtpBtn").addEventListener("click", async function() {
        try {
            const response = await fetch(`${BASE_URL}/sendOtpCodeRegister`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailToVerify })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            otpCode = data.data;
            startOTPTimer();
            Toast.fire({ icon: "success", title: "New OTP sent successfully!" });
            document.querySelectorAll("#otpModal input").forEach(input => input.value = "");
        } catch (error) {
            Toast.fire({ icon: "error", title: error.message });
        }
    });

    // Form Submission
    function setupFormSubmission() {
        document.getElementById("registerForm").addEventListener("submit", async function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector("button[type='submit']");
            const originalText = submitBtn.innerHTML;

            try {
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

                // Validate password
                const password = this.querySelector("#password").value;
                const confirmPassword = this.querySelector("#confirmPassword").value;

                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';

                const formData = {
                    firstName: document.getElementById("firstName").value.trim(),
                    lastName: document.getElementById("lastName").value.trim(),
                    email: emailToVerify,
                    password: document.getElementById("password").value
                };

                const response = await fetch(`${BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                sessionStorage.setItem("authData", JSON.stringify({
                    email: data.data.email,
                    token: data.data.token
                }));

                Toast.fire({ icon: "success", title: "Registration successful!" });
                window.location.href = DIRECTORY_URL;
            } catch (error) {
                Toast.fire({ icon: "error", title: error.message });
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    function validateAllFields() {
        let isValid = true;

        // Validate static fields
        const staticFields = ['firstName', 'lastName', 'email','password', 'confirmPassword'];
        staticFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                const event = {target: field};
                if (!validateField(event)) {
                    isValid = false;
                }
            }
        });
        return isValid;
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

    // UI Effects
    function setupSocialButtonAnimations() {
        document.querySelectorAll(".social-btn").forEach(button => {
            button.addEventListener("mouseenter", () => button.style.transform = "translateY(-2px)");
            button.addEventListener("mouseleave", () => button.style.transform = "translateY(0)");
        });
    }

    function setupInputFocusEffects() {
        document.querySelectorAll(".form-control").forEach(input => {
            input.addEventListener("focus", () => {
                input.closest(".form-floating").classList.add("focused");
            });

            input.addEventListener("blur", () => {
                if (!input.value) {
                    input.closest(".form-floating").classList.remove("focused");
                }
            });
        });
    }

    // Timer Functions
    function startOTPTimer() {
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
});