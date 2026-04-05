const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deploy() {
    console.log('--- Calibmaster Deployment Workflow ---');

    // 1. Get Environment
    const env = await question('Select Environment (development/test/production) [development]: ') || 'development';
    if (!['development', 'test', 'production'].includes(env)) {
        console.error('Invalid environment selected.');
        process.exit(1);
    }

    // 2. Get Frontend URLs
    console.log('\n--- Frontend Configuration ---');
    const calibmasterUrl = await question(`Enter Calibmaster URL for ${env}: `);
    const customerPortalUrl = await question(`Enter CustomerPortal URL for ${env}: `);

    // 3. Update Frontend Config
    const feConfigPath = path.join(__dirname, '..', 'calibmaster-frontend', 'src', 'utils', 'config.json');
    if (fs.existsSync(feConfigPath)) {
        console.log(`Updating frontend config at: ${feConfigPath}`);
        const feConfig = JSON.parse(fs.readFileSync(feConfigPath, 'utf8'));
        feConfig.Calibmaster.URL = calibmasterUrl;
        feConfig.CustomerPortal.URL = customerPortalUrl;
        fs.writeFileSync(feConfigPath, JSON.stringify(feConfig, null, 2));
    } else {
        console.warn(`Frontend config not found at ${feConfigPath}. Skipping URL update.`);
    }

    // 4. Build Frontend
    console.log('\n--- Building Frontend ---');
    const feDir = path.join(__dirname, '..', 'calibmaster-frontend');
    try {
        console.log(`Running build in: ${feDir}`);
        execSync('npm run build', { cwd: feDir, stdio: 'inherit' });
    } catch (error) {
        console.error('Frontend build failed.');
        process.exit(1);
    }

    // 5. Sync Build to Backend Public
    console.log('\n--- Syncing Build to Backend ---');
    const feDistDir = path.join(feDir, 'dist');
    const bePublicDir = path.join(__dirname, 'public');

    if (!fs.existsSync(feDistDir)) {
        console.error(`Build output not found at ${feDistDir}`);
        process.exit(1);
    }

    // Define what to replace
    const itemsToReplace = ['assets', 'index.html', 'favicon.ico', 'manifest.json', 'vite.svg', 'robots.txt', 'static'];

    itemsToReplace.forEach(item => {
        const srcPath = path.join(feDistDir, item);
        const destPath = path.join(bePublicDir, item);

        if (fs.existsSync(srcPath)) {
            console.log(`Replacing ${item}...`);
            // If it's a directory, we need to handle it
            if (fs.lstatSync(srcPath).isDirectory()) {
                if (fs.existsSync(destPath)) {
                    fs.rmSync(destPath, { recursive: true, force: true });
                }
                fs.cpSync(srcPath, destPath, { recursive: true });
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    });

    // 6. Get Backend DB Details
    console.log('\n--- Backend Database Configuration ---');
    console.log(`Configuring database for environment: ${env}`);
    const dbHost = await question('Enter DB Host: ');
    const dbName = await question('Enter Database Name: ');
    const dbUser = await question('Enter DB Username: ');
    const dbPass = await question('Enter DB Password: ');

    // 7. Update Backend Config
    const beConfigPath = path.join(__dirname, 'config', 'config.json');
    if (fs.existsSync(beConfigPath)) {
        console.log(`Updating backend config at: ${beConfigPath}`);
        const beConfig = JSON.parse(fs.readFileSync(beConfigPath, 'utf8'));
        
        if (beConfig[env]) {
            beConfig[env].host = dbHost;
            beConfig[env].database = dbName;
            beConfig[env].username = dbUser;
            beConfig[env].password = dbPass;
            fs.writeFileSync(beConfigPath, JSON.stringify(beConfig, null, 4));
        } else {
            console.error(`Environment ${env} not found in backend config.`);
        }
    } else {
        console.error(`Backend config not found at ${beConfigPath}`);
    }

    console.log('\n--- Deployment Preparation Complete! ---');
    rl.close();
}

deploy().catch(err => {
    console.error(err);
    process.exit(1);
});
