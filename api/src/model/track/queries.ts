import util from "util";
import Joi from "joi";

import { logger } from "../../config/loggerConf";
import { Track } from "./Track";
import { connectDB } from "../postgres";
import { TrackMetadata, UpdateTrackMetadata } from "../../types";

type ReturnTrack = Promise<Track>;
type ReturnTracks = Promise<{ tracks: Track[] }>;

const SUPPORTED_CODEC = (process.env.SUPPORTED_CODEC as string).split(",");

const schemaCreate = Joi.object({
  filePath: Joi.string().min(1).max(255).allow(null),
  extension: Joi.string().valid(...SUPPORTED_CODEC),
  trackArtist: Joi.array().items(Joi.string().min(0).max(200)),
  releaseArtist: Joi.string(),
  duration: Joi.number().min(0.1),
  bitrate: Joi.number().min(1).allow(null),
  year: Joi.number().integer().min(1).max(9999).required(),
  trackNo: Joi.number().allow(null),
  trackTitle: Joi.string().min(0).max(200),
  releaseTitle: Joi.string().min(0).max(200),
  diskNo: Joi.number().allow(null),
  label: Joi.string().min(0).max(200),
  genre: Joi.array().items(Joi.string()),
  coverPath: Joi.string(),
  catNo: Joi.allow(null),
});

export async function create(metadata: TrackMetadata): Promise<Track> {
  const validatedMetadata = await schemaCreate.validateAsync(metadata);
  const track = new Track(validatedMetadata);
  console.log(track.releaseArtist);
  const pool = await connectDB();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertYearQuery = {
      text:
        "WITH \
        input_rows (tyear) AS ( \
          VALUES ($1::smallint) \
        ), \
        \
        ins AS ( \
          INSERT INTO tyear (tyear) \
          SELECT tyear \
          FROM input_rows \
          ON CONFLICT DO NOTHING \
          RETURNING tyear_id \
        ) \
        \
        SELECT tyear_id FROM ins \
        \
        UNION ALL \
        \
        SELECT t.tyear_id \
        FROM input_rows \
        JOIN tyear AS t \
        USING (tyear);",
      values: [track.year],
    };
    const { tyear_id } = (await client.query(insertYearQuery)).rows[0];

    const insertExtensionQuery = {
      text:
        "WITH \
          input_rows (name) AS ( \
            VALUES ($1) \
          ), \
          \
          ins AS ( \
            INSERT INTO extension (name) \
            SELECT name \
            FROM input_rows \
            ON CONFLICT DO NOTHING \
            RETURNING extension_id \
          ) \
        \
        SELECT extension_id \
        FROM ins \
        \
        UNION ALL \
        \
        SELECT e.extension_id \
        FROM input_rows \
        JOIN extension AS e \
        USING (name);",
      values: [track.extension],
    };
    const { extension_id } = (await client.query(insertExtensionQuery)).rows[0];

    const insertLabelQuery = {
      text:
        "WITH \
          input_rows (name) AS ( \
            VALUES ($1) \
          ), \
          \
          ins AS ( \
            INSERT INTO label (name) \
            SELECT name \
            FROM input_rows \
            ON CONFLICT DO NOTHING \
            RETURNING label_id \
          ) \
          \
        SELECT label_id \
        FROM ins \
        \
        UNION ALL \
        \
        SELECT l.label_id \
        FROM input_rows \
        JOIN label AS l \
        USING (name);",
      values: [track.label],
    };
    const { label_id } = (await client.query(insertLabelQuery)).rows[0];

    const insertReleaseArtist = {
      text:
        "WITH \
            input_rows (name) AS ( \
              VALUES ($1) \
            ), \
            \
            ins AS ( \
              INSERT INTO artist (name) \
              SELECT name \
              FROM input_rows \
              ON CONFLICT DO NOTHING \
              RETURNING artist_id \
            ) \
          \
          SELECT artist_id \
          FROM ins \
          \
          UNION ALL \
          \
          SELECT a.artist_id \
          FROM input_rows \
          JOIN artist AS a \
          USING (name);",
      values: [track.releaseArtist],
    };
    const { artist_id: releaseArtistId } = (
      await client.query(insertReleaseArtist)
    ).rows[0];

    const insertReleaseQuery = {
      text:
        "WITH \
          input_rows (tyear_id, label_id, cat_no, title, cover_path, artist_id) AS ( \
            VALUES ($1::integer, $2::integer, $3, $4, $5, $6::integer) \
          ), \
          \
          ins AS ( \
            INSERT INTO release (tyear_id, label_id, cat_no, title, cover_path, artist_id) \
            SELECT tyear_id, label_id, cat_no, title, cover_path, artist_id \
            FROM input_rows \
            ON CONFLICT DO NOTHING \
            RETURNING release_id \
          ) \
        \
        SELECT release_id \
        FROM ins \
        \
        UNION ALL \
        \
        SELECT r.release_id \
        FROM input_rows \
        JOIN release AS r \
        USING (cat_no);",
      values: [
        tyear_id,
        label_id,
        track.catNo,
        track.releaseTitle,
        track.coverPath,
        releaseArtistId,
      ],
    };
    const { release_id } = (await client.query(insertReleaseQuery)).rows[0];

    const insertTrackQuery = {
      text:
        "INSERT INTO track ( \
          extension_id, \
          release_id, \
          disk_no, \
          track_no, \
          title, \
          bitrate, \
          duration, \
          file_path \
        ) \
        VALUES (\
          $1::integer, \
          $2::integer, \
          $3::smallint, \
          $4::smallint, \
          $5, \
          $6::numeric, \
          $7::numeric, \
          $8 \
        ) \
        RETURNING track_id",
      values: [
        extension_id,
        release_id,
        track.diskNo,
        track.trackNo,
        track.trackTitle,
        track.bitrate,
        track.duration,
        track.filePath,
      ],
    };
    const { track_id } = (await client.query(insertTrackQuery)).rows[0];

    for (const genre of track.genre) {
      const insertGenreQuery = {
        text:
          "WITH \
            input_rows (name) AS ( \
              VALUES ($1) \
            ), \
            \
            ins AS ( \
              INSERT INTO genre (name) \
              SELECT name \
              FROM input_rows \
              ON CONFLICT DO NOTHING \
              RETURNING genre_id \
            ) \
          \
          SELECT genre_id \
          FROM ins \
          \
          UNION ALL \
          \
          SELECT g.genre_id FROM input_rows \
          JOIN genre AS g \
          USING (name);",
        values: [genre],
      };
      const { genre_id } = (await client.query(insertGenreQuery)).rows[0];

      const inserTrackGenreQuery = {
        text:
          "INSERT INTO track_genre (track_id, genre_id) \
                VALUES ($1::integer, $2::integer) \
           ON CONFLICT DO NOTHING",
        values: [track_id, genre_id],
      };
      await client.query(inserTrackGenreQuery);
    }

    for (const trackArtist of track.trackArtist) {
      const insertArtistQuery = {
        text:
          "WITH \
          input_rows (name) AS ( \
            VALUES ($1) \
          ), \
          \
          ins AS ( \
            INSERT INTO artist (name) \
            SELECT name \
            FROM input_rows \
            ON CONFLICT DO NOTHING \
            RETURNING artist_id \
          ) \
          \
          SELECT artist_id \
          FROM ins \
          \
          UNION ALL \
          \
          SELECT a.artist_id FROM input_rows \
          JOIN artist AS a \
          USING (name);",
        values: [trackArtist],
      };
      const { artist_id } = (await client.query(insertArtistQuery)).rows[0];

      const inserTrackArtistQuery = {
        text:
          "INSERT INTO track_artist (track_id, artist_id) \
                VALUES ($1::integer, $2::integer) \
           ON CONFLICT DO NOTHING",
        values: [track_id, artist_id],
      };
      await client.query(inserTrackArtistQuery);
    }

    await client.query("COMMIT");
    track.setTrackId(track_id);
    return track;
  } catch (err) {
    await client.query("ROLLBACK");

    const text = `filePath: ${__filename}: Rollback.\nError occured while adding track "${track.filePath}" to database.\n${err.stack}`;
    logger.error(text);
    throw err;
  } finally {
    client.release();
  }
}

const schemaUpdate = Joi.object({
  trackId: Joi.number().required(),

  filePath: Joi.string().min(1).max(255).allow(null),
  extension: Joi.string().valid(...SUPPORTED_CODEC),
  trackArtist: Joi.array().items(Joi.string().min(0).max(200)),
  duration: Joi.number().min(0.1),
  bitrate: Joi.number().min(1).allow(null),
  trackNo: Joi.number().allow(null),
  trackTitle: Joi.string().min(0).max(200),
  diskNo: Joi.number().allow(null),
  genre: Joi.array().items(Joi.string()),
});

export async function update(newMetadata: UpdateTrackMetadata): ReturnTrack {
  const validatedMetadata = await schemaUpdate.validateAsync(newMetadata);
  const track = new Track(validatedMetadata);

  const pool = await connectDB();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updateExtensionQuery = {
      text:
        "WITH \
        input_rows (name) AS ( \
          VALUES ($1) \
        ), \
        \
        ins AS ( \
          INSERT INTO extension (name) \
          SELECT name \
          FROM input_rows \
          ON CONFLICT DO NOTHING \
          RETURNING extension_id \
        ) \
        \
        SELECT extension_id FROM ins \
        \
        UNION ALL \
        \
        SELECT e.extension_id \
        FROM input_rows \
        JOIN extension AS e \
        USING (name);",
      values: [track.extension],
    };
    const { extension_id } = (await client.query(updateExtensionQuery)).rows[0];

    const updateTrackQuery = {
      text:
        "UPDATE track \
        SET \
            extension_id = $1::integer, \
            disk_no = $2::smallint, \
            track_no = $3::smallint, \
            title = $4, \
            bitrate = $5::numeric, \
            duration = $6::numeric, \
            file_path = $7 \
        WHERE track_id = $8 RETURNING *;",
      values: [
        extension_id,
        track.diskNo,
        track.trackNo,
        track.trackTitle,
        track.bitrate,
        track.duration,
        track.filePath,
        track.getTrackId(),
      ],
    };
    const { track_id } = (await client.query(updateTrackQuery)).rows[0];

    //
    // Update Genre(s)
    //

    // Delete records (referencing the track) from linking table "track_genre"
    const deleteGenresFromLinkingTableQuery = {
      text: "DELETE FROM track_genre WHERE track_id = $1;",
      values: [track.getTrackId()],
    };
    await client.query(deleteGenresFromLinkingTableQuery);
    // Insert new genres
    for (const genre of track.genre) {
      const insertGenreQuery = {
        text:
          "WITH \
          input_rows (name) AS ( \
            VALUES ($1) \
          ), \
          \
          ins AS ( \
            INSERT INTO genre (name) \
            SELECT name \
            FROM input_rows \
            ON CONFLICT DO NOTHING \
            RETURNING genre_id \
          ) \
          \
          SELECT genre_id \
          FROM ins \
          \
          UNION ALL \
          \
          SELECT g.genre_id FROM input_rows \
          JOIN genre AS g \
          USING (name);",
        values: [genre],
      };
      const { genre_id } = (await client.query(insertGenreQuery)).rows[0];

      const inserTrackGenreQuery = {
        text:
          "INSERT INTO \
            track_genre (track_id, genre_id) \
           VALUES ($1::integer, $2::integer) \
           ON CONFLICT DO NOTHING",
        values: [track_id, genre_id],
      };
      await client.query(inserTrackGenreQuery);
    }
    // Perform cleanup: delete GEBRE record if it is not referenced by any records in track_artist linking table
    const deleteUnreferencedGenresQuery = {
      text:
        "DELETE FROM genre \
         WHERE genre_id IN ( \
           SELECT genre_id \
           FROM genre \
           WHERE genre_id \
           NOT IN (SELECT genre_id FROM track_genre) \
         )",
    };
    await client.query(deleteUnreferencedGenresQuery);

    //
    // Update Artist(s)
    //

    // Delete records (referencing the track) from linking table "track_artist"
    const deleteArtistsFromLinkingTableQuery = {
      text: "DELETE FROM track_artist WHERE track_id = $1;",
      values: [track.getTrackId()],
    };
    await client.query(deleteArtistsFromLinkingTableQuery);
    // Insert new artists
    for (const artist of track.trackArtist) {
      const insertArtistQuery = {
        text:
          "WITH \
          input_rows (name) AS ( \
            VALUES ($1) \
          ), \
          \
          ins AS ( \
            INSERT INTO artist (name) \
            SELECT name \
            FROM input_rows \
            ON CONFLICT DO NOTHING \
            RETURNING artist_id \
          ) \
          \
          SELECT artist_id \
          FROM ins \
          \
          UNION ALL \
          \
          SELECT a.artist_id FROM input_rows \
          JOIN artist AS a \
          USING (name);",
        values: [artist],
      };
      const { artist_id } = (await client.query(insertArtistQuery)).rows[0];

      const inserTrackArtistQuery = {
        text:
          "INSERT INTO track_artist (track_id, artist_id) \
             VALUES ($1::integer, $2::integer) \
           ON CONFLICT DO NOTHING",
        values: [track_id, artist_id],
      };
      await client.query(inserTrackArtistQuery);
    }
    // Perform cleanup: delete ARTIST record if it is not referenced by any records in track_artist linking table
    const deleteUnreferencedArtistsQuery = {
      text:
        "DELETE FROM artist \
         WHERE artist_id IN ( \
           SELECT artist_id \
           FROM artist \
           WHERE artist_id \
           NOT IN \
            (SELECT artist_id \
            FROM track_artist \
            UNION \
            SELECT artist_id \
            FROM release) \
         )",
    };
    await client.query(deleteUnreferencedArtistsQuery);

    await client.query("COMMIT");
    track.setTrackId(track_id);
    return track;
  } catch (err) {
    await client.query("ROLLBACK");

    const text = `${__filename}: ROLLBACK.\nError occured while updating track "${track.filePath}" in database.\n${err.stack}`;
    logger.error(text);
    throw err;
  } finally {
    client.release();
  }
}

export async function read(id: number): Promise<Track | null> {
  const pool = await connectDB();

  try {
    const getTrackTextQuery = {
      text: 'SELECT * FROM view_track WHERE "trackId"=$1',
      values: [id],
    };
    const trackMetadata = (await pool.query(getTrackTextQuery)).rows[0];

    if (!trackMetadata) return null;
    const track = new Track(trackMetadata);
    logger.debug(`filePath: ${__filename} \n${util.inspect(track)}`);
    return track;
  } catch (err) {
    const text = `${__filename}: Error while reading a track.\n${err.stack}`;
    logger.error(text);
    throw err;
  }
}

export async function readAll(): ReturnTracks {
  const pool = await connectDB();

  try {
    const getAllTracksTextQuery = { text: "SELECT * FROM view_track" };
    const { rows } = await pool.query(getAllTracksTextQuery);
    logger.debug(rows);
    const tracks = rows.map((row) => new Track(row));
    return { tracks };
  } catch (err) {
    const str = `${__filename}: Error while reading all tracks (without pagination).\n${err.stack}`;
    logger.error(str);
    throw err;
  }
}

export async function readAllByPages(
  page: number = 1,
  itemsPerPage: number = 10,
): ReturnTracks {
  const pool = await connectDB();

  try {
    const retrieveAllTracksTextQuery = {
      text:
        "SELECT * \
         FROM view_track \
         LIMIT $2::integer \
         OFFSET ($1::integer - 1) * $2::integer",
      values: [page, itemsPerPage],
    };

    const { rows } = await pool.query(retrieveAllTracksTextQuery);
    const tracks = rows.map((row) => new Track(row));
    logger.debug(rows);
    return { tracks };
  } catch (err) {
    const text = `filePath: ${__filename}: Error while retrieving all tracks with pagination.\n${err.stack}`;
    logger.error(text);
    throw err;
  }
}

export async function destroy(trackId: number): Promise<number> {
  const pool = await connectDB();
  const client = await pool.connect();

  try {
    const deleteTrackQuery = {
      // Delete TRACK ( + corresponding records in track_genre and track_artist cascadingly)
      text:
        "DELETE FROM track \
         WHERE track_id = $1 \
         RETURNING track_id",
      values: [trackId],
    };

    // Try to delete the RELEASE if no other tracks reference it
    const deleteReleaseQuery = {
      text:
        "DELETE FROM release \
         WHERE release_id IN ( \
           SELECT release_id \
           FROM release \
           WHERE release_id \
           NOT IN ( \
             SELECT release_id \
             FROM track \
           ) \
        )",
    };

    const deleteYearQuery = {
      // Try to delete YEAR record if it is not referenced by any records in
      // 'release'
      text:
        "DELETE FROM tyear \
         WHERE tyear_id IN ( \
           SELECT tyear_id \
           FROM tyear \
           WHERE tyear_id \
           NOT IN ( \
             SELECT tyear_id \
             FROM release \
           ) \
        )",
    };

    const deleteLabelQuery = {
      // Try to delete LABEL record if it is not referenced by any records in
      // 'release'
      text:
        "DELETE FROM label \
         WHERE label_id IN ( \
           SELECT label_id \
           FROM label \
           WHERE label_id \
           NOT IN ( \
             SELECT label_id \
             FROM release \
           ) \
         )",
    };

    const deleteExtensionQuery = {
      // Try to delete EXTENSION record if it is not referenced by any records
      // in  'track'
      text:
        "DELETE FROM extension \
         WHERE extension_id IN ( \
           SELECT extension_id \
           FROM extension \
           WHERE extension_id \
           NOT IN ( \
             SELECT extension_id \
             FROM track \
           ) \
         )",
    };

    const deleteGenreQuery = {
      // Try to delete GENRE record if it is not referenced by any records in
      // 'track_genre'
      text:
        "DELETE FROM genre \
         WHERE genre_id IN ( \
           SELECT genre_id \
           FROM genre \
           WHERE genre_id \
           NOT IN ( \
             SELECT genre_id \
             FROM track_genre \
           ) \
         )",
    };

    const deleteArtistQuery = {
      // Try to delete ARTIST record if it is not referenced by any records in
      // track_artist
      text:
        "DELETE FROM artist \
         WHERE artist_id IN ( \
          SELECT artist_id \
          FROM artist \
          WHERE artist.artist_id \
          NOT IN ( \
            SELECT artist_id \
            FROM track_artist \
            UNION \
            SELECT artist_id \
            FROM release \
          ) \
        );",
    };

    await client.query("BEGIN");
    const deletedTrackId = (await client.query(deleteTrackQuery)).rows[0];
    await client.query(deleteReleaseQuery);
    await client.query(deleteYearQuery);
    await client.query(deleteLabelQuery);
    await client.query(deleteExtensionQuery);
    await client.query(deleteGenreQuery);
    await client.query(deleteArtistQuery);
    await client.query("COMMIT");
    return deletedTrackId;
  } catch (err) {
    await client.query("ROLLBACK");
    const text = `filePath: ${__filename}: Rollback. Can't delete track. Track doesn't exist or an error occured during deletion\n${err.stack}`;
    logger.error(text);
    throw err;
  } finally {
    client.release();
  }
}