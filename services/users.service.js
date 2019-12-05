const Fakerator = require("fakerator");
const fakerator = Fakerator();
const DbService = require("moleculer-db");
const db = require('../lib/db');

module.exports = {
  name: "users",

  mixins: [DbService],

  adapter: new DbService.MemoryAdapter(),

  settings: {
    // Available fields
    fields: ["_id", "firstName", "lastName", "email", "avatar", "status"]
  },

  actions: {},

  methods: {
    /**
     * Seeding Users DB
     */
    async seedDB() {
      this.logger.info("Seed Users database...");
      const users = await db.findAllQuery("SELECT * FROM users", []);
      const savedUsers = await this.adapter.insertMany(users);
      this.logger.info(`Created ${savedUsers.length} users.`);
    }
  },

  /**
   * Service started lifecycle event handler
   */
  async started() {
    if ((await this.adapter.count()) === 0) {
      await this.seedDB();
    } else {
      this.logger.info(`DB contains ${await this.adapter.count()} users.`);
    }
  },

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {}
};
