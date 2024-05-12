let selectedItem;
let iframe = document.getElementById('viewer');
let exampleCodeLink = document.getElementById('example-code-link');
function chooseExample(li) {
    iframe.setAttribute('src', li.getAttribute('href'));
    if(selectedItem) selectedItem.classList.remove('selected');
    selectedItem = li;
    selectedItem.classList.add('selected');
    exampleCodeLink.classList.remove('selected');
    exampleCodeLink.href = 'https://github.com/kalegd/DigitalBacon-UI/blob/main'
        + li.getAttribute('href') + '.html';
}
let items = document.querySelectorAll('.sidebar li');
items.forEach((li) => li.addEventListener('click', () => chooseExample(li)));
window.onmessage = function(e) {
    if(typeof e.data == 'string') {
        window.location.href = e.data;
    }
};
