// loop through all the files in the examples folder
// and run a deno benchmark on them

function run() {
    let currentTest = 0
    for (const file of Deno.readDirSync('benchmark/tests')) {
        if (file.isFile) {
            const name = file.name
            const path = `../examples/${name}`
            const mainPath = '../main.ts';
            const cmd = `deno run --allow-read --allow-write --allow-net --allow-env ${mainPath} ${path}`
            console.log(`Running ${name}...`)
            Deno.bench(`[${currentTest} - ${name}]`, () => {
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