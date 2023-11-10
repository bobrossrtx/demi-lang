function run() {
    let currentTest = 0
    for (const file of Deno.readDirSync('benchmark/tests')) {
        if (file.isFile) {
            const name = file.name
            const path = `benchmark/tests`
            const mainPath = '../main.ts';
            const cmd = `deno run --allow-read --allow-write --allow-net --allow-env ${mainPath} ${path}`
            console.log(`Test ${currentTest} | ${(name.split(".")[0])}`)
            Deno.bench(`[${currentTest} - ${name}]`, () => {
                // deno-lint-ignore no-deprecated-deno-api
                Deno.run({
                    cmd: cmd.split(' '),
                    stdout: 'null',
                    stderr: 'null'
                })
            })
            currentTest++
        }
    }
}

run()