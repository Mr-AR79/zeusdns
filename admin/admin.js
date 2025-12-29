const express = require('express');
const auth = require('basic-auth');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '12345678';
const POSTS_FILE = '/app/website/blog/data/posts.js';

// base path
const BASE_PATH = '/blog-admin';

// session
app.use(session({
  secret: 'zeus-ultra-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // ۲۴ ساعت
}));

// multer
const upload = multer({
  dest: '/app/website/blog/assets/pics/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(file.mimetype) && allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FORMAT'));
    }
  }
});

// Middleware
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', __dirname);

app.use((req, res, next) => {
  req.basePath = BASE_PATH;
  res.locals.basePath = BASE_PATH;
  next();
});

app.use((req, res, next) => {
  if (
    req.path === '/' ||
    req.path.startsWith('/login') ||
    req.path.startsWith('/new') ||
    req.path.startsWith('/edit/') ||
    req.path.startsWith('/delete/') ||
    req.path.startsWith('/logout')
  ) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.setHeader('Robots-Tag', 'noindex, nofollow');
  }
  next();
});

const requireAuth = (req, res, next) => {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect(`${req.basePath}/login`);
  }
};

// login page
app.get('/login', (req, res) => {
  if (req.session.loggedin) return res.redirect(`${req.basePath}/`);
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.loggedin = true;
    req.session.username = username;
    return res.redirect(`${req.basePath}/`);
  } else {
    res.render('login', { error: 'نام کاربری یا رمز عبور اشتباه است!' });
  }
});

// logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(`${req.basePath}/login`);
  });
});

async function loadPosts() {
  try {
    const raw = await fs.readFile(POSTS_FILE, 'utf-8');
    const match = raw.match(/window\.BLOG_POSTS\s*=\s*(\[[\s\S]*\])/);
    return match ? JSON.parse(match[1]) : [];
  } catch (err) {
    return [];
  }
}

async function savePosts(posts) {
  const content = `window.BLOG_POSTS = ${JSON.stringify(posts, null, 2)};\n`;
  await fs.writeFile(POSTS_FILE, content, 'utf-8');
}

// fill html content
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function generateArticleSchema(post, postUrl, baseUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "image": `${baseUrl}/blog/assets/pics/${post.image}`,
    "author": {
      "@type": "Organization",
      "name": "ZeusDNS",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "ZeusDNS",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/assets/logos/main-logo.png`
      }
    },
    "datePublished": post.date,
    "dateModified": post.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "articleSection": post.category,
    "keywords": post.tags?.join(', ') || post.category
  };
  
  return JSON.stringify(schema, null, 2);
}

function generateBreadcrumbSchema(post, postUrl, baseUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "صفحه اصلی",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "بلاگ",
        "item": `${baseUrl}/blog/`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl
      }
    ]
  };
  
  return JSON.stringify(schema, null, 2);
}

// latest posts
function generateLatestPosts(posts, currentPostId) {
  const latest = posts.filter(p => p.id !== currentPostId).slice(0, 2);
  
  if (latest.length === 0) {
    return '<p style="text-align:center; color:#888; padding:20px;">پست دیگری وجود ندارد</p>';
  }
  
  return latest.map(post => `
    <div class="sidebar-card">
      <img src="/blog/assets/pics/${post.image}" alt="${escapeHtml(post.title)}" onerror="this.src='/blog/assets/pics/placeholder.jpg'">
      <div class="sidebar-card-content">
        <h4 class="sidebar-card-title">${post.title}</h4>
        <p class="sidebar-card-meta">${post.date} — ${post.category}</p>
        <p class="sidebar-card-summary">${post.summary}</p>
        <a href="${post.id}.html" class="sidebar-card-btn">ادامه مطلب</a>
      </div>
    </div>
  `).join('');
}

// generate post html
async function generatePostHTML(post, posts) {
  try {
    const templatePath = '/app/website/blog/posts/template.html';
    
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    let html = await fs.readFile(templatePath, 'utf-8');
    
    const baseUrl = 'https://zeusdns.ir';
    const postUrl = `${baseUrl}/blog/posts/${post.id}`;
    const imageBase = `${baseUrl}/blog/assets/pics/`;

    const replacements = {
      '<title id="page-title"></title>': `<title>${escapeHtml(post.title)} | Zeus DNS</title>`,
      'id="meta-description" content=""': `id="meta-description" content="${escapeHtml(post.summary)}"`,
      'id="meta-keywords" content=""': `id="meta-keywords" content="${escapeHtml(post.title)}, ${escapeHtml(post.category)}, زئوس دی ان اس, DNS, ${post.tags?.join(', ')}"`,
      'id="canonical-link" href=""': `id="canonical-link" href="${postUrl}"`,
      'id="og-title" content=""': `id="og-title" content="${escapeHtml(post.title)}"`,
      'id="og-description" content=""': `id="og-description" content="${escapeHtml(post.summary)}"`,
      'id="og-url" content=""': `id="og-url" content="${postUrl}"`,
      'id="og-image" content=""': `id="og-image" content="${imageBase + post.image}"`,
      'id="og-image-alt" content=""': `id="og-image-alt" content="${escapeHtml(post.title)}"`,
      'id="twitter-title" content=""': `id="twitter-title" content="${escapeHtml(post.title)}"`,
      'id="twitter-description" content=""': `id="twitter-description" content="${escapeHtml(post.summary)}"`,
      'id="twitter-image" content=""': `id="twitter-image" content="${imageBase + post.image}"`,
      'id="twitter-image-alt" content=""': `id="twitter-image-alt" content="${escapeHtml(post.title)}"`,
      '<script type="application/ld+json" id="jsonld-article"></script>': `<script type="application/ld+json" id="jsonld-article">${generateArticleSchema(post, postUrl, baseUrl)}</script>`,
      '<script type="application/ld+json" id="jsonld-breadcrumb"></script>': `<script type="application/ld+json" id="jsonld-breadcrumb">${generateBreadcrumbSchema(post, postUrl, baseUrl)}</script>`,
      '<h1 id="title"></h1>': `<h1 id="title">${post.title}</h1>`,
      '<p class="post-meta" id="meta"></p>': `<p class="post-meta" id="meta">دسته: <strong>${post.category}</strong> — تاریخ: <strong>${post.date}</strong></p>`,
      '<div class="post-content" id="content"></div>': `<div class="post-content" id="content">\n          ${post.content}\n        </div>`,
    };

    Object.keys(replacements).forEach(key => {
      html = html.replace(key, replacements[key]);
    });

    return html;
    
  } catch (error) {
    console.error('Error in generatePostHTML:', error);
    throw error;
  }
}

// ==== Main routs ====

// Main page
app.get('/', requireAuth, async (req, res) => {
  const posts = await loadPosts();
  const success = req.query.success;
  res.render('index', { 
    posts, 
    success, 
    session: req.session,
    basePath: req.basePath
  });
});

// New post
app.get('/new', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'new-post.html'));
});

// Edit post
app.get('/edit/:id', requireAuth, async (req, res) => {
  const posts = await loadPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).send('پست پیدا نشد!');
  
  res.render('edit', { 
    post: post,
    basePath: req.basePath
  });
});

// middleware Error handeling
const uploadWithErrorHandling = (req, res, next) => {
  upload.single('photo')(req, res, function(err) {
    if (err) {
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          if (req.path.includes('/edit/')) {
            const postId = req.params.id;
            return res.redirect(`${req.basePath}/edit/${postId}?error=file_too_large`);
          } else {
            return res.redirect(`${req.basePath}/new?error=file_too_large`);
          }
        }
      } else if (err.message === 'INVALID_FORMAT') {
        if (req.path.includes('/edit/')) {
          const postId = req.params.id;
          return res.redirect(`${req.basePath}/edit/${postId}?error=invalid_format`);
        } else {
          return res.redirect(`${req.basePath}/new?error=invalid_format`);
        }
      }
      return next(err);
    }
    next();
  });
};

app.post('/new', requireAuth, uploadWithErrorHandling, async (req, res) => {
  try {
    let { id, title, summary, category, date, tags, content, image } = req.body;
    if (!id || !/^[a-z0-9\-]+$/.test(id)) {
      return res.redirect(`${req.basePath}/new?error=invalid_id`);
    }

    const posts = await loadPosts();
    if (posts.some(p => p.id === id)) {
      return res.redirect(`${req.basePath}/new?error=duplicate_id`);
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const newName = `${id}${ext}`;
      await fs.move(req.file.path, `/app/website/blog/assets/pics/${newName}`, { overwrite: true });
      if (!image?.trim()) image = newName;
    }

    const newPost = {
      id, 
      title: title?.trim() || 'بدون عنوان',
      summary: summary?.trim() || '',
      category: category?.trim() || 'عمومی',
      date: date || new Date().toISOString().split('T')[0],
      image: image?.trim() || '',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      content: content || ''
    };

    posts.unshift(newPost);
    await savePosts(posts);

    try {
      const postHTML = await generatePostHTML(newPost, posts);
      await fs.writeFile(`/app/website/blog/posts/${id}.html`, postHTML, 'utf-8');
      console.log(`Post HTML generated: ${id}.html`);
    } catch (htmlError) {
      console.error('Failed to generate HTML, using template copy:', htmlError);
      await fs.copy('/app/website/blog/posts/template.html', `/app/website/blog/posts/${id}.html`, { overwrite: true });
    }
    
    res.redirect(`${req.basePath}/?success=1`);
  } catch (error) {
    console.error('Error in /new route:', error);
    res.redirect(`${req.basePath}/new?error=server_error`);
  }
});

app.post('/edit/:id', requireAuth, uploadWithErrorHandling, async (req, res) => {
  try {
    const oldId = req.params.id;
    let newId = req.body.id ? req.body.id.trim() : oldId;
    if (!newId || newId === '') newId = oldId;

    if (!/^[a-z0-9\-]+$/.test(newId)) {
      return res.redirect(`${req.basePath}/edit/${oldId}?error=invalid_id`);
    }

    const posts = await loadPosts();
    const index = posts.findIndex(p => p.id === oldId);
    if (index === -1) return res.status(404).send('پست پیدا نشد!');

    if (newId !== oldId && posts.some(p => p.id === newId)) {
      return res.redirect(`${req.basePath}/edit/${oldId}?error=duplicate_id`);
    }

    let image = (req.body.image || '').trim();

    if (newId !== oldId) {
      const oldImagePath = `/app/website/blog/assets/pics/${oldId}`;
      const newImagePath = `/app/website/blog/assets/pics/${newId}`;
      const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      
      for (const ext of extensions) {
        const oldFile = `${oldImagePath}${ext}`;
        const newFile = `${newImagePath}${ext}`;
        
        try {
          if (await fs.pathExists(oldFile)) {
            await fs.move(oldFile, newFile, { overwrite: true });
            
            if (!image) {
              image = newId + ext;
            }
            break;
          }
        } catch (err) {
          console.error('Error moving image:', err);
        }
      }
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const newName = `${newId}${ext}`;
      await fs.move(req.file.path, `/app/website/blog/assets/pics/${newName}`, { overwrite: true });
      if (!image) image = newName;
    }

    const updatedPost = {
      id: newId,
      title: (req.body.title || 'بدون عنوان').trim(),
      summary: (req.body.summary || '').trim(),
      category: (req.body.category || 'عمومی').trim(),
      date: req.body.date || new Date().toISOString().split('T')[0],
      image: image,
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      content: req.body.content || ''
    };

    posts[index] = updatedPost;
    await savePosts(posts);

    try {
      const postHTML = await generatePostHTML(updatedPost, posts);
      
      if (newId !== oldId) {
        await fs.remove(`/app/website/blog/posts/${oldId}.html`).catch(() => {});
      }
      
      await fs.writeFile(`/app/website/blog/posts/${newId}.html`, postHTML, 'utf-8');
      console.log(`Post HTML updated: ${newId}.html`);
    } catch (htmlError) {
      console.error('Failed to generate HTML, using template copy:', htmlError);

      if (newId !== oldId) {
        await fs.remove(`/app/website/blog/posts/${oldId}.html`).catch(() => {});
      }
      await fs.copy('/app/website/blog/posts/template.html', `/app/website/blog/posts/${newId}.html`, { overwrite: true });
    }

    res.redirect(`${req.basePath}/?success=edited`);
  } catch (error) {
    console.error('Error in /edit route:', error);
    res.redirect(`${req.basePath}/edit/${req.params.id}?error=server_error`);
  }
});

// Delete posts
app.get('/delete/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  if (!id || !/^[a-z0-9\-]+$/.test(id)) {
    return res.status(400).send('آیدی نامعتبر!');
  }

  try {
    const posts = await loadPosts();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).send('پست پیدا نشد!');

    posts.splice(index, 1);
    await savePosts(posts);

    await fs.remove(`/app/website/blog/posts/${id}.html`).catch(() => {});

    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    for (const ext of extensions) {
      await fs.remove(`/app/website/blog/assets/pics/${id}${ext}`).catch(() => {});
    }

    res.redirect(`${req.basePath}/?success=deleted`);

  } catch (err) {
    console.error('Error in /delete route:', err);
    res.status(500).send('خطا در حذف پست');
  }
});

app.use('/:any', requireAuth, (req, res) => {
  res.status(404).send('صفحه پیدا نشد!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Blog admin server running on port ${PORT}`);
});