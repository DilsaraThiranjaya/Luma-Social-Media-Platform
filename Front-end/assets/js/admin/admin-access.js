// auth-admin-access.js
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
    const LOGIN_URL = "../login.html";

    // Initialize admin access functionality
    setupFormValidation();
    setupFormSubmission();
    setupInputFocusEffects();

    // Form Validation Setup
    function setupFormValidation() {
        const emailField = document.getElementById("email");
        const reasonField = document.getElementById("reason");

        // Create validation message containers
        [emailField, reasonField].forEach(field => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'validation-message';
            field.parentNode.appendChild(messageDiv);
        });

        // Real-time validation
        emailField.addEventListener("input", validateEmail);
        reasonField.addEventListener("input", validateReason);
    }

    // Validation functions
    function validateEmail(e) {
        const email = e.target.value.trim();
        const isValid = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
        updateValidationUI(e.target, isValid, "Invalid email format");
        return isValid;
    }

    function validateReason(e) {
        const reason = e.target.value.trim();
        const isValid = reason.length >= 20;
        updateValidationUI(e.target, isValid, "Minimum 20 characters required");
        return isValid;
    }

    // Update validation UI
    function updateValidationUI(field, isValid, message) {
        const messageDiv = field.parentNode.querySelector('.validation-message');

        if (messageDiv) {
            field.classList.toggle('input-error', !isValid);
            messageDiv.textContent = isValid ? "" : message;
            messageDiv.style.display = isValid ? "none" : "block";
        }
    }

    // Form Submission
    function setupFormSubmission() {
        document.getElementById("adminAccessForm").addEventListener("submit", async function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector("button[type='submit']");
            const originalText = submitBtn.innerHTML;

            try {
                // Validate form
                const isEmailValid = validateEmail({ target: document.getElementById("email") });
                const isReasonValid = validateReason({ target: document.getElementById("reason") });

                if (!isEmailValid || !isReasonValid) {
                    throw new Error("Please fill all required fields correctly");
                }

                // Prepare request
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

                const response = await fetch(`${BASE_URL}/requestAdminAccess`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: document.getElementById("email").value.trim(),
                        reason: document.getElementById("reason").value.trim()
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Request failed");

                // Handle success
                Toast.fire({
                    icon: "success",
                    title: "Request submitted successfully!"
                });

                this.reset();
                window.location.href = LOGIN_URL;
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: error.message
                });
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // UI Effects
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
});