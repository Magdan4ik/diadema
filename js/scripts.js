document.addEventListener("DOMContentLoaded", funOrder) //Вызываем функцию funOrder после прогрузки DOM

let nPost = {};

function funOrder() {
    getCities(); //Вызываем функцию получения городов НП
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


function getAutocomplete() {
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
                getDepartments(nPost[term].ref); // передаем ref кликнутого города и вызываем getDepartments
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
        const ul = document.querySelector('[data-autocomplete="deplist"]');
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
            inp.value = ul.firstChild.dataset.dep; //default value first
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