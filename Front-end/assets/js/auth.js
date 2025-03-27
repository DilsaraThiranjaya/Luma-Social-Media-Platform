// Authentication functionality
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

  const BASE_URL = "http://localhost:8080/api/v1/auth";
  const DIRECTORY_URL = "/Luma-Social-Media-Platform/Front-end/pages/timeline.html";

  // Initialize
  handleRememberMe();
  setupOTPInputs();
  setupFormSubmissions();
  setupFormValidation();

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
  // handleGoogleCallback();

  // Function to handle Remember Me functionality
  function handleRememberMe() {
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const emailInput = document.getElementById('email');

    // Check if there are stored credentials when page loads
    window.addEventListener('DOMContentLoaded', () => {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      const isRemembered = localStorage.getItem('rememberMe') === 'true';

      if (isRemembered && rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
      }
    });
  }

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
  const passwordInput = document.getElementById("password");
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

// Global variables
  let otpCode = null;
  let emailToVerify = null;
  let tempAuthData = null;
  let timerInterval = null;

// Setup OTP input handling
  function setupOTPInputs() {
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
  }

// Setup form submissions
  function setupFormSubmissions() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      form.addEventListener("submit", async function(e) {
        e.preventDefault();
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
          // Set loading state
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

          // Handle different form types
          if (this.id === "loginForm") {
            await handleLoginForm(this);
          } else if (this.id === "registerForm") {
            await handleRegisterForm(this);
          } else if (this.id === "adminAccessForm") {
            await handleAdminAccessForm(this);
          }
        } catch (error) {
          await Toast.fire({
            icon: "error",
            title: error.message || "An error occurred"
          });
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    });
  }

// Handle login form submission
  async function handleLoginForm(form) {
    const email = form.querySelector("#email").value;
    const password = form.querySelector("#password").value;

    // Authenticate user
    const response = await fetch(`${BASE_URL}/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const responseData = await response.json();

    if (responseData.code !== 200) {
      throw new Error(responseData.message || "Login failed");
    }

    // Store temporary auth data
    tempAuthData = {
      email: responseData.data.email,
      token: responseData.data.token
    };

    // Check 2FA status
    const twoFAResponse = await fetch(`${BASE_URL}/2fa?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    const twoFAData = await twoFAResponse.json();

    if (twoFAData.code !== 200) {
      throw new Error(twoFAData.message || "Failed to check 2FA status");
    }

    if (twoFAData.data) {
      // 2FA is enabled - show OTP modal
      emailToVerify = email;
      await sendOTP(email);

      const otpModal = new bootstrap.Modal('#otpModal');
      otpModal.show();
      document.querySelector("#otpModal .otp-inputs input").focus();

      // Wait for OTP verification
      await new Promise((resolve) => {
        const verifyBtn = document.getElementById("verifyOtpBtn");

        // Use named function for proper removal
        function otpHandler() {
          verifyOTP()
              .then(resolve)
              .catch(() => {
                // Re-attach only after cleaning up
                verifyBtn.removeEventListener("click", otpHandler);
                verifyBtn.addEventListener("click", otpHandler);
              });
        }

        // Clean up previous listeners first
        verifyBtn.removeEventListener("click", otpHandler);
        verifyBtn.addEventListener("click", otpHandler);
      });
    } else {
      Toast.fire({
        icon: "success",
        title: "Login successful"
      })

      // Proceed with login
      sessionStorage.setItem("authData", JSON.stringify(tempAuthData));
      window.location.href = DIRECTORY_URL;
    }
  }

// Send OTP function
  async function sendOTP(email) {
    const response = await fetch(`${BASE_URL}/sendOtpCode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email })
    });

    const responseData = await response.json();

    if (responseData.code !== 200) {
      throw new Error(responseData.message || "Failed to send OTP");
    }

    otpCode = responseData.data;
    startTimer();
  }

// Verify OTP function
  async function verifyOTP() {
    const otpInputs = document.querySelectorAll("#otpModal .otp-inputs input");
    const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');

    const verifyBtn = document.getElementById("verifyOtpBtn");
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying...';

    try {
      if (enteredOtp != String(otpCode)) {
        otpInputs.forEach(input => input.value = ""); // Clear on failure
        throw new Error("Invalid OTP");
      }

      await Toast.fire({
        icon: "success",
        title: "OTP verified successfully"
      });

      // Clear inputs and hide modal
      otpInputs.forEach(input => input.value = "");
      bootstrap.Modal.getInstance('#otpModal').hide();
      otpCode = null;

      if (!tempAuthData) {
        await Toast.fire({
          icon: "error",
          title: "Session expired. Please login again."
        });
        bootstrap.Modal.getInstance('#otpModal').hide();
        return;
      }

      // Proceed with login
      sessionStorage.setItem("authData", JSON.stringify(tempAuthData));
      window.location.href = DIRECTORY_URL;
    } catch (error) {
      await Toast.fire({
        icon: "error",
        title: error.message
      });
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = 'Verify OTP';
    }
  }

// Timer functions
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

// Resend OTP handler
  document.getElementById("resendOtpBtn").addEventListener("click", function() {
    if (!emailToVerify) return;

    this.disabled = true;
    document.querySelectorAll("#otpModal .otp-inputs input").forEach(input => {
      input.value = "";
    });

    sendOTP(emailToVerify);
  });

// Handle register form
  async function handleRegisterForm(form) {
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
    const password = form.querySelector("#password").value;
    const confirmPassword = form.querySelector("#confirmPassword").value;

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Submit registration
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.querySelector("#firstName").value,
        lastName: form.querySelector("#lastName").value,
        email: form.querySelector("#email").value,
        password: password
      })
    });

    const responseData = await response.json();

    if (responseData.code !== 200 && responseData.code !== 201) {
      throw new Error(responseData.message || "Registration failed");
    }

    const AuthData = {
      email: responseData.data.email,
      token: responseData.data.token
    };

    await Toast.fire({
      icon: "success",
      title: responseData.message
    });

    form.reset();
    sessionStorage.setItem("authData", JSON.stringify(AuthData));
    window.location.href = DIRECTORY_URL;
  }

// Handle admin access form
  async function handleAdminAccessForm(form) {
    const response = await fetch(`${BASE_URL}/requestAdminAccess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.querySelector("#email").value,
        reason: form.querySelector("#reason").value
      })
    });

    const responseData = await response.json();

    if (responseData.code !== 200 && responseData.code !== 201) {
      throw new Error(responseData.message || "Request failed");
    }

    await Toast.fire({
      icon: "success",
      title: responseData.message
    });

    form.reset();
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

  // Reset Verify Button State When Closing Modal
  document.getElementById('otpModal').addEventListener('hidden.bs.modal', function () {
    const signInBtn = document.querySelector("#loginForm button[type='submit']");
    if (signInBtn && signInBtn.disabled) {
      signInBtn.disabled = false;
      signInBtn.innerHTML = 'Sign In';
      otpCode = null;
    }
    const verifyBtn = document.querySelector('.verify-button');
    if (verifyBtn && verifyBtn.disabled) {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = 'Verify';
      otpCode = null;
    }
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

  // Register Form Email Verification

//Verify Button Handler
  document.querySelector(".verify-button").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    if (!email) return;

    emailToVerify = email;
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

    sendOTPRegister(email)
        .then(() => {
          const otpModal = new bootstrap.Modal('#otpModal');
          otpModal.show();
          otpInputs[0].focus();
        })
        .catch((error) => {
          btn.disabled = false;
          btn.innerHTML = 'Verify';
          otpCode = null;
          Toast.fire({icon: 'error', title: error.message});
        });
  });

  async function sendOTPRegister(email) {
    const response = await fetch(`${BASE_URL}/sendOtpCodeRegister`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email })
    });

    const responseData = await response.json();

    if (responseData.code !== 200) {
      throw new Error(responseData.message || "Failed to send OTP");
    }

    otpCode = responseData.data;
    startTimer();
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
      otpCode = null;
    } else {
      Toast.fire({icon: 'error', title: 'Invalid OTP'});
      otpInputs.forEach(input => input.value = "");
    }
    btn.disabled = false;
    btn.innerHTML = 'Verify OTP';
  });

  // Validation Functions
  function setupFormValidation() {
    // Add validation message containers
    addValidationContainers();

    // Real-time validation for all fields except dates
    document.querySelectorAll('#registerForm input').forEach(input => {
      input.addEventListener('input', validateField);
      input.addEventListener('blur', validateField);
    });

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

  function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.id;
    let isValid = true;
    let errorMessage = '';

    // Skip validation for email field if it's already verified
    if (fieldName === 'email' && field.classList.contains('is-valid')) {
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

      case 'password':
      case 'confirmPassword':
        if (!value) {
          errorMessage = 'Password is required';
          isValid = false;
        } else if (value.length < 8) {
          errorMessage = 'Password must be at least 8 characters';
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
});

