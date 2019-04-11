document.addEventListener("DOMContentLoaded", funOrder) //Вызываем функцию funOrder после прогрузки DOM

let nPost = {};

function funOrder() {
    getCities(); //Вызываем функцию получения городов НП
    getShops(); // Вызываем функцию получения и заполнения магазинов
    const form = document.querySelector('.order__form');
    const inputs = {
        tel      : document.querySelector('input[name="order-tel"]'),
        quantity : document.querySelectorAll('.purchases__item-quantity-input')
    };
    const telOptions = {
        mask: '+{38}(000)00-000-00'
    };
    const quantOptions = {
        mask: Number,
        min: 1,
        max: 1000
    };

    new IMask(inputs.tel, telOptions); //Маска телефона

    inputs.quantity.forEach(inp => new IMask(inp, quantOptions));

    form.addEventListener('submit', e => sendOrderForm(e));
}


function getCities() {
    fetch(`http://cors-anywhere.herokuapp.com/https://diadema.ua/newPost/np/get_cities.php`, {
        method: "GET"
    })
    .then(res => res.json())
    .then(obj => nPost = obj) // записываем полученные даные городов в глобальный обьект nPost
    .then(getAutocomplete()) // запускаем функцию, где инициализируем autocomplete для городов
    .catch(err => console.error('Error:', err));
}


function getShops() {
    const shopObj = {
        "Винница" : [
            {
                "adress": "ул. Соборная,76",
                "time"  : ['Пн-Пт 10:00-19:00', 'Cб 10:00-18:00', 'Нд 10:00-16:00']
            },
            {
                "adress": "пр-т Коцюбинского, 30",
                "time"  : ['Пн-Вс 8:30-18:00']
            },
            {
                "adress": "пр-т Юности, 43а (ТСК 'Магигранд')",
                "time"  : ['Пн-Вс 10:00-21:00']
            },
            {
                "adress": "ул. Зодчих, 2 (ТЦ 'Подолье City')",
                "time"  : ['Пн-Вс 10:00-21:00']
            },
            {
                "adress": "пр-т Коцюбинского, 34, (ТЦ 'Жовтень')",
                "time"  : ['Пн 10:00-18:00', 'Вт-Вс 09:00-19:00']
            },
            {
                "adress": "ул. 600-летия, 17, (ТРЦ 'Мегамолл')",
                "time"  : ['Пн-Вс 10:00-21:00']
            }
        ],
        "Житомир" : [
            {
                "adress": "ул. Киевская, 50",
                "time"  : ['Пн-Cб 09:00-19:00', 'Вс 09:00-17:00']
            }
        ],
        "Киев" : [
            {
                "adress": "пр-т Победы, 26",
                "time"  : ['Пн-Вс 10:00-21:00']
            }
        ],
        "Немиров" : [
            {
                "adress": "ул. Горького, 92 а",
                "time"  : ['Пн-Вс 09:00-18:00']
            }
        ]
    };

    const ul  = document.querySelector('[data-autocomplete="shops-list"]');
    const inp = document.querySelector('[data-autocomplete="shops-input"]');
    for (let k in shopObj) {
        shopObj[k].forEach(el => {
            let li = document.createElement('li');
                li.dataset.city = k;
                li.dataset.time = el.time;
                li.textContent  = `${k}, ${el.adress}`;
                ul.parentElement.style.display = 'block';
                ul.appendChild(li);
                li.addEventListener('click', e => {
                    e.preventDefault();
                    inp.value = li.textContent;
                    inp.dataset.opened = false;
                    shopTime(inp, li.dataset.time);
                });
        });
    };
    inp.value = ul.firstElementChild.textContent//default adress first
    shopTime(inp, ul.firstElementChild.dataset.time); //default time first

    inp.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        inp.dataset.opened = true;
    });
    document.addEventListener('click', e => {
        if (inp.dataset.opened == 'true' && e.target !== inp) inp.dataset.opened = false;
    });
};


function shopTime(inp, dtime) {
    const time = document.querySelector('.order__hint-worktime');
    const split = dtime.split(','); // разбиваем время в массив

    time.innerHTML = '';
    split.forEach(p => {
        let el = document.createElement('p');
            el.textContent = p;
            time.appendChild(el);
    });
};



function getAutocomplete() {
    const radioNP = document.getElementById('o-department');
    document.querySelectorAll('input[data-autocomplete="city"]').forEach(city => {
        new autoComplete({
            selector: city,
            minChars: 2,
            delay: 500,
            offsetTop: -1,
            source: function(term, suggest) {
                term = term.toLowerCase();
                let matches = [];
                Object.keys(nPost).forEach(name => { // проганяем полученный массив городов с обьекта nPost
                    if (~name.toLowerCase().indexOf(term)) matches.push(name);  // если город соответсвует term  то пушим его в массив matches
                });
                suggest(matches); // выводим соответствующие города
            },
            onSelect: function(e, term, item) {
                if(radioNP.checked) getDepartments(nPost[term].ref); // передаем ref кликнутого города и вызываем getDepartments
            }
        });
    });
};


function getDepartments(ref) {
    let fd = new FormData();
        fd.append("ref", ref);

    fetch(`http://cors-anywhere.herokuapp.com/https://diadema.ua//newPost/np/get_departments.php`, {
        method: "POST",
        body: fd
    })
    .then(res => res.json())
    .then(dep => {
        const ul  = document.querySelector('[data-autocomplete="deplist"]');
        const inp = document.querySelector('input[data-autocomplete="dep"]');
              ul.innerHTML = '';
        if (dep.length > 0) {
            for (let k in dep) {
                let li = document.createElement('li');
                    li.dataset.dep = dep[k].name;
                    li.textContent = dep[k].name;
                    ul.parentElement.style.display = 'block';
                    ul.appendChild(li);
            }
            inp.value = ul.firstElementChild.dataset.dep; //default value first
            selectedDep(inp);
        }
        ul.querySelectorAll('li').forEach(li => li.addEventListener('click', e => {
            e.preventDefault();
            inp.value = li.dataset.dep;
            inp.dataset.opened = false;
            selectedDep(inp);
        }));
        inp.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            inp.dataset.opened = true;
        });
        document.addEventListener('click', e => {
            if (inp.dataset.opened == 'true' && e.target !== inp) inp.dataset.opened = false;
        });
    })
    .catch(err => console.error('Error:', err));
};


function selectedDep(inp) {
    const sel = document.querySelector('.order__hint-depart');
          sel.innerHTML = '';
    let split = inp.value.split(': '); // разбиваем строку отделения и адреса
    split.forEach(p => {
        let el = document.createElement('p');
            el.textContent = p;
        sel.appendChild(el);
    });
};

function updatePurchases() {
    alert('Обновить');
};

function sendOrderForm(event) {
    event.preventDefault();
    alert('Отправка формы');
    // here fetch with sending form
};


function removePurchase(event, btn) {
    event.preventDefault();
    if(confirm("Удалить?")) {
       btn.closest('.purchases__item').remove();
       // here fetch with update pururchases
    }
}

