const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
app.use(express.static(".")); // Mevcut klasördeki HTML dosyalarını dışarıya açar
// fetch, Node.js 18+ sürümünde yerleşik olarak vardır. Eski sürümse 'node-fetch' yüklemelisiniz.

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const nodemailer = require('nodemailer');

// POSTACIYI AYARLIYORUZ (Burayı kendi bilgilerine göre doldur)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mikailcelik4734@gmail.com', // Kendi Gmail adresini yaz
        pass: 'vbhh kzlr ucpl swkq'          // GOOGLE'IN VERDİĞİ 16 HANELİ KODU BURAYA YAZ
    }
});

// 1. Veritabanı Yapılandırması (Pool kullanımı daha sağlıklıdır)
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // XAMPP/WAMP kullanıyorsanız genelde boştur
  database: "notdeposu",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Bağlantı testi
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL Bağlantı Hatası:", err.message);
    console.log("İpucu: MySQL servisinin açık olduğundan ve 'notdeposu' veritabanının varlığından emin olun.");
    return;
  }
  console.log("✅ MySQL'e başarıyla bağlanıldı!");
  connection.release();
});

// 2. Notları Listeleme
app.get("/getNotes", (req, res) => {
  const sql = `
    SELECT n.*, IFNULL(b.likes, 0) AS likes, IFNULL(b.dislikes, 0) AS dislikes 
    FROM notes n 
    LEFT JOIN begeni_verileri b ON n.id = b.note_id 
    ORDER BY n.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 3. Yeni Not Kaydetme
app.post("/saveNote", (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: "Başlık ve içerik boş olamaz" });

  const sql = "INSERT INTO notes (title, content) VALUES (?, ?)";
  db.query(sql, [title, content], (err, result) => {
    if (err) return res.status(500).json({ message: "Kayıt başarısız", error: err.message });
    res.json({ message: "Not kaydedildi", id: result.insertId });
  });
});

// 4. Beğeni Artırma
app.post("/likeNote/:id", (req, res) => {
  const noteId = req.params.id;
  if (isNaN(noteId)) return res.status(400).json({ error: "Geçersiz ID" });

  const sql = `
    INSERT INTO begeni_verileri (note_id, likes) 
    VALUES (?, 1) 
    ON DUPLICATE KEY UPDATE likes = likes + 1
  `;
  db.query(sql, [noteId], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: "Beğeni kaydedildi" });
  });
});

// 5. Beğenmeme (Dislike)
app.post("/dislikeNote/:id", (req, res) => {
  const noteId = req.params.id;
  const userIp = req.ip || req.socket.remoteAddress;

  const checkSql = "SELECT id FROM etkilesim_kayitlari WHERE note_id = ? AND user_ip = ?";
  db.query(checkSql, [noteId, userIp], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (rows.length > 0) return res.status(400).json({ success: false, message: "Zaten oy verdiniz!" });

    const logSql = "INSERT INTO etkilesim_kayitlari (note_id, user_ip, action_type) VALUES (?, ?, 'dislike')";
    db.query(logSql, [noteId, userIp], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      const updateSql = "INSERT INTO begeni_verileri (note_id, dislikes) VALUES (?, 1) ON DUPLICATE KEY UPDATE dislikes = dislikes + 1";
      db.query(updateSql, [noteId], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
      });
    });
  });
});

// 6. OpenAI Özetleme (API Key'i mutlaka .env'e taşıyın!)
app.post("/summarize", async (req, res) => {
  const { message } = req.body;
  const API_KEY = "BURAYA_KENDI_ANAHTARINIZI_YAZIN"; 

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: `Aşağıdaki metni kısaca özetle: ${message}` }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI Hatası:", error.message);
    res.status(500).json({ reply: "Özetleme sırasında bir hata oluştu." });
  }
});

// 1. KODU GÖNDEREN ROTA (Şifremi Unuttum sayfasındaki buton burayı tetikler)
app.post('/Account/ForgotPassword', (req, res) => {
    const email = req.body.email;
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    db.query("UPDATE users SET reset_code = ? WHERE email = ?", [code, email], (err, result) => {
        if (err || result.affectedRows === 0) return res.send("Hata: Kullanıcı bulunamadı.");

        // MAİL GÖNDERME
        const mailOptions = {
            from: 'NoteShare Destek',
            to: email,
            subject: 'Doğrulama Kodunuz',
            text: `Şifre sıfırlama kodunuz: ${code}`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.send("Mail hatası: " + error);
            // Kod gönderilince kullanıcıyı yeni yaptığımız onay sayfasına yolla
            res.redirect(`/sifrem1.html?email=${email}`);
        });
    });
});

// 2. KODU KONTROL EDEN ROTA (Onay sayfasındaki buton burayı tetikler)
app.post('/Account/VerifyCode', (req, res) => {
    const { email, code } = req.body;

    db.query("SELECT * FROM users WHERE email = ? AND reset_code = ?", [email, code], (err, results) => {
        if (results.length > 0) {
            // Kod doğru! Şimdi şifre değiştirme ekranını açabiliriz
            res.send("Kod doğru! Şimdi yeni şifreni belirleyebilirsin. (Buraya yeni şifre formu gelecek)");
        } else {
            res.send("Hatalı veya eksik kod girdiniz!");
        }
    });
});

function openNote(noteId) {
    // Hafızadaki tüm notlar arasından tıklanan ID'ye sahip olanı bul
    const note = allNotes.find(n => n.id === noteId);
    
    if (!note) return;

    const modal = document.getElementById('noteModal');
    document.getElementById('modalTitle').innerText = note.title;
    document.getElementById('modalCategory').innerText = note.category || 'Genel Not';
    
    // İçeriği güvenli bir şekilde aktar ve satır sonlarını düzenle
    document.getElementById('modalContent').innerHTML = note.content.replace(/\n/g, '<br>');

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function closeNote() {
    const modal = document.getElementById('noteModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Kaydırmayı geri aç
}

// Modal dışına tıklanırsa kapatma
window.onclick = function(event) {
    const modal = document.getElementById('noteModal');
    if (event.target == modal) {
        closeNote();
    }
}

// ✅ BU ROTA SERVER.JS İÇİNDE MUTLAKA OLMALI
app.get('/getNote/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM notes WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("SQL Hatası:", err);
            return res.status(500).json({ error: err.message });
        }
        
        if (result.length > 0) {
            res.json(result[0]); // Veriyi gönderir
        } else {
            // Burası 404 dönüyor çünkü veritabanında bulamıyor
            res.status(404).json({ message: "Not bulunamadı" });
        }
    });
});
app.listen(3000, () => console.log("🚀 Server http://localhost:3000 üzerinde aktif."));