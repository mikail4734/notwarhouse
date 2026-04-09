<?php
include 'bağlantı.php'; // Dosya adın 'bağlantı.php' ise bu şekilde yazmalısın

if ($_POST) {
    $baslik   = $_POST['baslik'];
    $icerik   = $_POST['icerik'];
    $kategori = $_POST['kategori'];
    $tarih   = $_POST['baslik'];
    

    try {
        // VALUES (?, ?, ?) kısmını ekledim, görselde burası hatalıydı
        $sorgu = $db->prepare("INSERT INTO notlar (baslik, icerik, kategori) VALUES (?, ?, ?)");
        $kaydet = $sorgu->execute([$baslik, $icerik, $kategori,$tarih]);

        if ($kaydet) {
            echo "Not başarıyla eklendi! Yönlendiriliyorsunuz...";
            header("Refresh: 2; url=html.php"); 
        }
    } catch (PDOException $e) {
        echo "Hata oluştu: " . $e->getMessage();
    }
}
?>