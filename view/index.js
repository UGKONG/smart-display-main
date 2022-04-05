const button = document.querySelector('button');
const tbody = document.querySelector('tbody');
const textarea = document.querySelector('textarea');
const none_list = document.querySelector('.none_list');

const useNow = (num = 0) => {
  let date = new Date();
  if (num !== 0) date.setHours(date.getHours() + num);
  let Y = date.getFullYear();
  let M = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
  let D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  let h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  let m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  let s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();

  let result = Y + '-' + M + '-' + D + ' ' + h + ':' + m + ':' + s;
  return result;
}

const onClick = () => {
  let val = textarea.value;
  if (none_list) none_list.remove();
  if (val === '') return textarea.focus();

  fetch('/clientSQL/' + val).then(r => r.json()).then(data => {
    let tr = document.createElement('tr');
    let result = data?.errno > 0 ? 'FALSE' : 'TRUE';
    tr.classList.add(data?.errno > 0 ? 'false' : 'ture');
    tr.innerHTML = `
      <td>${useNow()}</td>
      <td>${val}</td>
      <td>${result}</td>
    `;
    tbody.appendChild(tr);
    console.log(data);
    textarea.value='';
  });
}

button.addEventListener('click', onClick);