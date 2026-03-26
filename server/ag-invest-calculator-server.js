/**
 * Инвестиционный калькулятор - серверная версия
 * Расчёты выполняются на стороне сервера через AJAX
 */

const AG_CALC_CONFIG = {
    apiUrl: 'calculate.php',  // Эндпоинт для расчётов
    
    minYears: 10,   // Мин.срок инвестирования (лет)
    maxYears: 40,   // Макс.срок инвестирования (лет)

    // Значения по умолчанию
    defaults: {
        income: 0,
        hours: 0,
        invest: 0,
        years: 10
    }
};

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

    let debounceTimer = null;

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
        
        // Debounce для AJAX запроса
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(calculate, 300);
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

    function calculate() {
        const income = parseInt(sanitizeInput(inputs.income.value)) || 0;
        const hours = parseInt(sanitizeInput(inputs.hours.value)) || 1;
        const invest = parseInt(sanitizeInput(inputs.invest.value)) || 0;
        const yearsValue = parseInt(sanitizeInput(inputs.years.value)) || 0;

        // AJAX запрос к серверу
        fetch(AG_CALC_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                income: income,
                hours: hours,
                invest: invest,
                years: yearsValue
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                outputs.totalCapital.textContent = result.data.totalCapital;
                outputs.totalInvested.textContent = result.data.totalInvested;
                outputs.profitBeforeTax.textContent = result.data.profitBeforeTax;
                outputs.profitAfterTax.textContent = result.data.profitAfterTax;
                outputs.hourlyWork.textContent = result.data.hourlyWork;
                outputs.hourlyInvest.textContent = result.data.hourlyInvest;
                
                if (result.data.ratio) {
                    outputs.ratio.textContent = result.data.ratio;
                    outputs.ratio.style.display = 'block';
                } else {
                    outputs.ratio.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Ошибка расчёта:', error);
        });
    }

    Object.values(inputs).forEach(input => {
        const key = input.id.replace('ag-input-', '');
        if (AG_CALC_CONFIG.defaults[key] !== undefined) {
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
