const taskRows = [...document.querySelectorAll("#taskRows tr")];
const userRows = [...document.querySelectorAll("#userRows tr")];
const taskSearch = document.querySelector("#taskSearch");
const taskStatusFilter = document.querySelector("#taskStatusFilter");
const userSearch = document.querySelector("#userSearch");
const globalSearch = document.querySelector("#globalSearch");
const taskCount = document.querySelector("#taskCount");
const userCount = document.querySelector("#userCount");

function filterRows(rows, query, predicate = () => true) {
  const normalizedQuery = query.trim().toLowerCase();
  let visible = 0;

  rows.forEach((row) => {
    const matchesQuery = row.textContent.toLowerCase().includes(normalizedQuery);
    const matchesPredicate = predicate(row);
    const show = matchesQuery && matchesPredicate;
    row.hidden = !show;
    if (show) visible += 1;
  });

  return visible;
}

function updateTaskRows() {
  const selectedStatus = taskStatusFilter.value;
  const visible = filterRows(taskRows, taskSearch.value, (row) => selectedStatus === "all" || row.dataset.status === selectedStatus);
  taskCount.textContent = `Showing ${visible} of 18 tasks`;
}

function updateUserRows() {
  const visible = filterRows(userRows, userSearch.value);
  userCount.textContent = `Showing ${visible} recent users`;
}

function showToast(message) {
  document.querySelector("#adminToastMessage").textContent = message;
  bootstrap.Toast.getOrCreateInstance(document.querySelector("#adminToast")).show();
}

taskSearch.addEventListener("input", updateTaskRows);
taskStatusFilter.addEventListener("change", updateTaskRows);
userSearch.addEventListener("input", updateUserRows);

document.querySelector("#clearTaskFilters").addEventListener("click", () => {
  taskSearch.value = "";
  taskStatusFilter.value = "all";
  updateTaskRows();
});

globalSearch.addEventListener("input", () => {
  const query = globalSearch.value;
  taskSearch.value = query;
  userSearch.value = query;
  updateTaskRows();
  updateUserRows();
});

globalSearch.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    globalSearch.focus();
  }
});

document.querySelectorAll(".user-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const status = button.closest("tr").querySelector(".user-status");
    const suspend = button.textContent.trim() === "Suspend";
    status.textContent = suspend ? "Suspended" : "Active";
    status.className = `status-label user-status ${suspend ? "status-suspended" : "status-open"}`;
    button.textContent = suspend ? "Restore" : "Suspend";
    showToast(suspend ? "User access suspended." : "User access restored.");
  });
});

document.querySelectorAll(".row-action").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("tr");
    if (row.dataset.status === "flagged") {
      row.dataset.status = "open";
      row.querySelector(".status-label").textContent = "Open";
      row.querySelector(".status-label").className = "status-label status-open";
      button.setAttribute("aria-label", "Mark task completed");
      button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
      showToast("Task report cleared.");
    } else if (row.dataset.status === "open" || row.dataset.status === "in progress") {
      row.dataset.status = "completed";
      row.querySelector(".status-label").textContent = "Completed";
      row.querySelector(".status-label").className = "status-label status-complete";
      button.disabled = true;
      showToast("Task marked completed.");
    } else {
      showToast("Task details opened.");
    }
    updateTaskRows();
  });
});

document.querySelector("#refreshActivity").addEventListener("click", () => showToast("Activity log is up to date."));
document.querySelector("#showAllActivity").addEventListener("click", () => showToast("Showing the latest activity entries."));

document.querySelector("#exportTasks").addEventListener("click", () => {
  const header = ["Task", "Poster", "Offers", "Budget", "Status", "Updated"];
  const rows = taskRows.map((row) => [...row.querySelectorAll("td")].slice(0, 6).map((cell) => cell.innerText.replace(/\s+/g, " ").trim()));
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "errand-task-report.csv";
  link.click();
  URL.revokeObjectURL(url);
  bootstrap.Modal.getInstance(document.querySelector("#reportModal")).hide();
  showToast("Task report downloaded.");
});
