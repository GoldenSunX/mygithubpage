var names = { // TODO better name
  Bicond: '\u2194',
  Implies: '\u2192',
  Or: '\u2228',
  And: '\u2227',
  Forall: '\u2200',
  Exists: '\u2203',
  Not: '\u00AC',
  ErrorFormulaConcat: '\u2022',
  ErrorTermConcat: '\u2022'
}


function panic(e) {
  alert(e);
  throw Error(e);
}

function isLeaf(node) {
  var t = node.type;
  return t==='Variable' || t==='Constant' || t==='TruthConstant';
}

function getChildren(node) { // always returns a list
  //if (isLeaf(node)) panic('Leaves don\'t have children!');
  
  switch(node.type) {
    case 'Bicond':
    case 'Implies':
    case 'Or':
    case 'And':
    case 'ErrorFormulaConcat':
    case 'ErrorTermConcat':
    case 'ErrorArgList':
      return node.data;
    case 'Quantifier':
      return [node.variable, node.data];
    case 'Not':
    case 'Parens':
    case 'ErrorNotTerm':
    case 'ErrorNotValue':
      return [node.data];
    case 'InfixPredicate':
      return [node.left, node.right];
    case 'Predicate':
    case 'Function':
    case 'ErrorUndefinedPredicate':
      return node.args;
    case 'Variable':
    case 'Constant':
    case 'TruthConstant':
      return [];
    default:
      panic('There\'s more types??? ' + node.type);
  }
}

// find unbound variables
function varCheckHelper(node, scope) {
  if(node.type === 'Variable') {
    if(scope.indexOf(node.value) === -1) {
      var msg = 'ErrorBinding: Variable ' + monospace(node.value) + ' is not bound. It needs be provided by a quantifier, as in "forall ' + node.value + '. (...)". (If you have one which captures this variable, odds are you need more parentheses.)'; // TODO find which one they mean
      node.ele.classList.add('error');
      out = [[msg, node.ele]];
      return [[msg, node.ele]];
    }
    else {
      return [];
    }
  }
  else if(node.type === 'Quantifier') {
    var newScope = scope.slice(0);
    newScope.push(node.variable.value);
    return varCheckHelper(node.data, newScope);
  }
  else {
    var out = [];
    var children = getChildren(node);
    for(var i=0; i<children.length; ++i) {
      out = out.concat(varCheckHelper(children[i], scope));
    }
    return out;
  }
}

// return a list of those variable objects which are not in scope
function varCheck(tree) {
  return varCheckHelper(tree, []);
}




// '*Arities' are objects mapping string names to integer arities
function arityCheck(node, predArities, funcArities) {
  var out = [];
  if(node.type === 'Predicate') {
    if(!(node.name in predArities)) panic('Arity for predicate ' + node.name + ' not provided!');
    if(predArities[node.name] !== '*' && node.args.length !== predArities[node.name]) {
      var s = (predArities[node.name]==1)?'':'s'
      var msg = 'ErrorArity: Predicate ' + monospace(node.name) + ' takes ' + predArities[node.name] + ' argument' + s + ', but ' + node.args.length + ' given.';
      node.ele.nameTextEle.classList.add('error');
      out = [[msg, node.ele]];
    }
  }
  else if(node.type === 'Function') {
    if(!(node.name in funcArities)) panic('Arity for function ' + node.name + ' not provided!');
    if(funcArities[node.name] !== '*' && node.args.length !== funcArities[node.name]) {
      var s = (funcArities[node.name]==1)?'':'s'
      var msg = 'ErrorArity: Function ' + monospace(node.name) + ' takes ' + funcArities[node.name] + ' argument' + s + ', but ' + node.args.length + ' given.';
      node.ele.nameTextEle.classList.add('error');
      out = [[msg, node.ele]];
    }
  }

  var children = getChildren(node);
  for(var i=0; i<children.length; ++i) {
    out = out.concat(arityCheck(children[i], predArities, funcArities));
  }
  return out;
}


// Warn when using "forall" with "and" and "exists" with "implies".
function forallAndSanityCheck(node) {
  function unwrap(node) {
    while (node.type === 'Parens') {
      node = node.data;
    }
    return node;
  }

  var out = [];
  if(node.type === 'Quantifier' && node.which === 'forall' && unwrap(node.data).type === 'And') {
      var msg = 'Warning: You seem to be using "and" with "for all". This is valid syntax, but is almost never what you want: it will only be satisfied if every object in the universe meets both criteria.';
      node.ele.classList.add('warning');
      out = [[msg, node.ele]];
  } else if(node.type === 'Quantifier' && node.which === 'exists' && unwrap(node.data).type === 'Implies') {
      var msg = 'Warning: You seem to be using "implies" with "exists". This is valid syntax, but is almost never what you want: it will always be satisfied if any object in the universe fails to satisfy the antecedent.';
      node.ele.classList.add('warning');
      out = [[msg, node.ele]];
  }

  var children = getChildren(node);
  for(var i=0; i<children.length; ++i) {
    out = out.concat(forallAndSanityCheck(children[i]));
  }
  return out;
}


function _text(x) {
  return document.createTextNode(x);
}


var currentlyFancy = [];
function unfancy() {
  while(currentlyFancy.length > 0) {
    var c = currentlyFancy.pop();
    c.classList.remove('highlighted');
  }
}

// highlight an element, or if it is already highlighted, unhighlight it.
// either way, unhighlight everything else
function requestHighlight(ele) {
  if(ele.classList.contains('highlighted')) {
    unfancy();
  }
  else {
    unfancy();
    ele.classList.add('highlighted');
    currentlyFancy.push(ele);
  }
}

// TODO should be in UI.js
// returns an element. also decorates node (and its children) with a .ele prop
function renderize(node) {
  var ele = document.createElement('span');
  ele.classList.add('node-holder');
  ele.classList.add(node.type);
  switch(node.type) {
    case 'Bicond':
    case 'Implies':
    case 'Or':
    case 'And':
    case 'ErrorFormulaConcat':
    case 'ErrorTermConcat':
      ele.appendChild( renderize(node.data[0]) );
      for(var i=1; i<node.data.length; ++i) {
        ele.appendChild(_text(' ' + names[node.type] + ' '));
        ele.appendChild(renderize(node.data[i]));
      }
      break;
    case 'ErrorArgList':
      ele.appendChild(_text('('))
      ele.appendChild(renderize(node.data[0]));
      for(var i=1; i<node.data.length; ++i) {
        ele.appendChild(_text(', '));
        ele.appendChild(renderize(node.data[i]));
      }
      ele.appendChild(_text(')'));
      break;
    case 'Quantifier':
      var qText = ' ' + (node.which==='forall'?names.Forall:names.Exists) + ' ';
      ele.appendChild(_text(qText));
      ele.appendChild(renderize(node.variable));
      ele.appendChild(_text('. '));
      ele.appendChild(renderize(node.data));
      break;
    case 'Not':
      ele.appendChild(_text(names.Not));
      ele.appendChild(renderize(node.data));
      break;
    case 'Parens':
      ele.appendChild(_text('('));
      ele.appendChild(renderize(node.data));
      ele.appendChild(_text(')'));
      break;
    case 'ErrorNotTerm':
    case 'ErrorNotValue':
      ele.appendChild(renderize(node.data));
      break;
    case 'InfixPredicate':
      ele.appendChild(renderize(node.left));
      ele.appendChild(_text(' ' + node.which + ' '));
      ele.appendChild(renderize(node.right));
      break;
    case 'Predicate':
    case 'Function':
    case 'ErrorUndefinedPredicate':
      var span = document.createElement('span');
      span.appendChild(_text(node.name));
      ele.appendChild(span);
      ele.nameTextEle = span;
      ele.appendChild(_text('('))
      ele.appendChild(renderize(node.args[0]));
      for(var i=1; i<node.args.length; ++i) {
        ele.appendChild(_text(', '));
        ele.appendChild(renderize(node.args[i]));
      }
      ele.appendChild(_text(')'));
      break;
    case 'Variable':
    case 'Constant':
    case 'TruthConstant':
      ele.appendChild(_text(node.value));
      break;
    default:
      console.log(node);
      panic('There\'s more types??? ' + node.type);
  }
  ele.addEventListener('click', function(e){
    e.stopPropagation();
    requestHighlight(this);
  });
  node.ele = ele;
  return ele;
}



function monospace(s) {
  s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/ /g, '&nbsp;'); // um. maybe do this better.
  return '<span class="monospace">"' + s + '"</span>';
}




var baseStrings = ['iff', 'implies', 'or', 'vee', 'and', 'wedge', 'forall', 'A', 'exists', 'E', 'not', 'neg', 'for', 'all'];
strings = baseStrings.concat(['in', 'pred', 'p', 'P', '0', 'f', 'fun']); // for development, predefined predicates etc
// should included any user-defined tokens split on /[^0-9A-Za-z_]/ w/concat filtered for len>0

// a very stupid prechecker. looks for runs of letters and ensures that they are recognizable
// returns an array of unrecognized strings. TODO maybe a list of errors for addError, for consistency?
function preCheckStrings(s) {
  var words = s.split(/[^0-9A-Za-z_]/);
  var out = [];
  for(var i=0; i<words.length; ++i) {
    if((words[i].length > 1 || (words[i].length == 1 && words[i].match('[0-9_]'))) && strings.indexOf(words[i]) === -1) { // ie, not a variable and not a reserved word
      out.push(words[i]);
    }
  }
  return out;
}


// a slightly less stupid prechecker. checks if parentheses are balanced.
// returns an array: [pos, depth], where 'pos' is the first offset
// at which the depth goes below 0, or -1 if no such offset exists.
function preCheckParens(s) {
  var pos = -1;
  var depth = 0;
  for(var i=0; i<s.length; ++i) {
    if(s[i] === '(') {
      depth++;
    }
    else if(s[i] === ')') {
      depth--;
      if(depth < 0 && pos === -1) {
        pos = i;
      }
    }
  }
  return [pos, depth];
}


// check for "+", "\cdot", and "*"
// and tell them to use Add or Mult instead. returns list of errors as usual.
function preCheckAddMult(s) {
  if(s.match(/[+*\u00B7]/)) {
    return ['ErrorArithmetic: This tool can\'t handle arithmetic expressions like ' + monospace('x+y') + '. Instead, use ' + monospace('Add(x, y)') + ' or ' + monospace('Mult(x, y)') + ', making sure you\'ve selected a preset for a problem which provides ' + monospace('+') + ' and ' + monospace('\u00B7') + ' as functions. ' + monospace('x*y*z') + ' should be written as ' + monospace('Mult(x, y, z)') + ', etc.']
  }
  else {
    return [];
  }
}


// give elements of the AST a 'parent' property. obviously makes the object-graph acyclic.
// don't try to stringify or anything after this.
// root object gets parent 'null'.
// doesn't return anything, just mutates the original object.
function annotateWithParents(node) {
  if(typeof node === 'undefined') {
    node.parent = null;
  }
  var children = getChildren(node);
  for(var i=0; i<children.length; ++i) {
    children[i].parent = node;
    annotateWithParents(children[i]);
  }
}

// returns a list of errors caught by the parser, suitable to be passed to addErrors
// also marks the errors in red.
function postCheckErrorTypes(node) {
  var out = [];
  if(!node.handled) {
    switch(node.type) {
      case 'ErrorFormulaConcat':
        var msg = 'ErrorFormulaConcat: You appear to have written ' + node.data.length + ' components next to each other (namely, ';
        msg += monospace(node.data[0].text);
        
        if(node.data.length == 2) {
          msg += ' and ' + monospace(node.data[1].text);
        }
        else {
          for(var i=1; i<node.data.length-1; ++i) {
            msg += ', ' + monospace(node.data[i].text);
          }
          msg += ', and ' + monospace(node.data[node.data.length-1].text);
        }
        msg += '), with nothing to say how they relate. You need some ' + monospace('and') + 's or something between them.';
        node.ele.classList.add('error');
        out.push([msg, node.ele]);
        break;
      case 'ErrorTermConcat': // not currently caught. TODO
        break;
      
      case 'ErrorArgList':
        var msg = 'ErrorArgList: It looks like you\'ve written an argument list (' + monospace(node.text) + ') in a context which does not appear to be calling a function or predicate. Often this is because you used a comma instead of an ' + monospace('and') + 'or similar.';
        node.ele.classList.add('error');
        out.push([msg, node.ele]);
        break;
        
      case 'ErrorNotTerm':
        var msg;
        // special case: p(p(x)) or p(x) = x
        if(node.parent && node.data.type === 'Predicate') {
          if(node.parent.type === 'InfixPredicate') {
            msg = 'ErrorNotTerm: It looks like you\'re trying to compare the output of the predicate ' + monospace(node.data.name) + ' to another value using ' + monospace(node.parent.which) + ', but predicates return true/false values, so it doesn\'t make sense to compare their outputs with ' + monospace(node.parent.which) + '.';
            if(node.parent.which === '=') {
              msg += ' To check if two truth values are the same, use a biconditional.';
            }
          }
          else if(node.parent.type === 'Predicate') {
            msg = 'ErrorNotTerm: It looks like you\'re trying to pass the output of one predicate (' + monospace(node.data.name) + ') into another (' + monospace(node.parent.name) + '), but predicates take objects - i.e., variables, constants, and the outputs of functions - and return truth values (which are not objects), so they can\'t be chained in this way.';
          }
        }
        
        // special case: x = y = z
        if(node.parent && node.data.type === 'InfixPredicate' && node.parent.type === 'InfixPredicate') {
          msg = 'ErrorNotTerm: It looks like you\'re trying to chain the outputs of several infix predicates together, similar to the mathematical shorthand "x = y = z". In order to be entirely formal, this shorthand isn\'t usable in logic, and you instead need to write it out, like "x = y and y = z".';
        }
        
        // special case: ((x))
        if(node.data.type === 'Parens' && node.data.data.type === 'ErrorNotValue') {
          msg = 'ErrorNotTerm: It looks like you\'ve wrapped an object (' + monospace(node.data.data.text) + ') in parentheses, but you can only put parentheses around formulas, not objects.';
          node.data.data.handled = true;
        }
        
        // remaining cases
        if(!msg) {
          switch(node.parent && node.parent.type) { // short-circuit behavior is a bit weird, but trust me.
            case 'InfixPredicate':
              msg = 'ErrorNotTerm: It looks like you\'re trying to compare something which evaluates to a truth value (namely, ' + monospace(node.text) + ') using ' + monospace(node.parent.which) + ', but ' + monospace(node.parent.which) + ' can only compare objects, like variables, constants, and the outputs of functions.';
              if(node.parent.which === '=') {
                msg += ' To check if two truth values are the same, use a biconditional.';
              }
              break;
            case 'Predicate':
              msg = 'ErrorNotTerm: It looks like you\'ve passed something which evaluates to a truth value (namely, ' + monospace(node.text) + ') as an argument to the predicate ' + monospace(node.parent.name) + ', but predicates only take objects - i.e., variables, constants, and the outputs of functions - as arguments.';
              break; 
            case 'Function':
              msg = 'ErrorNotTerm: It looks like you\'ve passed something which evaluates to a truth value (namely, ' + monospace(node.text) + ') as an argument to the function ' + monospace(node.parent.name) + ', but functions only take objects - i.e., variables, constants, and the outputs of functions - as arguments.';
              break; 
            default:
              msg = 'ErrorNotTerm: It looks like you\'re using something which evaluates to a truth value (namely, ' + monospace(node.text) + ') as an object, though I can\'t tell exactly how. You need to provide a variable, a constant, or the output of a function in this context instead.';
          }        
        }
        else {
          msg += ' Relevant part of input: ' + monospace(node.text) + '.';
        }
        node.ele.classList.add('error');
        out.push([msg, node.ele]);
        break;
      
      case 'ErrorNotValue':
        var msg = 'ErrorNotValue: You have something which evaluates to an object (namely, ' + monospace(node.text) + ') in a place where you need a truth value. To be a valid sentence in first-order logic, you need to assert something about this object using a predicate like ' + monospace('=') + '.';
        node.ele.classList.add('error');
        out.push([msg, node.ele]);
        break;

      case 'ErrorUndefinedPredicate':
        var msg = 'ErrorUndefinedPredicate: You appear to be using ' + monospace(node.name) + ' as if it were a predicate or function, but it doesn\'t seem to be defined. Make sure you\'ve added all of the relevant terms to the lists.';
        console.log(node)
        node.ele.nameTextEle.classList.add('error');
        out.push([msg, node.ele]);
        break;
    }
  }
  var children = getChildren(node);
  for(var i=0; i<children.length; ++i) {
    out = out.concat(postCheckErrorTypes(children[i]));
  }
  return out;
}
