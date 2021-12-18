const path = require('path');
const TelegrammBotApi = require('node-telegram-bot-api');
const mysql = require('mysql');

const TOKEN = '5027183755:AAHNfjLxSMQ2UnhHjDJ6rA6cXuq33BAWZIE';

const bot = new TelegrammBotApi(TOKEN, {
    polling: true
})

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'students'
});

var step = 'begin';

// var arr_smiles = [
//     ['\ud83d\ude05', '\ud83d\ude18', '\ud83d\ude09'],
//     ['\ud83d\ude08', '\ud83d\ude0e', '\ud83d\ude07'],
//     ['\ud83d\ude0d', '\ud83d\ude0a', '\ud83d\ude33'],
//     ['\ud83d\udc4d', '\ud83d\udc4e', '\ud83d\udc4c', '\ud83d\udd95']
// ]

bot.on('text', msg => {
    const chat_id = msg.chat.id;
    const { text } = msg;

    if (/^\/start/.test(text.trim()) || step == 'begin') {

        bot.sendMessage(chat_id, `Здравствуйте, введите номер зачётки!`)
            .then(() => {
                step = 'zachetka';
            });
        return;
    }

    switch (step) {
        case 'zachetka':

            connection.query(
                `SELECT * FROM students WHERE doc_number = '${text}'`,
                function (error, results, fields) {
                    if (error) {
                        console.log(error);

                        bot.sendMessage(chat_id, `Номер зачётки не найден в базе!`)
                            .then(() => {
                                step = 'zachetka';
                            });
                    } else {
                        console.log(results);
                        if (results.length == 0)
                            bot.sendMessage(chat_id, `Номер зачётки не найден в базе!`)
                                .then(() => {
                                    step = 'zachetka';
                                });
                        else
                            bot.sendMessage(chat_id, `Здравствуйте ${results[0].fio}!`)
                                .then(() => {
                                    step = 'zachetka';
                                });
                    }
                }
            );

            break;
    }

});

