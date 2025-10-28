# 🚀 Trading Terminal Telegram Notifier v5.0
## Система з Backend Сервером для Багатьох Користувачів

---

## 📋 Зміст

1. [Архітектура системи](#архітектура-системи)
2. [Встановлення сервера](#встановлення-сервера)
3. [Встановлення клієнтського скрипта](#встановлення-клієнтського-скрипта)
4. [Налаштування](#налаштування)
5. [Використання](#використання)
6. [Розгортання на VPS](#розгортання-на-vps)

---

## 🏗️ Архітектура системи

```
┌─────────────────────┐
│  Браузер User 1     │──┐
│  (Trading Terminal) │  │
└─────────────────────┘  │
                         │
┌─────────────────────┐  │    ┌──────────────────┐    ┌─────────────────┐
│  Браузер User 2     │──┼───>│  Backend Server  │───>│  Telegram Bot   │
│  (Trading Terminal) │  │    │  (Node.js)       │    │  API            │
└─────────────────────┘  │    └──────────────────┘    └─────────────────┘
                         │            │
┌─────────────────────┐  │            ▼
│  Браузер User 15    │──┘    ┌──────────────────┐
│  (Trading Terminal) │       │  SQLite Database │
└─────────────────────┘       └──────────────────┘
```

### Чому потрібен сервер?

**Проблема:** Telegram API блокує CORS запити напряму з браузера.

**Рішення:** Сервер приймає запити від користувачів і відправляє в Telegram від свого імені.

---

## 🖥️ Встановлення сервера

### Крок 1: Встанови Node.js

Завантаж і встанови Node.js з https://nodejs.org/ (версія 16+ або новіша)

Перевір встановлення:
```bash
node --version
npm --version
```

### Крок 2: Створи папку проекту

```bash
mkdir telegram-notifier-server
cd telegram-notifier-server
```

### Крок 3: Створи файли

Створи 3 файли в папці:

**1. package.json** (скопіюй з файлу package.json)

**2. server.js** (скопіюй з файлу server.js)

**3. .env** (необов'язково, для змінних оточення)

### Крок 4: Налаштуй Bot Token

Відкрий **server.js** і знайди рядок:
```javascript
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
```

Замінить на свій токен від @BotFather:
```javascript
const TELEGRAM_BOT_TOKEN = '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz';
```

### Крок 5: Встанови залежності

```bash
npm install
```

### Крок 6: Запусти сервер

```bash
npm start
```

Побачиш:
```
========================================
🚀 Сервер запущено на порту 3000
========================================
✅ Підключено до бази даних
✅ Таблиці створено/перевірено
```

**Готово!** Сервер працює на `http://localhost:3000`

---

## 💻 Встановлення клієнтського скрипта

### Крок 1: Встанови Tampermonkey

- Chrome: https://chrome.google.com/webstore
- Firefox: https://addons.mozilla.org
- Edge: https://microsoftedge.microsoft.com/addons

### Крок 2: Додай скрипт

1. Клікни на іконку Tampermonkey
2. Вибери "Create new script"
3. Скопіюй весь код з **client-script-v5.js**
4. Вставь в редактор
5. Збережи (Ctrl+S)

### Крок 3: Відкрий Trading Terminal

Перезавантаж сторінку терміналу.

---

## ⚙️ Налаштування

### Для кожного користувача:

1. **Відкрий термінал** - з'явиться фіолетова панель внизу справа

2. **Заповни дані:**
   - **🌐 URL Сервера:** `http://localhost:3000` (або IP твого сервера)
   - **👤 Ваше Ім'я:** Саша Ковальчук
   - **💬 Chat ID:** `-1001234567890` (ID групи)
   - **🧵 Thread ID:** `123` (якщо є гілки)

3. **Натисни "🔐 Зареєструватися"**
   
   Сервер згенерує унікальний **Access Token** для тебе.

4. **Натисни "🧪 Тестове повідомлення"**
   
   Перевір чи прийшло в Telegram.

5. **Готово!** Тепер бот автоматично відслідковує позиції.

---

## 🎯 Використання

### Автоматичний моніторинг

Скрипт автоматично:
- Відслідковує відкриття нових позицій
- Відправляє повідомлення через сервер
- Зберігає стан в базі даних
- Уникає дублікатів після перезавантаження

### Повідомлення в Telegram

```
🚀 НОВА ПОЗИЦІЯ ВІДКРИТА! (Саша Ковальчук)

📊 Символ: BTC
🔄 Біржі: BINANCE ↑ - MEXC ↓

⚙️ ПАРАМЕТРИ ВХОДУ:
├─ Open Spread: 2.5%
├─ Close Spread: 0.5%
├─ Розмір ордеру: 1000
├─ Кількість ордерів: 1
├─ Spread при вході: 2.3%
└─ Час коли була відкрита карточка: 28.10.2025, 10:30:15

💰 ПОТОЧНІ ДАНІ:
├─ Funding Rate: 0.01% / -0.02%
├─ Дозволений розмір: Max:50000
└─ Відкритих ордерів: 1
```

---

## 🌐 Розгортання на VPS (для віддаленого доступу)

### Варіант 1: Простий VPS (DigitalOcean, Linode, Hetzner)

**1. Орендуй VPS сервер**
- Мінімальні вимоги: 1GB RAM, 1 CPU
- ОС: Ubuntu 20.04+

**2. Підключись по SSH**
```bash
ssh root@your_server_ip
```

**3. Встанови Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**4. Завантаж файли**
```bash
mkdir /opt/telegram-notifier
cd /opt/telegram-notifier

# Створи файли (через nano або vim)
nano server.js     # Вставь код сервера
nano package.json  # Вставь package.json
```

**5. Встанови залежності**
```bash
npm install
```

**6. Запусти сервер**
```bash
npm start
```

**7. Використовуй PM2 для автозапуску**
```bash
npm install -g pm2
pm2 start server.js --name telegram-notifier
pm2 startup
pm2 save
```

**8. Відкрий порт в фаєрволі**
```bash
sudo ufw allow 3000
```

**9. Тепер сервер доступний за адресою:**
```
http://your_server_ip:3000
```

### Варіант 2: Heroku (безкоштовно)

**1. Зареєструйся на Heroku:** https://heroku.com

**2. Встанови Heroku CLI**

**3. Створи додаток**
```bash
heroku create telegram-notifier-app
```

**4. Додай Procfile**
```
web: node server.js
```

**5. Завантаж код**
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku master
```

**6. Твій сервер доступний:**
```
https://telegram-notifier-app.herokuapp.com
```

### Варіант 3: Railway.app (дуже просто)

1. Зареєструйся на https://railway.app
2. Натисни "New Project"
3. Вибери "Deploy from GitHub"
4. Додай файли (server.js, package.json)
5. Railway автоматично запустить сервер
6. Отримаєш URL типу: `https://something.railway.app`

---

## 🔐 Безпека

### Access Tokens

Кожен користувач отримує унікальний **Access Token** при реєстрації.

Приклад: `a3f5e8d2c9b1a0f3e8d2c9b1a0f3e8d2c9b1a0f3e8d2c9b1a0f3e8d2`

**Зберігай його в секреті!** Він дає доступ до відправки повідомлень від твого імені.

### CORS

Сервер дозволяє запити з будь-яких доменів (`cors: true`).

Для production краще обмежити:
```javascript
app.use(cors({
    origin: ['https://your-trading-terminal.com']
}));
```

---

## 📊 База Даних

Сервер використовує **SQLite** - файл `trading_bot.db`

### Таблиця `users`

| Поле         | Тип      | Опис                    |
|-------------|----------|-------------------------|
| id          | INTEGER  | Унікальний ID           |
| username    | TEXT     | Ім'я користувача        |
| access_token| TEXT     | Токен доступу (унікальний) |
| chat_id     | TEXT     | ID чату Telegram        |
| thread_id   | TEXT     | ID гілки (опціонально)  |
| created_at  | DATETIME | Дата реєстрації         |

### Таблиця `tracked_positions`

| Поле         | Тип      | Опис                    |
|-------------|----------|-------------------------|
| id          | INTEGER  | Унікальний ID           |
| user_id     | INTEGER  | ID користувача          |
| card_id     | TEXT     | ID картки позиції       |
| is_open     | INTEGER  | 1 = відкрита, 0 = закрита |
| last_updated| DATETIME | Останнє оновлення       |

---

## 🐛 Вирішення проблем

### Помилка: "Cannot connect to server"

**Причина:** Сервер не запущений або неправильна URL

**Рішення:**
1. Перевір чи працює сервер: відкрий `http://localhost:3000` в браузері
2. Перевір URL в панелі клієнта
3. Якщо VPS - перевір чи відкритий порт 3000

### Помилка: "Invalid access token"

**Причина:** Токен невірний або не існує

**Рішення:**
1. Натисни "Зареєструватися" знову
2. Перевір консоль браузера (F12)
3. Перевір що сервер працює

### Повідомлення не приходять

**Причини:**
1. Невірний Bot Token в server.js
2. Невірний Chat ID
3. Бот не є адміністратором групи

**Рішення:**
1. Перевір Bot Token
2. Використай @userinfobot для отримання Chat ID
3. Додай бота в групу як адміна

---

## 📝 API Endpoints

### POST `/api/register`
Реєстрація нового користувача

**Request:**
```json
{
  "username": "Саша Ковальчук",
  "chatId": "-1001234567890",
  "threadId": "123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "a3f5e8d2c9b1...",
  "userId": 1
}
```

### POST `/api/notify`
Відправка повідомлення про нову позицію

**Request:**
```json
{
  "accessToken": "a3f5e8d2c9b1...",
  "cardId": "mexc_BTC_F_binance_BTC_F",
  "positionData": {
    "symbol": "BTC",
    "side": "LONG",
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Повідомлення відправлено",
  "sent": true
}
```

### POST `/api/close`
Закриття позиції

**Request:**
```json
{
  "accessToken": "a3f5e8d2c9b1...",
  "cardId": "mexc_BTC_F_binance_BTC_F"
}
```

### POST `/api/init`
Ініціалізація списку відкритих позицій

**Request:**
```json
{
  "accessToken": "a3f5e8d2c9b1...",
  "openPositions": ["card1", "card2", "card3"]
}
```

### POST `/api/test`
Відправка тестового повідомлення

**Request:**
```json
{
  "accessToken": "a3f5e8d2c9b1..."
}
```

---

## 🎉 Готово!

Тепер у тебе є повноцінна система для:
- ✅ 15+ користувачів одночасно
- ✅ Збереження стану в базі даних
- ✅ Відсутність проблем з CORS
- ✅ Індивідуальні налаштування для кожного
- ✅ Відсутність дублікатів
- ✅ Підтримка гілок Telegram

**Успішних трейдів!** 🚀💰
