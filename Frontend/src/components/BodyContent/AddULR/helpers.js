
export function locationGenerator() {

    const options = [];

    for (let i = 0; i < 10; i++) {

        options.push({ value: i, label: i })

    }

    return options;
}