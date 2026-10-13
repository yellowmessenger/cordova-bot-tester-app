#!/usr/bin/env node
// Recent Xcode SDKs only build iOS 15.0+, but the YMChat pod (and its
// resource bundle) still declare iOS 12.0. Cordova generates the Podfile, so
// there's no post_install block to fix this in; raise the targets in the Pods
// project right before compiling instead.
const fs = require('fs');
const path = require('path');

const MIN_IOS = 15.0;

module.exports = function (context) {
  const pbxproj = path.join(
    context.opts.projectRoot,
    'platforms/ios/Pods/Pods.xcodeproj/project.pbxproj',
  );
  if (!fs.existsSync(pbxproj)) return;

  const original = fs.readFileSync(pbxproj, 'utf8');
  const updated = original.replace(
    /IPHONEOS_DEPLOYMENT_TARGET = "?([\d.]+)"?;/g,
    (match, version) =>
      parseFloat(version) < MIN_IOS ? `IPHONEOS_DEPLOYMENT_TARGET = ${MIN_IOS.toFixed(1)};` : match,
  );
  if (updated !== original) {
    fs.writeFileSync(pbxproj, updated);
    console.log(`[hook] Raised Pods deployment targets to iOS ${MIN_IOS.toFixed(1)}`);
  }
};
