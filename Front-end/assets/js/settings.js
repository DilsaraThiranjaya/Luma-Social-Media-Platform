// Settings Page Functionality
document.addEventListener("DOMContentLoaded", function () {
  // Form Submissions
  const accountForm = document.getElementById("accountForm");
  const passwordForm = document.getElementById("passwordForm");

  if (accountForm) {
    accountForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      // Add loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

      // Simulate API call
      setTimeout(() => {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        // Show success message
        const toast = new bootstrap.Toast(document.createElement("div"));
        toast.show();
      }, 1500);
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      // Add loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Updating...';

      // Simulate API call
      setTimeout(() => {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        // Clear form
        this.reset();

        // Show success message
        alert("Password updated successfully!");
      }, 1500);
    });
  }

  // Session Management
  const sessionButtons = document.querySelectorAll(".session-item button");
  sessionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const sessionItem = this.closest(".session-item");
      const deviceName = sessionItem.querySelector(".device-name").textContent;

      if (
        confirm(`Are you sure you want to end the session for ${deviceName}?`)
      ) {
        sessionItem.style.opacity = "0.5";
        this.disabled = true;
        this.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        // Simulate API call
        setTimeout(() => {
          sessionItem.remove();
        }, 1500);
      }
    });
  });

  // Danger Zone - Account Deactivation
  const deactivateBtn = document.querySelector(".danger-zone button");
  if (deactivateBtn) {
    deactivateBtn.addEventListener("click", function () {
      if (
        confirm(
          "Are you sure you want to deactivate your account? This action cannot be undone."
        )
      ) {
        this.disabled = true;
        this.innerHTML =
          '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Deactivating...';

        // Simulate API call
        setTimeout(() => {
          window.location.href = "/login.html";
        }, 2000);
      }
    });
  }

  // Two-Factor Authentication Toggle
  const twoFactorToggle = document.getElementById("twoFactor");
  if (twoFactorToggle) {
    twoFactorToggle.addEventListener("change", function () {
      if (this.checked) {
        // Simulate 2FA setup process
        this.disabled = true;
        const setupModal = new bootstrap.Modal(document.createElement("div"));
        setupModal.show();

        // In a real implementation, you would show a QR code and verification process here
        setTimeout(() => {
          this.disabled = false;
        }, 1500);
      }
    });
  }

  // Save notification preferences
  const notificationToggles = document.querySelectorAll(
    "#notifications .form-check-input"
  );
  notificationToggles.forEach((toggle) => {
    toggle.addEventListener("change", function () {
      const settingName = this.id;
      const isEnabled = this.checked;

      // Simulate saving preference
      console.log(`Saving ${settingName}: ${isEnabled}`);
    });
  });

  // Initialize date pickers
  flatpickr("#birthday", {
    dateFormat: "Y-m-d",
    maxDate: "today",
    yearRange: [1900, new Date().getFullYear()],
  });

  flatpickr(".education-date", {
    dateFormat: "Y-m-d",
    maxDate: "today",
  });

  flatpickr(".work-date", {
    dateFormat: "Y-m-d",
    maxDate: "today",
  });

  // Phone verification
  document
    .querySelector(".verify-button")
    .addEventListener("click", function () {
      const phone = document.getElementById("phone").value;
      if (phone) {
        this.disabled = true;
        this.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        // Simulate verification process
        setTimeout(() => {
          this.innerHTML = '<i class="fas fa-check"></i> Verified';
          this.classList.remove("btn-outline-primary");
          this.classList.add("btn-success");
          document.getElementById("phone").classList.add("is-valid");
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
});
