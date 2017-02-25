kConfig = {
  /* Which relations we want displayed, and the order in which
   * we'd like them displayed.
   */
  relationTypes: [
    { 
      func: isReflexive,
      name: "Reflexive"
    },
    { 
      func: isIrreflexive,
      name: "Irreflexive"
    },
    { 
      func: isSymmetric,
      name: "Symmetric"
    },
    { 
      func: isAsymmetric,
      name: "Asymmetric"
    },
    { 
      func: isTransitive,
      name: "Transitive"
    },
    { 
      func: isEquivalenceRelation,
      name: "Equivalence&nbsp;Relation"
    },

    { 
      func: isStrictOrder,
      name: "Strict&nbsp;Order"
    },
  ],
  
  /* How many objects are in the underlying domain. */
  domainSize: 6
};
