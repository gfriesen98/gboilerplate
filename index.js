#!/usr/bin/env node

const chalk = require('chalk');
const clear = require('clear');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');
const {exec} = require('child_process');
const clui = require('clui');
const Spinner = clui.Spinner;

// check args for dirname
const args = process.argv.slice(2);

// get cwd
const getCwd = () => {
  return path.basename(process.cwd());
}

// check if curr folder is an existing git repo
const dirExists = (path) => {
  return fs.existsSync(path);
}

/**
 * Edited the existing package.json to update the name tag using the path entered from 
 * the user.
 * @param {string} name 
 */
function editPackageJSON(name){
  let data = JSON.parse(fs.readFileSync('package.json'));
  data.name = name;
  data = JSON.stringify(data);
  fs.writeFileSync('package.json', data, (err) => {
    console.log("error writing to package.json");
  });
}

/**
 * Takes in a directory and removes it and it's content
 * Essentially rm -Rf [folder]
 * Snippet from https://gist.github.com/tkihira/2367067
 * @param {string} dir 
 */
function rmdir(dir) {
  var list = fs.readdirSync(dir);
  for (var i = 0; i < list.length; i++) {
    var filename = path.join(dir, list[i]);
    var stat = fs.statSync(filename);

    if (filename == '.' || filename == '..') {
      // pass
    } else if (stat.isDirectory()) {
      rmdir(filename);
    } else {
      fs.unlinkSync(filename);
    }
  }
  fs.rmdirSync(dir);
}

/**
 * Main app run
 * @param {string} path 
 */
function run(path) {
  clear();

  // check for directory name collisions
  if (dirExists(path)) {
    console.log(chalk.red("Folder name already exists!"));
    process.exit();
  }

  // create and start a progress spinner
  const cloneSpinner = new Spinner(`Cloning repository into ${path}...`, ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);
  cloneSpinner.start();

  // Run git clone on the repository that contains the boilerplate
  git().clone('https://github.com/gfriesen98/react-router-boilerplate', path).then(() => {

    console.log(chalk.green('Finished'));

    try {
      // chdir into the react folder
      process.chdir(`${process.cwd()}/${path}`);
    } catch (err) {
      console.log(chalk.red(`An error has occurred whilst changing directiory: \n+err`));
    }

    cloneSpinner.message('Removing .git...');
    rmdir('.git'); // remove the .git folder to allow us to create a fresh repository
    console.log(chalk.green('Removed .git'));

    cloneSpinner.message('Updating package.json...');
    editPackageJSON(path); // update the name field in package.json with the name given
    console.log(chalk.green('Updated package.json'));

    // install yarn dependencies for the project
    cloneSpinner.message('Installing dependencies w/yarn...')
    exec('yarn install', (err, stdout, stderr) => {
      if (err) 
        return;
      
      if (stderr) 
        console.log(`STDERR ${
          chalk.yellow(stderr) // print out warnings and errors
        }`);
      

    }).on('exit', () => {
      console.log(chalk.green('Finished'));
      cloneSpinner.stop();
    });

  }).catch((err) => {
    console.log('failed: ', err)
  });
}


// check arguments
switch (args[0]) {
  case 'help':
    console.log("npx gboilerplate [help] [name folderName]");
    break;

  case 'name':
    run(args[1]);
    break;

  default:
    console.log("Argument not found.");
}
