// ============ Blog Posts Page - Sidebar & Share Buttons ===============
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const fileName = path.split('/').pop();
  const postId = fileName.replace('.html', '');

  const baseUrl = 'https://zeusdns.ir';
  const postUrl = `${baseUrl}${path}`;

  const script = document.createElement('script');
  script.src = '/blog/data/posts.js?t=' + Date.now();
  script.onload = () => {
    const posts = window.BLOG_POSTS || [];
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      console.error('Post not found:', postId);
      return;
    }

    const currentImg = document.getElementById('current-img');
    const currentTitle = document.getElementById('current-title');
    const currentMeta = document.getElementById('current-meta');
    const currentSummary = document.getElementById('current-summary');
    
    if (currentImg) {
      currentImg.src = `/blog/assets/pics/${post.image}`;
      currentImg.alt = post.title;
      currentImg.onerror = () => { 
        currentImg.src = '/blog/assets/pics/placeholder.jpg'; 
      };
    }
    
    if (currentTitle) {
      currentTitle.textContent = post.title;
    }
    
    if (currentMeta) {
      currentMeta.textContent = `${post.date} — ${post.category}`;
    }
    
    if (currentSummary) {
      currentSummary.textContent = post.summary;
    }

    const latest = posts.filter(p => p.id !== postId).slice(0, 2);
    const container = document.getElementById('latest-posts');
    
    if (container) {
      container.innerHTML = '';
      
      if (latest.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">پست دیگری وجود ندارد</p>';
      } else {
        latest.forEach(p => {
          const card = document.createElement('div');
          card.className = 'sidebar-card';
          card.innerHTML = `
            <img src="/blog/assets/pics/${p.image}" alt="${p.title}" onerror="this.src='/blog/assets/pics/placeholder.jpg'">
            <div class="sidebar-card-content">
              <h4 class="sidebar-card-title">${p.title}</h4>
              <p class="sidebar-card-meta">${p.date} — ${p.category}</p>
              <p class="sidebar-card-summary">${p.summary}</p>
              <a href="${p.id}" class="sidebar-card-btn">ادامه مطلب</a>
            </div>
          `;
          container.appendChild(card);
        });
      }
    }

    const url = encodeURIComponent(postUrl);
    const title = encodeURIComponent(post.title);
    
    const shareTelegram = document.getElementById('share-telegram');
    const shareTwitter = document.getElementById('share-twitter');
    const shareLinkedin = document.getElementById('share-linkedin');
    const shareCopy = document.getElementById('share-copy');
    
    if (shareTelegram) {
      shareTelegram.href = `https://t.me/share/url?url=${url}&text=${title}`;
      shareTelegram.target = '_blank';
      shareTelegram.rel = 'noopener';
    }
    
    if (shareTwitter) {
      shareTwitter.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      shareTwitter.target = '_blank';
      shareTwitter.rel = 'noopener';
    }
    
    if (shareLinkedin) {
      shareLinkedin.href = `https://www.linkedin.com/shareArticle?url=${url}&title=${title}`;
      shareLinkedin.target = '_blank';
      shareLinkedin.rel = 'noopener';
    }
    
    if (shareCopy) {
      shareCopy.onclick = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(postUrl).then(() => {
          const feedback = document.getElementById('copy-feedback');
          if (feedback) {
            feedback.textContent = 'لینک کپی شد!';
            feedback.style.color = '#0f0';
            setTimeout(() => {
              feedback.textContent = '';
            }, 2000);
          }
        }).catch(err => {
          console.error('Failed to copy:', err);
          const textArea = document.createElement('textarea');
          textArea.value = postUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          const feedback = document.getElementById('copy-feedback');
          if (feedback) {
            feedback.textContent = 'لینک کپی شد!';
            feedback.style.color = '#0f0';
            setTimeout(() => {
              feedback.textContent = '';
            }, 2000);
          }
        });
      };
    }
  };

  script.onerror = () => {
    console.error('خطا در بارگذاری داده‌های پست‌ها');
    
    const container = document.getElementById('latest-posts');
    if (container) {
      container.innerHTML = '<p style="text-align:center; color:#ff6b6b; padding:20px;">خطا در بارگذاری پست‌های اخیر</p>';
    }
  };

  document.head.appendChild(script);
});