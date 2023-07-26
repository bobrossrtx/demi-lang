// deno-lint-ignore-file no-unused-vars
import Environment from "../environment.ts";
import { MK_NATIVE_FN, MK_NULL, MK_NUMBER } from "../values.ts";

export function SetupTimeFunctions(env: Environment) {
    // get_time()
    env.declareVar("get_time", MK_NATIVE_FN((args, _scope) => {
        return MK_NUMBER(Date.now());
    }), true);

    // year_date()
    env.declareVar("year_date", MK_NATIVE_FN((args, _scope) => {
        return MK_NUMBER(new Date().getFullYear());
    }), true);

    // month_date()
    env.declareVar("month_date", MK_NATIVE_FN((args, _scope) => {
        return MK_NUMBER(new Date().getMonth());
    }), true);

    // day_date()
    env.declareVar("day_date", MK_NATIVE_FN((args, _scope) => {
        return MK_NUMBER(new Date().getDate());
    }), true);

    // hour_time()
    env.declareVar("hour_time", MK_NATIVE_FN((args, _scope) => {
        return MK_NUMBER(new Date().getHours());
    }), true);

    // minute_time()
    env.declareVar("minute_time", MK_NATIVE_FN((args, _scope) => {
        return MK_NUMBER(new Date().getMinutes());
    }), true);

    // second_time()
    env.declareVar("second_time", MK_NATIVE_FN((args, _scope) => {
        return MK_NUMBER(new Date().getSeconds());
    }), true);


    // TODO: uncomment when sleep() I figure out how to make sleep() work
    // // sleep()
    // env.declareVar("sleep", MK_NATIVE_FN((args, _scope) => {
    //     const ms = (args[0]?.value as number);
    //     if (ms == undefined || ms == null)
    //         throw "Cannot sleep for undefined time.";
    //     // Sleep for ms milliseconds
    //     new Promise((resolve, reject) => {
    //         setTimeout(() => {
    //             resolve(MK_NULL());
    //             reject(MK_NULL());
    //         }, ms);
    //     });

    //     return MK_NULL();
    // }), true);
}