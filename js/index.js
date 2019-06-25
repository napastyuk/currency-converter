//1. сделать запрос на https://www.cbr-xml-daily.ru/daily.xml и получить xml
    //c https://www.cbr.ru/scripts/XML_daily.asp данные получить сложнее по нескольким причинам
    //1- у них не настроена CORS, поэтому запросы из браузера блочатся самим браузером,
    //2- документ у них отдается в кодировке windows-1251 , что тянет за собой библиотеку для перекодировки
    //3- формат отдаваемого документа xml, что в приципе решаемо, но на cbr-xml-daily есть возможность переключить на json
//2. преобразовать данные из xml в js объект
//3. cохранить его в servise worker
//4. вывести ofline калькулятор валют

const CBRF_COURSEAPI_URL = "https://www.cbr-xml-daily.ru/daily_json.js";
let newRates = "";

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


function checkStorage() {
    //перед отправкой проверить что в сторадже уже не лежит сегодняший курс
    if (localStorage.getItem('lastGettedRatesDate') == new Date().getDate()) {
        getFromLocal();
    } else if (localStorage.getItem('lastGettedRatesDate') != new Date().getDate() &&
        localStorage.getItem('lastGettedRatesDate') === null) {
        //если localStorage пустой или просрочен
        sendXMLHttpRequest(CBRF_COURSEAPI_URL);
    };
}

checkStorage();

console.log(newRates.Valute.USD.Value * 50);
debugger;