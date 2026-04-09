<?php
$host    = "localhost";
$user    = "root";
$pass    = "";
$db_name = "notdeposu"; // Veritabanı adın

try {
    $db = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Bağlantı hatası: " . $e->getMessage());
}
?>