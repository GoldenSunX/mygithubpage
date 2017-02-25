/* Types and helper functions for the generated parser. Mostly types. */

// Helpers
function collapseList(head, tail, pos) {
  var out = [head];
  for(var i=0; i<tail.length; ++i) {
    out.push(tail[i][pos]);
  }
  return out;
}

function starOp(op, head, tail, text, pos) {
  pos = (typeof pos === 'undefined') ? 3 : pos;
  var list = collapseList(head, tail, pos);
  if(list.length === 1) return list[0];
  return op(list, text);
}



// Type factories
function expFactory(type) {return function(data, text) {
  return {type: type, data: data, text: text};
};}

function constFactory(type) {return function(value, text) {
  return {type: type, value: value, text: text};
};}





// Types
Bicond = expFactory("Bicond");
Implies = expFactory("Implies");
Or = expFactory("Or");
And = expFactory("And");

Quantifier = function(which, variable, data, text) {
  return {type: "Quantifier", which: which, variable: variable, data: data, text: text};
}

Not = expFactory("Not");

Parens = expFactory("Parens"); // for rendering purposes

InfixPredicate = function(which, left, right, text) {
  return {type: "InfixPredicate", which: which, left: left, right: right, text: text};
}

Predicate = function(name, args, text) {
  return {type: "Predicate", name: name, args: args, text: text};
}

Function_ = function(name, args, text) {
  return {type: "Function", name: name, args: args, text: text};
}

Variable = constFactory("Variable");
Constant = constFactory("Constant");
TruthConstant = constFactory("TruthConstant");


ErrorNotTerm = expFactory("ErrorNotTerm");
ErrorNotValue = expFactory("ErrorNotValue");
ErrorFormulaConcat = expFactory("ErrorFormulaConcat");
ErrorTermConcat = expFactory("ErrorTermConcat");
ErrorArgList = expFactory("ErrorArgList");

ErrorUndefinedPredicate = function(name, args, text) {
  return {type: "ErrorUndefinedPredicate", name: name, args: args, text: text};
}
