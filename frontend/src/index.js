// Parse mode and submode, use argv
const mode = process.argv[2];
const submode = process.argv[3];

if (mode === 'client' && submode === 'store') {
    return;
}

console.log("Start frontend here!!!");