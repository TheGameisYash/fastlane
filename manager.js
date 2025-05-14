import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Load Reports for Manager
async function loadReports() {
    const db = getFirestore();
    const snapshot = await getDocs(collection(db, "reports"));
    const tableBody = document.getElementById("reportTable");
    tableBody.innerHTML = "";

    snapshot.forEach(docSnap => {
        const report = docSnap.data();
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${report.employee}</td>
            <td>${report.date}</td>
            <td>${report.repairs}</td>
            <td>₹${report.cost}</td>
            <td>${report.approved ? "✔️" : "❌"}</td>
            <td>
                <button class="approveButton" data-report-id="${docSnap.id}">Approve</button>
                <button class="deleteButton" data-report-id="${docSnap.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners for approve and delete buttons
    const approveButtons = document.querySelectorAll(".approveButton");
    const deleteButtons = document.querySelectorAll(".deleteButton");

    approveButtons.forEach(button => {
        button.addEventListener("click", () => {
            const reportId = button.dataset.reportId;  // Get the report ID from data attribute
            approveReport(reportId);
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener("click", () => {
            const reportId = button.dataset.reportId;  // Get the report ID from data attribute
            deleteReport(reportId);
        });
    });
}

// Approve Report
async function approveReport(id) {
    const db = getFirestore();
    const reportRef = doc(db, "reports", id);
    await updateDoc(reportRef, { approved: true });
    loadReports();
}

// Delete Report
async function deleteReport(id) {
    const db = getFirestore();
    await deleteDoc(doc(db, "reports", id));
    loadReports();
}

// Logout
function logout() {
    const auth = getAuth();
    signOut(auth).then(() => {
        window.location.href = "index.html";  // Redirect to login page after logout
    }).catch((error) => {
        console.error("Error during logout:", error);
    });
}

window.logout=logout;

// Initialize reports loading when the page is loaded
document.addEventListener("DOMContentLoaded", loadReports);
