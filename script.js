import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCxbhvZwPoC-9ORjS7V1pv2AGumAXNBREs",
    authDomain: "fastlane-garage.firebaseapp.com",
    projectId: "fastlane-garage",
    storageBucket: "fastlane-garage.appspot.com",
    messagingSenderId: "407672210110",
    appId: "1:407672210110:web:ed86fb9f861d30ddb454ef",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("repairForm");
const tbody = document.querySelector("tbody");
const editForm = document.getElementById("editForm");
let editingReportId = null;

// Manager Login
function login() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, pass)
        .catch(err => alert("Login failed: " + err.message));
}

window.login = login;

// On Auth State Changed (When logged in, display app)
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById("authSection").style.display = "none";
        document.getElementById("mainApp").style.display = "block";
        loadReports();
    }
});

// Update cost based on repairs input
function updateCost() {
    const repairs = parseInt(document.getElementById("repairs").value) || 0;
    document.getElementById("calculatedCost").textContent = repairs * 700;
}

window.updateCost = updateCost;

// Submit report form
form.addEventListener("submit", async e => {
    e.preventDefault();
    const repairs = parseInt(document.getElementById("repairs").value) || 0;
    const cost = repairs * 700;
    const report = {
        employee: document.getElementById("employee").value,
        date: document.getElementById("date").value,
        repairs,
        cost,
        approved: document.getElementById("approved").checked
    };
    if (!report.approved) return alert("Please approve before submitting.");
    await addDoc(collection(db, "reports"), report);
    form.reset();
    document.getElementById("calculatedCost").textContent = "0";
    loadReports();
    alert("Report submitted!");
});

// Load reports and update totals for repairs and costs
async function loadReports() {
    const selectedEmployee = document.getElementById("employeeFilter").value; // Get selected employee for filtering
    const snapshot = await getDocs(collection(db, "reports"));

    tbody.innerHTML = "";
    let totalRepairs = 0;
    let totalCost = 0;

    snapshot.forEach(docSnap => {
        const r = docSnap.data();

        // Only show reports for selected employee or all if no employee is selected
        if (!selectedEmployee || r.employee === selectedEmployee) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${r.employee}</td>
                <td>${r.date}</td>
                <td>${r.repairs}</td>
                <td>₹${r.cost}</td>
                <td>${r.approved ? "✔️" : "❌"}</td>
                <td><button onclick="editReport('${docSnap.id}')">Edit</button><button onclick="deleteReport('${docSnap.id}')">Delete</button></td>
            `;
            tbody.appendChild(row);

            totalRepairs += r.repairs;
            totalCost += r.cost;
        }
    });

    document.getElementById("totalRepairs").textContent = totalRepairs;
    document.getElementById("totalCost").textContent = totalCost;
}

window.loadReports = loadReports;

// Delete report
async function deleteReport(id) {
    await deleteDoc(doc(db, "reports", id));
    loadReports();
    alert("Report deleted!");
}

window.deleteReport = deleteReport;

// Edit report
async function editReport(id) {
    editingReportId = id;
    const docRef = doc(db, "reports", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const report = docSnap.data();
        document.getElementById("editEmployee").value = report.employee;
        document.getElementById("editDate").value = report.date;
        document.getElementById("editRepairs").value = report.repairs;
        document.getElementById("editCalculatedCost").textContent = report.cost;
        document.getElementById("editApproved").checked = report.approved;
        editForm.style.display = "block";
    }
}

window.editReport = editReport;

// Close edit form
function closeEditForm() {
    editingReportId = null;
    editForm.style.display = "none";
    document.getElementById("editEmployee").value = "";
    document.getElementById("editDate").value = "";
    document.getElementById("editRepairs").value = "";
    document.getElementById("editCalculatedCost").textContent = "0";
    document.getElementById("editApproved").checked = false;
}

window.closeEditForm = closeEditForm;

// Update edited report
async function updateReport() {
    const report = {
        employee: document.getElementById("editEmployee").value,
        date: document.getElementById("editDate").value,
        repairs: parseInt(document.getElementById("editRepairs").value),
        cost: parseInt(document.getElementById("editRepairs").value) * 700,
        approved: document.getElementById("editApproved").checked,
    };
    if (!report.approved) return alert("Please approve before updating.");
    await updateDoc(doc(db, "reports", editingReportId), report);
    loadReports();
    closeEditForm();
    alert("Report updated!");
}

window.updateReport = updateReport;

// Generate PDF
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("FastLane Garage - Reports", 10, 10);
    doc.text("Employee | Date | Repairs | Cost | Approved", 10, 20);

    const snapshot = await getDocs(collection(db, "reports"));
    let y = 30;
    snapshot.forEach(docSnap => {
        const r = docSnap.data();
        doc.text(`${r.employee} | ${r.date} | ${r.repairs} | ₹${r.cost} | ${r.approved ? "✔️" : "❌"}`, 10, y);
        y += 10;
    });

    doc.save("reports.pdf");
}

window.generatePDF = generatePDF;

// Export CSV
async function exportCSV() {
    const rows = [["Employee", "Date", "Repairs", "Cost", "Approved"]];
    const snapshot = await getDocs(collection(db, "reports"));
    snapshot.forEach(docSnap => {
        const r = docSnap.data();
        rows.push([r.employee, r.date, r.repairs, r.cost, r.approved ? "✔️" : "❌"]);
    });

    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reports.csv";
    link.click();
}

window.exportCSV = exportCSV;

// Logout
function logout() {
    signOut(auth)
        .then(() => {
            document.getElementById("authSection").style.display = "block";
            document.getElementById("mainApp").style.display = "none";
            alert("Logged out successfully");
        })
        .catch(err => alert("Logout failed: " + err.message));
}

window.logout = logout;

// Update cost in edit form
function updateEditCost() {
    const repairs = parseInt(document.getElementById("editRepairs").value) || 0;
    document.getElementById("editCalculatedCost").textContent = repairs * 700;
}

window.updateEditCost = updateEditCost;

// Clear all reports (requires password)
async function clearReports() {
    const password = prompt("Enter password to clear all reports:");
    const correctPassword = "admin123"; // Set your secure password

    if (password === correctPassword) {
        const reportsSnapshot = await getDocs(collection(db, "reports"));
        reportsSnapshot.forEach(async docSnap => {
            await deleteDoc(doc(db, "reports", docSnap.id));
        });

        loadReports();
        alert("All reports have been cleared!");
    } else {
        alert("Incorrect password. Operation canceled.");
    }
}

window.clearReports = clearReports;
