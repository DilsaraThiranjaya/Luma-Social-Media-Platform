document.addEventListener("DOMContentLoaded", function () {
    //Toast Configs
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

    //Forgot Password
    const emailSection = document.getElementById("emailSection");
    const otpSection = document.getElementById("otpSection");
    const newPasswordSection = document.getElementById("newPasswordSection");
    const stepDescription = document.getElementById("stepDescription");
    const steps = document.querySelectorAll(".step");
    const successMessage = document.getElementById("successMessage");
    let timerInterval;
    let otpCode;
    let email;

    // OTP Input Handling
    const otpInputs = document.querySelectorAll(".otp-inputs input");
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
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                resendBtn.disabled = false;
            }
        }, 1000);
    }

    // Password Requirements Check
    // function checkPasswordRequirements(password) {
    //     const requirements = {
    //         length: password.length >= 8,
    //         uppercase: /[A-Z]/.test(password),
    //         lowercase: /[a-z]/.test(password),
    //         number: /[0-9]/.test(password),
    //         special: /[^A-Za-z0-9]/.test(password),
    //     };
    //
    //     Object.entries(requirements).forEach(([req, met]) => {
    //         const reqElement = document.querySelector(`[data-requirement="${req}"]`);
    //         const icon = reqElement.querySelector("i");
    //
    //         reqElement.classList.toggle("met", met);
    //         reqElement.classList.toggle("unmet", !met);
    //
    //         if (met) {
    //             icon.classList.remove("fa-times-circle");
    //             icon.classList.add("fa-check-circle");
    //         } else {
    //             icon.classList.remove("fa-check-circle");
    //             icon.classList.add("fa-times-circle");
    //         }
    //     });
    //
    //     return Object.values(requirements).every(Boolean);
    // }

    // Password strength meter
    const passwordInput = document.getElementById("newPassword");
    if (passwordInput) {
        passwordInput.addEventListener("input", function () {
            const password = this.value;
            const progressBar = document.querySelector(
                ".password-strength .progress-bar"
            );
            const strengthText = document.getElementById("strengthText");

            if (!progressBar || !strengthText) return;

            let strength = 0;
            let status = "";

            // Length check
            if (password.length >= 8) strength += 25;

            // Lowercase check
            if (password.match(/[a-z]+/)) strength += 25;

            // Uppercase check
            if (password.match(/[A-Z]+/)) strength += 25;

            // Number/Special character check
            if (password.match(/[0-9]+/) || password.match(/[^a-zA-Z0-9]+/))
                strength += 25;

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

    // Step Navigation
    function showStep(step) {
        emailSection.style.display = "none";
        otpSection.style.display = "none";
        newPasswordSection.style.display = "none";

        steps.forEach((s, i) => s.classList.toggle("active", i < step));

        switch (step) {
            case 1:
                emailSection.style.display = "block";
                stepDescription.textContent = "Enter your email to receive OTP";
                break;
            case 2:
                otpSection.style.display = "block";
                stepDescription.textContent = "Enter the OTP sent to your email";
                startTimer();
                break;
            case 3:
                newPasswordSection.style.display = "block";
                stepDescription.textContent = "Create your new password";
                break;
        }
    }

    // Send OTP Button
    document.getElementById("sendOtpBtn").addEventListener("click", async function () {
        email = document.getElementById("email").value;
        if (!email) return;

        const btn = this;
        btn.disabled = true;
        btn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';

        // Simulate OTP sending process
        setTimeout(() => {
            sendOTP(email);
            btn.disabled = false;
            btn.innerHTML = "Send OTP";
        }, 1000);
    });

    async function sendOTP(email) {
        try {
            let endpoint = "http://localhost:8080/api/v1/auth/sendOtpCode"
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Required for JSON body
                },
                body: JSON.stringify({
                    email: email
                })
            });

            if (!response.ok) throw new Error('OTP sending failed');

            const responseData = await response.json();
            await Toast.fire({
                icon:responseData.code === 200 ||responseData.code === 201 ? "success" : "error",
                title:responseData.message
            });

            otpCode = responseData.data;
            if (otpCode !== null) {
                showStep(2);
            } else {
                throw new Error('OTP sending failed')
            }
        } catch (error) {
            await Toast.fire({
                icon: "error",
                title: error.message || "OTP sending failed"
            });
        }
    }

    // Verify OTP Button
    document
        .getElementById("verifyOtpBtn")
        .addEventListener("click", async function () {
            const otp = Array.from(otpInputs)
                .map((input) => input.value)
                .join("");
            if (otp.length !== 6) return;

            const btn = this;
            btn.disabled = true;
            btn.innerHTML =
                '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Verifying...';

            if (otp == otpCode) {
                setTimeout(() => {
                    showStep(3);
                    btn.disabled = false;
                    btn.innerHTML = "Verify OTP";
                }, 1000)
            } else {
                otpInputs.forEach((input) => (input.value = ""));
                btn.disabled = false;
                btn.innerHTML = "Verify OTP";
                await Toast.fire({
                    icon: "error",
                    title: "Invalid OTP"
                })
            }
        });

    // Resend OTP Button
    document
        .getElementById("resendOtpBtn")
        .addEventListener("click", function () {
            this.disabled = true;
            startTimer();
            // Clear OTP inputs
            otpInputs.forEach((input) => (input.value = ""));
            sendOTP(email);
        });

    // Reset Password Button
    document
        .getElementById("resetPasswordBtn")
        .addEventListener("click", async function () {
            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (newPassword !== confirmPassword) {
                await Toast.fire({
                    icon: "error",
                    title: "Passwords do not match"
                })
                return;
            }

            const btn = this;
            btn.disabled = true;
            btn.innerHTML =
                '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Resetting...';


            try {
                let endpoint = "http://localhost:8080/api/v1/auth/resetPassword"
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' // Required for JSON body
                    },
                    body: JSON.stringify({
                        email: email,
                        password: newPassword
                    })
                });

                if (!response.ok) throw new Error('Password Reset Failed');

                const responseData = await response.json();

                await Toast.fire({
                    icon:responseData.code === 200 ||responseData.code === 201 ? "success" : "error",
                    title:responseData.message
                });

                if (responseData.code === 200) {
                    setTimeout(() => {
                        window.location.href = "/Luma-Social-Media-Platform/Front-end/pages/login.html";
                    },1000);
                }
            } catch (error) {
                await Toast.fire({
                    icon: "error",
                    title: error.message || "Password reset failed"
                });
            } finally {
                btn.disabled = false;
                btn.innerHTML = "Reset Password";
            }
        });

    // Initialize
    showStep(1);
});