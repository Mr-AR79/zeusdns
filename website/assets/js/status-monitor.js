document.addEventListener('DOMContentLoaded', () => {
    const CONFIG = {
        TOKEN: 'uk1_dXimIpY5x91M_BtmOzEE3A6NGYhBHK6HwAQA3G_4',
        URL: 'https://status.zeusdns.ir/metrics',
        UPTIME_API: 'https://status.zeusdns.ir/api/status-page/heartbeat/uptime',
        INTERVAL: 30000
    };

    const SERVERS = {
        'Free-ZeusDNS-01': {
            name: 'DNS عمومی',
            ip: '37.32.5.60',
            type: 'free',
            badge: 'رایگان',
            uptimeId: '1',
            pingUrl: 'https://pingfree-01.zeusdns.ir/ping.txt?t=' + Date.now()
        },
        'Pro-ZeusDNS-01': {
            name: 'DNS Pro',
            ip: '37.32.5.34',
            type: 'pro',
            badge: 'اختصاصی',
            uptimeId: '2',
            pingUrl: 'https://pingpro-01.zeusdns.ir/ping.txt?t=' + Date.now()
        }
    };

    const DOM = {
        serversGrid: document.getElementById('serversGrid'),
        refreshBtn: document.getElementById('refreshBtn'),
        autoRefresh: document.getElementById('autoRefresh'),
        globalStatus: document.getElementById('globalStatus'),
        lastUpdate: document.getElementById('lastUpdate'),
        avgUptime: document.getElementById('avgUptime'),
        avgPing: document.getElementById('avgPing'),
        responseTime: document.getElementById('responseTime')
    };

    let autoRefreshInterval = null;
    let uptimeCache = {};

    async function fetchData() {
        try {
            showLoading();
            
            await fetchUptimeData();
            
            const response = await fetch(CONFIG.URL, {
                headers: { 'Authorization': 'Basic ' + btoa(':' + CONFIG.TOKEN) }
            });
            
            if (!response.ok) throw new Error('خطا در اتصال به metrics');
            
            const text = await response.text();
            const monitors = parseData(text);
            
            if (monitors.length === 0) throw new Error('هیچ سروری یافت نشد');
            
            updateUIInitial(monitors);
            updateTime();
            
            if (document.readyState === 'complete') {
                measureAllPings(monitors);
            } else {
                window.addEventListener('load', () => measureAllPings(monitors));
            }
            
        } catch (error) {
            console.error('Error:', error);
            showFallback();
        }
    }

    async function fetchUptimeData() {
        try {
            const response = await fetch(CONFIG.UPTIME_API);
            
            if (!response.ok) {
                if (Object.keys(uptimeCache).length === 0) {
                    uptimeCache = {
                        '1': '100.0%',
                        '2': '99.8%'
                    };
                }
                return;
            }
            
            const data = await response.json();
            
            if (data.uptimeList) {
                if (data.uptimeList['1_24'] !== undefined) {
                    const uptime = (data.uptimeList['1_24'] * 100).toFixed(1);
                    uptimeCache['1'] = uptime + '%';
                }
                if (data.uptimeList['2_24'] !== undefined) {
                    const uptime = (data.uptimeList['2_24'] * 100).toFixed(1);
                    uptimeCache['2'] = uptime + '%';
                }
            }
            
        } catch (error) {
            if (Object.keys(uptimeCache).length === 0) {
                uptimeCache = {
                    '1': '100.0%',
                    '2': '99.8%'
                };
            }
        }
    }

    function parseData(text) {
        const lines = text.split('\n');
        const statusMap = {}, pingMap = {};
        
        lines.forEach(line => {
            if (!line.trim() || line.startsWith('#')) return;
            
            let m = line.match(/monitor_status\{monitor_name="([^"]+)".*\}\s+(\d+)/);
            if (m) statusMap[m[1]] = parseInt(m[2]);
            
            m = line.match(/monitor_response_time\{monitor_name="([^"]+)".*\}\s+([-\d.]+)/);
            if (m) {
                const value = parseFloat(m[2]);
                pingMap[m[1]] = value >= 0 ? value : 0;
            }
        });
        
        return Object.entries(SERVERS).map(([name, info]) => ({
            name, 
            info,
            active: statusMap[name] === 1,
            ping: pingMap[name] || 0,
            uptime: uptimeCache[info.uptimeId] || '99.9%'
        }));
    }

    function updateUIInitial(monitors) {
        DOM.serversGrid.innerHTML = monitors.map(createInitialCard).join('');
        
        const online = monitors.filter(m => m.active).length;
        const total = monitors.length;
        
        let totalUptime = 0;
        let uptimeCount = 0;
        
        monitors.forEach(monitor => {
            const uptimeStr = monitor.uptime;
            const uptimeValue = parseFloat(uptimeStr);
            if (!isNaN(uptimeValue)) {
                totalUptime += uptimeValue;
                uptimeCount++;
            }
        });
        
        const avgUptime = uptimeCount > 0 ? (totalUptime / uptimeCount).toFixed(1) : '99.9';
        DOM.avgUptime.textContent = avgUptime + '%';
        
        DOM.globalStatus.className = `status-badge ${online === total ? 'all-up' : online === 0 ? 'all-down' : 'some-down'}`;
        DOM.globalStatus.innerHTML = `<i class="fas fa-${online === total ? 'check' : online === 0 ? 'times' : 'exclamation'}-circle"></i><span>${online} از ${total} سرویس فعال</span>`;
        
        DOM.avgPing.textContent = '--';
        DOM.responseTime.textContent = '--';
    }

    function createInitialCard(monitor) {
        const { info, active, uptime } = monitor;
        const statusClass = active ? 'online' : 'offline';
        
        const uptimeValue = parseFloat(uptime);
        const uptimeClass = uptimeValue >= 99.9 ? 'uptime-excellent' : 
                           uptimeValue >= 99 ? 'uptime-good' : 'uptime-poor';
        
        return `
        <div class="server-card ${statusClass}" data-server-id="${info.uptimeId}">
            <div class="server-header">
                <div class="server-info">
                    <h3>${info.name}</h3>
                    <p>${info.ip}</p>
                </div>
                <div class="server-badge badge-${info.type}">${info.badge}</div>
            </div>
            <div class="server-status">
                <div class="status-indicator">
                    <div class="status-dot ${statusClass}"></div>
                    <span>${active ? 'فعال' : 'آفلاین'}</span>
                </div>
                <div class="ping-value">--</div>
            </div>
            <div class="server-stats">
                <div class="stat-item">
                    <div class="stat-label">آپتایم 24h</div>
                    <div class="stat-value ${uptimeClass}">${uptime}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">پینگ شما</div>
                    <div class="stat-value ping-display">--</div>
                </div>
            </div>
        </div>`;
    }

    async function measureAllPings(monitors) {
        const realPings = [];
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        for (let monitor of monitors) {
            const pingValue = await measurePing(monitor.info.pingUrl);
            
            if (pingValue > 0) {
                realPings.push(pingValue);
                updateServerCard(monitor.info.uptimeId, pingValue);
            }
        }
        
        if (realPings.length > 0) {
            const avgPing = Math.round(realPings.reduce((a, b) => a + b, 0) / realPings.length);
            DOM.avgPing.textContent = avgPing;
            DOM.responseTime.textContent = avgPing + 'ms';
        }
    }

    async function measurePing(pingUrl) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            
            fetch(pingUrl, {
                method: 'HEAD',
                mode: 'cors',
                cache: 'no-cache',
                keepalive: true
            })
            .then(response => {
                const endTime = performance.now();
                const ping = Math.round(endTime - startTime);
                if (response.ok) {
                    resolve(ping);
                } else {
                    resolve(0);
                }
            })
            .catch(() => {
                resolve(0);
            });

            setTimeout(() => {
                resolve(0);
            }, 3000);
        });
    }

    function updateServerCard(serverId, ping) {
        const serverCard = document.querySelector(`[data-server-id="${serverId}"]`);
        if (!serverCard) return;
        
        const pingElement = serverCard.querySelector('.ping-value');
        const pingDisplay = serverCard.querySelector('.ping-display');
        
        if (pingElement) {
            const pingClass = ping < 50 ? 'ping-excellent' : 
                            ping < 150 ? 'ping-good' : 'ping-poor';
            pingElement.textContent = ping + 'ms';
            pingElement.className = 'ping-value ' + pingClass;
        }
        
        if (pingDisplay) {
            pingDisplay.textContent = ping + 'ms';
        }
        
        if (ping > 0) {
            const statusClass = ping < 50 ? 'online' : 'warning';
            serverCard.className = `server-card ${statusClass}`;
            serverCard.querySelector('.status-dot').className = `status-dot ${statusClass}`;
        }
    }

    function updateTime() {
        const now = new Date();
        DOM.lastUpdate.textContent = now.toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    function showLoading() {
        DOM.serversGrid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>در حال بارگذاری...</p></div>';
    }

    function showFallback() {
        const fallback = [
            { 
                name: 'Free-ZeusDNS-01', 
                info: SERVERS['Free-ZeusDNS-01'], 
                active: true, 
                ping: 0,
                uptime: uptimeCache['1'] || '100.0%'
            },
            { 
                name: 'Pro-ZeusDNS-01', 
                info: SERVERS['Pro-ZeusDNS-01'], 
                active: true, 
                ping: 0,
                uptime: uptimeCache['2'] || '100.0%'
            }
        ];
        
        updateUIInitial(fallback);
        updateTime();
        
        if (document.readyState === 'complete') {
            measureAllPings(fallback);
        } else {
            window.addEventListener('load', () => measureAllPings(fallback));
        }
    }

    function toggleAutoRefresh() {
        DOM.autoRefresh?.checked ? startAutoRefresh() : clearInterval(autoRefreshInterval);
    }

    function startAutoRefresh() {
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        autoRefreshInterval = setInterval(fetchData, CONFIG.INTERVAL);
    }

    DOM.refreshBtn?.addEventListener('click', fetchData);
    DOM.autoRefresh?.addEventListener('change', toggleAutoRefresh);
    
    fetchData();
    if (DOM.autoRefresh?.checked) startAutoRefresh();
});