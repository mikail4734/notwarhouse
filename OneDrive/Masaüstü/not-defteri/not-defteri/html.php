<?php include 'bağlantı.php'; ?>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <?php
    // Notları en yeni tarihten başlayarak çeker
    $sorgu = $db->query("SELECT * FROM notlar ORDER BY id DESC");
    $notlar = $sorgu->fetchAll(PDO::FETCH_ASSOC);

    foreach ($notlar as $not) {
    ?>
    <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all">
        <span class="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
            <?php echo htmlspecialchars($not['kategori']); ?>
        </span>
        <h3 class="font-bold text-slate-800 text-lg mt-4 mb-2">
            <?php echo htmlspecialchars($not['baslik']); ?>
        </h3>
        <p class="text-slate-400 text-xs mb-6 line-clamp-3">
            <?php echo htmlspecialchars($not['icerik']); ?>
        </p>
        <div class="text-[10px] font-bold text-slate-400 uppercase flex items-center">
            <i class="far fa-calendar-alt mr-1"></i> 
            <?php echo date("d.m.Y", strtotime($not['tarih'])); ?>
        </div>
    </div>
    <?php } ?>
</div>