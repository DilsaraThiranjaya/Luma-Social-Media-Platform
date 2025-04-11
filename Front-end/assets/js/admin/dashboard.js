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
            const {exp} = jwt_decode(token);
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

        initializeDashboard();

        async function initializeDashboard() {
            try {
                // Fetch initial dashboard stats
                const stats = await fetchDashboardStats();
                updateDashboardStats(stats);

                // Initialize charts
                await initializeCharts();

                // Fetch and display recent activities
                await loadRecentActivities();

                // Setup event listeners
                setupEventListeners();
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: error.message || "Error loading dashboard data"
                })
            }
        }

        async function fetchDashboardStats() {
            const response = await fetch(`${BASE_URL}/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch dashboard stats");
            return await response.json();
        }

        function updateDashboardStats(stats) {
            // Update stats cards
            document.querySelector(".total-users").textContent = stats.totalUsers.toLocaleString();
            document.querySelector(".total-posts").textContent = stats.totalPosts.toLocaleString();
            document.querySelector(".active-reports").textContent = stats.activeReports.toLocaleString();
            document.querySelector(".user-activity").textContent = `${Math.round(stats.userActivity)}%`;

            // Update growth indicators
            updateGrowthIndicator(".user-growth", stats.userGrowthRate);
            updateGrowthIndicator(".post-growth", stats.postGrowthRate);
            updateGrowthIndicator(".report-change", stats.reportDecreaseRate);
            updateGrowthIndicator(".activity-growth", stats.activityGrowthRate);
        }

        function updateGrowthIndicator(selector, rate) {
            const element = document.querySelector(selector);
            const icon = element.querySelector("i");
            const value = element.querySelector("span");

            const isPositive = rate > 0;
            icon.className = isPositive ? "bi bi-arrow-up" : "bi bi-arrow-down";
            element.className = `stats-trend ${isPositive ? "positive" : "negative"}`;
            value.textContent = `${Math.abs(Math.round(rate))}%`;
        }

        async function initializeCharts() {
            // Initialize User Growth Chart with default monthly period
            const userGrowthData = await fetchUserGrowth("monthly");
            const userGrowthChart = initializeUserGrowthChart(userGrowthData);

            // Initialize Demographics Chart
            const demographicsData = await fetchUserDemographics();
            initializeDemographicsChart(demographicsData);

            // Setup event listeners for period buttons
            document.querySelectorAll(".card-actions .btn").forEach((btn) => {
                btn.addEventListener("click", async function() {
                    try {
                        const period = this.dataset.period;
                        const newData = await fetchUserGrowth(period);
                        updateUserGrowthChart(userGrowthChart, newData);

                        // Update active state
                        document.querySelectorAll(".card-actions .btn")
                            .forEach((b) => b.classList.remove("active"));
                        this.classList.add("active");
                    } catch (error) {
                        Toast.fire({
                            icon: "error",
                            title: error.message || "Error updating chart data"
                        })
                    }
                });
            });
        }

        async function fetchUserGrowth(period) {
            const response = await fetch(`${BASE_URL}/dashboard/user-growth?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch user growth data");
            return await response.json();
        }

        async function fetchUserDemographics() {
            const response = await fetch(`${BASE_URL}/dashboard/user-demographics`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch demographics data");
            return await response.json();
        }

        function initializeUserGrowthChart(data) {
            const ctx = document.getElementById("userGrowthChart").getContext("2d");

            return new Chart(ctx, {
                type: "line",
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: "New Users",
                        data: data.data,
                        borderColor: "#600097",
                        tension: 0.4,
                        fill: true,
                        backgroundColor: "rgba(96, 0, 151, 0.1)"
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: "rgba(0, 0, 0, 0.05)"
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        function updateUserGrowthChart(chart, data) {
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.data;
            chart.update();
        }

        function initializeDemographicsChart(data) {
            const ctx = document.getElementById("demographicsChart").getContext("2d");
            new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.data,
                        backgroundColor: ["#600097", "#4e54c8", "#8b0c7d", "#ff97fa"]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "bottom"
                        }
                    }
                }
            });
        }

        async function loadRecentActivities() {
            try {
                // Fetch recent reports
                const reports = await fetchRecentReports();
                updateRecentReports(reports);

                // Fetch new users
                const users = await fetchNewUsers();
                updateNewUsers(users);
            } catch (error) {
                Toast.fire({
                    icon: "error",
                    title: error.message || "Error loading recent activities"
                })
            }
        }

        async function fetchRecentReports() {
            const response = await fetch(`${BASE_URL}/dashboard/recent-reports`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch recent reports");
            return await response.json();
        }

        async function fetchNewUsers() {
            const response = await fetch(`${BASE_URL}/dashboard/new-users`, {
                headers: {
                    'Authorization': `Bearer ${authData.token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch new users");
            return await response.json();
        }

        function updateRecentReports(reports) {
            const container = document.querySelector(".recent-reports-list");
            container.innerHTML = reports.map(report => `
    <div class="list-group-item">
      <div class="d-flex align-items-center">
        <img src="${report.reporter.profilePictureUrl || '../../assets/image/Test-profile-img.jpg'}" 
             alt="User" class="rounded-circle me-3" width="40">
        <div class="flex-grow-1">
          <h6 class="mb-1">${report.type} Report</h6>
          <p class="mb-0 text-muted">
            Reported by ${report.reporter.firstName} ${report.reporter.lastName} • 
            ${formatTimeAgo(report.createdAt)}
          </p>
        </div>
        <span class="badge bg-${getStatusBadgeColor(report.status)}">${report.status}</span>
      </div>
    </div>
  `).join("");
        }

        function updateNewUsers(users) {
            const container = document.querySelector(".new-users-list");
            container.innerHTML = users.map(user => `
    <div class="list-group-item">
      <div class="d-flex align-items-center">
        <img src="${user.profilePictureUrl || '../../assets/image/Test-profile-img.jpg'}" 
             alt="User" class="rounded-circle me-3" width="40">
        <div class="flex-grow-1">
          <h6 class="mb-1">${user.firstName} ${user.lastName}</h6>
          <p class="mb-0 text-muted">Joined ${formatTimeAgo(user.createdAt)}</p>
        </div>
        <button class="btn btn-sm btn-outline-primary view-profile-btn" 
                        data-user-id="${user.userId}">
                    View Profile
                </button>
      </div>
    </div>
  `).join("");

            document.querySelectorAll('.view-profile-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    viewUserProfile(userId);
                });
            });
        }

        function viewUserProfile(userId) {
            window.location.href = `../profile-view.html?id=${userId}` ;
        }

        function getStatusBadgeColor(status) {
            switch (status) {
                case "PENDING":
                    return "warning";
                case "RESOLVED":
                    return "success";
                case "ESCALATED":
                    return "danger";
                default:
                    return "secondary";
            }
        }

        function formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);

            if (seconds < 60) return "just now";
            if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
            return `${Math.floor(seconds / 86400)} days ago`;
        }

        function setupEventListeners() {
            // Sidebar toggle
            const toggleBtn = document.querySelector(".toggle-sidebar");
            const sidebar = document.querySelector(".admin-sidebar");
            const mainContent = document.querySelector(".admin-main");

            if (toggleBtn) {
                toggleBtn.addEventListener("click", () => {
                    sidebar.classList.toggle("show");
                    mainContent.classList.toggle("sidebar-hidden");
                });
            }
        }
    }
});