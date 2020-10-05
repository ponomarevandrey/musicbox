const logger = require("./../utility/loggerConf.js");
const express = require("express");
const router = express.Router();
const artist = require("../model/artist/queries.js");
const util = require("util");

router.get("/", async (req, res, next) => {
  try {
    const artists = await artist.readAll();
    logger.debug(`${__dirname}/${__filename}: ${util.inspect(artists)}`);
    res.send(JSON.stringify(artists));
  } catch (err) {
    next(err);
  }
});

module.exports.router = router;
