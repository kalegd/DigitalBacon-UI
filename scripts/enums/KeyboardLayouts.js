const ENGLISH = {
    name: 'English',
    pages: [{
        style: { padding: 0.01 },
        rows: [{
            keys: ['q', 'w', { text: 'e', type: 'key', value: 'e', additionalCharacters: ['è', 'é', 'ë', 'ê'] }, 'r', 't', 'y', { text: 'u', type: 'key', value: 'u', additionalCharacters: ['ù', 'ú', 'ü', 'û'] }, { text: 'i', type: 'key', value: 'i', additionalCharacters: ['ì', 'í', 'ï', 'î'] }, { text: 'o', type: 'key', value: 'o', additionalCharacters: ['ò', 'ó', 'ö', 'ô', 'ø'] }, 'p'],
        }, {
            keys: [{ text: 'a', type: 'key', value: 'a', additionalCharacters: ['à', 'á', 'ä', 'â'] }, 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        }, {
            keys: [{ text: '⇧', type: 'shift', style: { width: 0.155 }}, 'z', 'x', { text: 'c', type: 'key', value: 'c', additionalCharacters: ['ç'] }, 'v', 'b', { text: 'n', type: 'key', value: 'n', additionalCharacters: ['ñ'] }, 'm', { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 } }],
        }, {
            keys: [{ text: '123', type: 'page', page: 1, style: { width: 0.155 }}, ',', { text: 'space', type: 'key', value: ' ', style: { width: 0.539 }}, '.', { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 } }],
        }],
    }, {
        style: { padding: 0.01 },
        rows: [{
            keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        }, {
            keys: ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
        }, {
            keys: [{ text: '#+=', type: 'page', page: 2, style: { width: 0.155, marginRight: 0.115 }}, '.', ',', '?', '!', '\'', { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155, marginLeft: 0.115 }}],
        }, {
            keys: [{ text: 'ABC', type: 'page', page: 0, style: { width: 0.155 }}, { text: 'space', type: 'key', value: ' ', style: { width: 0.759 }}, { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 } }],
        }],
    }, {
        style: { padding: 0.01 },
        rows: [{
            keys: ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
        }, {
            keys: ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
        }, {
            style: { justifyContent: 'spaceBetween', width: '100%' },
            keys: [{ text: '123', type: 'page', page: 1, style: { width: 0.155, marginRight: 0.115 }}, '.', ',', '?', '!', '\'', { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155, marginLeft: 0.115 }}],
        }, {
            keys: [{ text: 'ABC', type: 'page', page: 0, style: { width: 0.155 }}, { text: 'space', type: 'key', value: ' ', style: { width: 0.759 }}, { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 } }],
        }],
    }],
};

const NUMBERS = {
    name: 'Numbers',
    pages: [{
        style: { padding: 0.01 },
        rows: [{
            keys: ['1', '2', '3'],
        }, {
            keys: ['4', '5', '6'],
        }, {
            keys: ['7', '8', '9'],
        }, {
            keys: ['.', '0', { text: '⌫', type: 'key', value: 'Backspace' }],
        }, {
            keys: ['±', { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.21 } }], 
        }],
    }]
};

const RUSSIAN = {
    name: 'русский',
    pages: [{
        style: { padding: 0.01 },
        rows: [{
            keys: ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
        }, {
            keys: ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э', 'ë'],
        }, {
            keys: [{ text: '⇧', type: 'shift', style: { width: 0.155 }}, 'я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 } }],
        }, {
            keys: [{ text: '123', type: 'page', page: 1, style: { width: 0.155 }}, ',', { text: 'space', type: 'key', value: ' ', style: { width: 0.539 }}, '.', { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 } }],
        }],
    }, {
        style: { padding: 0.01, marginLeft: 0.11, marginRight: 0.11 },
        rows: [{
            keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        }, {
            keys: ['@', '#', ':', ';', '%', '-', '+', '=', '(', ')'],
        }, {
            keys: [{ text: '~[<', type: 'page', page: 2, style: { width: 0.155 }}, '.', ',', '?', '!', '"', '\'', '₽', { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 }}],
        }, {
            keys: [{ text: 'АБВ', type: 'page', page: 0, style: { width: 0.155 }}, '\\', { text: 'space', type: 'key', value: ' ', style: { width: 0.539 }}, '/', { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 } }],
        }],
    }, {
        style: { padding: 0.01, marginLeft: 0.11, marginRight: 0.11 },
        rows: [{
            keys: ['[', ']', '{', '}', '`', '^', '*', '&', '«', '»'],
        }, {
            keys: ['$', '€', '£', '¥', '•', '_', '|', '~', '<', '>'],
        }, {
            style: { justifyContent: 'spaceBetween', width: '100%' },
            keys: [{ text: '123', type: 'page', page: 1, style: { width: 0.155 }}, '.', ',', '?', '!', '"', '\'', '₽', { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 }}],
        }, {
            keys: [{ text: 'АБВ', type: 'page', page: 0, style: { width: 0.155 }}, '\\', { text: 'space', type: 'key', value: ' ', style: { width: 0.539 }}, '/', { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 } }],
        }],
    }],
};

const EMOJIS = {
    name: '😀',
    pages: [{
        style: { padding: 0.01 },
        rows: [{
            keys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃'],
        }, {
            keys: ['🫠', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺'],
        }, {
            keys: ['😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗'],
        }, {
            keys: [{ text: '←', type: 'page', page: 3, style: { width: 0.155 }}, { text: '→', type: 'page', page: 1, style: { width: 0.155 }}, { text: 'space', type: 'key', value: ' ', style: { width: 0.429 }}, { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 }}, { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 }}],
        }],
    }, {
        style: { padding: 0.01 },
        rows: [{
            keys: ['🤭', '🫢', '🫣', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑'],
        }, {
            keys: ['😶', '🫥', '😶‍🌫', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌'],
        }, { 
            keys: ['😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧'],
        }, {
            keys: [{ text: '←', type: 'page', page: 0, style: { width: 0.155 }}, { text: '→', type: 'page', page: 2, style: { width: 0.155 }}, { text: 'space', type: 'key', value: ' ', style: { width: 0.429 }}, { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 }}, { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 }}],
        }],
    }, {
        style: { padding: 0.01 },
        rows: [{
            keys: ['🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎'],
        }, {
            keys: ['🤓', '🧐', '😕', '🫤', '😟', '🙁', '☹', '😮', '😯', '😲'],
        }, {
            keys: ['😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭'],
        }, {
            keys: [{ text: '←', type: 'page', page: 1, style: { width: 0.155 }}, { text: '→', type: 'page', page: 3, style: { width: 0.155 }}, { text: 'space', type: 'key', value: ' ', style: { width: 0.429 }}, { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 }}, { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 }}],
        }],
    }, { 
        style: { padding: 0.01 },
        rows: [{
            keys: ['😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡'],
        }, {
            keys: ['😠', '🤬', '😈', '👿', '💀', '☠', '💩', '', '', ''],
        }, {
            keys: ['', '', '', '', '', '', '', '', '', ''],
        }, {
            keys: [{ text: '←', type: 'page', page: 2, style: { width: 0.155 }}, { text: '→', type: 'page', page: 0, style: { width: 0.155 }}, { text: 'space', type: 'key', value: ' ', style: { width: 0.429 }}, { text: '⏎', type: 'key', value: 'Enter', style: { width: 0.155 }}, { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 }}],
        }],
    }],
};

const KeyboardLayouts = {
    ENGLISH: ENGLISH,
    NUMBERS: NUMBERS,
    RUSSIAN: RUSSIAN,
    EMOJIS: EMOJIS,
};

export default KeyboardLayouts;
