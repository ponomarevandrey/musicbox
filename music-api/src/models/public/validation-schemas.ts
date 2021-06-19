import Joi from "joi";

import {
  SORT_BY,
  SORT_ORDER,
  PER_PAGE_NUMS,
  SUPPORTED_CODEC,
} from "../../config/constants";

/*
 * Schemas used in pagination middlewares
 */

export const schemaSort = Joi.object()
  .keys({
    sortBy: Joi.string()
      .valid(...SORT_BY)
      .messages({
        "string.base": `"sort" must be a type of 'string'`,
        "any.only": `"sort" must be one of [${SORT_BY.join(", ")}]`,
        "any.required": `"sort" is required`,
      }),
    sortOrder: Joi.string()
      .valid(...SORT_ORDER)
      .messages({
        "string.base": `"sort" must be a type of 'string'`,
        "any.only": `Sort order in "sort" must be one of [${SORT_ORDER.join(
          ", ",
        )}]`,
        "any.required": `Sort order in "sort" is required`,
      }),
  })
  .options({ presence: "required" });

export const schemaPaginate = Joi.object({
  page: Joi.number().integer().min(1).messages({
    "number.base": `"page" must be a type of 'number'`,
    "number.integer": `"page" must be an integer`,
    "number.min": `"page" minimum value is "1"`,
    "any.required": `"page" is required`,
  }),
  itemsPerPage: Joi.number()
    .integer()
    .valid(...PER_PAGE_NUMS)
    .messages({
      "number.base": `"limit" must be a type of 'number'`,
      "number.integer": `"limit" must be an integer`,
      "any.only": `"limit" must be one of [${PER_PAGE_NUMS.join(", ")}]`,
      "any.required": `"limit" is required`,
    }),
}).options({ presence: "required" });

export const schemaSortAndPaginate = Joi.object({
  sortBy: Joi.string().valid(...SORT_BY),
  sortOrder: Joi.string().valid(...SORT_ORDER),
  page: Joi.number().integer().min(1).optional(),
  itemsPerPage: Joi.number()
    .integer()
    .valid(...PER_PAGE_NUMS),
});

/*
 * Schemas used in Model/Controller
 */

export const schemaCreateRelease = Joi.object({
  artist: Joi.string().min(0).max(200),
  year: Joi.number()
    .integer()
    .min(0)
    .max(new Date().getFullYear() + 1)
    .required()
    .optional(),
  title: Joi.string().min(0).max(200),
  label: Joi.string().min(0).max(200),
  coverPath: Joi.string().optional(),
  catNo: Joi.string().max(255).allow(null),
}).options({ presence: "required" });

export const schemaUpdateRelease = schemaCreateRelease.keys({
  id: Joi.number().integer().min(1).required(),
});

export const schemaCreateTrack = Joi.object({
  releaseId: Joi.number().integer().min(1),
  filePath: Joi.string().min(1).max(255).allow(null).optional(),
  extension: Joi.string()
    .valid(...SUPPORTED_CODEC)
    .optional(),
  artist: Joi.array().items(Joi.string().min(0).max(200)),
  duration: Joi.number().min(0),
  bitrate: Joi.number().min(0).allow(null),
  trackNo: Joi.number().integer().allow(null),
  title: Joi.string().min(0).max(200),
  diskNo: Joi.number().integer().allow(null),
  genre: Joi.array().items(Joi.string()),
}).options({ presence: "required" });

export const schemaUpdateTrack = schemaCreateTrack.keys({
  trackId: Joi.number().min(1).required(),
  releaseId: Joi.number().integer().min(1).optional(),
});

export const schemaId = Joi.number().integer().min(1).required().messages({
  "number.base": `"id" must be a type of 'number'`,
  "number.integer": `"id" must be an integer`,
  "number.min": `"id" minimum value is "1"`,
  "any.required": `"id" is required`,
});

export const schemaCatNo = Joi.string().min(1).max(255).required().messages({
  "string.base": `"catNo" must be a type of 'string'`,
  "number.min": `"catNo" min length is 1 symbol`,
  "number.max": `"catNo" max length is 255 symbols`,
  "any.required": `"id" is required`,
});