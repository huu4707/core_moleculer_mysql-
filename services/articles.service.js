const DbService = require("moleculer-db");
const db = require('../lib/db');
const { reponseAPI } = require('../lib/reponse');
const md5 = require('md5');
const moment = require('moment');

module.exports = {
  name: "articles",

  mixins: [DbService],

  adapter: new DbService.MemoryAdapter(),

  settings: {
    // Available fields
    fields: ["_id", "title", "content", "author", "votes", "created"],

    // Populating
    populates: {
      author: {
        action: "users.get",
        params: {
          fields: ["firstName", "lastName"]
        }
      }
    },

    // Validation schema for insert & update
    entityValidator: {
      title: { type: "string", empty: false },
      content: { type: "string" },
      author: { type: "string", empty: false }
    }
  },

  hooks: {
    before: {
    },
    after: {
      async create(ctx) {
        try {
          let { title , content, author } = ctx.params;
          ctx.params._id = md5(title + content + author + moment().format('MMMM Do YYYY, h:mm:ss a'));
          ctx.params.votes = 0;
          let data = await db.excuteQuery("INSERT INTO articles(_id, title , content, author) values(?,?,?, ?)", [ctx.params._id, title , content, author]);
          if(data && data.affectedRows) {
            await this.adapter.insertMany(ctx.params);
            return reponseAPI({status: true, message: "Insert success", data: []})
          } else{
            return reponseAPI({status: false, message: "Insert fail", data: []})
          }
        } catch (error) {
          return reponseAPI({status: false, message: error.message, data: []})
        }
      },

      async update(ctx) {
        try {
           let { id, title , content, author } = ctx.params;
           let data = await db.excuteQuery("UPDATE articles SET title=?, content=?, author=? WHERE _id=? ", [ title , content, author, id]);
           if(data && data.affectedRows) {
            await this.adapter.updateById(id,ctx.params);
            return reponseAPI({status: true, message: "update success", data: []})
          } else{
            return reponseAPI({status: false, message: "update fail", data: []})
          }
        } catch (error) {
          return reponseAPI({status: false, message: error.message, data: []})
        }
        //update db
      },
      async remove(ctx) {
        try {
          let { id } = ctx.params;
          let result = await db.excuteQuery("DELETE FROM articles WHERE _id=?", [id]);
          if(result) {
            await this.adapter.removeById(id,ctx.params);
            return reponseAPI({status: true, message: "remove success", data: []})
          }
        } catch (error) {
          return reponseAPI({status: false, message: error.message, data: []})
        }
        
      }
    }
  },

  actions: {
    // Define new actions
    vote: {
      params: {
        id: { type: "string" }
      },
      async handler(ctx) {
        const res = await this.adapter.updateById(ctx.params.id, {
          $inc: { votes: 1 }
        });
        return await this.transformDocuments(ctx, {}, res);
      }
    },

    unvote: {
      params: {
        id: { type: "string" }
      },
      async handler(ctx) {
        const res = await this.adapter.updateById(ctx.params.id, {
          $inc: { votes: -1 }
        });
        return await this.transformDocuments(ctx, {}, res);
      }
    }
  },

  methods: {
    async seedDB() {
      this.logger.info("Seed articles database...");
      const articles = await db.findAllQuery("SELECT * FROM articles", []);
      const savedArticles = await this.adapter.insertMany(articles);
      this.logger.info(`Created ${savedArticles.length} articles.`);
    }
  },

  async started() {
    if ((await this.adapter.count()) === 0) {
      await this.seedDB();
    } else {
      this.logger.info(`DB contains ${await this.adapter.count()} articles.`);
    }
  },

  stopped() {}
};
