// Reports Management JavaScript

document.addEventListener('DOMContentLoaded', function () {
    const BASE_URL = "http://localhost:8080/api/v1";
    const authData = JSON.parse(sessionStorage.getItem('authData'));

    // Initialize the page
    loadReportStats();
    loadReports();

    // Setup event listeners
    setupSearchListener();
    setupFilterListeners();
    setupReportActions();
    initializeReportsChart();

    // Load report statistics
    async function loadReportStats() {
        try {
            const response = await fetch(`${BASE_URL}/reports/stats`,
                {
                    headers: {
                        'Authorization': `Bearer ${authData.token}`
                    }
                });
            const data = await response.json();

            if (data.code === 'OK') {
                updateStatsDisplay(data.content);
            }
        } catch (error) {
            throw error;
            showToast('Error loading report statistics', 'error');
        }
    }

// Update statistics display
    function updateStatsDisplay(stats) {
        // Update quick stats
        document.querySelector('[data-stat="total"]').textContent = stats.totalReports;
        document.querySelector('[data-stat="pending"]').textContent = stats.pendingReports;
        document.querySelector('[data-stat="resolved"]').textContent = stats.resolvedReports;
        document.querySelector('[data-stat="escalated"]').textContent = stats.escalatedReports;
    }

// Load reports with optional filters
    async function loadReports(status = null, search = null) {
        try {
            let url = `${BASE_URL}/reports`;
            const params = new URLSearchParams();

            if (status) params.append('status', status);
            if (search) params.append('search', search);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url,
                {
                    headers: {
                        'Authorization': `Bearer ${authData.token}`
                    }
                });
            const data = await response.json();

            if (data.code === 'OK') {
                displayReports(data.content);
            }
        } catch (error) {
           throw error;
            showToast('Error loading reports', 'error');
        }
    }

// Display reports in the table
    function displayReports(reports) {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = '';

        reports.forEach(report => {
            const row = document.createElement('tr');
            row.dataset.reportId = report.reportId;

            const statusClass = getStatusClass(report.status);
            const typeClass = getTypeClass(report.type);

            row.innerHTML = `
            <td>#${report.reportId}</td>
            <td><span class="badge ${typeClass}">${report.type}</span></td>
            <td>
                <div class="d-flex align-items-center">
                    ${getReportedContentIcon(report)}
                    <span class="ms-2">${report.description}</span>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${report.reporter.profilePictureUrl || '../../assets/image/default-profile.jpg'}" 
                         alt="Reporter" class="rounded-circle me-2" width="30">
                    <span>${report.reporter.firstName} ${report.reporter.lastName}</span>
                </div>
            </td>
            <td><span class="badge ${statusClass}">${report.status}</span></td>
            <td>${formatDate(report.createdAt)}</td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-light" onclick="viewReport(${report.reportId})">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${getActionButtons(report.status)}
                </div>
            </td>
        `;

            tbody.appendChild(row);
        });
    }

// Setup search functionality
    function setupSearchListener() {
        const searchInput = document.querySelector('.table-search');
        let debounceTimer;

        searchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadReports(null, this.value);
            }, 300);
        });
    }

// Setup filter functionality
    function setupFilterListeners() {
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', function () {
                const status = this.dataset.filter === 'All' ? null : this.dataset.filter.toUpperCase();
                loadReports(status);

                // Update active state
                document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

// Setup report actions
    function setupReportActions() {
        document.addEventListener('click', async function (e) {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const reportId = button.closest('tr').dataset.reportId;
            const action = button.dataset.action;

            try {
                let status;

                if (action === 'resolve') {
                    status = 'RESOLVED';
                } else if (action === 'escalate') {
                    status = 'ESCALATED';
                }

                const response = await fetch(`${BASE_URL}/reports/${reportId}/status?status=${status}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authData.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (data.code === 'OK') {
                    showToast(`Report ${action}d successfully`, 'success');
                    loadReports();
                    loadReportStats();
                }
            } catch (error) {
                throw error;
                showToast(`Error ${action}ing report`, 'error');
            }
        });
    }

// Initialize reports chart
    function initializeReportsChart() {
        const ctx = document.getElementById('reportsChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Spam', 'Harassment', 'Inappropriate', 'Other'],
                datasets: [{
                    data: [35, 25, 20, 20],
                    backgroundColor: ['#600097', '#4e54c8', '#8b0c7d', '#ff97fa']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

// View report details
    function viewReport(reportId) {
        // Show report modal
        const modal = new bootstrap.Modal(document.getElementById('reportViewModal'));
        modal.show();
    }

// Utility functions
    function getStatusClass(status) {
        const classes = {
            'PENDING': 'bg-warning',
            'RESOLVED': 'bg-success',
            'ESCALATED': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    function getTypeClass(type) {
        const classes = {
            'SPAM': 'bg-warning',
            'HARASSMENT': 'bg-danger',
            'INAPPROPRIATE': 'bg-info',
            'OTHER': 'bg-secondary'
        };
        return classes[type] || 'bg-secondary';
    }

    function getReportedContentIcon(report) {
        if (report.reportedPost) {
            return '<i class="bi bi-file-post"></i>';
        } else if (report.reportedUser) {
            return '<i class="bi bi-person"></i>';
        } else if (report.reportedItem) {
            return '<i class="bi bi-bag"></i>';
        }
        return '<i class="bi bi-question-circle"></i>';
    }

    function getActionButtons(status) {
        if (status === 'PENDING') {
            return `
            <button class="btn btn-sm btn-success" data-action="resolve">
                <i class="bi bi-check-lg"></i>
            </button>
            <button class="btn btn-sm btn-danger" data-action="escalate">
                <i class="bi bi-exclamation-triangle"></i>
            </button>
        `;
        }
        return '';
    }

    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 3600000) { // Less than 1 hour
            return `${Math.floor(diff / 60000)} minutes ago`;
        } else if (diff < 86400000) { // Less than 24 hours
            return `${Math.floor(diff / 3600000)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    function showToast(message, type = 'success') {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';

        toastContainer.innerHTML = `
        <div class="toast" role="alert">
            <div class="toast-body bg-${type} text-white">
                ${message}
            </div>
        </div>
    `;

        document.body.appendChild(toastContainer);
        const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
        toast.show();

        toastContainer.addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }
});