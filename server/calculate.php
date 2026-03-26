<?php
/**
 * Калькулятор инвестиций - серверная часть
 * Расчёты выполняются на стороне сервера
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Обработка только POST-запросов
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

// Получение данных из запроса
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Неверный формат данных']);
    exit;
}

// Конфигурация калькулятора
$config = [
    'annualRate' => 10,      // 10% годовых
    'taxRate' => 22,         // Налог 22%
    'minYears' => 10,        // Мин. срок (лет)
    'maxYears' => 40,        // Макс. срок (лет)
    
    // Коэффициенты для расчёта (из Excel)
    'coefficients' => [
        10 => 206.6,    11 => 240.8,    12 => 278.7,    13 => 320.6,
        14 => 356.8,    15 => 417.9,    16 => 474.4,    17 => 536.8,
        18 => 605.7,    19 => 681.7,    20 => 765.7,    21 => 858.4,
        22 => 961.5,    23 => 1074.1,   24 => 1199,     25 => 1338.7,
        26 => 1490.3,   27 => 1658.4,   28 => 1845,     29 => 2053.4,
        30 => 2277.9,   31 => 2531.6,   32 => 2809,     33 => 3115.3,
        34 => 3448.3,   35 => 3831.4,   36 => 4237.3,   37 => 4694.8,
        38 => 5208.3,   39 => 5747.1,   40 => 6369.4
    ]
];

// Получение и санитизация входных данных
$income = isset($input['income']) ? max(0, intval($input['income'])) : 0;
$hours = isset($input['hours']) ? max(1, intval($input['hours'])) : 1;
$invest = isset($input['invest']) ? max(0, intval($input['invest'])) : 0;
$yearsValue = isset($input['years']) ? max(0, intval($input['years'])) : 0;

// Ограничение по годам
$yearsValue = min($yearsValue, $config['maxYears']);

// Получение коэффициента
$coefficient = isset($config['coefficients'][$yearsValue]) ? $config['coefficients'][$yearsValue] : 0;

// Расчёты
$totalCapital = $invest * $coefficient;
$totalInvested = $invest * 12 * $yearsValue;
$profitBeforeTax = $totalCapital - $totalInvested;
$profitAfterTax = max(0, $profitBeforeTax * (1 - $config['taxRate'] / 100));

// Расчёт дохода в час
$hourlyWork = $hours > 0 ? ($income / $hours) : 0;
$hourlyInvest = $yearsValue > 0 ? ($profitAfterTax / $yearsValue) : 0;

// Форматирование чисел
function formatNumber($val) {
    return number_format($val, 0, '.', ' ');
}

function formatCurrency($val) {
    return number_format($val, 0, '.', ' ') . ' ₽';
}

// Подготовка ответа
$response = [
    'success' => true,
    'data' => [
        'totalCapital' => formatCurrency($totalCapital),
        'totalInvested' => formatCurrency($totalInvested),
        'profitBeforeTax' => formatCurrency($profitBeforeTax),
        'profitAfterTax' => formatCurrency($profitAfterTax),
        'hourlyWork' => formatNumber(round($hourlyWork)) . ' ₽',
        'hourlyInvest' => formatNumber(round($hourlyInvest)) . ' ₽',
        'ratio' => null
    ]
];

// Расчёт коэффициента соотношения
if ($hourlyWork > 0 && $hourlyInvest > 0) {
    $ratioValue = $hourlyInvest / $hourlyWork;
    $response['data']['ratio'] = 'Больше в ' . round($ratioValue) . ' раз(а)';
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
