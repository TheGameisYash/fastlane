import { db } from './firebase.js';
import { getDocs, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const reportForm = document.getElementById('reportForm');
const reportTable = document.querySelector("#reportTable tbody");
const calculatedCost = document.getElementById('calculatedCost');
const totalRepairsEl = document.getElementById("totalRepairs");
const totalCostEl = document.getElementById("totalCost");
const employeeFilter = document.getElementById("employeeFilter");

// Submit Report
reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const employee = document.getElementById("employee").value;
    const date = document.getElementById("date").value;
    const repairs = parseInt(document.getElementById("repairs").value);
    const cost = repairs * 700;

    const report = {
        employee,
        date,
        repairs,
        cost,
        approved: false
    };

    await addDoc(collection(db, "reports"), report);
    alert("Report submitted!");
    reportForm.reset();
    loadReports(employeeFilter.value);
});

// Cost Calculation
document.getElementById('repairs').addEventListener('input', () => {
    const repairs = parseInt(document.getElementById('repairs').value) || 0;
    calculatedCost.textContent = repairs * 700;
});

// Load Reports with filter
async function loadReports(filterByEmployee = "") {
    const snapshot = await getDocs(collection(db, "reports"));
    reportTable.innerHTML = "";
    let totalRepairs = 0;
    let totalCost = 0;

    snapshot.forEach(docSnap => {
        const report = docSnap.data();
        if (filterByEmployee && report.employee !== filterByEmployee) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.employee}</td>
            <td>${report.date}</td>
            <td>${report.repairs}</td>
            <td>₹${report.cost}</td>
            <td>${report.approved ? '✔️' : '❌'}</td>
        `;
        reportTable.appendChild(row);

        totalRepairs += report.repairs;
        totalCost += report.cost;
    });

    totalRepairsEl.textContent = totalRepairs;
    totalCostEl.textContent = totalCost;
    loadTopEmployeeThisWeek();
}

// Populate employee and filter dropdowns
async function loadEmployees() {
    const employeeSelect = document.getElementById("employee");
    const snapshot = await getDocs(collection(db, "employees"));

    snapshot.forEach(doc => {
        const name = doc.data().name;

        const opt1 = document.createElement("option");
        opt1.value = opt1.textContent = name;
        employeeSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = opt2.textContent = name;
        employeeFilter.appendChild(opt2);
    });
}

// Weekly Top Employee
async function loadTopEmployeeThisWeek() {
    const snapshot = await getDocs(collection(db, "reports"));
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const stats = {};
    snapshot.forEach(docSnap => {
        const report = docSnap.data();
        const reportDate = new Date(report.date);
        if (report.approved && reportDate >= start && reportDate <= end) {
            if (!stats[report.employee]) {
                stats[report.employee] = { repairs: 0, cost: 0 };
            }
            stats[report.employee].repairs += report.repairs;
            stats[report.employee].cost += report.cost;
        }
    });

    let top = null, max = -1;
    for (const [name, stat] of Object.entries(stats)) {
        if (stat.repairs > max) {
            max = stat.repairs;
            top = { name, ...stat };
        }
    }

    const fameBox = document.getElementById("topEmployeeName");
    fameBox.textContent = top
        ? `${top.name} - ${top.repairs} repairs, ₹${top.cost}`
        : "No data for this week yet.";
}

// Event listener for filter dropdown
employeeFilter.addEventListener("change", () => {
    loadReports(employeeFilter.value);
});

loadEmployees();
loadReports();
