// deno-lint-ignore-file no-unused-vars
import Environment from "../environment.ts";
import { MK_NATIVE_FN, NumberVal } from "../values.ts";
import { MK_NUMBER } from "../values.ts";

export function SetupMathFunctions(env: Environment) {
    // abs()
    env.declareVar("abs", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `abs() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `abs() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.abs(num.value));
    }), true);

    // ceil()
    env.declareVar("ceil", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `ceil() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `ceil() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.ceil(num.value));
    }), true);
    // floor()
    env.declareVar("floor", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `floor() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `floor() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;
        
        return MK_NUMBER(Math.floor(num.value));
    }), true);

    // max()
    env.declareVar("max", MK_NATIVE_FN((args, scope) => {
        if (args.length < 2)
            throw `max() expects at least 2 arguments, got ${args.length}.`;

        for (const arg of args) {
            if (arg.type != "number")
                throw `max() expects all arguments to be numbers, got ${arg.type}.`;
        }

        const max = Math.max(...args.map(arg => (arg as NumberVal).value));
        return MK_NUMBER(max);
    }), true);

    // min()
    env.declareVar("min", MK_NATIVE_FN((args, scope) => {
        if (args.length < 2)
            throw `min() expects at least 2 arguments, got ${args.length}.`;

        for (const arg of args) {
            if (arg.type != "number")
                throw `min() expects all arguments to be numbers, got ${arg.type}.`;
        }

        const min = Math.min(...args.map(arg => (arg as NumberVal).value));
        return MK_NUMBER(min);
    }), true);

    // pow()
    env.declareVar("pow", MK_NATIVE_FN((args, scope) => {
        if (args.length != 2)
            throw `pow() expects 2 arguments, got ${args.length}.`;

        for (const arg of args) {
            if (arg.type != "number")
                throw `pow() expects all arguments to be numbers, got ${arg.type}.`;
        }

        const base = args[0] as NumberVal;
        const exponent = args[1] as NumberVal;

        return MK_NUMBER(Math.pow(base.value, exponent.value));
    }), true);

    // round()
    env.declareVar("round", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `round() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `round() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.round(num.value));
    }), true);

    // sqrt()
    env.declareVar("sqrt", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `sqrt() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `sqrt() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.sqrt(num.value));
    }), true);

    // trunc()
    env.declareVar("trunc", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `trunc() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `trunc() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.trunc(num.value));
    }), true);

    // random()
    // env.declareVar("random", MK_NATIVE_FN((args, scope) => {
    //     if (args.length != 0)
    //         throw `random() expects 0 arguments, got ${args.length}.`;

    //     return MK_NUMBER(Math.random());
    // }), true);

    // sin()
    env.declareVar("sin", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `sin() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `sin() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.sin(num.value));
    }), true);

    // cos()
    env.declareVar("cos", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `cos() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `cos() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.cos(num.value));
    }), true);

    // tan()
    env.declareVar("tan", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `tan() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `tan() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.tan(num.value));
    }), true);

    // asin()
    env.declareVar("asin", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `asin() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `asin() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.asin(num.value));
    }), true);

    // acos()
    env.declareVar("acos", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `acos() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `acos() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.acos(num.value));
    }), true);

    // atan()
    env.declareVar("atan", MK_NATIVE_FN((args, scope) => {
        if (args.length != 1)
            throw `atan() expects 1 argument, got ${args.length}.`;

        if (args[0].type != "number")
            throw `atan() expects argument 1 to be a number, got ${args[0].type}.`;

        const num = args[0] as NumberVal;

        return MK_NUMBER(Math.atan(num.value));
    }), true);

    // PI()
    env.declareVar("PI", MK_NUMBER(Math.PI), true);
    
    // E()
    env.declareVar("E", MK_NUMBER(Math.E), true);

    // LN2()
    env.declareVar("LN2", MK_NUMBER(Math.LN2), true);

    // LN10()
    env.declareVar("LN10", MK_NUMBER(Math.LN10), true);

    // LOG2E()
    env.declareVar("LOG2E", MK_NUMBER(Math.LOG2E), true);

    // LOG10E()
    env.declareVar("LOG10E", MK_NUMBER(Math.LOG10E), true);

    // SQRT1_2()
    env.declareVar("SQRT1_2", MK_NUMBER(Math.SQRT1_2), true);
    
    // SQRT2()
    env.declareVar("SQRT2", MK_NUMBER(Math.SQRT2), true);

    env.declareVar("time", MK_NATIVE_FN((_args, _scope) => {
        return MK_NUMBER(Date.now());
    }), true);
}