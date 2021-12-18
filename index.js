const path = require('path');
const TelegrammBotApi = require('node-telegram-bot-api');
const mysql = require('mysql');
const fs = require('fs');

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

var choice_begin_button = [
    ['Узнать расписание'], ['Выход']
]

var choice_days_button = [
    ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'], ['Вся неделя'], ['Вернуться']
]

var arr_days_assoc = {
    'ПН': 'MON',
    'ВТ': 'TUE',
    'СР': 'WED',
    'ЧТ': 'THU',
    'ПТ': 'FRI',
    'СБ': 'SAT'
}

var timetable_button = [

]

bot.on('text', msg => {
    const chat_id = msg.chat.id;
    const { text } = msg;

    if (/^\/start/.test(text.trim()) || step == 'begin') {

        bot.sendMessage(chat_id, `Здравствуйте, введите номер зачётки!`, {
            reply_markup: {
                remove_keyboard: true
            }
        })
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

                        bot.sendMessage(chat_id, `Номер зачётки не найден в базе!`, {
                            reply_markup: {
                                remove_keyboard: true
                            }
                        })
                            .then(() => {
                                step = 'zachetka';
                            });
                    } else {
                        console.log(results);
                        if (results.length == 0)
                            bot.sendMessage(chat_id, `Номер зачётки не найден в базе!`, {
                                reply_markup: {
                                    remove_keyboard: true
                                }
                            })
                                .then(() => {
                                    step = 'zachetka';
                                });
                        else
                            bot.sendMessage(chat_id, `Здравствуйте ${results[0].fio}!`, {
                                reply_markup: {
                                    keyboard: choice_begin_button
                                }
                            })
                                .then(() => {
                                    step = 'timetable';
                                });
                    }
                }
            );

            break;
        case 'timetable':
            if (text == 'Узнать расписание') {
                bot.sendMessage(chat_id, `Выберите день недели!`, {
                    reply_markup: {
                        keyboard: choice_days_button
                    }
                }).then(() => {
                    step = 'timetable_day'
                }).catch((err) => console.log(err));

            } else if (text == 'Выход') {
                bot.sendMessage(chat_id, `Вы вышли`)
                    .then(() => {
                        step = 'zachetka';
                    })
                bot.sendMessage(chat_id, `Здравствуйте, введите номер зачётки!`, {
                    reply_markup: {
                        remove_keyboard: true
                    }
                })
            }
            break;
        case 'timetable_day':
            let tableString = fs.readFileSync(path.join(__dirname, 'timetable.json'));
            let table = JSON.parse(tableString);

            if (arr_days_assoc.hasOwnProperty(text)) {
                let lessons_data = table[arr_days_assoc[text]].lessons;
                let str = '';

                for (let i = 0; i < lessons_data.length; i++) {
                    str += (i + 1) + " Пара " + " - " + lessons_data[i].item + ";" + "\n" +
                        "Время" + " " + lessons_data[i].time + "\n" +
                        "№ Кабинета " + lessons_data[i].room + "\n" +
                        "Преподаватель" + " " + lessons_data[i].prepod + "\n" + "\n";
                }

                bot.sendMessage(chat_id, "Ваше расписание: \n" + str);
            } else if ( text == 'Вся неделя' ) {
                let str = ''; 

                for(let i = 0; i < choice_days_button[0].length; i++){

                    str += choice_days_button[0][i] + "\n\n";

                    for (let y = 0; y < table[arr_days_assoc[choice_days_button[0][i]]].lessons.length; y++){
                        str += (y + 1) + " Пара " + " - " + table[arr_days_assoc[choice_days_button[0][i]]].lessons[y].item + ";" + "\n" +
                        "Время" + " " + table[arr_days_assoc[choice_days_button[0][i]]].lessons[y].time + "\n" +
                        "№ Кабинета " + table[arr_days_assoc[choice_days_button[0][i]]].lessons[y].room + "\n" +
                        "Преподаватель" + " " + table[arr_days_assoc[choice_days_button[0][i]]].lessons[y].prepod + "\n" + "\n";
                    }
                    
                }

                bot.sendMessage(chat_id, "Ваше расписание: \n" + str);
            } else if ( text == 'Вернуться' ) {
                bot.sendMessage(chat_id, `Введите номер зачётки!`, {
                    reply_markup:{remove_keyboard: true}
                })
                    .then(()=>step="zachetka")
            }

            break;
    }

});

