const path = require('path');
const TelegrammBotApi = require('node-telegram-bot-api');
const mysql = require('mysql');
const fs = require('fs');

const TOKEN = '5038783257:AAGLlQGQiWN036D-B-SrRjaWsaQ0o7Xs-RE';

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'students'
});

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

class MyBotFunction {

    step = 'begin'

    bot = new TelegrammBotApi(TOKEN, {
        polling: true
    })

    constructor() {

    }

    start() {
        const newBot = this.bot;
        var new_step = this.step;
        newBot.on('text', msg => {
            const chat_id = msg.chat.id;
            const { text } = msg;

            if (/^\/start/.test(text.trim()) || new_step == 'begin') {

                newBot.sendMessage(chat_id, `Здравствуйте, введите номер зачётки!`, {
                    reply_markup: {
                        remove_keyboard: true
                    }
                })
                    .then(() => {
                        new_step = 'zachetka';
                    });
                return;
            }


            switch (new_step) {
                case 'zachetka':
                    connection.query(
                        `SELECT * FROM students WHERE doc_number = '${text}'`,
                        function (error, results, fields) {
                            if (error) {
                                console.log(error);

                                newBot.sendMessage(chat_id, `Номер зачётки не найден в базе!`, {
                                    reply_markup: {
                                        remove_keyboard: true
                                    }
                                })
                                    .then(() => {
                                        new_step = 'zachetka';


                                    });
                            } else {
                                console.log(results);
                                if (results.length == 0)
                                    newBot.sendMessage(chat_id, `Номер зачётки не найден в базе!`, {
                                        reply_markup: {
                                            remove_keyboard: true
                                        }
                                    })
                                        .then(() => {
                                            new_step = 'zachetka';
                                        });
                                else
                                    newBot.sendMessage(chat_id, `Здравствуйте ${results[0].fio}!`, {
                                        reply_markup: {
                                            keyboard: choice_begin_button
                                        }
                                    })
                                        .then(() => {
                                            let user_step = 'timetable';
                                            new_step = 'registered';
                                            connection.query(`SELECT * FROM user WHERE chat_id = '${chat_id}'`, (err, results) => {
                                                if (results.length == 0) {
                                                    connection.query(`INSERT INTO user (id, chat_id, user_step) VALUES (NULL, '${chat_id}', '${user_step}')`)
                                                } else {
                                                    connection.query(`UPDATE user SET user_step = '${user_step}' WHERE chat_id = '${chat_id}';`)
                                                }
                                            })

                                        });
                            }
                        }
                    );
                    break;
                case 'registered':

                    connection.query(`SELECT * FROM user WHERE chat_id = '${chat_id}'`, (error, results) => {
                        var user_step = results[0].user_step;
                        console.log(user_step);
                        if (user_step == 'timetable') {
                            if (text == 'Узнать расписание') {
                                newBot.sendMessage(chat_id, `Выберите день недели!`, {
                                    reply_markup: {
                                        keyboard: choice_days_button
                                    }
                                }).then(() => {
                                    user_step = 'timetable_day';
                                    connection.query(`UPDATE user SET user_step = '${user_step}' WHERE chat_id = '${chat_id}'`)
                                }).catch((err) => console.log(err));

                            } else if (text == 'Выход') {
                                newBot.sendMessage(chat_id, `Вы вышли`)
                                    .then(() => {
                                        new_step = 'zachetka';
                                    })
                                newBot.sendMessage(chat_id, `Здравствуйте, введите номер зачётки!`, {
                                    reply_markup: {
                                        remove_keyboard: true
                                    }
                                })
                            }
                        } else if (user_step == 'timetable_day') {
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

                                newBot.sendMessage(chat_id, "Ваше расписание: \n" + str);
                            } else if (text == 'Вся неделя') {
                                let str = '';

                                for (let i = 0; i < choice_days_button[0].length; i++) {

                                    str += choice_days_button[0][i] + "\n\n";

                                    for (let y = 0; y < table[arr_days_assoc[choice_days_button[0][i]]].lessons.length; y++) {
                                        str += (y + 1) + " Пара " + " - " + table[arr_days_assoc[choice_days_button[0][i]]].lessons[y].item + ";" + "\n" +
                                            "Время" + " " + table[arr_days_assoc[choice_days_button[0][i]]].lessons[y].time + "\n" +
                                            "№ Кабинета " + table[arr_days_assoc[choice_days_button[0][i]]].lessons[y].room + "\n" +
                                            "Преподаватель" + " " + table[arr_days_assoc[choice_days_button[0][i]]].lessons[y].prepod + "\n" + "\n";
                                    }

                                }

                                newBot.sendMessage(chat_id, "Ваше расписание: \n" + str);
                            } else if (text == 'Вернуться') {
                                newBot.sendMessage(chat_id, `Введите номер зачётки!`, {
                                    reply_markup: { remove_keyboard: true }
                                })
                                    .then(() => new_step = "zachetka")
                            }
                        }

                    });

                    break;
            }

        });
    }

}

new MyBotFunction().start();