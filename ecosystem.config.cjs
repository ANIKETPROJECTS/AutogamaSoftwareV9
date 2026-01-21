module.exports = {
  apps: [{
    name: "autogarage-crm",
    script: "./dist/index.cjs",
    env: {
      NODE_ENV: "production",
      PORT: "3002",
      MONGODB_URI: "mongodb://localhost:27017/autogarage",
      SESSION_SECRET: "VaTxAJhw8TLyw9i0uyyY376FNe6Dq5mi0zOEjpLiKFlcrfcDD44G4XWE7Lhf+DyR7tYvcq6YaVpBlJpDCp5qCA=="
    }
  }]
};
