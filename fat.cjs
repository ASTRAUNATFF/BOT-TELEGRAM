console.clear();
const TelegramBot = require("node-telegram-bot-api");
const fetch = require('node-fetch');
const dotenv = require("dotenv");
dotenv.config();

const bot = new TelegramBot('6849284239:AAH1fpqkOL-4Tu7fTC8I_2y9vwCFI3nwY5Q', { polling: true });

bot.onText(/\/p (.+)/s, (msg, match) => {
    const chatID = msg.chat.id;

    if (!match || !match[1]) {
        // Handle the case where the regex match is not present or empty
        console.log('Invalid command format.');
        return;
    }

    const coinSymbols = match[1].split(' ');

    fetch("https://scanner.tradingview.com/crypto/scan")
        .then(response => response.json())
        .then(data => {
            const symbols = data.data.map(item => ({
                symbol: item.s,
                description: item.d
            }));

            const coinRequests = symbols
                .filter(item => coinSymbols.includes(item.symbol))
                .map(item => {
                    const fxPair_FOUND = item.symbol.replace(/FX_IDC:/,'');
                    const apiKey_CurrencyLayer = '74507d25554fe37b18d131e1254bcefe'; // Replace with your actual API key

                    const fromCURRENCY = fxPair_FOUND.substring(0,3);
                    const toCURRENCY = fxPair_FOUND.substring(3);
                    const fixAmount = 1;
                    const apiUrl = `http://api.currencylayer.com/convert?access_key=${apiKey_CurrencyLayer}&from=${fromCURRENCY}&to=${toCURRENCY}&amount=${fixAmount}`;

                    return fetch(apiUrl)
                        .then(response2 => response2.json())
                        .then(data2 => {
                            const quote = data2.result;
                            return { coin: fxPair_FOUND, quote: quote };
                        })
                        .catch(error => {
                            console.error(error);
                            return { coin: fxPair_FOUND, error: 'Error fetching data' };
                        });
                });

            Promise.all(coinRequests)
                .then(results => {
                    results.forEach(result => {
                        if (result.error) {
                            console.log(`Error for ${result.coin}: ${result.error}`);
                            bot.sendMessage(chatID, `Error for ${result.coin}: ${result.error}`);
                        } else {
                            console.log(`Giá của ${result.coin}: $${result.quote}`);
                            bot.sendMessage(chatID, `Giá của ${result.coin}: $${result.quote}`);
                        }
                    });
                })
                .catch(error => {
                    console.error(error);
                    bot.sendMessage(chatID, 'Có lỗi xảy ra khi xử lý yêu cầu.');
                });
        })
        .catch(error => {
            console.error(error);
            bot.sendMessage(chatID, 'Có lỗi xảy ra khi lấy dữ liệu từ TradingView.');
        });
});

bot.on("message", (msg) => {
    const chatID = msg.chat.id;

    switch (msg.text) {
        case "/start":
            bot.sendMessage(chatID,
                "Để lấy giá, gọi lệnh sau: \nMẫu: `/p BTC ETH`",
                { parse_mode: "Markdown" }
            );
            break;
    
        default:
            break;
    }
});