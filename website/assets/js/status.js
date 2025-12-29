/* ===== Connection Status Logic (Updated) ===== */
document.addEventListener('DOMContentLoaded', function() {
    
    function checkZeusConnection() {
        const iconDisplay = document.getElementById('icon-display');
        const textDisplay = document.getElementById('text-display');
        const statusContainer = document.getElementById('connection-status');

        if (!iconDisplay || !textDisplay || !statusContainer) return;

        iconDisplay.innerHTML = '<i class="fal fa-spinner fa-spin"></i>';
        textDisplay.innerHTML = 'در حال بررسی ...';
        statusContainer.classList.remove('connected', 'pro-connected', 'disconnected');
        statusContainer.classList.add('waiting');

        const timestamp = Date.now();
        const stdUrl = "https://check.zeusdns.ir:2001/image.png?t=" + timestamp;
        const proUrl = "https://procheck.zeusdns.ir:2001/image.png?t=" + timestamp;

        let stdSuccess = false;
        let proSuccess = false;
        let checksCompleted = 0;

        function onCheckFinished() {
            checksCompleted++;
            
            if (checksCompleted < 2) return;

            statusContainer.classList.remove('waiting');

            if (proSuccess) {
                iconDisplay.innerHTML = '<i class="far fa-crown"></i>';
                textDisplay.innerHTML = 'زئوس پرو در دستان شماست';
                statusContainer.classList.add('pro-connected');
            } else if (stdSuccess) {
                iconDisplay.innerHTML = '<i class="fa fa-check-circle"></i>';
                textDisplay.innerHTML = 'زئوس در دستان شماست!';
                statusContainer.classList.add('connected');
            } else {
                iconDisplay.innerHTML = '<i class="fa fa-exclamation-circle"></i>';
                textDisplay.innerHTML = 'زئوس برای شما فعال نیست! مطمئن شوید تنظیمات را مطابق بخش راهنمای اتصال انجام داده اید.';
                statusContainer.classList.add('disconnected');
            }
        }

        function testLink(url, isPro) {
            const img = new Image();
            
            const timer = setTimeout(() => {
                if (!img.complete) {
                    img.src = ""; 
                    onCheckFinished();
                }
            }, 5000);

            img.onload = function() {
                clearTimeout(timer);
                if (isPro) proSuccess = true;
                else stdSuccess = true;
                onCheckFinished();
            };

            img.onerror = function() {
                clearTimeout(timer);
                onCheckFinished();
            };

            img.src = url;
        }

        testLink(stdUrl, false);
        testLink(proUrl, true);
    }

    const statusBox = document.getElementById('connection-status');
    if (statusBox) {
        statusBox.addEventListener('click', checkZeusConnection);
    }

    window.addEventListener('load', checkZeusConnection);
});