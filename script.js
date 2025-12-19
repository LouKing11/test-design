const ctx = document.getElementById("bpChart");

new Chart(ctx, {
  type: "line",
  data: {
    labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    datasets: [
      {
        data: [120, 118, 160, 110, 145, 160],
        borderColor: "#ec4899",
        tension: 0.4,
      },
      {
        data: [100, 90, 110, 95, 75, 78],
        borderColor: "#6366f1",
        tension: 0.4,
      },
    ],
  },
  options: {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false } },
  },
});
