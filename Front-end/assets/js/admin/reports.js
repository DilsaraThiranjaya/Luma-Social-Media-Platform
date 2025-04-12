document.addEventListener('DOMContentLoaded', async () => {
    const LOGIN_URL = "/Luma-Social-Media-Platform/Front-end/pages/login.html";
    const BASE_URL = "http://localhost:8080/api/v1";
    let authData = JSON.parse(sessionStorage.getItem('authData'));
    let reportsChart;

    // Auth handling utilities
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

    function isTokenExpired(token) {
        try {
            const { exp } = jwt_decode(token);
            return Date.now() >= exp * 1000;
        } catch (error) {
            return true;
        }
    }

    async function refreshAuthToken() {
        try {
            const response = await fetch(`${BASE_URL}/auth/refreshToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: authData.token })
            });

            if (!response.ok) throw new Error('Refresh failed');
            const { data } = await response.json();

            authData.token = data.token;
            sessionStorage.setItem('authData', JSON.stringify(authData));
            return data.token;
        } catch (error) {
            throw error;
        }
    }

    // Main initialization
    if (authData?.token) {
        try {
            if (isTokenExpired(authData.token)) await refreshAuthToken();
            initializeUI();
        } catch (error) {
            await handleAuthError("Session expired. Please log in again.");
        }
    } else {
        await handleAuthError("You need to log in to access this page.");
    }

    async function initializeUI() {
        const Toast = Swal.mixin({
            toast: true,
            position: "bottom-end",
            iconColor: "white",
            customClass: { popup: "colored-toast" },
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
        });

        try {
            initializeReportsChart();
            await loadReportStats();
            await loadReports();
            setupEventListeners();
        } catch (error) {
            throw error;
            Toast.fire({ icon: "error", title: error.message });
        }

        async function loadReportStats() {
            try {
                const response = await fetch(`${BASE_URL}/reports/stats`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, data, message } = await response.json();

                if (code !== 200) throw new Error(message);
                updateStatsDisplay(data);
                updateReportsChart(data);
            } catch (error) {
                throw error;
            }
        }

        function updateStatsDisplay(stats) {
            document.querySelector('[data-stat="total"]').textContent = stats.totalReports;
            document.querySelector('[data-stat="pending"]').textContent = stats.pendingReports;
            document.querySelector('[data-stat="resolved"]').textContent = stats.resolvedReports;
            document.querySelector('[data-stat="escalated"]').textContent = stats.escalatedReports;
        }

        function initializeReportsChart() {
            const ctx = document.getElementById('reportsChart').getContext('2d');
            reportsChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: ['#600097', '#4e54c8', '#8b0c7d', '#ff97fa']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        function updateReportsChart(stats) {
            if (!stats.typeDistribution) return;

            const labels = Object.keys(stats.typeDistribution);
            const data = Object.values(stats.typeDistribution);

            reportsChart.data.labels = labels;
            reportsChart.data.datasets[0].data = data;
            reportsChart.update();
        }

        async function loadReports(status = null, search = null) {
            try {
                const params = new URLSearchParams();
                if (status) params.append('status', status);
                if (search) params.append('search', search);

                const response = await fetch(`${BASE_URL}/reports?${params}`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, data: reports, message } = await response.json();

                if (code !== 200) throw new Error(message);
                displayReports(reports);
            } catch (error) {
                throw new Error('Failed to load reports');
            }
        }

        function displayReports(reports) {
            const tbody = document.getElementById('reportsTableBody');
            tbody.innerHTML = reports.map(report => `
                <tr data-report-id="${report.reportId}">
                    <td style="min-width: 100px;">#${report.reportId}</td>
                    <td>
                        <span class="badge ${getTypeClass(report.type)} rounded-pill" style="min-width: 120px;">
                            ${report.type}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            ${getReportedContentIcon(report)}
                            <span class="small ms-2" style="max-width: 200px">${truncateText(report.description, 60)}</span>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${report.reporter.profilePictureUrl || 'Profile-picture.png'}" 
                                 class="rounded-circle me-2" 
                                 width="30" 
                                 height="30"
                                 alt="${report.reporter.firstName} ${report.reporter.lastName}">
                            <span>${report.reporter.firstName} ${report.reporter.lastName}</span>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${getStatusClass(report.status)} rounded-pill" style="min-width: 100px">
                            ${report.status}
                        </span>
                    </td>
                    <td>${formatDate(report.createdAt)}</td>
                    <td>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-light view-report" 
                                    data-report-id="${report.reportId}"
                                    title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${(report.reporter.email !== authData.email &&
                report.reportedUser?.email !== authData.email &&
                report.reportedPost?.user.email !== authData.email)
                ? (report.status === 'PENDING'
                    ? `
                        <button class="btn btn-sm btn-success resolve-report" 
                                data-report-id="${report.reportId}"
                                title="Resolve Report">
                            <i class="bi bi-check-lg"></i>
                        </button>
                        <button class="btn btn-sm btn-danger escalate-report" 
                                data-report-id="${report.reportId}"
                                title="Escalate Report">
                            <i class="bi bi-exclamation-triangle"></i>
                        </button>
                      `
                    : '')
                : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function setupEventListeners() {
            // Filter buttons
            document.querySelectorAll('[data-filter]').forEach(button => {
                button.addEventListener('click', (e) => {
                    const status = e.currentTarget.dataset.filter === 'ALL'
                        ? null
                        : e.currentTarget.dataset.filter;
                    loadReports(status);

                    document.querySelectorAll('[data-filter]').forEach(btn =>
                        btn.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                });
            });

            // Search input
            let searchTimeout;
            document.querySelector('.table-search').addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    loadReports(null, e.target.value);
                }, 300);
            });

            // Report actions
            document.addEventListener('click', async (e) => {
                const reportId = e.target.closest('[data-report-id]')?.dataset.reportId;
                if (!reportId) return;

                if (e.target.closest('.view-report')) {
                    viewReportDetails(reportId);
                }
                else if (e.target.closest('.resolve-report')) {
                    await updateReportStatus(reportId, 'RESOLVED');
                }
                else if (e.target.closest('.escalate-report')) {
                    await updateReportStatus(reportId, 'ESCALATED');
                }
            });
        }

        document.getElementById('resolveReportBtn').addEventListener('click', async () => {
            const reportId = document.getElementById('reportId').textContent;
            const note = document.getElementById('resolutionNotes').value;
            try {
                const response = await fetch(`${BASE_URL}/reports/${reportId}/notes`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authData.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: note.trim()
                });
                const {code, message} = await response.json();

                if (code !== 200) throw new Error(message);

                await updateReportStatus(reportId, 'RESOLVED');

                // Close the modal after successful resolution
                const modal = bootstrap.Modal.getInstance(document.getElementById('reportViewModal'));
                modal.hide();
            } catch (error) {
                Toast.fire({icon: "error", title: error.message});
            }
        });

        document.getElementById('escalateReportBtn').addEventListener('click', async () => {
            const reportId = document.getElementById('reportId').textContent;
            await updateReportStatus(reportId, 'ESCALATED');

            // Close the modal after successful resolution
            const modal = bootstrap.Modal.getInstance(document.getElementById('reportViewModal'));
            modal.hide();
        });

        async function updateReportStatus(reportId, status) {
            try {
                const response = await fetch(`${BASE_URL}/reports/${reportId}/status?status=${status}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, message } = await response.json();

                if (code === 200) {
                    await loadReports();
                    await loadReportStats();
                } else {
                    throw new Error(message);
                }
            } catch (error) {
                Toast.fire({ icon: "error", title: error.message });
            }
        }

        async function viewReportDetails(reportId) {
            try {
                const response = await fetch(`${BASE_URL}/reports/${reportId}`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const { code, data: report, message } = await response.json();

                if (code !== 200) throw new Error(message);

                // Get button references
                const resolveBtn = document.getElementById('resolveReportBtn');
                const escalateBtn = document.getElementById('escalateReportBtn');

                // Check if user is involved in the report
                const isUserInvolved =
                    report.reporter.email === authData.email ||
                    report.reportedUser?.email === authData.email ||
                    report.reportedPost?.user.email === authData.email;

                // Determine button visibility
                const showActions = !isUserInvolved && report.status === 'PENDING';
                resolveBtn.hidden = !showActions;
                escalateBtn.hidden = !showActions;

                // Update button attributes
                resolveBtn.dataset.reportId = reportId;
                escalateBtn.dataset.reportId = reportId;

                // Populate modal fields
                document.getElementById('reportId').textContent = report.reportId;
                document.getElementById('reportType').textContent = report.type;
                document.getElementById('reportStatus').textContent = report.status;
                document.getElementById('reportDate').textContent = formatDate(report.createdAt);
                document.getElementById('reportPriority').textContent = report.priority || 'N/A';
                document.getElementById('reporterName').textContent =
                    `${report.reporter.firstName} ${report.reporter.lastName}`;
                document.getElementById('resolutionDate').textContent =
                    report.resolvedAt ? formatDate(report.resolvedAt) : 'N/A';
                document.getElementById('reportDescription').textContent = report.description;
                document.getElementById('resolutionNotes').value = report.resolutionNotes || '';

                // Populate reported content
                const contentDiv = document.getElementById('reportedContent');
                contentDiv.innerHTML = getReportedContentHTML(report);

                const modal = new bootstrap.Modal(document.getElementById('reportViewModal'));
                modal.show();
            } catch (error) {
                Toast.fire({ icon: "error", title: error.message });
            }
        }

        function getReportedContentHTML(report) {
            if (report.reportedPost) {
                return `
            <div class="reported-post">
                <h6>Reported Post</h6>
                <p>${truncateText(report.reportedPost.content, 100)}</p>
                ${report.reportedPost.media?.length > 0 ?
                    `<img src="${report.reportedPost.media[0].mediaUrl}" 
                          class="img-thumbnail" 
                          alt="Reported post media">` : ''}
            </div>
        `;
            }
            if (report.reportedUser) {
                return `
            <div class="reported-user">
                <h6>Reported User</h6>
                <div class="d-flex align-items-center">
                    <img src="${report.reportedUser.profilePictureUrl || 'Profile-picture.png'}" 
                         class="rounded-circle me-2" 
                         width="40" 
                         height="40">
                    <span>${report.reportedUser.firstName} ${report.reportedUser.lastName}</span>
                </div>
            </div>
        `;
            }
            if (report.reportedItem) {
                return `
            <div class="reported-item">
                <h6>Reported Item</h6>
                <p>${report.reportedItem.title}</p>
            </div>
        `;
            }
            return '<p>No specific content reported</p>';
        }

        // Utility functions
        function getStatusClass(status) {
            const statusClasses = {
                'PENDING': 'bg-warning',
                'RESOLVED': 'bg-success',
                'ESCALATED': 'bg-danger'
            };
            return statusClasses[status] || 'bg-secondary';
        }

        function getTypeClass(type) {
            const typeClasses = {
                'SPAM': 'bg-warning',
                'HARASSMENT': 'bg-danger',
                'INAPPROPRIATE': 'bg-info',
                'OTHER': 'bg-secondary'
            };
            return typeClasses[type] || 'bg-secondary';
        }

        function getReportedContentIcon(report) {
            if (report.reportedPost) return '<i class="bi bi-file-post"></i>';
            if (report.reportedUser) return '<i class="bi bi-person"></i>';
            if (report.reportedItem) return '<i class="bi bi-bag"></i>';
            return '<i class="bi bi-question-circle"></i>';
        }

        function truncateText(text, maxLength) {
            return text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text || '';
        }

        function formatDate(dateString) {
            try {
                const options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                return new Date(dateString).toLocaleString('en-US', options);
            } catch {
                return 'N/A';
            }
        }
    }
});