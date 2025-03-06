function run() {
    let currentTest = 0
    for (const file of Deno.readDirSync('benchmark/tests')) {
        if (file.isFile) {
            const name = file.name
            const path = `benchmark/tests`
            const mainPath = '../main.ts';
            const cmd = `deno run --allow-read --allow-write --allow-net --allow-env ${mainPath} ${path}`
            Deno.bench(`[${currentTest} - ${name}]`, () => {
                // deno-lint-ignore no-deprecated-deno-api
                new Deno.Command(cmd.split(' ')[0], {
                    args: cmd.split(' ').slice(1),
                    stdout: "null",
                    stderr: "null"
                }).spawn()
            })
            currentTest++
        }
    }
}

run()