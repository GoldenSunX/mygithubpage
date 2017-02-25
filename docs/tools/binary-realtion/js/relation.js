/**
 * Utility functions to determine the various properties of given binary relations.
 * These functions take the relation as a boolean matrix indicating where the
 * relation holds, then return true or false based on the particular property
 * in question.
 *
 * Not all of these are actually used. The config file specifies which ones we
 * actually want.
 */

/* Returns whether the relation is reflexive. */
function isReflexive(relation, numEntries) {
    for (var i = 0; i < numEntries; i++) {
        if (!relation[i][i]) return false;
    }
    return true;
}

/* Returns whether the relation is irreflexive. */
function isIrreflexive(relation, numEntries) {
    for (var i = 0; i < numEntries; i++) {
        if (relation[i][i]) return false;
    }
    return true;
}

/* Returns whether the relation is symmetric. */
function isSymmetric(relation, numEntries) {
    for (var i = 0; i < numEntries; i++) {
        for (var j = 0; j < numEntries; j++) {
            if (relation[i][j] && !relation[j][i]) return false;
        }
    }
    return true;
}

/* Returns whether the relation is asymmetric. */
function isAsymmetric(relation, numEntries) {
    for (var i = 0; i < numEntries; i++) {
        for (var j = 0; j < numEntries; j++) {
            if (relation[i][j] && relation[j][i]) return false;
        }
    }
    return true;
}

/* Returns whether the relation is antisymmetric. */
function isAntisymmetric(relation, numEntries) {
    for (var i = 0; i < numEntries; i++) {
        for (var j = 0; j < numEntries; j++) {
            if (i != j && relation[i][j] && relation[j][i]) return false;
        }
    }
    return true;
}

/* Returns whether the relation is total. */
function isTotal(relation, numEntries) {
    for (var i = 0; i < numEntries; i++) {
        for (var j = 0; j < numEntries; j++) {
            if (!relation[i][j] && !relation[j][i]) return false;
        }
    }
    return true;
}

/* Returns whether the relation is trichotomous. */
function isTrichotomous(relation, numEntries) {
    for (var i = 0; i < numEntries; i++) {
        for (var j = 0; j < numEntries; j++) {
            if ((i != j && (relation[i][j] === relation[j][i])) ||
                (i == j && relation[i][j])) return false;
        }
    }
    return true;
}

/* Returns whether the relation is transitive. */
function isTransitive(relation, numEntries) {
    for (var i = 0; i < numEntries; i++) {
        for (var j = 0; j < numEntries; j++) {
            for (var k = 0; k < numEntries; k++) {
                if (relation[i][j] && relation[j][k] && !relation[i][k])
                    return false;
            }
        }
    }
    return true;
}

/* Returns whether the relation is an equivalence relation. */
function isEquivalenceRelation(relation, numEntries) {
    return isReflexive(relation, numEntries) &&
           isSymmetric(relation, numEntries) &&
           isTransitive(relation, numEntries);
}

/* Returns whether the relation is a partial order. */
function isPartialOrder(relation, numEntries) {
    return isReflexive(relation, numEntries) &&
           isAntisymmetric(relation, numEntries) &&
           isTransitive(relation, numEntries);
}

/* Returns whether the relation is a total order. */
function isTotalOrder(relation, numEntries) {
    return isPartialOrder(relation, numEntries) &&
           isTotal(relation, numEntries);
}

/* Returns whether the relation is a strict order. */
function isStrictOrder(relation, numEntries) {
    return isIrreflexive(relation, numEntries) &&
           isTransitive(relation, numEntries);
}

/* Returns whether the relation is a linear order. */
function isLinearOrder(relation, numEntries) {
    return isTrichotomous(relation, numEntries) &&
           isTransitive(relation, numEntries);
}

/* Returns whether the relation is a preorder. */
function isPreorder(relation, numEntries) {
    return isReflexive(relation, numEntries) &&
           isTransitive(relation, numEntries);
}

/* Given a list of properties to check for, in the form
 *
 *   { name: display-name, func: test-function }
 *
 * evaluates which properties the given relationship has and returns
 * a human-readable string containing them.
 */
function propertiesOf(relation, numEntries, testProps) {
    var properties = [];

    for (var i in testProps) {
        if (testProps[i].func(relation, numEntries)) {
            properties.push(testProps[i].name);
        }
    }

    var result = "";
    for (var i in properties) {
        result += properties[i];
        if (i != properties.length - 1) {
            result += ", ";
        }
    }

    return result === ""? "&nbsp;" : result;
}
