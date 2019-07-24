function main() {
    let exp = "context + 1";
    const func = new Function("context", `with(context){ console.log(context);return ${exp} }`);
    return func(global.params.val);
}
main();