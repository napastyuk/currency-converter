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
let newRates = "";
const rootId = "currencyCalc";
let currencyCount = "2";

function init() {
    let targetEl = document.getElementById(rootId);
    if (!targetEl) {
        console.error("элемент с id currencyCalc не найден");
        return
    } else
        generateCalcView(targetEl);
}

function generateCalcView() {    
    let rootEl = document.getElementById(rootId);
    let formEl = document.createElement('form');
    for (let i = 1; i <= currencyCount; i++) {
        let labelEl = document.createElement('label');
        labelEl.setAttribute('for',"currency-"+i);
        labelEl.innerText = "currency-" + i;
        formEl.appendChild(labelEl);
        let inputEl = document.createElement('input');
        inputEl.setAttribute('type', "text");
        formEl.appendChild(inputEl);
        insertBRElement(formEl);
    }
    rootEl.appendChild(formEl);
    checkStorage();
}

function insertBRElement(containerEl) {
    let brEl = document.createElement('br');
    containerEl.appendChild(brEl);
}

function checkStorage() {
    //перед отправкой проверить что в сторадже уже не лежит сегодняший курс
    if (localStorage.getItem('lastGettedRatesDate') == new Date().getDate()) {
        // если в localStorage актуальные данные достаем курс локально
        console.log('достаем курс локально');
        getFromLocal();
    } else if (localStorage.getItem('lastGettedRatesDate') != new Date().getDate() ||
        localStorage.getItem('lastGettedRatesDate') === null) {
        //если localStorage пустой или просрочен обновляем курсы валют по сети
        sendXMLHttpRequest(CBRF_COURSEAPI_URL);
        console.log('обновляем курсы валют по сети');
    };
    console.log(newRates.Valute.USD.Value * 50);
}

function sendXMLHttpRequest(url) {
    var xhr = new XMLHttpRequest();
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



