/**
 * Настройки калькулятора
 */
const AG_CALC_CONFIG = {
    annualRate: 10, // 10% годовых
    taxRate: 22,    // Налог 22%

    minYears: 10,   // Мин.срок инвестирования (лет)
    maxYears: 40,   // Макс.срок инвестирования (лет)

    // Коэффициенты для расчёта (из Excel)
    // Ключ — количество лет, значение — коэффициент для умножения на ежемесячный взнос
    coefficients: {
        10: 206.6,   // 10 лет
        11: 240.8,   // 11 лет
        12: 278.7,   // 12 лет
        13: 320.6,   // 13 лет
        14: 356.8,   // 14 лет
        15: 417.9,   // 15 лет
        16: 474.4,   // 16 лет
        17: 536.8,   // 17 лет
        18: 605.7,   // 18 лет
        19: 681.7,   // 19 лет
        20: 765.7,   // 20 лет
        21: 858.4,   // 21 год
        22: 961.5,   // 22 года
        23: 1074.1,  // 23 года
        24: 1199,    // 24 года
        25: 1338.7,  // 25 лет
        26: 1490.3,  // 26 лет
        27: 1658.4,  // 27 лет
        28: 1845,    // 28 лет
        29: 2053.4,  // 29 лет
        30: 2277.9,  // 30 лет
        31: 2531.6,  // 31 год
        32: 2809,    // 32 года
        33: 3115.3,  // 33 года
        34: 3448.3,  // 34 года
        35: 3831.4,  // 35 лет
        36: 4237.3,  // 36 лет
        37: 4694.8,  // 37 лет
        38: 5208.3,  // 38 лет
        39: 5747.1,  // 39 лет
        40: 6369.4   // 40 лет
    },

    // Значения по умолчанию
    defaults: {
        income: 0,  // Среднемесячный доход (₽)
        hours: 0,      // Рабочих часов в месяц
        invest: 0,   // Ежемесячный взнос (₽)
        years: 10        // Срок инвестирования (лет)
    },

    // Разрешённые домены (должны содержать оба слова)
    allowedDomains: ['andrey', 'gonchar'],

    // Включение/выключение защиты домена (true = защита включена)
    enableDomainProtection: true
};

// Проверка домена
(function() {
    if (!AG_CALC_CONFIG.enableDomainProtection) {
        AG_CALC_CONFIG.isAuthorized = true;
        return;
    }

    var hostname = window.location.hostname.toLowerCase();
    var allowed = AG_CALC_CONFIG.allowedDomains || [];
    AG_CALC_CONFIG.isAuthorized = allowed.length > 0 && allowed.every(function(domain) {
        return hostname.indexOf(domain.toLowerCase()) !== -1;
    });

    if (!AG_CALC_CONFIG.isAuthorized) {
        var container = document.querySelector('.ag-calc-container');
        if (container) {
            container.remove();
        }
    }
})();

if (AG_CALC_CONFIG.isAuthorized) {
document.addEventListener('DOMContentLoaded', function() {
    const inputs = {
        income: document.getElementById('ag-input-income'),
        hours: document.getElementById('ag-input-hours'),
        invest: document.getElementById('ag-input-invest'),
        years: document.getElementById('ag-input-years')
    };

    const outputs = {
        totalCapital: document.getElementById('ag-res-total-capital'),
        totalInvested: document.getElementById('ag-res-total-invested'),
        profitBeforeTax: document.getElementById('ag-res-profit-before-tax'),
        profitAfterTax: document.getElementById('ag-res-profit-after-tax'),
        hourlyWork: document.getElementById('ag-res-hourly-work'),
        hourlyInvest: document.getElementById('ag-res-hourly-invest'),
        ratio: document.getElementById('ag-res-ratio')
    };

    function formatNumber(val) {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    function sanitizeInput(val) {
        let sanitized = val.replace(/\D/g, '');
        // Удаляем ведущие нули, но оставляем один ноль если число равно 0
        sanitized = sanitized.replace(/^0+(\d)/, '$1');
        return sanitized;
    }

    function handleInput(e) {
        let input = e.target;
        let originalValue = sanitizeInput(input.value);

        if (input.id === 'ag-input-years') {
            let numYears = parseInt(originalValue);

            if (numYears > AG_CALC_CONFIG.maxYears) {
                originalValue = AG_CALC_CONFIG.maxYears.toString();
            }
            
            // Показываем/скрываем уведомление
            const hint = document.getElementById('ag-input-years-hint');
            if (hint) {
                if (originalValue !== '' && numYears < AG_CALC_CONFIG.minYears) {
                    hint.classList.add('is-visible');
                } else {
                    hint.classList.remove('is-visible');
                }
            }
        }

        input.value = formatNumber(originalValue);
        calculate();
    }

    function handleBlur(e) {
        let input = e.target;

        if (input.id === 'ag-input-years') {
            let originalValue = sanitizeInput(input.value);
            let numYears = parseInt(originalValue);

            if (originalValue !== '' && numYears < AG_CALC_CONFIG.minYears) {
                originalValue = AG_CALC_CONFIG.minYears.toString();
                input.value = formatNumber(originalValue);
                calculate();
            }
            
            // Скрываем уведомление
            const hint = document.getElementById('ag-input-years-hint');
            if (hint) {
                hint.classList.remove('is-visible');
            }
        }
    }

    function preventInvalidInput(e) {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    }

    const formatCurrencyOutput = (val) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(val);
    };

    function calculate() {
        const income = parseInt(sanitizeInput(inputs.income.value)) || 0;
        const hours = parseInt(sanitizeInput(inputs.hours.value)) || 1;
        const invest = parseInt(sanitizeInput(inputs.invest.value)) || 0;
        const yearsValue = parseInt(sanitizeInput(inputs.years.value)) || 0;

        const coefficient = AG_CALC_CONFIG.coefficients[yearsValue] || 0;
        const totalCapital = invest * coefficient;

        const totalInvested = invest * 12 * yearsValue;
        const profitBeforeTax = totalCapital - totalInvested;
        const profitAfterTax = Math.max(0, profitBeforeTax * (1 - AG_CALC_CONFIG.taxRate / 100));

        outputs.totalCapital.textContent = formatCurrencyOutput(totalCapital);
        outputs.totalInvested.textContent = formatCurrencyOutput(totalInvested);
        outputs.profitBeforeTax.textContent = formatCurrencyOutput(profitBeforeTax);
        outputs.profitAfterTax.textContent = formatCurrencyOutput(profitAfterTax);

        const hourlyWork = hours > 0 ? (income / hours) : 0;
        const hourlyInvest = yearsValue > 0 ? (profitAfterTax / yearsValue) : 0;

        outputs.hourlyWork.textContent = Math.round(hourlyWork).toLocaleString('ru-RU') + " ₽";
        outputs.hourlyInvest.textContent = Math.round(hourlyInvest).toLocaleString('ru-RU') + " ₽";

        if (hourlyWork > 0 && hourlyInvest > 0) {
            const ratioValue = hourlyInvest / hourlyWork;
            const ratio = Math.round(ratioValue);
            outputs.ratio.textContent = `Больше в ${ratio} раз(а)`;
            outputs.ratio.style.display = 'block';
        } else {
            outputs.ratio.style.display = 'none';
        }
    }

    Object.values(inputs).forEach(input => {
        const key = input.id.replace('ag-input-', '');
        if (AG_CALC_CONFIG.defaults[key]) {
            input.value = formatNumber(AG_CALC_CONFIG.defaults[key]);
        }
        input.addEventListener('input', handleInput);
        input.addEventListener('keypress', preventInvalidInput);

        if (input.id === 'ag-input-years') {
            input.addEventListener('blur', handleBlur);
        }
    });

    // Инициализация уведомления для поля "лет"
    const yearsHint = document.getElementById('ag-input-years-hint');
    if (yearsHint) {
        const yearsValue = parseInt(sanitizeInput(inputs.years.value)) || 0;
        if (yearsValue < AG_CALC_CONFIG.minYears) {
            yearsHint.classList.add('is-visible');
        }
    }

    calculate();
});
}
