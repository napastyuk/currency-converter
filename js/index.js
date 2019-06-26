//1. сделать запрос на https://www.cbr-xml-daily.ru/daily.xml и получить xml
//c https://www.cbr.ru/scripts/XML_daily.asp данные получить сложнее по нескольким причинам
//1- у них не настроена CORS, поэтому запросы из браузера блочатся самим браузером,
//2- документ у них отдается в кодировке windows-1251 , что тянет за собой библиотеку для перекодировки
//3- формат отдаваемого документа xml, что в приципе решаемо, но на cbr-xml-daily есть возможность переключить на json
//2. преобразовать данные из xml в js объект
//3. cохранить его в servise worker
//4. вывести ofline калькулятор валют

// if (navigator.serviceWorker) {
//     navigator.serviceWorker.register('/serviceworker.js');
// }

const CBRF_COURSEAPI_URL = "https://www.cbr-xml-daily.ru/daily_json.js";
let newRates = {}; //Объект со всем курсами
const rootId = "currencyCalc";
let currencyCount = "2";
let defaultCurrencyCode = "RUB";
let defaultСalculatedCurrency = "USD";

function init() {
    let targetEl = document.getElementById(rootId);
    if (!targetEl) {
        console.error("элемент с id currencyCalc не найден");
        return
    } else
        checkStorage()
    generateCalcView(targetEl);
}

function generateCalcView() {
    // console.log(newRates.Valute.USD.Value * 50);   
    let rootEl = document.getElementById(rootId);
    let formEl = document.createElement('form');
    for (let i = 1; i <= currencyCount; i++) {
        addNewCurrency(formEl);
    }
    addFinalCurrency(formEl);
    rootEl.appendChild(formEl);
}

function addNewCurrency(containerEl) {
    containerEl.appendChild(generateCurrencySelect(defaultСalculatedCurrency));
    let inputEl = document.createElement('input');
    inputEl.setAttribute('type', 'number');
    inputEl.dataset.curCode = defaultСalculatedCurrency;
    inputEl.value = "0";
    inputEl.addEventListener('input', recalculateInputValues);
    containerEl.appendChild(inputEl);
    let brEl = document.createElement('br');
    containerEl.appendChild(brEl);
}

function addFinalCurrency(containerEl) {
    //последняя валюта в списке
    let labelEl = document.createElement('span');
    labelEl.innerText = "Российский рубль";
    containerEl.appendChild(labelEl);
    let inputEl = document.createElement('input');
    inputEl.setAttribute('type', 'number');
    inputEl.setAttribute('id', 'finalCurrency');
    inputEl.dataset.curCode = defaultCurrencyCode;
    inputEl.value = "0";
    inputEl.addEventListener('input', recalculateInputValues);
    containerEl.appendChild(inputEl);
}

function generateCurrencySelect(selectedValue) {
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
    }
}

function checkStorage() {
    //перед отправкой проверить что в сторадже уже не лежит сегодняший курс
    if (localStorage.getItem('lastGettedRatesDate') == new Date().getDate()) {
        // если в localStorage актуальные данные достаем курс локально
        console.log('достаем курсы валют локально');
        getFromLocal();
    } else if (localStorage.getItem('lastGettedRatesDate') != new Date().getDate() ||
        localStorage.getItem('lastGettedRatesDate') === null) {
        //если localStorage пустой или просрочен обновляем курсы валют по сети
        sendXMLHttpRequest(CBRF_COURSEAPI_URL);
        console.log('обновляем курсы валют по сети');
    };
}

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

init();



