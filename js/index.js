(function init(){

const CBRF_COURSEAPI_URL = "https://www.cbr-xml-daily.ru/daily_json.js";
let newRates = {}; //Объект со всем курсами
const rootId = "currencyCalc";
let currencyCount = "1";
let defaultCurrencyCode = "RUB";
let defaultСalculatedCurrency = "USD";

checkStorage();

function checkStorage() {
    //перед отправкой запроса проверить что в сторадже уже не лежит сегодняший курс
    if (localStorage.getItem('lastGettedRatesDate') == new Date().getDate()) {
        // если в localStorage актуальные данные достаем курс локально
        console.log('достаем курсы валют локально');
        getFromLocal();
        initView();
    } else if (localStorage.getItem('lastGettedRatesDate') != new Date().getDate() ||
        localStorage.getItem('lastGettedRatesDate') === null) {
        //если localStorage пустой или просрочен обновляем курсы валют по сети
        sendXMLHttpRequest(CBRF_COURSEAPI_URL);
        console.log('обновляем курсы валют по сети');
    };
};    

function sendXMLHttpRequest(url) {
    console.log("отправляем запрос на " + url);
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        // console.log("this.readyState " + this.readyState)
        // console.log("this.status " + this.status)
        if (this.readyState == 4 && this.status == 0) {
            console.error('Ошибка CORS. Статус: ' + this.status);
        } else if (this.readyState == 4 && this.status == 200) {
            saveToLocal(xhr.responseText);
            initView();
        }
    };
    xhr.send();
}

function saveToLocal(response) {
    localStorage.removeItem('lastGettedRatesDate');
    localStorage.removeItem('lastGettedRates');
    localStorage.setItem("lastGettedRates", response);
    localStorage.setItem("lastGettedRatesDate", new Date().getDate());
    newRates = JSON.parse(response);
}

function getFromLocal() {
    newRates = JSON.parse(localStorage.getItem("lastGettedRates"));
}

function initView() {
    let targetEl = document.getElementById(rootId);
    if (!targetEl) {
        console.error("элемент с id currencyCalc не найден");
        return
    } else {
        generateCalcView(targetEl);
    }
}

//перед рисованием убедится что курсы валют уже прогрузились!!!!
function generateCalcView() {
    // console.log(newRates.Valute.USD.Value * 50);   
    let rootEl = document.getElementById(rootId);

    for (let i = 1; i <= currencyCount; i++) {
        let divEl = document.createElement('div');
        divEl.classList.add('row');
        divEl.classList.add('currencyRow');
        addNewCurrency(divEl);
        rootEl.appendChild(divEl);
    }
    let lastdivEl = document.createElement('div');
    lastdivEl.classList.add('row');
    lastdivEl.classList.add('currencyRow');
    addFinalCurrency(lastdivEl);
    rootEl.appendChild(lastdivEl);
}

function addNewCurrency(containerEl) {
    let inputEl = document.createElement('input');
    inputEl.setAttribute('type', 'number');
    inputEl.dataset.curCode = defaultСalculatedCurrency;
    inputEl.value = "0";
    inputEl.addEventListener('input', recalculateInputValues);
    let leftdivEl = document.createElement('div');
    leftdivEl.classList.add('col-2');
    leftdivEl.appendChild(inputEl);
    containerEl.appendChild(leftdivEl);
    let rightdivEl = document.createElement('div');
    rightdivEl.classList.add('col-6');
    containerEl.appendChild(rightdivEl);
    rightdivEl.appendChild(generateCurrencySelect(defaultСalculatedCurrency));
}

function addFinalCurrency(containerEl) {
    //последняя валюта в списке
    let inputEl = document.createElement('input');
    inputEl.setAttribute('type', 'number');
    inputEl.setAttribute('id', 'finalCurrency');
    inputEl.dataset.curCode = defaultCurrencyCode;
    inputEl.value = "0";
    inputEl.addEventListener('input', recalculateInputValues);
    let leftdivEl = document.createElement('div');
    leftdivEl.classList.add('col-2');
    leftdivEl.appendChild(inputEl);
    containerEl.appendChild(leftdivEl);
    let rightdivEl = document.createElement('div');
    rightdivEl.classList.add('col-6');
    containerEl.appendChild(rightdivEl);
    let labelEl = document.createElement('span');
    labelEl.innerText = "Российский рубль";
    rightdivEl.appendChild(labelEl);
}

function generateCurrencySelect(selectedValue) {
    // debugger;
    let selectEl = document.createElement('select');
    for (let key in newRates.Valute) {
        let optionEl = new Option(newRates.Valute[key].Name, newRates.Valute[key].CharCode);
        selectEl.add(optionEl);
        if (newRates.Valute[key].CharCode == selectedValue) optionEl.selected = true;
    }
    selectEl.addEventListener('input', chaingeInputCurrency);
    return selectEl;
}

function chaingeInputCurrency() {
    event.target.nextElementSibling.dataset.curCode = event.target.value;
    recalculateAllCurrency();
}

function recalculateInputValues() {
    console.log('пересчитывам все поля отностельно ' + event.target.dataset.curCode);

    let chaingedCurrencyEl = event.target;  //инпут который изменили
    let chaingedCurrencyValue = parseFloat(chaingedCurrencyEl.value); //значение инпута который изменили
    let chaingedCurrencyCode = chaingedCurrencyEl.dataset.curCode; //валюта инпута который изменили

    if (chaingedCurrencyValue == 0 || isNaN(chaingedCurrencyValue)) {
        console.log('значение равно 0');
        return;
    }

    //так как у нас курсы валют относительно рубля, отдельно считаем изменение рубля и остальных валют
    if (chaingedCurrencyCode == defaultCurrencyCode) {
        //пройдемся по всем валютам пересчитаем значение в них опираясь на значение в рублёвом инпуте
        console.log('изменили значение рубля');
        recalculateAllCurrency();
    } else {
        //если изменили валюту надо изменить рублевый инпут
        console.log('изменили значение валюты');
        //в рублевый инпут присвоить числов в валюте * курс этой валюты
        let courseOfChaingedCurrency = newRates.Valute[event.target.dataset.curCode].Value;
        document.getElementById('finalCurrency').value = chaingedCurrencyValue * courseOfChaingedCurrency;
        //после того как изменили рублевый инпут надо пересчитать значение в остальных полях если валют больше чем одна
        recalculateAllCurrency();
    }
}

function recalculateAllCurrency() {
    console.log('пересчитаем все инпуты');
    let allCurrencyInputs = document.querySelectorAll("[data-cur-code]"); //коллекция всех инпутов
    let defaultCurrencyValue = document.getElementById('finalCurrency').value; //значение рублевого инпута

    for (let i = 0; i < allCurrencyInputs.length; i++) {
        //пропускаем рублевый инпут, так как на основе него будем вычислять остальные
        if (allCurrencyInputs[i].dataset.curCode == defaultCurrencyCode) break;
        //ищем курс валют от i-го инпута
        let courseOfСurrentInput = newRates.Valute[allCurrencyInputs[i].dataset.curCode].Value;
        allCurrencyInputs[i].value = defaultCurrencyValue / courseOfСurrentInput;
    };
};

}());







