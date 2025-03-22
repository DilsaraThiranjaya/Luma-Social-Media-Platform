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

  const urlParams = new URLSearchParams(window.location.search);
  const newAccessToken = urlParams.get('token');
  const errorMessage = urlParams.get('error');

  const existingAuthData = JSON.parse(sessionStorage.getItem('authData')) || {};

  if (newAccessToken) {
    // Update the stored access token
    const newAuthData = {...existingAuthData, token: newAccessToken};
    sessionStorage.setItem('authData', JSON.stringify(newAuthData));
    window.location.href = DIRECTORY_URL;
  }
  if (errorMessage) {
    Toast.fire({
      icon: "error",
      title: errorMessage
    });
  }

  handleRememberMe();

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
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (this.id === "adminAccessForm") {
        const email = document.getElementById("email").value;
        const reason = document.getElementById("reason").value;

        if (!validateEmail(email)) {
          await Toast.fire({
            icon: "error",
            title: "Please enter a valid email address"
          });
          return;
        }

        if (reason.length < 20) {
          await Toast.fire({
            icon: "error",
            title: "Reason must be at least 20 characters"
          });
          return;
        }
      }

      // Add email validation function
      function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
      }

      // Add loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';

      try {
        let endpoint, payload;

        if (this.id === "adminAccessForm") {
          endpoint = `${BASE_URL}/requestAdminAccess`;
          payload = {
            email: document.getElementById("email").value,
            reason: document.getElementById("reason").value
          };

          // Special handling for admin access form
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Failed to request admin access");

          const responseData = await response.json();
          await Toast.fire({
            icon: responseData.code === 200 ? "success" : "error",
            title: responseData.message
          });

          // Clear form after successful submission
          if (responseData.code === 200) {
            this.reset();
          }
          return; // Prevent further execution
        }

        // Determine form type
        if (this.id === "registerForm") {
          endpoint = `${BASE_URL}/register`;
          payload = {
            firstName: document.getElementById("firstName").value,
            lastName: document.getElementById("lastName").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
          };
        } else { // loginForm
          endpoint = `${BASE_URL}/authenticate`;
          payload = {
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
          };
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();

        const responseData = await response.json();
        await Toast.fire({
          icon:responseData.code === 200 ||responseData.code === 201 ? "success" : "error",
          title:responseData.message
        });

        const emailInput = document.getElementById('email');
        const rememberMeCheckbox = document.getElementById('rememberMe');

        if (rememberMeCheckbox.checked) {
          localStorage.setItem('rememberedEmail', emailInput.value);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }

        // Store authenticationresponseData
        sessionStorage.setItem("authData", JSON.stringify({
          email:responseData.data.email,
          token:responseData.data.token,
          isLoggedIn: true
        }));

        // Redirect to timeline
        window.location.href = DIRECTORY_URL;

      } catch (error) {
        await Toast.fire({
          icon: "error",
          title: error.message || "Fail to login!"
        });
      } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }

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
});

