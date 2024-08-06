let selectedItem;
let sidebarOpen = false;
let iframe = document.getElementById('viewer');
let iframeParent = document.getElementById('iframe-parent');
let exampleCodeLink = document.getElementById('example-code-link');
let sidebarSliderButton = document.getElementById('sidebar-slider-button');
let sidebar = document.getElementById('sidebar');
function chooseExample(li) {
    iframe.setAttribute('src', li.getAttribute('href'));
    if(selectedItem) selectedItem.classList.remove('selected');
    selectedItem = li;
    selectedItem.classList.add('selected');
    exampleCodeLink.classList.remove('selected');
    exampleCodeLink.href = 'https://github.com/kalegd/DigitalBacon-UI/blob/main/'
        + li.getAttribute('href') + '.html';
}
let items = document.querySelectorAll('.sidebar li');
items.forEach((li) => li.addEventListener('click', () => chooseExample(li)));
sidebarSliderButton.addEventListener('click', () => {
    if(sidebarOpen) {
        iframeParent.classList.remove('compress');
        sidebar.classList.remove('open');
        sidebarSliderButton.innerText = '>';
    } else {
        iframeParent.classList.add('compress');
        sidebar.classList.add('open');
        sidebarSliderButton.innerText = '<';
    }
    sidebarOpen = !sidebarOpen;
});
window.onmessage = function(e) {
    if(typeof e.data == 'string') {
        window.location.href = e.data;
    }
};
