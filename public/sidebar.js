// sidebar.js
function openSidebar() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("mainContent").style.marginLeft = "250px"; // Сдвигаем контент вправо
}

function closeSidebar() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("mainContent").style.marginLeft = "0"; // Возвращаем контент в исходное положение
}

// Загружаем HTML боковой панели в нужный div
document.addEventListener("DOMContentLoaded", function() {
  fetch("sidebar.html")
    .then(response => response.text())
    .then(data => {
      const sidebarContainer = document.createElement("div");
      sidebarContainer.innerHTML = data;
      document.body.insertBefore(sidebarContainer, document.body.firstChild);

      // Привязываем функции к кнопкам после загрузки боковой панели
      document.getElementById("openSidebarBtn").onclick = openSidebar;
      document.querySelector(".closebtn").onclick = closeSidebar;
    });
});