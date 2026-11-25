const { Function } = require('../lib/');

const USAGE = 'Usage: .calu <expression>\n*Example:*\n*Addition* : .calu 2+2\n*Subtraction* : .calu 7-1\n*Multiplication* : .calu 5*3\n*Division* : .calu 8/4\n*Mixed* : .calu (2+3)*4^2 - 10%3';

// Safe calculator: a tiny recursive-descent parser, no eval().
// Supports + - * / % ^ (power), parentheses, decimals and unary minus.
function calculate(input) {
  const s = input.replace(/\s+/g, '').replace(/[x×]/gi, '*').replace(/÷/g, '/');
  let i = 0;
  const fail = (msg) => { throw new Error(msg); };
  const peek = () => s[i];

  function number() {
    const m = /^\d*\.?\d+(?:e[+-]?\d+)?/i.exec(s.slice(i));
    if (!m) fail('Invalid expression');
    i += m[0].length;
    return parseFloat(m[0]);
  }
  function primary() {
    if (peek() === '(') {
      i++;
      const v = expr();
      if (peek() !== ')') fail('Missing )');
      i++;
      return v;
    }
    if (peek() === '-') { i++; return -primary(); }
    if (peek() === '+') { i++; return primary(); }
    return number();
  }
  function power() {
    const base = primary();
    if (peek() === '^') { i++; return Math.pow(base, power()); } // right-associative
    return base;
  }
  function term() {
    let v = power();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = s[i++];
      const r = power();
      if ((op === '/' || op === '%') && r === 0) fail('Division by zero');
      v = op === '*' ? v * r : op === '/' ? v / r : v % r;
    }
    return v;
  }
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  if (!s) fail('Invalid expression');
  const result = expr();
  if (i < s.length) fail('Invalid expression');
  if (!Number.isFinite(result)) fail('Result is too large');
  return Number.isInteger(result) ? result : +result.toPrecision(12);
}

Function({
	pattern: 'calu ?(.*)',
	fromMe: true,
	desc: ' Calculate math expressions',
	type: 'misc'
}, async (message, expression) => {
  if (!expression) return await message.reply(USAGE);
  try {
    return await message.send(String(calculate(expression)));
  } catch (e) {
    return await message.reply(`*${e.message}*\n\n${USAGE.replace(/^Usage.*\n/, '')}`);
  }
});

module.exports = { calculate };
