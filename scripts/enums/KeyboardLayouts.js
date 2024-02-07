const ENGLISH = {
    name: 'English',
    pages: [{
        style: { padding: 0.01 },
        rows: [{
            keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        }, {
            keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        }, {
            keys: [{ text: '⇧', type: 'shift', style: { width: 0.155 }}, 'z', 'x', 'c', 'v', 'b', 'n', 'm', { text: '⌫', type: 'key', value: 'Backspace', style: { width: 0.155 } }],
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
    EMOJIS: EMOJIS,
};

export default KeyboardLayouts;
