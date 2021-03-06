import util from "util";

import { logger } from "../../../config/logger";
import { connectDB } from "../../postgres";
import { Release } from "./release";
import {
  schemaSort,
  schemaPaginate,
  schemaId,
  schemaCatNo,
} from "../../validation-schemas";
import {
  ReleaseId,
  PaginatedAPIResponse,
  PaginatedDBResponse,
} from "../../../types";
import { CatNoDBResponse, ReleaseMetaDBResponse } from "./types";
import { schemaUpdateRelease, schemaCreateRelease } from "./validation-schemas";
import { SortParams } from "../../../controllers/middlewares/parse-sort-params";
import { PaginationParams } from "../../../controllers/middlewares/parse-pagination-params";
import { TrackMetaDBResponse } from "../track/types";
import { Track } from "../track/track";

export async function find(catNo: string | null): Promise<boolean> {
  const validCatNo: string = await schemaCatNo.validateAsync(catNo);
  const pool = await connectDB();

  try {
    const findReleaseCatNoQuery = {
      text: "\
				SELECT EXISTS (\
					SELECT \
						1 \
					FROM \
						release \
					WHERE cat_no = $1\
				);",
      values: [validCatNo],
    };
    const response = await pool.query<CatNoDBResponse>(findReleaseCatNoQuery);

    if (response.rowCount > 0) return true;
    else return false;
  } catch (err) {
    logger.error(
      `${__filename}: Error while searching for release in database.`,
    );
    throw err;
  }
}

export async function read(id: unknown): Promise<Release | null> {
  const validatedId: number = await schemaId.validateAsync(id);
  const pool = await connectDB();

  try {
    const getReleaseTextQuery = {
      text: "\
				SELECT\
					* \
				FROM \
					view_release \
				WHERE \
					id=$1;\
				",
      values: [validatedId],
    };
    const response = await pool.query<ReleaseMetaDBResponse>(
      getReleaseTextQuery,
    );

    if (response.rowCount > 0) {
      const release = new Release(response.rows[0]);
      logger.debug(`filePath: ${__filename} \n${util.inspect(release)}`);
      return release;
    } else {
      return null;
    }
  } catch (err) {
    logger.error(`${__filename}: Error while reading a release.`);
    throw err;
  }
}

export async function readAll({
  sort,
  pagination,
}: {
  sort: SortParams;
  pagination: PaginationParams;
}): Promise<PaginatedAPIResponse<Release>> {
  const { sortBy, sortOrder } = await schemaSort.validateAsync(sort);
  const { page, itemsPerPage } = await schemaPaginate.validateAsync(pagination);

  const pool = await connectDB();

  try {
    const readReleasesQuery = {
      text: `
				SELECT \
				\
					(SELECT \
					   COUNT (*) \
						 FROM \
							 view_release\
					)::integer AS total_count, \
					\
					(SELECT \
						 json_agg(t.*) \
					 FROM \
						 (SELECT \
								* \
							FROM \
								view_release \
							ORDER BY \
								CASE WHEN $1 = 'asc' THEN "${sortBy}" END ASC, \
								CASE WHEN $1 = 'asc' THEN id END ASC, \
								CASE WHEN $1 = 'desc' THEN "${sortBy}" END DESC, \
								CASE WHEN $1 = 'desc' THEN id END DESC \
							LIMIT \
								$3::integer \
							OFFSET \
								($2::integer - 1) * $3::integer \
						 ) AS t) \
				\
        AS items; \
        `,
      values: [sortOrder, page, itemsPerPage],
    };

    const res = await pool.query<PaginatedDBResponse<ReleaseMetaDBResponse>>(
      readReleasesQuery,
    );

    const isResponseEmpty =
      res.rowCount === 0 || res.rows[0].total_count === 0 || !res.rows[0].items;

    if (isResponseEmpty) {
      return { items: [], totalCount: 0 };
    } else {
      const releases = res.rows[0].items.map((row) => new Release(row));
      return { items: releases, totalCount: res.rows[0].total_count };
    }
  } catch (err) {
    logger.error(`${__filename}: Can't read releases names.`);
    throw err;
  }
}

export async function readByReleaseId(releaseId: unknown): Promise<{
  tracks: Track[];
}> {
  const validatedReleaseId: number = await schemaId.validateAsync(releaseId);
  const pool = await connectDB();

  try {
    const getTracksTextQuery = {
      text: '\
				SELECT \
					* \
				FROM \
					view_track_short \
				WHERE \
					release_id = $1 \
				ORDER BY \
					"track_no", \
					"disk_no";\
				',
      values: [validatedReleaseId],
    };
    const response = await pool.query<TrackMetaDBResponse>(getTracksTextQuery);

    if (response.rowCount > 0) {
      const tracks = response.rows.map((row) => {
        return new Track(row);
      });
      logger.debug(`filePath: ${__filename} \n${util.inspect(tracks)}`);
      return { tracks };
    } else {
      return {
        tracks: [],
      };
    }
  } catch (err) {
    logger.error(`${__filename}: Error while reading tracks by release id.`);
    throw err;
  }
}

export async function create(metadata: unknown): Promise<Release> {
  const validMeta: ReleaseMetaDBResponse =
    await schemaCreateRelease.validateAsync(metadata);
  const release = new Release(validMeta);

  const pool = await connectDB();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertYearQuery = {
      text: "\
				WITH \
					input_rows (tyear) AS ( \
						VALUES ($1::smallint) \
					), \
					\
					ins AS ( \
						INSERT INTO \
							tyear (tyear) \
						SELECT \
							tyear \
						FROM \
							input_rows \
						ON CONFLICT DO NOTHING \
						RETURNING \
							tyear_id \
					) \
        \
				SELECT \
					tyear_id \
				FROM \
					ins \
        \
        UNION ALL \
        \
				SELECT \
					t.tyear_id \
				FROM \
					input_rows \
				JOIN \
					tyear AS t \
				USING \
					(tyear);",
      values: [release.year],
    };
    const { tyear_id } = (await pool.query(insertYearQuery)).rows[0];

    const insertLabelQuery = {
      text: "\
				WITH \
          input_rows (name) AS ( \
            VALUES ($1) \
          ), \
          \
          ins AS ( \
						INSERT INTO \
							label (name) \
						SELECT \
							name \
						FROM \
							input_rows \
            ON CONFLICT DO NOTHING \
						RETURNING \
							label_id \
          ) \
          \
				SELECT \
					label_id \
				FROM \
					ins \
        \
        UNION ALL \
        \
				SELECT \
					l.label_id \
				FROM \
					input_rows \
				JOIN \
					label AS l \
				USING \
					(name);\
				",
      values: [release.label],
    };
    const { label_id } = (await pool.query(insertLabelQuery)).rows[0];

    const insertReleaseArtist = {
      text: "\
				WITH \
					input_rows (name) AS ( \
						VALUES ($1) \
					), \
					\
					ins AS ( \
						INSERT INTO \
							artist (name) \
						SELECT \
							name \
						FROM \
							input_rows \
						ON CONFLICT DO NOTHING \
						RETURNING \
							artist_id \
					) \
          \
				SELECT \
					artist_id \
				FROM \
					ins \
				\
				UNION ALL \
				\
				SELECT \
					a.artist_id \
				FROM \
					input_rows \
				JOIN \
					artist AS a \
				USING \
					(name);\
				",
      values: [release.artist],
    };
    const { artist_id } = (await pool.query(insertReleaseArtist)).rows[0];

    const insertReleaseQuery = {
      text: "\
				WITH \
          input_rows ( \
						tyear_id, \
						label_id, \
						cat_no, \
						title, \
						cover_path, \
						artist_id\
					) AS ( \
						VALUES (\
							$1::integer, \
							$2::integer, \
							$3, \
							$4, \
							$5, \
							$6::integer\
						) \
          ), \
          \
          ins AS ( \
						INSERT INTO \
							release (\
								tyear_id, \
								label_id, \
								cat_no, \
								title, \
								cover_path, \
								artist_id\
							) \
						SELECT \
							tyear_id, \
							label_id, \
							cat_no, \
							title, \
							cover_path, \
							artist_id \
						FROM \
							input_rows \
            ON CONFLICT DO NOTHING \
						RETURNING \
							release_id \
          ) \
        \
				SELECT \
					release_id \
				FROM \
					ins \
        \
        UNION ALL \
        \
				SELECT \
					r.release_id \
				FROM \
					input_rows \
				JOIN \
					release AS r \
				USING \
					(cat_no);\
				",
      values: [
        tyear_id,
        label_id,
        release.catNo,
        release.title,
        release.coverPath,
        artist_id,
      ],
    };
    const { release_id } = (await pool.query(insertReleaseQuery)).rows[0];

    await client.query("COMMIT");
    release.setId(release_id);
    return release;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error(`${__filename}: ROLLBACK. Can't create release.`);
    throw err;
  } finally {
    client.release();
  }
}

export async function update(metadata: unknown): Promise<Release> {
  const validatedMetadata: ReleaseMetaDBResponse =
    await schemaUpdateRelease.validateAsync(metadata);
  const release = new Release(validatedMetadata);

  const pool = await connectDB();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updateYearQuery = {
      text: "\
				WITH \
          input_rows (tyear) AS ( \
            VALUES ($1::smallint) \
          ), \
          \
          ins AS ( \
						INSERT INTO \
							tyear (tyear) \
						SELECT \
							tyear \
						FROM \
							input_rows \
            ON CONFLICT DO NOTHING \
						RETURNING \
							tyear_id \
          ) \
        \
				SELECT \
					tyear_id \
				FROM \
					ins \
        \
        UNION ALL \
        \
				SELECT \
					t.tyear_id \
				FROM \
					input_rows \
				JOIN \
					tyear AS t \
				USING \
					(tyear);",
      values: [release.year],
    };
    const { tyear_id } = (await pool.query(updateYearQuery)).rows[0];

    const updateLabelQuery = {
      text: "\
				WITH \
          input_rows (name) AS ( \
            VALUES ($1) \
          ), \
          \
          ins AS ( \
						INSERT INTO \
							label (name) \
						SELECT \
							name \
						FROM \
							input_rows \
            ON CONFLICT DO NOTHING \
						RETURNING \
							label_id \
          ) \
          \
				SELECT \
					label_id \
				FROM \
					ins \
        \
        UNION ALL \
        \
				SELECT \
					l.label_id \
				FROM \
					input_rows \
				JOIN \
					label AS l \
				USING \
					(name);",
      values: [release.label],
    };
    const { label_id } = (await pool.query(updateLabelQuery)).rows[0];

    const insertArtistQuery = {
      text: "\
				WITH \
					input_rows (name) AS ( \
						VALUES ($1) \
					), \
            \
					ins AS ( \
						INSERT INTO \
							artist (name) \
						SELECT \
							name \
						FROM \
							input_rows \
						ON CONFLICT DO NOTHING \
						RETURNING \
							artist_id \
					) \
					\
				SELECT \
					artist_id \
				FROM \
					ins \
				\
				UNION ALL \
				\
				SELECT \
					a.artist_id \
				FROM \
					input_rows \
				JOIN \
					artist AS a \
				USING \
					(name);",
      values: [release.artist],
    };
    const { artist_id } = (await pool.query(insertArtistQuery)).rows[0];

    const updateReleaseQuery = {
      text: "\
				UPDATE \
					release \
				SET \
					tyear_id = $1::integer, \
          label_id = $2::integer, \
          artist_id = $3::integer, \
          cat_no = $4, \
          cover_path = $5, \
          title = $6 \
				WHERE \
					release_id = $7::integer;",
      values: [
        tyear_id,
        label_id,
        artist_id,
        release.catNo,
        release.coverPath,
        release.title,
        release.id,
      ],
    };
    await pool.query(updateReleaseQuery);

    //
    // Perform cleanup
    //
    // Delete artist record from artist table if it is not referenced by any
    // records in track_artist linking table or release table
    const deleteUnreferencedArtistsQuery = {
      text: "\
				DELETE FROM \
					artist \
				WHERE \
					artist_id \
				IN ( \
					SELECT \
						artist_id \
					FROM \
						artist \
					WHERE \
						artist_id \
					NOT IN (\
						SELECT \
							artist_id \
						FROM \
							track_artist \
						UNION \
							SELECT \
								artist_id \
							FROM \
								release\
					) \
        )",
    };
    await pool.query(deleteUnreferencedArtistsQuery);

    await client.query("COMMIT");
    return release;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error(
      `${__filename}: ROLLBACK. Error occured while updating release "${release.title}" in database.`,
    );
    throw err;
  } finally {
    client.release();
  }
}

export async function destroy(releaseId: unknown): Promise<number> {
  const validatedReleaseId: number = await schemaId.validateAsync(releaseId);
  const pool = await connectDB();
  const client = await pool.connect();

  try {
    const deleteReleaseQuery = {
      // Delete RELEASE ( + corresponding records in track table and in linking tables track_genre and track_artist cascadingly)
      text: "\
				DELETE FROM \
					release \
				WHERE \
					release_id = $1 \
				RETURNING \
					release_id;",
      values: [validatedReleaseId],
    };

    const deleteYearQuery = {
      // Try to delete YEAR record if it is not referenced by any records in
      // 'release'
      text: "\
				DELETE FROM \
					tyear \
				WHERE \
					tyear_id \
				IN ( \
					SELECT \
						tyear_id \
					FROM \
						tyear \
					WHERE \
						tyear_id \
          NOT IN ( \
						SELECT \
							tyear_id \
						FROM \
							release \
					) \
        )",
    };

    const deleteLabelQuery = {
      // Try to delete LABEL record if it is not referenced by any records in
      // 'release'
      text: "\
				DELETE FROM \
					label \
				WHERE \
					label_id \
				IN ( \
					SELECT \
						label_id \
					FROM \
						label \
					WHERE \
						label_id \
          NOT IN ( \
						SELECT \
							label_id \
						FROM \
							release \
					) \
				)",
    };

    const deleteExtensionQuery = {
      // Try to delete EXTENSION record if it is not referenced by any records
      // in  'track'
      text: "\
				DELETE FROM \
					extension \
				WHERE \
					extension_id \
				IN ( \
					SELECT \
						extension_id \
					FROM \
						extension \
					WHERE \
						extension_id \
          NOT IN ( \
						SELECT \
							extension_id \
						FROM \
							track \
					) \
				);",
    };

    const deleteGenreQuery = {
      // Try to delete GENRE record if it is not referenced by any records in
      // 'track_genre'
      text: "\
				DELETE FROM \
					genre \
				WHERE \
					genre_id \
				IN ( \
					SELECT \
						genre_id \
					FROM \
						genre \
					WHERE \
						genre_id \
          NOT IN ( \
						SELECT \
							genre_id \
						FROM \
							track_genre \
					) \
				)",
    };

    const deleteArtistQuery = {
      // Try to delete ARTIST record if it is not referenced by any records in
      // track_artist
      text: "\
				DELETE FROM \
					artist \
				WHERE \
					artist_id \
				IN ( \
					SELECT \
						artist_id \
					FROM \
						artist \
					WHERE \
						artist.artist_id \
          NOT IN ( \
						SELECT \
							artist_id \
						FROM \
							track_artist \
            UNION \
						SELECT \
							artist_id \
						FROM \
							release \
          ) \
        );",
    };

    await client.query("BEGIN");
    const deletedReleaseId: ReleaseId = (await client.query(deleteReleaseQuery))
      .rows[0];
    await client.query(deleteYearQuery);
    await client.query(deleteLabelQuery);
    await client.query(deleteExtensionQuery);
    await client.query(deleteGenreQuery);
    await client.query(deleteArtistQuery);
    await client.query("COMMIT");
    return deletedReleaseId;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error(
      `${__filename}: ROLLBACK. Can't delete track. Track doesn't exist or an error occured during deletion.`,
    );
    throw err;
  } finally {
    client.release();
  }
}
