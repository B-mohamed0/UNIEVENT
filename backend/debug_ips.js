const os = require('os');
const interfaces = os.networkInterfaces();
for (const name of Object.keys(interfaces)) {
  console.log(`Interface: ${name}`);
  for (const iface of interfaces[name]) {
    console.log(`  ${iface.family} ${iface.address} (internal: ${iface.internal})`);
  }
}
