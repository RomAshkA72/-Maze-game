// Получаем элемент canvas из HTML и создаем 2D контекст для рисования
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

// Устанавливаем размеры ячеек и вычисляем количество строк и столбцов
const cellSize = 25;
let rows = Math.floor(canvas.height / cellSize);
let cols = Math.floor(canvas.width / cellSize);
let minDistance = 50; // Минимальное расстояние между игроком и выходом
let maze = []; // Хранит лабиринт
let player = { x: 0, y: 0 }; // Позиция игрока
let exit = { x: 0, y: 0 }; // Позиция выхода
let allPaths = []; // Все возможные пути от игрока до выхода
let allPaths2 = [];
let selectedPathIndex = -1; // Индекс выбранного пути
let isPathVisible = false; // Флаг для отображения путей
let isDynamicPathUpdate = true; // Флаг для динамического обновления путей

// Добавляем второго игрока
let player2 = { x: 0, y: 0 }; // Позиция второго игрока
let allPathsPlayer2 = []; // Все возможные пути для второго игрока
let selectedPathIndexPlayer2 = -1; // Индекс выбранного пути для второго игрока

let timerInterval; // Переменная для хранения таймера
let timeElapsed = 0; // Время, прошедшее с начала игры
const timerDisplay = document.getElementById('timer'); // Элемент для отображения времени

// Модальное окно и кнопка Старт
const modal = document.getElementById('modal'); // Модальное окно
const startButton = document.getElementById('startButton'); // Кнопка старта
const sizeSelect = document.getElementById('sizeSelect'); // Селектор выбора размера
const victoryModal = document.getElementById('victoryModal'); // Модальное окно победы
const winnerMessage = document.getElementById('winnerMessage'); // Сообщение победителя
const timeElapsedMessage = document.getElementById('timeElapsedMessage'); // Сообщение времени

// Функция для отображения модального окна
function showModal() {
    modal.style.display = 'flex'; // Устанавливаем стиль модального окна
}

// Функция сортировки путей второго игрока
function sortPathsPlayer2() {
    allPathsPlayer2.sort((a, b) => a.length - b.length);
}

// Обновление списка путей для второго игрока
function updatePathListPlayer2() {
    const pathListPlayer2 = document.getElementById('pathListPlayer2'); // Получаем новый список
    pathListPlayer2.innerHTML = ''; // Очищаем список

    allPathsPlayer2.forEach((path, index) => {
        const length = path.length; // Длина пути
        const button = document.createElement('button');
        button.textContent = `Path ${index + 1}: Length: ${length}`;
        button.onclick = () => {
            selectedPathIndexPlayer2 = index; // Запоминаем выбранный путь
            draw(); // Перерисовываем лабиринт
        };
        pathListPlayer2.appendChild(button); // Добавляем кнопку в список
    });
}


// Функция для запуска таймера
function startTimer() {
    timeElapsed = 0; // Сброс времени
    clearInterval(timerInterval); // Очищаем предыдущий интервал
    timerInterval = setInterval(() => {
        timeElapsed++;
        document.getElementById("timerDisplay").textContent = `Time: ${timeElapsed} s`; // Обновление отображаемого времени
    }, 1000); // Таймер обновляется каждую секунду
}

// Функция для остановки таймера
function stopTimer() {
    clearInterval(timerInterval); // Очищаем интервал таймера
}

// Функция проверки завершения игры
function checkGameEnd() {
    if (player.x === exit.x && player.y === exit.y) {
        stopTimer();
        showVictoryModal(1, timeElapsed);
    } else if (player2.x === exit.x && player2.y === exit.y) {
        stopTimer();
        showVictoryModal(2, timeElapsed);
    }
}

// Обработчик клика на кнопку Старт
startButton.addEventListener('click', () => {
    modal.style.display = 'none'; // Скрываем модальное окно
    startTimer(); // Запускаем таймер
    initializeMaze(); // Инициализируем лабиринт
});

// Функция генерации лабиринта
function generateMaze(rows, cols) {
    const newMaze = Array.from({ length: rows }, () => Array(cols).fill(1)); // Создаем новый лабиринт, заполненный стенами
    const stack = [{ x: 0, y: 0 }]; // Стек для хранения текущих позиций
    newMaze[0][0] = 0; // Начальная точка - открытое пространство

    // Основной алгоритм генерации лабиринта
    while (stack.length > 0) {
        const { x, y } = stack.pop(); // Получаем текущую позицию из стека
        const directions = [{ x: 0, y: -2 }, { x: 0, y: 2 }, { x: -2, y: 0 }, { x: 2, y: 0 }]; // Возможные направления движения
        directions.sort(() => Math.random() - 0.5); // Перемешиваем направления для случайности
        // Проверка каждого направления
        for (const direction of directions) {
            const newX = x + direction.x; // Новая позиция по X
            const newY = y + direction.y; // Новая позиция по Y
            const wallX = x + direction.x / 2; // Позиция стены по X
            const wallY = y + direction.y / 2; // Позиция стены по Y

            // Проверяем, находится ли новая позиция внутри границ и является ли она стеной
            if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && newMaze[newY][newX] === 1) {
                newMaze[wallY][wallX] = 0; // Удаляем стену
                newMaze[newY][newX] = 0; // Открываем новую ячейку
                stack.push({ x: newX, y: newY }); // Добавляем новую позицию в стек
            }
        }
    }
    return newMaze; // Возвращаем сгенерированный лабиринт
}

// Функция для добавления случайных проходов в лабиринт
function addRandomPassages(maze, extraPassages) {
    for (let i = 0; i < extraPassages; i++) {
        const x = Math.floor(Math.random() * cols); // Случайная позиция по X
        const y = Math.floor(Math.random() * rows); // Случайная позиция по Y
        if (maze[y][x] === 1) {
            maze[y][x] = 0; // Открываем проход
        }
    }
}

// Функция для поиска случайной свободной ячейки
function findRandomFreeCell() {
    let x, y;
    do {
        x = Math.floor(Math.random() * cols); // Случайная позиция по X
        y = Math.floor(Math.random() * rows); // Случайная позиция по Y
    } while (maze[y][x] === 1); // Повторяем, пока не найдем свободную ячейку
    return { x, y }; // Возвращаем координаты
}

function initializeMaze() {
    maze = generateMaze(rows, cols);
    addRandomPassages(maze, 20);

    let pathFound = false;
    while (!pathFound) {
        player = findRandomFreeCell();
        exit = findRandomFreeCell();
        initializePlayer2();

        if (getDistance(player, exit) >= minDistance && getDistance(player2, exit) >= minDistance) {
            pathFound = true;
        }
    }

    allPaths = findAllPaths(maze, player, exit);
    allPathsPlayer2 = findAllPaths(maze, player2, exit);

    updatePathList();
    updatePathListPlayer2(); // Обновление списка путей второго игрока
    draw();
}


// Функция для нахождения всех возможных путей
function findAllPaths(maze, start, end) {
    const paths = []; // Массив для хранения всех путей
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false)); // Массив для отслеживания посещенных ячеек

    // Рекурсивная функция для поиска путей (глубинный поиск)
    function dfs(x, y, path) {
        if (x === end.x && y === end.y) { // Если достигли выхода
            paths.push([...path]); // Добавляем текущий путь в массив
            return;
        }

        visited[y][x] = true; // Отмечаем текущую ячейку как посещенную
        const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]; // Возможные направления движения

        // Проверка каждого направления
        for (const direction of directions) {
            const newX = x + direction.x; // Новая позиция по X
            const newY = y + direction.y; // Новая позиция по Y

            // Проверяем, находится ли новая позиция внутри границ и является ли она проходимой
            if (
                newX >= 0 && newX < cols &&
                newY >= 0 && newY < rows &&
                maze[newY][newX] === 0 &&
                !visited[newY][newX]
            ) {
                path.push({ x: newX, y: newY }); // Добавляем новую позицию в путь
                dfs(newX, newY, path); // Рекурсивный вызов
                path.pop(); // Удаляем последнюю позицию для обратного пути
            }
        }
        visited[y][x] = false; // Отмечаем ячейку как непосещенную для других путей
    }

    dfs(start.x, start.y, [{ x: start.x, y: start.y }]); // Начинаем поиск с позиции игрока
    return paths; // Возвращаем найденные пути
}

// Обновленная функция отображения всех возможных путей
function showAllPossiblePaths() {
    allPaths = findAllPaths(maze, player, exit); // Находим все пути
    isPathVisible = true; // Устанавливаем флаг видимости путей
    sortPaths(); // Сортируем пути по длине
    updatePathList(); // Обновляем список путей
    draw(); // Перерисовываем лабиринт
}

// Функция обновления путей для второго игрока
function updatePathsPlayer2() {
    allPathsPlayer2 = findAllPaths(maze, player2, exit);
    isPathVisible = true;
    sortPathsPlayer2();
    updatePathListPlayer2();
    draw();
}

// Функция для сортировки путей по длине
function sortPaths() {
    allPaths.sort((a, b) => a.length - b.length); // Сортируем пути по возрастанию длины
}

// Функция для обновления списка всех путей
function updatePathList() {
    const pathList = document.getElementById('pathList');
    pathList.innerHTML = ''; // Очищаем предыдущий список

    allPaths.forEach((path, index) => {
        const length = path.length; // Длина текущего пути
        const button = document.createElement('button');
        button.textContent = `Path ${index + 1}: Length: ${length}`;
        button.onclick = () => {
            selectedPathIndex = index;
            draw();
        };
        pathList.appendChild(button);
    });
}

function updatePathsOnDynamicChange() {
    // Обновляем пути первого игрока
    allPaths = findAllPaths(maze, player, exit);
    sortPaths(); // Сортируем пути первого игрока

    // Обновляем пути второго игрока
    allPaths2 = findAllPaths(maze, player2, exit);
    sortPathsPlayer2(); // Сортируем пути второго игрока

    updatePathList(); // Если нужно, обновляем общий список путей
    updatePathListPlayer2();
    draw(); // Перерисовываем лабиринт
}



// Функция для отрисовки лабиринта
function drawMaze() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            ctx.fillStyle = maze[row][col] === 1 ? 'black' : 'white'; // Устанавливаем цвет ячейки
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize); // Рисуем ячейку
            ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize); // Рисуем контур ячейки
        }
    }
}

// Функция для отрисовки игрока
function drawPlayer() {
    ctx.fillStyle = 'blue'; // Устанавливаем цвет игрока
    ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize); // Рисуем игрока
    ctx.strokeRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize); // Рисуем контур игрока
}

// Функция для отрисовки выхода
function drawExit() {
    ctx.fillStyle = 'green'; // Устанавливаем цвет выхода
    ctx.fillRect(exit.x * cellSize, exit.y * cellSize, cellSize, cellSize); // Рисуем выход
    ctx.strokeRect(exit.x * cellSize, exit.y * cellSize, cellSize, cellSize); // Рисуем контур выхода
}

// Функция для отрисовки выделенного пути
function drawSelectedPath() {
    if (selectedPathIndex !== -1 && allPaths[selectedPathIndex]) {
        const selectedPath = allPaths[selectedPathIndex]; // Получаем выделенный путь
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Устанавливаем цвет выделенного пути
        selectedPath.forEach(({ x, y }) => {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize); // Рисуем выделенный путь
        });
    }
}

// Основная функция отрисовки
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    drawPlayer();
    drawPlayer2();
    drawExit();
    drawSelectedPath();
    drawSelectedPathPlayer2(); // Отрисовка выбранного пути для второго игрока
}

// Функция для отрисовки второго игрока
function drawPlayer2() {
    ctx.fillStyle = 'red'; // Цвет второго игрока
    ctx.fillRect(player2.x * cellSize, player2.y * cellSize, cellSize, cellSize);
    ctx.strokeRect(player2.x * cellSize, player2.y * cellSize, cellSize, cellSize);
}

// Функция для отрисовки выбранного пути второго игрока
function drawSelectedPathPlayer2() {
    if (selectedPathIndexPlayer2 !== -1 && allPathsPlayer2[selectedPathIndexPlayer2]) {
        const selectedPath = allPathsPlayer2[selectedPathIndexPlayer2];
        ctx.fillStyle = 'rgba(255, 165, 0, 0.5)'; // Цвет пути второго игрока
        selectedPath.forEach(({ x, y }) => {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
    }
}


// Функция для перемещения игрока
function movePlayer(dx, dy) {
    const newX = player.x + dx; // Новая позиция по X
    const newY = player.y + dy; // Новая позиция по Y

    // Проверяем, является ли новая позиция допустимой
    if (
        newX >= 0 && newX < cols && // Проверка по X
        newY >= 0 && newY < rows && // Проверка по Y
        maze[newY][newX] === 0 // Проверка, что ячейка не стена
    ) {
        player.x = newX; // Обновляем позицию игрока по X
        player.y = newY; // Обновляем позицию игрока по Y
        checkGameEnd(); // Проверяем, достиг ли игрок выхода
        // Динамическое обновление путей, если включено
        if (isDynamicPathUpdate) {
            showAllPossiblePaths(); // Показываем все возможные пути
        }
    }

    draw(); // Перерисовываем лабиринт
}

// Перемещение второго игрока
function movePlayer2(dx, dy) {
    const newX = player2.x + dx;
    const newY = player2.y + dy;

    console.log(`Attempting to move player2 to (${newX}, ${newY})`);
    if (
        newX >= 0 && newX < cols &&
        newY >= 0 && newY < rows &&
        maze[newY][newX] === 0
    ) {
        player2.x = newX;
        player2.y = newY;
        checkGameEnd();
        if (isDynamicPathUpdate) {
            updatePathsPlayer2();
        }
        console.log(`Player2 moved to (${player2.x}, ${player2.y})`);
    } else {
        console.log("Player2 cannot move to that position.");
    }
    draw();
}

function initializePlayer2() {
    do {
        player2 = findRandomFreeCell();
    } while (maze[player2.y][player2.x] !== 0); // Убедитесь, что начальная ячейка свободна
}

// Создаем динамическое препятствие и обновляем пути
function dynamicObstacle() {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (
        (x === player.x && y === player.y) || // Не блокируйте игрока 1
        (x === player2.x && y === player2.y) // Не блокируйте игрока 2
    ) return;
    maze[y][x] = maze[y][x] === 0 ? 1 : 0; // Меняем состояние ячейки

    // Обновляем пути для обоих игроков
    allPaths = findAllPaths(maze, player, exit);
    allPathsPlayer2 = findAllPaths(maze, player2, exit);

    updatePathsOnDynamicChange();
    draw();
}

// Устанавливаем интервал для динамических препятствий
setInterval(dynamicObstacle, 2000); 

// Обработчик событий нажатия клавиш
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            movePlayer(0, -1); // Игрок 1
            break;
        case 'ArrowDown':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
            movePlayer(1, 0);
            break;
        case 'w':
            movePlayer2(0, -1); // Игрок 2
            break;
        case 's':
            movePlayer2(0, 1);
            break;
        case 'a':
            movePlayer2(-1, 0);
            break;
        case 'd':
            movePlayer2(1, 0);
            break;
    }
});


// Функция для перезапуска игры
function restartGame() {
    stopTimer(); // Остановка таймера
    timeElapsed = 0; // Сброс времени
    document.getElementById("timerDisplay").textContent = `Time: ${timeElapsed} s`; // Обновление отображения времени

    // Сброс состояния игры
    allPaths = []; // Очищаем пути
    allPaths2 = [];
    selectedPathIndex = -1; // Сбрасываем индекс выбранного пути
    selectedPathIndexPlayer2 = -1;
    isPathVisible = false; // Скрываем пути
    showModal(); // Отображаем модальное окно
    updatePathList(); // Обновляем список путей
    updatePathListPlayer2();
    showAllPossiblePaths(); // Показываем возможные пути
    updatePathsPlayer2();
}

// Изменяем начальные размеры лабиринта при выборе
startButton.addEventListener('click', () => {
    const selectedSize = parseInt(sizeSelect.value, 10); // Получаем выбранный размер
    rows = selectedSize;
    cols = selectedSize;
    canvas.width = selectedSize * cellSize; // Изменяем ширину canvas
    canvas.height = selectedSize * cellSize; // Изменяем высоту canvas
    modal.style.display = 'none'; // Скрываем модальное окно
    initializeMaze(); // Инициализируем лабиринт
    startTimer(); // Запускаем таймер
    draw(); // Отрисовываем лабиринт
});

// Остановка таймера
function stopTimer() {
    clearInterval(timerInterval); // Очищаем интервал таймера
}

// Функция для показа модального окна победы
function showVictoryModal(winner, time) {
    winnerMessage.textContent = `Поздравляем! Игрок ${winner} победил!`;
    timeElapsedMessage.textContent = `Время: ${time} секунд`;
    victoryModal.style.display = 'flex';
}

// Обработчик клика на кнопку перезапуска
document.getElementById('restartButton').addEventListener('click', () => {
    victoryModal.style.display = 'none';
    restartGame();
});
document.getElementById('restartButtonIsGame').addEventListener('click', () => {
    restartGame();
});
// Обработчик клика на кнопку для показа путей
document.getElementById('showPathsButton').addEventListener('click', showAllPossiblePaths);
// Обработчик клика на кнопку для очистки путей
document.getElementById('clearPathsButton').addEventListener('click', () => {
    allPaths = [];
    allPaths2 = []; // Очищаем пути
    isPathVisible = false; // Скрываем пути
    selectedPathIndex = -1;
    selectedPathIndexPlayer2 = -1; // Сбрасываем индекс выбранного пути
    updatePathList(); // Обновляем список путей
    updatePathListPlayer2();
    draw(); // Перерисовываем лабиринт
});

// Показать модальное окно при загрузке
showModal(); // Вызываем функцию отображения модального окна
