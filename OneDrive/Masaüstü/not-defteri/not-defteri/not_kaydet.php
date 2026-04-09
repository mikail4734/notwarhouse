<?php
include 'bağlantı.php';

if ($_POST) {
    $baslik = $_POST['title'];
    $icerik = $_POST['content'];
    $kategori = $_POST['subject']; // Matematik vb.
    $yazar = "mikail"; // Şimdilik sabit, ilerde session ile alabilirsin

    $sorgu = $db->prepare("INSERT INTO notlar (baslik, icerik, kategori, yazar_adi, tarih) VALUES (?, ?, ?, ?, NOW())");
    $sorgu->execute([$baslik, $icerik, $kategori, $yazar]);
}
?>