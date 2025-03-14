// Initialize tooltips and setup global event handlers
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Toggle sidebar functionality
  const toggleBtn = document.querySelector(".toggle-sidebar");
  const sidebar = document.querySelector(".admin-sidebar");
  const mainContent = document.querySelector(".admin-main");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("show");
      mainContent.classList.toggle("sidebar-hidden");
    });
  }

  // Initialize charts
  initializeCharts();

  // Initialize search functionality
  initializeSearch();

  // Initialize filters
  initializeFilters();

  // Initialize user actions
  initializeUserActions();

  // Initialize post actions
  initializePostActions();

  // Initialize report actions
  initializeReportActions();

  // Initialize settings
  initializeSettings();
});

// Chart initialization and updates
function initializeCharts() {
  // User Growth Chart
  const userGrowthCtx = document.getElementById("userGrowthChart");
  let userGrowthChart;

  if (userGrowthCtx) {
    userGrowthChart = new Chart(userGrowthCtx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "New Users",
            data: [650, 850, 1100, 900, 1200, 1500],
            borderColor: "#600097",
            tension: 0.4,
            fill: true,
            backgroundColor: "rgba(96, 0, 151, 0.1)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });

    // Handle period change
    document.querySelectorAll(".card-actions .btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const period = this.textContent.trim().toLowerCase();
        updateUserGrowthChart(userGrowthChart, period);

        // Update active state
        document
          .querySelectorAll(".card-actions .btn")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
      });
    });
  }

  // Demographics Chart
  const demographicsCtx = document.getElementById("demographicsChart");
  if (demographicsCtx) {
    new Chart(demographicsCtx, {
      type: "doughnut",
      data: {
        labels: ["18-24", "25-34", "35-44", "45+"],
        datasets: [
          {
            data: [30, 40, 20, 10],
            backgroundColor: ["#600097", "#4e54c8", "#8b0c7d", "#ff97fa"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  // Posts Analytics Chart
  const postsAnalyticsCtx = document.getElementById("postsAnalyticsChart");
  if (postsAnalyticsCtx) {
    new Chart(postsAnalyticsCtx, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Posts",
            data: [65, 59, 80, 81, 56, 55, 40],
            backgroundColor: "#600097",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  // Reports Chart
  const reportsChartCtx = document.getElementById("reportsChart");
  if (reportsChartCtx) {
    new Chart(reportsChartCtx, {
      type: "pie",
      data: {
        labels: ["Spam", "Inappropriate", "Harassment", "Other"],
        datasets: [
          {
            data: [35, 25, 20, 20],
            backgroundColor: ["#600097", "#4e54c8", "#8b0c7d", "#ff97fa"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }
}

// Update User Growth Chart based on period
function updateUserGrowthChart(chart, period) {
  const data = {
    weekly: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      data: [120, 150, 180, 160, 200, 180, 160],
    },
    monthly: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      data: [650, 850, 1100, 900, 1200, 1500],
    },
    yearly: {
      labels: ["2020", "2021", "2022", "2023", "2024", "2025"],
      data: [5000, 8000, 12000, 15000, 18000, 22000],
    },
  };

  chart.data.labels = data[period].labels;
  chart.data.datasets[0].data = data[period].data;
  chart.update();
}

// Search functionality
function initializeSearch() {
  document.querySelectorAll(".table-search").forEach((searchInput) => {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const table = this.closest(".card").querySelector("table");
      const rows = table.querySelectorAll("tbody tr");

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
      });
    });
  });
}

// Filter functionality
function initializeFilters() {
  document.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      const filterType = this.textContent.trim();
      const table = this.closest(".card").querySelector("table");
      filterTable(table, filterType);
    });
  });
}

function filterTable(table, filterType) {
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const status = row.querySelector(".badge").textContent.trim();
    row.style.display =
      filterType === "All" || status === filterType ? "" : "none";
  });
}

// User actions
function initializeUserActions() {
  // Handle user status toggle
  document.querySelectorAll('[data-action="toggle-status"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      const userId = this.closest("tr").dataset.userId;
      const currentStatus = this.dataset.status;
      toggleUserStatus(userId, currentStatus);
    });
  });

  // Handle view user profile
  document.querySelectorAll('[data-action="view"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      const userId = this.closest("tr").dataset.userId;
      viewUserProfile(userId);
    });
  });
}

function toggleUserStatus(userId, currentStatus) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  // API call would go here
  console.log(`Toggling user ${userId} status to ${newStatus}`);
}

function viewUserProfile(userId) {
  // Show user profile modal
  const modal = new bootstrap.Modal(
    document.getElementById("userProfileModal")
  );
  modal.show();
}

// Post actions
function initializePostActions() {
  // Handle post status toggle
  document
    .querySelectorAll('[data-action="toggle-post-status"]')
    .forEach((btn) => {
      btn.addEventListener("click", function () {
        const postId = this.closest("tr").dataset.postId;
        const currentStatus = this.dataset.status;
        togglePostStatus(postId, currentStatus);
      });
    });

  // Handle view post
  document.querySelectorAll('[data-action="view-post"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      const postId = this.closest("tr").dataset.postId;
      viewPost(postId);
    });
  });
}

function togglePostStatus(postId, currentStatus) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  // API call would go here
  console.log(`Toggling post ${postId} status to ${newStatus}`);
}

function viewPost(postId) {
  // Show post modal
  const modal = new bootstrap.Modal(document.getElementById("postViewModal"));
  modal.show();
}

// Report actions
function initializeReportActions() {
  // Handle report resolution
  document.querySelectorAll('[data-action="resolve"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      const reportId = this.closest("tr").dataset.reportId;
      resolveReport(reportId);
    });
  });

  // Handle report escalation
  document.querySelectorAll('[data-action="escalate"]').forEach((btn) => {
    btn.addEventListener("click", function () {
      const reportId = this.closest("tr").dataset.reportId;
      escalateReport(reportId);
    });
  });
}

function resolveReport(reportId) {
  // API call would go here
  console.log(`Resolving report ${reportId}`);
  // Update UI
  const row = document.querySelector(`tr[data-report-id="${reportId}"]`);
  const statusBadge = row.querySelector(".badge");
  statusBadge.className = "badge bg-success";
  statusBadge.textContent = "Resolved";
}

function escalateReport(reportId) {
  // API call would go here
  console.log(`Escalating report ${reportId}`);
  // Update UI
  const row = document.querySelector(`tr[data-report-id="${reportId}"]`);
  const statusBadge = row.querySelector(".badge");
  statusBadge.className = "badge bg-danger";
  statusBadge.textContent = "Escalated";
}

// Settings
function initializeSettings() {
  // Handle settings form submissions
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      saveSettings(new FormData(form));
    });
  });
}

function saveSettings(formData) {
  // API call would go here
  console.log("Saving settings:", Object.fromEntries(formData));
  // Show success message
  showToast("Settings saved successfully");
}

// Utility functions
function showToast(message) {
  // Create and show Bootstrap toast
  const toastContainer = document.createElement("div");
  toastContainer.className =
    "toast-container position-fixed bottom-0 end-0 p-3";
  toastContainer.innerHTML = `
    <div class="toast" role="alert">
      <div class="toast-body">${message}</div>
    </div>
  `;
  document.body.appendChild(toastContainer);
  const toast = new bootstrap.Toast(toastContainer.querySelector(".toast"));
  toast.show();

  // Remove after shown
  toastContainer.addEventListener("hidden.bs.toast", () => {
    toastContainer.remove();
  });
}