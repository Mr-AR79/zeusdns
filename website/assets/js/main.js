// ===== CANVAS BACKGROUND =====
(() => {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [], N = 90, maxDist = 120;

  function resize() { w = canvas.width = innerWidth; h = canvas.height = innerHeight; }
  addEventListener('resize', resize);
  resize();

  function rand(a, b) { return Math.random() * (b - a) + a; }

  function init() {
    particles = [];
    for (let i = 0; i < N; i++) {
      particles.push({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.6, 0.6),
        vy: rand(-0.6, 0.6),
        r: rand(0.8, 2.5),
        a: rand(0.6, 1.0)
      });
    }
  }

  function frame() {
    const isLight = document.body.classList.contains('light-mode');

    ctx.clearRect(0, 0, w, h);

    for (let p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 215, 0, ${p.a})`;
      ctx.shadowColor = isLight
        ? 'rgba(230, 184, 0, 0.35)'
        : 'rgba(255, 215, 0, 0.15)';
      ctx.shadowBlur = isLight ? 12 : 8;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.lineWidth = 0.8;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p = particles[i], q = particles[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < maxDist) {
          const alpha = (1 - d / maxDist) * (isLight ? 0.4 : 0.25);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  init();
  frame();
})();

// ===== THEME TOGGLE =====
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const icon = themeToggle.querySelector('i');

  if (!themeToggle) return;

  if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-mode');
    icon.className = 'fas fa-moon';
  } else {
    icon.className = 'fas fa-sun';
  }

  themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
      localStorage.setItem('theme', 'light');
      icon.className = 'fas fa-moon';
    } else {
      localStorage.setItem('theme', 'dark');
      icon.className = 'fas fa-sun';
    }
  });
});

// ======= back to top ====== 
window.addEventListener('scroll', function () {
  const btn = document.getElementById('backtotop');
  if (window.scrollY > 200) {
    btn.classList.add('show');
  } else {
    btn.classList.remove('show');
  }
});

document.getElementById('backtotop').addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== MOBILE MENU TOGGLE =====
const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');
const overlay = document.getElementById('menu-overlay');

menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  navbar.classList.toggle('show');
  menuToggle.classList.toggle('active');
  overlay.classList.toggle('show');
  menuToggle.querySelector('i').classList.toggle('fa-bars');
  menuToggle.querySelector('i').classList.toggle('fa-angle-right');
});

document.querySelectorAll('.navbar a').forEach(link => {
  link.addEventListener('click', () => {
    navbar.classList.remove('show');
    menuToggle.classList.remove('active');
    overlay.classList.remove('show');
    menuToggle.querySelector('i').classList.add('fa-bars');
    menuToggle.querySelector('i').classList.remove('fa-angle-right');
  });
});

document.addEventListener('click', (e) => {
  if (
    navbar.classList.contains('show') &&
    !navbar.contains(e.target) &&
    !menuToggle.contains(e.target)
  ) {
    navbar.classList.remove('show');
    menuToggle.classList.remove('active');
    overlay.classList.remove('show');
    menuToggle.querySelector('i').classList.add('fa-bars');
    menuToggle.querySelector('i').classList.remove('fa-angle-right');
  }
});

// ===== ORDER DNS PLANS SECTION ====
document.addEventListener('DOMContentLoaded', function() {
  const plansContainer = document.querySelector('.plans-container');
  const featuredCard = document.querySelector('.plan-card.featured');
  
  function centerFeaturedCard() {
    if (window.innerWidth <= 768 && featuredCard && plansContainer) {
      const containerWidth = plansContainer.offsetWidth;
      const cardWidth = featuredCard.offsetWidth;
      const scrollPosition = featuredCard.offsetLeft - (containerWidth / 2) + (cardWidth / 2);
      
      plansContainer.scrollLeft = scrollPosition;
    }
  }
  
  centerFeaturedCard();
  
  window.addEventListener('resize', centerFeaturedCard);
});

// ===== Public DNS Section =====
document.addEventListener('DOMContentLoaded', () => {
  const toast = document.getElementById('toast');

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function copyText(ip, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ip)
        .then(() => {
          showToast(`کپی شد: ${ip}`);
        })
        .catch(err => {
          console.error('Clipboard error:', err);
          fallbackCopy(ip, btn);
        });
    } else {
      fallbackCopy(ip, btn);
    }
  }

  function fallbackCopy(ip, btn) {
    const textarea = document.createElement('textarea');
    textarea.value = ip;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      showToast(`کپی شد: ${ip}`);
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showToast('❌ خطا در کپی');
    }
    document.body.removeChild(textarea);
  }

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ip = btn.getAttribute('data-ip');
      copyText(ip, btn);
    });
  });
});

//====== SETUP SECTION ========
document.querySelectorAll('.setup-card details').forEach((detail) => {
  const content = detail.querySelector('.content');

  if (detail.open) {
    content.style.height = content.scrollHeight + 'px';
  } else {
    content.style.height = '0px';
  }

  detail.addEventListener('toggle', () => {
    if (detail.open) {
      content.style.height = '0px';
      requestAnimationFrame(() => {
        content.style.height = content.scrollHeight + 'px';
      });

      document.querySelectorAll('.setup-card details').forEach((other) => {
        if (other !== detail && other.open) {
          const otherContent = other.querySelector('.content');
          otherContent.style.height = otherContent.scrollHeight + 'px';
          requestAnimationFrame(() => {
            otherContent.style.height = '0px';
            other.removeAttribute('open');
          });
        }
      });

    } else {
      content.style.height = content.scrollHeight + 'px';
      requestAnimationFrame(() => {
        content.style.height = '0px';
      });
    }
  });

  content.addEventListener('transitionend', () => {
    if (!detail.open) content.style.height = '0px';
  });
});

function smoothScroll(target) {
  target.scrollIntoView({ behavior: 'smooth' });
}

// ===== Add DNS Pro Token =====
document.addEventListener('DOMContentLoaded', function () {
  const connectionSection = document.querySelector('.addtoken');
  if (!connectionSection) return;

  const tokenInput = document.getElementById('token');
  const connectBtn = document.getElementById('connectBtn');
  const resultDiv = document.getElementById('result');
  const serverResponse = document.getElementById('serverResponse');
  const responseText = document.getElementById('responseText');
  const ipInfo = document.getElementById('ipInfo');
  const connectionDetails = document.getElementById('connectionDetails');
  const detailStatus = document.getElementById('detailStatus');
  const detailToken = document.getElementById('detailToken');
  const detailIP = document.getElementById('detailIP');
  const detailTime = document.getElementById('detailTime');

  let userIP = '';

  const apiSelector = document.getElementById('apiSelector');
  let selectedAPI = apiSelector.value;
  apiSelector.addEventListener('change', function () {
    selectedAPI = this.value;
    getUserIP();
  });

  function getUserIP() {
    if (ipInfo) {
      ipInfo.innerHTML = '🔍 در حال دریافت اطلاعات IP...';
      ipInfo.style.color = '#d4c779';

      fetch(selectedAPI)
        .then(response => response.json())
        .then(data => {
          if (data.ip) {
            userIP = data.ip;
          } else if (typeof data === 'string') {
            userIP = data;
          } else {
            throw new Error('فرمت پاسخ API نامعتبر است');
          }

          ipInfo.innerHTML = `✅ <strong>IP شما:</strong> ${userIP}`;
          ipInfo.style.color = '#27ae60';
        })
        .catch(error => {
          console.error('خطا در دریافت IP:', error);
          userIP = 'unknown';
          ipInfo.innerHTML = `❌ <strong>خطا در دریافت IP</strong>`;
          ipInfo.style.color = '#e74c3c';
        });
    }
  }

  getUserIP();

  if (connectBtn) {
    connectBtn.addEventListener('click', async function () {
      const token = tokenInput.value.trim();

      if (!token) {
        showResult('❌ لطفاً توکن خود را وارد کنید', 'error');
        return;
      }

      connectBtn.disabled = true;
      connectBtn.innerHTML = '<span>⏳ در حال اتصال...</span>';
      showResult('در حال ارسال درخواست به سرور Zeus...', 'loading');
      if (serverResponse) serverResponse.style.display = 'none';
      if (connectionDetails) connectionDetails.style.display = 'none';

      try {
        const result = await callZeusAPI(token, userIP);
        const rawData = result.data;

        if (!result.success || result.status === 401 || rawData.trim() === '401') {
          showServerResponse(rawData, true);
        }

        updateConnectionDetails(token, userIP, rawData);

        if (!result.success) {
          if (result.status === 401) {
            showResult('❌ خطا: توکن نامعتبر است (401)', 'error');
            if (detailStatus) {
              detailStatus.textContent = 'خطا - توکن نامعتبر';
              detailStatus.style.color = '#e74c3c';
            }
            return;
          }
          
          showResult(`❌ خطا در ارتباط با سرور: ${rawData}`, 'error');
          if (detailStatus) {
            detailStatus.textContent = 'خطای ارتباط';
            detailStatus.style.color = '#e74c3c';
          }
          return;
        }

        let isSuccess = false;
        let isNewAdd = false;
        let jsonObj = null;

        if (rawData.startsWith('{') && rawData.endsWith('}')) {
          try {
            jsonObj = JSON.parse(rawData);
            if (jsonObj.added === true || jsonObj.already_added === true) {
              isSuccess = true;
              isNewAdd = jsonObj.added === true && jsonObj.already_added !== true;
            }
          } catch (e) {}
        }

        if (!isSuccess && (rawData === 'added' || rawData === 'already added')) {
          isSuccess = true;
          isNewAdd = rawData === 'added';
        }

        if (isSuccess) {
          const message = isNewAdd
            ? '✅ اتصال با موفقیت برقرار شد! توکن جدید اضافه گردید.'
            : 'ℹ️ اتصال تأیید شد! این توکن قبلاً ثبت شده بود.';

          showResult(message, 'success');
          if (detailStatus) {
            detailStatus.textContent = 'موفق';
            detailStatus.style.color = '#27ae60';
          }
          if (serverResponse) serverResponse.style.display = 'none';
        }
        else if (rawData.trim() === '401' || (jsonObj && jsonObj.message && jsonObj.message.includes('401'))) {
          showResult('❌ خطا: توکن نامعتبر است (401)', 'error');
          if (detailStatus) {
            detailStatus.textContent = 'خطا - توکن نامعتبر';
            detailStatus.style.color = '#e74c3c';
          }
        }
        else {
          showServerResponse(rawData, false);
          showResult(`پاسخ سرور: ${rawData}`, 'info');
          if (detailStatus) {
            detailStatus.textContent = 'پاسخ دریافت شد';
            detailStatus.style.color = '#3498db';
          }
        }

      } catch (error) {
        showResult(`❌ خطای غیرمنتظره: ${error.message}`, 'error');
        if (detailStatus) {
          detailStatus.textContent = 'خطای غیرمنتظره';
          detailStatus.style.color = '#e74c3c';
        }
      } finally {
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<span><i class="far fa-link"></i> اتصال به DNS Pro</span>';
        if (connectionDetails) connectionDetails.style.display = 'block';
      }
    });
  }

  function showServerResponse(response, isError = false) {
    if (!responseText || !serverResponse) return;
    const trimmed = response.trim();
  
    responseText.textContent = trimmed;
    serverResponse.style.display = 'block';
    
    if (isError) {
      serverResponse.className = 'server-response response-error';
    } else {
      serverResponse.className = 'server-response response-info';
    }
  }

  function updateConnectionDetails(token, ip, rawResponse) {
    if (!detailToken || !detailIP || !detailTime) return;

    detailToken.textContent = '...' + token.substring(0, 8);
    detailIP.textContent = ip;
    detailTime.textContent = new Date().toLocaleTimeString('fa-IR');

    const existingExtras = connectionDetails.querySelectorAll('.extra-detail');
    existingExtras.forEach(el => el.remove());

    if (rawResponse && rawResponse.startsWith('{')) {
      try {
        const data = JSON.parse(rawResponse);

        const addExtra = (label, value) => {
          if (value === undefined || value === null || value === '') return;
          const div = document.createElement('div');
          div.className = 'detail-item extra-detail';
          div.innerHTML = `<span class="detail-label">${label}:</span><span class="detail-value">${value}</span>`;
          connectionDetails.appendChild(div);
        };

        if (data.username) addExtra('کاربر', data.username);
        if (data.last_ip) addExtra('آخرین IP', data.last_ip);
        if (data.message) addExtra('پیام سرور', data.message);

      } catch (e) {
      }
    }
  }

  function showResult(message, type) {
    if (!resultDiv) return;

    resultDiv.innerHTML = message;
    resultDiv.className = 'result ' + type;
    resultDiv.style.display = 'block';
  }

  if (tokenInput) {
    tokenInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        connectBtn.click();
      }
    });
  }
});

async function callZeusAPI(token, ip) {
  const targetUrl = `https://register.zeusdns.ir/tap-in?token=${encodeURIComponent(token)}&ip=${encodeURIComponent(ip)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        //'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    const text = await response.text();
    
    return {
      success: response.ok,
      data: text.trim(),
      status: response.status
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      return { 
        success: false, 
        data: 'درخواست زمان‌بر بود (timeout)',
        status: 0
      };
    }
    return { 
      success: false, 
      data: error.message,
      status: 0
    };
  }
}

// ===== LOAD LATEST BLOG POSTS =====
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('blog-preview-container');
  if (!container) return;

  container.innerHTML = '<p style="color:#ccc; text-align:center;">در حال بارگذاری مقالات...</p>';

  const script = document.createElement('script');
  script.src = 'blog/data/posts.js?t=' + Date.now();
  script.type = 'text/javascript';

  script.onload = () => {
    const posts = window.BLOG_POSTS || [];

    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = '<p style="color:#ccc; text-align:center;">مقاله‌ای یافت نشد.</p>';
      return;
    }

    const latest = posts.slice(0, 3);

    container.innerHTML = '';

    latest.forEach(p => {
      const card = document.createElement('article');
      card.className = 'blog-card';
      card.innerHTML = `
        <img src="blog/assets/pics/${p.image}" alt="${p.title}" 
             onerror="this.src='blog/assets/pics/placeholder.jpg'; this.onerror=null;">
        <div class="blog-card-content">
          <h3 class="blog-card-title">${p.title}</h3>
          <p class="blog-card-meta">${p.date} — ${p.category}</p>
          <p class="blog-card-summary">${p.summary}</p>
          <a href="blog/posts/${p.id}" class="blog-card-btn">ادامه مطلب</a>
        </div>
      `;
      container.appendChild(card);
    });
  };
  script.onerror = () => {
    console.error('خطا در لود posts.js');
    container.innerHTML = '<p style="color:#ccc;">خطا در بارگذاری مقالات.</p>';
  };
  document.head.appendChild(script);
});

// ===== FAQ Auto-Close =====
document.querySelectorAll('.footer-col .faq details').forEach((detail) => {
  const content = detail.querySelector('.content');

  if (detail.open) {
    content.style.height = content.scrollHeight + 'px';
  } else {
    content.style.height = '0px';
  }

  detail.addEventListener('toggle', () => {
    if (detail.open) {
      content.style.height = '0px';
      requestAnimationFrame(() => {
        content.style.height = content.scrollHeight + 'px';
      });

      document.querySelectorAll('.footer-col .faq details').forEach((other) => {
        if (other !== detail && other.open) {
          const otherContent = other.querySelector('.content');
          otherContent.style.height = otherContent.scrollHeight + 'px';
          requestAnimationFrame(() => {
            otherContent.style.height = '0px';
            other.removeAttribute('open');
          });
        }
      });

    } else {
      content.style.height = content.scrollHeight + 'px';
      requestAnimationFrame(() => {
        content.style.height = '0px';
      });
    }
  });

  content.addEventListener('transitionend', () => {
    if (!detail.open) content.style.height = '0px';
  });
});

// ========== Blog Main Page ============
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('blog-container');
  const pagination = document.getElementById('pagination');
  if (!container || !pagination) return;

  const POSTS_PER_PAGE = 6;
  let currentPage = 1;

  const renderPosts = (posts, page = 1) => {
    container.innerHTML = '<p style="color:#ccc; grid-column: 1/-1;">در حال بارگذاری...</p>';

    const start = (page - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const pagePosts = posts.slice(start, end);

    if (pagePosts.length === 0) {
      container.innerHTML = '<p style="color:#ccc; grid-column: 1/-1;">مقاله‌ای یافت نشد.</p>';
      return;
    }

    container.innerHTML = '';
    pagePosts.forEach(p => {
      const card = document.createElement('article');
      card.className = 'blog-card';
      card.innerHTML = `
        <img src="assets/pics/${p.image}" alt="${p.title}" 
             onerror="this.src='assets/pics/placeholder.jpg'">
        <div class="blog-card-content">
          <h3 class="blog-card-title">${p.title}</h3>
          <p class="blog-card-meta">${p.date} — ${p.category}</p>
          <p class="blog-card-summary">${p.summary}</p>
          <a href="posts/${p.id}" class="blog-card-btn">ادامه مطلب</a>
        </div>
      `;
      container.appendChild(card);
    });

    renderPagination(posts, page);
  };

  const renderPagination = (posts, activePage) => {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) return;

    if (activePage > 1) {
      const prev = document.createElement('div');
      prev.className = 'page-btn prev';
      prev.textContent = 'قبلی';
      prev.onclick = () => {
        currentPage = activePage - 1;
        renderPosts(posts, currentPage);
        scrollToTop();
      };
      pagination.appendChild(prev);
    }

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('div');
      btn.className = 'page-btn';
      if (i === activePage) btn.classList.add('active');
      btn.textContent = i;
      btn.onclick = () => {
        currentPage = i;
        renderPosts(posts, i);
        scrollToTop();
      };
      pagination.appendChild(btn);
    }

    if (activePage < totalPages) {
      const next = document.createElement('div');
      next.className = 'page-btn next';
      next.textContent = 'بعدی';
      next.onclick = () => {
        currentPage = activePage + 1;
        renderPosts(posts, currentPage);
        scrollToTop();
      };
      pagination.appendChild(next);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: document.querySelector('.blog-page').offsetTop - 100, behavior: 'smooth' });
  };

  container.innerHTML = '<p style="color:#ccc; grid-column: 1/-1;">در حال بارگذاری مقالات...</p>';
  const script = document.createElement('script');
  script.src = 'data/posts.js?t=' + Date.now();
  script.onload = () => {
    const posts = window.BLOG_POSTS || [];

    if (!posts.length) {
      container.innerHTML = '<p style="color:#ccc; grid-column: 1/-1;">مقاله‌ای یافت نشد.</p>';
      return;
    }

    renderPosts(posts, currentPage);
  };
  script.onerror = () => {
    container.innerHTML = '<p style="color:#ccc; grid-column: 1/-1;">خطا در بارگذاری.</p>';
  };
  document.head.appendChild(script);
});
