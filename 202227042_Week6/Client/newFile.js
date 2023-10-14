document.addEventListener('DOMContentLoaded', function () {
    const hiApiBtn = document.getElementById('hiApi_btn');
    const dataP = document.getElementById('data');

    hiApiBtn.addEventListener('click', function () {
        fetch('/hi')
            .then(response => response.text())
            .then(data => {
                dataP.textContent = data;
            })
            .catch(error => console.error('Error:', error));
    });
});
