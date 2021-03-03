"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAll = void 0;
const logger_conf_1 = require("../../../config/logger-conf");
const postgres_1 = require("../../postgres");
function readAll() {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield postgres_1.connectDB();
        try {
            const readGenresQuery = {
                text: 'SELECT genre_id AS "genreId", name \
         FROM genre \
         ORDER BY name ASC;',
            };
            const genres = (yield pool.query(readGenresQuery)).rows;
            return genres;
        }
        catch (err) {
            logger_conf_1.logger.error(`Can't read genre names: ${err.stack}`);
            throw err;
        }
    });
}
exports.readAll = readAll;
//# sourceMappingURL=queries.js.map