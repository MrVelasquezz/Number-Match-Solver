//
/// Маленькая программа, используемая для решения задач в игре "Number Match" 
/// Решает 95% всех случаем. Возможны баги. В планах сделать API, для решения 
/// задач и считывания их со снимка экрана
/// Made by MrVelasquezz
//

const fs = require('fs')

//
/// Solver Class является основным классом, содержащим в себе логику и методы,
/// необходимые для решения задач
//

class Solver {

    //
    /// Class constructor
    /// содержит в себе переменную поля, длину поля и индекс итерации
    /// что бы показать программе сколько ответов было дано и есть ли смысл
    /// продолжать искать ответы
    //
    constructor() {
        this.field = [] // field array. Holds objects of type {value, killed}
        this.row_length = 9
        this.true_itter = 1
    }


    //
    /// check_logic method
    /// содержит в себе логику, которая повторяется во многих методах
    /// 
    /// args =>
    ///     row_id1/2 =: строка на которой лежит первый/второй элемент
    ///     object_id1/2 =: позиция первого/второго элемента в строке
    //
    check_logic(row_id1, row_id2, object_id1, object_id2) {
        return this.field[row_id1][object_id1].value === this.field[row_id2][object_id2].value ||
            (this.field[row_id1][object_id1].value + this.field[row_id2][object_id2].value) === 10
    }

    //
    /// kill_empty_rows method
    /// Метод, который убирает пустые ряды
    //
    kill_empty_rows() {

        // проходит по всему полю и ищет пустые ряды
        for (let i = 0; i < this.field.length; i++) {
            const row = this.field[i].filter(r => !r.killed)

            // если ряд является пустым, то он удаляется и оповещает пользователя
            // оранжевым текстом
            if (row.length === 0) {

                this.field.splice(i, 1)
                console.log(`\x1b[93mKilling row ${i+1}\x1b[0m`)
                // \x1b[93m -> код оранжевого цвета на linux
                // \x1b[0m -> код сброса цвета на linux
            }
        }
    }

    //
    /// check_and_find_next_horizontal method
    /// Метод, который ищет элементы по горизонтали
    ///
    /// args=>
    ///     row_id =: id строки, на которой находится элемент
    ///     object_id =: id элемента в строке 
    /// @return null
    //
    check_and_find_next_horizontal(row_id, object_id) {

        // проходит по всем строкам, начиная с переданной в аргументе
        // сделано так по причине того, что в игре по горизонтали можно 
        // подбирать сочитания даже находящиеся на следующей линии
        for (let r = row_id; r < this.field.length; r++) {

            // проходит по всем элементам с лева на право
            for (let i = object_id + 1; i < this.field[r].length; i++) {

                // проверяет что бы объект существовал и что бы конечная цель
                // не была устранена ранее 
                if (this.field[r][i] && !this.field[r][i].killed) {

                    if (this.check_logic(row_id, r, object_id, i)) {

                        // меняем статусы данных элементов на устраненные
                        this.field[row_id][object_id].killed = true
                        this.field[r][i].killed = true

                        // выводим решение задачи в консоль
                        console.log(`Horizontal solvation: el_1[${row_id+1}, ${object_id+1}] ` +
                            `el_2[${r+1}, ${i+1}] ` +
                            `int[${this.field[row_id][object_id].value}, ${this.field[r][i].value}] ` +
                            `sum[${this.field[row_id][object_id].value+this.field[r][i].value}]`)

                        // прибавляем к кол-ву ходов 1, что бы цикл продолжался 
                        this.true_itter++
                        // проверяем наличие пустых рядов (Где все элементы устранены)
                        this.kill_empty_rows()

                        return true
                    }
                    // завершаем выполнение функции, т.к элементы были устранены
                    return false
                }
            }
        }
        // завершаем выполнение функции, т.к ничего не было найдено
        return false
    }

    //
    /// check_and_find_next_vertical method
    /// Метод который ищет совпадения по вертикали
    ///
    /// args=>
    ///     row_id =: id строки, на которой находится элемент
    ///     object_id =: id элемента в строке 
    /// @return null
    //
    check_and_find_next_vertical(row_id, object_id) {

        // проходит по всем строкам, пока не встретит не устраненный элемент
        for (let i = row_id + 1; i < this.field.length; i++) {

            if (this.field[i][object_id] && !this.field[i][object_id].killed) {

                if (this.check_logic(row_id, i, object_id, object_id)) {

                    this.field[row_id][object_id].killed = true
                    this.field[i][object_id].killed = true

                    console.log(`Vertical solvation: el_1[${row_id+1}, ${object_id+1}] ` +
                        `el_2[${i+1}, ${object_id+1}] ` +
                        `int[${this.field[row_id][object_id].value}, ${this.field[i][object_id].value}] ` +
                        `sum[${this.field[row_id][object_id].value+this.field[i][object_id].value}]`)

                    this.true_itter++
                    this.kill_empty_rows()

                    return true
                }
                return false
            }
        }
        return false
    }

    //
    /// check_and_find_next_diagonal method
    /// Метод который ищет совпадения по диагонали 
    ///
    /// args=>
    ///     row_id =: id строки, на которой находится элемент
    ///     object_id =: id элемента в строке 
    /// @return null
    //
    check_and_find_next_diagonal(row_id, object_id) {

        let obj_right = object_id + 1 // объект стоящий справа от цели
        let obj_left = object_id - 1 // объект стоящий слева от цели
        const seq_fail = [false, false] // состояние логики. если оба false,
        // выполнение метода прерывается

        // проходит по всем строкам и проверяет наличие подходящего значения
        for (let i = row_id + 1; i < this.field.length; i++) {

            // проверка по направлению на право
            // проверяет, существует ли объект и не провалился ли прежде данНый вариант
            if (this.field[i][obj_right] && !seq_fail[0]) {

                // проверяет, является ли координат объекта в пределах поля
                if (obj_right < this.field[i].length && !this.field[i][obj_right].killed) {

                    if (this.check_logic(row_id, i, object_id, obj_right)) {

                        this.field[row_id][object_id].killed = true
                        this.field[i][obj_right].killed = true

                        console.log(`Diagonal to right solvation: el_1[${row_id+1}, ${object_id+1}] ` +
                            `el_2[${i+1}, ${obj_right+1}] ` +
                            `int[${this.field[row_id][object_id].value}, ${this.field[i][obj_right].value}] ` +
                            `sum[${this.field[row_id][object_id].value+this.field[i][obj_right].value}]`)

                        this.true_itter++
                        this.kill_empty_rows()

                        return true
                    }
                    // записывает данный вариант в проваленные
                    seq_fail[0] = true
                }
                // проверяет что бы элемент быЛ в зоне видимости и не был устранен 
                else if (this.field[i][obj_right].killed && obj_right < this.field[i].length - 1) {
                    // продвигает элемент на 1 позиция направо
                    obj_right++
                } else {
                    seq_fail[0] = true
                }
            } else {
                seq_fail[0] = true
            }

            // проверка по направлению на право
            if (this.field[i][obj_left] && !seq_fail[1]) {

                // проверяет что бы объект был на поле и что бы не был устранен
                if (obj_left >= 0 && !this.field[i][obj_left].killed) {

                    if (this.check_logic(row_id, i, object_id, obj_left)) {
                        this.field[row_id][object_id].killed = true
                        this.field[i][obj_left].killed = true

                        console.log(`Diagonal to left solvation: el_1[${row_id+1}, ${object_id+1}] ` +
                            `el_2[${i+1}, ${obj_left+1}] ` +
                            `int[${this.field[row_id][object_id].value}, ${this.field[i][obj_left].value}] ` +
                            `sum[${this.field[row_id][object_id].value+this.field[i][obj_left].value}]`)

                        this.true_itter++
                        this.kill_empty_rows()

                        return true
                    }
                    seq_fail[1] = true
                } else if (this.field[i][obj_left].killed && obj_left > 0) {
                    // передвигает координат цели на 1 позицию на лево 
                    obj_left--
                } else {
                    seq_fail[1] = true
                }
            } else {
                seq_fail[1] = true
            }

            // проверяет, если все варианты провалились. если да, то завершает выполнение метода
            if (seq_fail.every(r => r == true)) {
                return false
            }
        }
        return false
    }

    //
    /// solve_directions method
    /// Метод созданный для запуска поисковых методов. 
    /// Метод проходит по всем элементам и для каждого из них
    /// вызывает методы проверки
    //
    solve_directions() {

        // проходит по всем строкам 
        for (let i = 0; i < this.field.length; i++) {

            // проходит по всем элементам в строке
            for (let x = 0; x < this.field[i].length; x++) {
                // переменная, добавленная для записи состояния элемента
                // если в процессе выполнения элемент будет устранен, 
                // то программа пропустит следующие проверки
                let is_killed = false

                // проверяет, если элемент еще не устранен
                if (this.field[i][x].killed) {
                    is_killed = true
                }

                if (!is_killed) {
                    // запускает проверку по горизонтали
                    this.check_and_find_next_horizontal(i, x)
                }

                // если достаточно места и есть элементы для проверки, запускает проверку
                // по вертикали
                if (!is_killed && i < this.field.length - 1 && this.field[i + 1][x] != undefined) {
                    this.check_and_find_next_vertical(i, x)
                }
                // если достаточно места и есть элементы для проверки, запускает проверку
                // по диагонали
                if (!is_killed && i < this.field.length - 1) {
                    this.check_and_find_next_diagonal(i, x)
                }
            }
        }
    }

    //
    /// write_field method
    /// Метод созданный для вывода поля и отображения на нем
    /// устраненных элементов
    //
    write_field() {
        // индексы строк
        let i = 1

        // разделитель состоящий из „=“, который отделяет поле от ответов
        console.log(''.padStart(this.row_length * 3, '='))

        this.field.forEach(item => {
            // используется данный метод, потому что он не переходит автоматом на 
            // новую линию
            process.stdout.write(`${i})${i>9?' ':'  '}`)

            // если элемент устранен, то он отображается красным 
            item.forEach(elem => {
                if (elem.killed) {
                    process.stdout.write(`\x1b[31m${elem.value}\x1b[0m`)
                } else {
                    process.stdout.write(`${elem.value}`)
                }
                process.stdout.write(` `)
            })
            process.stdout.write(`\n`)
            i++
        })
        console.log(''.padStart(this.row_length * 3, '='))
    }

    //
    /// parse method
    /// Метод созданный для чтения документа с данными поля и его преобразования 
    /// в рабочий объект
    //
    parse() {
        let raw = fs.readFileSync('raw', {
            encoding: 'utf8',
            flag: 'r'
        })

        const replace_items = ['\n', ' ']

        replace_items.forEach(item => {
            raw = raw.replaceAll(item, '')
        })
        console.log('Raw field is: %s', raw)

        raw.split('').forEach(item => {
            if (!this.field.length || this.field[this.field.length - 1].length >= this.row_length) {
                this.field.push([])
            }
            if (this.field.length) {
                this.field[this.field.length - 1].push({
                    value: parseInt(item),
                    killed: false
                })
            } else {
                throw new Error('Error occured. No field row created')
            }
        })
    }

    //
    /// init method
    /// Метод запускающий программу и контролирующий, что бы не было излишних итераций
    //
    init() {
        const time_now = Date.now()

        this.parse()
        this.write_field()
        while (this.true_itter > 0) {
            this.true_itter = 0
            this.solve_directions()
            if (this.true_itter > 0) {
                this.write_field()
            }
        }
        console.log('All combinations were solved!')
        this.write_field()
        // примитивный замер времени выполнения
        console.log(`\x1b[92mAlgorithm took ${(Date.now() - time_now)/1000}s\x1b[0m]`)
    }
}

const solver = new Solver()
solver.init()