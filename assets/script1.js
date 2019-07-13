let test1 = global.params.test1 + ", test1 from my script";
let test2 = global.params.test2 + ", test2 from my script";
let sum = global.params.test3 + global.params.test4;
({test1: test1, test2: test2, sum: sum, params: global.params, meta: global.meta} );
