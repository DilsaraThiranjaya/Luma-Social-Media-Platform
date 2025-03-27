// auth-login.js
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

    // Initialize login-specific functionality

    // handleGoogleCallback();
    handleRememberMe();
    setupOTPInputs();
    setupLoginFormSubmission();
    setupPasswordToggle();
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

    // Remember Me functionality
    function handleRememberMe() {
        const rememberMeCheckbox = document.getElementById('rememberMe');
        const emailInput = document.getElementById('email');

        // Load remembered email if exists
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        const isRemembered = localStorage.getItem('rememberMe') === 'true';

        if (isRemembered && rememberedEmail) {
            emailInput.value = rememberedEmail;
            rememberMeCheckbox.checked = true;
        }

        // Update storage on change
        rememberMeCheckbox.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('rememberedEmail', emailInput.value);
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberMe');
            }
        });
    }

    // Password visibility toggle
    function setupPasswordToggle() {
        const togglePasswordButtons = document.querySelectorAll(".toggle-password");
        togglePasswordButtons.forEach((button) => {
            button.addEventListener("click", function () {
                const passwordInput = this.closest(".password-field").querySelector("input");
                const icon = this.querySelector("i");

                passwordInput.type = passwordInput.type === "password" ? "text" : "password";
                icon.classList.toggle("fa-eye-slash");
                icon.classList.toggle("fa-eye");
            });
        });
    }

    // OTP input handling
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

    // Login form submission
    function setupLoginFormSubmission() {
        const loginForm = document.getElementById("loginForm");

        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

                const email = this.querySelector("#email").value;
                const password = this.querySelector("#password").value;

                // Authenticate user
                const response = await fetch(`${BASE_URL}/authenticate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const responseData = await response.json();

                if (!response.ok) {
                    throw new Error(responseData.message || "Login failed");
                }

                // Check 2FA requirement
                const twoFAResponse = await fetch(`${BASE_URL}/2fa?email=${encodeURIComponent(email)}`);
                const twoFAData = await twoFAResponse.json();

                if (!twoFAResponse.ok) {
                    throw new Error(twoFAData.message || "Failed to check 2FA status");
                }

                // Handle 2FA if required
                if (twoFAData.data) {
                    await handle2FA(email, responseData.data.token);
                } else {
                    sessionStorage.setItem("authData", JSON.stringify({
                        email: responseData.data.email,
                        token: responseData.data.token
                    }));
                    window.location.href = DIRECTORY_URL;
                }
            } catch (error) {
                Toast.fire({ icon: "error", title: error.message });
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // 2FA handling
    async function handle2FA(email, token) {
        let otpCode = null;
        let timerInterval = null;

        // Send OTP
        try {
            const otpResponse = await fetch(`${BASE_URL}/sendOtpCode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const otpData = await otpResponse.json();
            if (!otpResponse.ok) throw new Error(otpData.message);

            otpCode = otpData.data;
            startOTPTimer();

            // Show OTP modal
            const otpModal = new bootstrap.Modal('#otpModal');
            otpModal.show();
            document.querySelector("#otpModal .otp-inputs input").focus();

            // Verify OTP handler
            document.getElementById("verifyOtpBtn").onclick = async () => {
                const enteredOtp = Array.from(document.querySelectorAll("#otpModal .otp-inputs input"))
                    .map(input => input.value).join('');

                if (enteredOtp !== String(otpCode)) {
                    Toast.fire({ icon: "error", title: "Invalid OTP" });
                    return;
                }

                sessionStorage.setItem("authData", JSON.stringify({
                    email: email,
                    token: token
                }));

                otpModal.hide();
                window.location.href = DIRECTORY_URL;
            };

            // Resend OTP handler
            document.getElementById("resendOtpBtn").onclick = async () => {
                try {
                    const resendResponse = await fetch(`${BASE_URL}/sendOtpCode`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email })
                    });

                    const resendData = await resendResponse.json();
                    if (!resendResponse.ok) throw new Error(resendData.message);

                    otpCode = resendData.data;
                    startOTPTimer();
                } catch (error) {
                    Toast.fire({ icon: "error", title: error.message });
                }
            };

        } catch (error) {
            Toast.fire({ icon: "error", title: error.message });
        }

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
});