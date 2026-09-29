function showAdminNotice(message) {
  const toastElement = document.querySelector("#adminToast");
  if (!toastElement) return;
  document.querySelector("#adminToastMessage").textContent = message;
  bootstrap.Toast.getOrCreateInstance(toastElement).show();
}

function updateAdminTable(table) {
  const tableSelector = `#${table.id}`;
  const query = (document.querySelector(`[data-admin-search="${tableSelector}"]`)?.value || "").trim().toLowerCase();
  const status = document.querySelector(`[data-status-filter="#${table.id}"]`)?.value || "all";
  let visible = 0;

  table.querySelectorAll("tr").forEach((row) => {
    const matchesQuery = row.textContent.toLowerCase().includes(query);
    const matchesStatus = status === "all" || row.dataset.status === status;
    row.hidden = !(matchesQuery && matchesStatus);
    if (!row.hidden) visible += 1;
  });

  const count = document.querySelector(`[data-row-count="#${table.id}"]`);
  if (count) count.textContent = `Showing ${visible} ${table.id === "activityRows" ? "events" : table.id === "userAdminRows" ? "users" : "tasks"}`;
}

document.querySelectorAll("[data-admin-search]").forEach((input) => {
  const table = document.querySelector(input.dataset.adminSearch);
  input.addEventListener("input", () => {
    document.querySelectorAll(`[data-admin-search="${input.dataset.adminSearch}"]`).forEach((peer) => {
      if (peer !== input) peer.value = input.value;
    });
    updateAdminTable(table);
  });
});

document.querySelectorAll("[data-status-filter]").forEach((select) => {
  const table = document.querySelector(select.dataset.statusFilter);
  select.addEventListener("change", () => updateAdminTable(table));
});

document.querySelectorAll("[data-reset-filters]").forEach((button) => {
  button.addEventListener("click", () => {
    const tableId = button.dataset.resetFilters;
    const search = document.querySelector(`[data-admin-search="${tableId}"]`);
    const status = document.querySelector(`[data-status-filter="${tableId}"]`);
    document.querySelectorAll(`[data-admin-search="${tableId}"]`).forEach((input) => { input.value = ""; });
    if (status) status.value = "all";
    const table = document.querySelector(tableId);
    if (table) updateAdminTable(table);
  });
});

document.querySelectorAll("[data-task-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("tr");
    const status = row.querySelector(".status-label");
    if (button.dataset.taskAction === "clear") {
      row.dataset.status = "open";
      status.textContent = "Open";
      status.className = "status-label status-open";
      button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
      showAdminNotice("Task report cleared.");
    } else {
      row.dataset.status = "completed";
      status.textContent = "Completed";
      status.className = "status-label status-complete";
      button.disabled = true;
      showAdminNotice("Task marked completed.");
    }
    const table = row.closest("tbody");
    if (table) updateAdminTable(table);
  });
});

document.querySelectorAll(".user-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("tr");
    const status = row.querySelector(".user-status");
    const suspend = button.textContent.trim() !== "Restore";
    row.dataset.status = suspend ? "suspended" : "active";
    status.textContent = suspend ? "Suspended" : "Active";
    status.className = `status-label user-status ${suspend ? "status-suspended" : "status-open"}`;
    button.textContent = suspend ? "Restore" : "Suspend";
    showAdminNotice(suspend ? "User access suspended." : "User access restored.");
    updateAdminTable(row.closest("tbody"));
  });
});

document.querySelector("#refreshActivity")?.addEventListener("click", () => showAdminNotice("Activity log is up to date."));

document.querySelectorAll("[data-export-table]").forEach((button) => {
  button.addEventListener("click", () => {
    const table = document.querySelector(button.dataset.exportTable);
    if (!table) return;
    const rows = [...table.querySelectorAll("tr")].filter((row) => !row.hidden).map((row) => [...row.cells].map((cell) => `"${cell.innerText.replace(/\s+/g, " ").replaceAll('"', '""').trim()}"`).join(","));
    const url = URL.createObjectURL(new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${table.id.replace("Rows", "")}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showAdminNotice("Report downloaded.");
  });
});
