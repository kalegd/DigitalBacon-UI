let selectedItem;
let iframe = document.getElementById('viewer');
function chooseExample(li) {
    iframe.setAttribute('src', li.getAttribute('href'));
    if(selectedItem) selectedItem.classList.remove('selected');
    selectedItem = li;
    selectedItem.classList.add('selected');
}
let items = document.querySelectorAll('.sidebar li');
items.forEach((li) => li.addEventListener('click', () => chooseExample(li)));
