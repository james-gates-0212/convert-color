const color = require('color');
const fs = require('fs');
const path = require('path');

const channels = ['red', 'green', 'blue', 'alpha'];

const sourceColor = color('#8a49a8');
const targetColor = color('#1a73e8');

const calcDiffEachChannel = () => {
  const diff = {};
  for (const channel of channels) {
    diff[channel] =
      targetColor[channel]() - sourceColor[channel]();
  }
  return diff;
};

const diff = calcDiffEachChannel();

console.log('difference', diff);

const patterns = [/(#[\da-f]{6})/gi];

function fromDir(startPath, filter) {
  if (!fs.existsSync(startPath)) {
    console.log('no dir ', startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDir(filename, filter);
    } else if (filename.endsWith(filter)) {
      var buffer = fs.readFileSync(filename);
      var content = buffer.toString();
      var replaced = 0;
      const convertColor = (colorString) => {
        let newColor = color(colorString);
        for (const channel of channels) {
          let newChannelValue =
            newColor[channel]() + diff[channel];
          if (newChannelValue > 255) {
            newChannelValue = 255;
          }
          if (newChannelValue < 0) {
            newChannelValue = 0;
          }
          newColor = newColor[channel](newChannelValue);
        }
        const replacer =
          newColor.alpha() === 1
            ? newColor.hex()
            : newColor.rgb();
        replaced++;
        return replacer;
      };
      for (const pattern of patterns) {
        content = content.replace(pattern, convertColor);
      }
      fs.writeFileSync(filename, content);
      if (replaced) {
        console.log('-- found: ', filename);
        console.log(`>>>`, replaced, `replaced.`);
      }
    }
  }
}

const exts = ['.js', '.jsx', '.scss', '.svg'];
const paths = ['../react-portfolio/src/'];

for (const path of paths) {
  for (const ext of exts) {
    fromDir(path, ext);
  }
}
