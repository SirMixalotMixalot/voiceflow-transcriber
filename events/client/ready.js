module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Ready! Set! Go!!! ${client.user.tag} is logged in and online`);
  },
};
