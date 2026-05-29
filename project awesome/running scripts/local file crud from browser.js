// ===== একবার পেস্ট করলেই সব রেডি =====
(async () => {
    
    console.log("%c PC Folder CRUD Tool চালু হয়েছে! 🚀", "color: #00ff00; font-size: 20px; font-weight: bold");

    let dirHandle = null;

    // প্রথমে ফোল্ডার বেছে নেওয়া
    try {
        dirHandle = await window.showDirectoryPicker();
        console.log("%c ফোল্ডার সিলেক্ট হয়েছে: " + dirHandle.name, "color: cyan; font-size: 16px");
    } catch (e) {
        console.log("ফোল্ডার সিলেক্ট বাতিল করা হয়েছে।");
        return;
    }

    // গ্লোবাল ফাংশনগুলো কনসোলে এড করে দিচ্ছি
    window.create = async (filename, content = "") => {
        if (!content) content = prompt("ফাইলে কী লিখব?", "Hello from browser!");
        if (content === null) return console.log("বাতিল করা হয়েছে");
        try {
            const handle = await dirHandle.getFileHandle(filename, { create: true });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            console.log(`Created/Updated: ${filename}`);
        } catch (e) { console.error("Error:", e); }
    };

    window.read = async (filename) => {
        try {
            const handle = await dirHandle.getFileHandle(filename);
            const file = await handle.getFile();
            const text = await file.text();
            console.log(`Content of ${filename}:\n`, text);
            return text;
        } catch (e) { console.error("File not found or error:", filename); }
    };

    window.del = async (filename) => {
        if (!confirm(`সত্যি "${filename}" ডিলিট করব?`)) return;
        try {
            await dirHandle.removeEntry(filename);
            console.log(`Deleted: ${filename}`);
        } catch (e) { console.error("Delete failed:", e); }
    };

    window.list = async () => {
        console.log("Folder এর ফাইলগুলো:");
        for await (const entry of dirHandle.values()) {
            console.log((entry.kind === "directory" ? "Folder " : "File  ") + entry.name);
        }
    };

    window.autoRead = (filename, intervalSec = 2) => {
        if (window.autoTimer) clearInterval(window.autoTimer);
        console.log(`Auto reading "${filename}" every ${intervalSec} sec... (Stop করতে: stopAuto())`);
        window.autoTimer = setInterval(() => read(filename), intervalSec * 1000);
        read(filename); // প্রথমবার তৎক্ষণাৎ
    };

    window.stopAuto = () => {
        if (window.autoTimer) {
            clearInterval(window.autoTimer);
            console.log("Auto reading stopped.");
        }
    };

    // স্বাগতম মেসেজ + সাহায্য
    console.log("%c Available commands (কনসোলে টাইপ করো):", "font-weight:bold; color: yellow");
    console.log("create('data.txt', 'যা লিখতে চাও')  → ফাইল তৈরি/আপডেট");
    console.log("create('note.json')                → প্রম্পটে কন্টেন্ট চাইবে");
    console.log("read('data.txt')                   → ফাইল পড়বে");
    console.log("del('data.txt')                    → ফাইল ডিলিট (কনফার্ম করবে)");
    console.log("list()                             → সব ফাইলের লিস্ট");
    console.log("autoRead('log.txt', 3)             → প্রতি ৩ সেকেন্ডে পড়বে");
    console.log("stopAuto()                         → অটো রিডিং বন্ধ");
    console.log("%c উদাহরণ দিয়ে শুরু করো: create('hello.txt')", "color: lime; font-size:14px");

    // প্রথমবার লিস্ট দেখিয়ে দিচ্ছি
    list();
})();