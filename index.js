const color = require('color');
const fs = require('fs');
const path = require('path');

const channels = {
  saturationl: 100,
  lightness: 100,
  alpha: 1,
};

const sourceColor = color('#8a49a8');
const targetColor = color('#344767');

const targetHue = targetColor.hue();

const calcDiffEachChannel = () => {
  const diff = {};
  for (const channel of Object.keys(channels)) {
    diff[channel] =
      targetColor[channel]() - sourceColor[channel]();
  }
  return diff;
};

const diff = calcDiffEachChannel();

console.log('difference', diff);

const patterns = [
  /(#[\da-f]{6})/gi,
  /(#[\da-f]{8})/gi,
  /(rgb\([\d]+,[ ]*[\d]+,[ ]*[\d]+\))/gi,
  /(rgba\([\d]+,[ ]*[\d]+,[ ]*[\d]+,[ ]*[\d]*[\.]?[\d]*\))/gi,
];

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
        let newColor = color(colorString.toLowerCase()).hue(
          targetHue,
        );
        for (const channel of Object.keys(channels)) {
          let newChannelValue =
            newColor[channel]() + diff[channel];
          if (newChannelValue > channels[channel]) {
            newChannelValue = channels[channel];
          }
          if (newChannelValue < 0) {
            newChannelValue = 0;
          }
          newColor = newColor[channel](newChannelValue);
        }
        // newColor = color(colorString.toLowerCase());
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
