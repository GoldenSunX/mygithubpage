function resetOut() {
  document.getElementById('eqndiv').innerHTML = '';
  document.getElementById('in-box').classList.remove('in-bad');
  hideErrors();
}

var AST;
function render(s) {
  resetOut();
  if(!parser) {
    addErrors(['You must define a valid set of predicates, functions, and constants.']);
    return;
  }
  
  if(s.trim() === '') {
    return;
  }
  
  s = s.replace(/\/\\/g, ' and ').replace(/\\\//g, ' or ').replace(/\\/g, ' '); // ... Well, it works...
  var preCheckErrors = [];
  
  var arithmetic = preCheckAddMult(s);
  preCheckErrors = preCheckErrors.concat(arithmetic); 
  
  var pCheck = preCheckParens(s); // TODO most of this code goes in check.js
  if(pCheck[0] !== -1) {
    preCheckErrors.push('Parentheses not balanced: at offset ' + (pCheck[0]+1) + ' ("<span class="monospace">' + s.substring(0, pCheck[0]+1) + '"</span>), there have been more closing parentheses than opening.');
  }
  if(pCheck[1] > 0) {
    preCheckErrors.push('Parentheses not balanced: you have more opening parentheses than closing. (That\'s what the "parentheses depth" message is about.)');
  }
  
  var badWords = preCheckStrings(s);
  if(badWords.length > 0) {
    for(var i=0; i<badWords.length; ++i) {
      preCheckErrors.push('Unrecognized word: "<span class="monospace">' + badWords[i] + '</span>". Check your spelling, and ensure you\'ve defined all your predicates, functions, and constants. Everything is case-sensitive.'); // TODO monospace
    }
  }
  
  if(preCheckErrors.length > 0) {
    addErrors(preCheckErrors);
    return;
  }
  

  try {
    AST = parser.parse(s);
  }
  catch(e) {
    var msg = e.toString();
    if(e.offset) {
      msg += '<br>Progress at time of failure:' + monospace(s.substring(0, e.offset) + '\u2022' + s.substring(e.offset)) + '.';
    }
    addErrors([msg]);
    return;
  }
  
  var ele = renderize(AST);
  document.getElementById('eqndiv').appendChild(ele);
  
  
  annotateWithParents(AST);
  
  var errors = [];
  
  errors = errors.concat(varCheck(AST));

  errors = errors.concat(arityCheck(AST, predArities, funArities));

  errors = errors.concat(forallAndSanityCheck(AST));
  
  errors = errors.concat(postCheckErrorTypes(AST));
  
  addErrors(errors);
  
  //console.log(AST);
}

// takes a list of errors and appends them to the current list
// errors are either a string of HTML, or a list [HTML, ele], where 'ele' is to be highlighted when the error is clicked.
function addErrors(l) {
  if(l.length === 0) return;
  document.getElementById('in-box').classList.add('in-bad');

  var errorsEle = document.getElementById('errors');
  for(var i=0; i<l.length; ++i) {
    var liEle = document.createElement('li');
    liEle.classList.add('error-out');
    if(typeof l[i] === 'string') {
      liEle.innerHTML = l[i];
    }
    else {
      liEle.innerHTML = l[i][0];
      liEle.addEventListener('click', (function(x){ return function(e) {
        requestHighlight(x);
      }})(l[i][1]), false);
    }
    errorsEle.appendChild(liEle);
  }
  
  showErrors();
}

function showErrors() {
  var errEle = document.querySelector('.error-div');
  errEle.style.display = '';
  errEle.style['transition-duration'] = '.5s';
  errEle.style['max-height'] = '100%';
}

function hideErrors() {
  var errEle = document.querySelector('.error-div');
  errEle.style.display = 'none';
  errEle.style['transition-duration'] = '0s';
  errEle.style['max-height'] = '0px';
  document.getElementById('errors').innerHTML = '';
}

function setParenOut(n) {
  var parenEle = document.querySelector('.paren-out');
  if(n === 0) {
    parenEle.innerHTML = '\xA0';
  }
  else {
    parenEle.innerHTML = 'Parentheses depth: ' + n + '.'
  }
}

function getAndRender() {
  render(document.getElementById('in-box').value);
}

function buttonGo(e) {
  e.preventDefault();
  getAndRender();
}


// global variables are fun!
var parser;
var predArities = {'pred':1, 'p':1, 'P':2};
var funArities = {'fun':1, 'f':1};

function showExamples(preds, infixs, functions, constants) {
  var symbols = ['x', 'y', 'z', 'a', 'b', 'c', 'd', 'e', 'f'];
  var predEle = document.querySelector('#predicates-out-list');
  var infixsEle = document.querySelector('#infix-out-list');
  var functionsEle = document.querySelector('#functions-out-list');
  var constantsEle = document.querySelector('#constants-out-list');
  predEle.innerHTML = '';
  infixsEle.innerHTML = '';
  functionsEle.innerHTML = '';
  constantsEle.innerHTML = '';

  function mkExText(name, arity) {
    if (arity === '*') {
      return name + '(' + symbols.slice(0,2).join(', ') + '), ' + name + '(' + symbols.slice(0,4).join(', ') + '), etc';
    } else {
      if (arity > symbols.length) {
        return name + '(' + symbols.join(', ') + ', ...)';
      } else {
        return  name + '(' + symbols.slice(0, arity).join(', ') + ')';
      }
    }
  }

  for (var i=0; i<preds.length; ++i) {
    var ele = document.createElement('div');
    ele.textContent = mkExText(preds[i], predArities[preds[i]]);
    predEle.appendChild(ele);
  }

  for (var i=0; i<infixs.length; ++i) {
    var ele = document.createElement('div');
    ele.textContent = symbols[0] + ' ' + infixs[i] + ' ' + symbols[1];
    infixsEle.appendChild(ele);
  }

  for (var i=0; i<functions.length; ++i) {
    var ele = document.createElement('div');
    ele.textContent = mkExText(functions[i], funArities[functions[i]]);
    functionsEle.appendChild(ele);
  }

  for (var i=0; i<constants.length; ++i) {
    var ele = document.createElement('div');
    ele.textContent = constants[i];
    constantsEle.appendChild(ele);
  }
}

function grammarGo(e) {
  e && e.preventDefault();
  resetOut();
  parser = null;
  predArities = {};
  funArities = {};
  strings = baseStrings.slice(0);
  
  
  var errors = [];
  var predsList = document.getElementById('predicates-box').value.split('\n');
  var infixList = document.getElementById('infix-box').value.split('\n');
  var functionsList = document.getElementById('functions-box').value.split('\n');
  var constantsList = document.getElementById('constants-box').value.split('\n');
  
  var preds = [];
  for(var i=0; i<predsList.length; ++i) {
    var pred = predsList[i].trim()
    if(pred.length == 0) continue;
    
    if(pred.match(/[^0-9A-Za-z_\-\*\s]/)) {
      errors.push('Predicate input ' + monospace(predsList[i]) + ' contains illegal characters (outside 0-9 A-Z a-z _ - *).')
      continue;
    }
    pred = pred.split(/\s+/);
    if(pred.length < 2) {
      errors.push('Predicate input ' + monospace(predsList[i]) + ' needs an associated arity.');
      continue;
    }
    if(pred.length > 2) {
      errors.push('Predicate input ' + monospace(predsList[i]) + ' has too many spaces.');
      continue;
    }
    
    if(pred[1] === '*')  {
      var arity = '*';
    }
    else {
      var arity = parseInt(pred[1]);
      if(isNaN(arity)) {
        errors.push('Predicate input ' + monospace(predsList[i]) + ': couldn\'t parse arity.');
        continue;
      }
    }
    
    predArities[pred[0]] = arity;
    preds.push(pred[0]);
    strings = strings.concat(pred[0].split(/[^0-9A-Za-z_]/));
  }


  var infixs = [];
  for(var i=0; i<infixList.length; ++i) {
    var infix = infixList[i].trim()
    if(infix.length == 0) continue;
    
    if(infix.match(/[^0-9A-Za-z_<>\u2208\u2282\u2286\u2264\u2265]/)) { // \in, \subset, \subseteq, \leq, \geq
      errors.push('Infix input ' + monospace(infixList[i]) + ' contains illegal characters (outside 0-9 A-Z a-z _ \u2208 \u2282 \u2286 \u2264 \u2265).')
      continue;
    }
    infixs.push(infix);
    strings = strings.concat(infix.split(/[^0-9A-Za-z_]/));
  }
  
  
  var functions = [];
  for(var i=0; i<functionsList.length; ++i) {
    var function_ = functionsList[i].trim()
    if(function_.length == 0) continue;
    
    if(function_.match(/[^0-9A-Za-z_\-\*\s]/)) {
      errors.push('Function input ' + monospace(functionsList[i]) + ' contains illegal characters (outside 0-9 A-Z a-z _ - *).')
      continue;
    }
    function_ = function_.split(/\s+/);
    if(function_.length < 2) {
      errors.push('Function input ' + monospace(functionsList[i]) + ' needs an associated arity.');
      continue;
    }
    if(function_.length > 2) {
      errors.push('Function input ' + monospace(functionsList[i]) + ' has too many spaces.');
      continue;
    }
    
    if(function_[1] === '*')  {
      var arity = '*';
    }
    else {
      var arity = parseInt(function_[1]);
      if(isNaN(arity)) {
        errors.push('Function input ' + monospace(functionsList[i]) + ': couldn\'t parse arity.');
        continue;
      }
    }
    
    funArities[function_[0]] = arity;
    functions.push(function_[0]);
    strings = strings.concat(function_[0].split(/[^0-9A-Za-z_]/));
  }
  
  var constants = [];
  for(var i=0; i<constantsList.length; ++i) {
    var constant = constantsList[i].trim()
    if(constant.length == 0) continue;
    
    if(constant.match(/[^0-9A-Za-z_\-]/)) {
      errors.push('Constant input ' + monospace(constantsList[i]) + ' contains illegal characters (outside 0-9 A-Z a-z _ -).')
      continue;
    }
    constants.push(constant);
    strings = strings.concat(constant.split(/[^0-9A-Za-z_]/));
  }
  
  if(errors.length > 0) {
    addErrors(errors);
    return;
  }
  
  try {
    showExamples(preds, infixs, functions, constants);
    parser = makeParser(preds, infixs, functions, constants);
  }
  catch(e) {
    console.log(e)
    addErrors([e.toString()]);
  }

  getAndRender();
}


function inboxEnter(e) {
  var charCode = e.which || e.keyCode;
  if(charCode === 13) {
    e.preventDefault();
    this.blur();
    getAndRender();
  }
}


function inboxChange() {
  var pCheck = preCheckParens(document.getElementById('in-box').value);
  setParenOut(pCheck[1]);
}

function changeSelect() {
  var select = document.getElementById('preset-select');
  var which = parseInt(select.value);
  if(which >= 0) {
    var preset = presets[which];
    document.getElementById('predicates-box').value = preset.predicates.join('\n');
    document.getElementById('infix-box').value = preset.infix.join('\n');
    document.getElementById('functions-box').value = preset.functions.join('\n');
    document.getElementById('constants-box').value = preset.constants.join('\n');
    grammarGo();
  }
}

addEventListener('load', function(){
  //document.getElementById('go-button').addEventListener('click', buttonGo, false);
  document.querySelector('#in-box').addEventListener('keyup', getAndRender);
  document.getElementById('grammar-button').addEventListener('click', grammarGo, false);
  
  grammarGo();

  var inbox = document.getElementById('in-box');
  inbox.addEventListener('keypress', inboxEnter, false);
  inbox.addEventListener('input', inboxChange, false);
  //inbox.value = 'exists x. forall y. (F implies not (x = y))';
  getAndRender();
  
  var select = document.getElementById('preset-select');
  select.addEventListener('change', changeSelect, false);
  for(var i=0; i<presets.length; ++i) {
    var option = document.createElement('option');
    option.innerHTML = presets[i].name;
    option.value = i;
    select.appendChild(option);
  }
  
  document.getElementById('hider').addEventListener('click', function(e) {
    e.preventDefault();
    var hider = document.getElementById('hider');
    var isHidden = hider.innerHTML.match('Hide') !== null;
    if(isHidden) {
      hider.innerHTML = 'Show custom symbol input';
      document.querySelector('.collapsible-grammar').classList.remove('undisplay');
    }
    else {
      hider.innerHTML = 'Hide custom symbol input';
      document.querySelector('.collapsible-grammar').classList.add('undisplay');
    }
  }, false);
});