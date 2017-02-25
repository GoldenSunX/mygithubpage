function makeParser(predicates, infixPredicates, functions, constants) {


for(var i=0; i<predicates.length; ++i) {
  predicates[i] = '"' + predicates[i] + '"';
}

for(var i=0; i<infixPredicates.length; ++i) {
  infixPredicates[i] = '"' + infixPredicates[i] + '"';
}

for(var i=0; i<functions.length; ++i) {
  functions[i] = '"' + functions[i] + '"';
}

for(var i=0; i<constants.length; ++i) {
  constants[i] = '"' + constants[i] + '"';
}


var arePrefixPredicates = predicates.length > 0;
var areInfixPredicates = infixPredicates.length > 0;
var areFunctions = functions.length > 0;
var areConstants = constants.length > 0;



if(arePrefixPredicates) {
  var prefixPredicateText = ' n:predicateName _ a:argList { return Predicate(n, a, text()); }\n  /'
}
else {
  var prefixPredicateText = '';
}

if(areFunctions) {
  var functionText = '  / function_\n';
  var functionRule = 'function_\n'
  + '  = n:functionName _ a:argList { return Function_(n, a, text()); }\n'
}
else {
  var functionText = '';
  var functionRule = '';
}

if(areConstants) {
  var constantText = '  / constant\n';
  var constantRule = 'constant\n'
  + '  = main:constantName { return Constant(main, text()); }\n'
}
else {
  var constantText = '';
  var constantRule = '';
}







// todo be more clever about !letter
if(arePrefixPredicates) {
  var predicateName = 'predicateName\n'
  + '  = m:(' + predicates.join(' / ') + ') !letter { return m; }\n'
}
else {
  var predicateName = '';
}


if(areInfixPredicates) {
  var mustNotLetter = infixPredicates.filter(function(x){return x.match(/[A-Za-z0-9]"$/);}).join(' / ');
  var mayLetter = infixPredicates.filter(function(x){return x.match(/[^A-Za-z0-9]"$/);}).join(' / ');
  var infixPredicateName = (mustNotLetter ? (' / m:(' + mustNotLetter + ') !letter { return m; }\n') : '')
    + (mayLetter ? (' / m:(' + mayLetter + ') { return m; }\n') : '')
}
else {
  var infixPredicateName = '';
}

if(areFunctions) {
  var functionName = 'functionName\n'
  + '  = m:(' + functions.join(' / ') + ') !letter { return m; }\n'
}
else {
  var functionName = '';
}

if(areConstants) {
  var constantName = 'constantName\n'
  + '  = m:(' + constants.join(' / ') + ') !letter { return m; }\n'
}
else {
  var constantName = '';
}




var grammar = ''
+ 'start\n'
+ '  = _ main:formula _ { return main; }\n'
+ '\n'
+ 'formula\n'
+ '  = head:bicondExpr tail:(_ bicondExpr)+ { return starOp(ErrorFormulaConcat, head, tail, text(), 1); } // error\n'
+ '  / bicondExpr\n'
+ '\n'
+ 'bicondExpr\n'
+ '  = head:impliesExpr tail:( _ bicondName _ impliesExpr)* { return starOp(Bicond, head, tail, text()); }\n'
+ '\n'
+ 'impliesExpr\n'
+ '  = head:orExpr tail:( _ impliesName _ orExpr)* { return starOp(Implies, head, tail, text()); }\n'
+ '\n'
+ 'orExpr\n'
+ '  = head:andExpr tail:( _ orName _ andExpr)* { return starOp(Or, head, tail, text()); }\n'
+ '\n'
+ 'andExpr\n'
+ '  = head:quantifierExpr tail:( _ andName _ quantifierExpr)* { return starOp(And, head, tail, text()); }\n'
+ '\n'
+ 'quantifierExpr\n'
+ '  = q:quantifierName _ v:quantifiedVariable _ ("."/",")? _ n:quantifierExpr { return Quantifier(q, v, n, text()); }\n'
+ '  / negationExpr\n'
+ '\n'
+ 'negationExpr\n'
+ '  = notName _ main:negationExpr { return Not(main, text()); }\n'
+ '  / primaryValue\n'
+ '\n'
+ 'primaryValue\n'
+ '  = predicate\n'
+ '  / parenthetical\n'
+ '  / truthConstant\n'
+ '  / t:term { return ErrorNotValue(t, text()); } // error\n'
+ '\n'
+ 'predicate\n'
+ '  = infixPredicate\n'
+ (arePrefixPredicates?'  / prefixPredicate\n':'')
+ '\n'
+ 'infixPredicate\n'
+ '  = l:__term _ w:infixPredicateName _ r:_rterm { return InfixPredicate(w, l, r, text()); }\n'
+ '\n'
+ 'prefixPredicate\n'
+ '  ='
+ prefixPredicateText
+ ' n:undefinedName _ a:argList { return ErrorUndefinedPredicate(n, a, text()); } // error\n'
+ '\n'
+ 'parenthetical\n'
+ '  = "(" _ main:formula _ ")" { return Parens(main, text()); }\n'
+ '  / a:argList { return ErrorArgList(a, text()); } // error\n'
+ '\n'
+ '__term // for the infixPredicate case, to avoid left recursion and incorrect parses\n'
+ '  = f:('
+ (arePrefixPredicates?'prefixPredicate / ':'')
+ 'parenthetical / truthConstant) { return ErrorNotTerm(f, text()); } // error\n'
+ '  / term\n'
+ '\n'
+ '_rterm\n'
+ '  = /*head:_term tail:(_ _rterm)+ { return starOp(ErrorTermConcat, head, tail, text(), 1); } // expensive error\n'
+ '  /*/ _term\n'
+ '\n'
+ '_term\n'
+ '  = !infixPredicate m:term { return m; }\n'
+ '  / f:formula { return ErrorNotTerm(f, text()); } // error\n'
+ '\n'
+ 'term\n'
+ '  = variable\n'
+ constantText
+ functionText
+ '\n'
+ 'variable\n'
+ '  = !nonVarReservedWord main:[A-Za-z] ![A-Za-z_] !(_ "(") { return Variable(main, text()); }\n'
+ '\n'
+ 'quantifiedVariable\n'
+ '  = main:[A-Za-z] { return Variable(main, text()); }\n'
+ '\n'
+ constantRule
+ '\n'
+ functionRule
+ '\n'
+ 'argList\n'
+ '  = "(" _ head:_rterm _ tail:( _ "," _ _rterm _ )* ")" { return collapseList(head, tail, 3); }\n'
+ '\n'
+ 'reservedWord\n'
+ '  = variable / nonVarReservedWord\n'
+ '  \n'
+ 'nonVarReservedWord\n'
+ '  = truthConstant\n'
+ '  / bicondName / impliesName / orName / andName / quantifierName / notName\n'
+ '  / infixPredicateName ' 
+ (arePrefixPredicates?'/ predicateName ':'')
+ (areConstants?'/ constantName ':'')
+ (areFunctions?'/ functionName ':'')
+ '\n'
+ '\n'
+ 'undefinedName\n'
+ '  = !nonVarReservedWord main:letter+ { return main.join(""); }\n'
+ '\n'
+ 'letter\n'
+ '  = [0-9A-Za-z_]\n'
+ '\n'
+ 'truthConstant\n'
+ '  = main:("T" / "F") { return TruthConstant(main, text()); }\n'
+ '  / "\\u22A4" { return TruthConstant("T", text()); }\n'
+ '  / "\\u22A5" { return TruthConstant("F", text()); }\n'
+ '\n'
+ 'bicondName\n'
+ '  = ("iff") !letter / "<->" / "<=>" / "\\u2194" / "\\u21D4"\n'
+ '\n'
+ 'impliesName\n'
+ '  = ("implies") !letter / "->" / "=>" / "~>" / "\\u2192" / "\\u21D2"\n'
+ '\n'
+ 'orName\n'
+ '  = ("or" / "vee") !letter / "||" / "|" / "\\u2228"\n'
+ '\n'
+ 'andName\n'
+ '  = ("and" / "wedge") !letter / "&&" / "&" / "\\u2227"\n'
+ '\n'
+ 'quantifierName\n'
+ '  = forallName / existsName\n'
+ '\n'
+ 'forallName\n'
+ '  = (("forall" / "Forall" / "for all" / "A") !letter / "\\u2200") { return "forall"; }\n'
+ '  \n'
+ 'existsName\n'
+ '  = (("exists" / "Exists" / "E") !letter / "\\u2203") { return "exists"; }\n'
+ '\n'
+ 'notName\n'
+ '  = ("not" / "neg") !letter / "!" / "~" / "\\u00AC"\n'
+ '\n'
+ '_ // whitespace\n'
+ '  = (" " / "\\t")*\n'
+ '\n'
+ predicateName
+ '\n'
+ 'infixPredicateName\n'
+ '  = "="'
+ infixPredicateName
+ '\n'
+ functionName
+ '\n'
+ constantName

//console.log(grammar);
return PEG.buildParser(grammar);

}