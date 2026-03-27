const display = document.getElementById("Display");
const historyDisplay = document.getElementById("Displayhist");
const keys = document.getElementById("Keys");

let MAX_DISPLAY_LENGTH = 14;
const operators = ["+", "-", "*", "/"];

clearDisplay();

function resetIfErrorState() {
    if (display.value === "Error" || display.value === "Overflow") {
        display.value = "0";
    }
}

function setOverflowIfNeeded(value) {
    if (String(value).length > MAX_DISPLAY_LENGTH) {
        display.value = "Overflow";
        return true;
    }
    return false;
}

function endsWithOperator(value) {
    return operators.includes(value.at(-1));
}

function appendToDisplay(input) {
    resetIfErrorState();

    if (display.value === "0" && !operators.includes(input) && input !== ".") {
        display.value = input;
        return;
    }

    if (operators.includes(input)) {
        if (!display.value && input !== "-") return;

        if (endsWithOperator(display.value)) {
            const last = display.value.at(-1);
            const prev = display.value.at(-2);

            if (input === "-" && last !== "-" && prev !== "-") {
                const next = display.value + input;
                if (!setOverflowIfNeeded(next)) display.value = next;
                return;
            }

            display.value = display.value.slice(0, -1) + input;
            return;
        }
    }

    if (input === ".") {
        const current = display.value.split(/[+\-*/]/).pop();
        if (current.includes(".")) return;
        if (!current) input = "0.";
    }

    const next = display.value + input;
    if (!setOverflowIfNeeded(next)) display.value = next;
}

function clearDisplay() {
    display.value = "0";
    historyDisplay.textContent = "";
}

function tokenizeExpression(expr) {
    const clean = expr.replace(/\s+/g, "");
    const raw = clean.match(/(\d+\.\d+|\d+\.|\.\d+|\d+|[+\-*/])/g);

    if (!raw || raw.join("") !== clean) throw Error();

    const tokens = [];

    for (const t of raw) {
        if (operators.includes(t)) {
            if (t === "-" && (tokens.length === 0 || operators.includes(tokens.at(-1)))) {
                tokens.push("u-");
            } else {
                tokens.push(t);
            }
        } else {
            tokens.push(Number(t));
        }
    }

    return tokens;
}

function evaluateExpression(expr) {
    const tokens = tokenizeExpression(expr);
    const values = [];
    const ops = [];

    const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "u-": 3 };

    const apply = (op) => {
        if (op === "u-") return values.push(-values.pop());

        const b = values.pop();
        const a = values.pop();

        if (op === "+") values.push(a + b);
        if (op === "-") values.push(a - b);
        if (op === "*") values.push(a * b);
        if (op === "/") values.push(a / b);
    };

    for (const t of tokens) {
        if (typeof t === "number") {
            values.push(t);
            continue;
        }

        while (ops.length && prec[ops.at(-1)] >= prec[t]) {
            apply(ops.pop());
        }

        ops.push(t);
    }

    while (ops.length) apply(ops.pop());

    if (values.length !== 1 || Number.isNaN(values[0])) throw Error();

    return values[0];
}

function formatResult(result) {
    if (!Number.isFinite(result)) throw Error();
    return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(10)));
}

function calculate() {
    resetIfErrorState();

    if (!display.value || display.value === "0" || endsWithOperator(display.value)) return;

    const expr = display.value;

    try {
        const result = formatResult(evaluateExpression(expr));
        historyDisplay.textContent = `${expr} =`;
        if (!setOverflowIfNeeded(result)) display.value = result;
    } catch {
        historyDisplay.textContent = `${expr} =`;
        display.value = "Error";
    }
}

keys.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const { value, action } = btn.dataset;

    if (value) return appendToDisplay(value);
    if (action === "calculate") return calculate();
    if (action === "clear") return clearDisplay();
});

document.addEventListener("keydown", (e) => {
    const k = e.key;

    if ((k >= "0" && k <= "9") || k === "." || operators.includes(k)) {
        e.preventDefault();
        return appendToDisplay(k);
    }

    if (k === "Enter" || k === "=") {
        e.preventDefault();
        return calculate();
    }

    if (k === "Backspace") {
        e.preventDefault();
        resetIfErrorState();
        display.value = display.value.length > 1 ? display.value.slice(0, -1) : "0";
        return;
    }

    if (k.toLowerCase() === "c" || k === "Escape") {
        e.preventDefault();
        clearDisplay();
    }
});