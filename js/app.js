(() => {
  "use strict";

  const API_URL = "https://fedskillstest.coalitiontechnologies.workers.dev";
  const USERNAME = "coalition";
  const PASSWORD = "skills-test";
  const TARGET_NAME = "Jessica Taylor";

  let bpChart = null;

  function authHeader(username, password) {
    return `Basic ${btoa(`${username}:${password}`)}`;
  }

  async function fetchPatients() {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Authorization": authHeader(USERNAME, PASSWORD),
        "Accept": "application/json",
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  }

  function findJessica(patients) {
    return patients.find(p => (p?.name || "").trim() === TARGET_NAME) || null;
  }

  function renderPatientList(patients, activeName) {
    const el = document.getElementById("patientList");
    el.innerHTML = "";

    patients.forEach(p => {
      const row = document.createElement("div");
      row.className = "patient-item" + (p.name === activeName ? " active" : "");

      row.innerHTML = `
        <div class="patient-left">
          <img class="patient-avatar" src="${p.profile_picture}" alt="${escapeHtml(p.name)}" />
          <div>
            <div class="patient-name">${escapeHtml(p.name)}</div>
            <div class="patient-meta">${escapeHtml(p.gender)}, ${escapeHtml(String(p.age))}</div>
          </div>
        </div>
        <div class="patient-more">…</div>
      `;

      el.appendChild(row);
    });
  }

  function renderProfile(p) {
    document.getElementById("profilePic").src = p.profile_picture;
    document.getElementById("patientName").textContent = p.name;

    setText("dob", formatDob(p.date_of_birth));
    setText("gender", p.gender);
    setText("phone", p.phone_number);
    setText("emergency", p.emergency_contact);
    setText("insurance", p.insurance_type);
  }

  function renderVitalsFromLatestHistory(p) {
    const latest = (p.diagnosis_history || [])[0];
    if (!latest) return;

    setText("respiratoryRate", `${latest.respiratory_rate?.value ?? "—"} bpm`);
    setText("respiratoryLevel", latest.respiratory_rate?.levels ?? "—");

    setText("temperature", `${latest.temperature?.value ?? "—"}°F`);
    setText("temperatureLevel", latest.temperature?.levels ?? "—");

    setText("heartRate", `${latest.heart_rate?.value ?? "—"} bpm`);
    setText("heartRateLevel", latest.heart_rate?.levels ?? "—");
  }

  function renderBloodPressureSummary(p) {
    const latest = (p.diagnosis_history || [])[0];
    if (!latest) return;

    const sys = latest.blood_pressure?.systolic;
    const dia = latest.blood_pressure?.diastolic;

    setText("bpSystolicValue", sys?.value ?? "—");
    setText("bpSystolicLevel", sys?.levels ?? "—");

    setText("bpDiastolicValue", dia?.value ?? "—");
    setText("bpDiastolicLevel", dia?.levels ?? "—");
  }

  function renderBloodPressureChart(p) {
    const history = (p.diagnosis_history || []).slice(0, 6).reverse();
    const labels = history.map(h => `${shortMonth(h.month)}, ${h.year}`);
    const systolic = history.map(h => h.blood_pressure?.systolic?.value ?? null);
    const diastolic = history.map(h => h.blood_pressure?.diastolic?.value ?? null);

    const canvas = document.getElementById("bpChart");
    if (bpChart) bpChart.destroy();

    bpChart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Systolic",
            data: systolic,
            borderColor: "#f155c7",
            backgroundColor: "transparent",
            pointBackgroundColor: "#f155c7",
            pointRadius: 4,
            tension: 0.35
          },
          {
            label: "Diastolic",
            data: diastolic,
            borderColor: "#6f63ff",
            backgroundColor: "transparent",
            pointBackgroundColor: "#6f63ff",
            pointRadius: 4,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#314252", font: { size: 11 } }
          },
          y: {
            min: 60,
            max: 180,
            ticks: { stepSize: 20, color: "#314252", font: { size: 11 } }
          }
        }
      }
    });
  }

  function renderDiagnosticList(p) {
    const tbody = document.getElementById("diagnosticList");
    const list = p.diagnostic_list || [];

    if (!list.length) {
      tbody.innerHTML = `<tr><td class="text-muted p-3">No diagnostics available</td></tr>`;
      return;
    }

    // 3-column layout in a regular table row
    tbody.innerHTML = list.map(d => `
      <tr>
        <td style="width: 34%">${escapeHtml(d.name || "")}</td>
        <td style="width: 52%">${escapeHtml(d.description || "")}</td>
        <td style="width: 14%">${escapeHtml(d.status || "")}</td>
      </tr>
    `).join("");
  }

  function renderLabResults(p) {
    const el = document.getElementById("labResults");
    const results = p.lab_results || [];

    if (!results.length) {
      el.innerHTML = `<div class="text-muted small p-3">No lab results available</div>`;
      return;
    }

    el.innerHTML = results.map((name, idx) => `
      <div class="lab-item ${idx === 1 ? "active" : ""}">
        <div>${escapeHtml(name)}</div>
        <button class="dlbtn" type="button" aria-label="Download" disabled>⬇</button>
      </div>
    `).join("");
  }

  function shortMonth(m) {
    const map = {
      January: "Jan", February: "Feb", March: "Mar", April: "Apr",
      May: "May", June: "Jun", July: "Jul", August: "Aug",
      September: "Sep", October: "Oct", November: "Nov", December: "Dec"
    };
    return map[m] || m;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "—";
  }

  function formatDob(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function init() {
    try {
      const patients = await fetchPatients();
      const jessica = findJessica(patients);

      if (!jessica) {
        alert("Jessica Taylor not found in API response.");
        return;
      }

      // Main content is Jessica only (per instructions).
      renderPatientList(patients, jessica.name);
      renderProfile(jessica);
      renderVitalsFromLatestHistory(jessica);
      renderBloodPressureSummary(jessica);
      renderBloodPressureChart(jessica);
      renderDiagnosticList(jessica);
      renderLabResults(jessica);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to load patient data.");
    }
  }

  init();
})();