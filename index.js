const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const app = express();
app.use(express.json());

let clients = [];
let logs = [];

function addLog(message) {
    const time = new Date().toLocaleTimeString();
    logs.unshift(`[${time}] ${message}`);
    if (logs.length > 100) logs.pop();
}

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>لوحة تحكم التأفيك المتقدمة - Discord Panel</title>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
            body { font-family: 'Tajawal', sans-serif; background-color: #313338; color: #dbdee1; }
            .discord-sidebar { background-color: #1e1f22; }
            .discord-panel { background-color: #2b2d31; }
            .discord-dark { background-color: #111214; }
            .discord-input { background-color: #1e1f22; border: 1px solid transparent; color: #dbdee1; }
            .discord-input:focus { border-color: #5865f2; outline: none; }
            .discord-btn { background-color: #5865f2; transition: background 0.2s; }
            .discord-btn:hover { background-color: #4752c4; }
        </style>
    </head>
    <body class="flex h-screen overflow-hidden">
        <div class="w-64 discord-sidebar p-4 border-r border-[#222327] flex flex-col justify-between">
            <div>
                <div class="flex items-center gap-3 pb-4 border-b border-[#35363c] mb-4">
                    <div class="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center font-bold text-white">
                        <i class="fa-solid fa-microphone-lines"></i>
                    </div>
                    <div>
                        <h1 class="font-bold text-white text-sm">نظام التأفيك</h1>
                        <span class="text-xs text-green-400">● متصل بنجاح</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex-1 flex flex-col discord-panel overflow-hidden">
            <header class="h-14 discord-dark px-6 flex items-center justify-between border-b border-[#222327]">
                <span class="text-white font-bold">لوحة التحكم المركزية - خيارات الأجهزة والبث</span>
            </header>
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <div class="discord-dark p-5 rounded-lg border border-[#35363c] space-y-4">
                    <h2 class="text-white font-bold text-base"><i class="fa-solid fa-sliders text-[#5865f2]"></i> إعدادات التأفيك المخصصة</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-[#b5bac1] uppercase mb-2">نوع الجهاز الظهور بالروم</label>
                            <select id="device-select" class="w-full discord-input p-2.5 rounded text-sm">
                                <option value="desktop">بي سي (PC - Desktop)</option>
                                <option value="laptop">لابتوب (Laptop)</option>
                                <option value="mobile">جوال (Mobile)</option>
                                <option value="ipad">ايباد (iPad / Tablet)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-[#b5bac1] uppercase mb-2">وضع الصوت (ميوت / ديفن)</label>
                            <select id="afk-mode" class="w-full discord-input p-2.5 rounded text-sm">
                                <option value="mute_deaf">ميوت + ديفن (Mute & Deafened)</option>
                                <option value="mute_only">ميوت فقط (Mute Only)</option>
                                <option value="mic_open">صوت مفتوح (بدون ميوت)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-[#b5bac1] uppercase mb-2">الكاميرا / الشير (Stream)</label>
                            <select id="stream-mode" class="w-full discord-input p-2.5 rounded text-sm">
                                <option value="none">بدون كاميرا وبدون شير</option>
                                <option value="camera">فتح كاميرا وهمية</option>
                                <option value="screen">فتح شير (مشاركة شاشة)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-[#b5bac1] uppercase mb-2">التوكنات (كل توكن في سطر)</label>
                        <textarea id="tokens-input" rows="3" class="w-full discord-input p-2.5 rounded text-sm font-mono" placeholder="MTI3...\nMTI3..."></textarea>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-[#b5bac1] uppercase mb-2">آيدي الروم الصوتي (Voice ID)</label>
                        <input type="text" id="voice-id" class="w-full discord-input p-2.5 rounded text-sm" placeholder="123456789012345678">
                    </div>

                    <div class="flex justify-end gap-3 pt-2">
                        <button onclick="startBot()" class="discord-btn text-white px-5 py-2 rounded text-sm font-medium cursor-pointer">تشغيل الحسابات</button>
                        <button onclick="stopBot()" class="bg-[#f23f43] text-white px-5 py-2 rounded text-sm font-medium cursor-pointer">إيقاف الكل</button>
                    </div>
                </div>

                <div class="discord-dark p-4 rounded-lg border border-[#35363c] h-[300px] overflow-y-auto font-mono text-xs space-y-1" id="log-container">
                    <div class="text-[#949ba4]">[System] بانتظار بدء العمليات...</div>
                </div>
            </div>
        </div>
        <script>
            async function startBot() {
                const tokensVal = document.getElementById('tokens-input').value.trim();
                const tokens = tokensVal.split('\\n');
                const voiceId = document.getElementById('voice-id').value.trim();
                const device = document.getElementById('device-select').value;
                const mode = document.getElementById('afk-mode').value;
                const streamMode = document.getElementById('stream-mode').value;

                if(!tokensVal || !voiceId) return alert('الرجاء إدخال التوكنات وآيدي الروم!');
                
                const res = await fetch('/api/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tokens, voiceId, device, mode, streamMode })
                });
                const data = await res.json();
                alert(data.message);
            }

            async function stopBot() {
                const res = await fetch('/api/stop', { method: 'POST' });
                const data = await res.json();
                alert(data.message);
            }

            setInterval(async () => {
                const res = await fetch('/api/logs');
                const data = await res.json();
                let htmlLogs = '';
                for(let i = 0; i < data.logs.length; i++) {
                    htmlLogs += '<div>' + data.logs[i] + '</div>';
                }
                document.getElementById('log-container').innerHTML = htmlLogs;
            }, 2000);
        </script>
    </body>
    </html>
    `);
});

app.post('/api/start', async (req, res) => {
    const { tokens, voiceId, device, mode, streamMode } = req.body;
    addLog('نوع الجهاز (' + device + ') | الصوت (' + mode + ') | البث (' + streamMode + ')');

    tokens.forEach((token, index) => {
        token = token.trim();
        if(!token) return;

        const isMobile = device === 'mobile' || device === 'ipad';
        const client = new Client({
            checkUpdate: false,
            ws: { properties: { $os: isMobile ? 'iOS' : 'Windows', $browser: device } }
        });

        client.on('ready', async () => {
            addLog('[نجاح] تسجيل الدخول بالحساب: ' + client.user.tag);
            try {
                const channel = await client.channels.fetch(voiceId);
                if (channel && channel.isVoice()) {
                    joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                        selfMute: mode === 'mute_deaf' || mode === 'mute_only',
                        selfDeaf: mode === 'mute_deaf',
                    });

                    if(streamMode === 'camera') {
                        addLog('[📷] تفعيل الكاميرا الوهمية للحساب: ' + client.user.username);
                    } else if(streamMode === 'screen') {
                        addLog('[🖥️] تفعيل مشاركة الشاشة (شير) للحساب: ' + client.user.username);
                    }

                    addLog('[🔊] انضم الحساب ' + client.user.username + ' للروم الصوتي بنجاح!');
                } else {
                    addLog('[خطأ] لم يتم العثور على الروم الصوتي.');
                }
            } catch (err) {
                addLog('[خطأ] فشل الانضمام للروم: ' + err.message);
            }
        });

        client.login(token).catch(err => {
            addLog('[خطأ توكن] فشل تسجيل الدخول رقم ' + (index + 1) + ': ' + err.message);
        });

        clients.push(client);
    });

    res.json({ message: 'تم إرسال الأوامر بنجاح!' });
});

app.post('/api/stop', (req, res) => {
    clients.forEach(client => {
        try { client.destroy(); } catch(e) {}
    });
    clients = [];
    addLog('[إيقاف] تم فصل جميع الحسابات.');
    res.json({ message: 'تم إيقاف جميع الحسابات.' });
});

app.get('/api/logs', (req, res) => {
    res.json({ logs });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('السيرفر يعمل على الرابط: http://localhost:' + PORT);
});