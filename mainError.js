const errorBtn = document.getElementById('errorBtn');

        errorBtn.addEventListener('click', function () {
            location.reload();   // refresh the entire page
            window.location.href = "/weatherApp/index.html";
        })