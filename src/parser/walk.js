function visit(node, fn){
    const holder = fn(node);
    if(holder === false){
        return;
    }
    for(let i = 0; i < node.namedChildCount; i++){
        const child = node.namedChild(i);
        visit(child, fn);
    }
}

function collect(node, predicate){
    const results = [];
    visit(node, n=> {
        if(predicate(n))results.push(n);
    });
    return results;
}

function rangeOf(node){
    return { start: node.startPosition, end: node.endPosition};
}