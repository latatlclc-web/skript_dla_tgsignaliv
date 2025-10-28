// ============================================
// BACKEND СЕРВЕР (Node.js + Express)
// server.js
// ============================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Дозволяє запити з будь-яких доменів
app.use(express.json());

// ============================================
// БАЗА ДАНИХ (SQLite)
// ============================================
const db = new sqlite3.Database('./trading_bot.db', (err) => {
    if (err) {
        console.error('❌ Помилка підключення до БД:', err);
    } else {
        console.log('✅ Підключено до бази даних');
    }
});

// Створюємо таблиці
db.serialize(() => {
    // Таблиця користувачів
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            access_token TEXT UNIQUE NOT NULL,
            chat_id TEXT NOT NULL,
            thread_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Таблиця відслідкованих позицій
    db.run(`
        CREATE TABLE IF NOT EXISTS tracked_positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            card_id TEXT NOT NULL,
            is_open INTEGER DEFAULT 0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, card_id)
        )
    `);

    console.log('✅ Таблиці створено/перевірено');
});

// ============================================
// TELEGRAM BOT TOKEN (з BotFather)
// ============================================
const TELEGRAM_BOT_TOKEN = '7711323850:AAFUXQS7GdZkSkzOtbYzvOnNtHaN-Y_ewfM'; // Замінити на реальний токен

// ============================================
// ФУНКЦІЯ ВІДПРАВКИ В TELEGRAM
// ============================================
async function sendToTelegram(chatId, threadId, message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const data = {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        if (threadId && threadId.trim() !== '') {
            data.message_thread_id = parseInt(threadId);
        }

        const response = await axios.post(url, data);
        
        if (response.data.ok) {
            console.log('✅ Повідомлення відправлено в Telegram');
            return { success: true };
        } else {
            console.error('❌ Telegram API помилка:', response.data);
            return { success: false, error: response.data };
        }
    } catch (error) {
        console.error('❌ Помилка відправки в Telegram:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// ГЕНЕРАЦІЯ ТОКЕНУ ДОСТУПУ
// ============================================
function generateAccessToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ============================================
// API ENDPOINTS
// ============================================

// 1. Реєстрація користувача
app.post('/api/register', (req, res) => {
    const { username, chatId, threadId } = req.body;

    if (!username || !chatId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Username та chatId обов\'язкові' 
        });
    }

    const accessToken = generateAccessToken();

    db.run(
        'INSERT INTO users (username, access_token, chat_id, thread_id) VALUES (?, ?, ?, ?)',
        [username, accessToken, chatId, threadId || null],
        function(err) {
            if (err) {
                console.error('❌ Помилка реєстрації:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Помилка збереження користувача' 
                });
            }

            console.log(`✅ Користувач зареєстрований: ${username}`);
            res.json({
                success: true,
                accessToken: accessToken,
                userId: this.lastID
            });
        }
    );
});

// 2. Відправка повідомлення про нову позицію
app.post('/api/notify', async (req, res) => {
    const { accessToken, cardId, positionData } = req.body;

    if (!accessToken || !cardId || !positionData) {
        return res.status(400).json({ 
            success: false, 
            error: 'Недостатньо даних' 
        });
    }

    // Перевіряємо токен і отримуємо користувача
    db.get(
        'SELECT * FROM users WHERE access_token = ?',
        [accessToken],
        async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Невірний токен доступу' 
                });
            }

            // Перевіряємо чи це дійсно нова позиція
            db.get(
                'SELECT * FROM tracked_positions WHERE user_id = ? AND card_id = ?',
                [user.id, cardId],
                async (err, position) => {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Помилка БД' 
                        });
                    }

                    // Якщо позиція була закрита (is_open = 0) або не існує
                    const shouldSend = !position || position.is_open === 0;

                    if (shouldSend) {
                        // Форматуємо повідомлення
                        const userName = user.username ? ` (${user.username})` : '';
                        const message = `
🚀 <b>НОВА ПОЗИЦІЯ ВІДКРИТА!</b>${userName}

📊 <b>Символ:</b> ${positionData.symbol}
🔄 <b>Біржі:</b> ${positionData.exchange1} ${positionData.direction1} - ${positionData.exchange2} ${positionData.direction2}

⚙️ <b>ПАРАМЕТРИ ВХОДУ:</b>
├─ Open Spread: ${positionData.openSpread}%
├─ Close Spread: ${positionData.closeSpread}%
├─ Розмір ордеру: ${positionData.orderSize}
├─ Кількість ордерів: ${positionData.maxOrders}
├─ Spread при вході: ${positionData.enterSpread}
└─ Час коли була відкрита карточка: ${positionData.startTime}

💰 <b>ПОТОЧНІ ДАНІ:</b>
├─ Funding Rate: ${positionData.fundingRate1} / ${positionData.fundingRate2}
├─ Дозволений розмір: Max:${positionData.allowedSize}
└─ Відкритих ордерів: ${positionData.ordersCount}
                        `.trim();

                        // Відправляємо в Telegram
                        const result = await sendToTelegram(
                            user.chat_id, 
                            user.thread_id, 
                            message
                        );

                        if (result.success) {
                            // Оновлюємо/створюємо запис про позицію
                            db.run(
                                `INSERT INTO tracked_positions (user_id, card_id, is_open, last_updated)
                                 VALUES (?, ?, 1, CURRENT_TIMESTAMP)
                                 ON CONFLICT(user_id, card_id) 
                                 DO UPDATE SET is_open = 1, last_updated = CURRENT_TIMESTAMP`,
                                [user.id, cardId]
                            );

                            res.json({ 
                                success: true, 
                                message: 'Повідомлення відправлено',
                                sent: true
                            });
                        } else {
                            res.status(500).json({ 
                                success: false, 
                                error: 'Помилка відправки в Telegram' 
                            });
                        }
                    } else {
                        // Позиція вже відслідкована і відкрита
                        res.json({ 
                            success: true, 
                            message: 'Позиція вже відслідкована',
                            sent: false
                        });
                    }
                }
            );
        }
    );
});

// 3. Закриття позиції
app.post('/api/close', (req, res) => {
    const { accessToken, cardId } = req.body;

    if (!accessToken || !cardId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Недостатньо даних' 
        });
    }

    db.get(
        'SELECT id FROM users WHERE access_token = ?',
        [accessToken],
        (err, user) => {
            if (err || !user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Невірний токен доступу' 
                });
            }

            db.run(
                `INSERT INTO tracked_positions (user_id, card_id, is_open, last_updated)
                 VALUES (?, ?, 0, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id, card_id) 
                 DO UPDATE SET is_open = 0, last_updated = CURRENT_TIMESTAMP`,
                [user.id, cardId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            error: 'Помилка БД' 
                        });
                    }

                    res.json({ 
                        success: true, 
                        message: 'Позиція позначена як закрита' 
                    });
                }
            );
        }
    );
});

// 4. Ініціалізація (відмічаємо існуючі позиції як відслідковані)
app.post('/api/init', (req, res) => {
    const { accessToken, openPositions } = req.body;

    if (!accessToken || !Array.isArray(openPositions)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Недостатньо даних' 
        });
    }

    db.get(
        'SELECT id FROM users WHERE access_token = ?',
        [accessToken],
        (err, user) => {
            if (err || !user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Невірний токен доступу' 
                });
            }

            // Додаємо всі відкриті позиції як вже відслідковані
            const stmt = db.prepare(
                `INSERT INTO tracked_positions (user_id, card_id, is_open, last_updated)
                 VALUES (?, ?, 1, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id, card_id) 
                 DO UPDATE SET is_open = 1, last_updated = CURRENT_TIMESTAMP`
            );

            openPositions.forEach(cardId => {
                stmt.run([user.id, cardId]);
            });

            stmt.finalize();

            res.json({ 
                success: true, 
                message: `Ініціалізовано ${openPositions.length} позицій` 
            });
        }
    );
});

// 5. Тестове повідомлення
app.post('/api/test', async (req, res) => {
    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({ 
            success: false, 
            error: 'Токен доступу обов\'язковий' 
        });
    }

    db.get(
        'SELECT * FROM users WHERE access_token = ?',
        [accessToken],
        async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Невірний токен доступу' 
                });
            }

            const userName = user.username ? ` (${user.username})` : '';
            const testMessage = `
🧪 <b>ТЕСТОВЕ ПОВІДОМЛЕННЯ</b>${userName}

✅ Telegram бот підключено успішно!
⏰ Час: ${new Date().toLocaleString('uk-UA')}

Тепер бот буде автоматично повідомляти про відкриття позицій.

🔍 Моніторинг активний та працює!
            `.trim();

            const result = await sendToTelegram(
                user.chat_id, 
                user.thread_id, 
                testMessage
            );

            if (result.success) {
                res.json({ 
                    success: true, 
                    message: 'Тестове повідомлення відправлено' 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    error: 'Помилка відправки' 
                });
            }
        }
    );
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================
app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
    console.log('========================================');
});

// Обробка помилок
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});
