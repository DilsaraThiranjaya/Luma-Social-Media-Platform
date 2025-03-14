// Authentication functionality
document.addEventListener("DOMContentLoaded", function () {
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

  // Password strength meter
  const passwordInput = document.getElementById("password");
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

  // Form validation and submission
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Add loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';

      // Simulate API call
      setTimeout(() => {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        // Store user data (demo only)
        if (this.id === "registerForm") {
          const firstName = document.getElementById("firstName").value;
          const lastName = document.getElementById("lastName").value;
          localStorage.setItem(
            "user",
            JSON.stringify({
              name: `${firstName} ${lastName}`,
              email: document.getElementById("email").value,
              isLoggedIn: true,
            })
          );
        } else {
          localStorage.setItem(
            "user",
            JSON.stringify({
              email: document.getElementById("email").value,
              isLoggedIn: true,
            })
          );
        }

        // Redirect to timeline
        window.location.href = "/timeline.html";
      }, 1500);
    });
  });

  // Social login buttons animation
  const socialButtons = document.querySelectorAll(".social-btn");
  socialButtons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Input focus effects
  const inputs = document.querySelectorAll(".form-control");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.closest(".form-floating").classList.add("focused");
    });

    input.addEventListener("blur", function () {
      if (!this.value) {
        this.closest(".form-floating").classList.remove("focused");
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
  function checkPasswordRequirements(password) {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    Object.entries(requirements).forEach(([req, met]) => {
      const reqElement = document.querySelector(`[data-requirement="${req}"]`);
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
    });

    return Object.values(requirements).every(Boolean);
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
  document.getElementById("sendOtpBtn").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    if (!email) return;

    const btn = this;
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';

    setTimeout(() => {
      showStep(2);
    }, 1500);
  });

  // Verify OTP Button
  document
    .getElementById("verifyOtpBtn")
    .addEventListener("click", function () {
      const otp = Array.from(otpInputs)
        .map((input) => input.value)
        .join("");
      if (otp.length !== 6) return;

      const btn = this;
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Verifying...';

      setTimeout(() => {
        showStep(3);
        btn.disabled = false;
        btn.innerHTML = "Verify OTP";
      }, 1500);
    });

  // Resend OTP Button
  document
    .getElementById("resendOtpBtn")
    .addEventListener("click", function () {
      this.disabled = true;
      startTimer();
      // Clear OTP inputs
      otpInputs.forEach((input) => (input.value = ""));
    });

  // Password Input Validation
  document.getElementById("newPassword").addEventListener("input", function () {
    checkPasswordRequirements(this.value);
  });

  // Reset Password Button
  document
    .getElementById("resetPasswordBtn")
    .addEventListener("click", function () {
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (!checkPasswordRequirements(newPassword)) return;
      if (newPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const btn = this;
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Resetting...';

      setTimeout(() => {
        successMessage.classList.remove("d-none");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 3000);
      }, 1500);
    });

  // Initialize
  showStep(1);
});
