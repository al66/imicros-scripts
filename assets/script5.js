function evaluate (expression, context) {
    const func = new Function("context", `with(context){ return ${expression} }`); // eslint-disable-line no-new-func
    return func(context);
}

function main() {
    let exp = "evaluate(process.exit(),context)";
    const func = new Function("context", `with(context){ return ${exp} }`);
    return func(global.val);
}
main();